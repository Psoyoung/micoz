package com.micoz.admin.returns.controller;

import com.micoz.admin.returns.dto.AdminReturnDetailResponse;
import com.micoz.admin.returns.dto.AdminReturnListItem;
import com.micoz.admin.returns.dto.AdminReturnSearchCondition;
import com.micoz.admin.returns.dto.InspectReturnRequest;
import com.micoz.admin.returns.service.AdminReturnQueryService;
import com.micoz.admin.returns.service.AdminReturnService;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 반품/교환 처리 — 관리자 (R-T4, FR-ADM-06). URL 게이팅 + 클래스 레벨 @PreAuthorize 2차 방어(F-T4).
 * 관리자는 전 회원 반품 대상. 완료(complete)는 CANCEL/RETURN만 환불·종결·재고를 트리거(EXCHANGE는 상태만).
 */
@RestController
@RequestMapping("/api/v1/admin/returns")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReturnController {

    private final AdminReturnService adminReturnService;
    private final AdminReturnQueryService adminReturnQueryService;

    /** 목록 — 다축 검색(returnNo/status/type/userSeq/기간) + 페이징. 기본 정렬 requestedDate desc. */
    @GetMapping
    public ApiResponse<PageResponse<AdminReturnListItem>> list(
            @ModelAttribute AdminReturnSearchCondition condition,
            @PageableDefault(size = 20, sort = "requestedDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(adminReturnQueryService.search(condition, pageable));
    }

    /** 상세 — 반품 + 아이템 스냅샷(전 회원 대상). */
    @GetMapping("/{returnSeq}")
    public ApiResponse<AdminReturnDetailResponse> detail(@PathVariable Long returnSeq) {
        return ApiResponse.success(adminReturnQueryService.getDetail(returnSeq));
    }

    /** 승인: REQUESTED → APPROVED. */
    @PatchMapping("/{returnSeq}/approve")
    public ApiResponse<Void> approve(@PathVariable Long returnSeq) {
        adminReturnService.approve(returnSeq);
        return ApiResponse.success();
    }

    /** 반려: {REQUESTED|APPROVED|INSPECTED} → REJECTED (부수효과 없음). */
    @PatchMapping("/{returnSeq}/reject")
    public ApiResponse<Void> reject(@PathVariable Long returnSeq) {
        adminReturnService.reject(returnSeq);
        return ApiResponse.success();
    }

    /** 회수: APPROVED → COLLECTED. */
    @PatchMapping("/{returnSeq}/collect")
    public ApiResponse<Void> collect(@PathVariable Long returnSeq) {
        adminReturnService.collect(returnSeq);
        return ApiResponse.success();
    }

    /** 검수: COLLECTED → INSPECTED (+재입고 판정, R-Q1). */
    @PatchMapping("/{returnSeq}/inspect")
    public ApiResponse<Void> inspect(@PathVariable Long returnSeq,
                                     @Valid @RequestBody(required = false) InspectReturnRequest request) {
        adminReturnService.inspect(returnSeq, request == null ? null : request.getRestockYn());
        return ApiResponse.success();
    }

    /** 완료: INSPECTED → COMPLETED (CANCEL/RETURN: 환불+종결+재고 / EXCHANGE: 상태만). */
    @PatchMapping("/{returnSeq}/complete")
    public ApiResponse<Void> complete(@PathVariable Long returnSeq) {
        adminReturnService.complete(returnSeq);
        return ApiResponse.success();
    }
}
