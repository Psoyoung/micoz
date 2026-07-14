package com.micoz.review.entity;

import com.micoz.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 상품 리뷰. M5에서 작성/수정/조회 정식 기능 활성화.
 */
@Entity
@Table(name = "dat_review")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_seq")
    private Long reviewSeq;

    @Column(name = "user_seq", nullable = false)
    private Long userSeq;

    @Column(name = "product_seq", nullable = false)
    private Long productSeq;

    @Column(name = "order_seq")
    private Long orderSeq;

    @Column(name = "item_seq")
    private Long itemSeq;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "title", length = 100)
    private String title;

    @Column(name = "content", nullable = false, length = 500)
    private String content;

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Builder
    private Review(Long userSeq, Long productSeq, Long orderSeq, Long itemSeq,
                   Integer rating, String title, String content, String imageUrls, String useYn) {
        this.userSeq = userSeq;
        this.productSeq = productSeq;
        this.orderSeq = orderSeq;
        this.itemSeq = itemSeq;
        this.rating = rating;
        this.title = title;
        this.content = content;
        this.imageUrls = imageUrls;
        this.useYn = useYn != null ? useYn : "Y";
    }

    public void update(Integer rating, String title, String content, String imageUrls) {
        if (rating != null) this.rating = rating;
        if (title != null) this.title = title;
        if (content != null) this.content = content;
        if (imageUrls != null) this.imageUrls = imageUrls;
    }

    public void softDelete() {
        this.useYn = "N";
    }
}
