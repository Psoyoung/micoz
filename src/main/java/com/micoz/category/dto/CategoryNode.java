package com.micoz.category.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CategoryNode {
    private Long categorySeq;
    private String categoryName;
    private String urlSlug;
    private Integer sortOrder;
    private List<CategoryNode> children;

    public void addChild(CategoryNode child) {
        if (children == null) children = new ArrayList<>();
        children.add(child);
    }
}
