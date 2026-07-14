package com.micoz.category.service;

import com.micoz.category.dto.CategoryNode;
import com.micoz.category.entity.Category;
import com.micoz.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * 노출 가능한 카테고리를 1회 조회 후 메모리에서 parent-child 트리로 조립.
     */
    @Transactional(readOnly = true)
    public List<CategoryNode> getVisibleTree() {
        List<Category> all = categoryRepository.findAllVisible();

        Map<Long, CategoryNode> byId = new HashMap<>();
        for (Category c : all) {
            byId.put(c.getCategorySeq(), CategoryNode.builder()
                    .categorySeq(c.getCategorySeq())
                    .categoryName(c.getCategoryName())
                    .urlSlug(c.getUrlSlug())
                    .sortOrder(c.getSortOrder())
                    .build());
        }

        List<CategoryNode> roots = new ArrayList<>();
        for (Category c : all) {
            CategoryNode node = byId.get(c.getCategorySeq());
            if (c.getParentSeq() == null) {
                roots.add(node);
            } else {
                CategoryNode parent = byId.get(c.getParentSeq());
                if (parent != null) {
                    parent.addChild(node);
                }
            }
        }
        return roots;
    }
}
