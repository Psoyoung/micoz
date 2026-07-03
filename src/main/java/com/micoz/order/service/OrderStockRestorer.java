package com.micoz.order.service;

import com.micoz.order.entity.OrderItem;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.product.entity.ProductOption;
import com.micoz.product.repository.ProductOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * 주문 옵션 재고 복원 — O(관리자 취소, O-T2)·R(반품, R-T4)이 공유하는 <b>중립 도메인 컴포넌트</b>.
 * order 도메인({@code com.micoz.order.service})에 위치해 admin·returns 어느 쪽에도 의존하지 않는다
 * (양쪽이 이것을 의존 — 의존 방향 역전 없음). 결제 완료 시 재고 차감({@code ProductOption.decreaseStock},
 * PaymentService)의 대칭({@code increaseStock}).
 *
 * <p>🧱 빚: 재고 차감(결제)·복원(취소/반품)이 여러 서비스에 분산 — 재고 도메인 응집은 향후 과제(RD2-c 인접).
 */
@Service
@RequiredArgsConstructor
public class OrderStockRestorer {

    private final OrderItemRepository orderItemRepository;
    private final ProductOptionRepository productOptionRepository;

    /**
     * 주문 아이템의 옵션 재고를 복원한다(재판매 가능 아이템에 한해 각 아이템의 <b>주문 수량</b>만큼 increaseStock).
     * O 취소는 전량 복원({@code item -> true} 전달 — 기존 동작 보존).
     *
     * @param resalable 재판매 가능 판정 필터. R-T4에서 DEFECT 제외/재입고 오버라이드에 사용하도록 파라미터로 개통.
     *                  (R 반품의 부분 수량 복원은 R-T4에서 수량 기반 진입을 추가로 확장 예정 — 본 메서드는 O 전량 복원 보존.)
     */
    @Transactional
    public void restore(Long orderSeq, Predicate<OrderItem> resalable) {
        List<OrderItem> items = orderItemRepository.findAllByOrderSeq(orderSeq);
        List<Long> optionSeqs = items.stream()
                .filter(resalable)
                .map(OrderItem::getOptionSeq).filter(Objects::nonNull).distinct().toList();
        if (optionSeqs.isEmpty()) return;
        Map<Long, ProductOption> byId = productOptionRepository.findAllById(optionSeqs).stream()
                .collect(Collectors.toMap(ProductOption::getOptionSeq, o -> o));
        for (OrderItem item : items) {
            if (!resalable.test(item)) continue;
            if (item.getOptionSeq() == null) continue;
            ProductOption option = byId.get(item.getOptionSeq());
            if (option != null) option.increaseStock(item.getQuantity());
        }
    }
}
