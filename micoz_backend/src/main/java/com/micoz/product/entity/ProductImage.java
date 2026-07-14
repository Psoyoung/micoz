package com.micoz.product.entity;

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

@Entity
@Table(name = "mst_product_image")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductImage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_seq")
    private Long imageSeq;

    @Column(name = "product_seq", nullable = false)
    private Long productSeq;

    /** MAIN / SUB / DETAIL */
    @Column(name = "image_type", nullable = false, length = 20)
    private String imageType;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "image_alt", length = 100)
    private String imageAlt;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Builder
    private ProductImage(Long productSeq, String imageType, String imageUrl,
                         String imageAlt, Integer sortOrder, String useYn) {
        this.productSeq = productSeq;
        this.imageType = imageType;
        this.imageUrl = imageUrl;
        this.imageAlt = imageAlt;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.useYn = useYn != null ? useYn : "Y";
    }

    /** 이미지 수정 (C-T3, seq upsert). */
    public void updateInfo(String imageType, String imageUrl, String imageAlt, Integer sortOrder) {
        this.imageType = imageType;
        this.imageUrl = imageUrl;
        this.imageAlt = imageAlt;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
    }

    /** 소프트삭제 (C-T3 수정 시 미포함 이미지 / C-T5 상품 삭제 동반). */
    public void softDelete() {
        this.useYn = "N";
    }
}
