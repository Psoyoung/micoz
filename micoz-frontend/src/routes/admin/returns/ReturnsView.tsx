// 관리자 반품·교환 관리 — A2: mock RETURNS → 실 API(R-1 목록 · R-2 상세).
// [A2] members/MembersView 패턴 그대로: 서버 위임 페이징·검색·필터 + 로딩/에러/빈상태 + 매퍼(api/admin/returns.ts). 클라 필터/정렬 제거.
// 매퍼 갭: R-1 은 고객명 없이 userSeq만 제공(조인 없음) → 백엔드 빚, `#userSeq` 로 표시.
//   상품명/옵션도 R-1 목록엔 없음(상세 items[] 에서만) → 목록 컬럼에서 제외, totalItemCount 로 대체.
//   신규/처리중/완료/반려 집계 카드(mock Stat)는 전체 데이터 기반이라 서버 페이징과 불일치 → 집계 API 없음(빚) 이유로 제거.
// A3b: 상태 전이(승인/반려/회수/검수/완료, R-3~R-7)를 §3.3 전이표대로 상세 모달 액션 바에 연동.
//   complete 는 유형별 부수효과 안내(ConfirmDialog) + 되돌리기 없음. inspect 는 재입고(restockYn) 판정 포함.
import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import {
  useReturns,
  useReturn,
  useReturnTransitions,
  returnActions,
  type AdminReturnRow,
} from '../../../api/admin/returns'
import { ADMIN_RETURN_STATUS_LABEL, ADMIN_RETURN_TYPE_LABEL } from '../../../api/admin/labels'
import { won } from '../../../api/admin/format'
import { adminErrorMessage } from '../../../api/admin/errors'
import Card from '../../../components/admin/Card'
import { FilterBar } from '../../../components/admin/filters'
import AdminDropdown from '../../../components/admin/AdminDropdown'
import AdminBtn from '../../../components/admin/AdminBtn'
import DataTable, { type Column } from '../../../components/admin/DataTable'
import Pagination from '../../../components/admin/Pagination'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import { StatusChip } from '../../../components/admin/chips'
import KVCol from '../../../components/admin/KVCol'
import { AIcon } from '../../../components/admin/icons'
import { AdminLoading, AdminError, AdminEmpty } from '../../../components/admin/AsyncState'
import { useModalDismiss } from '../../../lib/useModalDismiss'

const pageWrap: CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }
const PAGE_SIZE = 20

// 상태전이 액션 버튼 스타일
const actBtnBase: CSSProperties = { padding: '8px 16px', border: '1px solid', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, letterSpacing: '0.02em' }
const primaryBtn: CSSProperties = { ...actBtnBase, background: '#3a2552', color: '#f5f1ea', borderColor: '#3a2552' }
const dangerBtn: CSSProperties = { ...actBtnBase, background: '#fff', color: '#8a3a2c', borderColor: '#e6c8c1' }

// 유형별 색 — 원본 typeColor 보존(코드 키 기준).
const TYPE_COLOR: Record<string, string> = { CANCEL: '#a85050', EXCHANGE: '#6b4d8f', RETURN: '#c08a3a' }

const STATUS_OPTS = [{ k: 'all', l: '전체 상태' }, ...Object.entries(ADMIN_RETURN_STATUS_LABEL).map(([k, l]) => ({ k, l }))]
const TYPE_OPTS = [{ k: 'all', l: '전체 유형' }, ...Object.entries(ADMIN_RETURN_TYPE_LABEL).map(([k, l]) => ({ k, l }))]

// 검색어 디바운스(서버 요청 절약) — 타이핑 멈춘 뒤 400ms.
function useDebounced<T>(value: T, delay = 400): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

const columns: Column<AdminReturnRow>[] = [
  { key: 'returnNo', label: '신청번호', mono: true, nowrap: true, render: (v) => <span style={{ color: '#3a2552', fontWeight: 500 }}>{v as string}</span> },
  { key: 'orderNo', label: '주문번호', mono: true, muted: true, nowrap: true },
  { key: 'userSeq', label: '고객', mono: true, muted: true, nowrap: true, render: (v) => `#${v}` },
  { key: 'typeLabel', label: '유형', render: (_v, r) => <span style={{ fontSize: 11.5, fontWeight: 500, color: TYPE_COLOR[r.returnType] || 'var(--ad-ink)', whiteSpace: 'nowrap' }}>{r.typeLabel}</span> },
  { key: 'reasonLabel', label: '사유', nowrap: true },
  { key: 'refundAmount', label: '환불 예정', align: 'right', mono: true, nowrap: true, render: (v) => ((v as number) > 0 ? won(v) : '—') },
  { key: 'requestedDate', label: '신청일시', mono: true, muted: true, nowrap: true },
  { key: 'statusLabel', label: '상태', render: (_v, r) => <StatusChip status={r.statusLabel} /> },
]

