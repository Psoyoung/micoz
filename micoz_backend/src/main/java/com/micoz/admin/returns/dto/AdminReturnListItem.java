package com.micoz.admin.returns.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** 반품 목록 행 (R-T4). 관리자는 전 회원 반품 대상이라 user_seq 노출. */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminReturnListItem {

    private Long returnSeq;
    private String returnNo;
    private Long orderSeq;
    private String orderNo;
    private Long userSeq;
    private String returnType;
    private String returnStatus;
    private String returnReasonType;
    private BigDecimal refundAmount;
    private OffsetDateTime requestedDate;
    private int totalItemCount;
}
