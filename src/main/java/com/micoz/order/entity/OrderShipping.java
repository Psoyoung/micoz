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
}
