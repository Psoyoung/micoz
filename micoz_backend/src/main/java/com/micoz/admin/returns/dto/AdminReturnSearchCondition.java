package com.micoz.admin.returns.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.OffsetDateTime;

/** 반품 검색 조건 (R-T4). 쿼리 파라미터 바인딩. 전부 선택 — 미지정 시 해당 축 무시(ReturnSpecs null-safe). */
@Getter
@Setter
public class AdminReturnSearchCondition {

    private String q;            // return_no 부분일치
    private String returnStatus; // REQUESTED/APPROVED/COLLECTED/INSPECTED/COMPLETED/REJECTED
    private String returnType;   // CANCEL/RETURN/EXCHANGE
    private Long userSeq;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private OffsetDateTime dateFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private OffsetDateTime dateTo;
}
