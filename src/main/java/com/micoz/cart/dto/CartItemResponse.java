package com.micoz.cart.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CartItemResponse {
    private Long cartSeq;
    private Long productSeq;
    private String productCode;
    private String productName;
    private Long optionSeq;
    private String optionName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal itemTotal;
    private String mainImageUrl;
}
