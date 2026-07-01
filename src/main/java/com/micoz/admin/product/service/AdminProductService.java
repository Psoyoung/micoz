package com.micoz.admin.product.service;

import com.micoz.admin.product.dto.AdminProductDetailResponse;
import com.micoz.admin.product.dto.AdminProductDetailResponse.AdminImageDto;
import com.micoz.admin.product.dto.AdminProductDetailResponse.AdminLabelDto;
import com.micoz.admin.product.dto.AdminProductDetailResponse.AdminOptionDto;
import com.micoz.admin.product.dto.AdminProductListItem;
import com.micoz.admin.product.dto.ProductSearchCondition;
import com.micoz.admin.product.spec.ProductSpecs;
import com.micoz.category.entity.Category;
import com.micoz.category.repository.CategoryRepository;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.product.entity.MapProductLabel;
import com.micoz.product.entity.Product;
import com.micoz.product.entity.ProductLabel;
import com.micoz.product.repository.MapProductLabelRepository;
import com.micoz.product.repository.ProductImageRepository;
import com.micoz.product.repository.ProductLabelRepository;
import com.micoz.product.repository.ProductOptionRepository;
import com.micoz.product.repository.ProductOptionRepository.ProductStockSum;
import com.micoz.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 상품 목록·다축 검색 + 상세 (C-T2). M-T1 검색 패턴(ProductSpecs + SearchCondition + 정렬 화이트리스트
 * + N+1 일괄로드)을 그대로 답습한다.
 */
@Service
@RequiredArgsConstructor
public class AdminProductService {

    private static final String USE_Y = "Y";

    /** 정렬 화이트리스트: API 정렬키 → 엔티티 프로퍼티. 미허용 컬럼 정렬은 400. */
    private static final Map<String, String> SORT_WHITELIST = Map.of(
            "productSeq", "productSeq",
            "productCode", "productCode",
            "productName", "productName",
            "basePrice", "basePrice",
            "productStatus", "productStatus",
            "displayYn", "displayYn",
            "createdDate", "iDate"
    );

    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final ProductImageRepository productImageRepository;
    private final MapProductLabelRepository mapProductLabelRepository;
    private final ProductLabelRepository productLabelRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminProductListItem> search(ProductSearchCondition condition, Pageable pageable) {
        Specification<Product> spec = Specification.where(ProductSpecs.keyword(condition.getQ()))
                .and(ProductSpecs.productCodeLike(condition.getProductCode()))
                .and(ProductSpecs.categorySeqEq(condition.getCategorySeq()))
                .and(ProductSpecs.displayYnEq(condition.getDisplayYn()))
                .and(ProductSpecs.statusEq(condition.getStatus()))
                .and(ProductSpecs.activeOnly(condition.isIncludeDeleted()));

        Page<Product> page = productRepository.findAll(spec, sanitizeSort(pageable));
        List<Product> products = page.getContent();
        if (products.isEmpty()) {
            return PageResponse.of(List.<AdminProductListItem>of(), page);
        }

        List<Long> productSeqs = products.stream().map(Product::getProductSeq).toList();
        Map<Long, String> categoryNameBySeq = loadCategoryNames(products);
        Map<Long, Integer> totalStockByProduct = loadTotalStock(productSeqs);

        List<AdminProductListItem> items = products.stream()
                .map(p -> AdminProductListItem.builder()
                        .productSeq(p.getProductSeq())
                        .productCode(p.getProductCode())
                        .productName(p.getProductName())
                        .productStatus(p.getProductStatus())
                        .categorySeq(p.getCategorySeq())
                        .categoryName(p.getCategorySeq() == null ? null : categoryNameBySeq.get(p.getCategorySeq()))
                        .basePrice(p.getBasePrice())
                        .displayYn(p.getDisplayYn())
                        .useYn(p.getUseYn())
                        .totalStock(totalStockByProduct.getOrDefault(p.getProductSeq(), 0))
                        .createdDate(p.getIDate())
                        .build())
                .toList();
        return PageResponse.of(items, page);
    }

