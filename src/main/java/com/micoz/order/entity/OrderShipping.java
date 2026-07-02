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

import java.time.OffsetDateTime;

@Entity
@Table(name = "dat_order_shipping")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderShipping extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_ship_seq")
    private Long orderShipSeq;

    @Column(name = "order_seq", nullable = false)
    private Long orderSeq;

    @Column(name = "recipient_name", nullable = false, length = 100)
    private String recipientName;

    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone;

    @Column(name = "zip_code", nullable = false, length = 10)
    private String zipCode;

    @Column(name = "address", nullable = false, length = 500)
    private String address;

    @Column(name = "address_detail", length = 500)
    private String addressDetail;

    @Column(name = "shipping_memo", length = 500)
    private String shippingMemo;

    @Column(name = "tracking_no", length = 50)
    private String trackingNo;

    @Column(name = "shipping_status", length = 20)
    private String shippingStatus;

    @Column(name = "shipped_date")
    private OffsetDateTime shippedDate;

    @Column(name = "delivered_date")
    private OffsetDateTime deliveredDate;

    @Builder
    private OrderShipping(Long orderSeq, String recipientName, String recipientPhone,
                          String zipCode, String address, String addressDetail,
                          String shippingMemo, String shippingStatus) {
        this.orderSeq = orderSeq;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.zipCode = zipCode;
        this.address = address;
        this.addressDetail = addressDetail;
        this.shippingMemo = shippingMemo;
        this.shippingStatus = shippingStatus != null ? shippingStatus : "READY";
    }

    /** 출고: READY → SHIPPED + 운송장·출고일시 기록 (O-T3). */
    public void ship(String trackingNo, OffsetDateTime when) {
        changeShippingStatus(ShippingStatus.SHIPPED);
        this.trackingNo = trackingNo;
        this.shippedDate = when;
    }

    /** 배송중 전환: SHIPPED → IN_TRANSIT (O-T3). */
    public void markInTransit() {
        changeShippingStatus(ShippingStatus.IN_TRANSIT);
    }

    /** 배송완료: {SHIPPED|IN_TRANSIT} → DELIVERED + 완료일시 기록 (O-T3). */
    public void markDelivered(OffsetDateTime when) {
        changeShippingStatus(ShippingStatus.DELIVERED);
        this.deliveredDate = when;
    }

    /**
     * 배송 상태 전이 단일 choke point ({@link Order#changeStatus}와 동일 패턴). {@link ShippingStatus}
     * 전이표로 검증하고 위반 시 {@code ORDER_TRANSITION_INVALID}. 2컬럼 동기화(출고/배송완료)의
     * 원자성은 서비스가 order_status 전이와 함께 사전검증 후 적용해 보장한다(§5.3).
     */
    private void changeShippingStatus(ShippingStatus target) {
        ShippingStatus current = ShippingStatus.from(this.shippingStatus);
        if (!current.canTransitionTo(target)) {
            throw new BusinessException(ErrorCode.ORDER_TRANSITION_INVALID);
        }
        this.shippingStatus = target.name();
    }
}
