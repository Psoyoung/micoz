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
@Table(name = "mst_product")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_seq")
    private Long productSeq;

    @Column(name = "product_code", nullable = false, length = 50)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    @Column(name = "product_status", length = 20)
    private String productStatus;

    @Column(name = "category_seq")
    private Long categorySeq;

    @Column(name = "base_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "short_desc", length = 500)
    private String shortDesc;

    @Column(name = "detail_desc", columnDefinition = "TEXT")
    private String detailDesc;

    @Column(name = "ingredient_info", columnDefinition = "TEXT")
    private String ingredientInfo;

    @Column(name = "usage_info", columnDefinition = "TEXT")
    private String usageInfo;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "display_yn", length = 1)
    private String displayYn;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Builder
    private Product(String productCode, String productName, String productStatus,
                    Long categorySeq, BigDecimal basePrice, String shortDesc,
                    String detailDesc, String ingredientInfo, String usageInfo,
                    String displayYn, String useYn) {
        this.productCode = productCode;
        this.productName = productName;
        this.productStatus = productStatus != null ? productStatus : "ON_SALE";
        this.categorySeq = categorySeq;
        this.basePrice = basePrice;
        this.shortDesc = shortDesc;
        this.detailDesc = detailDesc;
        this.ingredientInfo = ingredientInfo;
        this.usageInfo = usageInfo;
        this.displayYn = displayYn != null ? displayYn : "Y";
        this.useYn = useYn != null ? useYn : "Y";
    }

    /** 상품 본문 수정 (C-T3, 전체 교체). 자식(옵션·이미지·라벨)은 서비스에서 별도 동기화. */
    public void updateInfo(String productCode, String productName, String productStatus,
                           Long categorySeq, BigDecimal basePrice, String shortDesc,
                           String detailDesc, String ingredientInfo, String usageInfo,
                           String displayYn) {
        this.productCode = productCode;
        this.productName = productName;
        this.productStatus = productStatus;
        this.categorySeq = categorySeq;
        this.basePrice = basePrice;
        this.shortDesc = shortDesc;
        this.detailDesc = detailDesc;
        this.ingredientInfo = ingredientInfo;
        this.usageInfo = usageInfo;
        this.displayYn = displayYn;
    }

    /** 판매상태 변경 (C-T4). 허용값 검증은 호출 측(화이트리스트). */
    public void changeStatus(String productStatus) {
        this.productStatus = productStatus;
    }

    /** 소프트삭제 (C-T5). use_yn='N' + display_yn='N' 동시 세팅(노출 차단). */
    public void softDelete() {
        this.useYn = "N";
        this.displayYn = "N";
    }
}
