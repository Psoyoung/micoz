package com.micoz.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class ReviewSummaryDto {
    private long count;
    private BigDecimal averageRating;
}
