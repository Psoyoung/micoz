// 관리자 대시보드 도메인 — 출처: docs/admin_api.md §D (D-1 summary · D-2 sales-trend).
// 순수 read 집계. ⚠️ netSales(순매출) 음수 가능(발생주의) — 클램프 금지, 차트 음수축 대비.
// 총매출(grossSales)=취소 제외 결제분, 순매출(netSales)=총매출−반품환불(환불은 completed_date 귀속).
import { useQuery } from '@tanstack/react-query'
import { adminGet } from './client'
import { toNum } from './format'

/* ─── DTO (명세 그대로) ─── */
// D-1 DashboardSummaryResponse
export interface DashboardPeriodDto {
  from: string // OffsetDateTime
  to: string
}
export interface DashboardSummaryDto {
  period: DashboardPeriodDto
  grossSales: number // BigDecimal
  netSales: number // BigDecimal, 음수 가능
  orderCount: number
  newMemberCount: number
  waitingInquiryCount: number // 현시점 스냅샷(기간 무관)
  avgResponseSeconds?: number | null // Long|null, 대상 0이면 생략
}

// D-2 SalesTrendResponse
export interface SalesTrendPointDto {
  date: string // LocalDate 'YYYY-MM-DD'
  grossSales: number
  netSales: number // 음수 가능
  orderCount: number
}
export interface SalesTrendDto {
  points: SalesTrendPointDto[]
}

// D-1 프리셋
export type DashboardPeriod = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_7_DAYS'
export const PERIOD_OPTS: { k: DashboardPeriod; l: string }[] = [
  { k: 'TODAY', l: '오늘' },
  { k: 'THIS_WEEK', l: '이번 주' },
  { k: 'THIS_MONTH', l: '이번 달' },
  { k: 'LAST_7_DAYS', l: '최근 7일' },
]

/* ─── 포맷 ─── */
// 부호를 ₩ 앞에 두어 음수 명확화: -₩50,000
export function wonSigned(v: number): string {
  const n = toNum(v)
  return (n < 0 ? '-' : '') + '₩' + Math.abs(n).toLocaleString('ko-KR')
}
// avgResponseSeconds(초) → 사람이 읽는 형식. null/0 → '-'
export function fmtDuration(sec?: number | null): string {
  if (sec == null || sec <= 0) return '-'
  const s = Math.round(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (h > 0) return `${h}시간 ${m}분`
  if (m > 0) return `${m}분 ${ss}초`
  return `${ss}초`
}

/* ─── 뷰모델 ─── */
export interface DashboardSummaryVm {
  from: string
  to: string
  grossSales: number
  netSales: number
  grossLabel: string
  netLabel: string
  orderCount: number
  newMemberCount: number
  waitingInquiryCount: number
  avgResponseLabel: string
}
export interface SalesTrendPointVm {
  date: string
  gross: number
  net: number
  orderCount: number
}

export function toSummaryVm(d: DashboardSummaryDto): DashboardSummaryVm {
  return {
    from: d.period?.from ?? '',
    to: d.period?.to ?? '',
    grossSales: toNum(d.grossSales),
    netSales: toNum(d.netSales),
    grossLabel: wonSigned(d.grossSales),
    netLabel: wonSigned(d.netSales),
    orderCount: d.orderCount ?? 0,
    newMemberCount: d.newMemberCount ?? 0,
    waitingInquiryCount: d.waitingInquiryCount ?? 0,
    avgResponseLabel: fmtDuration(d.avgResponseSeconds),
  }
}
export function toTrendPoints(d: SalesTrendDto): SalesTrendPointVm[] {
  // 빈 날은 백엔드가 0으로 채워 연속 배열로 준다 — 프론트가 다시 채우지 않음.
  return (d.points ?? []).map((p) => ({
    date: p.date,
    gross: toNum(p.grossSales),
    net: toNum(p.netSales),
    orderCount: p.orderCount ?? 0,
  }))
}

/* ─── API ─── */
export function getSummary(period: DashboardPeriod): Promise<DashboardSummaryDto> {
  return adminGet<DashboardSummaryDto>('/admin/dashboard/summary', { params: { period } })
}
export function getSalesTrend(days: number): Promise<SalesTrendDto> {
  return adminGet<SalesTrendDto>('/admin/dashboard/sales-trend', { params: { days } })
}

/* ─── 훅 ─── */
export function useDashboardSummary(period: DashboardPeriod) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'summary', period] as const,
    queryFn: () => getSummary(period),
    select: toSummaryVm,
  })
}
export function useSalesTrend(days: number) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'sales-trend', days] as const,
    queryFn: () => getSalesTrend(days),
    select: toTrendPoints,
  })
}
