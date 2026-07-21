package com.micoz.returns.service;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.order.entity.Order;
import com.micoz.order.entity.OrderItem;
import com.micoz.order.entity.OrderShipping;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.order.repository.OrderRepository;
import com.micoz.order.repository.OrderShippingRepository;
import com.micoz.returns.dto.CreateReturnRequest;
import com.micoz.returns.dto.ReturnCreatedResponse;
import com.micoz.returns.dto.ReturnItemInput;
import com.micoz.returns.entity.Return;
import com.micoz.returns.entity.ReturnItem;
import com.micoz.returns.repository.ReturnItemRepository;
import com.micoz.returns.repository.ReturnRepository;
import com.micoz.returns.util.ReturnNoGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReturnService {

    private static final long RETURN_PERIOD_DAYS = 7;
    private static final Set<String> ALLOWED_TYPES = Set.of("CANCEL", "EXCHANGE", "RETURN");
    private static final Set<String> ALLOWED_REASONS =
            Set.of("CHANGE_OF_MIND", "DEFECT", "WRONG_DELIVERY", "ETC");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderShippingRepository orderShippingRepository;
    private final ReturnRepository returnRepository;
    private final ReturnItemRepository returnItemRepository;
    private final ReturnNoGenerator returnNoGenerator;

    @Transactional
    public ReturnCreatedResponse create(Long userSeq, Long orderSeq, CreateReturnRequest request) {
        if (!ALLOWED_TYPES.contains(request.getReturnType())) {
            throw new BusinessException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        if (!ALLOWED_REASONS.contains(request.getReturnReasonType())) {
            throw new BusinessException(ErrorCode.COMMON_VALIDATION_ERROR);
        }

        // 주문 행 비관적 잠금 — 같은 주문의 동시 반품 신청을 직렬화(아래 수량검증 TOCTOU 차단, 빚 #2).
        // 소유 검증 병행(남의 주문은 없는 것처럼 ORDER_NOT_FOUND). 락은 트랜잭션 종료 시 해제.
        Order order = orderRepository.findByOrderSeqForUpdate(orderSeq)
                .filter(o -> o.getUserSeq().equals(userSeq))
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        validateOrderStatus(order, request.getReturnType());
        if ("RETURN".equals(request.getReturnType()) || "EXCHANGE".equals(request.getReturnType())) {
            validateReturnPeriod(order);
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessException(ErrorCode.RETURN_EMPTY_ITEMS);
        }

        // 본 주문의 item 매핑
        List<OrderItem> orderItems = orderItemRepository.findAllByOrderSeq(orderSeq);
        Map<Long, OrderItem> itemBySeq = new HashMap<>();
        for (OrderItem oi : orderItems) itemBySeq.put(oi.getItemSeq(), oi);

        for (ReturnItemInput input : request.getItems()) {
            OrderItem orderItem = itemBySeq.get(input.getItemSeq());
            if (orderItem == null) {
                throw new BusinessException(ErrorCode.RETURN_ITEM_INVALID);
            }
            if ("EXCHANGE".equals(request.getReturnType()) && input.getExchangeOptionSeq() == null) {
                throw new BusinessException(ErrorCode.COMMON_VALIDATION_ERROR);
            }
            int alreadyReturned = returnItemRepository.findAllByItemSeq(input.getItemSeq()).stream()
                    .filter(ri -> "Y".equals(ri.getUseYn()))
                    .mapToInt(ReturnItem::getQuantity).sum();
            if (alreadyReturned + input.getQuantity() > orderItem.getQuantity()) {
                throw new BusinessException(ErrorCode.RETURN_QUANTITY_EXCEEDED);
            }
        }

        String returnNo = returnNoGenerator.next();
        Return saved = returnRepository.save(Return.builder()
                .returnNo(returnNo)
                .orderSeq(orderSeq)
                .userSeq(userSeq)
                .returnType(request.getReturnType())
                .returnStatus("REQUESTED")
                .returnReasonType(request.getReturnReasonType())
                .returnReason(request.getReturnReason())
                .pickupZipCode(request.getPickupZipCode())
                .pickupAddress(request.getPickupAddress())
                .pickupAddressDetail(request.getPickupAddressDetail())
                .pickupPhone(request.getPickupPhone())
                .requestedDate(OffsetDateTime.now())
                .build());

        for (ReturnItemInput input : request.getItems()) {
            returnItemRepository.save(ReturnItem.builder()
                    .returnSeq(saved.getReturnSeq())
                    .itemSeq(input.getItemSeq())
                    .quantity(input.getQuantity())
                    .exchangeOptionSeq(input.getExchangeOptionSeq())
                    .build());
        }

        return ReturnCreatedResponse.builder()
                .returnSeq(saved.getReturnSeq())
                .returnNo(saved.getReturnNo())
                .returnType(saved.getReturnType())
                .returnStatus(saved.getReturnStatus())
                .requestedDate(saved.getRequestedDate())
                .build();
    }

    /** CANCEL: PAID 상태 / RETURN, EXCHANGE: DELIVERED 후 7일. */
    private void validateOrderStatus(Order order, String returnType) {
        String status = order.getOrderStatus();
        if ("CANCEL".equals(returnType)) {
            if (!"PAID".equals(status) && !"PREPARING".equals(status)) {
                throw new BusinessException(ErrorCode.ORDER_INVALID_STATUS);
            }
        } else {
            // RETURN / EXCHANGE는 배송 완료(DELIVERED) 이후
            if (!"DELIVERED".equals(status)) {
                throw new BusinessException(ErrorCode.ORDER_INVALID_STATUS);
            }
        }
    }

    private void validateReturnPeriod(Order order) {
        OrderShipping shipping = orderShippingRepository.findByOrderSeq(order.getOrderSeq())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_INVALID_STATUS));
        OffsetDateTime delivered = shipping.getDeliveredDate();
        if (delivered == null) {
            throw new BusinessException(ErrorCode.ORDER_INVALID_STATUS);
        }
        if (Duration.between(delivered, OffsetDateTime.now()).toDays() > RETURN_PERIOD_DAYS) {
            throw new BusinessException(ErrorCode.RETURN_PERIOD_EXPIRED);
        }
    }
}
