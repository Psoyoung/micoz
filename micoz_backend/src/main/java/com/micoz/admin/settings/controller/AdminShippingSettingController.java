package com.micoz.admin.settings.controller;

import com.micoz.admin.settings.dto.ShippingSettingResponse;
import com.micoz.admin.settings.dto.UpdateShippingRequest;
import com.micoz.admin.settings.service.AdminShippingSettingService;
import com.micoz.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 배송 설정 관리 — 단일행 조회 + 부분수정 (FR-ADM-09, S-T2).
 * URL 게이팅(/api/v1/admin/**) + 클래스 레벨 @PreAuthorize 2차 방어(F-T4 표준).
 * 경로에 id 없음(단일 정본). 삭제/생성 API 없음.
 */
@RestController
@RequestMapping("/api/v1/admin/settings/shipping")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminShippingSettingController {

    private final AdminShippingSettingService adminShippingSettingService;

    @GetMapping
    public ApiResponse<ShippingSettingResponse> get() {
        return ApiResponse.success(adminShippingSettingService.getSetting());
    }

    @PatchMapping
    public ApiResponse<Void> update(@Valid @RequestBody UpdateShippingRequest request) {
        adminShippingSettingService.updateSetting(request);
        return ApiResponse.success();
    }
}
