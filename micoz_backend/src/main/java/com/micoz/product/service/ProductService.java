package com.micoz.product.service;

import com.micoz.category.entity.Category;
import com.micoz.category.repository.CategoryRepository;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.product.dto.CategoryRefDto;
import com.micoz.product.dto.ProductDetailResponse;
import com.micoz.product.dto.ProductImageDto;
import com.micoz.product.dto.ProductListItem;
import com.micoz.product.dto.ProductOptionDto;
import com.micoz.product.dto.ReviewSummaryDto;
import com.micoz.product.entity.MapProductLabel;
import com.micoz.product.entity.Product;
import com.micoz.product.entity.ProductImage;
import com.micoz.product.entity.ProductLabel;
import com.micoz.product.entity.ProductOption;
import com.micoz.product.repository.MapProductLabelRepository;
import com.micoz.product.repository.ProductImageRepository;
import com.micoz.product.repository.ProductLabelRepository;
import com.micoz.product.repository.ProductOptionRepository;
import com.micoz.product.repository.ProductRepository;
import com.micoz.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final ProductImageRepository productImageRepository;
    private final MapProductLabelRepository mapProductLabelRepository;
    private final ProductLabelRepository productLabelRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProductListItem> getList(Long categorySeq, Pageable pageable) {
        Page<Product> page = (categorySeq == null)
                ? productRepository.findAllByUseYnAndDisplayYn("Y", "Y", pageable)
                : productRepository.findAllByCategorySeqAndUseYnAndDisplayYn(categorySeq, "Y", "Y", pageable);

        List<Product> products = page.getContent();
        if (products.isEmpty()) {
            return PageResponse.of(List.<ProductListItem>of(), page);
        }

        List<Long> productSeqs = products.stream().map(Product::getProductSeq).toList();
        Map<Long, String> mainImageUrlByProduct = loadMainImageUrls(productSeqs);
        Map<Long, List<String>> labelsByProduct = loadLabels(productSeqs);

        List<ProductListItem> items = products.stream()
                .map(p -> ProductListItem.builder()
                        .productSeq(p.getProductSeq())
                        .productCode(p.getProductCode())
                        .productName(p.getProductName())
                        .productStatus(p.getProductStatus())
                        .basePrice(p.getBasePrice())
                        .shortDesc(p.getShortDesc())
                        .mainImageUrl(mainImageUrlByProduct.get(p.getProductSeq()))
                        .labels(labelsByProduct.getOrDefault(p.getProductSeq(), List.of()))
                        .build())
                .toList();

        return PageResponse.of(items, page);
    }

    @Transactional(readOnly = true)
    public List<ProductListItem> getFeatured(String labelName, int limit) {
        if (labelName == null || labelName.isBlank()) return List.of();
        ProductLabel label = productLabelRepository.findActiveByLabelName(labelName).orElse(null);
        if (label == null) return List.of();

        List<Long> productSeqs = mapProductLabelRepository.findAllByLabelSeq(label.getLabelSeq()).stream()
                .map(MapProductLabel::getProductSeq)
                .distinct()
                .toList();
        if (productSeqs.isEmpty()) return List.of();

        List<Product> products = productRepository
                .findAllByProductSeqInAndUseYnAndDisplayYn(productSeqs, "Y", "Y").stream()
                .sorted(Comparator.comparing(Product::getProductSeq).reversed())
                .limit(Math.max(1, limit))
                .toList();
        if (products.isEmpty()) return List.of();

        List<Long> displayedSeqs = products.stream().map(Product::getProductSeq).toList();
        Map<Long, String> mainImageUrlByProduct = loadMainImageUrls(displayedSeqs);
        Map<Long, List<String>> labelsByProduct = loadLabels(displayedSeqs);

        return products.stream()
                .map(p -> ProductListItem.builder()
                        .productSeq(p.getProductSeq())
                        .productCode(p.getProductCode())
                        .productName(p.getProductName())
                        .productStatus(p.getProductStatus())
                        .basePrice(p.getBasePrice())
                        .shortDesc(p.getShortDesc())
                        .mainImageUrl(mainImageUrlByProduct.get(p.getProductSeq()))
                        .labels(labelsByProduct.getOrDefault(p.getProductSeq(), List.of()))
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getDetail(Long productSeq) {
        Product product = productRepository.findVisibleByProductSeq(productSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        // 카테고리 정보
        CategoryRefDto categoryDto = null;
        if (product.getCategorySeq() != null) {
            Category category = categoryRepository.findById(product.getCategorySeq()).orElse(null);
            if (category != null && "Y".equals(category.getUseYn())) {
                categoryDto = new CategoryRefDto(
                        category.getCategorySeq(), category.getCategoryName(), category.getUrlSlug());
            }
        }

        // 이미지 (MAIN/SUB/DETAIL 전체)
        List<ProductImageDto> imageDtos = productImageRepository
                .findActiveByProductSeq(productSeq).stream()
                .map(i -> ProductImageDto.builder()
                        .imageSeq(i.getImageSeq())
                        .imageType(i.getImageType())
                        .imageUrl(i.getImageUrl())
                        .imageAlt(i.getImageAlt())
                        .sortOrder(i.getSortOrder())
                        .build())
                .toList();

        // 옵션
        List<ProductOptionDto> optionDtos = productOptionRepository
                .findActiveByProductSeq(productSeq).stream()
                .map(o -> ProductOptionDto.builder()
                        .optionSeq(o.getOptionSeq())
                        .optionName(o.getOptionName())
                        .finalPrice(o.getFinalPrice())
                        .stockQty(o.getStockQty())
                        .sortOrder(o.getSortOrder())
                        .build())
                .toList();

        // 라벨 (이름 정렬순)
        List<String> labelNames = loadLabels(List.of(productSeq)).getOrDefault(productSeq, List.of());

        // 리뷰 요약
        long count = reviewRepository.countActiveByProductSeq(productSeq);
        Double avg = reviewRepository.averageRatingByProductSeq(productSeq);
        BigDecimal averageRating = (avg == null)
                ? BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP);

        return ProductDetailResponse.builder()
                .productSeq(product.getProductSeq())
                .productCode(product.getProductCode())
                .productName(product.getProductName())
                .productStatus(product.getProductStatus())
                .basePrice(product.getBasePrice())
                .shortDesc(product.getShortDesc())
                .detailDesc(product.getDetailDesc())
                .ingredientInfo(product.getIngredientInfo())
                .usageInfo(product.getUsageInfo())
                .category(categoryDto)
                .images(imageDtos)
                .options(optionDtos)
                .labels(labelNames)
                .reviewSummary(new ReviewSummaryDto(count, averageRating))
                .build();
    }

    /**
     * Product 리스트를 ProductListItem 리스트로 변환 (mainImage + labels 일괄 조회).
     * M3 찜 목록 등 외부 도메인에서 재사용.
     */
    @Transactional(readOnly = true)
    public List<ProductListItem> toListItems(List<Product> products) {
        if (products == null || products.isEmpty()) return List.of();
        List<Long> productSeqs = products.stream().map(Product::getProductSeq).toList();
        Map<Long, String> mainImageUrlByProduct = loadMainImageUrls(productSeqs);
        Map<Long, List<String>> labelsByProduct = loadLabels(productSeqs);
        return products.stream()
                .map(p -> ProductListItem.builder()
                        .productSeq(p.getProductSeq())
                        .productCode(p.getProductCode())
                        .productName(p.getProductName())
                        .productStatus(p.getProductStatus())
                        .basePrice(p.getBasePrice())
                        .shortDesc(p.getShortDesc())
                        .mainImageUrl(mainImageUrlByProduct.get(p.getProductSeq()))
                        .labels(labelsByProduct.getOrDefault(p.getProductSeq(), List.of()))
                        .build())
                .toList();
    }

    private Map<Long, String> loadMainImageUrls(Collection<Long> productSeqs) {
        List<ProductImage> images = productImageRepository
                .findAllByProductSeqInAndImageTypeAndUseYn(productSeqs, "MAIN", "Y");
        Map<Long, String> result = new HashMap<>();
        images.stream()
                .sorted(Comparator.comparing(ProductImage::getSortOrder,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .forEach(img -> result.putIfAbsent(img.getProductSeq(), img.getImageUrl()));
        return result;
    }

    private Map<Long, List<String>> loadLabels(Collection<Long> productSeqs) {
        List<MapProductLabel> mappings = mapProductLabelRepository.findAllByProductSeqIn(productSeqs);
        if (mappings.isEmpty()) return Map.of();

        List<Long> labelSeqs = mappings.stream().map(MapProductLabel::getLabelSeq).distinct().toList();
        Map<Long, ProductLabel> labelById = productLabelRepository.findAllById(labelSeqs).stream()
                .collect(Collectors.toMap(ProductLabel::getLabelSeq, l -> l));

        Map<Long, List<String>> result = new HashMap<>();
        for (MapProductLabel m : mappings) {
            ProductLabel label = labelById.get(m.getLabelSeq());
            if (label == null || !"Y".equals(label.getUseYn())) continue;
            result.computeIfAbsent(m.getProductSeq(), k -> new java.util.ArrayList<>()).add(label.getLabelName());
        }
        // sortOrder 정렬
        result.forEach((seq, names) -> names.sort(Comparator.comparingInt(n -> {
            ProductLabel l = labelById.values().stream()
                    .filter(x -> x.getLabelName().equals(n)).findFirst().orElse(null);
            return l == null || l.getSortOrder() == null ? Integer.MAX_VALUE : l.getSortOrder();
        })));
        return result;
    }
}
