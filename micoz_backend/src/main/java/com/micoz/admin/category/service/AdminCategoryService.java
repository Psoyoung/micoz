package com.micoz.admin.category.service;

import com.micoz.admin.category.dto.AdminCategoryNode;
import com.micoz.admin.category.dto.CategoryCreatedResponse;
import com.micoz.admin.category.dto.CreateCategoryRequest;
import com.micoz.admin.category.dto.UpdateCategoryRequest;
import com.micoz.category.entity.Category;
import com.micoz.category.repository.CategoryRepository;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.product.repository.ProductRepository;
import com.micoz.product.repository.ProductRepository.CategoryProductCount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 카테고리 2단계 트리 CRUD (C-T1).
 * - 트리 조회: 카테고리 1회 로드 + 상품수 1회 집계로 N+1 없이 childCategoryCount/productCount 구성.
 * - 삭제: 활성 하위 카테고리 또는 활성 소속 상품이 있으면 CATEGORY_HAS_CHILDREN(자식 가드, C-Q2).
 * - 2단계 강제: level1만 부모가 될 수 있다(level2 밑 생성 시도 → CATEGORY_INVALID_PARENT).
 */
@Service
@RequiredArgsConstructor
public class AdminCategoryService {

    private static final String USE_Y = "Y";
    private static final int LEVEL_ROOT = 1;
    private static final int LEVEL_CHILD = 2;

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    /** 운영 뷰 2단계 트리. includeDeleted=false면 use_yn='Y'만, true면 전체. */
    @Transactional(readOnly = true)
    public List<AdminCategoryNode> getTree(boolean includeDeleted) {
        List<Category> all = includeDeleted
                ? categoryRepository.findAll()
                : categoryRepository.findAllByUseYn(USE_Y);

        // 정렬: sort_order(널 마지막) → category_seq. 루트·자식 모두 동일 순서로 노출.
        all.sort(Comparator
                .comparing(Category::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Category::getCategorySeq));

        // 활성 소속 상품 수: 1회 집계(category_seq별) — 카테고리 수와 무관하게 쿼리 1건.
        Map<Long, Integer> productCountByCategory = new HashMap<>();
        for (CategoryProductCount row : productRepository.countActiveGroupByCategory()) {
            productCountByCategory.put(row.getCategorySeq(), (int) row.getCount());
        }

        // 활성 하위 카테고리 수: 로드된 목록에서 인메모리 집계(추가 쿼리 없음).
        Map<Long, Integer> activeChildCountByParent = new HashMap<>();
        for (Category c : all) {
            if (c.getParentSeq() != null && USE_Y.equals(c.getUseYn())) {
                activeChildCountByParent.merge(c.getParentSeq(), 1, Integer::sum);
            }
        }

        // 노드 생성(삽입 순서 보존) + 부모-자식 조립.
        Map<Long, AdminCategoryNode> byId = new LinkedHashMap<>();
        for (Category c : all) {
            byId.put(c.getCategorySeq(), AdminCategoryNode.builder()
                    .categorySeq(c.getCategorySeq())
                    .parentSeq(c.getParentSeq())
                    .categoryName(c.getCategoryName())
                    .urlSlug(c.getUrlSlug())
                    .categoryLevel(c.getCategoryLevel())
                    .sortOrder(c.getSortOrder())
                    .displayYn(c.getDisplayYn())
                    .useYn(c.getUseYn())
                    .childCategoryCount(activeChildCountByParent.getOrDefault(c.getCategorySeq(), 0))
                    .productCount(productCountByCategory.getOrDefault(c.getCategorySeq(), 0))
                    .build());
        }

        List<AdminCategoryNode> roots = new ArrayList<>();
        for (Category c : all) {
            AdminCategoryNode node = byId.get(c.getCategorySeq());
            if (c.getParentSeq() == null) {
                roots.add(node);
            } else {
                AdminCategoryNode parent = byId.get(c.getParentSeq());
                if (parent != null) {
                    parent.addChild(node);
                }
                // 부모가 로드 범위 밖(예: 비활성 부모)이면 트리에 매달지 않음(고아 비노출).
            }
        }
        return roots;
    }

