package com.micoz.returns.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import com.micoz.returns.dto.ReturnDetailResponse;
import com.micoz.returns.dto.ReturnListItem;
import com.micoz.returns.service.ReturnQueryService;
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
@RequestMapping("/api/v1/me/returns")
@RequiredArgsConstructor
public class MyReturnController {

    private final ReturnQueryService returnQueryService;

    @GetMapping
    public ApiResponse<PageResponse<ReturnListItem>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "returnSeq", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(returnQueryService.getMyReturns(principal.getUserSeq(), pageable));
    }

    @GetMapping("/{returnSeq}")
    public ApiResponse<ReturnDetailResponse> detail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long returnSeq) {
        return ApiResponse.success(returnQueryService.getDetail(principal.getUserSeq(), returnSeq));
    }
}
