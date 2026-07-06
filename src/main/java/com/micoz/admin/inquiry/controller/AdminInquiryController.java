package com.micoz.admin.inquiry.controller;

import com.micoz.admin.inquiry.dto.AdminInquiryDetailResponse;
import com.micoz.admin.inquiry.dto.AdminInquiryListItem;
import com.micoz.admin.inquiry.dto.AdminInquirySearchCondition;
import com.micoz.admin.inquiry.service.AdminInquiryQueryService;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 문의 응대 조회 — 관리자 (CS-T2, FR-ADM-07). URL 게이팅 + 클래스 레벨 @PreAuthorize 2차 방어(F-T4).
 * 관리자는 전 회원 문의 대상(비공개 포함). 답변 등록은 CS-T3(별도).
 */
@RestController
@RequestMapping("/api/v1/admin/inquiries")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminInquiryController {

    private final AdminInquiryQueryService adminInquiryQueryService;

    /** 목록 — 다축 검색(title/type/status/userSeq/privateYn/기간) + 페이징. 기본 정렬 inquirySeq desc. */
    @GetMapping
    public ApiResponse<PageResponse<AdminInquiryListItem>> list(
            @ModelAttribute AdminInquirySearchCondition condition,
            @PageableDefault(size = 20, sort = "inquirySeq", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(adminInquiryQueryService.search(condition, pageable));
    }

    /** 상세 — 문의 + 답변 이력(admin DTO, 전 회원 대상). */
    @GetMapping("/{inquirySeq}")
    public ApiResponse<AdminInquiryDetailResponse> detail(@PathVariable Long inquirySeq) {
        return ApiResponse.success(adminInquiryQueryService.getDetail(inquirySeq));
    }
}
