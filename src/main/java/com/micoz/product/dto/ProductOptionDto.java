package com.micoz.product.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductOptionDto {
    private Long optionSeq;
    private String optionName;
    private BigDecimal finalPrice;
    private Integer stockQty;
    private Integer sortOrder;
}
