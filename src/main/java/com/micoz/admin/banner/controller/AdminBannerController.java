package com.micoz.admin.banner.controller;

import com.micoz.admin.banner.dto.AdminBannerDetailResponse;
import com.micoz.admin.banner.dto.AdminBannerListItem;
import com.micoz.admin.banner.dto.AdminBannerSearchCondition;
import com.micoz.admin.banner.dto.BannerCreatedResponse;
import com.micoz.admin.banner.dto.CreateBannerRequest;
import com.micoz.admin.banner.dto.UpdateBannerDisplayRequest;
import com.micoz.admin.banner.dto.UpdateBannerRequest;
import com.micoz.admin.banner.service.AdminBannerService;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 배너 관리 — 목록·검색 + 생성 + 수정 + 노출토글 + 소프트삭제 (FR-ADM-08, S-T1).
 * URL 게이팅(/api/v1/admin/**) + 클래스 레벨 @PreAuthorize 2차 방어(F-T4 표준).
 * 기본 정렬은 사용자 노출 순서(sort_order asc)와 일치 + bannerSeq asc로 안정화.
 */
@RestController
@RequestMapping("/api/v1/admin/banners")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBannerController {

    private final AdminBannerService adminBannerService;

    @GetMapping
    public ApiResponse<PageResponse<AdminBannerListItem>> list(
            @ModelAttribute AdminBannerSearchCondition condition,
            @PageableDefault(size = 20, sort = {"sortOrder", "bannerSeq"}, direction = Sort.Direction.ASC) Pageable pageable) {
        return ApiResponse.success(adminBannerService.search(condition, pageable));
    }

    @GetMapping("/{bannerSeq}")
    public ApiResponse<AdminBannerDetailResponse> detail(@PathVariable Long bannerSeq) {
        return ApiResponse.success(adminBannerService.getDetail(bannerSeq));
    }

    @PostMapping
    public ApiResponse<BannerCreatedResponse> create(@Valid @RequestBody CreateBannerRequest request) {
        return ApiResponse.success(adminBannerService.create(request));
    }

    @PutMapping("/{bannerSeq}")
    public ApiResponse<Void> update(
            @PathVariable Long bannerSeq,
            @Valid @RequestBody UpdateBannerRequest request) {
        adminBannerService.update(bannerSeq, request);
        return ApiResponse.success();
    }

    @PatchMapping("/{bannerSeq}/display")
    public ApiResponse<Void> changeDisplay(
            @PathVariable Long bannerSeq,
            @Valid @RequestBody UpdateBannerDisplayRequest request) {
        adminBannerService.changeDisplay(bannerSeq, request.getDisplayYn());
        return ApiResponse.success();
    }

    @DeleteMapping("/{bannerSeq}")
    public ApiResponse<Void> delete(@PathVariable Long bannerSeq) {
        adminBannerService.delete(bannerSeq);
        return ApiResponse.success();
    }
}
