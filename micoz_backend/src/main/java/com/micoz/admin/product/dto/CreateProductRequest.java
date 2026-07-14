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
 * 상품 등록 요청 (C-T3). 옵션·이미지·라벨을 한 요청에 함께 등록(부모-자식 일괄, 단일 트랜잭션).
 * 옵션/이미지/라벨은 0개 허용(옵션 없는 단일상품, C-Q4 확정).
 */
@Getter
@Setter
@NoArgsConstructor
public class CreateProductRequest {

    @NotBlank
    private String productCode;

    @NotBlank
    private String productName;

    /** 카테고리(선택). 지정 시 활성 카테고리여야 함. */
    private Long categorySeq;

    @NotNull
    @PositiveOrZero
    private BigDecimal basePrice;

    /** 판매상태(선택). 미지정 시 ON_SALE. */
    private String productStatus;

    private String shortDesc;
    private String detailDesc;
    private String ingredientInfo;
    private String usageInfo;

    /** 노출 여부(Y/N). 미지정 시 Y. */
    private String displayYn;

    @Valid
    private List<OptionInput> options;

    @Valid
    private List<ImageInput> images;

    /** 부여할 라벨 seq(선택). 전부 활성 라벨이어야 함. */
    private List<Long> labelSeqs;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class OptionInput {
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
    public static class ImageInput {
        /** MAIN/SUB/DETAIL */
        @NotBlank
        private String imageType;
        @NotBlank
        private String imageUrl;
        private String imageAlt;
        private Integer sortOrder;
    }
}
