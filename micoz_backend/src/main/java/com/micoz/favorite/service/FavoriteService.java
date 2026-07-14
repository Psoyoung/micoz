package com.micoz.favorite.service;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.favorite.dto.ToggleFavResponse;
import com.micoz.favorite.entity.ProductFav;
import com.micoz.favorite.repository.ProductFavRepository;
import com.micoz.product.dto.ProductListItem;
import com.micoz.product.entity.Product;
import com.micoz.product.repository.ProductRepository;
import com.micoz.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final ProductFavRepository productFavRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    @Transactional
    public ToggleFavResponse toggle(Long userSeq, Long productSeq) {
        productRepository.findVisibleByProductSeq(productSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductFav.ProductFavId id = new ProductFav.ProductFavId(userSeq, productSeq);
        if (productFavRepository.existsById(id)) {
            productFavRepository.deleteById(id);
            return new ToggleFavResponse(productSeq, false);
        }
        productFavRepository.save(new ProductFav(userSeq, productSeq));
        return new ToggleFavResponse(productSeq, true);
    }

    @Transactional
    public void remove(Long userSeq, Long productSeq) {
        ProductFav.ProductFavId id = new ProductFav.ProductFavId(userSeq, productSeq);
        if (productFavRepository.existsById(id)) {
            productFavRepository.deleteById(id);
        }
        // 없어도 멱등 200
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductListItem> getMyFavorites(Long userSeq, Pageable pageable) {
        Page<ProductFav> page = productFavRepository.findAllByUserSeq(userSeq, pageable);
        List<ProductFav> favs = page.getContent();
        if (favs.isEmpty()) {
            return PageResponse.of(List.<ProductListItem>of(), page);
        }

        // 페이지 내 순서를 유지하기 위해 ProductFav 순서대로 응답 정렬
        List<Long> productSeqs = favs.stream().map(ProductFav::getProductSeq).toList();
        List<Product> products = productRepository.findAllByProductSeqInAndUseYnAndDisplayYn(productSeqs, "Y", "Y");
        Map<Long, Product> productById = new HashMap<>();
        for (Product p : products) productById.put(p.getProductSeq(), p);

        List<Product> ordered = favs.stream()
                .map(f -> productById.get(f.getProductSeq()))
                .filter(java.util.Objects::nonNull)
                .toList();

        List<ProductListItem> items = productService.toListItems(ordered);

        // toListItems 내부 정렬과 페이지 내 순서가 다를 수 있으므로 productSeq 기준 매핑 → favs 순서 재구성
        Map<Long, ProductListItem> byProductSeq = new HashMap<>();
        for (ProductListItem item : items) byProductSeq.put(item.getProductSeq(), item);
        List<ProductListItem> orderedItems = favs.stream()
                .map(f -> byProductSeq.get(f.getProductSeq()))
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator.comparing(ProductListItem::getProductSeq, Comparator.naturalOrder()))
                .toList();

        return PageResponse.of(orderedItems, page);
    }
}
