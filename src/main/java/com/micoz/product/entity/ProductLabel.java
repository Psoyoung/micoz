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
@Table(name = "mst_product_label")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductLabel extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "label_seq")
    private Long labelSeq;

    @Column(name = "label_name", nullable = false, length = 100)
    private String labelName;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Builder
    private ProductLabel(String labelName, Integer sortOrder, String useYn) {
        this.labelName = labelName;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.useYn = useYn != null ? useYn : "Y";
    }
}
