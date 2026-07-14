package com.micoz.admin.category.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

/**
 * 관리자 카테고리 트리 노드 (C-T1). 사용자 측 {@code CategoryNode}와 분리(운영 필드 노출, C-Q1).
 * childCategoryCount/productCount는 삭제 차단 판단 근거(C-Q2)를 노출한다.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminCategoryNode {

    private Long categorySeq;
    private Long parentSeq;
    private String categoryName;
    private String urlSlug;
    private Integer categoryLevel;
    private Integer sortOrder;
    private String displayYn;
    private String useYn;
    private int childCategoryCount;
    private int productCount;
    private List<AdminCategoryNode> children;

    public void addChild(AdminCategoryNode child) {
        if (children == null) children = new ArrayList<>();
        children.add(child);
    }
}
