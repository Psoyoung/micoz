package com.micoz.returns.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.returns.dto.CreateReturnRequest;
import com.micoz.returns.dto.ReturnCreatedResponse;
import com.micoz.returns.service.ReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/orders/{orderSeq}/returns")
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;

    @PostMapping
    public ApiResponse<ReturnCreatedResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                     @PathVariable Long orderSeq,
                                                     @Valid @RequestBody CreateReturnRequest request) {
        return ApiResponse.success(returnService.create(principal.getUserSeq(), orderSeq, request));
    }
}
