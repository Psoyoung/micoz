package com.micoz.admin.dashboard.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 대시보드 전용 집계 리포지토리 (D-T1). {@code dat_order}·{@code dat_return}·{@code mst_user}·
 * {@code dat_inquiry}를 <b>read-only 집계</b>한다(상태·금액 변경 0). 대시보드가 도메인 서비스에
 * 역의존하지 않도록 {@code admin.dashboard.*}에 둔다(HANDOFF §5 의존 방향 원칙 — 말단 소비자).
 *
 * <p>기간 경계는 호출측({@link com.micoz.admin.dashboard.support.KstPeriods})이 KST 반개구간
 * {@code [start, end)}으로 산출해 넘긴다. 일별 버킷은 {@code AT TIME ZONE 'Asia/Seoul'}로 KST 일에
 * 귀속(native 필수). 매출 정의 B(dashboard-decisions §2 D1): 총매출은 CANCELED만 제외, 순매출 차감은
 * {@code return_type='RETURN'} COMPLETED만(CANCEL·EXCHANGE 이중차감 회피).
 */
@Repository
public class DashboardAggregationRepository {

    /** 총매출·주문건수 대상 상태(정의 B): PENDING·CANCELED만 제외 = 결제 성사분. RETURNED 포함(환불로 차감). */
    private static final String REVENUE_STATUSES = "'PAID','PREPARING','SHIPPING','DELIVERED','RETURNED'";

    @PersistenceContext
    private EntityManager em;

    /** 총매출: Σ final_amount, order_date 귀속. */
    public BigDecimal grossSales(OffsetDateTime start, OffsetDateTime end) {
        Query q = em.createNativeQuery(
                "SELECT COALESCE(SUM(final_amount), 0) FROM dat_order "
                        + "WHERE order_status IN (" + REVENUE_STATUSES + ") "
                        + "AND order_date >= :start AND order_date < :end");
        return toBigDecimal(bind(q, start, end).getSingleResult());
    }

    /** 주문 건수(총매출 상태집합 기준 — Q-D4), order_date 귀속. */
    public long orderCount(OffsetDateTime start, OffsetDateTime end) {
        Query q = em.createNativeQuery(
                "SELECT COUNT(*) FROM dat_order "
                        + "WHERE order_status IN (" + REVENUE_STATUSES + ") "
                        + "AND order_date >= :start AND order_date < :end");
        return toLong(bind(q, start, end).getSingleResult());
    }

    /** 순매출 차감액: Σ refund_amount, return_type='RETURN' COMPLETED, completed_date 귀속. */
    public BigDecimal returnRefundTotal(OffsetDateTime start, OffsetDateTime end) {
        Query q = em.createNativeQuery(
                "SELECT COALESCE(SUM(refund_amount), 0) FROM dat_return "
                        + "WHERE return_type = 'RETURN' AND return_status = 'COMPLETED' "
                        + "AND completed_date >= :start AND completed_date < :end");
        return toBigDecimal(bind(q, start, end).getSingleResult());
    }

    /** 신규 회원수: user_role='CUSTOMER', i_date 귀속(use_yn 무관 — 과거확정 고정, Q-D3). */
    public long newMemberCount(OffsetDateTime start, OffsetDateTime end) {
        Query q = em.createNativeQuery(
                "SELECT COUNT(*) FROM mst_user "
                        + "WHERE user_role = 'CUSTOMER' AND i_date >= :start AND i_date < :end");
        return toLong(bind(q, start, end).getSingleResult());
    }

    /** WAITING 적체 — 현시점 스냅샷(기간 무관, Q-D1). */
    public long waitingInquiryCount() {
        Query q = em.createNativeQuery(
                "SELECT COUNT(*) FROM dat_inquiry WHERE inquiry_status = 'WAITING' AND use_yn = 'Y'");
        return toLong(q.getSingleResult());
    }

    /** 평균 응답시간(초) — ANSWERED, answered_date 귀속(Q-D2). 대상 0이면 null. */
    public Long avgResponseSeconds(OffsetDateTime start, OffsetDateTime end) {
        Query q = em.createNativeQuery(
                "SELECT AVG(EXTRACT(EPOCH FROM (answered_date - i_date))) FROM dat_inquiry "
                        + "WHERE inquiry_status = 'ANSWERED' AND answered_date IS NOT NULL "
                        + "AND answered_date >= :start AND answered_date < :end");
        Object r = bind(q, start, end).getSingleResult();
        return r == null ? null : Math.round(((Number) r).doubleValue());
    }

    /** 일별 총매출·주문건수 — KST 일 버킷(order_date). 빈 날은 결과에 없음(서비스가 0 채움). */
    @SuppressWarnings("unchecked")
    public List<DailySales> dailySales(OffsetDateTime start, OffsetDateTime end) {
        Query q = em.createNativeQuery(
                "SELECT (order_date AT TIME ZONE 'Asia/Seoul')::date AS d, "
                        + "COALESCE(SUM(final_amount), 0), COUNT(*) FROM dat_order "
                        + "WHERE order_status IN (" + REVENUE_STATUSES + ") "
                        + "AND order_date >= :start AND order_date < :end GROUP BY d");
        List<Object[]> rows = bind(q, start, end).getResultList();
        return rows.stream()
                .map(r -> new DailySales(((Date) r[0]).toLocalDate(), toBigDecimal(r[1]), toLong(r[2])))
                .toList();
    }

    /** 일별 RETURN 환불액 — KST 일 버킷(completed_date). */
    @SuppressWarnings("unchecked")
    public List<DailyRefund> dailyRefund(OffsetDateTime start, OffsetDateTime end) {
        Query q = em.createNativeQuery(
                "SELECT (completed_date AT TIME ZONE 'Asia/Seoul')::date AS d, "
                        + "COALESCE(SUM(refund_amount), 0) FROM dat_return "
                        + "WHERE return_type = 'RETURN' AND return_status = 'COMPLETED' "
                        + "AND completed_date >= :start AND completed_date < :end GROUP BY d");
        List<Object[]> rows = bind(q, start, end).getResultList();
        return rows.stream()
                .map(r -> new DailyRefund(((Date) r[0]).toLocalDate(), toBigDecimal(r[1])))
                .toList();
    }

    public record DailySales(LocalDate date, BigDecimal grossSales, long orderCount) {
    }

    public record DailyRefund(LocalDate date, BigDecimal refund) {
    }

    private static Query bind(Query q, OffsetDateTime start, OffsetDateTime end) {
        return q.setParameter("start", start).setParameter("end", end);
    }

    private static BigDecimal toBigDecimal(Object v) {
        if (v == null) {
            return BigDecimal.ZERO;
        }
        return (v instanceof BigDecimal b) ? b : new BigDecimal(v.toString());
    }

    private static long toLong(Object v) {
        return v == null ? 0L : ((Number) v).longValue();
    }
}
