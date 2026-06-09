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

    @Column(name = "shipping_fee", precision = 15, scale = 2)
    private BigDecimal shippingFee;

    @Column(name = "free_shipping_min", precision = 15, scale = 2)
    private BigDecimal freeShippingMin;

    @Column(name = "remote_extra_fee", precision = 15, scale = 2)
    private BigDecimal remoteExtraFee;

    @Column(name = "shipping_notice", length = 500)
    private String shippingNotice;
}
