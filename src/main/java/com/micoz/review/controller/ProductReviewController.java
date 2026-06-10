package com.micoz.review.controller;

import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import com.micoz.review.dto.ReviewResponse;
import com.micoz.review.service.ReviewQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products/{productSeq}/reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ReviewQueryService reviewQueryService;

    @GetMapping
    public ApiResponse<PageResponse<ReviewResponse>> list(
            @PathVariable Long productSeq,
            @PageableDefault(size = 20, sort = "reviewSeq", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(reviewQueryService.getProductReviews(productSeq, pageable));
    }
}
