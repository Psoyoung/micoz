package com.micoz.review.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.order.entity.Order;
import com.micoz.order.entity.OrderItem;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.order.repository.OrderRepository;
import com.micoz.review.dto.CreateReviewRequest;
import com.micoz.review.dto.ReviewResponse;
import com.micoz.review.entity.Review;
import com.micoz.review.repository.ReviewRepository;
import com.micoz.user.entity.User;
import com.micoz.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public ReviewResponse create(Long userSeq, CreateReviewRequest request) {
        // 1. orderItem 조회
        OrderItem orderItem = orderItemRepository.findById(request.getItemSeq())
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_ALLOWED));

        // 2. 본인 주문 + DELIVERED 검증
        Order order = orderRepository.findById(orderItem.getOrderSeq())
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_ALLOWED));
        if (!userSeq.equals(order.getUserSeq())) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_ALLOWED);
        }
        if (!"DELIVERED".equals(order.getOrderStatus())) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_ALLOWED);
        }

        // 3. 중복 작성 차단
        if (reviewRepository.findActiveByUserSeqAndItemSeq(userSeq, request.getItemSeq()).isPresent()) {
            throw new BusinessException(ErrorCode.REVIEW_ALREADY_WRITTEN);
        }

        // 4. 이미지 URLs → JSON 문자열
        String imageUrlsJson = serializeImageUrls(request.getImageUrls());

        // 5. 저장
        Review review = reviewRepository.save(Review.builder()
                .userSeq(userSeq)
                .productSeq(orderItem.getProductSeq())
                .orderSeq(order.getOrderSeq())
                .itemSeq(orderItem.getItemSeq())
                .rating(request.getRating())
                .title(request.getTitle())
                .content(request.getContent())
                .imageUrls(imageUrlsJson)
                .useYn("Y")
                .build());

        return toResponse(review);
    }

    private String serializeImageUrls(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(imageUrls);
        } catch (Exception e) {
            log.warn("imageUrls serialize failed", e);
            return null;
        }
    }

    private List<String> deserializeImageUrls(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private ReviewResponse toResponse(Review review) {
        String userIdMasked = userRepository.findById(review.getUserSeq())
                .map(User::getUserId)
                .map(this::maskUserId)
                .orElse(null);
        return ReviewResponse.builder()
                .reviewSeq(review.getReviewSeq())
                .productSeq(review.getProductSeq())
                .itemSeq(review.getItemSeq())
                .userIdMasked(userIdMasked)
                .rating(review.getRating())
                .title(review.getTitle())
                .content(review.getContent())
                .imageUrls(deserializeImageUrls(review.getImageUrls()))
                .createdDate(review.getIDate())
                .build();
    }

    /** alice → al***, ab → a* (앞 1-2자만 노출) */
    private String maskUserId(String userId) {
        if (userId == null || userId.isEmpty()) return userId;
        int len = userId.length();
        if (len <= 2) return userId.charAt(0) + "*";
        int show = Math.max(2, len / 3);
        return userId.substring(0, show) + "*".repeat(Math.min(3, len - show));
    }
}
