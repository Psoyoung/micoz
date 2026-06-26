package com.micoz.admin.member;

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
 * 회원 상세/등록/상태·등급 변경/포인트 (M-T2~). 본 클래스는 M-T2(상세)부터 채운다.
 * 픽스처는 'mt' 접두사로 생성 후 정리. 비밀번호는 테스트 픽스처(실제 시크릿 아님).
 */
class AdminMemberIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "MemberMgmt#Test1234";
    private static final String DUMMY_HASH =
            "$2a$12$invalidplaceholderxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminId;
    private String adminToken;

    @BeforeEach
    void seedAdmin() {
        adminId = "mtadmin" + suffix();
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, user_status, "
                        + "service_yn, privacy_yn, use_yn, i_user) "
                        + "VALUES (?, ?, '운영자', 'ADMIN', 'ACTIVE', 'Y', 'Y', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'mt%'");
    }

    // ─────────────────────────── M-T2 회원 상세 ───────────────────────────
    @Test
    @DisplayName("회원 상세 → 200, 필드/등급명/추천인 채워짐, 비밀번호 미포함")
    void detailSuccess() {
        long referrerSeq = insertCustomer("mtref" + suffix(), "추천인", "MEMBER", null);
        String memberId = "mtmem" + suffix();
        long memberSeq = insertCustomer(memberId, "상세회원", "MASTER", referrerSeq);

        ResponseEntity<String> resp = getJson("/api/v1/admin/members/" + memberSeq, adminToken);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode data = parse(resp.getBody()).path("data");
        assertThat(data.path("userSeq").asLong()).isEqualTo(memberSeq);
        assertThat(data.path("userId").asText()).isEqualTo(memberId);
        assertThat(data.path("userRole").asText()).isEqualTo("CUSTOMER");
        assertThat(data.path("gradeCode").asText()).isEqualTo("MASTER");
        assertThat(data.path("gradeName").asText()).isEqualTo("마스터");
        assertThat(data.path("referrerUserId").asText()).startsWith("mtref");

        // 비밀번호/해시 미노출
        assertThat(resp.getBody()).doesNotContain("userPw");
        assertThat(resp.getBody()).doesNotContain("$2a$");
    }

    @Test
    @DisplayName("존재하지 않는 회원 상세 → 404 USER_NOT_FOUND")
    void detailNotFound() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/members/99999999", adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("USER_NOT_FOUND");
    }

    @Test
    @DisplayName("ADMIN 대상 상세 조회 → 404 USER_NOT_FOUND (관리자 비노출)")
    void detailAdminTargetHidden() {
        long adminSeq = userSeqOf(adminId);
        ResponseEntity<String> resp = getJson("/api/v1/admin/members/" + adminSeq, adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("USER_NOT_FOUND");
    }

    // ─────────────────────────── helpers ───────────────────────────
    private long insertCustomer(String userId, String userName, String gradeCode, Long referrerSeq) {
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, grade_seq, "
                        + "point_balance, user_status, use_yn, referrer_user_seq, i_user) "
                        + "VALUES (?, ?, ?, 'CUSTOMER', ?, 0, 'ACTIVE', 'Y', ?, 'TEST')",
                userId, DUMMY_HASH, userName, gradeSeq(gradeCode), referrerSeq);
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
