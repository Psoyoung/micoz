// 마이페이지 · 취소/교환/반품 — 출처: 원본 shop/screens-desktop2.jsx ReturnsTab/ReturnEligibleCard/ReturnHistoryCard
// 데이터: lib/data PRODUCTS (opt.label→opt.name). 신청/이력 목업은 화면 colocate.
import { useState } from 'react'
import { PRODUCTS, type Product, type ProductOption } from '../../../lib/data'
import { won } from '../../../lib/format'

type Eligible = { no: string; date: string; received: string; product: Product; opt: ProductOption; qty: number; total: number; daysLeft: number }
type History = {
  no: string
  kind: string
  kindColor: string
  product: Product
  opt: ProductOption
  qty: number
  reason: string
  applied: string
  completed: string | null
  refund?: number
  step?: number
}

export default function ReturnsTab() {
  const [subTab, setSubTab] = useState('list') // list | history

  const eligible: Eligible[] = [
    { no: 'MZ-26041200312', date: '2026.04.12', received: '2026.04.15', product: PRODUCTS[1], opt: PRODUCTS[1].options[0], qty: 1, total: 168000, daysLeft: 18 },
    { no: 'MZ-26032800189', date: '2026.03.28', received: '2026.04.02', product: PRODUCTS[3], opt: PRODUCTS[3].options[0], qty: 1, total: 78000, daysLeft: 4 },
  ]

  const history: History[] = [
    { no: 'MZ-26022000098', kind: '환불 완료', kindColor: '#3a8a5b', product: PRODUCTS[4], opt: PRODUCTS[4].options[0], qty: 1, reason: '단순 변심', applied: '2026.02.24', completed: '2026.02.28', refund: 58000 },
    { no: 'MZ-26011500041', kind: '교환 진행중', kindColor: '#b89968', product: PRODUCTS[6], opt: PRODUCTS[6].options[0], qty: 1, reason: '제품 파손', applied: '2026.05.16', completed: null, step: 2 },
  ]

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: '0 0 8px', color: 'var(--plum-800)' }}>취소 · 교환 · 반품</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 32px', lineHeight: 1.7 }}>
        배송 완료 후 <span style={{ color: 'var(--plum-700)' }}>30일 이내</span> 미개봉 제품에 한해 무료 반품이 가능해요. 개봉 또는 사용 흔적이 있는 경우 반품이 어려울 수 있습니다.
      </p>

      {/* Sub tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line-strong)', marginBottom: 32 }}>
        {(
          [
            ['list', '신청하기', undefined],
            ['history', '신청 내역', 2],
          ] as [string, string, number | undefined][]
        ).map(([k, l, c]) => {
          const sel = subTab === k
          return (
            <button
              key={k}
              onClick={() => setSubTab(k)}
              style={{
                padding: '16px 28px',
                background: 'transparent',
                border: 'none',
                borderBottom: sel ? '2px solid var(--plum-800)' : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                fontSize: 14,
                color: sel ? 'var(--plum-800)' : 'var(--muted)',
                fontWeight: sel ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {l}
              {c && <span style={{ fontFamily: 'var(--serif-en)', fontSize: 11, background: sel ? 'var(--plum-800)' : 'var(--line-strong)', color: 'var(--cream)', padding: '1px 7px', borderRadius: 9999 }}>{c}</span>}
            </button>
          )
        })}
      </div>

      {subTab === 'list' && (
        <div>
          {/* Process steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, background: 'var(--paper)', border: '1px solid var(--line)', padding: '24px 0', marginBottom: 32 }}>
            {(
              [
                ['01', '주문 선택', '신청할 주문을 선택해요.'],
                ['02', '사유 작성', '취소·교환·반품 사유를 알려주세요.'],
                ['03', '회수 안내', '회수가 시작되면 알림으로 알려드려요.'],
                ['04', '환불 완료', '검수 후 3-5일 내 환불됩니다.'],
              ] as [string, string, string][]
            ).map(([n, t, d], i, arr) => (
              <div key={n} style={{ position: 'relative', padding: '8px 24px', borderRight: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, color: 'var(--plum-500)', letterSpacing: '0.3em', marginBottom: 8 }}>STEP {n}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: 'var(--plum-800)', marginBottom: 6 }}>{t}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{d}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: 'var(--plum-800)' }}>신청 가능한 주문</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              총 <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-700)' }}>{eligible.length}</span>건
            </div>
          </div>

          {eligible.map((o) => (
            <ReturnEligibleCard key={o.no} order={o} onRequest={() => setSubTab('history')} />
          ))}

          {/* Notice */}
          <div style={{ marginTop: 32, padding: 24, background: 'rgba(245, 237, 247, 0.6)', border: '1px solid var(--line)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.9 }}>
            <div style={{ marginBottom: 10, color: 'var(--plum-800)', fontWeight: 500, fontSize: 13 }}>· 신청 전 확인해주세요.</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>단순 변심에 의한 반품은 왕복 배송비 ₩ 6,000이 부과돼요. (5만원 이상 주문은 회수 배송비만)</li>
              <li>제품 불량 또는 오배송의 경우 배송비 전액을 부담해드립니다.</li>
              <li>한정판, 기프트 세트는 단순 변심 반품이 어려워요.</li>
              <li>교환은 동일 제품의 다른 옵션(용량·색상)으로만 가능합니다.</li>
            </ul>
          </div>
        </div>
      )}

      {subTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {history.map((h) => (
            <ReturnHistoryCard key={h.no} item={h} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReturnEligibleCard({ order, onRequest }: { order: Eligible; onRequest: () => void }) {
  const urgent = order.daysLeft <= 7
  return (
    <div style={{ border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 14 }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(42, 26, 62, 0.02)' }}>
        <div>
          <span style={{ fontFamily: 'var(--serif-en)', fontSize: 13, color: 'var(--plum-700)' }}>{order.no}</span>
          <span style={{ marginLeft: 14, fontSize: 12, color: 'var(--muted)' }}>주문일 {order.date}</span>
          <span style={{ marginLeft: 14, fontSize: 12, color: 'var(--muted)' }}>· 수령일 {order.received}</span>
        </div>
        <span style={{ fontSize: 11, padding: '4px 12px', letterSpacing: '0.1em', background: urgent ? 'rgba(193, 75, 58, 0.1)' : 'var(--plum-100)', color: urgent ? '#c14b3a' : 'var(--plum-700)' }}>반품 기한 {order.daysLeft}일 남음</span>
      </div>
      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '90px 1fr auto auto', gap: 20, alignItems: 'center' }}>
        <div style={{ width: 90, height: 110, background: order.product.grad }} />
        <div>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 6 }}>{(order.product.line ?? '').toUpperCase()}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 400, color: 'var(--plum-800)', marginBottom: 4 }}>{order.product.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{order.opt.name} · {order.qty}개</div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'var(--serif-en)', fontSize: 16, color: 'var(--plum-800)' }}>{won(order.total)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onRequest} style={{ padding: '10px 18px', background: 'var(--plum-700)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontSize: 12, letterSpacing: '0.15em', fontWeight: 500, whiteSpace: 'nowrap' }}>반품 신청</button>
          <button onClick={onRequest} style={{ padding: '10px 18px', background: 'transparent', color: 'var(--plum-700)', border: '1px solid var(--plum-700)', cursor: 'pointer', fontSize: 12, letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>교환 신청</button>
        </div>
      </div>
    </div>
  )
}

function ReturnHistoryCard({ item }: { item: History }) {
  const isInProgress = !item.completed
  return (
    <div style={{ border: '1px solid var(--line)', background: 'var(--paper)' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 11, padding: '4px 12px', letterSpacing: '0.1em', background: item.kindColor, color: 'var(--cream)', marginRight: 14 }}>{item.kind}</span>
          <span style={{ fontFamily: 'var(--serif-en)', fontSize: 13, color: 'var(--plum-700)' }}>{item.no}</span>
          <span style={{ marginLeft: 14, fontSize: 12, color: 'var(--muted)' }}>신청일 {item.applied}</span>
        </div>
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--muted)', textDecoration: 'underline', textUnderlineOffset: 3 }}>상세 보기</button>
      </div>

      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '90px 1fr 200px', gap: 24, alignItems: 'center' }}>
        <div style={{ width: 90, height: 110, background: item.product.grad }} />
        <div>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 6 }}>{(item.product.line ?? '').toUpperCase()}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 400, color: 'var(--plum-800)', marginBottom: 4 }}>{item.product.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{item.opt.name} · {item.qty}개</div>
          <div style={{ fontSize: 12, color: 'var(--ink)' }}>
            <span style={{ color: 'var(--muted)' }}>사유 ·</span> {item.reason}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {item.refund && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.15em', marginBottom: 4 }}>환불 완료</div>
              <div style={{ fontFamily: 'var(--serif-en)', fontSize: 18, color: 'var(--plum-800)' }}>{won(item.refund)}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>완료일 {item.completed}</div>
            </div>
          )}
          {isInProgress && (
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              <div style={{ marginBottom: 8 }}>진행 단계</div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                {[1, 2, 3, 4].map((s) => (
                  <span key={s} style={{ width: 24, height: 3, background: s <= (item.step ?? 0) ? 'var(--plum-700)' : 'var(--line)' }} />
                ))}
              </div>
              <div style={{ marginTop: 8, color: 'var(--plum-700)', fontWeight: 500 }}>회수 진행중 (2/4)</div>
            </div>
          )}
        </div>
      </div>

      {isInProgress && (
        <div style={{ padding: '14px 24px', background: 'rgba(184, 153, 104, 0.08)', borderTop: '1px solid var(--line)', fontSize: 12, color: 'var(--ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <span style={{ color: 'var(--muted)' }}>회수 송장번호 ·</span> <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-700)' }}>CJ 4928-1059-3372</span>
          </span>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--plum-700)', fontWeight: 500 }}>배송 조회 →</button>
        </div>
      )}
    </div>
  )
}
