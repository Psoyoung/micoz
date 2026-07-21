package com.micoz.order.service;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.order.dto.OrderDetailResponse;
import com.micoz.order.dto.OrderItemSnapshot;
import com.micoz.order.dto.OrderListItem;
import com.micoz.order.dto.OrderPaymentInfo;
import com.micoz.order.dto.OrderShippingInfo;
import com.micoz.order.entity.Order;
import com.micoz.order.entity.OrderItem;
import com.micoz.order.entity.OrderPayment;
import com.micoz.order.entity.OrderShipping;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.order.repository.OrderPaymentRepository;
import com.micoz.order.repository.OrderRepository;
import com.micoz.order.repository.OrderShippingRepository;
import com.micoz.product.entity.ProductImage;
import com.micoz.product.repository.ProductImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderQueryService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderShippingRepository orderShippingRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final ProductImageRepository productImageRepository;

    @Transactional(readOnly = true)
    public PageResponse<OrderListItem> getMyOrders(Long userSeq, Pageable pageable) {
        Page<Order> page = orderRepository.findAllByUserSeq(userSeq, pageable);
        List<Order> orders = page.getContent();
        if (orders.isEmpty()) {
            return PageResponse.of(List.<OrderListItem>of(), page);
        }

        List<Long> orderSeqs = orders.stream().map(Order::getOrderSeq).toList();
        List<OrderItem> allItems = orderItemRepository.findAllByOrderSeqIn(orderSeqs);

        // orderSeq → 모든 item / 첫 item 표시용
        Map<Long, List<OrderItem>> itemsByOrder = allItems.stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderSeq));

        List<Long> productSeqs = allItems.stream().map(OrderItem::getProductSeq).distinct().toList();
        Map<Long, String> mainImageByProduct = loadMainImages(productSeqs);

        List<OrderListItem> content = orders.stream().map(o -> {
            List<OrderItem> items = itemsByOrder.getOrDefault(o.getOrderSeq(), List.of());
            String firstName = items.isEmpty() ? null : items.get(0).getProductName();
            String mainImg = items.isEmpty() ? null : mainImageByProduct.get(items.get(0).getProductSeq());
            return OrderListItem.builder()
                    .orderSeq(o.getOrderSeq())
                    .orderNo(o.getOrderNo())
                    .orderStatus(o.getOrderStatus())
                    .orderDate(o.getOrderDate())
                    .finalAmount(o.getFinalAmount())
                    .firstItemName(firstName)
                    .totalItemCount(items.size())
                    .mainImageUrl(mainImg)
                    .build();
        }).toList();
        return PageResponse.of(content, page);
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getDetail(Long userSeq, Long orderSeq) {
        Order order = orderRepository.findByOrderSeqAndUserSeq(orderSeq, userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        List<OrderItem> items = orderItemRepository.findAllByOrderSeq(orderSeq);
        List<Long> productSeqs = items.stream().map(OrderItem::getProductSeq).distinct().toList();
        Map<Long, String> mainImageByProduct = loadMainImages(productSeqs);

        List<OrderItemSnapshot> itemSnapshots = items.stream()
                .map(i -> OrderItemSnapshot.builder()
                        .itemSeq(i.getItemSeq())
                        .productSeq(i.getProductSeq())
                        .optionSeq(i.getOptionSeq())
                        .productCode(i.getProductCode())
                        .productName(i.getProductName())
                        .optionName(i.getOptionName())
                        .unitPrice(i.getUnitPrice())
                        .quantity(i.getQuantity())
                        .itemAmount(i.getItemAmount())
                        .mainImageUrl(mainImageByProduct.get(i.getProductSeq()))
                        .build())
                .toList();

        OrderShippingInfo shippingInfo = orderShippingRepository.findByOrderSeq(orderSeq)
                .map(this::toShippingInfo).orElse(null);

        // 성사된 결제행(PAID 또는 환불 시 REFUNDED) 최신 1건 — 재시도로 잔존한 FAILED/CANCELED 배제.
        OrderPaymentInfo paymentInfo = orderPaymentRepository
                .findFirstByOrderSeqAndPaymentStatusInOrderByPaymentSeqDesc(orderSeq, List.of("PAID", "REFUNDED"))
                .map(this::toPaymentInfo).orElse(null);

        BigDecimal itemsTotal = items.stream()
                .map(OrderItem::getItemAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return OrderDetailResponse.builder()
                .orderSeq(order.getOrderSeq())
                .orderNo(order.getOrderNo())
                .orderStatus(order.getOrderStatus())
                .orderDate(order.getOrderDate())
                .itemsTotal(itemsTotal)
                .totalDiscount(order.getTotalDiscount())
                .couponDiscount(order.getCouponDiscount())
                .pointUsed(order.getPointUsed())
                .shippingFee(order.getShippingFee())
                .finalAmount(order.getFinalAmount())
                .pointToEarn(order.getPointToEarn())
                .items(itemSnapshots)
                .shipping(shippingInfo)
                .payment(paymentInfo)
                .build();
    }

    private Map<Long, String> loadMainImages(List<Long> productSeqs) {
        if (productSeqs.isEmpty()) return Map.of();
        Map<Long, String> result = new HashMap<>();
        productImageRepository
                .findAllByProductSeqInAndImageTypeAndUseYn(productSeqs, "MAIN", "Y").stream()
                .sorted(Comparator.comparing(ProductImage::getSortOrder,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .forEach(img -> result.putIfAbsent(img.getProductSeq(), img.getImageUrl()));
        return result;
    }

    private OrderShippingInfo toShippingInfo(OrderShipping s) {
        return OrderShippingInfo.builder()
                .recipientName(s.getRecipientName())
                .recipientPhone(s.getRecipientPhone())
                .zipCode(s.getZipCode())
                .address(s.getAddress())
                .addressDetail(s.getAddressDetail())
                .shippingMemo(s.getShippingMemo())
                .trackingNo(s.getTrackingNo())
                .shippingStatus(s.getShippingStatus())
                .shippedDate(s.getShippedDate())
                .deliveredDate(s.getDeliveredDate())
                .build();
    }

    private OrderPaymentInfo toPaymentInfo(OrderPayment p) {
        return OrderPaymentInfo.builder()
                .paymentType(p.getPaymentType())
                .paymentStatus(p.getPaymentStatus())
                .paidAmount(p.getPaidAmount())
                .cardCompany(p.getCardCompany())
                .cardNoMasked(p.getCardNoMasked())
                .installment(p.getInstallment())
                .approvalNo(p.getApprovalNo())
                .paidDate(p.getPaidDate())
                .build();
    }
}
