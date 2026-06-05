package com.micoz.category.controller;

import com.micoz.category.dto.CategoryNode;
import com.micoz.category.service.CategoryService;
import com.micoz.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryNode>> getCategories() {
        return ApiResponse.success(categoryService.getVisibleTree());
    }
}
