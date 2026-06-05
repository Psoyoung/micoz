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

import java.math.BigDecimal;

@Entity
@Table(name = "mst_product_option")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductOption extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "option_seq")
    private Long optionSeq;

    @Column(name = "product_seq", nullable = false)
    private Long productSeq;

    @Column(name = "option_name", nullable = false, length = 100)
    private String optionName;

    @Column(name = "final_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal finalPrice;

    @Column(name = "stock_qty")
    private Integer stockQty;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Builder
    private ProductOption(Long productSeq, String optionName, BigDecimal finalPrice,
                          Integer stockQty, Integer sortOrder, String useYn) {
        this.productSeq = productSeq;
        this.optionName = optionName;
        this.finalPrice = finalPrice;
        this.stockQty = stockQty != null ? stockQty : 0;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.useYn = useYn != null ? useYn : "Y";
    }
}
