package com.micoz.auth.jwt;

import com.micoz.common.config.JwtProperties;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderTest {

    private static final String TEST_SECRET =
            "test-only-jwt-secret-please-change-minimum-256-bits-long-string";

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() throws Exception {
        JwtProperties props = new JwtProperties();
        props.setSecret(TEST_SECRET);
        props.setAccessTokenValidityMinutes(30);
        props.setRefreshTokenValidityDays(14);

        provider = new JwtTokenProvider(props);
        // @PostConstruct는 Spring 컨텍스트 밖에서 호출되지 않으므로 직접 호출
        Method init = JwtTokenProvider.class.getDeclaredMethod("init");
        init.setAccessible(true);
        init.invoke(provider);
    }

    @Test
    @DisplayName("access token 생성/파싱 round-trip — claims 추출 정상")
    void createAndParse_roundTrip() {
        String token = provider.createAccessToken(42L, "alice", "CUSTOMER");

        Claims claims = provider.parseAccessToken(token);

        assertThat(provider.getUserSeq(claims)).isEqualTo(42L);
        assertThat(provider.getUserId(claims)).isEqualTo("alice");
        assertThat(provider.getRole(claims)).isEqualTo("CUSTOMER");
        assertThat(claims.getExpiration()).isAfter(claims.getIssuedAt());
    }

    @Test
    @DisplayName("만료된 access token 파싱 → AUTH_TOKEN_EXPIRED")
    void parse_expiredToken_throwsExpired() throws Exception {
        // 만료시간을 음수로 설정해 즉시 만료된 토큰 생성
        JwtProperties expiredProps = new JwtProperties();
        expiredProps.setSecret(TEST_SECRET);
        expiredProps.setAccessTokenValidityMinutes(-1);
        expiredProps.setRefreshTokenValidityDays(14);

        JwtTokenProvider expiredProvider = new JwtTokenProvider(expiredProps);
        Method init = JwtTokenProvider.class.getDeclaredMethod("init");
        init.setAccessible(true);
        init.invoke(expiredProvider);

        String token = expiredProvider.createAccessToken(1L, "u", "CUSTOMER");

        assertThatThrownBy(() -> expiredProvider.parseAccessToken(token))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AUTH_TOKEN_EXPIRED);
    }

    @Test
    @DisplayName("변조된 access token 파싱 → AUTH_TOKEN_INVALID")
    void parse_tamperedToken_throwsInvalid() {
        String token = provider.createAccessToken(1L, "u", "CUSTOMER");
        // payload(2번째 세그먼트) 첫 글자를 변경 → 서명 대상 바이트가 확실히 바뀌어 서명 검증이 항상 실패.
        // (마지막 글자 변조는 base64url 마지막 문자의 무시 비트만 뒤집힐 수 있어 디코딩 바이트가 그대로 →
        //  서명이 유효한 채 남는 플래키가 있었다. 결정적 변조로 교체.)
        String[] parts = token.split("\\.");
        char first = parts[1].charAt(0);
        parts[1] = (first == 'A' ? 'B' : 'A') + parts[1].substring(1);
        String tampered = parts[0] + "." + parts[1] + "." + parts[2];

        assertThatThrownBy(() -> provider.parseAccessToken(tampered))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AUTH_TOKEN_INVALID);
    }

    @Test
    @DisplayName("refresh token 생성 — 32바이트 base64url, 매번 다른 값")
    void createRefreshToken_isRandom() {
        String r1 = provider.createRefreshToken();
        String r2 = provider.createRefreshToken();

        assertThat(r1).isNotBlank();
        assertThat(r2).isNotBlank();
        assertThat(r1).isNotEqualTo(r2);
        // 32바이트 → base64url(no padding) 길이 = ceil(32/3)*4 - padding ≈ 43
        assertThat(r1.length()).isBetween(40, 50);
    }
}
