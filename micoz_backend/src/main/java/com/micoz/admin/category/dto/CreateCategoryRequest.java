package com.micoz.admin.category.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 카테고리 생성 요청 (C-T1).
 * parentSeq null → 대분류(level1), 값 있으면 중분류(level2). categoryLevel은 서버가 결정.
 */
@Getter
@Setter
@NoArgsConstructor
public class CreateCategoryRequest {

    /** 상위 카테고리(null=대분류). 값이 있으면 그 부모는 반드시 level1이어야 함(3단계 금지). */
    private Long parentSeq;

    @NotBlank
    private String categoryName;

    @NotBlank
    private String urlSlug;

    private Integer sortOrder;

    /** 노출 여부(Y/N). 미지정 시 Y. */
    private String displayYn;
}
