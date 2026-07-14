package com.micoz.auth;

import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * M-T3.5 로그인 user_status 게이팅 검증.
 * SUSPENDED만 거부(동일 응답 AUTH_INVALID_CREDENTIALS, 상태 비노출). DORMANT는 허용.
 * 기존 정상회원 로그인 무영향(회귀 스모크)도 함께 본다. 픽스처는 'mt' 접두사로 정리.
 */
class AdminMemberLoginGatingTest extends IntegrationTestSupport {

    private static final String PW = "LoginGate#Test1234";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'mt%'");
    }

    @Test
    @DisplayName("[회귀] 정상(ACTIVE) 회원 로그인 → 200 (게이팅 영향 없음)")
    void activeCustomerLoginOk() {
        String id = insert("CUSTOMER", "ACTIVE");
        ResponseEntity<String> resp = login(id);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parse(resp.getBody()).path("data").path("accessToken").asText()).isNotBlank();
    }

    @Test
    @DisplayName("정지(SUSPENDED) 회원 로그인 → 401 AUTH_INVALID_CREDENTIALS (상태 비노출)")
    void suspendedCustomerLoginBlocked() {
        String id = insert("CUSTOMER", "SUSPENDED");
        ResponseEntity<String> resp = login(id);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("AUTH_INVALID_CREDENTIALS");
    }

    @Test
    @DisplayName("휴면(DORMANT) 회원 로그인 → 200 (DORMANT는 허용)")
    void dormantCustomerLoginOk() {
        String id = insert("CUSTOMER", "DORMANT");
        ResponseEntity<String> resp = login(id);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("정지(SUSPENDED) 관리자 → 관리자 로그인도 동일 차단 (공통 경로)")
    void suspendedAdminLoginBlocked() {
        String id = insert("ADMIN", "SUSPENDED");
        ResponseEntity<String> resp = adminLogin(id);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("AUTH_INVALID_CREDENTIALS");
    }

    // ─────────────────────────── helpers ───────────────────────────
    private String insert(String role, String status) {
        String userId = "mtlg" + suffix();
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, user_status, "
                        + "service_yn, privacy_yn, use_yn, i_user) "
                        + "VALUES (?, ?, '게이팅테스트', ?, ?, 'Y', 'Y', 'Y', 'TEST')",
                userId, passwordEncoder.encode(PW), role, status);
        return userId;
    }

    private ResponseEntity<String> login(String userId) {
        return rest.postForEntity(baseUrl() + "/api/v1/auth/login",
                Map.of("userId", userId, "userPw", PW), String.class);
    }

    private ResponseEntity<String> adminLogin(String userId) {
        return rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", userId, "userPw", PW), String.class);
    }

    private String suffix() {
        String unique = String.valueOf(System.nanoTime());
        return unique.substring(unique.length() - 8);
    }
}
