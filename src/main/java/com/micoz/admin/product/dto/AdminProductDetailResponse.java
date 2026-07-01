package com.micoz.admin.product.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 관리자 상품 상세 (C-T2). 운영 뷰 — 활성 옵션·이미지·라벨 포함.
 * 자식 DTO는 본 응답 전용이라 중첩 정적 클래스로 둔다.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminProductDetailResponse {

    private Long productSeq;
    private String productCode;
    private String productName;
    private String productStatus;
    private Long categorySeq;
    private String categoryName;
    private BigDecimal basePrice;
    private String shortDesc;
    private String detailDesc;
    private String ingredientInfo;
    private String usageInfo;
    private String displayYn;
    private String useYn;
    private List<AdminOptionDto> options;
    private List<AdminImageDto> images;
    private List<AdminLabelDto> labels;
    private OffsetDateTime createdDate;
    private OffsetDateTime lastModifiedDate;

    @Getter
    @Builder
    public static class AdminOptionDto {
        private Long optionSeq;
        private String optionName;
        private BigDecimal finalPrice;
        private Integer stockQty;
        private Integer sortOrder;
        private String useYn;
    }

    @Getter
    @Builder
    public static class AdminImageDto {
        private Long imageSeq;
        private String imageType;
        private String imageUrl;
        private String imageAlt;
        private Integer sortOrder;
        private String useYn;
    }

    @Getter
    @AllArgsConstructor
    public static class AdminLabelDto {
        private Long labelSeq;
        private String labelName;
    }
}
