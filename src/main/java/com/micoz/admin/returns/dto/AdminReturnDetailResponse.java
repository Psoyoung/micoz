package com.micoz.admin.returns.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.micoz.returns.dto.ReturnItemDto;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/** 관리자 반품 상세 (R-T4). M5 {@code ReturnDetailResponse} shape + userSeq(전 회원 조회). 내부 items는 재사용. */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminReturnDetailResponse {

    private Long returnSeq;
    private String returnNo;
    private Long orderSeq;
    private String orderNo;
    private Long userSeq;
    private String returnType;
    private String returnStatus;
    private String returnReasonType;
    private String returnReason;
    private BigDecimal returnShippingFee;
    private BigDecimal refundAmount;
    private String pickupZipCode;
    private String pickupAddress;
    private String pickupAddressDetail;
    private String pickupPhone;
    private OffsetDateTime requestedDate;
    private OffsetDateTime completedDate;
    private List<ReturnItemDto> items;
}
