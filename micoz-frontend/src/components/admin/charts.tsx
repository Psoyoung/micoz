// 관리자 차트 (SVG 직접 구현, 외부 라이브러리 0)
// A4 정리: mock 전용 BarRow·SalesAreaChart 제거(대시보드는 실 API NetGrossTrendChart 사용).
import { wonM } from '../../lib/format'
import type { SalesTrendPointVm } from '../../api/admin/dashboard'

// 대시보드 매출 추이 — 순매출(net, 음수 가능) 영역 + 총매출(gross) 라인 + 0 기준선.
// ⚠️ netSales 음수 클램프 금지: yMin=min(0,…) 로 음수 구간까지 축을 그린다.
export function NetGrossTrendChart({ data }: { data: SalesTrendPointVm[] }) {
  const w = 720
  const h = 260
  const pad = { l: 58, r: 16, t: 18, b: 30 }
  const iw = w - pad.l - pad.r
  const ih = h - pad.t - pad.b
  if (data.length === 0) {
    return <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--ad-muted)', fontSize: 12.5 }}>표시할 데이터가 없습니다</div>
  }
  const vals = data.flatMap((d) => [d.gross, d.net])
  let yMax = Math.max(0, ...vals)
  let yMin = Math.min(0, ...vals)
  if (yMax === yMin) yMax = yMin + 1 // 전부 0인 경우 div0 방지
  const xs = (i: number) => (data.length === 1 ? pad.l + iw / 2 : pad.l + (i / (data.length - 1)) * iw)
  const ys = (v: number) => pad.t + ih - ((v - yMin) / (yMax - yMin)) * ih
  const zeroY = ys(0)
  const netLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)} ${ys(d.net)}`).join(' ')
  const netArea = `${netLine} L ${xs(data.length - 1)} ${zeroY} L ${xs(0)} ${zeroY} Z`
  const grossLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)} ${ys(d.gross)}`).join(' ')
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => yMin + f * (yMax - yMin))
  const tickEvery = Math.max(1, Math.ceil(data.length / 6))
  const hasNegative = yMin < 0
  return (
    <div style={{ padding: '16px 22px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, fontSize: 11.5, fontFamily: 'var(--sans)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 3, background: '#3a2552' }} /> 순매출</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 3, background: '#b89968' }} /> 총매출</span>
        {hasNegative && <span style={{ color: '#a85050', fontSize: 11 }}>· 0 아래 = 순매출 손실(환불 몰림)</span>}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }} preserveAspectRatio="none">
        {grid.map((v, i) => {
          const y = ys(v)
          return (
            <g key={i}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#ede7dc" strokeWidth="1" />
              <text x={pad.l - 8} y={y + 3} textAnchor="end" style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: '#8a7ba0' }}>{wonM(v)}</text>
            </g>
          )
        })}
        {/* 0 기준선 */}
        <line x1={pad.l} x2={w - pad.r} y1={zeroY} y2={zeroY} stroke="#b0a5c0" strokeWidth="1.2" strokeDasharray="3 3" />
        <defs>
          <linearGradient id="netArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2552" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#3a2552" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={netArea} fill="url(#netArea)" />
        <path d={grossLine} fill="none" stroke="#b89968" strokeWidth="1.4" strokeDasharray="4 3" />
        <path d={netLine} fill="none" stroke="#3a2552" strokeWidth="1.8" />
        {data.map((d, i) => (i % tickEvery === 0 || i === data.length - 1 ? (
          <text key={i} x={xs(i)} y={h - 8} textAnchor="middle" style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: '#8a7ba0' }}>{d.date.slice(5)}</text>
        ) : null))}
      </svg>
    </div>
  )
}
