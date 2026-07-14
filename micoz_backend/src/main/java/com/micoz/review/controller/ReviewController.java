package com.micoz.review.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.review.dto.CreateReviewRequest;
import com.micoz.review.dto.ReviewResponse;
import com.micoz.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ApiResponse<ReviewResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                              @Valid @RequestBody CreateReviewRequest request) {
        return ApiResponse.success(reviewService.create(principal.getUserSeq(), request));
    }
}
