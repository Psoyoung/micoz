package com.micoz.promotion.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import com.micoz.promotion.dto.UserCouponItem;
import com.micoz.promotion.service.CouponQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/coupons")
@RequiredArgsConstructor
public class MyCouponController {

    private final CouponQueryService couponQueryService;

    @GetMapping
    public ApiResponse<PageResponse<UserCouponItem>> getMyCoupons(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "status", required = false) String status,
            @PageableDefault(size = 20, sort = "userCouponSeq", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(couponQueryService.getMyCoupons(principal.getUserSeq(), status, pageable));
    }
}
