package com.micoz.order.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderItemSnapshot {
    private Long itemSeq;
    private Long productSeq;
    private Long optionSeq;
    private String productCode;
    private String productName;
    private String optionName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal itemAmount;
    private String mainImageUrl;
}
