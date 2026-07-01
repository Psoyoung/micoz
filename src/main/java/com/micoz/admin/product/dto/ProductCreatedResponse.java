package com.micoz.admin.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** 상품 등록 응답 (C-T3). */
@Getter
@AllArgsConstructor
public class ProductCreatedResponse {
    private final Long productSeq;
    private final String productCode;
}
