package com.micoz.admin.user.controller;

import com.micoz.admin.user.dto.AdminCreatedResponse;
import com.micoz.admin.user.dto.AdminListItem;
import com.micoz.admin.user.dto.CreateAdminRequest;
import com.micoz.admin.user.dto.UpdateAdminStatusRequest;
import com.micoz.admin.user.service.AdminUserService;
import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 계정 추가/목록/상태 관리 (FR-ADM-10, F-T6).
 * URL 게이팅(F-T3) + 클래스 레벨 @PreAuthorize 2차 방어(F-T4 패턴).
 */
@RestController
@RequestMapping("/api/v1/admin/admins")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @PostMapping
    public ApiResponse<AdminCreatedResponse> create(@Valid @RequestBody CreateAdminRequest request) {
        return ApiResponse.success(adminUserService.createAdmin(request));
    }

    @GetMapping
    public ApiResponse<PageResponse<AdminListItem>> list(
            @PageableDefault(size = 20, sort = "userSeq", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(adminUserService.list(pageable));
    }

    @PatchMapping("/{userSeq}/status")
    public ApiResponse<Void> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userSeq,
            @Valid @RequestBody UpdateAdminStatusRequest request) {
        adminUserService.updateStatus(principal.getUserSeq(), userSeq, request.getActive());
        return ApiResponse.success();
    }
}
