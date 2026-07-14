package com.micoz.product.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductListItem {
    private Long productSeq;
    private String productCode;
    private String productName;
    private String productStatus;
    private BigDecimal basePrice;
    private String shortDesc;
    private String mainImageUrl;
    private List<String> labels;
}
