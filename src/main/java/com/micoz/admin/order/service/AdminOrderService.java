package com.micoz.admin.order.service;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.order.entity.Order;
import com.micoz.order.entity.OrderItem;
import com.micoz.order.entity.OrderStatus;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.order.repository.OrderRepository;
import com.micoz.product.entity.ProductOption;
import com.micoz.product.repository.ProductOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 주문 상태 전이 (O-T2, FR-ADM-05). order_status 단독 전이 액션(준비 시작 / 관리자 취소).
 * 전이 허용 규칙은 {@link OrderStatus} 전이표가 소유하고, 강제는 {@link Order#changeStatus}가
 * 단일 지점에서 수행한다(위반 시 ORDER_TRANSITION_INVALID). 2컬럼 동기화(출고/배송)는 O-T3에서 추가.
 */
@Service
@RequiredArgsConstructor
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductOptionRepository productOptionRepository;

    /** 준비 시작: PAID → PREPARING. */
    @Transactional
    public void prepare(Long orderSeq) {
        Order order = load(orderSeq);
        order.changeStatus(OrderStatus.PREPARING);
    }

    /**
     * 관리자 취소: {PAID|PREPARING} → CANCELED + 재고 즉시 복원(O-Q1(a)).
     * payment_status는 건드리지 않는다(O-Q1(b)) — 실제 PG 환불·payment 정합은 R 소유.
     * "order=CANCELED / payment=PAID"는 의도된 중간 상태.
     */
    @Transactional
    public void cancel(Long orderSeq) {
        Order order = load(orderSeq);
        order.changeStatus(OrderStatus.CANCELED); // 전이 검증이 재고 복원보다 먼저 — 이미 CANCELED면 여기서 차단(이중복원 방지)
        restoreStock(order.getOrderSeq());
    }

    /**
     * 결제(PAID) 시 차감된 옵션 재고를 되돌린다. {@code PaymentService.decreaseStock}(결제 완료 차감)의 대칭.
     * PAID/PREPARING 주문만 이 경로에 도달하므로(전이표) 항상 "차감된 재고를 복원"하는 대칭이 성립한다.
     * <p>🧱 빚: 재고 차감(결제)·복원(취소)이 두 서비스로 분산됨 — 재고 도메인 응집은 향후 과제.
     */
    private void restoreStock(Long orderSeq) {
        List<OrderItem> items = orderItemRepository.findAllByOrderSeq(orderSeq);
        List<Long> optionSeqs = items.stream()
                .map(OrderItem::getOptionSeq).filter(Objects::nonNull).distinct().toList();
        if (optionSeqs.isEmpty()) return;
        Map<Long, ProductOption> byId = productOptionRepository.findAllById(optionSeqs).stream()
                .collect(Collectors.toMap(ProductOption::getOptionSeq, o -> o));
        for (OrderItem item : items) {
            if (item.getOptionSeq() == null) continue;
            ProductOption option = byId.get(item.getOptionSeq());
            if (option != null) option.increaseStock(item.getQuantity());
        }
    }

    private Order load(Long orderSeq) {
        return orderRepository.findById(orderSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
    }
}
