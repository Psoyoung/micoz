package com.micoz.admin.inquiry.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.OffsetDateTime;

/** 문의 검색 조건 (CS-T2). 쿼리 파라미터 바인딩. 전부 선택 — 미지정 시 해당 축 무시(InquirySpecs null-safe). */
@Getter
@Setter
public class AdminInquirySearchCondition {

    private String q;              // title 부분일치
    private String inquiryType;    // PRODUCT/ORDER/DELIVERY/RETURN/ETC
    private String inquiryStatus;  // WAITING/ANSWERED
    private Long userSeq;
    private String privateYn;      // Y/N — 선택 필터(미지정 시 전체)

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private OffsetDateTime dateFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private OffsetDateTime dateTo;
}
