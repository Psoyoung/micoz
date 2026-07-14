package com.micoz.order.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderPaymentInfo {
    private String paymentType;
    private String paymentStatus;
    private BigDecimal paidAmount;
    private String cardCompany;
    private String cardNoMasked;
    private Integer installment;
    private String approvalNo;
    private OffsetDateTime paidDate;
}
