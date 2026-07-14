package com.micoz.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserInfoResponse {
    private final Long userSeq;
    private final String userId;
    private final String userName;
    private final String userRole;
    private final String userStatus;
    private final String email;
    private final String phone;
    private final LocalDate birthDate;
    private final String zipCode;
    private final String address;
    private final String addressDetail;
    private final String gradeCode;
    private final String gradeName;
    private final String referrerUserId;
    private final Integer pointBalance;
    private final OffsetDateTime lastLoginDate;
}
