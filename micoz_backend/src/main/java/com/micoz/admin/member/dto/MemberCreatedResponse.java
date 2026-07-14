package com.micoz.admin.member.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** 회원 등록 결과 (M-T4). */
@Getter
@AllArgsConstructor
public class MemberCreatedResponse {
    private final Long userSeq;
    private final String userId;
}
