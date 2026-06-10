package com.micoz.promotion.entity;

import com.micoz.common.entity.BaseEntity;
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
@Table(name = "map_user_coupon")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserCoupon extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_coupon_seq")
    private Long userCouponSeq;

    @Column(name = "user_seq", nullable = false)
    private Long userSeq;

    @Column(name = "coupon_seq", nullable = false)
    private Long couponSeq;

    /** AVAILABLE / USED / EXPIRED */
    @Column(name = "coupon_status", length = 20)
    private String couponStatus;

    @Column(name = "issued_date")
    private OffsetDateTime issuedDate;

    @Column(name = "expire_date")
    private OffsetDateTime expireDate;

    @Column(name = "used_date")
    private OffsetDateTime usedDate;

    @Column(name = "order_seq")
    private Long orderSeq;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;
}
