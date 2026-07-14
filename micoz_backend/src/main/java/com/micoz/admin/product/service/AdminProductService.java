package com.micoz.admin.product.service;

import com.micoz.admin.product.dto.AdminProductDetailResponse;
import com.micoz.admin.product.dto.AdminProductDetailResponse.AdminImageDto;
import com.micoz.admin.product.dto.AdminProductDetailResponse.AdminLabelDto;
import com.micoz.admin.product.dto.AdminProductDetailResponse.AdminOptionDto;
import com.micoz.admin.product.dto.AdminProductListItem;
import com.micoz.admin.product.dto.CreateProductRequest;
import com.micoz.admin.product.dto.ProductCreatedResponse;
import com.micoz.admin.product.dto.ProductSearchCondition;
import com.micoz.admin.product.dto.UpdateProductRequest;
import com.micoz.admin.product.spec.ProductSpecs;
import com.micoz.category.entity.Category;
import com.micoz.category.repository.CategoryRepository;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.product.entity.MapProductLabel;
import com.micoz.product.entity.Product;
import com.micoz.product.entity.ProductImage;
import com.micoz.product.entity.ProductLabel;
import com.micoz.product.entity.ProductOption;
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
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 상품 목록·다축 검색 + 상세 (C-T2). M-T1 검색 패턴(ProductSpecs + SearchCondition + 정렬 화이트리스트
 * + N+1 일괄로드)을 그대로 답습한다.
 */
@Service
@RequiredArgsConstructor
public class AdminProductService {

    private static final String USE_Y = "Y";
    private static final String DEFAULT_STATUS = "ON_SALE";

    /** 허용 판매상태 (C-T4). 등록·수정·상태변경 모든 경로가 동일 화이트리스트를 태운다. */
    private static final Set<String> ALLOWED_STATUSES = Set.of("ON_SALE", "LOW_STOCK", "SOLD_OUT", "STOPPED");

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
    private final OrderItemRepository orderItemRepository;

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

    /**
     * 상품 등록 (C-T3). 옵션·이미지·라벨을 한 요청에 함께 등록 — 단일 트랜잭션 원자성
     * (자식 일부 실패 시 상품까지 전체 롤백). 옵션/이미지/라벨 0개 허용(C-Q4).
     */
    @Transactional
    public ProductCreatedResponse createProduct(CreateProductRequest req) {
        String code = req.getProductCode().trim();
        if (productRepository.existsByProductCodeAndUseYn(code, USE_Y)) {
            throw new BusinessException(ErrorCode.PRODUCT_DUPLICATED_CODE);
        }
        validateCategoryActive(req.getCategorySeq());
        validateLabelsActive(req.getLabelSeqs());

        Product product = Product.builder()
                .productCode(code)
                .productName(req.getProductName().trim())
                .productStatus(resolveStatus(req.getProductStatus()))
                .categorySeq(req.getCategorySeq())
                .basePrice(req.getBasePrice())
                .shortDesc(req.getShortDesc())
                .detailDesc(req.getDetailDesc())
                .ingredientInfo(req.getIngredientInfo())
                .usageInfo(req.getUsageInfo())
                .displayYn(normalizeYn(req.getDisplayYn()))
                .useYn(USE_Y)
                .build();
        Long productSeq = productRepository.save(product).getProductSeq();

        if (req.getOptions() != null) {
            for (CreateProductRequest.OptionInput o : req.getOptions()) {
                productOptionRepository.save(ProductOption.builder()
                        .productSeq(productSeq)
                        .optionName(o.getOptionName().trim())
                        .finalPrice(o.getFinalPrice())
                        .stockQty(o.getStockQty())
                        .sortOrder(o.getSortOrder())
                        .build());
            }
        }
        if (req.getImages() != null) {
            for (CreateProductRequest.ImageInput i : req.getImages()) {
                productImageRepository.save(ProductImage.builder()
                        .productSeq(productSeq)
                        .imageType(i.getImageType().trim())
                        .imageUrl(i.getImageUrl())
                        .imageAlt(i.getImageAlt())
                        .sortOrder(i.getSortOrder())
                        .build());
            }
        }
        insertLabels(productSeq, req.getLabelSeqs());
        return new ProductCreatedResponse(productSeq, code);
    }

    /**
     * 상품 수정 (C-T3). 단일 트랜잭션. 본문 갱신 + 자식 동기화(C-Q4):
     * 옵션/이미지 seq upsert(빠진 기존은 소프트삭제), 라벨 차집합 교체.
     */
    @Transactional
    public void updateProduct(Long productSeq, UpdateProductRequest req) {
        Product product = productRepository.findById(productSeq)
                .filter(p -> USE_Y.equals(p.getUseYn()))
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        String code = req.getProductCode().trim();
        if (!code.equals(product.getProductCode())
                && productRepository.existsByProductCodeAndUseYnAndProductSeqNot(code, USE_Y, productSeq)) {
            throw new BusinessException(ErrorCode.PRODUCT_DUPLICATED_CODE);
        }
        validateCategoryActive(req.getCategorySeq());
        validateLabelsActive(req.getLabelSeqs());

        product.updateInfo(code, req.getProductName().trim(), resolveStatus(req.getProductStatus()),
                req.getCategorySeq(), req.getBasePrice(), req.getShortDesc(), req.getDetailDesc(),
                req.getIngredientInfo(), req.getUsageInfo(), normalizeYn(req.getDisplayYn()));

        syncOptions(productSeq, req.getOptions());
        syncImages(productSeq, req.getImages());
        syncLabels(productSeq, req.getLabelSeqs());
    }

