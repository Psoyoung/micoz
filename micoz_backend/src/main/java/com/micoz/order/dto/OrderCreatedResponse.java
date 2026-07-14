package com.micoz.order.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderCreatedResponse {
    private Long orderSeq;
    private String orderNo;
    private String orderStatus;
    private BigDecimal itemsTotal;
    private BigDecimal totalDiscount;
    private BigDecimal shippingFee;
    private BigDecimal finalAmount;
    private Integer pointToEarn;
}
