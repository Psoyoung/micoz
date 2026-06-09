package com.micoz.order.calculator;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class OrderAmount {
    private BigDecimal itemsTotal;
    private BigDecimal totalDiscount;
    private BigDecimal shippingFee;
    private BigDecimal finalAmount;
    private int pointToEarn;
}
