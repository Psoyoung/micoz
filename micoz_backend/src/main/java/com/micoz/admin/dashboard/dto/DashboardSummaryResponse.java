package com.micoz.admin.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * 대시보드 KPI 요약 응답 (DA1, Q6). 적용 기간(period)은 KST 반개구간을 에코한다.
 * <b>{@code netSales}는 음수 가능</b>(발생주의 — 총매출 order_date·환불 completed_date 귀속 상이).
 * 클램프하지 않는다(회계 왜곡 방지, dashboard-decisions §2 D1).
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardSummaryResponse {

    /** 적용된 KST 반개구간 [from, to). */
    private final Period period;

    /** 총매출 — order_status ∈ 결제성사 집합, order_date 귀속. */
    private final BigDecimal grossSales;

    /** 순매출 = 총매출 − RETURN COMPLETED 환불(completed_date 귀속). 음수 가능. */
    private final BigDecimal netSales;

    /** 주문 건수(총매출 상태집합 기준). */
    private final long orderCount;

    /** 신규 회원수(CUSTOMER, i_date 귀속, use_yn 무관). */
    private final long newMemberCount;

    /** WAITING 문의 — 현시점 스냅샷(period 무관). */
    private final long waitingInquiryCount;

    /** 평균 응답시간(초, ANSWERED·answered_date 귀속). 대상 0이면 null. */
    private final Long avgResponseSeconds;

    @Getter
    @Builder
    public static class Period {
        private final OffsetDateTime from;
        private final OffsetDateTime to;
    }
}
