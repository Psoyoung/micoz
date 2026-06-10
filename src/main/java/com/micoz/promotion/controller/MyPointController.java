package com.micoz.promotion.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.promotion.dto.MyPointResponse;
import com.micoz.promotion.service.PointQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/points")
@RequiredArgsConstructor
public class MyPointController {

    private final PointQueryService pointQueryService;

    @GetMapping
    public ApiResponse<MyPointResponse> getMyPoints(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "pointSeq", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(pointQueryService.getMyPoints(principal.getUserSeq(), pageable));
    }
}