    /** 생성. parentSeq null → level1, 값 있으면 부모(level1·활성) 검증 후 level2. */
    @Transactional
    public CategoryCreatedResponse create(CreateCategoryRequest request) {
        String slug = request.getUrlSlug().trim();
        String name = request.getCategoryName().trim();

        int level;
        Long parentSeq = request.getParentSeq();
        if (parentSeq == null) {
            level = LEVEL_ROOT;
        } else {
            Category parent = categoryRepository.findById(parentSeq)
                    .filter(p -> USE_Y.equals(p.getUseYn()))
                    .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
            if (parent.getCategoryLevel() == null || parent.getCategoryLevel() != LEVEL_ROOT) {
                // 부모가 level1이 아니면 3단계가 되므로 차단(2단계 강제).
                throw new BusinessException(ErrorCode.CATEGORY_INVALID_PARENT);
            }
            level = LEVEL_CHILD;
        }

        if (categoryRepository.existsByUrlSlugAndUseYn(slug, USE_Y)) {
            throw new BusinessException(ErrorCode.CATEGORY_DUPLICATED_SLUG);
        }

        Category category = Category.builder()
                .parentSeq(parentSeq)
                .categoryName(name)
                .urlSlug(slug)
                .categoryLevel(level)
                .sortOrder(request.getSortOrder())
                .displayYn(normalizeDisplayYn(request.getDisplayYn()))
                .useYn(USE_Y)
                .build();
        Category saved = categoryRepository.save(category);
        return new CategoryCreatedResponse(saved.getCategorySeq());
    }

    /** 수정(이름·슬러그·노출·정렬). 부모/레벨 불변. 슬러그 변경 시 본인 제외 활성 중복 검사. */
    @Transactional
    public void update(Long categorySeq, UpdateCategoryRequest request) {
        Category category = categoryRepository.findByCategorySeqAndUseYn(categorySeq, USE_Y)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

        String newSlug = null;
        if (request.getUrlSlug() != null && !request.getUrlSlug().isBlank()) {
            newSlug = request.getUrlSlug().trim();
            if (!newSlug.equals(category.getUrlSlug())
                    && categoryRepository.existsByUrlSlugAndUseYnAndCategorySeqNot(newSlug, USE_Y, categorySeq)) {
                throw new BusinessException(ErrorCode.CATEGORY_DUPLICATED_SLUG);
            }
        }
        String newName = (request.getCategoryName() != null && !request.getCategoryName().isBlank())
                ? request.getCategoryName().trim() : null;
        String newDisplay = request.getDisplayYn() != null
                ? normalizeDisplayYn(request.getDisplayYn()) : null;

        category.updateInfo(newName, newSlug, request.getSortOrder(), newDisplay);
    }

    /** 소프트삭제. 활성 하위 카테고리 또는 활성 소속 상품이 있으면 CATEGORY_HAS_CHILDREN. */
    @Transactional
    public void delete(Long categorySeq) {
        Category category = categoryRepository.findByCategorySeqAndUseYn(categorySeq, USE_Y)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

        boolean hasActiveChildCategory = categoryRepository.countByParentSeqAndUseYn(categorySeq, USE_Y) > 0;
        boolean hasActiveProduct = productRepository.countByCategorySeqAndUseYn(categorySeq, USE_Y) > 0;
        if (hasActiveChildCategory || hasActiveProduct) {
            throw new BusinessException(ErrorCode.CATEGORY_HAS_CHILDREN);
        }

        category.softDelete();
    }

    /** 노출 여부 정규화: 'N'만 N, 그 외/미지정은 Y. */
    private String normalizeDisplayYn(String value) {
        return "N".equalsIgnoreCase(value == null ? null : value.trim()) ? "N" : "Y";
    }
}
