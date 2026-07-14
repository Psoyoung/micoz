package com.micoz.admin.returns.service;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.order.entity.Order;
import com.micoz.order.entity.OrderItem;
import com.micoz.order.entity.OrderStatus;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.order.repository.OrderPaymentRepository;
import com.micoz.order.repository.OrderRepository;
import com.micoz.order.service.OrderStockRestorer;
import com.micoz.order.service.OrderStockRestorer.StockRestoreUnit;
import com.micoz.payment.gateway.PaymentGateway;
import com.micoz.returns.entity.Return;
import com.micoz.returns.entity.ReturnItem;
import com.micoz.returns.entity.ReturnStatus;
import com.micoz.returns.repository.ReturnItemRepository;
import com.micoz.returns.repository.ReturnRepository;
import com.micoz.returns.service.ReturnRefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 반품 처리 워크플로우 (R-T4, FR-ADM-06). 승인/회수/검수/반려는 {@link Return#changeStatus} 전이,
 * 완료(RA7)는 <b>CANCEL/RETURN만</b> 환불확정·payment·order 종결·재고 복원을 원자 트리거한다.
 * <b>EXCHANGE 완료는 상태 전이만</b>(환불·payment·재고 오케스트레이션 미탑승, R-Q3 — "교환인데 환불" 사고 차단).
 */
@Service
@RequiredArgsConstructor
public class AdminReturnService {

    private final ReturnRepository returnRepository;
    private final ReturnItemRepository returnItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final PaymentGateway paymentGateway;
    private final OrderStockRestorer orderStockRestorer;
    private final ReturnRefundService returnRefundService;

    /** 승인: REQUESTED → APPROVED. */
    @Transactional
    public void approve(Long returnSeq) {
        load(returnSeq).changeStatus(ReturnStatus.APPROVED);
    }

    /** 반려: {REQUESTED|APPROVED|INSPECTED} → REJECTED. 부수효과 없음(환불·재고·order 종결 0). */
    @Transactional
    public void reject(Long returnSeq) {
        load(returnSeq).changeStatus(ReturnStatus.REJECTED);
    }

    /** 회수: APPROVED → COLLECTED. */
    @Transactional
    public void collect(Long returnSeq) {
        load(returnSeq).changeStatus(ReturnStatus.COLLECTED);
    }

    /**
     * 검수: COLLECTED → INSPECTED + 재입고 판정 기록(R-Q1). 미지정 시 기본 DEFECT=N·그 외=Y, admin 오버라이드.
     */
    @Transactional
    public void inspect(Long returnSeq, String restockYnOverride) {
        Return ret = load(returnSeq);
        ret.changeStatus(ReturnStatus.INSPECTED);
        String decision = resolveRestock(ret, restockYnOverride);
        returnItemRepository.findAllByReturnSeq(returnSeq).forEach(ri -> ri.applyRestock(decision));
    }

    /**
     * 완료: INSPECTED → COMPLETED. CANCEL/RETURN은 환불확정 + Mock PG 환불 + order 종결 + 재고 복원(원자).
     * EXCHANGE는 상태 전이만(환불·payment·재고 없음, R-Q3).
     */
    @Transactional
    public void complete(Long returnSeq) {
        Return ret = load(returnSeq);
        if ("EXCHANGE".equals(ret.getReturnType())) {
            ret.markCompleted(OffsetDateTime.now()); // 상태만 — 재출고 트리거는 빚(RD1-b)
            return;
        }

        Long orderSeq = ret.getOrderSeq();
        // 1) 환불 확정(refund_amount) + markCompleted(INSPECTED→COMPLETED 전이 가드)
        returnRefundService.finalizeRefund(returnSeq);

        // 2) payment REFUNDED (Mock PG — 실이체 없음)
        orderPaymentRepository.findFirstByOrderSeqAndPaymentStatus(orderSeq, "PAID").ifPresent(pay -> {
            paymentGateway.cancel(pay.getPgTid());
            pay.markRefunded(OffsetDateTime.now());
        });

        // 3) order 종결 + 재고 복원 (타입별)
        Order order = orderRepository.findById(orderSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        if ("CANCEL".equals(ret.getReturnType())) {
            order.changeStatus(OrderStatus.CANCELED);
            orderStockRestorer.restore(orderSeq, item -> true); // 전량 복원(R-T1 공유)
        } else { // RETURN
            order.changeStatus(OrderStatus.RETURNED);
            orderStockRestorer.restoreQuantities(resalableUnits(returnSeq, orderSeq)); // 부분·재판매분만
        }
    }

    /** 재입고 판정: 오버라이드 우선, 없으면 DEFECT=N·그 외=Y. */
    private String resolveRestock(Return ret, String override) {
        if (override != null && !override.isBlank()) {
            return override.toUpperCase();
        }
        return "DEFECT".equals(ret.getReturnReasonType()) ? "N" : "Y";
    }

    /** RETURN 완료 시 복원할 (옵션seq, 수량) — restock_yn='Y'인 반품 아이템의 반품 수량만. */
    private List<StockRestoreUnit> resalableUnits(Long returnSeq, Long orderSeq) {
        Map<Long, Long> optionByItemSeq = orderItemRepository.findAllByOrderSeq(orderSeq).stream()
                .filter(oi -> oi.getOptionSeq() != null)
                .collect(Collectors.toMap(OrderItem::getItemSeq, OrderItem::getOptionSeq));
        return returnItemRepository.findAllByReturnSeq(returnSeq).stream()
                .filter(ri -> "Y".equals(ri.getUseYn()) && "Y".equals(ri.getRestockYn()))
                .map(ri -> {
                    Long optionSeq = optionByItemSeq.get(ri.getItemSeq());
                    return optionSeq == null ? null : new StockRestoreUnit(optionSeq, ri.getQuantity());
                })
                .filter(Objects::nonNull)
                .toList();
    }

    private Return load(Long returnSeq) {
        return returnRepository.findById(returnSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.RETURN_NOT_FOUND));
    }
}
