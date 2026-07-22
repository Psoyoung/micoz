// 관리자 주문관리 — A2: mock ORDERS(lib/data) → 실 API(O-1 목록 · O-2 상세).
// [members.ts/MembersView 패턴 따름] 서버 위임 페이징·검색(q)·주문상태 필터 + 로딩/에러/빈상태 + 매퍼(api/admin/orders.ts). 클라 필터/정렬 제거.
// 매퍼 갭(정본 O-1 대비): 고객명·결제수단·배송상태는 목록에 없음(백엔드 빚) → 컬럼에서 제거, userSeq 로 대체.
//   O-1 firstItemName+totalItemCount 로 "대표상품 외 N건" 파생 표시. 배송·결제는 O-2 상세에서만 노출.
// 원본 대비: 상단 KPI 6칸은 집계 API 미제공이라 제거(가짜 숫자 노출 방지 — 대시보드 인기상품과 동일 원칙, 빚#8).
//   CSV/송장 버튼은 액션 자리표시(no-op), 상단 필터 칩은 서버 orderStatus 드롭다운으로 교체.
import { useState, useEffect, type CSSProperties } from 'react'
import {
  useOrders,
  useOrder,
  useOrderTransitions,
  orderActions,
  type AdminOrderRow,
} from '../../../api/admin/orders'
import { ADMIN_ORDER_STATUS_LABEL } from '../../../api/admin/labels'
import { adminErrorMessage } from '../../../api/admin/errors'
import Card from '../../../components/admin/Card'
import { FilterBar } from '../../../components/admin/filters'
import AdminDropdown from '../../../components/admin/AdminDropdown'
import AdminBtn from '../../../components/admin/AdminBtn'
import DataTable, { type Column } from '../../../components/admin/DataTable'
import Pagination from '../../../components/admin/Pagination'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import { StatusChip } from '../../../components/admin/chips'
import { AIcon } from '../../../components/admin/icons'
import { AdminLoading, AdminError, AdminEmpty } from '../../../components/admin/AsyncState'
import { useModalDismiss } from '../../../lib/useModalDismiss'

const pageWrap: CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }
const PAGE_SIZE = 20

// 상태전이 액션 버튼 스타일
const actBtnBase: CSSProperties = { padding: '8px 16px', border: '1px solid', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, letterSpacing: '0.02em' }
const primaryBtn: CSSProperties = { ...actBtnBase, background: '#3a2552', color: '#f5f1ea', borderColor: '#3a2552' }
const defaultBtn: CSSProperties = { ...actBtnBase, background: '#fff', color: 'var(--ad-ink)', borderColor: 'var(--ad-line-strong)' }
const dangerBtn: CSSProperties = { ...actBtnBase, background: '#fff', color: '#8a3a2c', borderColor: '#e6c8c1' }

const STATUS_OPTS = [{ k: 'all', l: '전체 상태' }, ...Object.entries(ADMIN_ORDER_STATUS_LABEL).map(([k, l]) => ({ k, l }))]

// 검색어 디바운스(서버 요청 절약) — 타이핑 멈춘 뒤 400ms.
function useDebounced<T>(value: T, delay = 400): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

const columns: Column<AdminOrderRow>[] = [
  { key: 'orderNo', label: '주문번호', mono: true, nowrap: true, render: (v) => <span style={{ color: '#3a2552', fontWeight: 500 }}>{v as string}</span> },
  { key: 'orderDate', label: '주문일시', mono: true, muted: true, nowrap: true },
  { key: 'userSeq', label: '고객', mono: true, nowrap: true, render: (v) => `#${v as number}` },
  { key: 'itemSummary', label: '주문상품', render: (v) => <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 240 }}>{v as string}</span> },
  { key: 'finalAmountLabel', label: '결제금액', align: 'right', mono: true, nowrap: true, render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
  { key: 'statusLabel', label: '주문상태', render: (v) => <StatusChip status={v as string} /> },
]

