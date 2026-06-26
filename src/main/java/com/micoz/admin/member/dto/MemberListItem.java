package com.micoz.admin.member.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.OffsetDateTime;

/** 회원 목록 항목 (M-T1). gradeCode는 등급 일괄 조회로 채움(N+1 방지). */
@Getter
@AllArgsConstructor
public class MemberListItem {
    private final Long userSeq;
    private final String userId;
    private final String userName;
    private final String gradeCode;
    private final Integer pointBalance;
    private final String userStatus;
    private final String useYn;
    private final OffsetDateTime joinedDate;
    private final OffsetDateTime lastLoginDate;
}
