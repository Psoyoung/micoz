package com.micoz.admin.order.service;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.order.entity.Order;
import com.micoz.order.entity.OrderShipping;
import com.micoz.order.entity.OrderStatus;
import com.micoz.order.entity.ShippingStatus;
import com.micoz.order.repository.OrderRepository;
import com.micoz.order.repository.OrderShippingRepository;
import com.micoz.order.service.OrderStockRestorer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * 주문 상태 전이 (O-T2, FR-ADM-05). order_status 단독 전이 액션(준비 시작 / 관리자 취소).
 * 전이 허용 규칙은 {@link OrderStatus} 전이표가 소유하고, 강제는 {@link Order#changeStatus}가
 * 단일 지점에서 수행한다(위반 시 ORDER_TRANSITION_INVALID). 2컬럼 동기화(출고/배송)는 O-T3에서 추가.
 */
@Service
@RequiredArgsConstructor
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderShippingRepository orderShippingRepository;
    private final OrderStockRestorer orderStockRestorer;

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
        orderStockRestorer.restore(order.getOrderSeq(), item -> true); // 전량 복원(O 취소 동작 보존). 재판매 필터는 R-T4 실사용.
    }

    /**
     * 출고 (O-T3, 2컬럼 원자 동기화): PREPARING→SHIPPING(order) + READY→SHIPPED(shipping) + 운송장·출고일시.
     * §5.3: 전제(운송장은 @Valid로 컨트롤러에서 선검증) → 두 컬럼 전이 <b>사전 검증</b>(둘 다 유효할 때만) →
     * 원자 적용. 한 컬럼이라도 비허용이면 어느 것도 이동하지 않고 ORDER_TRANSITION_INVALID(부분 전이 금지).
     */
    @Transactional
    public void ship(Long orderSeq, String trackingNo) {
        Order order = load(orderSeq);
        OrderShipping shipping = loadShipping(orderSeq);
        requireOrderTransition(order, OrderStatus.SHIPPING);
        requireShippingTransition(shipping, ShippingStatus.SHIPPED);
        order.changeStatus(OrderStatus.SHIPPING);
        shipping.ship(trackingNo, OffsetDateTime.now());
    }

    /** 배송중 전환 (O-T3): SHIPPED→IN_TRANSIT (shipping_status 단독 — order_status 불변). */
    @Transactional
    public void markInTransit(Long orderSeq) {
        load(orderSeq); // 주문 존재 확인(부재 시 ORDER_NOT_FOUND)
        OrderShipping shipping = loadShipping(orderSeq);
        shipping.markInTransit();
    }

    /**
     * 배송완료 (O-T3, 2컬럼 원자 동기화): SHIPPING→DELIVERED(order) + {SHIPPED|IN_TRANSIT}→DELIVERED(shipping)
     * + 완료일시. ship과 동일하게 두 컬럼 사전 검증 후 원자 적용(부분 전이 금지).
     */
    @Transactional
    public void deliver(Long orderSeq) {
        Order order = load(orderSeq);
        OrderShipping shipping = loadShipping(orderSeq);
        requireOrderTransition(order, OrderStatus.DELIVERED);
        requireShippingTransition(shipping, ShippingStatus.DELIVERED);
        order.changeStatus(OrderStatus.DELIVERED);
        shipping.markDelivered(OffsetDateTime.now());
    }

    /**
     * 두 컬럼 전이의 <b>사전 검증</b>(순수 판정, 상태 미변경). 둘 다 통과해야 이후 적용 단계로 진행하므로
     * "한 컬럼만 이동하고 다른 컬럼 실패로 남는" 부분 전이가 원천 차단된다(§5.3). 엔티티 전이 가드는
     * 적용 단계에서 다시 검증하나(단일 choke point 유지), 여기서 걸러지면 어느 컬럼도 변경되지 않는다.
     */
    private void requireOrderTransition(Order order, OrderStatus target) {
        if (!OrderStatus.from(order.getOrderStatus()).canTransitionTo(target)) {
            throw new BusinessException(ErrorCode.ORDER_TRANSITION_INVALID);
        }
    }

    private void requireShippingTransition(OrderShipping shipping, ShippingStatus target) {
        if (!ShippingStatus.from(shipping.getShippingStatus()).canTransitionTo(target)) {
            throw new BusinessException(ErrorCode.ORDER_TRANSITION_INVALID);
        }
    }

    private OrderShipping loadShipping(Long orderSeq) {
        return orderShippingRepository.findByOrderSeq(orderSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
    }

    private Order load(Long orderSeq) {
        return orderRepository.findById(orderSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
    }
}
