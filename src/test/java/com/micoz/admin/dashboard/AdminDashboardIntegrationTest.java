package com.micoz.admin.dashboard;

import com.fasterxml.jackson.databind.JsonNode;
import com.micoz.admin.dashboard.dto.DashboardSummaryResponse;
import com.micoz.admin.dashboard.service.DashboardQueryService;
import com.micoz.admin.dashboard.support.KstPeriods;
import com.micoz.admin.dashboard.support.KstPeriods.Range;
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

import java.time.OffsetDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * D-T2 대시보드 엔드포인트 E2E — RBAC(401/403) · 컨트롤러가 D-T1 서비스 숫자를 무왜곡 · 추이 일별 합=summary 정합 ·
 * period 검증 400 · 빈 기간 NPE/NaN 없음. 2099 격리 윈도우 + 'DSHT' 마커. 일별 순매출 음수(정상)도 왕복 확인.
 */
class AdminDashboardIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "Dash#Admin1234";
    private static final long DUMMY = 900002L;
    private static final String SUMMARY = "/api/v1/admin/dashboard/summary";
    private static final String TREND = "/api/v1/admin/dashboard/sales-trend";

    @Autowired
    private DashboardQueryService service;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;

    @BeforeEach
    void seedAdmin() {
        String adminId = "dsht-adm" + suffix();
        jdbc.update("INSERT INTO mst_user (user_id, user_pw, user_name, user_role, point_balance, "
                        + "user_status, use_yn, i_user) VALUES (?, ?, '대시보드관리자', 'ADMIN', 0, 'ACTIVE', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);
    }

    @AfterEach
    void cleanup() {
        jdbc.update("DELETE FROM dat_order WHERE order_no LIKE 'DSHT%'");
        jdbc.update("DELETE FROM dat_return WHERE return_no LIKE 'DSHT%'");
        // refresh token 먼저(user_seq 참조), 그다음 회원 — 활성 CUSTOMER 누출 방지(빚 #9 계열 재발 차단)
        jdbc.update("DELETE FROM dat_refresh_token WHERE user_seq IN "
                + "(SELECT user_seq FROM mst_user WHERE user_id LIKE 'dsht%')");
        jdbc.update("DELETE FROM mst_user WHERE user_id LIKE 'dsht%'");
    }

    // ───────────────────────── RBAC ─────────────────────────

    @Test
    @DisplayName("RBAC — 비인증 401, CUSTOMER 토큰 403 (F-T3/F-T4)")
    void rbac() {
        // 비인증 → 401 AUTH_UNAUTHORIZED
        ResponseEntity<String> noAuth = rest.getForEntity(baseUrl() + SUMMARY, String.class);
        assertThat(noAuth.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        // CUSTOMER 토큰 → 403 AUTH_FORBIDDEN (dsht 마커로 시드해 @AfterEach가 정리 — 활성 CUSTOMER 누출 방지)
        String customer = customerLogin();
        ResponseEntity<String> forbidden = getJson(SUMMARY, customer);
        assertThat(forbidden.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(parse(forbidden.getBody()).path("code").asText()).isEqualTo("AUTH_FORBIDDEN");
    }

    // ───────────────────────── 값 정합 ─────────────────────────

    @Test
    @DisplayName("DA1 summary — 컨트롤러 응답이 D-T1 서비스 집계와 정확히 일치(무왜곡)")
    void summaryMatchesService() {
        order("DSHT-A", "DELIVERED", 100000, kst("2099-03-10T10:00:00+09:00"));
        ret("DSHT-A", "RETURN", "COMPLETED", 30000, kst("2099-03-15T10:00:00+09:00"));
        order("DSHT-B", "PAID", 50000, kst("2099-03-05T10:00:00+09:00"));

        String from = "2099-03-01T00:00:00Z";
        String to = "2099-04-01T00:00:00Z";
        Range svcRange = KstPeriods.ofCustom(OffsetDateTime.parse(from), OffsetDateTime.parse(to));
        DashboardSummaryResponse expected = service.summary(svcRange);

        JsonNode data = okData(SUMMARY + "?dateFrom=" + from + "&dateTo=" + to);
        assertThat(data.path("grossSales").decimalValue()).isEqualByComparingTo(expected.getGrossSales());
        assertThat(data.path("netSales").decimalValue()).isEqualByComparingTo(expected.getNetSales());
        assertThat(data.path("orderCount").asLong()).isEqualTo(expected.getOrderCount());
        // 손계산 재확인
        assertThat(data.path("grossSales").decimalValue()).isEqualByComparingTo("150000");
        assertThat(data.path("netSales").decimalValue()).isEqualByComparingTo("120000");
        assertThat(data.path("orderCount").asLong()).isEqualTo(2);
    }

    @Test
    @DisplayName("DA2 sales-trend — 일별 총매출 합 = 같은 기간 summary 총매출(추이·요약 정합) + 일별 순매출 음수")
    void trendDailySumMatchesSummary() {
        order("DSHT-T1", "PAID", 10000, kst("2099-08-01T10:00:00+09:00"));
        ret("DSHT-T2", "RETURN", "COMPLETED", 5000, kst("2099-08-02T10:00:00+09:00")); // 매출 없는 날 환불
        order("DSHT-T3", "PAID", 20000, kst("2099-08-03T10:00:00+09:00"));

        String from = "2099-08-01T00:00:00Z";
        String to = "2099-08-04T00:00:00Z";
        Range svcRange = KstPeriods.ofCustom(OffsetDateTime.parse(from), OffsetDateTime.parse(to));
        DashboardSummaryResponse summary = service.summary(svcRange);

        JsonNode data = okData(TREND + "?dateFrom=" + from + "&dateTo=" + to);
        JsonNode points = data.path("points");
        assertThat(points).hasSize(3);

        java.math.BigDecimal grossSum = java.math.BigDecimal.ZERO;
        boolean sawNegativeDaily = false;
        for (JsonNode p : points) {
            grossSum = grossSum.add(p.path("grossSales").decimalValue());
            if (p.path("netSales").decimalValue().signum() < 0) {
                sawNegativeDaily = true;
            }
        }
        // 추이 일별 총매출 합 == summary 총매출 (30000)
        assertThat(grossSum).isEqualByComparingTo(summary.getGrossSales());
        assertThat(grossSum).isEqualByComparingTo("30000");
        // 8/2: 매출 0 + 환불 5000 → 일별 순매출 음수(클램프 안 함, 정상)
        assertThat(sawNegativeDaily).as("환불만 있는 날 일별 순매출 음수").isTrue();
    }

    // ───────────────────────── 검증 400 ─────────────────────────

    @Test
    @DisplayName("period 검증 400 — 미지 프리셋·역전 기간·days 범위 초과")
    void periodValidation() {
        assertBadRequest(SUMMARY + "?period=NOPE");
        assertBadRequest(SUMMARY + "?dateFrom=2099-04-01T00:00:00Z&dateTo=2099-03-01T00:00:00Z"); // from>to
        assertBadRequest(TREND + "?days=0");
        assertBadRequest(TREND + "?days=91");
    }

    // ───────────────────────── 빈 기간 ─────────────────────────

    @Test
    @DisplayName("빈 기간(주문 0) — 0/누락 정상, NPE·NaN·500 없음")
    void emptyPeriod() {
        JsonNode data = okData(SUMMARY + "?dateFrom=2099-11-01T00:00:00Z&dateTo=2099-11-02T00:00:00Z");
        assertThat(data.path("grossSales").decimalValue()).isEqualByComparingTo("0");
        assertThat(data.path("netSales").decimalValue()).isEqualByComparingTo("0");
        assertThat(data.path("orderCount").asLong()).isZero();
        // 응답시간 대상 0 → @JsonInclude(NON_NULL)로 필드 누락
        assertThat(data.has("avgResponseSeconds")).isFalse();
    }

    // ───────────────────────── helpers ─────────────────────────

    private JsonNode okData(String path) {
        ResponseEntity<String> resp = getJson(path, adminToken);
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
    }

    private void assertBadRequest(String path) {
        ResponseEntity<String> resp = getJson(path, adminToken);
        assertThat(resp.getStatusCode()).as(path + " → " + resp.getBody()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private static OffsetDateTime kst(String iso) {
        return OffsetDateTime.parse(iso);
    }

    private void order(String orderNo, String status, long amount, OffsetDateTime orderDate) {
        jdbc.update("INSERT INTO dat_order (order_no, user_seq, order_status, final_amount, order_date, i_user) "
                + "VALUES (?, ?, ?, ?, ?, 'TEST')", orderNo, DUMMY, status, amount, orderDate);
    }

    private void ret(String returnNo, String type, String status, long refund, OffsetDateTime completedDate) {
        jdbc.update("INSERT INTO dat_return (return_no, order_seq, user_seq, return_type, return_status, "
                        + "refund_amount, completed_date, requested_date, i_user) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'TEST')",
                returnNo, DUMMY, DUMMY, type, status, refund, completedDate, completedDate);
    }

    private String adminLogin(String userId, String pw) {
        ResponseEntity<String> resp = rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", userId, "userPw", pw), String.class);
        return parse(resp.getBody()).path("data").path("accessToken").asText();
    }

    /** dsht 마커 CUSTOMER 시드 + 로그인 → 토큰. @AfterEach가 정리(활성 CUSTOMER 누출 방지). */
    private String customerLogin() {
        String userId = "dsht-cust" + suffix();
        String pw = "DashCust#1234";
        jdbc.update("INSERT INTO mst_user (user_id, user_pw, user_name, user_role, point_balance, "
                        + "user_status, use_yn, i_user) VALUES (?, ?, '대시보드고객', 'CUSTOMER', 0, 'ACTIVE', 'Y', 'TEST')",
                userId, passwordEncoder.encode(pw));
        ResponseEntity<String> resp = rest.postForEntity(baseUrl() + "/api/v1/auth/login",
                Map.of("userId", userId, "userPw", pw), String.class);
        return parse(resp.getBody()).path("data").path("accessToken").asText();
    }

    private String suffix() {
        String unique = String.valueOf(System.nanoTime());
        return unique.substring(unique.length() - 8);
    }
}
