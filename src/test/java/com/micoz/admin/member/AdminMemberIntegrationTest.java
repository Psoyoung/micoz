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
    private static final String MEMBER_PW = "NewMember#Test1234";
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
        jdbcTemplate.update(
                "DELETE FROM his_point WHERE user_seq IN (SELECT user_seq FROM mst_user WHERE user_id LIKE 'mt%')");
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

    // ─────────────────────────── M-T4 회원 등록 ───────────────────────────
    @Test
    @DisplayName("회원 등록 → 200, 등록 계정으로 로그인 가능, 평문 비번 미노출")
    void createMemberSuccess() {
        String newId = "mtnew" + suffix();
        ResponseEntity<String> resp = postJson("/api/v1/admin/members", adminToken,
                Map.of("userId", newId, "userPw", MEMBER_PW, "userName", "신규회원", "gradeCode", "SELLER"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parse(resp.getBody()).path("data").path("userId").asText()).isEqualTo(newId);
        assertThat(resp.getBody()).doesNotContain("userPw");
        assertThat(resp.getBody()).doesNotContain("$2a$");

        // 등록 계정 로그인 가능
        ResponseEntity<String> login = rest.postForEntity(baseUrl() + "/api/v1/auth/login",
                Map.of("userId", newId, "userPw", MEMBER_PW), String.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);

        // 등급 반영 확인
        long seq = userSeqOf(newId);
        assertThat(gradeSeqOf(seq)).isEqualTo(gradeSeq("SELLER"));
    }

    @Test
    @DisplayName("등급 미지정 등록 → 기본 등급 MEMBER")
    void createMemberDefaultGrade() {
        String newId = "mtnew" + suffix();
        ResponseEntity<String> resp = postJson("/api/v1/admin/members", adminToken,
                Map.of("userId", newId, "userPw", MEMBER_PW, "userName", "기본등급회원"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(gradeSeqOf(userSeqOf(newId))).isEqualTo(gradeSeq("MEMBER"));
    }

    @Test
    @DisplayName("중복 아이디 등록 → 409 USER_DUPLICATED_ID")
    void createMemberDuplicate() {
        String dupId = "mtdup" + suffix();
        insertCustomer(dupId, "기존회원", "MEMBER", null);

        ResponseEntity<String> resp = postJson("/api/v1/admin/members", adminToken,
                Map.of("userId", dupId, "userPw", MEMBER_PW, "userName", "중복회원"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("USER_DUPLICATED_ID");
    }

    @Test
    @DisplayName("존재하지 않는 등급코드로 등록 → 404 GRADE_NOT_FOUND")
    void createMemberUnknownGrade() {
        String newId = "mtnew" + suffix();
        ResponseEntity<String> resp = postJson("/api/v1/admin/members", adminToken,
                Map.of("userId", newId, "userPw", MEMBER_PW, "userName", "회원", "gradeCode", "NOPE"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("GRADE_NOT_FOUND");
    }

    // ─────────────────────────── M-T5 포인트 수동 조정 ───────────────────────────
    @Test
    @DisplayName("포인트 적립(+) → 200, point_balance==balance_after 정합 + his_point 1건(i_user 기록)")
    void pointEarn() {
        long seq = insertCustomer("mtpt" + suffix(), "포인트회원", "MEMBER", null);

        ResponseEntity<String> resp = postJson("/api/v1/admin/members/" + seq + "/points",
                adminToken, Map.of("amount", 500, "reason", "운영 보상"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parse(resp.getBody()).path("data").path("pointBalance").asInt()).isEqualTo(500);
        assertThat(pointBalanceOf(seq)).isEqualTo(500);
        assertThat(latestBalanceAfter(seq)).isEqualTo(500);
        assertThat(hisPointCount(seq)).isEqualTo(1);
        assertThat(latestPointIUser(seq)).isEqualTo(adminId);
    }

    @Test
    @DisplayName("포인트 차감(-) → 200, 잔액 감소")
    void pointDeduct() {
        long seq = insertCustomer("mtpt" + suffix(), "포인트회원", "MEMBER", null);
        postJson("/api/v1/admin/members/" + seq + "/points", adminToken,
                Map.of("amount", 500, "reason", "적립"));

        ResponseEntity<String> resp = postJson("/api/v1/admin/members/" + seq + "/points",
                adminToken, Map.of("amount", -200, "reason", "차감"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(pointBalanceOf(seq)).isEqualTo(300);
    }

    @Test
    @DisplayName("과차감(잔액 음수) → 400 POINT_INSUFFICIENT + 잔액·his_point 무변화(롤백)")
    void pointOverDeductRollback() {
        long seq = insertCustomer("mtpt" + suffix(), "포인트회원", "MEMBER", null);
        postJson("/api/v1/admin/members/" + seq + "/points", adminToken,
                Map.of("amount", 100, "reason", "적립"));
        int balanceBefore = pointBalanceOf(seq);
        int countBefore = hisPointCount(seq);

        ResponseEntity<String> resp = postJson("/api/v1/admin/members/" + seq + "/points",
                adminToken, Map.of("amount", -500, "reason", "과차감"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("POINT_INSUFFICIENT");
        // 롤백: 잔액·이력 모두 그대로
        assertThat(pointBalanceOf(seq)).isEqualTo(balanceBefore);
        assertThat(hisPointCount(seq)).isEqualTo(countBefore);
    }

    @Test
    @DisplayName("차감으로 잔액이 정확히 0 → 200 허용 (<0 기준)")
    void pointDeductToExactlyZero() {
        long seq = insertCustomer("mtpt" + suffix(), "포인트회원", "MEMBER", null);
        postJson("/api/v1/admin/members/" + seq + "/points", adminToken,
                Map.of("amount", 100, "reason", "적립"));

        ResponseEntity<String> resp = postJson("/api/v1/admin/members/" + seq + "/points",
                adminToken, Map.of("amount", -100, "reason", "전액 차감"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(pointBalanceOf(seq)).isZero();
        assertThat(latestBalanceAfter(seq)).isZero();
    }

    @Test
    @DisplayName("합산 상한 초과(오버플로 가드) → 400 COMMON_VALIDATION_ERROR + 롤백")
    void pointUpperLimitGuard() {
        long seq = insertCustomer("mtpt" + suffix(), "포인트회원", "MEMBER", null);
        // 잔액을 INTEGER 상한까지 적립(허용, ==Max)
        ResponseEntity<String> toMax = postJson("/api/v1/admin/members/" + seq + "/points",
                adminToken, Map.of("amount", Integer.MAX_VALUE, "reason", "상한까지"));
        assertThat(toMax.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(pointBalanceOf(seq)).isEqualTo(Integer.MAX_VALUE);

        // 추가 +1 → long 합산이 Max 초과 → 거부(int였다면 음수 wrap되어 POINT_INSUFFICIENT로 오판)
        ResponseEntity<String> overflow = postJson("/api/v1/admin/members/" + seq + "/points",
                adminToken, Map.of("amount", 1, "reason", "상한 초과"));
        assertThat(overflow.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(overflow.getBody()).path("code").asText()).isEqualTo("COMMON_VALIDATION_ERROR");
        // 롤백: 잔액 그대로
        assertThat(pointBalanceOf(seq)).isEqualTo(Integer.MAX_VALUE);
    }

    @Test
    @DisplayName("amount=0 → 400 COMMON_VALIDATION_ERROR")
    void pointZeroInvalid() {
        long seq = insertCustomer("mtpt" + suffix(), "포인트회원", "MEMBER", null);
        ResponseEntity<String> resp = postJson("/api/v1/admin/members/" + seq + "/points",
                adminToken, Map.of("amount", 0, "reason", "영"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_VALIDATION_ERROR");
    }

    @Test
    @DisplayName("비CUSTOMER(관리자) 대상 포인트 조정 → 404 USER_NOT_FOUND")
    void pointNonCustomer() {
        long adminSeq = userSeqOf(adminId);
        ResponseEntity<String> resp = postJson("/api/v1/admin/members/" + adminSeq + "/points",
                adminToken, Map.of("amount", 100, "reason", "x"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("USER_NOT_FOUND");
    }

    // ─────────────────────────── helpers ───────────────────────────
    private int pointBalanceOf(long userSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT point_balance FROM mst_user WHERE user_seq = ?", Integer.class, userSeq);
    }

    private int hisPointCount(long userSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT count(*) FROM his_point WHERE user_seq = ?", Integer.class, userSeq);
    }

    private int latestBalanceAfter(long userSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT balance_after FROM his_point WHERE user_seq = ? ORDER BY point_seq DESC LIMIT 1",
                Integer.class, userSeq);
    }

    private String latestPointIUser(long userSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT i_user FROM his_point WHERE user_seq = ? ORDER BY point_seq DESC LIMIT 1",
                String.class, userSeq);
    }

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
