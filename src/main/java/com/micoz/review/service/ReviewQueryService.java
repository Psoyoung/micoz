package com.micoz.review.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.micoz.common.response.PageResponse;
import com.micoz.review.dto.ReviewResponse;
import com.micoz.review.entity.Review;
import com.micoz.review.repository.ReviewRepository;
import com.micoz.user.entity.User;
import com.micoz.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewQueryService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getProductReviews(Long productSeq, Pageable pageable) {
        Page<Review> page = reviewRepository.findAllByProductSeqAndUseYnOrderByReviewSeqDesc(productSeq, "Y", pageable);
        return PageResponse.of(toResponses(page.getContent()), page);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getMyReviews(Long userSeq, Pageable pageable) {
        Page<Review> page = reviewRepository.findAllByUserSeqAndUseYnOrderByReviewSeqDesc(userSeq, "Y", pageable);
        return PageResponse.of(toResponses(page.getContent()), page);
    }

    private List<ReviewResponse> toResponses(List<Review> reviews) {
        if (reviews.isEmpty()) return List.of();

        List<Long> userSeqs = reviews.stream().map(Review::getUserSeq).distinct().toList();
        Map<Long, String> userIdById = userRepository.findAllById(userSeqs).stream()
                .collect(Collectors.toMap(User::getUserSeq, u -> maskUserId(u.getUserId())));

        return reviews.stream()
                .map(r -> ReviewResponse.builder()
                        .reviewSeq(r.getReviewSeq())
                        .productSeq(r.getProductSeq())
                        .itemSeq(r.getItemSeq())
                        .userIdMasked(userIdById.get(r.getUserSeq()))
                        .rating(r.getRating())
                        .title(r.getTitle())
                        .content(r.getContent())
                        .imageUrls(deserializeImageUrls(r.getImageUrls()))
                        .createdDate(r.getIDate())
                        .build())
                .toList();
    }

    private List<String> deserializeImageUrls(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private String maskUserId(String userId) {
        if (userId == null || userId.isEmpty()) return userId;
        int len = userId.length();
        if (len <= 2) return userId.charAt(0) + "*";
        int show = Math.max(2, len / 3);
        return userId.substring(0, show) + "*".repeat(Math.min(3, len - show));
    }
}
