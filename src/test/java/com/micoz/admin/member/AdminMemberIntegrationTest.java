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

    // ─────────────────────────── M-T3 등급·상태 변경 ───────────────────────────
    @Test
    @DisplayName("등급 변경 → 200, grade_seq 반영 + u_user=관리자 기록")
    void changeGradeSuccess() {
        String memberId = "mtgrade" + suffix();
        long memberSeq = insertCustomer(memberId, "등급변경회원", "MEMBER", null);

        ResponseEntity<String> resp = patchJson("/api/v1/admin/members/" + memberSeq + "/grade",
                adminToken, Map.of("gradeCode", "SENIOR"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(gradeSeqOf(memberSeq)).isEqualTo(gradeSeq("SENIOR"));
        assertThat(uUserOf(memberSeq)).isEqualTo(adminId);
    }

    @Test
    @DisplayName("존재하지 않는 등급 코드로 변경 → 404 GRADE_NOT_FOUND")
    void changeGradeUnknown() {
        long memberSeq = insertCustomer("mtgrade" + suffix(), "회원", "MEMBER", null);
        ResponseEntity<String> resp = patchJson("/api/v1/admin/members/" + memberSeq + "/grade",
                adminToken, Map.of("gradeCode", "NOPE"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("GRADE_NOT_FOUND");
    }

    @Test
    @DisplayName("상태 변경(SUSPENDED) → 200, user_status 반영 (use_yn 불변)")
    void changeStatusSuccess() {
        long memberSeq = insertCustomer("mtstat" + suffix(), "상태변경회원", "MEMBER", null);

        ResponseEntity<String> resp = patchJson("/api/v1/admin/members/" + memberSeq + "/status",
                adminToken, Map.of("status", "SUSPENDED"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(statusOf(memberSeq)).isEqualTo("SUSPENDED");
        assertThat(useYnOf(memberSeq)).isEqualTo("Y"); // 탈퇴(use_yn)는 건드리지 않음
    }

    @Test
    @DisplayName("허용되지 않는 상태값(WITHDRAWN) → 400 MEMBER_INVALID_STATUS")
    void changeStatusInvalid() {
        long memberSeq = insertCustomer("mtstat" + suffix(), "회원", "MEMBER", null);
        ResponseEntity<String> resp = patchJson("/api/v1/admin/members/" + memberSeq + "/status",
                adminToken, Map.of("status", "WITHDRAWN"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("MEMBER_INVALID_STATUS");
    }

    @Test
    @DisplayName("비CUSTOMER(관리자) 대상 등급/상태 변경 → 404 USER_NOT_FOUND")
    void changeNonCustomerHidden() {
        long adminSeq = userSeqOf(adminId);

        ResponseEntity<String> grade = patchJson("/api/v1/admin/members/" + adminSeq + "/grade",
                adminToken, Map.of("gradeCode", "SENIOR"));
        assertThat(grade.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(grade.getBody()).path("code").asText()).isEqualTo("USER_NOT_FOUND");

        ResponseEntity<String> status = patchJson("/api/v1/admin/members/" + adminSeq + "/status",
                adminToken, Map.of("status", "SUSPENDED"));
        assertThat(status.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(status.getBody()).path("code").asText()).isEqualTo("USER_NOT_FOUND");
    }

    // ─────────────────────────── helpers ───────────────────────────
    private Long gradeSeqOf(long userSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT grade_seq FROM mst_user WHERE user_seq = ?", Long.class, userSeq);
    }

    private String statusOf(long userSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT user_status FROM mst_user WHERE user_seq = ?", String.class, userSeq);
    }

    private String useYnOf(long userSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT use_yn FROM mst_user WHERE user_seq = ?", String.class, userSeq);
    }

    private String uUserOf(long userSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT u_user FROM mst_user WHERE user_seq = ?", String.class, userSeq);
    }

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
