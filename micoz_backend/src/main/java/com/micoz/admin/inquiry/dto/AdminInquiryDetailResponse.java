package com.micoz.admin.inquiry.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.List;

/** 문의 상세 — 관리자 전용 (CS-T2). 문의 본문 + 참조(상품/주문) + 답변 이력(admin DTO). 전 회원 대상. */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminInquiryDetailResponse {

    private Long inquirySeq;
    private String inquiryNo;
    private Long userSeq;
    private String inquiryType;
    private String title;
    private String content;
    private Long productSeq;
    private Long orderSeq;
    private String inquiryStatus;
    private String privateYn;
    private OffsetDateTime createdDate;
    private OffsetDateTime answeredDate;
    private List<AdminInquiryReplyDto> replies;
}
