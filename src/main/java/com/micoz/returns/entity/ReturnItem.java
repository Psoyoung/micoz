package com.micoz.returns.entity;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "dat_return_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReturnItem extends BaseCreatedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "return_item_seq")
    private Long returnItemSeq;

    @Column(name = "return_seq", nullable = false)
    private Long returnSeq;

    @Column(name = "item_seq", nullable = false)
    private Long itemSeq;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "exchange_option_seq")
    private Long exchangeOptionSeq;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Builder
    private ReturnItem(Long returnSeq, Long itemSeq, Integer quantity,
                       Long exchangeOptionSeq, String useYn) {
        this.returnSeq = returnSeq;
        this.itemSeq = itemSeq;
        this.quantity = quantity;
        this.exchangeOptionSeq = exchangeOptionSeq;
        this.useYn = useYn != null ? useYn : "Y";
    }
}
