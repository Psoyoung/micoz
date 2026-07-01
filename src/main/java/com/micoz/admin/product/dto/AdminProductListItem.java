package com.micoz.admin.product.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** 관리자 상품 목록 항목 (C-T2). 운영 뷰(노출/삭제 여부·재고합 포함). */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminProductListItem {

    private Long productSeq;
    private String productCode;
    private String productName;
    private String productStatus;
    private Long categorySeq;
    private String categoryName;
    private BigDecimal basePrice;
    private String displayYn;
    private String useYn;
    /** 활성 옵션 stock_qty 합(일괄 집계). 옵션 없으면 0. */
    private Integer totalStock;
    private OffsetDateTime createdDate;
}
