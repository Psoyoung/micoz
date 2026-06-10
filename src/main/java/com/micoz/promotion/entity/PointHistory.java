package com.micoz.promotion.entity;

import com.micoz.common.entity.BaseCreatedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "his_point")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PointHistory extends BaseCreatedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "point_seq")
    private Long pointSeq;

    @Column(name = "user_seq", nullable = false)
    private Long userSeq;

    /** EARN / USE / EXPIRE / CANCEL */
    @Column(name = "point_type", nullable = false, length = 20)
    private String pointType;

    /** 적립 양수, 사용 음수 */
    @Column(name = "point_amount", nullable = false)
    private Integer pointAmount;

    @Column(name = "balance_after", nullable = false)
    private Integer balanceAfter;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "order_seq")
    private Long orderSeq;

    @Column(name = "expire_date")
    private OffsetDateTime expireDate;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;
}
