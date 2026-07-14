package com.micoz.returns.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReturnItemDto {
    private Long returnItemSeq;
    private Long itemSeq;
    private Long productSeq;
    private String productName;
    private String optionName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private Long exchangeOptionSeq;
    private String exchangeOptionName;
}