    // 카테고리 활성 검증(선택 필드). 지정됐는데 활성 아니면 CATEGORY_NOT_FOUND.
    private void validateCategoryActive(Long categorySeq) {
        if (categorySeq == null) {
            return;
        }
        categoryRepository.findByCategorySeqAndUseYn(categorySeq, USE_Y)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
    }

    // 라벨 전부 활성 검증. 하나라도 미존재/비활성이면 LABEL_NOT_FOUND.
    private void validateLabelsActive(List<Long> labelSeqs) {
        if (labelSeqs == null || labelSeqs.isEmpty()) {
            return;
        }
        Set<Long> distinct = new LinkedHashSet<>(labelSeqs);
        long activeCount = productLabelRepository.findAllById(distinct).stream()
                .filter(l -> USE_Y.equals(l.getUseYn()))
                .count();
        if (activeCount != distinct.size()) {
            throw new BusinessException(ErrorCode.LABEL_NOT_FOUND);
        }
    }

    private void insertLabels(Long productSeq, List<Long> labelSeqs) {
        if (labelSeqs == null) {
            return;
        }
        for (Long labelSeq : new LinkedHashSet<>(labelSeqs)) {
            mapProductLabelRepository.save(new MapProductLabel(productSeq, labelSeq));
        }
    }

    // 옵션 seq upsert: seq 있으면 수정(미존재 시 PRODUCT_OPTION_NOT_FOUND), 없으면 신규,
    // 요청에서 빠진 기존 활성 옵션은 소프트삭제.
    private void syncOptions(Long productSeq, List<UpdateProductRequest.OptionUpsert> inputs) {
        Map<Long, ProductOption> existing = productOptionRepository.findActiveByProductSeq(productSeq).stream()
                .collect(Collectors.toMap(ProductOption::getOptionSeq, o -> o));
        Set<Long> kept = new HashSet<>();
        if (inputs != null) {
            for (UpdateProductRequest.OptionUpsert in : inputs) {
                if (in.getOptionSeq() != null) {
                    ProductOption opt = existing.get(in.getOptionSeq());
                    if (opt == null) {
                        throw new BusinessException(ErrorCode.PRODUCT_OPTION_NOT_FOUND);
                    }
                    opt.updateInfo(in.getOptionName().trim(), in.getFinalPrice(), in.getStockQty(), in.getSortOrder());
                    kept.add(in.getOptionSeq());
                } else {
                    productOptionRepository.save(ProductOption.builder()
                            .productSeq(productSeq)
                            .optionName(in.getOptionName().trim())
                            .finalPrice(in.getFinalPrice())
                            .stockQty(in.getStockQty())
                            .sortOrder(in.getSortOrder())
                            .build());
                }
            }
        }
        for (ProductOption opt : existing.values()) {
            if (!kept.contains(opt.getOptionSeq())) {
                opt.softDelete();
            }
        }
    }

    // 이미지 seq upsert(옵션과 동일 규칙). 미존재 imageSeq는 PRODUCT_IMAGE_NOT_FOUND(404)
    // — 옵션(PRODUCT_OPTION_NOT_FOUND)과 대칭.
    private void syncImages(Long productSeq, List<UpdateProductRequest.ImageUpsert> inputs) {
        Map<Long, ProductImage> existing = productImageRepository.findActiveByProductSeq(productSeq).stream()
                .collect(Collectors.toMap(ProductImage::getImageSeq, i -> i));
        Set<Long> kept = new HashSet<>();
        if (inputs != null) {
            for (UpdateProductRequest.ImageUpsert in : inputs) {
                if (in.getImageSeq() != null) {
                    ProductImage img = existing.get(in.getImageSeq());
                    if (img == null) {
                        throw new BusinessException(ErrorCode.PRODUCT_IMAGE_NOT_FOUND);
                    }
                    img.updateInfo(in.getImageType().trim(), in.getImageUrl(), in.getImageAlt(), in.getSortOrder());
                    kept.add(in.getImageSeq());
                } else {
                    productImageRepository.save(ProductImage.builder()
                            .productSeq(productSeq)
                            .imageType(in.getImageType().trim())
                            .imageUrl(in.getImageUrl())
                            .imageAlt(in.getImageAlt())
                            .sortOrder(in.getSortOrder())
                            .build());
                }
            }
        }
        for (ProductImage img : existing.values()) {
            if (!kept.contains(img.getImageSeq())) {
                img.softDelete();
            }
        }
    }