export default function OrdersView() {
  const [status, setStatus] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1) // 1-based UI
  const [detailSeq, setDetailSeq] = useState<number | null>(null)

  const q = useDebounced(searchInput.trim())

  // 필터/검색 변경 시 1페이지로.
  useEffect(() => { setPage(1) }, [status, q])

  const { data, isLoading, isError, error, refetch, isFetching } = useOrders({
    q: q || undefined,
    orderStatus: status !== 'all' ? status : undefined,
    page: page - 1, // 0-based
    size: PAGE_SIZE,
    sort: 'orderDate,desc',
  })

  return (
    <div style={pageWrap}>
      <Card padding={0}>
        <FilterBar
          action={
            <>
              <AdminBtn icon={AIcon.download(13)} size="sm">송장 인쇄</AdminBtn>
              <AdminBtn icon={AIcon.download(13)} size="sm">CSV 내보내기</AdminBtn>
            </>
          }
        >
          <AdminDropdown value={status} onChange={setStatus} options={STATUS_OPTS} width={150} />
          <span style={{ width: 1, height: 22, background: 'var(--ad-line)', margin: '0 4px' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fff', border: '1px solid var(--ad-line-strong)', width: 240 }}>
            <span style={{ color: 'var(--ad-muted)', display: 'flex' }}>{AIcon.search(14)}</span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="주문번호 검색"
              style={{ border: 'none', outline: 'none', flex: 1, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ad-ink)', minWidth: 0 }}
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ad-muted)', display: 'flex', padding: 0 }} title="검색어 지우기">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            )}
          </div>
        </FilterBar>

        {isLoading ? (
          <AdminLoading label="주문 목록을 불러오는 중…" />
        ) : isError ? (
          <AdminError error={error} onRetry={refetch} />
        ) : !data || data.rows.length === 0 ? (
          <AdminEmpty label="조건에 맞는 주문이 없습니다" />
        ) : (
          <>
            <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
              <DataTable columns={columns} rows={data.rows} rowKey="orderSeq" onRowClick={(r) => setDetailSeq(r.orderSeq)} />
            </div>
            <Pagination page={page} total={data.totalElements} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Card>

      <OrderDetailModal orderSeq={detailSeq} onClose={() => setDetailSeq(null)} />
    </div>
  )
}

// ─── 주문 상세 모달 (O-2 + O-3~O-7 상태전이) ───
function OrderDetailModal({ orderSeq, onClose }: { orderSeq: number | null; onClose: () => void }) {
  useModalDismiss(onClose, orderSeq != null)
  const { data, isLoading, isError, error, refetch } = useOrder(orderSeq)
  const t = useOrderTransitions(orderSeq ?? -1)
  const [trackingNo, setTrackingNo] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  // 주문이 바뀌면 운송장 입력 초기화.
  useEffect(() => { setTrackingNo('') }, [orderSeq])
  if (orderSeq == null) return null

  // 전이 액션(취소 제외) 에러 — 인라인 표시. 취소 에러는 ConfirmDialog 에서.
  const actionError = t.prepare.error || t.ship.error || t.inTransit.error || t.deliver.error
  const anyBusy = t.prepare.isPending || t.ship.isPending || t.inTransit.isPending || t.deliver.isPending

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: 'min(960px, 100%)', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line-strong)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 26px', borderBottom: '1px solid var(--ad-line)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.18em', marginBottom: 4 }}>ORDER DETAIL</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 500, color: '#3a2552' }}>{data ? data.orderNo : `#${orderSeq}`}</span>
              {data && <StatusChip status={data.statusLabel} />}
            </div>
            {data && (
              <div style={{ fontSize: 11.5, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.04em', marginTop: 6 }}>{data.orderDate} · 고객 #{data.userSeq}</div>
            )}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--ad-line-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ad-ink)', flexShrink: 0 }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <AdminLoading label="주문 정보를 불러오는 중…" />
        ) : isError ? (
          <AdminError error={error} onRetry={refetch} />
        ) : data ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
            <div style={{ padding: 26, borderRight: '1px solid var(--ad-line)' }}>
              <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginBottom: 12, textTransform: 'uppercase' }}>주문 상품 ({data.items.length})</div>
              {data.items.map((it) => (
                <div key={it.itemSeq} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--ad-line-soft)' }}>
                  {it.mainImageUrl ? (
                    <img src={it.mainImageUrl} alt={it.productName} style={{ width: 38, height: 46, objectFit: 'cover', flexShrink: 0, background: 'var(--ad-paper-2)' }} />
                  ) : (
                    <div style={{ width: 38, height: 46, flexShrink: 0, background: 'var(--ad-paper-2)', border: '1px solid var(--ad-line)' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{it.productName}{it.optionName ? ` (${it.optionName})` : ''}</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ad-muted)', letterSpacing: '0.06em', marginTop: 2 }}>{it.productCode}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{it.quantity}개</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, width: 100, textAlign: 'right', whiteSpace: 'nowrap' }}>{it.itemAmountLabel}</div>
                </div>
              ))}
              <div style={{ paddingTop: 14, marginTop: 6 }}>
                {(() => {
                  const summaryRows: Array<[string, string, boolean?]> = [
                    ['상품금액', data.itemsTotalLabel],
                    ...(data.totalDiscount > 0 ? ([['할인', '−' + data.totalDiscountLabel]] as Array<[string, string]>) : []),
                    ...(data.couponDiscount > 0 ? ([['쿠폰 할인', '−' + data.couponDiscountLabel]] as Array<[string, string]>) : []),
                    ...(data.pointUsed > 0 ? ([['포인트 사용', '−' + data.pointUsed.toLocaleString() + 'P']] as Array<[string, string]>) : []),
                    ['배송비', data.shippingFee === 0 ? '₩0  (무료배송)' : data.shippingFeeLabel],
                    ['최종 결제', data.finalAmountLabel, true],
                    ['적립 예정 포인트', data.pointToEarn.toLocaleString() + 'P'],
                  ]
                  return summaryRows
                })().map(([k, v, em], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: em ? 14 : 12.5, fontWeight: em ? 600 : 400, borderTop: em ? '1px solid var(--ad-line)' : 'none', marginTop: em ? 8 : 0, paddingTop: em ? 12 : 6 }}>
                    <span style={{ color: em ? 'var(--ad-ink)' : 'var(--ad-muted)' }}>{k}</span>
                    <span style={{ fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 26 }}>
              <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginBottom: 12, textTransform: 'uppercase' }}>배송 정보</div>
              {data.shipping ? (
                <>
                  <KV label="수령인" value={`${data.shipping.recipientName} (${data.shipping.recipientPhone})`} />
                  <KV label="주소" value={`(${data.shipping.zipCode}) ${data.shipping.address} ${data.shipping.addressDetail}`.trim()} />
                  {data.shipping.shippingMemo && <KV label="배송 메모" value={data.shipping.shippingMemo} />}
                  <KV label="배송상태" value={data.shipping.shippingStatusLabel} />
                  {data.shipping.trackingNo && <KV label="운송장번호" value={data.shipping.trackingNo} mono />}
                  {data.shipping.shippedDate && <KV label="출고일시" value={data.shipping.shippedDate} mono />}
                  {data.shipping.deliveredDate && <KV label="배송완료일시" value={data.shipping.deliveredDate} mono />}
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--ad-muted)' }}>배송 정보가 아직 없습니다</div>
              )}

              <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', margin: '20px 0 12px', textTransform: 'uppercase' }}>결제 정보</div>
              {data.payment ? (
                <>
                  <KV label="결제수단" value={data.payment.paymentType + (data.payment.cardCompany ? ` — ${data.payment.cardCompany} ${data.payment.cardNoMasked}` : '')} />
                  <KV label="결제상태" value={data.payment.paymentStatusLabel} />
                  <KV label="결제금액" value={data.payment.paidAmountLabel} mono />
                  {data.payment.installment > 0 && <KV label="할부" value={`${data.payment.installment}개월`} />}
                  {data.payment.approvalNo && <KV label="승인번호" value={data.payment.approvalNo} mono />}
                  {data.payment.paidDate && <KV label="결제일시" value={data.payment.paidDate} mono />}
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--ad-muted)' }}>결제 정보가 아직 없습니다</div>
              )}
            </div>
          </div>
        ) : null}

        {/* 상태전이 액션 바 — 버튼 노출은 orderActions(§3.1/3.2) 근거. 성공 시 상세 자동 재조회로 상태 갱신. */}
        {data && (() => {
          const av = orderActions(data.orderStatus, data.shipping?.shippingStatus)
          const terminal = !av.canPrepare && !av.canCancel && !av.canShip && !av.canInTransit && !av.canDeliver
          return (
            <div style={{ borderTop: '1px solid var(--ad-line)', background: 'var(--ad-paper-2)', padding: '14px 26px' }}>
              {terminal ? (
                <div style={{ fontSize: 12.5, color: 'var(--ad-muted)' }}>종결 상태입니다 — 추가로 처리할 작업이 없습니다.</div>
              ) : (
                <>
                  {actionError != null && (
                    <div role="alert" style={{ marginBottom: 10, fontSize: 12.5, color: '#8a3a2c' }}>{adminErrorMessage(actionError)}</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {av.canPrepare && (
                      <button type="button" disabled={anyBusy} onClick={() => t.prepare.mutate()} style={{ ...primaryBtn, opacity: anyBusy ? 0.6 : 1 }}>{t.prepare.isPending ? '처리 중…' : '준비 시작'}</button>
                    )}
                    {av.canShip && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="운송장 번호" style={{ padding: '8px 10px', border: '1px solid var(--ad-line-strong)', fontFamily: 'var(--mono)', fontSize: 12.5, width: 160, outline: 'none' }} />
                        <button type="button" disabled={anyBusy || !trackingNo.trim()} onClick={() => t.ship.mutate(trackingNo.trim())} style={{ ...primaryBtn, opacity: anyBusy || !trackingNo.trim() ? 0.5 : 1 }}>{t.ship.isPending ? '처리 중…' : '출고'}</button>
                      </div>
                    )}
                    {av.canInTransit && (
                      <button type="button" disabled={anyBusy} onClick={() => t.inTransit.mutate()} style={{ ...defaultBtn, opacity: anyBusy ? 0.6 : 1 }}>{t.inTransit.isPending ? '처리 중…' : '배송중으로'}</button>
                    )}
                    {av.canDeliver && (
                      <button type="button" disabled={anyBusy} onClick={() => t.deliver.mutate()} style={{ ...primaryBtn, opacity: anyBusy ? 0.6 : 1 }}>{t.deliver.isPending ? '처리 중…' : '배송완료'}</button>
                    )}
                    <div style={{ flex: 1 }} />
                    {av.canCancel && (
                      <button type="button" disabled={anyBusy} onClick={() => setCancelOpen(true)} style={{ ...dangerBtn, opacity: anyBusy ? 0.6 : 1 }}>주문 취소</button>
                    )}
                  </div>
                  {av.canShip && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ad-muted)' }}>출고 시 운송장 번호가 필수이며, 주문·배송 상태가 함께 이동합니다.</div>}
                </>
              )}
            </div>
          )
        })()}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="주문 취소"
        message={<>이 주문을 취소하면 <b>재고가 복원</b>됩니다. 결제 취소(환불)는 별도 처리이며, <b>이 작업 자체는 환불이 아닙니다</b>. 계속하시겠습니까?</>}
        confirmLabel="주문 취소"
        danger
        busy={t.cancel.isPending}
        error={t.cancel.error}
        onConfirm={() => t.cancel.mutate(undefined, { onSuccess: () => setCancelOpen(false) })}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  )
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', padding: '6px 0', fontSize: 12.5 }}>
      <span style={{ width: 90, color: 'var(--ad-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, fontFamily: mono ? 'var(--mono)' : 'var(--sans)', lineHeight: 1.5 }}>{value}</span>
    </div>
  )
}
