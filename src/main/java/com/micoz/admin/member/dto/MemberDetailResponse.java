package com.micoz.admin.member.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/** 회원 상세 (M-T2). 비밀번호/해시는 절대 포함하지 않는다. */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MemberDetailResponse {
    private final Long userSeq;
    private final String userId;
    private final String userName;
    private final String userRole;
    private final String gradeCode;
    private final String gradeName;
    private final String userStatus;
    private final String useYn;
    private final String email;
    private final String phone;
    private final LocalDate birthDate;
    private final String zipCode;
    private final String address;
    private final String addressDetail;
    private final String memo;
    private final Integer pointBalance;
    private final String serviceYn;
    private final String privacyYn;
    private final String marketingYn;
    private final String referrerUserId;
    private final OffsetDateTime lastLoginDate;
    private final OffsetDateTime joinedDate;
}
