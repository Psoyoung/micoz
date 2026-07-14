package com.micoz.admin.user;

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
 * F-T6 관리자 계정 추가/목록/상태 관리 E2E.
 * 비밀번호는 테스트 픽스처(실제 시크릿 아님). 모든 테스트 admin은 'ftest' 접두사로 생성 후 정리.
 */
class AdminUserIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "AdminMgmt#Test1234";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String actingAdminId;
    private String actingToken;
    private long actingSeq;

    @BeforeEach
    void seedActingAdmin() {
        String unique = String.valueOf(System.nanoTime());
        actingAdminId = "ftestact" + unique.substring(unique.length() - 8);
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, user_status, "
                        + "service_yn, privacy_yn, use_yn, i_user) "
                        + "VALUES (?, ?, '운영자', 'ADMIN', 'ACTIVE', 'Y', 'Y', 'Y', 'TEST')",
                actingAdminId, passwordEncoder.encode(ADMIN_PW));
        actingToken = adminToken(actingAdminId, ADMIN_PW);
        actingSeq = parse(getJson("/api/v1/admin/me", actingToken).getBody()).path("data").path("userSeq").asLong();
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'ftest%'");
    }

    private String adminToken(String userId, String pw) {
        ResponseEntity<String> resp = rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", userId, "userPw", pw), String.class);
        return parse(resp.getBody()).path("data").path("accessToken").asText();
    }

    private String newAdminId() {
        String unique = String.valueOf(System.nanoTime());
        return "ftestnew" + unique.substring(unique.length() - 9);
    }

    @Test
    @DisplayName("관리자 추가 → 200, 추가된 계정으로 관리자 로그인 가능")
    void createAdminSuccess() {
        String newId = newAdminId();
        ResponseEntity<String> resp = postJson("/api/v1/admin/admins", actingToken,
                Map.of("userId", newId, "userPw", ADMIN_PW, "userName", "신규관리자"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parse(resp.getBody()).path("data").path("userId").asText()).isEqualTo(newId);

        // 추가된 관리자 로그인 가능
        ResponseEntity<String> login = rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", newId, "userPw", ADMIN_PW), String.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("중복 아이디로 관리자 추가 → USER_DUPLICATED_ID")
    void duplicateUserId() {
        ResponseEntity<String> resp = postJson("/api/v1/admin/admins", actingToken,
                Map.of("userId", actingAdminId, "userPw", ADMIN_PW, "userName", "중복"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("USER_DUPLICATED_ID");
    }

    @Test
    @DisplayName("관리자 목록 → 추가한 계정 포함")
    void listContainsCreated() {
        String newId = newAdminId();
        postJson("/api/v1/admin/admins", actingToken,
                Map.of("userId", newId, "userPw", ADMIN_PW, "userName", "신규관리자"));

        ResponseEntity<String> resp = getJson("/api/v1/admin/admins?size=100", actingToken);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode content = parse(resp.getBody()).path("data").path("content");
        boolean found = false;
        for (JsonNode item : content) {
            if (newId.equals(item.path("userId").asText())) {
                found = true;
                break;
            }
        }
        assertThat(found).isTrue();
    }

    @Test
    @DisplayName("본인 계정 비활성화 → ADMIN_SELF_LOCKOUT")
    void selfDeactivateBlocked() {
        ResponseEntity<String> resp = patchJson(
                "/api/v1/admin/admins/" + actingSeq + "/status", actingToken,
                Map.of("active", false));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("ADMIN_SELF_LOCKOUT");
    }

    @Test
    @DisplayName("다른 관리자 비활성화 → 200, 비활성 계정 로그인 차단, 재활성화 시 복구")
    void deactivateAndReactivateAnotherAdmin() {
        String newId = newAdminId();
        long newSeq = parse(postJson("/api/v1/admin/admins", actingToken,
                Map.of("userId", newId, "userPw", ADMIN_PW, "userName", "대상관리자")).getBody())
                .path("data").path("userSeq").asLong();

        // 비활성화
        ResponseEntity<String> deact = patchJson(
                "/api/v1/admin/admins/" + newSeq + "/status", actingToken, Map.of("active", false));
        assertThat(deact.getStatusCode()).isEqualTo(HttpStatus.OK);

        // 비활성 관리자 로그인 차단 (useYn=N → findActive 제외)
        ResponseEntity<String> blockedLogin = rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", newId, "userPw", ADMIN_PW), String.class);
        assertThat(blockedLogin.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // 재활성화 → 로그인 복구
        ResponseEntity<String> react = patchJson(
                "/api/v1/admin/admins/" + newSeq + "/status", actingToken, Map.of("active", true));
        assertThat(react.getStatusCode()).isEqualTo(HttpStatus.OK);
        ResponseEntity<String> okLogin = rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", newId, "userPw", ADMIN_PW), String.class);
        assertThat(okLogin.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("비관리자 대상 상태 변경 → USER_NOT_FOUND (관리자 관리 엔드포인트)")
    void nonAdminTargetNotFound() {
        String customerToken = signupAndLogin();
        long custSeq = parse(getJson("/api/v1/me", customerToken).getBody())
                .path("data").path("userSeq").asLong();

        ResponseEntity<String> resp = patchJson(
                "/api/v1/admin/admins/" + custSeq + "/status", actingToken, Map.of("active", false));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("USER_NOT_FOUND");
    }

    // ───────────── 정렬 화이트리스트 (빚 #12 해소) ─────────────

    @Test
    @DisplayName("허용 정렬 필드(userName)로 정렬 → 200")
    void allowedSortField() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/admins?sort=userName,asc", actingToken);
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("민감 컬럼(userPw) 정렬 시도 → 400 COMMON_INVALID_REQUEST (노출 차단)")
    void sensitiveSortFieldRejected() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/admins?sort=userPw,asc", actingToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_INVALID_REQUEST");
    }

    @Test
    @DisplayName("존재하지 않는 정렬 필드 → 400 (500 아님 = 이 수정의 핵심)")
    void unknownSortFieldIs400Not500() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/admins?sort=nopeField,asc", actingToken);
        assertThat(resp.getStatusCode()).as("500이 아니라 400이어야 함: %s", resp.getBody())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resp.getStatusCode().value()).isNotEqualTo(500);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_INVALID_REQUEST");
    }

    @Test
    @DisplayName("정렬 미지정 기본 조회 → 200 (기본 userSeq desc, 회귀 없음)")
    void defaultListNoSort() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/admins", actingToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parse(resp.getBody()).path("data").path("content").isArray()).isTrue();
    }
}
