package com.micoz.order.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderListItem {
    private Long orderSeq;
    private String orderNo;
    private String orderStatus;
    private OffsetDateTime orderDate;
    private BigDecimal finalAmount;
    private String firstItemName;
    private Integer totalItemCount;
    private String mainImageUrl;
}
