package com.micoz.favorite.entity;

import com.micoz.common.entity.BaseCreatedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Table(name = "map_product_fav")
@IdClass(ProductFav.ProductFavId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductFav extends BaseCreatedEntity {

    @Id
    @Column(name = "user_seq")
    private Long userSeq;

    @Id
    @Column(name = "product_seq")
    private Long productSeq;

    public ProductFav(Long userSeq, Long productSeq) {
        this.userSeq = userSeq;
        this.productSeq = productSeq;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ProductFavId implements Serializable {
        private Long userSeq;
        private Long productSeq;
    }
}
