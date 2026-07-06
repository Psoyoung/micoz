package com.micoz.admin.inquiry;

import com.fasterxml.jackson.databind.JsonNode;
import com.micoz.support.IntegrationTestSupport;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
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
 * CS-T2 관리자 문의 조회 E2E — 검색(다축·LIKE 이스케이프·정렬 화이트리스트) / 상세(전 회원·비공개·답변 admin DTO) /
 * N+1 / adminSeq 관리자 전용(사용자 미노출, §3.5). 문의는 사용자 실제 등록(POST /me/inquiries)으로 만들고,
 * 답변/ANSWERED는 CS-T3 미구현이라 jdbc로 시드한다.
 */
class AdminInquiryQueryIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "InqQuery#Admin1234";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private String adminId;
    private String adminToken;
    private long adminUserSeq;
    /** createInquiry가 signupAndLogin으로 만든 CUSTOMER user_seq — @AfterEach에서 정리(격리: 활성 회원 수 오염 방지). */
    private final List<Long> createdUserSeqs = new ArrayList<>();

    @BeforeEach
    void seedAdmin() {
        adminId = "inqq" + suffix();
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, "
                        + "point_balance, user_status, use_yn, i_user) "
                        + "VALUES (?, ?, '문의조회관리자', 'ADMIN', 0, 'ACTIVE', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);
        adminUserSeq = jdbcTemplate.queryForObject(
                "SELECT user_seq FROM mst_user WHERE user_id = ?", Long.class, adminId);
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM dat_inquiry_reply WHERE inquiry_seq IN "
                + "(SELECT inquiry_seq FROM dat_inquiry WHERE title LIKE 'CS2%' OR title LIKE 'NPI-%')");
        jdbcTemplate.update("DELETE FROM dat_inquiry WHERE title LIKE 'CS2%' OR title LIKE 'NPI-%'");
        // signupAndLogin으로 만든 CUSTOMER 유저 정리 — 남기면 활성 회원 수 기반 테스트(AdminMemberSearch)를 오염시킴.
        if (!createdUserSeqs.isEmpty()) {
            String inClause = createdUserSeqs.stream().map(String::valueOf).collect(Collectors.joining(","));
            jdbcTemplate.update("DELETE FROM dat_refresh_token WHERE user_seq IN (" + inClause + ")");
            jdbcTemplate.update("DELETE FROM mst_user WHERE user_seq IN (" + inClause + ")");
        }
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'inqq%'");
    }

    @Test
    @DisplayName("검색: title(q)·inquiryType·inquiryStatus·userSeq 필터 + userSeq 노출")
    void searchFilters() {
        Seeded s = createInquiry("PRODUCT", "CS2제목재입고" + suffix(), "N");

        JsonNode row = firstRowWithSeq(listData("?q=" + s.title()), s.inquirySeq());
        assertThat(row).as("제목 부분일치로 조회").isNotNull();
        assertThat(row.path("userSeq").asLong()).isEqualTo(s.ownerSeq());
        assertThat(row.path("userSeq").asLong()).isNotEqualTo(adminUserSeq); // 관리자는 남의 문의를 본다
        assertThat(row.path("inquiryType").asText()).isEqualTo("PRODUCT");
        assertThat(row.path("inquiryStatus").asText()).isEqualTo("WAITING");
        assertThat(row.path("hasReply").asBoolean()).isFalse();

        // inquiryType 불일치 → 제외
        assertThat(firstRowWithSeq(listData("?q=" + s.title() + "&inquiryType=ORDER"), s.inquirySeq())).isNull();
        // inquiryStatus=ANSWERED → WAITING 문의 제외
        assertThat(firstRowWithSeq(listData("?q=" + s.title() + "&inquiryStatus=ANSWERED"), s.inquirySeq())).isNull();
        // userSeq 필터 → 포함
        assertThat(firstRowWithSeq(listData("?userSeq=" + s.ownerSeq()), s.inquirySeq())).isNotNull();
    }

    @Test
    @DisplayName("LIKE 이스케이프: q에 '%' 메타문자 넣어도 전건 매칭 안 됨(리터럴 취급)")
    void likeEscape() {
        Seeded s = createInquiry("ETC", "CS2리터럴" + suffix(), "N");
        // '%'는 이스케이프되어 리터럴 '%'로 검색 → 제목에 '%' 없으므로 이 문의 미매칭
        assertThat(firstRowWithSeq(listData("?q=%25"), s.inquirySeq()))
                .as("'%'가 와일드카드로 새면 전건 매칭됨 — 이스케이프 확인").isNull();
    }

    @Test
    @DisplayName("정렬 화이트리스트: 미허용 키 → 400 COMMON_INVALID_REQUEST")
    void sortWhitelistRejectsUnknownKey() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/inquiries?sort=hackerField,desc", adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_INVALID_REQUEST");
    }

    @Test
    @DisplayName("상세: 전 회원 문의(본인-행 제약 없음) + 답변 이력 + adminSeq(admin DTO)")
    void detailWithReplyAndAdminSeq() {
        Seeded s = createInquiry("DELIVERY", "CS2상세" + suffix(), "N");
        answerViaJdbc(s.inquirySeq(), "확인해 드리겠습니다.");

        JsonNode d = detailData(s.inquirySeq());
        assertThat(d.path("userSeq").asLong()).isEqualTo(s.ownerSeq());
        assertThat(d.path("inquiryStatus").asText()).isEqualTo("ANSWERED");
        assertThat(d.path("answeredDate").isMissingNode()).isFalse();
        JsonNode reply = d.path("replies").get(0);
        assertThat(reply.path("content").asText()).isEqualTo("확인해 드리겠습니다.");
        assertThat(reply.path("adminSeq").asLong()).as("admin 상세엔 adminSeq 노출").isEqualTo(adminUserSeq);
    }

    @Test
    @DisplayName("상세 부재 → 404 INQUIRY_NOT_FOUND")
    void detailNotFound() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/inquiries/99999999", adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("INQUIRY_NOT_FOUND");
    }

    @Test
    @DisplayName("비공개 문의(private_yn='Y')도 관리자에겐 목록·상세 노출")
    void privateInquiryVisibleToAdmin() {
        Seeded s = createInquiry("ETC", "CS2비공개" + suffix(), "Y");
        assertThat(firstRowWithSeq(listData("?q=" + s.title()), s.inquirySeq()))
                .as("비공개도 관리자 목록에 노출").isNotNull();
        JsonNode d = detailData(s.inquirySeq());
        assertThat(d.path("privateYn").asText()).isEqualTo("Y");
    }

    @Test
    @DisplayName("adminSeq 관리자 전용 — 사용자 본인 상세(/me/inquiries)엔 노출 안 됨(§3.5)")
    void adminSeqNotExposedToUser() {
        Seeded s = createInquiry("PRODUCT", "CS2노출" + suffix(), "N");
        answerViaJdbc(s.inquirySeq(), "답변 본문입니다.");

        // admin 상세: adminSeq 있음
        assertThat(detailData(s.inquirySeq()).path("replies").get(0).path("adminSeq").isMissingNode()).isFalse();

        // 사용자 본인 상세: 답변 content는 보이되 adminSeq 필드는 없음
        ResponseEntity<String> userResp = getJson("/api/v1/me/inquiries/" + s.inquirySeq(), s.ownerToken());
        assertThat(userResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode userReply = parse(userResp.getBody()).path("data").path("replies").get(0);
        assertThat(userReply.path("content").asText()).isEqualTo("답변 본문입니다.");
        assertThat(userReply.path("adminSeq").isMissingNode())
                .as("사용자 응답에는 운영자 식별정보(adminSeq) 없음").isTrue();
    }

    @Test
    @DisplayName("[N+1] 문의 수가 늘어도 목록 statement 상수(hasReply는 상태 파생 — 행별 조회 없음)")
    void listNoNPlusOne() {
        getJson("/api/v1/admin/inquiries?q=NPI-", adminToken); // 워밍업

        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);

        for (int i = 0; i < 21; i++) insertInquiry("NPI-a-" + i + "-" + suffix());
        stats.clear();
        listData("?q=NPI-&size=20");
        long small = stats.getPrepareStatementCount();

        for (int i = 0; i < 21; i++) insertInquiry("NPI-b-" + i + "-" + suffix());
        stats.clear();
        listData("?q=NPI-&size=20");
        long large = stats.getPrepareStatementCount();

        assertThat(large).as("문의 21→42로 늘어도 목록 statement 상수(N+1 금지)").isEqualTo(small);
        assertThat(small).as("content + count(+ 인증 부수) 상수").isLessThanOrEqualTo(8);
    }

    // ───────────────────────── helpers ─────────────────────────

    private JsonNode listData(String queryString) {
        ResponseEntity<String> resp = getJson("/api/v1/admin/inquiries" + queryString, adminToken);
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
    }

    private JsonNode detailData(long inquirySeq) {
        ResponseEntity<String> resp = getJson("/api/v1/admin/inquiries/" + inquirySeq, adminToken);
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
    }

    private JsonNode firstRowWithSeq(JsonNode pageData, long inquirySeq) {
        for (JsonNode row : pageData.path("content")) {
            if (row.path("inquirySeq").asLong() == inquirySeq) return row;
        }
        return null;
    }

    /** 사용자 실제 등록(POST /me/inquiries) — 소유자는 admin이 아닌 일반 유저. */
    private Seeded createInquiry(String type, String title, String privateYn) {
        String userToken = signupAndLogin();
        Map<String, Object> body = Map.of(
                "inquiryType", type, "title", title, "content", "본문 " + title, "privateYn", privateYn);
        JsonNode data = parse(postJson("/api/v1/me/inquiries", userToken, body).getBody()).path("data");
        long inquirySeq = data.path("inquirySeq").asLong();
        long ownerSeq = jdbcTemplate.queryForObject(
                "SELECT user_seq FROM dat_inquiry WHERE inquiry_seq = ?", Long.class, inquirySeq);
        createdUserSeqs.add(ownerSeq);
        return new Seeded(inquirySeq, ownerSeq, title, userToken);
    }

    /** CS-T3 미구현이라 답변/ANSWERED를 jdbc로 시드(admin_seq = 이 관리자). */
    private void answerViaJdbc(long inquirySeq, String content) {
        jdbcTemplate.update(
                "UPDATE dat_inquiry SET inquiry_status = 'ANSWERED', answered_date = NOW() WHERE inquiry_seq = ?",
                inquirySeq);
        jdbcTemplate.update(
                "INSERT INTO dat_inquiry_reply (inquiry_seq, admin_seq, content, use_yn, i_user) "
                        + "VALUES (?, ?, ?, 'Y', 'TEST')",
                inquirySeq, adminUserSeq, content);
    }

    private void insertInquiry(String title) {
        String no = "IQ-" + suffix() + "-" + Math.abs(title.hashCode() % 100000);
        jdbcTemplate.update(
                "INSERT INTO dat_inquiry (inquiry_no, user_seq, inquiry_type, title, content, "
                        + "inquiry_status, private_yn, use_yn, i_user) "
                        + "VALUES (?, ?, 'ETC', ?, '본문', 'WAITING', 'N', 'Y', 'TEST')",
                no, adminUserSeq, title);
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

    private record Seeded(long inquirySeq, long ownerSeq, String title, String ownerToken) {}
}
