package com.micoz.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;

// 일반 도메인 엔티티용 BaseEntity (i_*, u_* 모두 보유).
// audit 컬럼: i_user / i_date / u_user / u_date
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity extends BaseCreatedEntity {

    @LastModifiedBy
    @Column(name = "u_user", length = 50)
    private String uUser;

    @LastModifiedDate
    @Column(name = "u_date")
    private OffsetDateTime uDate;
}
