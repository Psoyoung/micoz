package com.micoz.order.calculator;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class OrderItemInput {
    private Long productSeq;
    private Long optionSeq;
    private BigDecimal unitPrice;
    private int quantity;
}
