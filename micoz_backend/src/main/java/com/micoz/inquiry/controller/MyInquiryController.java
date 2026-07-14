package com.micoz.inquiry.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import com.micoz.inquiry.dto.CreateInquiryRequest;
import com.micoz.inquiry.dto.InquiryCreatedResponse;
import com.micoz.inquiry.dto.InquiryDetailResponse;
import com.micoz.inquiry.dto.InquiryListItem;
import com.micoz.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/inquiries")
@RequiredArgsConstructor
public class MyInquiryController {

    private final InquiryService inquiryService;

    @PostMapping
    public ApiResponse<InquiryCreatedResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateInquiryRequest request) {
        return ApiResponse.success(inquiryService.create(principal.getUserSeq(), request));
    }

    @GetMapping
    public ApiResponse<PageResponse<InquiryListItem>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "inquirySeq", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(inquiryService.getMyInquiries(principal.getUserSeq(), pageable));
    }

    @GetMapping("/{inquirySeq}")
    public ApiResponse<InquiryDetailResponse> detail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long inquirySeq) {
        return ApiResponse.success(inquiryService.getDetail(principal.getUserSeq(), inquirySeq));
    }
}