    /** 상세(운영 뷰). 직접 seq 조회 — 소프트삭제 상품도 조회 가능. 미존재면 PRODUCT_NOT_FOUND. */
    @Transactional(readOnly = true)
    public AdminProductDetailResponse getDetail(Long productSeq) {
        Product product = productRepository.findById(productSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        String categoryName = null;
        if (product.getCategorySeq() != null) {
            categoryName = categoryRepository.findById(product.getCategorySeq())
                    .map(Category::getCategoryName).orElse(null);
        }

        List<AdminOptionDto> options = productOptionRepository.findActiveByProductSeq(productSeq).stream()
                .map(o -> AdminOptionDto.builder()
                        .optionSeq(o.getOptionSeq())
                        .optionName(o.getOptionName())
                        .finalPrice(o.getFinalPrice())
                        .stockQty(o.getStockQty())
                        .sortOrder(o.getSortOrder())
                        .useYn(o.getUseYn())
                        .build())
                .toList();

        List<AdminImageDto> images = productImageRepository.findActiveByProductSeq(productSeq).stream()
                .map(i -> AdminImageDto.builder()
                        .imageSeq(i.getImageSeq())
                        .imageType(i.getImageType())
                        .imageUrl(i.getImageUrl())
                        .imageAlt(i.getImageAlt())
                        .sortOrder(i.getSortOrder())
                        .useYn(i.getUseYn())
                        .build())
                .toList();

        List<AdminLabelDto> labels = loadLabels(productSeq);

        return AdminProductDetailResponse.builder()
                .productSeq(product.getProductSeq())
                .productCode(product.getProductCode())
                .productName(product.getProductName())
                .productStatus(product.getProductStatus())
                .categorySeq(product.getCategorySeq())
                .categoryName(categoryName)
                .basePrice(product.getBasePrice())
                .shortDesc(product.getShortDesc())
                .detailDesc(product.getDetailDesc())
                .ingredientInfo(product.getIngredientInfo())
                .usageInfo(product.getUsageInfo())
                .displayYn(product.getDisplayYn())
                .useYn(product.getUseYn())
                .options(options)
                .images(images)
                .labels(labels)
                .createdDate(product.getIDate())
                .lastModifiedDate(product.getUDate())
                .build();
    }

    /** 카테고리명 일괄 조회(목록의 categorySeq 집합 → seq→name). N+1 방지. */
    private Map<Long, String> loadCategoryNames(List<Product> products) {
        List<Long> categorySeqs = products.stream()
                .map(Product::getCategorySeq)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        if (categorySeqs.isEmpty()) {
            return Map.of();
        }
        return categoryRepository.findAllById(categorySeqs).stream()
                .collect(Collectors.toMap(Category::getCategorySeq, Category::getCategoryName, (a, b) -> a));
    }

    /** 상품별 활성 옵션 재고 합 일괄 조회. N+1 방지. */
    private Map<Long, Integer> loadTotalStock(List<Long> productSeqs) {
        Map<Long, Integer> result = new HashMap<>();
        for (ProductStockSum row : productOptionRepository.sumActiveStockByProductSeqIn(productSeqs)) {
            result.put(row.getProductSeq(), (int) row.getTotalStock());
        }
        return result;
    }

    /** 상품에 매핑된 활성 라벨(라벨 sortOrder→name 순). */
    private List<AdminLabelDto> loadLabels(Long productSeq) {
        List<Long> labelSeqs = mapProductLabelRepository.findAllByProductSeq(productSeq).stream()
                .map(MapProductLabel::getLabelSeq)
                .distinct()
                .toList();
        if (labelSeqs.isEmpty()) {
            return List.of();
        }
        return productLabelRepository.findAllById(labelSeqs).stream()
                .filter(l -> USE_Y.equals(l.getUseYn()))
                .sorted(Comparator
                        .comparing(ProductLabel::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(ProductLabel::getLabelName))
                .map(l -> new AdminLabelDto(l.getLabelSeq(), l.getLabelName()))
                .toList();
    }

    /** 정렬 프로퍼티를 화이트리스트로 검증·치환. 미허용 컬럼이면 400. */
    private Pageable sanitizeSort(Pageable pageable) {
        Sort sort = pageable.getSort();
        if (sort.isUnsorted()) {
            return pageable;
        }
        List<Sort.Order> translated = new ArrayList<>();
        for (Sort.Order order : sort) {
            String mapped = SORT_WHITELIST.get(order.getProperty());
            if (mapped == null) {
                throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST);
            }
            translated.add(new Sort.Order(order.getDirection(), mapped));
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(translated));
    }
}
