package com.micoz.admin.order.service;

import com.micoz.admin.order.dto.AdminOrderDetailResponse;
import com.micoz.admin.order.dto.AdminOrderListItem;
import com.micoz.admin.order.dto.AdminOrderSearchCondition;
import com.micoz.admin.order.spec.OrderSpecs;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.order.dto.OrderItemSnapshot;
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
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 관리자 주문 조회 (O-T4, FR-ADM-05). 목록(다축 검색·페이징) + 상세.
 * <b>관리자는 전 회원 주문을 본다</b> — 사용자측 {@code OrderQueryService}의 본인-행 제약(findByOrderSeqAndUserSeq)과
 * 달리 {@code findById}로 조회한다. 목록은 주문 페이지 + 주문상품 배치조회로 N+1을 피한다(statement 상수).
 */
@Service
@RequiredArgsConstructor
public class AdminOrderQueryService {

    /** 정렬 화이트리스트(API 키 → 엔티티 속성). 미허용 키는 400. */
    private static final Map<String, String> SORT_WHITELIST = Map.of(
            "orderDate", "orderDate",
            "orderSeq", "orderSeq",
            "finalAmount", "finalAmount");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderShippingRepository orderShippingRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final ProductImageRepository productImageRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminOrderListItem> search(AdminOrderSearchCondition condition, Pageable pageable) {
        Specification<Order> spec = Specification.where(OrderSpecs.orderNoLike(condition.getQ()))
                .and(OrderSpecs.orderStatusEq(condition.getOrderStatus()))
                .and(OrderSpecs.userSeqEq(condition.getUserSeq()))
                .and(OrderSpecs.orderDateGoe(condition.getDateFrom()))
                .and(OrderSpecs.orderDateLoe(condition.getDateTo()));

        Page<Order> page = orderRepository.findAll(spec, sanitizeSort(pageable));
        List<Order> orders = page.getContent();
        if (orders.isEmpty()) {
            return PageResponse.of(List.<AdminOrderListItem>of(), page);
        }

        // 주문상품 배치조회(N+1 방지) — 대표상품명/건수 계산용. 목록엔 이미지 미포함(불필요 조회 생략).
        List<Long> orderSeqs = orders.stream().map(Order::getOrderSeq).toList();
        Map<Long, List<OrderItem>> itemsByOrder = orderItemRepository.findAllByOrderSeqIn(orderSeqs).stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderSeq));

        List<AdminOrderListItem> content = orders.stream().map(o -> {
            List<OrderItem> items = itemsByOrder.getOrDefault(o.getOrderSeq(), List.of());
            return AdminOrderListItem.builder()
                    .orderSeq(o.getOrderSeq())
                    .orderNo(o.getOrderNo())
                    .orderStatus(o.getOrderStatus())
                    .userSeq(o.getUserSeq())
                    .orderDate(o.getOrderDate())
                    .finalAmount(o.getFinalAmount())
                    .firstItemName(items.isEmpty() ? null : items.get(0).getProductName())
                    .totalItemCount(items.size())
                    .build();
        }).toList();
        return PageResponse.of(content, page);
    }

    @Transactional(readOnly = true)
    public AdminOrderDetailResponse getDetail(Long orderSeq) {
        Order order = orderRepository.findById(orderSeq)
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
                        // D3: mainImageUrl은 라이브 조인 — 소프트삭제 상품은 null(placeholder 대상).
                        // 상품명 등 스냅샷 필드는 온전(주문 시점 고정).
                        .mainImageUrl(mainImageByProduct.get(i.getProductSeq()))
                        .build())
                .toList();

        OrderShippingInfo shippingInfo = orderShippingRepository.findByOrderSeq(orderSeq)
                .map(this::toShippingInfo).orElse(null);
        OrderPaymentInfo paymentInfo = orderPaymentRepository
                .findFirstByOrderSeqAndPaymentStatus(orderSeq, "PAID")
                .map(this::toPaymentInfo).orElse(null);

        BigDecimal itemsTotal = items.stream()
                .map(OrderItem::getItemAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminOrderDetailResponse.builder()
                .orderSeq(order.getOrderSeq())
                .orderNo(order.getOrderNo())
                .userSeq(order.getUserSeq())
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

    /** 정렬 화이트리스트 검증 — 미허용 키는 COMMON_INVALID_REQUEST(400). (AdminProductService 패턴) */
    private Pageable sanitizeSort(Pageable pageable) {
        Sort sort = pageable.getSort();
        if (sort.isUnsorted()) {
            return pageable;
        }
        List<Sort.Order> translated = new ArrayList<>();
        for (Sort.Order order : sort) {
            String mapped = SORT_WHITELIST.get(order.getProperty());
            if (mapped == null) {
                throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST);
            }
            translated.add(new Sort.Order(order.getDirection(), mapped));
        }
        return org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(), pageable.getPageSize(), Sort.by(translated));
    }
}