export default function ReturnsView() {
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1) // 1-based UI
  const [detailSeq, setDetailSeq] = useState<number | null>(null)

  const q = useDebounced(searchInput.trim())

  // 필터/검색 변경 시 1페이지로.
  useEffect(() => { setPage(1) }, [status, type, q])

  const { data, isLoading, isError, error, refetch, isFetching } = useReturns({
    q: q || undefined,
    returnStatus: status !== 'all' ? status : undefined,
    returnType: type !== 'all' ? type : undefined,
    page: page - 1, // 0-based
    size: PAGE_SIZE,
    sort: 'requestedDate,desc',
  })

  return (
    <div style={pageWrap}>
      <Card title="반품 · 교환 신청" subtitle="RETURNS & EXCHANGES" padding={0}>
        <FilterBar
          action={
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fff', border: '1px solid var(--ad-line-strong)', width: 240 }}>
              <span style={{ color: 'var(--ad-muted)', display: 'flex' }}>{AIcon.search(14)}</span>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="신청번호 검색"
                style={{ border: 'none', outline: 'none', flex: 1, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ad-ink)', minWidth: 0 }}
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ad-muted)', display: 'flex', padding: 0 }} title="검색어 지우기">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              )}
            </div>
          }
        >
          <AdminDropdown value={status} onChange={setStatus} options={STATUS_OPTS} width={150} />
          <AdminDropdown value={type} onChange={setType} options={TYPE_OPTS} width={130} />
        </FilterBar>

        {isLoading ? (
          <AdminLoading label="반품·교환 목록을 불러오는 중…" />
        ) : isError ? (
          <AdminError error={error} onRetry={refetch} />
        ) : !data || data.rows.length === 0 ? (
          <AdminEmpty label="조건에 맞는 반품·교환 신청이 없습니다" />
        ) : (
          <>
            <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
              <DataTable columns={columns} rows={data.rows} rowKey="returnSeq" onRowClick={(r) => setDetailSeq(r.returnSeq)} />
            </div>
            <Pagination page={page} total={data.totalElements} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Card>

      <ReturnDetailModal returnSeq={detailSeq} onClose={() => setDetailSeq(null)} />
    </div>
  )
}

// ─── 반품 상세 모달 (R-2 + R-3~R-7 상태전이) ───
function ReturnDetailModal({ returnSeq, onClose }: { returnSeq: number | null; onClose: () => void }) {
  useModalDismiss(onClose, returnSeq != null)
  const { data, isLoading, isError, error, refetch } = useReturn(returnSeq)
  const t = useReturnTransitions(returnSeq ?? -1)
  const [restock, setRestock] = useState(true) // 검수 재입고 판정(restockYn)
  const [completeOpen, setCompleteOpen] = useState(false)
  // 검수 재입고 기본값 = 사유 기반(DEFECT=N, 그 외=Y). 관리자 오버라이드 가능.
  useEffect(() => {
    if (data) setRestock(data.reasonType !== 'DEFECT')
  }, [data?.returnSeq, data?.reasonType])
  if (returnSeq == null) return null

  const av = data ? returnActions(data.returnStatus) : null
  const isExchange = data?.returnType === 'EXCHANGE'
  const actionError = t.approve.error || t.reject.error || t.collect.error || t.inspect.error
  const anyBusy = t.approve.isPending || t.reject.isPending || t.collect.isPending || t.inspect.isPending || t.complete.isPending
  const completeMessage: ReactNode = isExchange ? (
    <>이 <b>교환</b> 반품을 완료 처리합니다. <b>환불이 발생하지 않으며</b> 상태만 '완료'로 변경됩니다(환불액 0 · 결제·재고 변화 없음). 계속하시겠습니까?</>
  ) : (
    <>이 반품을 완료하면 <b>환불 실행 + 결제상태 REFUNDED + 주문 종결({data?.returnType === 'CANCEL' ? '취소' : '반품완료'}) + 재고 복원(재입고 대상만)</b>이 함께 일어나며, <b>되돌릴 수 없습니다</b>. 계속하시겠습니까?</>
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: 'min(760px, 100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line-strong)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 26px', borderBottom: '1px solid var(--ad-line)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.18em', marginBottom: 4 }}>RETURN DETAIL</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: '#3a2552', fontWeight: 500 }}>{data ? data.returnNo : '···'}</span>
              {data && <StatusChip status={data.statusLabel} />}
              {data && <span style={{ fontSize: 11.5, fontWeight: 500, padding: '2px 10px', background: 'var(--ad-paper-2)', border: '1px solid var(--ad-line-strong)' }}>{data.typeLabel}</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--ad-line-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: 26, overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <AdminLoading label="반품 정보를 불러오는 중…" />
          ) : isError ? (
            <AdminError error={error} onRetry={refetch} />
          ) : data ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, padding: '4px 0 18px', borderBottom: '1px solid var(--ad-line)' }}>
                <KVCol label="고객" value={`#${data.userSeq}`} mono />
                <KVCol label="원주문" value={data.orderNo} mono />
                <KVCol label="사유 유형" value={data.reasonLabel} />
                <KVCol label="신청일시" value={data.requestedDate} mono />
                <KVCol label="완료일시" value={data.completedDate || '—'} mono />
                <KVCol label="반품 배송비" value={data.returnShippingFee > 0 ? won(data.returnShippingFee) : '—'} mono />
              </div>

              {/* 대상 상품 */}
              <div style={{ marginTop: 18, fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>대상 상품</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.items.map((it) => (
                  <div key={it.returnItemSeq} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, border: '1px solid var(--ad-line)', background: 'var(--ad-paper-2)' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{it.productName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ad-muted)', marginTop: 3 }}>
                        옵션 {it.optionName} · 수량 {it.quantity}개
                        {it.exchangeOptionName && <span style={{ color: '#6b4d8f' }}> · 교환 옵션 → {it.exchangeOptionName}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.12em' }}>단가</div>
                      <div style={{ fontFamily: 'var(--serif-en)', fontSize: 16, color: 'var(--ad-ink)', marginTop: 2 }}>{it.unitPriceLabel}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.12em' }}>환불 예정</div>
                  <div style={{ fontFamily: 'var(--serif-en)', fontSize: 18, color: 'var(--ad-ink)', marginTop: 2 }}>{data.refundAmount > 0 ? won(data.refundAmount) : '—'}</div>
                </div>
              </div>

              {/* 사유 */}
              <div style={{ marginTop: 18, padding: 16, background: 'var(--ad-paper-2)', border: '1px solid var(--ad-line)', fontSize: 13.5, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{data.reason || '-'}</div>

              {/* 회수지 */}
              {data.pickupFull ? (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>회수지</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    {data.pickupFull}
                    {data.pickupPhone && <span style={{ color: 'var(--ad-muted)', fontFamily: 'var(--mono)', marginLeft: 8 }}>{data.pickupPhone}</span>}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {/* 상태전이 액션 바 — 버튼 노출은 returnActions(§3.3) 근거. 성공 시 상세 자동 재조회로 상태·환불액 갱신. */}
        <div style={{ padding: '14px 26px', borderTop: '1px solid var(--ad-line)', background: 'var(--ad-paper-2)' }}>
          {actionError != null && (
            <div role="alert" style={{ marginBottom: 10, fontSize: 12.5, color: '#8a3a2c' }}>{adminErrorMessage(actionError)}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div>
              {av?.canReject && (
                <button type="button" disabled={anyBusy} onClick={() => t.reject.mutate()} style={{ ...dangerBtn, opacity: anyBusy ? 0.6 : 1 }}>{t.reject.isPending ? '처리 중…' : '반려'}</button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <AdminBtn onClick={onClose}>닫기</AdminBtn>
              {av?.canApprove && (
                <button type="button" disabled={anyBusy} onClick={() => t.approve.mutate()} style={{ ...primaryBtn, opacity: anyBusy ? 0.6 : 1 }}>{t.approve.isPending ? '처리 중…' : '신청 승인'}</button>
              )}
              {av?.canCollect && (
                <button type="button" disabled={anyBusy} onClick={() => t.collect.mutate()} style={{ ...primaryBtn, opacity: anyBusy ? 0.6 : 1 }}>{t.collect.isPending ? '처리 중…' : '회수 완료'}</button>
              )}
              {av?.canInspect && (
                <>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ad-ink)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
                    재입고 처리
                  </label>
                  <button type="button" disabled={anyBusy} onClick={() => t.inspect.mutate(restock ? 'Y' : 'N')} style={{ ...primaryBtn, opacity: anyBusy ? 0.6 : 1 }}>{t.inspect.isPending ? '처리 중…' : '검수 완료'}</button>
                </>
              )}
              {av?.canComplete && (
                <button type="button" disabled={anyBusy} onClick={() => setCompleteOpen(true)} style={{ ...primaryBtn, background: isExchange ? '#3a2552' : '#8a3a2c', borderColor: isExchange ? '#3a2552' : '#8a3a2c', opacity: anyBusy ? 0.6 : 1 }}>{isExchange ? '교환 완료' : '환불·완료 처리'}</button>
              )}
            </div>
          </div>
          {av?.canInspect && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ad-muted)' }}>
              재입고 처리 = 재판매 가능분을 완료 시 재고로 복원. 사유 '{data?.reasonLabel}' 기본값 {data?.reasonType === 'DEFECT' ? 'N(미복원)' : 'Y(복원)'} — 필요 시 변경하세요.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={completeOpen}
        title={isExchange ? '교환 완료 처리' : '반품 완료 (환불 실행)'}
        message={completeMessage}
        confirmLabel={isExchange ? '교환 완료' : '환불·완료 처리'}
        danger={!isExchange}
        busy={t.complete.isPending}
        error={t.complete.error}
        onConfirm={() => t.complete.mutate(undefined, { onSuccess: () => setCompleteOpen(false) })}
        onCancel={() => setCompleteOpen(false)}
      />
    </div>
  )
}
