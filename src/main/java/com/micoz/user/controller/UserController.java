package com.micoz.user.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.user.dto.ChangePasswordRequest;
import com.micoz.user.dto.UpdateUserRequest;
import com.micoz.user.dto.UserInfoResponse;
import com.micoz.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<UserInfoResponse> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(userService.getMe(principal.getUserSeq()));
    }

    @PatchMapping
    public ApiResponse<UserInfoResponse> updateMe(@AuthenticationPrincipal UserPrincipal principal,
                                                  @Valid @RequestBody UpdateUserRequest request) {
        return ApiResponse.success(userService.updateMe(principal.getUserSeq(), request));
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(@AuthenticationPrincipal UserPrincipal principal,
                                            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(principal.getUserSeq(), request);
        return ApiResponse.success();
    }
}
