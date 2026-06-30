package com.micoz.admin.category.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** 카테고리 생성 응답 (C-T1). */
@Getter
@AllArgsConstructor
public class CategoryCreatedResponse {
    private final Long categorySeq;
}
