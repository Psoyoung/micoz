package com.micoz.admin.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.OffsetDateTime;

/** 관리자 목록 항목 (F-T6). useYn으로 활성/비활성 식별. */
@Getter
@AllArgsConstructor
public class AdminListItem {
    private final Long userSeq;
    private final String userId;
    private final String userName;
    private final String email;
    private final String userStatus;
    private final String useYn;
    private final OffsetDateTime lastLoginDate;
}
