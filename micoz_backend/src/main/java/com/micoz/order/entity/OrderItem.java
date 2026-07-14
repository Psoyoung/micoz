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

@Entity
@Table(name = "dat_order_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_seq")
    private Long itemSeq;

    @Column(name = "order_seq", nullable = false)
    private Long orderSeq;

    @Column(name = "product_seq", nullable = false)
    private Long productSeq;

    @Column(name = "option_seq")
    private Long optionSeq;

    /** 주문 시점 스냅샷 */
    @Column(name = "product_code", length = 50)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    @Column(name = "option_name", length = 100)
    private String optionName;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "item_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal itemAmount;

    @Column(name = "item_status", length = 20)
    private String itemStatus;

    @Builder
    private OrderItem(Long orderSeq, Long productSeq, Long optionSeq,
                      String productCode, String productName, String optionName,
                      BigDecimal unitPrice, Integer quantity, BigDecimal itemAmount,
                      String itemStatus) {
        this.orderSeq = orderSeq;
        this.productSeq = productSeq;
        this.optionSeq = optionSeq;
        this.productCode = productCode;
        this.productName = productName;
        this.optionName = optionName;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.itemAmount = itemAmount;
        this.itemStatus = itemStatus != null ? itemStatus : "NORMAL";
    }
}
