package com.micoz.auth.controller;

import com.micoz.auth.dto.LoginRequest;
import com.micoz.auth.dto.TokenResponse;
import com.micoz.auth.service.AuthService;
import com.micoz.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 전용 로그인 진입점 (FR-ADM-11, F-T2).
 * 사용자 로그인과 분리하여 운영 분리(WAF/IP 화이트리스트/감사) 후크를 확보한다.
 * role != ADMIN이면 AuthService.adminLogin에서 동일 응답으로 거부(NFR-07).
 */
@RestController
@RequestMapping("/api/v1/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request,
                                            HttpServletRequest httpRequest) {
        return ApiResponse.success(authService.adminLogin(request, httpRequest));
    }
}
