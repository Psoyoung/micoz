package com.micoz.order.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import com.micoz.order.dto.OrderDetailResponse;
import com.micoz.order.dto.OrderListItem;
import com.micoz.order.service.OrderQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/orders")
@RequiredArgsConstructor
public class MyOrderController {

    private final OrderQueryService orderQueryService;

    @GetMapping
    public ApiResponse<PageResponse<OrderListItem>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "orderSeq", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(orderQueryService.getMyOrders(principal.getUserSeq(), pageable));
    }

    @GetMapping("/{orderSeq}")
    public ApiResponse<OrderDetailResponse> getDetail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long orderSeq) {
        return ApiResponse.success(orderQueryService.getDetail(principal.getUserSeq(), orderSeq));
    }
}
