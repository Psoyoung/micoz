package com.micoz.product.controller;

import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import com.micoz.product.dto.ProductDetailResponse;
import com.micoz.product.dto.ProductListItem;
import com.micoz.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<PageResponse<ProductListItem>> getProducts(
            @RequestParam(value = "categorySeq", required = false) Long categorySeq,
            @PageableDefault(size = 20, sort = "productSeq", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.success(productService.getList(categorySeq, pageable));
    }

    @GetMapping("/{productSeq}")
    public ApiResponse<ProductDetailResponse> getProductDetail(@PathVariable Long productSeq) {
        return ApiResponse.success(productService.getDetail(productSeq));
    }

    @GetMapping("/featured")
    public ApiResponse<java.util.List<ProductListItem>> getFeatured(
            @RequestParam(value = "label", defaultValue = "BEST") String label,
            @RequestParam(value = "limit", defaultValue = "4") int limit
    ) {
        return ApiResponse.success(productService.getFeatured(label, limit));
    }
}
