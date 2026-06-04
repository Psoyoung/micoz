package com.micoz.auth.entity;

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

import java.time.OffsetDateTime;

@Entity
@Table(name = "dat_refresh_token")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken extends BaseCreatedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "token_seq")
    private Long tokenSeq;

    @Column(name = "user_seq", nullable = false)
    private Long userSeq;

    /** SHA-256 hex hash (raw 값은 클라이언트만 보유) */
    @Column(name = "refresh_token", nullable = false, length = 500)
    private String refreshToken;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "expire_date", nullable = false)
    private OffsetDateTime expireDate;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "revoked_yn", length = 1)
    private String revokedYn;

    @Column(name = "revoked_date")
    private OffsetDateTime revokedDate;

    @Builder
    private RefreshToken(Long userSeq, String refreshToken, String ipAddress, OffsetDateTime expireDate) {
        this.userSeq = userSeq;
        this.refreshToken = refreshToken;
        this.ipAddress = ipAddress;
        this.expireDate = expireDate;
        this.revokedYn = "N";
    }

    public void revoke(OffsetDateTime when) {
        this.revokedYn = "Y";
        this.revokedDate = when;
    }

    public boolean isRevoked() {
        return "Y".equals(revokedYn);
    }

    public boolean isExpired(OffsetDateTime now) {
        return expireDate.isBefore(now);
    }
}
