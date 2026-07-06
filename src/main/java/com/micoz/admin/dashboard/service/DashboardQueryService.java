package com.micoz.admin.dashboard.service;

import com.micoz.admin.dashboard.dto.DashboardSummaryResponse;
import com.micoz.admin.dashboard.dto.SalesTrendPoint;
import com.micoz.admin.dashboard.dto.SalesTrendResponse;
import com.micoz.admin.dashboard.repository.DashboardAggregationRepository;
import com.micoz.admin.dashboard.repository.DashboardAggregationRepository.DailyRefund;
import com.micoz.admin.dashboard.repository.DashboardAggregationRepository.DailySales;
import com.micoz.admin.dashboard.support.KstPeriods;
import com.micoz.admin.dashboard.support.KstPeriods.Range;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 대시보드 집계 서비스 (D-T1, FR-ADM-01). 순수 read — 정의 B 산식으로 KPI·매출 추이를 조립한다.
 * <b>순매출은 클램프하지 않는다</b>(음수 = 발생주의의 정확한 귀결, 버그 아님).
 */
@Service
@RequiredArgsConstructor
public class DashboardQueryService {

    private final DashboardAggregationRepository repository;

    /** KPI 요약(DA1). WAITING만 현시점 스냅샷(period 무관), 나머지는 range 귀속. */
    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary(Range range) {
        BigDecimal gross = repository.grossSales(range.startInclusive(), range.endExclusive());
        BigDecimal refund = repository.returnRefundTotal(range.startInclusive(), range.endExclusive());
        BigDecimal net = gross.subtract(refund); // 음수 가능 — 클램프 금지

        return DashboardSummaryResponse.builder()
                .period(DashboardSummaryResponse.Period.builder()
                        .from(range.startInclusive()).to(range.endExclusive()).build())
                .grossSales(gross)
                .netSales(net)
                .orderCount(repository.orderCount(range.startInclusive(), range.endExclusive()))
                .newMemberCount(repository.newMemberCount(range.startInclusive(), range.endExclusive()))
                .waitingInquiryCount(repository.waitingInquiryCount())
                .avgResponseSeconds(repository.avgResponseSeconds(range.startInclusive(), range.endExclusive()))
                .build();
    }

    /** 일별 매출 추이(DA2). 매출은 order_date·환불은 completed_date KST 일 귀속을 일자로 병합, 빈 날 0 채움. */
    @Transactional(readOnly = true)
    public SalesTrendResponse salesTrend(Range range) {
        Map<LocalDate, DailySales> salesByDate = repository
                .dailySales(range.startInclusive(), range.endExclusive()).stream()
                .collect(Collectors.toMap(DailySales::date, Function.identity()));
        Map<LocalDate, BigDecimal> refundByDate = repository
                .dailyRefund(range.startInclusive(), range.endExclusive()).stream()
                .collect(Collectors.toMap(DailyRefund::date, DailyRefund::refund));

        LocalDate startDate = range.startInclusive().atZoneSameInstant(KstPeriods.KST).toLocalDate();
        LocalDate endDateExclusive = range.endExclusive().atZoneSameInstant(KstPeriods.KST).toLocalDate();

        List<SalesTrendPoint> points = new ArrayList<>();
        for (LocalDate d = startDate; d.isBefore(endDateExclusive); d = d.plusDays(1)) {
            DailySales s = salesByDate.get(d);
            BigDecimal gross = s != null ? s.grossSales() : BigDecimal.ZERO;
            long count = s != null ? s.orderCount() : 0L;
            BigDecimal refund = refundByDate.getOrDefault(d, BigDecimal.ZERO);
            points.add(SalesTrendPoint.builder()
                    .date(d)
                    .grossSales(gross)
                    .netSales(gross.subtract(refund)) // 음수 가능 — 클램프 금지
                    .orderCount(count)
                    .build());
        }
        return SalesTrendResponse.builder().points(points).build();
    }
}