    // 라벨 차집합 교체(C-Q4): 빠진 매핑만 삭제, 새 매핑만 삽입, 변경 없는 건 미변경.
    private void syncLabels(Long productSeq, List<Long> requestedList) {
        Set<Long> current = mapProductLabelRepository.findAllByProductSeq(productSeq).stream()
                .map(MapProductLabel::getLabelSeq)
                .collect(Collectors.toCollection(HashSet::new));
        Set<Long> requested = requestedList == null ? Set.of() : new LinkedHashSet<>(requestedList);

        for (Long seq : requested) {
            if (!current.contains(seq)) {
                mapProductLabelRepository.save(new MapProductLabel(productSeq, seq));
            }
        }
        List<MapProductLabel.MapProductLabelId> toRemove = current.stream()
                .filter(seq -> !requested.contains(seq))
                .map(seq -> new MapProductLabel.MapProductLabelId(productSeq, seq))
                .toList();
        if (!toRemove.isEmpty()) {
            mapProductLabelRepository.deleteAllById(toRemove);
        }
    }

    /**
     * 판매상태 변경 (C-T4). 화이트리스트 외면 PRODUCT_INVALID_STATUS.
     */
    @Transactional
    public void changeStatus(Long productSeq, String status) {
        Product product = productRepository.findById(productSeq)
                .filter(p -> USE_Y.equals(p.getUseYn()))
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        product.changeStatus(validateStatus(status));
    }

    /**
     * 옵션 재고 설정 (C-T4, 절대값). 음수면 COMMON_VALIDATION_ERROR,
     * 옵션이 해당 상품 소속·활성이 아니면 PRODUCT_OPTION_NOT_FOUND.
     */
    @Transactional
    public void changeStock(Long productSeq, Long optionSeq, Integer stockQty) {
        if (stockQty == null || stockQty < 0) {
            throw new BusinessException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        productRepository.findById(productSeq)
                .filter(p -> USE_Y.equals(p.getUseYn()))
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        ProductOption option = productOptionRepository
                .findByOptionSeqAndProductSeqAndUseYn(optionSeq, productSeq, USE_Y)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_OPTION_NOT_FOUND));
        option.changeStock(stockQty);
    }

    /**
     * 상품 소프트삭제 (C-T5, 노출 API). 항상 use_yn='N' + display_yn='N'로 처리하고
     * 옵션·이미지도 동반 소프트삭제한다. 주문 이력 유무와 무관히 성공(스냅샷은 dat_order_item에 보존).
     * 단일 트랜잭션(조회+상태변경).
     */
    @Transactional
    public void deleteProduct(Long productSeq) {
        Product product = productRepository.findById(productSeq)
                .filter(p -> USE_Y.equals(p.getUseYn()))
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        product.softDelete();
        productOptionRepository.findActiveByProductSeq(productSeq).forEach(ProductOption::softDelete);
        productImageRepository.findActiveByProductSeq(productSeq).forEach(ProductImage::softDelete);
    }

    /**
     * 상품 하드삭제 (C-T5, 미노출 — 향후 일괄정리/관리 배치 경로용). 주문 이력(dat_order_item 참조)이
     * 있으면 스냅샷/이력 보존을 위해 물리삭제를 금지한다 → PRODUCT_HAS_ORDERS. 단일 트랜잭션(검사+삭제).
     *
     * <p><b>주의</b>: 현재 어떤 컨트롤러도 이 메서드를 호출하지 않는다(노출 API는 소프트삭제뿐).
     * 배치/일괄정리 경로가 생기면 활성화되므로 방어적으로 유지한다(미사용 오인 삭제 금지).
     * M-T6 {@code assertNotLastAdmin} 선례와 동일한 방어 가드다. 단위검증: AdminProductCommandIntegrationTest.
     */
    @Transactional
    public void hardDeleteProduct(Long productSeq) {
        Product product = productRepository.findById(productSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        if (orderItemRepository.existsByProductSeq(productSeq)) {
            throw new BusinessException(ErrorCode.PRODUCT_HAS_ORDERS);
        }
        mapProductLabelRepository.deleteByProductSeq(productSeq);
        productOptionRepository.deleteByProductSeq(productSeq);
        productImageRepository.deleteByProductSeq(productSeq);
        productRepository.delete(product);
    }

    // 등록/수정 경로: blank→기본(ON_SALE), 그 외는 화이트리스트 검증(C-T4 통합 — 등록으로 새는 경로 차단).
    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return DEFAULT_STATUS;
        }
        return validateStatus(status);
    }

    // 상태 화이트리스트 검증. 통과 시 정규화(대문자) 반환, 외면 PRODUCT_INVALID_STATUS.
    private String validateStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new BusinessException(ErrorCode.PRODUCT_INVALID_STATUS);
        }
        return normalized;
    }

    private String normalizeYn(String value) {
        return "N".equalsIgnoreCase(value == null ? null : value.trim()) ? "N" : "Y";
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
