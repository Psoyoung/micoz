package com.micoz.returns.service;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.order.entity.Order;
import com.micoz.order.entity.OrderItem;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.order.repository.OrderRepository;
import com.micoz.product.entity.ProductOption;
import com.micoz.product.repository.ProductOptionRepository;
import com.micoz.returns.dto.ReturnDetailResponse;
import com.micoz.returns.dto.ReturnItemDto;
import com.micoz.returns.dto.ReturnListItem;
import com.micoz.returns.entity.Return;
import com.micoz.returns.entity.ReturnItem;
import com.micoz.returns.repository.ReturnItemRepository;
import com.micoz.returns.repository.ReturnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReturnQueryService {

    private final ReturnRepository returnRepository;
    private final ReturnItemRepository returnItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductOptionRepository productOptionRepository;

    @Transactional(readOnly = true)
    public PageResponse<ReturnListItem> getMyReturns(Long userSeq, Pageable pageable) {
        Page<Return> page = returnRepository.findAllByUserSeq(userSeq, pageable);
        List<Return> returns = page.getContent();
        if (returns.isEmpty()) {
            return PageResponse.of(List.<ReturnListItem>of(), page);
        }

        List<Long> orderSeqs = returns.stream().map(Return::getOrderSeq).distinct().toList();
        Map<Long, Order> orderById = orderRepository.findAllById(orderSeqs).stream()
                .collect(Collectors.toMap(Order::getOrderSeq, o -> o));

        List<Long> returnSeqs = returns.stream().map(Return::getReturnSeq).toList();
        Map<Long, Long> itemCountByReturn = returnItemRepository.findAllByReturnSeqIn(returnSeqs).stream()
                .filter(ri -> "Y".equals(ri.getUseYn()))
                .collect(Collectors.groupingBy(ReturnItem::getReturnSeq, Collectors.counting()));

        List<ReturnListItem> content = returns.stream().map(r -> {
            Order order = orderById.get(r.getOrderSeq());
            return ReturnListItem.builder()
                    .returnSeq(r.getReturnSeq())
                    .returnNo(r.getReturnNo())
                    .orderSeq(r.getOrderSeq())
                    .orderNo(order != null ? order.getOrderNo() : null)
                    .returnType(r.getReturnType())
                    .returnStatus(r.getReturnStatus())
                    .returnReasonType(r.getReturnReasonType())
                    .requestedDate(r.getRequestedDate())
                    .totalItemCount(itemCountByReturn.getOrDefault(r.getReturnSeq(), 0L).intValue())
                    .build();
        }).toList();
        return PageResponse.of(content, page);
    }

    @Transactional(readOnly = true)
    public ReturnDetailResponse getDetail(Long userSeq, Long returnSeq) {
        Return ret = returnRepository.findByReturnSeqAndUserSeq(returnSeq, userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.RETURN_NOT_FOUND));

        Order order = orderRepository.findById(ret.getOrderSeq()).orElse(null);

        List<ReturnItem> returnItems = returnItemRepository.findAllByReturnSeq(returnSeq).stream()
                .filter(ri -> "Y".equals(ri.getUseYn()))
                .toList();

        List<Long> itemSeqs = returnItems.stream().map(ReturnItem::getItemSeq).distinct().toList();
        Map<Long, OrderItem> orderItemBySeq = itemSeqs.isEmpty()
                ? Map.of()
                : orderItemRepository.findAllById(itemSeqs).stream()
                        .collect(Collectors.toMap(OrderItem::getItemSeq, oi -> oi));

        List<Long> exchangeOptionSeqs = returnItems.stream()
                .map(ReturnItem::getExchangeOptionSeq).filter(Objects::nonNull).distinct().toList();
        Map<Long, ProductOption> exchangeOptions = exchangeOptionSeqs.isEmpty()
                ? Map.of()
                : productOptionRepository.findAllById(exchangeOptionSeqs).stream()
                        .collect(Collectors.toMap(ProductOption::getOptionSeq, o -> o));

        List<ReturnItemDto> items = returnItems.stream().map(ri -> {
            OrderItem oi = orderItemBySeq.get(ri.getItemSeq());
            ProductOption exch = ri.getExchangeOptionSeq() != null ? exchangeOptions.get(ri.getExchangeOptionSeq()) : null;
            return ReturnItemDto.builder()
                    .returnItemSeq(ri.getReturnItemSeq())
                    .itemSeq(ri.getItemSeq())
                    .productSeq(oi != null ? oi.getProductSeq() : null)
                    .productName(oi != null ? oi.getProductName() : null)
                    .optionName(oi != null ? oi.getOptionName() : null)
                    .unitPrice(oi != null ? oi.getUnitPrice() : null)
                    .quantity(ri.getQuantity())
                    .exchangeOptionSeq(ri.getExchangeOptionSeq())
                    .exchangeOptionName(exch != null ? exch.getOptionName() : null)
                    .build();
        }).toList();

        return ReturnDetailResponse.builder()
                .returnSeq(ret.getReturnSeq())
                .returnNo(ret.getReturnNo())
                .orderSeq(ret.getOrderSeq())
                .orderNo(order != null ? order.getOrderNo() : null)
                .returnType(ret.getReturnType())
                .returnStatus(ret.getReturnStatus())
                .returnReasonType(ret.getReturnReasonType())
                .returnReason(ret.getReturnReason())
                .returnShippingFee(ret.getReturnShippingFee())
                .refundAmount(ret.getRefundAmount())
                .pickupZipCode(ret.getPickupZipCode())
                .pickupAddress(ret.getPickupAddress())
                .pickupAddressDetail(ret.getPickupAddressDetail())
                .pickupPhone(ret.getPickupPhone())
                .requestedDate(ret.getRequestedDate())
                .completedDate(ret.getCompletedDate())
                .items(items)
                .build();
    }
}
