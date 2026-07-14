package com.micoz.admin.inquiry;

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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * CS-T3 답변 등록 E2E — WAITING→ANSWERED 트리거 / 재답변 다중허용 + answeredDate 불변(CS-Q②) /
 * 사용자 노출 왕복(FR-MY-04, ④) / 부재 404 / 필수필드 400. 답변은 append-only(수정/삭제 없음).
 */
class AdminInquiryReplyIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "InqReply#Admin1234";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminId;
    private String adminToken;
    private long adminUserSeq;
    private final List<Long> createdUserSeqs = new ArrayList<>();

    @BeforeEach
    void seedAdmin() {
        adminId = "inqr" + suffix();
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, "
                        + "point_balance, user_status, use_yn, i_user) "
                        + "VALUES (?, ?, '답변관리자', 'ADMIN', 0, 'ACTIVE', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);
        adminUserSeq = jdbcTemplate.queryForObject(
                "SELECT user_seq FROM mst_user WHERE user_id = ?", Long.class, adminId);
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM dat_inquiry_reply WHERE inquiry_seq IN "
                + "(SELECT inquiry_seq FROM dat_inquiry WHERE title LIKE 'CS3%')");
        jdbcTemplate.update("DELETE FROM dat_inquiry WHERE title LIKE 'CS3%'");
        if (!createdUserSeqs.isEmpty()) {
            String inClause = createdUserSeqs.stream().map(String::valueOf).collect(Collectors.joining(","));
            jdbcTemplate.update("DELETE FROM dat_refresh_token WHERE user_seq IN (" + inClause + ")");
            jdbcTemplate.update("DELETE FROM mst_user WHERE user_seq IN (" + inClause + ")");
        }
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'inqr%'");
    }

    @Test
    @DisplayName("답변 등록 → WAITING→ANSWERED + answeredDate 기록 + 사용자 상세에 답변 노출(④ 왕복)")
    void replyTriggersAnsweredAndSurfacesToUser() {
        Seeded s = createInquiry("CS3트리거" + suffix());

        // 등록 전: WAITING
        assertThat(adminDetail(s.inquirySeq()).path("inquiryStatus").asText()).isEqualTo("WAITING");

        postReply(s.inquirySeq(), "안녕하세요, 확인 후 안내드립니다.");

        JsonNode d = adminDetail(s.inquirySeq());
        assertThat(d.path("inquiryStatus").asText()).isEqualTo("ANSWERED");
        assertThat(d.path("answeredDate").isMissingNode()).as("answeredDate 기록").isFalse();
        assertThat(d.path("replies").get(0).path("content").asText()).isEqualTo("안녕하세요, 확인 후 안내드립니다.");
        assertThat(d.path("replies").get(0).path("adminSeq").asLong()).isEqualTo(adminUserSeq);

        // ④ 사용자 본인 상세에도 답변 노출(신규 코드 없이 기존 read 경로)
        JsonNode userData = parse(getJson("/api/v1/me/inquiries/" + s.inquirySeq(), s.ownerToken()).getBody())
                .path("data");
        assertThat(userData.path("inquiryStatus").asText()).isEqualTo("ANSWERED");
        assertThat(userData.path("replies").get(0).path("content").asText())
                .isEqualTo("안녕하세요, 확인 후 안내드립니다.");
        // 목록의 hasReply
        JsonNode listRow = firstUserInquiry(s.ownerToken(), s.inquirySeq());
        assertThat(listRow.path("hasReply").asBoolean()).isTrue();
    }

    @Test
    @DisplayName("재답변 다중 허용 + answeredDate 불변(최초 전이 시각 고정, CS-Q②)")
    void reAnswerAppendsAndKeepsAnsweredDate() {
        Seeded s = createInquiry("CS3재답변" + suffix());

        postReply(s.inquirySeq(), "1차 답변");
        String answeredDate1 = adminDetail(s.inquirySeq()).path("answeredDate").asText();
        assertThat(answeredDate1).isNotBlank();

        postReply(s.inquirySeq(), "2차 추가 답변");
        JsonNode d = adminDetail(s.inquirySeq());

        assertThat(d.path("inquiryStatus").asText()).as("상태 ANSWERED 유지").isEqualTo("ANSWERED");
        assertThat(d.path("replies").size()).as("답변 2건 append(다중 허용)").isEqualTo(2);
        assertThat(d.path("answeredDate").asText())
                .as("재답변해도 answeredDate 불변(최초 == 재답변 후)").isEqualTo(answeredDate1);
    }

    @Test
    @DisplayName("없는 문의에 답변 → 404 INQUIRY_NOT_FOUND")
    void replyToMissingInquiry404() {
        ResponseEntity<String> resp = postJson("/api/v1/admin/inquiries/99999999/replies", adminToken,
                Map.of("content", "본문"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("INQUIRY_NOT_FOUND");
    }

    @Test
    @DisplayName("빈 content → 400 COMMON_VALIDATION_ERROR (필수필드, CS-Q⑤)")
    void blankContentRejected() {
        Seeded s = createInquiry("CS3검증" + suffix());
        ResponseEntity<String> resp = postJson("/api/v1/admin/inquiries/" + s.inquirySeq() + "/replies",
                adminToken, Map.of("content", "   "));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_VALIDATION_ERROR");
        // 답변/상태 부수효과 0
        assertThat(adminDetail(s.inquirySeq()).path("inquiryStatus").asText()).isEqualTo("WAITING");
        assertThat(adminDetail(s.inquirySeq()).path("replies").size()).isZero();
    }

    // ───────────────────────── helpers ─────────────────────────

    private void postReply(long inquirySeq, String content) {
        ResponseEntity<String> resp = postJson("/api/v1/admin/inquiries/" + inquirySeq + "/replies",
                adminToken, Map.of("content", content));
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);
    }

    private JsonNode adminDetail(long inquirySeq) {
        ResponseEntity<String> resp = getJson("/api/v1/admin/inquiries/" + inquirySeq, adminToken);
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
    }

    private JsonNode firstUserInquiry(String userToken, long inquirySeq) {
        JsonNode content = parse(getJson("/api/v1/me/inquiries", userToken).getBody())
                .path("data").path("content");
        for (JsonNode row : content) {
            if (row.path("inquirySeq").asLong() == inquirySeq) return row;
        }
        throw new AssertionError("user list missing inquiry " + inquirySeq);
    }

    private Seeded createInquiry(String title) {
        String userToken = signupAndLogin();
        Map<String, Object> body = Map.of(
                "inquiryType", "PRODUCT", "title", title, "content", "본문 " + title, "privateYn", "N");
        long inquirySeq = parse(postJson("/api/v1/me/inquiries", userToken, body).getBody())
                .path("data").path("inquirySeq").asLong();
        long ownerSeq = jdbcTemplate.queryForObject(
                "SELECT user_seq FROM dat_inquiry WHERE inquiry_seq = ?", Long.class, inquirySeq);
        createdUserSeqs.add(ownerSeq);
        return new Seeded(inquirySeq, ownerSeq, userToken);
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

    private record Seeded(long inquirySeq, long ownerSeq, String ownerToken) {}
}
