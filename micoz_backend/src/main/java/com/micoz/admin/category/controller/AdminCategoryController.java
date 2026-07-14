package com.micoz.admin.category.controller;

import com.micoz.admin.category.dto.AdminCategoryNode;
import com.micoz.admin.category.dto.CategoryCreatedResponse;
import com.micoz.admin.category.dto.CreateCategoryRequest;
import com.micoz.admin.category.dto.UpdateCategoryRequest;
import com.micoz.admin.category.service.AdminCategoryService;
import com.micoz.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 카테고리 2단계 트리 CRUD (FR-ADM-03, C-T1).
 * URL 게이팅(/api/v1/admin/**) + 클래스 레벨 @PreAuthorize 2차 방어(F-T4 표준).
 */
@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final AdminCategoryService adminCategoryService;

    @GetMapping
    public ApiResponse<List<AdminCategoryNode>> tree(
            @RequestParam(defaultValue = "false") boolean includeDeleted) {
        return ApiResponse.success(adminCategoryService.getTree(includeDeleted));
    }

    @PostMapping
    public ApiResponse<CategoryCreatedResponse> create(@Valid @RequestBody CreateCategoryRequest request) {
        return ApiResponse.success(adminCategoryService.create(request));
    }

    @PatchMapping("/{categorySeq}")
    public ApiResponse<Void> update(
            @PathVariable Long categorySeq,
            @Valid @RequestBody UpdateCategoryRequest request) {
        adminCategoryService.update(categorySeq, request);
        return ApiResponse.success();
    }

    @DeleteMapping("/{categorySeq}")
    public ApiResponse<Void> delete(@PathVariable Long categorySeq) {
        adminCategoryService.delete(categorySeq);
        return ApiResponse.success();
    }
}
