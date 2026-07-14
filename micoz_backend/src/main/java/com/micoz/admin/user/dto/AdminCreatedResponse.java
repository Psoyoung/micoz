package com.micoz.admin.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** 관리자 계정 추가 응답 (F-T6). */
@Getter
@AllArgsConstructor
public class AdminCreatedResponse {
    private final Long userSeq;
    private final String userId;
}
