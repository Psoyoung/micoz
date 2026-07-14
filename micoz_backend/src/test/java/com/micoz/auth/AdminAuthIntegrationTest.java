package com.micoz.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
 * F-T2 관리자 로그인 엔드포인트 + 내부 role 게이트 검증.
 * 비밀번호는 테스트 픽스처(실제 시크릿 아님).
 */
class AdminAuthIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "AdminLogin#Test1234";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminId;

    @BeforeEach
    void seedAdmin() {
        String unique = String.valueOf(System.nanoTime());
        adminId = "adm" + unique.substring(unique.length() - 8);
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, user_status, "
                        + "service_yn, privacy_yn, use_yn, i_user) "
                        + "VALUES (?, ?, '관리자', 'ADMIN', 'ACTIVE', 'Y', 'Y', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
    }

    @AfterEach
    void cleanupAdmin() {
        // 공유 Testcontainer 오염 방지 — 본 테스트가 만든 ADMIN 제거
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id = ?", adminId);
    }

    private ResponseEntity<String> adminLogin(String userId, String pw) {
        return rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", userId, "userPw", pw), String.class);
    }

    @Test
    @DisplayName("관리자 로그인 성공 → 토큰 발급(role=ADMIN)")
    void adminLoginSuccess() {
        ResponseEntity<String> resp = adminLogin(adminId, ADMIN_PW);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode data = parse(resp.getBody()).path("data");
        String access = data.path("accessToken").asText();
        assertThat(access).isNotBlank();

        // 발급 토큰으로 /admin/me 호출 → role=ADMIN 확인 (F-T3 전이라 인증만 되면 통과)
        ResponseEntity<String> me = getJson("/api/v1/admin/me", access);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode meData = parse(me.getBody()).path("data");
        assertThat(meData.path("role").asText()).isEqualTo("ADMIN");
        assertThat(meData.path("userId").asText()).isEqualTo(adminId);
    }

    @Test
    @DisplayName("일반 사용자 자격증명으로 관리자 로그인 → AUTH_INVALID_CREDENTIALS (role 게이트)")
    void customerCannotAdminLogin() {
        signupAndLogin(); // 일반 사용자 1명 생성 (자격증명 확보용)
        String unique = String.valueOf(System.nanoTime());
        String custId = "c" + unique.substring(unique.length() - 8);
        // 명시적으로 알려진 자격증명의 일반 사용자 생성
        rest.postForEntity(baseUrl() + "/api/v1/auth/signup",
                Map.of("userId", custId, "userPw", "pass1234", "userName", "고객",
                        "serviceYn", "Y", "privacyYn", "Y"), String.class);

        ResponseEntity<String> resp = adminLogin(custId, "pass1234");

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("AUTH_INVALID_CREDENTIALS");
    }

    @Test
    @DisplayName("존재하지 않는 아이디로 관리자 로그인 → AUTH_INVALID_CREDENTIALS (동일 응답)")
    void nonexistentCannotAdminLogin() {
        ResponseEntity<String> resp = adminLogin("nosuchadmin_xyz", "whatever1234");

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("AUTH_INVALID_CREDENTIALS");
    }

    @Test
    @DisplayName("잘못된 비밀번호로 관리자 로그인 → AUTH_INVALID_CREDENTIALS")
    void wrongPasswordAdminLogin() {
        ResponseEntity<String> resp = adminLogin(adminId, "wrong-password");

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("AUTH_INVALID_CREDENTIALS");
    }

    @Test
    @DisplayName("회귀: 일반 사용자 로그인은 그대로 동작")
    void customerNormalLoginStillWorks() {
        String access = signupAndLogin();
        assertThat(access).isNotBlank();
        ResponseEntity<String> me = getJson("/api/v1/me", access);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("게이팅(F-T3): 토큰 없이 /admin/me → 401 AUTH_UNAUTHORIZED")
    void adminMeWithoutTokenReturns401() {
        ResponseEntity<String> resp = rest.getForEntity(baseUrl() + "/api/v1/admin/me", String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("AUTH_UNAUTHORIZED");
    }

    @Test
    @DisplayName("게이팅(F-T3): 사용자 토큰으로 /admin/me → 403 AUTH_FORBIDDEN")
    void adminMeWithCustomerTokenReturns403() {
        String customerToken = signupAndLogin();

        ResponseEntity<String> resp = getJson("/api/v1/admin/me", customerToken);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("AUTH_FORBIDDEN");
    }
}
