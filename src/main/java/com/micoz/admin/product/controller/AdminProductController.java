package com.micoz.admin.product.controller;

import com.micoz.admin.product.dto.AdminProductDetailResponse;
import com.micoz.admin.product.dto.AdminProductListItem;
import com.micoz.admin.product.dto.CreateProductRequest;
import com.micoz.admin.product.dto.ProductCreatedResponse;
import com.micoz.admin.product.dto.ProductSearchCondition;
import com.micoz.admin.product.dto.UpdateProductRequest;
import com.micoz.admin.product.dto.UpdateProductStatusRequest;
import com.micoz.admin.product.dto.UpdateStockRequest;
import com.micoz.admin.product.service.AdminProductService;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 상품 관리 — 목록·다축 검색 + 상세 (FR-ADM-04, C-T2).
 * URL 게이팅(/api/v1/admin/**) + 클래스 레벨 @PreAuthorize 2차 방어(F-T4 표준).
 */
@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final AdminProductService adminProductService;

    @GetMapping
    public ApiResponse<PageResponse<AdminProductListItem>> list(
            @ModelAttribute ProductSearchCondition condition,
            @PageableDefault(size = 20, sort = "productSeq", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(adminProductService.search(condition, pageable));
    }

    @GetMapping("/{productSeq}")
    public ApiResponse<AdminProductDetailResponse> detail(@PathVariable Long productSeq) {
        return ApiResponse.success(adminProductService.getDetail(productSeq));
    }

    @PostMapping
    public ApiResponse<ProductCreatedResponse> create(@Valid @RequestBody CreateProductRequest request) {
        return ApiResponse.success(adminProductService.createProduct(request));
    }

    @PutMapping("/{productSeq}")
    public ApiResponse<Void> update(
            @PathVariable Long productSeq,
            @Valid @RequestBody UpdateProductRequest request) {
        adminProductService.updateProduct(productSeq, request);
        return ApiResponse.success();
    }

    @PatchMapping("/{productSeq}/status")
    public ApiResponse<Void> changeStatus(
            @PathVariable Long productSeq,
            @Valid @RequestBody UpdateProductStatusRequest request) {
        adminProductService.changeStatus(productSeq, request.getStatus());
        return ApiResponse.success();
    }

    @PatchMapping("/{productSeq}/options/{optionSeq}/stock")
    public ApiResponse<Void> changeStock(
            @PathVariable Long productSeq,
            @PathVariable Long optionSeq,
            @Valid @RequestBody UpdateStockRequest request) {
        adminProductService.changeStock(productSeq, optionSeq, request.getStockQty());
        return ApiResponse.success();
    }

    /** 소프트삭제(C-T5). 하드삭제는 노출하지 않는다(주문 이력 보존, C-Q5). */
    @DeleteMapping("/{productSeq}")
    public ApiResponse<Void> delete(@PathVariable Long productSeq) {
        adminProductService.deleteProduct(productSeq);
        return ApiResponse.success();
    }
}
