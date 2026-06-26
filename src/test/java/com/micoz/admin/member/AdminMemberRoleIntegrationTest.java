package com.micoz.admin.member;

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
 * M-T6 role 승강(ADMIN↔CUSTOMER) + 자가잠금/ROOT 보호 E2E.
 * F-T5 AdminAccountGuard 재사용. 픽스처는 'mt' 접두사로 정리.
 *
 * <p>참고: '마지막 ADMIN 강등 보호'(ADMIN_LAST_ADMIN_PROTECTED)는 코드상 적용되며
 * AdminAccountGuardTest(단위, mock)로 검증된다. role 강등 경로에서는 실행 주체가 항상
 * 운영 ADMIN으로 카운트되므로(=대상이 본인일 때만 마지막), 런타임상 자기 강등(SELF_LOCKOUT)으로
 * 우선 차단된다 — 본 E2E는 도달 가능한 케이스(self/ROOT/승격/강등)를 검증한다.
 */
class AdminMemberRoleIntegrationTest extends IntegrationTestSupport {

    private static final String PW = "RolePromote#Test1234";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminId;
    private String adminToken;

    @BeforeEach
    void seedActingAdmin() {
        adminId = "mtactadm" + suffix();
        insertUser(adminId, "운영자", "ADMIN", null);
        adminToken = adminLogin(adminId, PW);
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'mt%'");
    }

    @Test
    @DisplayName("CUSTOMER → ADMIN 승격 → 200, role=ADMIN·grade=null, 관리자 로그인 가능")
    void promoteCustomerToAdmin() {
        String memberId = "mtprom" + suffix();
        long memberSeq = insertUser(memberId, "승격대상", "CUSTOMER", gradeSeq("MEMBER"));

        ResponseEntity<String> resp = patchJson("/api/v1/admin/members/" + memberSeq + "/role",
                adminToken, Map.of("role", "ADMIN"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(roleOf(memberSeq)).isEqualTo("ADMIN");
        assertThat(gradeSeqOf(memberSeq)).isNull();

        // 승격 계정으로 관리자 로그인 가능 + role 클레임 ADMIN
        String token = adminLogin(memberId, PW);
        assertThat(token).isNotBlank();
        ResponseEntity<String> me = getJson("/api/v1/admin/me", token);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parse(me.getBody()).path("data").path("role").asText()).isEqualTo("ADMIN");
    }

    @Test
    @DisplayName("ADMIN → CUSTOMER 강등 → 200, role=CUSTOMER·grade=MEMBER, 관리자 로그인 거부/일반 로그인 가능")
    void demoteAdminToCustomer() {
        String targetId = "mtdemo" + suffix();
        long targetSeq = insertUser(targetId, "강등대상", "ADMIN", null); // 운영 ADMIN 2명(acting+target)

        ResponseEntity<String> resp = patchJson("/api/v1/admin/members/" + targetSeq + "/role",
                adminToken, Map.of("role", "CUSTOMER"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(roleOf(targetSeq)).isEqualTo("CUSTOMER");
        assertThat(gradeSeqOf(targetSeq)).isEqualTo(gradeSeq("MEMBER"));

        // 관리자 로그인 거부(role 게이트), 일반 로그인은 가능
        ResponseEntity<String> adminLoginResp = rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", targetId, "userPw", PW), String.class);
        assertThat(adminLoginResp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<String> userLoginResp = rest.postForEntity(baseUrl() + "/api/v1/auth/login",
                Map.of("userId", targetId, "userPw", PW), String.class);
        assertThat(userLoginResp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("본인 role 변경 시도 → 409 ADMIN_SELF_LOCKOUT")
    void selfRoleChangeBlocked() {
        long selfSeq = userSeqOf(adminId);
        ResponseEntity<String> resp = patchJson("/api/v1/admin/members/" + selfSeq + "/role",
                adminToken, Map.of("role", "CUSTOMER"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("ADMIN_SELF_LOCKOUT");
    }

    @Test
    @DisplayName("ROOT 대상 role 변경 → 409 ADMIN_ROOT_PROTECTED")
    void rootRoleChangeBlocked() {
        long rootSeq = userSeqOf("ROOT");
        ResponseEntity<String> resp = patchJson("/api/v1/admin/members/" + rootSeq + "/role",
                adminToken, Map.of("role", "CUSTOMER"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("ADMIN_ROOT_PROTECTED");
    }

    @Test
    @DisplayName("허용되지 않는 role 값 → 400 COMMON_VALIDATION_ERROR")
    void invalidRoleValue() {
        long memberSeq = insertUser("mtprom" + suffix(), "회원", "CUSTOMER", gradeSeq("MEMBER"));
        ResponseEntity<String> resp = patchJson("/api/v1/admin/members/" + memberSeq + "/role",
                adminToken, Map.of("role", "SUPERUSER"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_VALIDATION_ERROR");
    }

    @Test
    @DisplayName("존재하지 않는 대상 role 변경 → 404 USER_NOT_FOUND")
    void targetNotFound() {
        ResponseEntity<String> resp = patchJson("/api/v1/admin/members/99999999/role",
                adminToken, Map.of("role", "ADMIN"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("USER_NOT_FOUND");
    }

    // ─────────────────────────── helpers ───────────────────────────
    private long insertUser(String userId, String userName, String role, Long gradeSeq) {
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, grade_seq, "
                        + "point_balance, user_status, service_yn, privacy_yn, use_yn, i_user) "
                        + "VALUES (?, ?, ?, ?, ?, 0, 'ACTIVE', 'Y', 'Y', 'Y', 'TEST')",
                userId, passwordEncoder.encode(PW), userName, role, gradeSeq);
        return userSeqOf(userId);
    }

    private Long gradeSeq(String gradeCode) {
        return jdbcTemplate.queryForObject(
                "SELECT grade_seq FROM mst_user_grade WHERE grade_code = ? AND use_yn = 'Y'",
                Long.class, gradeCode);
    }

    private long userSeqOf(String userId) {
        return jdbcTemplate.queryForObject(
                "SELECT user_seq FROM mst_user WHERE user_id = ?", Long.class, userId);
    }

    private String roleOf(long userSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT user_role FROM mst_user WHERE user_seq = ?", String.class, userSeq);
    }

    private Long gradeSeqOf(long userSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT grade_seq FROM mst_user WHERE user_seq = ?", Long.class, userSeq);
    }

    private String adminLogin(String userId, String pw) {
        ResponseEntity<String> resp = rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", userId, "userPw", pw), String.class);
        return parse(resp.getBody()).path("data").path("accessToken").asText();
    }

    private String suffix() {
        String unique = String.valueOf(System.nanoTime());
        return unique.substring(unique.length() - 8);
    }
}
