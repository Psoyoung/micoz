package com.micoz.auth.security;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 인증된 사용자 식별 정보. SecurityContext의 Authentication.getPrincipal()로 반환된다.
 * - userSeq: PK (영속 식별자)
 * - userId: 로그인 아이디 (감사용)
 * - role: CUSTOMER / ADMIN
 */
@Getter
@RequiredArgsConstructor
public class UserPrincipal {
    private final Long userSeq;
    private final String userId;
    private final String role;
}
