package com.micoz.review.repository;

import com.micoz.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("SELECT COUNT(r) FROM Review r WHERE r.productSeq = :productSeq AND r.useYn = 'Y'")
    long countActiveByProductSeq(Long productSeq);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productSeq = :productSeq AND r.useYn = 'Y'")
    Double averageRatingByProductSeq(Long productSeq);

    Optional<Review> findByUserSeqAndItemSeqAndUseYn(Long userSeq, Long itemSeq, String useYn);

    Optional<Review> findByReviewSeqAndUseYn(Long reviewSeq, String useYn);

    Page<Review> findAllByProductSeqAndUseYnOrderByReviewSeqDesc(Long productSeq, String useYn, Pageable pageable);

    Page<Review> findAllByUserSeqAndUseYnOrderByReviewSeqDesc(Long userSeq, String useYn, Pageable pageable);

    default Optional<Review> findActiveByUserSeqAndItemSeq(Long userSeq, Long itemSeq) {
        return findByUserSeqAndItemSeqAndUseYn(userSeq, itemSeq, "Y");
    }

    default Optional<Review> findActiveByReviewSeq(Long reviewSeq) {
        return findByReviewSeqAndUseYn(reviewSeq, "Y");
    }
}
