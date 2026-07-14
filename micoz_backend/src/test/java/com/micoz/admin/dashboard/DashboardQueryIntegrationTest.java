package com.micoz.admin.dashboard;

import com.micoz.admin.dashboard.dto.DashboardSummaryResponse;
import com.micoz.admin.dashboard.dto.SalesTrendPoint;
import com.micoz.admin.dashboard.dto.SalesTrendResponse;
import com.micoz.admin.dashboard.service.DashboardQueryService;
import com.micoz.admin.dashboard.support.KstPeriods;
import com.micoz.admin.dashboard.support.KstPeriods.Range;
import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * D-T1 집계 검증 — "숫자가 정답이다"를 손계산으로 단언. 2099년 격리 윈도우 + 'DSHT' 마커로 다른 테스트 데이터와 분리.
 * 핵심 4단언: 부분반품 손계산 일치 · 순매출 음수 · 이중차감 0(CANCELED/CANCEL/EXCHANGE) · KST 자정 경계.
 */
class DashboardQueryIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private DashboardQueryService service;

    @Autowired
    private JdbcTemplate jdbc;

    private static final long DUMMY_ORDER = 900001L;

    @AfterEach
    void cleanup() {
        jdbc.update("DELETE FROM dat_order WHERE order_no LIKE 'DSHT%'");
        jdbc.update("DELETE FROM dat_return WHERE return_no LIKE 'DSHT%'");
        jdbc.update("DELETE FROM dat_inquiry WHERE inquiry_no LIKE 'DSHT%'");
        jdbc.update("DELETE FROM mst_user WHERE user_id LIKE 'dsht%'");
    }

    // ───────────────────────── 핵심 단언 ─────────────────────────

    @Test
    @DisplayName("① 부분반품 순매출 손계산 일치 + 총매출/주문건수/신규회원")
    void partialReturnSummaryMatchesHandCalc() {
        Range mar = range("2099-03-01", "2099-04-01");
        // A: 배송완료 100,000 (부분반품 대상 — order_status는 DELIVERED 유지)
        order("DSHT-A", "DELIVERED", 100000, kst("2099-03-10T10:00:00+09:00"));
        // A의 부분반품: RETURN COMPLETED 환불 30,000 (completed_date 3월)
        ret("DSHT-A", "RETURN", "COMPLETED", 30000, kst("2099-03-15T10:00:00+09:00"));
        // B: 결제완료 50,000
        order("DSHT-B", "PAID", 50000, kst("2099-03-05T10:00:00+09:00"));
        // 신규회원: 3월 CUSTOMER 2명 + 2월 1명(제외) + 3월 ADMIN 1명(제외)
        customer("dsht-c1", "CUSTOMER", kst("2099-03-02T00:00:00+09:00"));
        customer("dsht-c2", "CUSTOMER", kst("2099-03-20T00:00:00+09:00"));
        customer("dsht-c3", "CUSTOMER", kst("2099-02-20T00:00:00+09:00"));
        customer("dsht-a1", "ADMIN", kst("2099-03-02T00:00:00+09:00"));

        DashboardSummaryResponse s = service.summary(mar);

        assertThat(s.getGrossSales()).isEqualByComparingTo("150000");     // 100000 + 50000
        assertThat(s.getNetSales()).isEqualByComparingTo("120000");       // 150000 − 30000(부분반품)
        assertThat(s.getOrderCount()).isEqualTo(2);
        assertThat(s.getNewMemberCount()).isEqualTo(2);                   // CUSTOMER·3월만
    }

    @Test
    @DisplayName("② 이중차감 0 — CANCELED 주문·CANCEL 환불·EXCHANGE 전부 순매출 영향 없음")
    void doubleCountingHasZeroEffect() {
        Range apr = range("2099-04-01", "2099-05-01");
        // CANCELED 주문 70,000 + 그 CANCEL 환불 70,000 → 양쪽 미포함(총매출 제외 + refund 제외)
        order("DSHT-C", "CANCELED", 70000, kst("2099-04-06T10:00:00+09:00"));
        ret("DSHT-C", "CANCEL", "COMPLETED", 70000, kst("2099-04-07T10:00:00+09:00"));
        // DELIVERED 40,000 + EXCHANGE 환불 0 → 총매출 포함, refund 제외
        order("DSHT-D", "DELIVERED", 40000, kst("2099-04-08T10:00:00+09:00"));
        ret("DSHT-D", "EXCHANGE", "COMPLETED", 0, kst("2099-04-09T10:00:00+09:00"));
        // DELIVERED 60,000 (반품 없음)
        order("DSHT-E", "DELIVERED", 60000, kst("2099-04-10T10:00:00+09:00"));

        DashboardSummaryResponse s = service.summary(apr);

        assertThat(s.getGrossSales()).isEqualByComparingTo("100000");     // 40000 + 60000 (CANCELED 제외)
        assertThat(s.getNetSales()).isEqualByComparingTo("100000");       // 차감 0 (CANCEL·EXCHANGE 미대상)
        assertThat(s.getOrderCount()).isEqualTo(2);                       // D·E (CANCELED 제외)
    }

    @Test
    @DisplayName("③ 순매출 음수 가능(발생주의) — 이전 주문 환불이 그 달에 몰리면 net < 0")
    void netSalesCanBeNegative() {
        Range may = range("2099-05-01", "2099-06-01");
        order("DSHT-F", "PAID", 10000, kst("2099-05-05T10:00:00+09:00"));
        // 5월 완료 RETURN 환불 50,000 (원주문은 이전 달 — 매출은 이전 달, 환불만 5월 귀속)
        ret("DSHT-G", "RETURN", "COMPLETED", 50000, kst("2099-05-20T10:00:00+09:00"));

        DashboardSummaryResponse s = service.summary(may);

        assertThat(s.getNetSales()).isEqualByComparingTo("-40000");       // 10000 − 50000
        assertThat(s.getNetSales().signum()).isNegative();                // 클램프 안 됨(정확한 회계)
        assertThat(s.getGrossSales()).isEqualByComparingTo("10000");
    }

    @Test
    @DisplayName("④ KST 자정 경계 — 23:59 KST(전일)는 제외, 00:00:30 KST(당일)는 포함")
    void kstMidnightBoundary() {
        Range jun = range("2099-06-01", "2099-07-01");
        // 5/31 23:59 KST = 5/31 14:59Z → 6월 시작(6/1 00:00 KST) 이전 → 제외
        order("DSHT-X", "PAID", 11111, kst("2099-05-31T23:59:00+09:00"));
        // 6/1 00:00:30 KST → 6월 시작 이후 → 포함
        order("DSHT-Y", "PAID", 22222, kst("2099-06-01T00:00:30+09:00"));

        DashboardSummaryResponse s = service.summary(jun);

        assertThat(s.getGrossSales()).isEqualByComparingTo("22222");      // Y만
        assertThat(s.getOrderCount()).isEqualTo(1);
    }

    // ───────────────────────── 문의 KPI ─────────────────────────

    @Test
    @DisplayName("평균 응답시간(answered_date 귀속) + WAITING 스냅샷(period 무관·use_yn 필터)")
    void inquiryKpis() {
        Range jul = range("2099-07-01", "2099-08-01");
        Range mar = range("2099-03-01", "2099-04-01");

        long baselineWaiting = service.summary(jul).getWaitingInquiryCount();

        // ANSWERED 2건: 3600s, 10800s → avg 7200s (answered_date 7월)
        answeredInquiry("DSHT-R1", kst("2099-07-01T00:00:00+09:00"), kst("2099-07-01T01:00:00+09:00"));
        answeredInquiry("DSHT-R2", kst("2099-07-02T00:00:00+09:00"), kst("2099-07-02T03:00:00+09:00"));
        // WAITING 3건(활성) + 1건(use_yn='N' → 미집계)
        waitingInquiry("DSHT-W1", "Y");
        waitingInquiry("DSHT-W2", "Y");
        waitingInquiry("DSHT-W3", "Y");
        waitingInquiry("DSHT-W4", "N");

        DashboardSummaryResponse julS = service.summary(jul);
        assertThat(julS.getAvgResponseSeconds()).isEqualTo(7200L);
        // WAITING = 스냅샷: period 무관(7월 == 3월), use_yn='Y'만 → 정확히 +3
        assertThat(julS.getWaitingInquiryCount() - baselineWaiting).isEqualTo(3);
        assertThat(service.summary(mar).getWaitingInquiryCount())
                .isEqualTo(julS.getWaitingInquiryCount());
    }

    // ───────────────────────── 매출 추이 ─────────────────────────

    @Test
    @DisplayName("일별 매출 추이 — 빈 날 0 채움 + 일별 순매출 음수(환불만 있는 날)")
    void salesTrendFillsEmptyDaysAndDailyNegative() {
        Range threeDays = range("2099-08-01", "2099-08-04"); // 8/1·8/2·8/3
        order("DSHT-T1", "PAID", 10000, kst("2099-08-01T10:00:00+09:00"));         // 8/1 매출
        ret("DSHT-T2", "RETURN", "COMPLETED", 5000, kst("2099-08-02T10:00:00+09:00")); // 8/2 환불만
        order("DSHT-T3", "PAID", 20000, kst("2099-08-03T10:00:00+09:00"));         // 8/3 매출

        SalesTrendResponse t = service.salesTrend(threeDays);

        assertThat(t.getPoints()).hasSize(3);
        SalesTrendPoint d1 = point(t, LocalDate.of(2099, 8, 1));
        SalesTrendPoint d2 = point(t, LocalDate.of(2099, 8, 2));
        SalesTrendPoint d3 = point(t, LocalDate.of(2099, 8, 3));

        assertThat(d1.getGrossSales()).isEqualByComparingTo("10000");
        assertThat(d1.getNetSales()).isEqualByComparingTo("10000");
        assertThat(d1.getOrderCount()).isEqualTo(1);
        // 8/2: 매출 0인데 환불 5000 → 일별 순매출 음수(클램프 안 함)
        assertThat(d2.getGrossSales()).isEqualByComparingTo("0");
        assertThat(d2.getNetSales()).isEqualByComparingTo("-5000");
        assertThat(d2.getOrderCount()).isEqualTo(0);
        assertThat(d3.getGrossSales()).isEqualByComparingTo("20000");
        assertThat(d3.getNetSales()).isEqualByComparingTo("20000");
    }

    // ───────────────────────── helpers ─────────────────────────

    private static OffsetDateTime kst(String iso) {
        return OffsetDateTime.parse(iso);
    }

    private static Range range(String fromDate, String toDate) {
        return KstPeriods.ofCustom(kst(fromDate + "T00:00:00+09:00"), kst(toDate + "T00:00:00+09:00"));
    }

    private static SalesTrendPoint point(SalesTrendResponse t, LocalDate date) {
        return t.getPoints().stream().filter(p -> p.getDate().equals(date)).findFirst()
                .orElseThrow(() -> new AssertionError("no trend point for " + date));
    }

    private void order(String orderNo, String status, long amount, OffsetDateTime orderDate) {
        jdbc.update("INSERT INTO dat_order (order_no, user_seq, order_status, final_amount, order_date, i_user) "
                + "VALUES (?, ?, ?, ?, ?, 'TEST')", orderNo, DUMMY_ORDER, status, amount, orderDate);
    }

    private void ret(String returnNo, String type, String status, long refund, OffsetDateTime completedDate) {
        jdbc.update("INSERT INTO dat_return (return_no, order_seq, user_seq, return_type, return_status, "
                        + "refund_amount, completed_date, requested_date, i_user) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'TEST')",
                returnNo, DUMMY_ORDER, DUMMY_ORDER, type, status, refund, completedDate, completedDate);
    }

    private void customer(String userId, String role, OffsetDateTime iDate) {
        jdbc.update("INSERT INTO mst_user (user_id, user_pw, user_name, user_role, point_balance, "
                        + "user_status, use_yn, i_user, i_date) VALUES (?, 'x', '고객', ?, 0, 'ACTIVE', 'Y', 'TEST', ?)",
                userId, role, iDate);
    }

    private void answeredInquiry(String inquiryNo, OffsetDateTime iDate, OffsetDateTime answeredDate) {
        jdbc.update("INSERT INTO dat_inquiry (inquiry_no, user_seq, inquiry_type, title, content, "
                        + "inquiry_status, answered_date, use_yn, i_user, i_date) "
                        + "VALUES (?, ?, 'ETC', 't', 'c', 'ANSWERED', ?, 'Y', 'TEST', ?)",
                inquiryNo, DUMMY_ORDER, answeredDate, iDate);
    }

    private void waitingInquiry(String inquiryNo, String useYn) {
        jdbc.update("INSERT INTO dat_inquiry (inquiry_no, user_seq, inquiry_type, title, content, "
                        + "inquiry_status, use_yn, i_user) VALUES (?, ?, 'ETC', 't', 'c', 'WAITING', ?, 'TEST')",
                inquiryNo, DUMMY_ORDER, useYn);
    }
}
