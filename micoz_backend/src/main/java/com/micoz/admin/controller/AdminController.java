package com.micoz.admin.controller;

import com.micoz.admin.dto.AdminMeResponse;
import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 공통 엔드포인트 (F-T2 probe). 현재는 /me 만 제공.
 * 경로 게이팅(/api/v1/admin/**)은 F-T3, 메서드 보안(@PreAuthorize 2차 방어)은 F-T4.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @GetMapping("/me")
    public ApiResponse<AdminMeResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(
                new AdminMeResponse(principal.getUserSeq(), principal.getUserId(), principal.getRole()));
    }
}
