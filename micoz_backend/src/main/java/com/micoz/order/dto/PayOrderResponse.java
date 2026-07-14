package com.micoz.order.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PayOrderResponse {
    private String orderNo;
    private String orderStatus;
    private String paymentStatus;
    private BigDecimal paidAmount;
    private String approvalNo;
    private String cardCompany;
    private String cardNoMasked;
    private Integer pointToEarn;
    private OffsetDateTime paidDate;
}
