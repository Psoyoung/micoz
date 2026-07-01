package com.micoz.order.entity;

import com.micoz.common.entity.BaseEntity;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
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

    /**
     * 상태 전이 단일 choke point (O-T2, D1). {@link OrderStatus} 전이표로 허용 여부를 검증하고
     * 위반이면 {@code ORDER_TRANSITION_INVALID}를 던진다. 모든 전이 경로(결제·관리자·반품)가
     * 이 메서드를 거치므로 비허용 전이는 어떤 호출자로도 우회할 수 없다.
     */
    public void changeStatus(OrderStatus target) {
        OrderStatus current = OrderStatus.from(this.orderStatus);
        if (!current.canTransitionTo(target)) {
            throw new BusinessException(ErrorCode.ORDER_TRANSITION_INVALID);
        }
        this.orderStatus = target.name();
    }
}
