package com.micoz.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@AllArgsConstructor
public class CartListResponse {
    private List<CartItemResponse> items;
    private int itemCount;
    private BigDecimal totalAmount;
}
