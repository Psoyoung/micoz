package com.micoz.admin.dashboard.support;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;

/**
 * 대시보드 기간 경계 산출 유틸 (D-T1, D2 결정). 모든 프리셋을 <b>KST(Asia/Seoul)</b> 자정 기준
 * <b>반개구간 {@code [startInclusive, endExclusive)}</b>로 산출한다 — 폐구간의 밀리초 경계 애매성 회피.
 *
 * <p>이 환경은 {@code hibernate.jdbc.time_zone=UTC} + TIMESTAMPTZ라 앱 레벨 KST 설정이 없다(실측).
 * 따라서 "오늘/이번주/이번달" 경계를 여기서 명시적으로 KST로 계산해 {@link OffsetDateTime}(UTC instant)로
 * 넘긴다. 기준시각(now)을 주입받는 <b>순수 함수</b>라 고정 clock으로 단위테스트 가능하다.
 */
public final class KstPeriods {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private KstPeriods() {
    }

    /** KST 자정 반개구간. */
    public record Range(OffsetDateTime startInclusive, OffsetDateTime endExclusive) {
    }

    /** summary 기간 프리셋 (주 시작 = 월요일). */
    public enum Preset {
        TODAY, THIS_WEEK, THIS_MONTH, LAST_7_DAYS
    }

    /** 프리셋 → 기준시각(now)의 KST 달력 기준 반개구간. */
    public static Range of(Preset preset, OffsetDateTime now) {
        LocalDate today = today(now);
        return switch (preset) {
            case TODAY -> range(today, today.plusDays(1));
            case THIS_WEEK -> {
                LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                yield range(monday, monday.plusWeeks(1));
            }
            case THIS_MONTH -> {
                LocalDate first = today.withDayOfMonth(1);
                yield range(first, first.plusMonths(1));
            }
            case LAST_7_DAYS -> lastNDays(7, now);
        };
    }

    /** 최근 n일(오늘 포함): {@code [오늘-(n-1) 00:00, 내일 00:00)}. 매출 추이(DA2)용. */
    public static Range lastNDays(int days, OffsetDateTime now) {
        LocalDate today = today(now);
        return range(today.minusDays(days - 1L), today.plusDays(1));
    }

    /** 커스텀 기간 — 호출측이 from ≤ to 검증 후 전달(상한 to는 그대로 배타 경계로 사용). */
    public static Range ofCustom(OffsetDateTime fromInclusive, OffsetDateTime toExclusive) {
        return new Range(fromInclusive, toExclusive);
    }

    private static LocalDate today(OffsetDateTime now) {
        return now.atZoneSameInstant(KST).toLocalDate();
    }

    private static Range range(LocalDate startDate, LocalDate endDateExclusive) {
        return new Range(
                startDate.atStartOfDay(KST).toOffsetDateTime(),
                endDateExclusive.atStartOfDay(KST).toOffsetDateTime());
    }
}
