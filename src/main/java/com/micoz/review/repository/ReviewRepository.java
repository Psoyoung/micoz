package com.micoz.review.repository;

import com.micoz.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("SELECT COUNT(r) FROM Review r WHERE r.productSeq = :productSeq AND r.useYn = 'Y'")
    long countActiveByProductSeq(Long productSeq);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productSeq = :productSeq AND r.useYn = 'Y'")
    Double averageRatingByProductSeq(Long productSeq);
}
