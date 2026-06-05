package com.micoz.category.entity;

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
@Table(name = "mst_category")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_seq")
    private Long categorySeq;

    @Column(name = "parent_seq")
    private Long parentSeq;

    @Column(name = "category_name", nullable = false, length = 100)
    private String categoryName;

    @Column(name = "url_slug", nullable = false, length = 100)
    private String urlSlug;

    @Column(name = "category_level", nullable = false)
    private Integer categoryLevel;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "display_yn", length = 1)
    private String displayYn;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Builder
    private Category(Long parentSeq, String categoryName, String urlSlug,
                     Integer categoryLevel, Integer sortOrder,
                     String displayYn, String useYn) {
        this.parentSeq = parentSeq;
        this.categoryName = categoryName;
        this.urlSlug = urlSlug;
        this.categoryLevel = categoryLevel;
        this.sortOrder = sortOrder;
        this.displayYn = displayYn != null ? displayYn : "Y";
        this.useYn = useYn != null ? useYn : "Y";
    }
}
