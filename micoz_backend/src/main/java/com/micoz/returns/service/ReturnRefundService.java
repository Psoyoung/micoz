package com.micoz.returns.service;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.order.entity.Order;
import com.micoz.order.entity.OrderItem;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.order.repository.OrderRepository;
import com.micoz.returns.calculator.RefundInput;
import com.micoz.returns.calculator.RefundResult;
import com.micoz.returns.calculator.ReturnRefundCalculator;
import com.micoz.returns.entity.Return;
import com.micoz.returns.entity.ReturnItem;
import com.micoz.returns.entity.ReturnStatus;
import com.micoz.returns.repository.ReturnItemRepository;
import com.micoz.returns.repository.ReturnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 반품 환불 확정 (R-T3, RD2). CANCEL/RETURN 완료 시 §5.3 산정식으로 refund_amount를 확정하고 COMPLETED로 전이한다.
 * EXCHANGE는 이 경로를 타지 않는다(R-Q3 — 호출자가 제외). 실제 PG 환불·payment·재고는 R-T4가 오케스트레이션.
 *
 * <p><b>prior(이전) 반품</b>은 같은 주문의 <b>COMPLETED 반품만</b> 센다(반려분 제외 — 이중계산 방지).
 * 이번 반품은 자기 자신을 prior에서 제외한다.
 */
@Service
@RequiredArgsConstructor
public class ReturnRefundService {

    private static final Set<String> SELLER_FAULT = Set.of("DEFECT", "WRONG_DELIVERY");

    /**
     * 반품 회수 배송비(변심계열 고객 부담) — <b>출고 배송비({@code mst_shipping.shipping_fee})와 분리된 독립 상수</b>.
     * 출고비에 묶으면 관리자가 출고비를 바꿀 때 회수비가 의도치 않게 따라 바뀌므로 결합하지 않는다(R-Q4).
     * 🧱 빚: 회수비 설정화(관리자 조정)는 필요 시 {@code mst_shipping.return_shipping_fee} 컬럼으로 승격(RD2-a).
     */
    private static final BigDecimal RETURN_SHIPPING_FEE = new BigDecimal("3000");

    private final ReturnRepository returnRepository;
    private final ReturnItemRepository returnItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReturnRefundCalculator calculator;

    /**
     * 환불 확정 + COMPLETED 전이. INSPECTED에서만 완료 가능(전이 가드). refund_amount 반환.
     * (CANCEL/RETURN 전용 — EXCHANGE는 호출자가 이 메서드를 부르지 않는다.)
     */
    @Transactional
    public BigDecimal finalizeRefund(Long returnSeq) {
        Return ret = returnRepository.findById(returnSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.RETURN_NOT_FOUND));
        // 주문 행 비관적 잠금 — 같은 주문의 동시 완료를 직렬화(아래 prior 이중계상 차단, 빚 #2).
        // prior 조회 전에 잠가야 두 완료 트랜잭션이 서로의 COMPLETED를 반영해 순차 계산한다. 트랜잭션 종료 시 해제.
        Order order = orderRepository.findByOrderSeqForUpdate(ret.getOrderSeq())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        // 주문 상품 스냅샷(itemSeq → unitPrice/itemAmount) + itemsTotal
        List<OrderItem> orderItems = orderItemRepository.findAllByOrderSeq(order.getOrderSeq());
        Map<Long, OrderItem> oiBySeq = orderItems.stream()
                .collect(Collectors.toMap(OrderItem::getItemSeq, oi -> oi));
        BigDecimal itemsTotal = orderItems.stream()
                .map(OrderItem::getItemAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal thisGross = grossOf(returnItemRepository.findAllByReturnSeq(returnSeq), oiBySeq);

        // prior = 같은 주문의 '완료(COMPLETED)' 반품만(이번 제외, 반려 제외)
        BigDecimal priorGross = returnRepository.findAllByOrderSeq(order.getOrderSeq()).stream()
                .filter(r -> !r.getReturnSeq().equals(returnSeq))
                .filter(r -> ReturnStatus.COMPLETED.name().equals(r.getReturnStatus()))
                .map(r -> grossOf(returnItemRepository.findAllByReturnSeq(r.getReturnSeq()), oiBySeq))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean sellerFault = SELLER_FAULT.contains(ret.getReturnReasonType());
        // 원배송비 환불: CANCEL(미출고라 배송비 반환) 또는 판매자귀책. 회수 배송비: 변심계열 RETURN만 고객 부담.
        boolean refundOriginalShipping = "CANCEL".equals(ret.getReturnType()) || sellerFault;
        BigDecimal returnShippingFee = resolveReturnShippingFee(ret, sellerFault);

        RefundResult result = calculator.calculate(new RefundInput(
                itemsTotal, order.getTotalDiscount(), order.getShippingFee(),
                priorGross, thisGross, refundOriginalShipping, returnShippingFee));

        ret.applyRefund(result.refundAmount(), result.returnShippingFee());
        ret.markCompleted(OffsetDateTime.now()); // INSPECTED→COMPLETED (전이 가드 통과 필요)
        return result.refundAmount();
    }

    private BigDecimal grossOf(List<ReturnItem> items, Map<Long, OrderItem> oiBySeq) {
        BigDecimal sum = BigDecimal.ZERO;
        for (ReturnItem ri : items) {
            if (!"Y".equals(ri.getUseYn())) continue;
            OrderItem oi = oiBySeq.get(ri.getItemSeq());
            if (oi == null) continue;
            sum = sum.add(oi.getUnitPrice().multiply(BigDecimal.valueOf(ri.getQuantity())));
        }
        return sum;
    }

    /**
     * 회수 배송비(고객 부담). RETURN + 변심계열(비-판매자귀책)일 때만 {@link #RETURN_SHIPPING_FEE}(독립 상수) 부과.
     * CANCEL(미출고)·판매자귀책은 0. 출고 배송비와 결합하지 않는다(R-Q4).
     */
    private BigDecimal resolveReturnShippingFee(Return ret, boolean sellerFault) {
        if (!"RETURN".equals(ret.getReturnType()) || sellerFault) {
            return BigDecimal.ZERO;
        }
        return RETURN_SHIPPING_FEE;
    }
}
