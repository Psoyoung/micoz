package com.micoz.settings.entity;

import com.micoz.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "mst_shipping")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShippingSetting extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ship_seq")
    private Long shipSeq;

    @Column(name = "shipping_name", length = 100)
    private String shippingName;

    @Column(name = "shipping_fee", precision = 15, scale = 2, nullable = false)
    private BigDecimal shippingFee;

    @Column(name = "free_shipping_min", precision = 15, scale = 2, nullable = false)
    private BigDecimal freeShippingMin;

    @Column(name = "remote_extra_fee", precision = 15, scale = 2, nullable = false)
    private BigDecimal remoteExtraFee;

    @Column(name = "shipping_notice", length = 500)
    private String shippingNotice;

    /**
     * 설정 수정 (S-T2). 부분 수정 — null 필드는 미변경(기존값 보존).
     * 세 금액 필드(shippingFee/freeShippingMin/remoteExtraFee)는 제공 시 검증된 비-null만 기록하고
     * 미제공 시 기존 비-null을 보존하므로 영구히 비-null 유지된다.
     * (OrderAmountCalculator가 이 세 필드를 null-guard 없이 사용 — 계약상 null 진입 차단이 필수)
     */
    public void updateSettings(String shippingName, BigDecimal shippingFee, BigDecimal freeShippingMin,
                               BigDecimal remoteExtraFee, String shippingNotice) {
        if (shippingName != null) this.shippingName = shippingName;
        if (shippingFee != null) this.shippingFee = shippingFee;
        if (freeShippingMin != null) this.freeShippingMin = freeShippingMin;
        if (remoteExtraFee != null) this.remoteExtraFee = remoteExtraFee;
        if (shippingNotice != null) this.shippingNotice = shippingNotice;
    }
}
