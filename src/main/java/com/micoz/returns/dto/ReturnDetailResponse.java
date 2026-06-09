package com.micoz.returns.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReturnDetailResponse {
    private Long returnSeq;
    private String returnNo;
    private Long orderSeq;
    private String orderNo;
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
