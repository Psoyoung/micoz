package com.micoz.admin.inquiry.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

/** 문의 목록 행 (CS-T2). 관리자는 전 회원 문의 대상이라 user_seq 노출. hasReply는 상태 파생(statement 상수). */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminInquiryListItem {

    private Long inquirySeq;
    private String inquiryNo;
    private Long userSeq;
    private String inquiryType;
    private String title;
    private String inquiryStatus;
    private String privateYn;
    private boolean hasReply;
    private OffsetDateTime createdDate;
    private OffsetDateTime answeredDate;
}
