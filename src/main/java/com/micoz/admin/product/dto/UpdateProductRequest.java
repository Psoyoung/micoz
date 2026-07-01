package com.micoz.admin.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

/**
 * 상품 수정 요청 (C-T3, 전체 교체 의미). 자식 동기화 규칙(C-Q4):
 * - 옵션/이미지: seq 있으면 수정, 없으면 신규, 요청에서 빠진 기존 활성 행은 소프트삭제.
 * - 라벨: 차집합 교체(빠진 매핑만 삭제·새 매핑만 삽입·변경 없는 건 미변경).
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateProductRequest {

    @NotBlank
    private String productCode;

    @NotBlank
    private String productName;

    private Long categorySeq;

    @NotNull
    @PositiveOrZero
    private BigDecimal basePrice;

    private String productStatus;
    private String shortDesc;
    private String detailDesc;
    private String ingredientInfo;
    private String usageInfo;
    private String displayYn;

    @Valid
    private List<OptionUpsert> options;

    @Valid
    private List<ImageUpsert> images;

    private List<Long> labelSeqs;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class OptionUpsert {
        /** null=신규, 값 있으면 기존 활성 옵션 수정(미존재 시 PRODUCT_OPTION_NOT_FOUND). */
        private Long optionSeq;
        @NotBlank
        private String optionName;
        @NotNull
        @PositiveOrZero
        private BigDecimal finalPrice;
        private Integer stockQty;
        private Integer sortOrder;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class ImageUpsert {
        /** null=신규, 값 있으면 기존 활성 이미지 수정. */
        private Long imageSeq;
        @NotBlank
        private String imageType;
        @NotBlank
        private String imageUrl;
        private String imageAlt;
        private Integer sortOrder;
    }
}
