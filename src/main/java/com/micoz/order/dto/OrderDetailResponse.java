package com.micoz.order.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderDetailResponse {
    private Long orderSeq;
    private String orderNo;
    private String orderStatus;
    private OffsetDateTime orderDate;
    private BigDecimal itemsTotal;
    private BigDecimal totalDiscount;
    private BigDecimal couponDiscount;
    private Integer pointUsed;
    private BigDecimal shippingFee;
    private BigDecimal finalAmount;
    private Integer pointToEarn;
    private List<OrderItemSnapshot> items;
    private OrderShippingInfo shipping;
    private OrderPaymentInfo payment;
}
