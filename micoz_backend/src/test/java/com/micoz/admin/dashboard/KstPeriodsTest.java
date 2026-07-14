package com.micoz.admin.dashboard;

import com.micoz.admin.dashboard.support.KstPeriods;
import com.micoz.admin.dashboard.support.KstPeriods.Preset;
import com.micoz.admin.dashboard.support.KstPeriods.Range;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * D-T1 KST 경계 유틸 순수 단위테스트 — 고정 now로 프리셋 경계·반개구간·KST 변환(UTC 오프바이9시간 없음)을 단언.
 */
class KstPeriodsTest {

    private static OffsetDateTime kst(String iso) {
        return OffsetDateTime.parse(iso);
    }

    @Test
    @DisplayName("TODAY — KST 자정 반개구간 [오늘 00:00, 내일 00:00)")
    void today() {
        Range r = KstPeriods.of(Preset.TODAY, kst("2026-07-06T12:00:00+09:00"));
        assertThat(r.startInclusive()).isEqualTo(kst("2026-07-06T00:00:00+09:00"));
        assertThat(r.endExclusive()).isEqualTo(kst("2026-07-07T00:00:00+09:00"));
    }

    @Test
    @DisplayName("KST 변환 — UTC 15:00Z 이후는 KST 익일로 귀속(오프바이9시간 방지)")
    void kstConversionCrossesUtcDay() {
        // 2026-07-06T15:30Z == 2026-07-07T00:30 KST → today(KST) = 07-07
        Range r = KstPeriods.of(Preset.TODAY, kst("2026-07-06T15:30:00Z"));
        assertThat(r.startInclusive()).isEqualTo(kst("2026-07-07T00:00:00+09:00"));
        assertThat(r.endExclusive()).isEqualTo(kst("2026-07-08T00:00:00+09:00"));
    }

    @Test
    @DisplayName("THIS_WEEK — 주 시작 월요일, 7일, 오늘 포함")
    void thisWeekStartsMonday() {
        OffsetDateTime now = kst("2026-07-08T12:00:00+09:00"); // 수요일
        Range r = KstPeriods.of(Preset.THIS_WEEK, now);
        assertThat(r.startInclusive().atZoneSameInstant(KstPeriods.KST).getDayOfWeek())
                .isEqualTo(DayOfWeek.MONDAY);
        // 7일 폭
        assertThat(r.startInclusive().plusDays(7)).isEqualTo(r.endExclusive());
        // 오늘(00:00) 포함: start ≤ today00:00 < end
        OffsetDateTime today0 = kst("2026-07-08T00:00:00+09:00");
        assertThat(r.startInclusive()).isBeforeOrEqualTo(today0);
        assertThat(r.endExclusive()).isAfter(today0);
        // 2026-07-08은 수 → 그 주 월요일 = 07-06
        assertThat(r.startInclusive()).isEqualTo(kst("2026-07-06T00:00:00+09:00"));
    }

    @Test
    @DisplayName("THIS_MONTH — [1일 00:00, 다음달 1일 00:00)")
    void thisMonth() {
        Range r = KstPeriods.of(Preset.THIS_MONTH, kst("2026-07-06T12:00:00+09:00"));
        assertThat(r.startInclusive()).isEqualTo(kst("2026-07-01T00:00:00+09:00"));
        assertThat(r.endExclusive()).isEqualTo(kst("2026-08-01T00:00:00+09:00"));
    }

    @Test
    @DisplayName("LAST_7_DAYS — [6일전 00:00, 내일 00:00) = 오늘 포함 7일")
    void last7Days() {
        Range r = KstPeriods.of(Preset.LAST_7_DAYS, kst("2026-07-06T12:00:00+09:00"));
        assertThat(r.startInclusive()).isEqualTo(kst("2026-06-30T00:00:00+09:00"));
        assertThat(r.endExclusive()).isEqualTo(kst("2026-07-07T00:00:00+09:00"));
    }

    @Test
    @DisplayName("lastNDays(30) — 오늘 포함 30일 반개구간")
    void last30Days() {
        Range r = KstPeriods.lastNDays(30, kst("2026-07-06T12:00:00+09:00"));
        assertThat(r.startInclusive()).isEqualTo(kst("2026-06-07T00:00:00+09:00"));
        assertThat(r.endExclusive()).isEqualTo(kst("2026-07-07T00:00:00+09:00"));
    }
}
