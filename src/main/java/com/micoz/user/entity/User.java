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

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "mst_user")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_seq")
    private Long userSeq;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "user_pw", nullable = false, length = 255)
    private String userPw;

    @Column(name = "user_name", nullable = false, length = 100)
    private String userName;

    @Column(name = "user_role", nullable = false, length = 20)
    private String userRole;

    @Column(name = "grade_seq")
    private Long gradeSeq;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "zip_code", length = 10)
    private String zipCode;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "address_detail", length = 500)
    private String addressDetail;

    @Column(name = "memo", length = 500)
    private String memo;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "service_yn", length = 1)
    private String serviceYn;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "privacy_yn", length = 1)
    private String privacyYn;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "marketing_yn", length = 1)
    private String marketingYn;

    @Column(name = "service_agree_date")
    private OffsetDateTime serviceAgreeDate;

    @Column(name = "privacy_agree_date")
    private OffsetDateTime privacyAgreeDate;

    @Column(name = "marketing_agree_date")
    private OffsetDateTime marketingAgreeDate;

    @Column(name = "last_login_date")
    private OffsetDateTime lastLoginDate;

    @Column(name = "point_balance")
    private Integer pointBalance;

    @Column(name = "user_status", length = 20)
    private String userStatus;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "referrer_user_seq")
    private Long referrerUserSeq;

    @Builder
    private User(String userId, String userPw, String userName, String userRole,
                 Long gradeSeq, String email, String phone, LocalDate birthDate,
                 String zipCode, String address, String addressDetail,
                 String serviceYn, String privacyYn, String marketingYn,
                 OffsetDateTime serviceAgreeDate, OffsetDateTime privacyAgreeDate,
                 OffsetDateTime marketingAgreeDate,
                 Integer pointBalance, String userStatus, String useYn,
                 Long referrerUserSeq) {
        this.userId = userId;
        this.userPw = userPw;
        this.userName = userName;
        this.userRole = userRole;
        this.gradeSeq = gradeSeq;
        this.email = email;
        this.phone = phone;
        this.birthDate = birthDate;
        this.zipCode = zipCode;
        this.address = address;
        this.addressDetail = addressDetail;
        this.serviceYn = serviceYn;
        this.privacyYn = privacyYn;
        this.marketingYn = marketingYn;
        this.serviceAgreeDate = serviceAgreeDate;
        this.privacyAgreeDate = privacyAgreeDate;
        this.marketingAgreeDate = marketingAgreeDate;
        this.pointBalance = pointBalance != null ? pointBalance : 0;
        this.userStatus = userStatus != null ? userStatus : "ACTIVE";
        this.useYn = useYn != null ? useYn : "Y";
        this.referrerUserSeq = referrerUserSeq;
    }

    public void updateLastLogin(OffsetDateTime when) {
        this.lastLoginDate = when;
    }

    public void changePassword(String encodedPassword) {
        this.userPw = encodedPassword;
    }

    public void softDelete() {
        this.useYn = "N";
    }

    /** 활성/비활성 토글 (관리자 상태 관리, F-T6). 비활성(N)은 로그인 차단 = 소프트삭제 대체. */
    public void changeActivation(boolean active) {
        this.useYn = active ? "Y" : "N";
    }

    /** 회원 등급 변경 (M-T3). gradeSeq는 호출 측에서 유효성 검증 후 전달. */
    public void changeGrade(Long gradeSeq) {
        this.gradeSeq = gradeSeq;
    }

    /** 회원 운영 상태 변경 (M-T3, ACTIVE/DORMANT/SUSPENDED). use_yn(탈퇴)과는 별개 개념. */
    public void changeStatus(String userStatus) {
        this.userStatus = userStatus;
    }

    public void updateProfile(String userName, String email, String phone,
                              LocalDate birthDate, String zipCode,
                              String address, String addressDetail) {
        if (userName != null) this.userName = userName;
        if (email != null) this.email = email;
        if (phone != null) this.phone = phone;
        if (birthDate != null) this.birthDate = birthDate;
        if (zipCode != null) this.zipCode = zipCode;
        if (address != null) this.address = address;
        if (addressDetail != null) this.addressDetail = addressDetail;
    }
}
