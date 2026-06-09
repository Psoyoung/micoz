package com.micoz.order.entity;

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

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "dat_order")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_seq")
    private Long orderSeq;

    @Column(name = "order_no", nullable = false, length = 50)
    private String orderNo;

    @Column(name = "user_seq", nullable = false)
    private Long userSeq;

    @Column(name = "order_status", nullable = false, length = 20)
    private String orderStatus;

    @Column(name = "shipping_fee", precision = 15, scale = 2)
    private BigDecimal shippingFee;

    @Column(name = "coupon_discount", precision = 15, scale = 2)
    private BigDecimal couponDiscount;

    @Column(name = "point_used")
    private Integer pointUsed;

    @Column(name = "total_discount", precision = 15, scale = 2)
    private BigDecimal totalDiscount;

    @Column(name = "final_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal finalAmount;

    @Column(name = "point_to_earn")
    private Integer pointToEarn;

    @Column(name = "order_date")
    private OffsetDateTime orderDate;

    @Builder
    private Order(String orderNo, Long userSeq, String orderStatus,
                  BigDecimal shippingFee, BigDecimal couponDiscount, Integer pointUsed,
                  BigDecimal totalDiscount, BigDecimal finalAmount, Integer pointToEarn,
                  OffsetDateTime orderDate) {
        this.orderNo = orderNo;
        this.userSeq = userSeq;
        this.orderStatus = orderStatus != null ? orderStatus : "PENDING";
        this.shippingFee = shippingFee != null ? shippingFee : BigDecimal.ZERO;
        this.couponDiscount = couponDiscount != null ? couponDiscount : BigDecimal.ZERO;
        this.pointUsed = pointUsed != null ? pointUsed : 0;
        this.totalDiscount = totalDiscount != null ? totalDiscount : BigDecimal.ZERO;
        this.finalAmount = finalAmount;
        this.pointToEarn = pointToEarn != null ? pointToEarn : 0;
        this.orderDate = orderDate != null ? orderDate : OffsetDateTime.now();
    }

    public void transitTo(String newStatus) {
        this.orderStatus = newStatus;
    }
}
