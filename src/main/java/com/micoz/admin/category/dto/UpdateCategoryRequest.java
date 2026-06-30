package com.micoz.admin.category.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 카테고리 수정 요청 (C-T1). 모든 필드 옵셔널(부분 수정).
 * 부모 이동/레벨 변경은 범위 밖(2단계 고정, C-Q3) — 이름·슬러그·노출·정렬만.
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateCategoryRequest {

    private String categoryName;
    private String urlSlug;
    private Integer sortOrder;
    private String displayYn;
}
