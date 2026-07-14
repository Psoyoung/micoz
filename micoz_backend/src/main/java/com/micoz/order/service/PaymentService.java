package com.micoz.order.service;

import com.micoz.cart.entity.Cart;
import com.micoz.cart.repository.CartRepository;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.order.dto.PayOrderRequest;
import com.micoz.order.dto.PayOrderResponse;
import com.micoz.order.entity.Order;
import com.micoz.order.entity.OrderItem;
import com.micoz.order.entity.OrderPayment;
import com.micoz.order.entity.OrderStatus;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.order.repository.OrderPaymentRepository;
import com.micoz.order.repository.OrderRepository;
import com.micoz.payment.gateway.PaymentGateway;
import com.micoz.payment.gateway.PaymentRequest;
import com.micoz.payment.gateway.PaymentResult;
import com.micoz.product.entity.ProductOption;
import com.micoz.product.repository.ProductOptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final ProductOptionRepository productOptionRepository;
    private final CartRepository cartRepository;
    private final PaymentGateway paymentGateway;

    @Transactional(noRollbackFor = BusinessException.class)
    public PayOrderResponse pay(Long userSeq, Long orderSeq, PayOrderRequest request) {
        // 1. 주문 본인 확인 + 상태 검증
        Order order = orderRepository.findByOrderSeqAndUserSeq(orderSeq, userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        if (!"PENDING".equals(order.getOrderStatus())) {
            throw new BusinessException(ErrorCode.ORDER_INVALID_STATUS);
        }

        // 2. PG 승인 호출
        PaymentResult pgResult = paymentGateway.approve(PaymentRequest.builder()
                .orderNo(order.getOrderNo())
                .amount(order.getFinalAmount())
                .paymentType(request.getPaymentType())
                .cardNo(request.getCardNo())
                .installment(request.getInstallment() != null ? request.getInstallment() : 0)
                .build());

        OffsetDateTime now = OffsetDateTime.now();

        // 3. 결제 실패 시 — PENDING 유지, FAILED 기록, 카트 보존
        if (!pgResult.isSuccess()) {
            orderPaymentRepository.save(OrderPayment.builder()
                    .orderSeq(order.getOrderSeq())
                    .paymentType(request.getPaymentType())
                    .paymentStatus("FAILED")
                    .paidAmount(order.getFinalAmount())
                    .cardCompany(pgResult.getCardCompany())
                    .cardNoMasked(pgResult.getCardNoMasked())
                    .installment(request.getInstallment() != null ? request.getInstallment() : 0)
                    .build());
            log.info("Payment failed: orderNo={}, reason={}", order.getOrderNo(), pgResult.getFailureReason());
            throw new BusinessException(ErrorCode.PAY_APPROVAL_FAILED);
        }

        // 4. 성공 — 재고 차감 시도
        List<OrderItem> items = orderItemRepository.findAllByOrderSeq(order.getOrderSeq());
        List<Long> optionSeqs = items.stream()
                .map(OrderItem::getOptionSeq)
                .filter(java.util.Objects::nonNull)
                .distinct().toList();
        Map<Long, ProductOption> optionById = optionSeqs.isEmpty()
                ? Map.of()
                : productOptionRepository.findAllById(optionSeqs).stream()
                        .collect(Collectors.toMap(ProductOption::getOptionSeq, o -> o));

        for (OrderItem item : items) {
            if (item.getOptionSeq() == null) continue;
            ProductOption option = optionById.get(item.getOptionSeq());
            if (option == null || !option.decreaseStock(item.getQuantity())) {
                // 재고 부족 — PG 결제 취소 + FAILED 기록
                try {
                    paymentGateway.cancel(pgResult.getPgTid());
                } catch (Exception cancelEx) {
                    log.warn("PG cancel failed: pgTid={}", pgResult.getPgTid(), cancelEx);
                }
                orderPaymentRepository.save(OrderPayment.builder()
                        .orderSeq(order.getOrderSeq())
                        .paymentType(request.getPaymentType())
                        .paymentStatus("CANCELED")
                        .paidAmount(order.getFinalAmount())
                        .cardCompany(pgResult.getCardCompany())
                        .cardNoMasked(pgResult.getCardNoMasked())
                        .approvalNo(pgResult.getApprovalNo())
                        .pgTid(pgResult.getPgTid())
                        .build());
                throw new BusinessException(ErrorCode.PRODUCT_SOLD_OUT);
            }
        }

        // 5. 결제/주문 상태 전이
        OrderPayment payment = OrderPayment.builder()
                .orderSeq(order.getOrderSeq())
                .paymentType(request.getPaymentType())
                .paymentStatus("PENDING")
                .paidAmount(order.getFinalAmount())
                .cardCompany(pgResult.getCardCompany())
                .cardNoMasked(pgResult.getCardNoMasked())
                .installment(request.getInstallment() != null ? request.getInstallment() : 0)
                .build();
        payment.markPaid(pgResult.getApprovalNo(), pgResult.getPgTid(), now);
        orderPaymentRepository.save(payment);

        order.changeStatus(OrderStatus.PAID); // 전이표 경유 승격(O-T2) — PENDING→PAID 허용전이

        // 6. 카트 자동 정리 — 본 주문 항목과 일치(product+option)하는 카트 행 삭제
        cleanCartForItems(userSeq, items);

        return PayOrderResponse.builder()
                .orderNo(order.getOrderNo())
                .orderStatus("PAID")
                .paymentStatus("PAID")
                .paidAmount(payment.getPaidAmount())
                .approvalNo(payment.getApprovalNo())
                .cardCompany(payment.getCardCompany())
                .cardNoMasked(payment.getCardNoMasked())
                .pointToEarn(order.getPointToEarn())
                .paidDate(payment.getPaidDate())
                .build();
    }

    /** 본 주문 OrderItem(productSeq+optionSeq)과 일치하는 사용자 카트 행 삭제. */
    private void cleanCartForItems(Long userSeq, List<OrderItem> items) {
        for (OrderItem item : items) {
            cartRepository.findByUserSeqAndProductSeqAndOptionSeq(
                    userSeq, item.getProductSeq(), item.getOptionSeq())
                    .ifPresent(cartRepository::delete);
        }
    }
}
