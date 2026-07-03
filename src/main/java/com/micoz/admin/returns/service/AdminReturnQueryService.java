package com.micoz.admin.returns.service;

import com.micoz.admin.returns.dto.AdminReturnDetailResponse;
import com.micoz.admin.returns.dto.AdminReturnListItem;
import com.micoz.admin.returns.dto.AdminReturnSearchCondition;
import com.micoz.admin.returns.spec.ReturnSpecs;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.order.entity.Order;
import com.micoz.order.entity.OrderItem;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.order.repository.OrderRepository;
import com.micoz.product.entity.ProductOption;
import com.micoz.product.repository.ProductOptionRepository;
import com.micoz.returns.dto.ReturnItemDto;
import com.micoz.returns.entity.Return;
import com.micoz.returns.entity.ReturnItem;
import com.micoz.returns.repository.ReturnItemRepository;
import com.micoz.returns.repository.ReturnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 관리자 반품 조회 (R-T4). 목록(다축 검색·정렬 화이트리스트) + 상세. 관리자는 전 회원 반품을 findById로 본다.
 * 목록은 반품 페이지 + 주문/아이템 배치조회로 N+1을 피한다.
 */
@Service
@RequiredArgsConstructor
public class AdminReturnQueryService {

    private static final Map<String, String> SORT_WHITELIST = Map.of(
            "requestedDate", "requestedDate",
            "returnSeq", "returnSeq");

    private final ReturnRepository returnRepository;
    private final ReturnItemRepository returnItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductOptionRepository productOptionRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminReturnListItem> search(AdminReturnSearchCondition condition, Pageable pageable) {
        Specification<Return> spec = Specification.where(ReturnSpecs.returnNoLike(condition.getQ()))
                .and(ReturnSpecs.returnStatusEq(condition.getReturnStatus()))
                .and(ReturnSpecs.returnTypeEq(condition.getReturnType()))
                .and(ReturnSpecs.userSeqEq(condition.getUserSeq()))
                .and(ReturnSpecs.requestedGoe(condition.getDateFrom()))
                .and(ReturnSpecs.requestedLoe(condition.getDateTo()));

        Page<Return> page = returnRepository.findAll(spec, sanitizeSort(pageable));
        List<Return> returns = page.getContent();
        if (returns.isEmpty()) {
            return PageResponse.of(List.<AdminReturnListItem>of(), page);
        }

        List<Long> orderSeqs = returns.stream().map(Return::getOrderSeq).distinct().toList();
        Map<Long, Order> orderById = orderRepository.findAllById(orderSeqs).stream()
                .collect(Collectors.toMap(Order::getOrderSeq, o -> o));

        List<Long> returnSeqs = returns.stream().map(Return::getReturnSeq).toList();
        Map<Long, Long> itemCount = returnItemRepository.findAllByReturnSeqIn(returnSeqs).stream()
                .filter(ri -> "Y".equals(ri.getUseYn()))
                .collect(Collectors.groupingBy(ReturnItem::getReturnSeq, Collectors.counting()));

        List<AdminReturnListItem> content = returns.stream().map(r -> {
            Order order = orderById.get(r.getOrderSeq());
            return AdminReturnListItem.builder()
                    .returnSeq(r.getReturnSeq())
                    .returnNo(r.getReturnNo())
                    .orderSeq(r.getOrderSeq())
                    .orderNo(order != null ? order.getOrderNo() : null)
                    .userSeq(r.getUserSeq())
                    .returnType(r.getReturnType())
                    .returnStatus(r.getReturnStatus())
                    .returnReasonType(r.getReturnReasonType())
                    .refundAmount(r.getRefundAmount())
                    .requestedDate(r.getRequestedDate())
                    .totalItemCount(itemCount.getOrDefault(r.getReturnSeq(), 0L).intValue())
                    .build();
        }).toList();
        return PageResponse.of(content, page);
    }

    @Transactional(readOnly = true)
    public AdminReturnDetailResponse getDetail(Long returnSeq) {
        Return ret = returnRepository.findById(returnSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.RETURN_NOT_FOUND));
        Order order = orderRepository.findById(ret.getOrderSeq()).orElse(null);

        List<ReturnItem> returnItems = returnItemRepository.findAllByReturnSeq(returnSeq).stream()
                .filter(ri -> "Y".equals(ri.getUseYn())).toList();

        List<Long> itemSeqs = returnItems.stream().map(ReturnItem::getItemSeq).distinct().toList();
        Map<Long, OrderItem> oiBySeq = itemSeqs.isEmpty() ? Map.of()
                : orderItemRepository.findAllById(itemSeqs).stream()
                        .collect(Collectors.toMap(OrderItem::getItemSeq, oi -> oi));

        List<Long> exchangeOptionSeqs = returnItems.stream()
                .map(ReturnItem::getExchangeOptionSeq).filter(Objects::nonNull).distinct().toList();
        Map<Long, ProductOption> exchangeOptions = exchangeOptionSeqs.isEmpty() ? Map.of()
                : productOptionRepository.findAllById(exchangeOptionSeqs).stream()
                        .collect(Collectors.toMap(ProductOption::getOptionSeq, o -> o));

        List<ReturnItemDto> items = returnItems.stream().map(ri -> {
            OrderItem oi = oiBySeq.get(ri.getItemSeq());
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

        return AdminReturnDetailResponse.builder()
                .returnSeq(ret.getReturnSeq())
                .returnNo(ret.getReturnNo())
                .orderSeq(ret.getOrderSeq())
                .orderNo(order != null ? order.getOrderNo() : null)
                .userSeq(ret.getUserSeq())
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
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(translated));
    }
}
