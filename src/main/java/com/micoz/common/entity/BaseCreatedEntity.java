package com.micoz.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;

/**
 * append-only 테이블용 BaseEntity (i_* 만 보유).
 * 대상 테이블: dat_cart, map_product_label, map_product_fav, map_user_coupon,
 *          dat_refresh_token, his_point, dat_return_item
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseCreatedEntity {

    @CreatedBy
    @Column(name = "i_user", length = 50, updatable = false)
    private String iUser;

    @CreatedDate
    @Column(name = "i_date", updatable = false)
    private OffsetDateTime iDate;
}
