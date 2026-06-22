package com.micoz.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** 현재 인증된 관리자 식별 정보 (probe 응답, F-T2). */
@Getter
@AllArgsConstructor
public class AdminMeResponse {
    private final Long userSeq;
    private final String userId;
    private final String role;
}
