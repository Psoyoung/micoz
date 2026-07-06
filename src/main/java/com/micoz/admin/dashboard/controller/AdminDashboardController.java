package com.micoz.admin.dashboard.controller;

import com.micoz.admin.dashboard.dto.DashboardSummaryResponse;
import com.micoz.admin.dashboard.dto.SalesTrendResponse;
import com.micoz.admin.dashboard.service.DashboardQueryService;
import com.micoz.admin.dashboard.support.KstPeriods;
import com.micoz.admin.dashboard.support.KstPeriods.Preset;
import com.micoz.admin.dashboard.support.KstPeriods.Range;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;

/**
 * 관리자 대시보드 조회 — 매출/주문 KPI·추이 (D-T2, FR-ADM-01). 전부 GET·read-only.
 * URL 게이팅(F-T3) + 클래스 레벨 {@code @PreAuthorize} 2차 방어(F-T4). 집계 정의·순매출 음수 정책은
 * {@link DashboardQueryService}(D-T1)에 있고, 컨트롤러는 기간 파싱/검증만 담당(서비스 숫자 무왜곡).
 *
 * <p><b>순매출(netSales)은 음수 가능</b>(발생주의) — summary·일별 추이 모두. 특히 <b>일별 순매출은 특정일
 * 환불 완료가 몰리면 summary보다 큰 음수</b>가 나올 수 있다(정상, 클램프 안 함). 프론트는 차트 축을 음수까지.
 */
@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    /** 매출 추이 최대 조회 일수(과도한 풀스캔 방지). */
    private static final int MAX_TREND_DAYS = 90;

    private final DashboardQueryService dashboardQueryService;

    /**
     * KPI 요약(DA1). 기간: {@code period}(프리셋, 기본 TODAY) 또는 {@code dateFrom}+{@code dateTo}(커스텀).
     * dateFrom/dateTo가 하나라도 있으면 커스텀 우선(둘 다 필수). WAITING만 현시점 스냅샷(period 무관).
     */
    @GetMapping("/summary")
    public ApiResponse<DashboardSummaryResponse> summary(
            @RequestParam(defaultValue = "TODAY") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime dateTo) {
        Range range = resolvePresetOrCustom(period, dateFrom, dateTo);
        return ApiResponse.success(dashboardQueryService.summary(range));
    }

    /**
     * 일별 매출 추이(DA2). 기간: {@code days}(기본 30, 1~90) 또는 {@code dateFrom}+{@code dateTo}(커스텀).
     * 빈 날은 0으로 채워 연속 배열. 일별 순매출 음수 가능(위 클래스 주석).
     */
    @GetMapping("/sales-trend")
    public ApiResponse<SalesTrendResponse> salesTrend(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime dateTo) {
        Range range;
        if (dateFrom != null || dateTo != null) {
            range = customRange(dateFrom, dateTo);
        } else {
            if (days < 1 || days > MAX_TREND_DAYS) {
                throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST);
            }
            range = KstPeriods.lastNDays(days, OffsetDateTime.now());
        }
        return ApiResponse.success(dashboardQueryService.salesTrend(range));
    }

    /** dateFrom/dateTo가 있으면 커스텀, 아니면 프리셋(미지 프리셋 → 400). */
    private Range resolvePresetOrCustom(String period, OffsetDateTime dateFrom, OffsetDateTime dateTo) {
        if (dateFrom != null || dateTo != null) {
            return customRange(dateFrom, dateTo);
        }
        try {
            return KstPeriods.of(Preset.valueOf(period.trim().toUpperCase()), OffsetDateTime.now());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST);
        }
    }

    /** 커스텀 기간 — dateFrom·dateTo 둘 다 필요, from ≤ to. 위반 → 400. */
    private Range customRange(OffsetDateTime from, OffsetDateTime to) {
        if (from == null || to == null || from.isAfter(to)) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST);
        }
        return KstPeriods.ofCustom(from, to);
    }
}
