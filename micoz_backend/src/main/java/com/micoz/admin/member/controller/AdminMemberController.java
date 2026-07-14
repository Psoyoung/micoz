package com.micoz.admin.member.controller;

import com.micoz.admin.member.dto.CreateMemberRequest;
import com.micoz.admin.member.dto.MemberCreatedResponse;
import com.micoz.admin.member.dto.MemberDetailResponse;
import com.micoz.admin.member.dto.MemberListItem;
import com.micoz.admin.member.dto.MemberSearchCondition;
import com.micoz.admin.member.dto.PointAdjustRequest;
import com.micoz.admin.member.dto.PointAdjustResponse;
import com.micoz.admin.member.dto.UpdateMemberGradeRequest;
import com.micoz.admin.member.dto.UpdateMemberRoleRequest;
import com.micoz.admin.member.dto.UpdateMemberStatusRequest;
import com.micoz.admin.member.service.AdminMemberService;
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
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 회원 관리 — 목록·다축 검색 (FR-ADM-02, M-T1).
 * URL 게이팅(/api/v1/admin/**) + 클래스 레벨 @PreAuthorize 2차 방어(F-T4 표준).
 */
@RestController
@RequestMapping("/api/v1/admin/members")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMemberController {

    private final AdminMemberService adminMemberService;

    @GetMapping
    public ApiResponse<PageResponse<MemberListItem>> list(
            @ModelAttribute MemberSearchCondition condition,
            @PageableDefault(size = 20, sort = "userSeq", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(adminMemberService.search(condition, pageable));
    }

    @PostMapping
    public ApiResponse<MemberCreatedResponse> create(@Valid @RequestBody CreateMemberRequest request) {
        return ApiResponse.success(adminMemberService.createMember(request));
    }

    @GetMapping("/{userSeq}")
    public ApiResponse<MemberDetailResponse> detail(@PathVariable Long userSeq) {
        return ApiResponse.success(adminMemberService.getDetail(userSeq));
    }

    @PatchMapping("/{userSeq}/grade")
    public ApiResponse<Void> changeGrade(
            @PathVariable Long userSeq,
            @Valid @RequestBody UpdateMemberGradeRequest request) {
        adminMemberService.changeGrade(userSeq, request.getGradeCode());
        return ApiResponse.success();
    }

    @PatchMapping("/{userSeq}/status")
    public ApiResponse<Void> changeStatus(
            @PathVariable Long userSeq,
            @Valid @RequestBody UpdateMemberStatusRequest request) {
        adminMemberService.changeStatus(userSeq, request.getStatus());
        return ApiResponse.success();
    }

    @PostMapping("/{userSeq}/points")
    public ApiResponse<PointAdjustResponse> adjustPoint(
            @PathVariable Long userSeq,
            @Valid @RequestBody PointAdjustRequest request) {
        return ApiResponse.success(adminMemberService.adjustPoint(userSeq, request.getAmount(), request.getReason()));
    }

    @PatchMapping("/{userSeq}/role")
    public ApiResponse<Void> changeRole(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userSeq,
            @Valid @RequestBody UpdateMemberRoleRequest request) {
        adminMemberService.changeRole(principal.getUserSeq(), userSeq, request.getRole());
        return ApiResponse.success();
    }
}
