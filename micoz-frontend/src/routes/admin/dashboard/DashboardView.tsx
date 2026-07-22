// 관리자 대시보드 — A4: mock(SALES_30D/TOP_PRODUCTS/채널유입) → 실 API(D-1 summary · D-2 sales-trend).
// ⚠️ netSales 음수 가능(발생주의) — 클램프 없이 표시·차트 음수축. 총매출 vs 순매출 구분 표기.
//   WAITING 문의는 현시점 스냅샷(기간 무관). 인기상품/채널유입은 대응 API 없어 제거(빚#1·mock 금지).
import { useState, type CSSProperties } from 'react'
import {
  useDashboardSummary,
  useSalesTrend,
  PERIOD_OPTS,
  type DashboardPeriod,
} from '../../../api/admin/dashboard'
import Stat from '../../../components/admin/Stat'
import Card from '../../../components/admin/Card'
import { NetGrossTrendChart } from '../../../components/admin/charts'
import { FilterChip } from '../../../components/admin/filters'
import { AdminLoading, AdminError } from '../../../components/admin/AsyncState'

const pageWrap: CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }
const TREND_OPTS = [
  { d: 7, l: '7일' },
  { d: 30, l: '30일' },
  { d: 90, l: '90일' },
]

export default function DashboardView() {
  const [period, setPeriod] = useState<DashboardPeriod>('TODAY')
  const [days, setDays] = useState(30)
  const summary = useDashboardSummary(period)
  const trend = useSalesTrend(days)
  const s = summary.data

  return (
    <div style={pageWrap}>
      {/* 기간 프리셋 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginRight: 4 }}>기간</span>
        {PERIOD_OPTS.map((o) => (
          <FilterChip key={o.k} label={o.l} active={period === o.k} onClick={() => setPeriod(o.k)} />
        ))}
        {s && <span style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', marginLeft: 8 }}>{s.from.slice(0, 16).replace('T', ' ')} ~ {s.to.slice(0, 16).replace('T', ' ')}</span>}
      </div>

      {/* 매출 요약 */}
      <Card title="매출 요약" subtitle="SUMMARY" padding={0}>
        {summary.isLoading ? (
          <AdminLoading label="요약을 불러오는 중…" />
        ) : summary.isError ? (
          <AdminError error={summary.error} onRetry={summary.refetch} />
        ) : s ? (
          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Stat label="총매출" value={s.grossLabel} sub="취소 제외 결제분" accent="#3a2552" />
              <Stat label="순매출" value={s.netLabel} sub="총매출 − 반품환불" accent={s.netSales < 0 ? '#a85050' : '#2d6a44'} />
              <Stat label="주문 수" value={s.orderCount.toLocaleString() + '건'} sub="기간 내 주문" accent="#6b4d8f" />
              <Stat label="신규 회원" value={s.newMemberCount.toLocaleString() + '명'} sub="기간 내 가입" accent="#b89968" />
            </div>
            {s.netSales < 0 && (
              <div style={{ fontSize: 11.5, color: '#8a3a2c', background: '#fbece9', border: '1px solid #e6c8c1', padding: '8px 12px', lineHeight: 1.6 }}>
                순매출이 음수입니다 — 발생주의상 정상입니다. 총매출은 주문일 기준, 환불 차감은 완료일 기준으로 귀속되어 이 기간에 이전 주문의 환불이 몰리면 순매출이 음수가 될 수 있습니다.
              </div>
            )}
            {/* 지원 지표 — WAITING 은 현시점 스냅샷(기간 무관) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, borderTop: '1px solid var(--ad-line)', paddingTop: 16 }}>
              <Stat label="답변 대기 문의" value={s.waitingInquiryCount.toLocaleString() + '건'} sub="현시점 스냅샷 · 기간 필터와 무관" accent="#c08a3a" />
              <Stat label="평균 응답 시간" value={s.avgResponseLabel} sub="답변 완료 기준" accent="#9a7fb8" />
            </div>
          </div>
        ) : null}
      </Card>

      {/* 매출 추이 (순매출/총매출) */}
      <Card
        title="매출 추이"
        subtitle="SALES TREND · KRW"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {TREND_OPTS.map((o) => (
              <FilterChip key={o.d} label={o.l} active={days === o.d} onClick={() => setDays(o.d)} />
            ))}
          </div>
        }
        padding={0}
      >
        {trend.isLoading ? (
          <AdminLoading label="매출 추이를 불러오는 중…" />
        ) : trend.isError ? (
          <AdminError error={trend.error} onRetry={trend.refetch} />
        ) : (
          <NetGrossTrendChart data={trend.data ?? []} />
        )}
      </Card>
    </div>
  )
}
