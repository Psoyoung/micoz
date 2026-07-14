package com.micoz.auth.controller;

import com.micoz.auth.dto.FindIdRequest;
import com.micoz.auth.dto.FindIdResponse;
import com.micoz.auth.dto.LoginRequest;
import com.micoz.auth.dto.LogoutRequest;
import com.micoz.auth.dto.RefreshRequest;
import com.micoz.auth.dto.ResetPasswordRequest;
import com.micoz.auth.dto.SignupRequest;
import com.micoz.auth.dto.SignupResponse;
import com.micoz.auth.dto.TokenResponse;
import com.micoz.auth.security.UserPrincipal;
import com.micoz.auth.service.AuthService;
import com.micoz.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ApiResponse<SignupResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ApiResponse.success(authService.signup(request));
    }

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request,
                                            HttpServletRequest httpRequest) {
        return ApiResponse.success(authService.login(request, httpRequest));
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(@Valid @RequestBody RefreshRequest request,
                                              HttpServletRequest httpRequest) {
        return ApiResponse.success(authService.refresh(request, httpRequest));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody LogoutRequest request,
                                    @AuthenticationPrincipal UserPrincipal principal) {
        authService.logout(request, principal);
        return ApiResponse.success();
    }

    @PostMapping("/find-id")
    public ApiResponse<FindIdResponse> findId(@Valid @RequestBody FindIdRequest request) {
        return ApiResponse.success(authService.findId(request));
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.success();
    }
}
