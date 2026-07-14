package com.micoz.cart.entity;

import com.micoz.common.entity.BaseCreatedEntity;
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

@Entity
@Table(name = "dat_cart")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Cart extends BaseCreatedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_seq")
    private Long cartSeq;

    @Column(name = "user_seq", nullable = false)
    private Long userSeq;

    @Column(name = "product_seq", nullable = false)
    private Long productSeq;

    @Column(name = "option_seq")
    private Long optionSeq;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Builder
    private Cart(Long userSeq, Long productSeq, Long optionSeq, Integer quantity) {
        this.userSeq = userSeq;
        this.productSeq = productSeq;
        this.optionSeq = optionSeq;
        this.quantity = quantity != null ? quantity : 1;
    }

    public void addQuantity(int delta) {
        this.quantity += delta;
    }

    public void changeQuantity(int newQty) {
        this.quantity = newQty;
    }
}
