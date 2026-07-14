package com.micoz.banner.entity;

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
@Table(name = "mst_banner")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Banner extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "banner_seq")
    private Long bannerSeq;

    /** HERO / CATEGORY / PROMO */
    @Column(name = "banner_type", length = 20)
    private String bannerType;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "link_url", length = 500)
    private String linkUrl;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "display_yn", length = 1)
    private String displayYn;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Builder
    private Banner(String bannerType, String title, String description,
                   String imageUrl, String linkUrl, Integer sortOrder,
                   String displayYn, String useYn) {
        this.bannerType = bannerType != null ? bannerType : "HERO";
        this.title = title;
        this.description = description;
        this.imageUrl = imageUrl;
        this.linkUrl = linkUrl;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.displayYn = displayYn != null ? displayYn : "Y";
        this.useYn = useYn != null ? useYn : "Y";
    }

    /** 전체 수정 (S-T1). PUT 시맨틱 — 전달된 값으로 필드 교체(정규화는 서비스에서 수행). */
    public void updateInfo(String bannerType, String title, String description,
                           String imageUrl, String linkUrl, Integer sortOrder, String displayYn) {
        this.bannerType = bannerType;
        this.title = title;
        this.description = description;
        this.imageUrl = imageUrl;
        this.linkUrl = linkUrl;
        this.sortOrder = sortOrder;
        this.displayYn = displayYn;
    }

    /** 노출 토글 (S-T1). */
    public void changeDisplay(String displayYn) {
        this.displayYn = displayYn;
    }

    /** 소프트삭제 (S-T1). use_yn='N' + display_yn='N' 동시 세팅(노출 차단, Category/Product 선례). */
    public void softDelete() {
        this.useYn = "N";
        this.displayYn = "N";
    }
}
