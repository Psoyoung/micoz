package com.micoz.product.entity;

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
@Table(name = "map_product_label")
@IdClass(MapProductLabel.MapProductLabelId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MapProductLabel extends BaseCreatedEntity {

    @Id
    @Column(name = "product_seq")
    private Long productSeq;

    @Id
    @Column(name = "label_seq")
    private Long labelSeq;

    public MapProductLabel(Long productSeq, Long labelSeq) {
        this.productSeq = productSeq;
        this.labelSeq = labelSeq;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class MapProductLabelId implements Serializable {
        private Long productSeq;
        private Long labelSeq;
    }
}
