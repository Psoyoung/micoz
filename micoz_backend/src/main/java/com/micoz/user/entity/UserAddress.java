package com.micoz.user.entity;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "mst_user_address")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserAddress extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_seq")
    private Long addressSeq;

    @Column(name = "user_seq", nullable = false)
    private Long userSeq;

    @Column(name = "address_name", length = 100)
    private String addressName;

    @Column(name = "recipient_name", nullable = false, length = 100)
    private String recipientName;

    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone;

    @Column(name = "zip_code", nullable = false, length = 10)
    private String zipCode;

    @Column(name = "address", nullable = false, length = 500)
    private String address;

    @Column(name = "address_detail", length = 500)
    private String addressDetail;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "default_yn", length = 1)
    private String defaultYn;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Builder
    private UserAddress(Long userSeq, String addressName, String recipientName, String recipientPhone,
                        String zipCode, String address, String addressDetail,
                        String defaultYn, String useYn) {
        this.userSeq = userSeq;
        this.addressName = addressName;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.zipCode = zipCode;
        this.address = address;
        this.addressDetail = addressDetail;
        this.defaultYn = defaultYn != null ? defaultYn : "N";
        this.useYn = useYn != null ? useYn : "Y";
    }

    public void update(String addressName, String recipientName, String recipientPhone,
                       String zipCode, String address, String addressDetail) {
        if (addressName != null) this.addressName = addressName;
        if (recipientName != null) this.recipientName = recipientName;
        if (recipientPhone != null) this.recipientPhone = recipientPhone;
        if (zipCode != null) this.zipCode = zipCode;
        if (address != null) this.address = address;
        if (addressDetail != null) this.addressDetail = addressDetail;
    }

    public void markDefault() { this.defaultYn = "Y"; }
    public void unmarkDefault() { this.defaultYn = "N"; }
    public void softDelete() { this.useYn = "N"; }
}
