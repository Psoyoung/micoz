package com.micoz.admin.member.controller;

import com.micoz.admin.member.dto.MemberListItem;
import com.micoz.admin.member.dto.MemberSearchCondition;
import com.micoz.admin.member.service.AdminMemberService;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
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
}
