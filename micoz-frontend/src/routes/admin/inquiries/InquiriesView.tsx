// 관리자 1:1 문의 — A2: mock INQUIRIES → 실 API(CS-1 목록 · CS-2 상세) + A3b: 답변등록(CS-3).
// [members.ts/MembersView 패턴 준용] 서버 위임 페이징·검색·필터 + 로딩/에러/빈상태 + 매퍼(api/admin/inquiries.ts). 클라 필터 제거.
// 매퍼 갭: 작성자명·이메일은 CS-1 목록 미제공(userSeq 만) → 백엔드 조인 빚으로 판단, 목록에서 제외(userSeq 표시).
//   Stat 카드(대기/진행중/답변완료): admin 은 WAITING/ANSWERED 2상태뿐이고(IN_PROGRESS 없음) 집계 API 도 없음 → 제거(집계 미제공 빚).
// CS-3: 최초 답변 시 WAITING→ANSWERED + answeredDate 기록. 재답변은 상태·answeredDate 불변. append-only(수정/삭제 없음).
import { useState, useEffect, type CSSProperties } from 'react'
import {
  useInquiries,
  useInquiry,
  useCreateInquiryReply,
  type AdminInquiryRow,
} from '../../../api/admin/inquiries'
import { ADMIN_INQUIRY_TYPE_LABEL } from '../../../api/admin/labels'
import { adminErrorMessage } from '../../../api/admin/errors'
import Card from '../../../components/admin/Card'
import { FilterBar } from '../../../components/admin/filters'
import AdminDropdown from '../../../components/admin/AdminDropdown'
import AdminBtn from '../../../components/admin/AdminBtn'
import DataTable, { type Column } from '../../../components/admin/DataTable'
import Pagination from '../../../components/admin/Pagination'
import { StatusChip } from '../../../components/admin/chips'
import KVCol from '../../../components/admin/KVCol'
import { AIcon } from '../../../components/admin/icons'
import { AdminLoading, AdminError, AdminEmpty } from '../../../components/admin/AsyncState'
import { useModalDismiss } from '../../../lib/useModalDismiss'

const pageWrap: CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }
const PAGE_SIZE = 20

// admin 은 WAITING/ANSWERED 2상태뿐(§2.5) — mock 의 IN_PROGRESS 옵션 제거.
const STATUS_OPTS = [
  { k: 'all', l: '전체 상태' },
  { k: 'WAITING', l: '답변대기' },
  { k: 'ANSWERED', l: '답변완료' },
]
const TYPE_OPTS = [{ k: 'all', l: '전체 카테고리' }, ...Object.entries(ADMIN_INQUIRY_TYPE_LABEL).map(([k, l]) => ({ k, l }))]

// 검색어 디바운스(서버 요청 절약) — 타이핑 멈춘 뒤 400ms.
function useDebounced<T>(value: T, delay = 400): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

const columns: Column<AdminInquiryRow>[] = [
  { key: 'inquiryNo', label: '문의번호', mono: true, nowrap: true, render: (v) => <span style={{ color: '#3a2552', fontWeight: 500 }}>{v as string}</span> },
  { key: 'title', label: '제목', render: (v, r) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: r.inquiryStatus === 'WAITING' ? 500 : 400, color: 'var(--ad-ink)' }}>{v as string}</span>
      {r.privateYn === 'Y' && <span style={{ fontSize: 10.5, color: '#a85050', fontFamily: 'var(--mono)', border: '1px solid #e0c0c0', padding: '1px 6px', borderRadius: 3 }}>비공개</span>}
    </span>
  ) },
  { key: 'typeLabel', label: '카테고리', render: (v) => <span style={{ padding: '3px 10px', background: '#f1edf7', color: '#4d3470', fontSize: 11.5, fontFamily: 'var(--sans)', letterSpacing: '0.02em', borderRadius: 6, whiteSpace: 'nowrap' }}>{v as string}</span> },
  { key: 'userSeq', label: '작성자', mono: true, muted: true, nowrap: true, render: (v) => `#${v as number}` },
  { key: 'createdDate', label: '접수일시', mono: true, muted: true, nowrap: true },
  { key: 'statusLabel', label: '상태', render: (v) => <StatusChip status={v as string} /> },
]

export default function InquiriesView() {
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1) // 1-based UI
  const [detailId, setDetailId] = useState<number | null>(null)

  const q = useDebounced(searchInput.trim())

  // 필터/검색 변경 시 1페이지로.
  useEffect(() => { setPage(1) }, [status, type, q])

  const { data, isLoading, isError, error, refetch, isFetching } = useInquiries({
    q: q || undefined,
    inquiryType: type !== 'all' ? type : undefined,
    inquiryStatus: status !== 'all' ? status : undefined,
    page: page - 1, // 0-based
    size: PAGE_SIZE,
    sort: 'inquirySeq,desc',
  })

  return (
    <div style={pageWrap}>
      <Card padding={0}>
        <FilterBar action={<AdminBtn icon={AIcon.download(13)} size="sm">CSV</AdminBtn>}>
          <AdminDropdown value={status} onChange={setStatus} options={STATUS_OPTS} width={150} />
          <AdminDropdown value={type} onChange={setType} options={TYPE_OPTS} width={170} />
          <span style={{ width: 1, height: 22, background: 'var(--ad-line)', margin: '0 4px' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fff', border: '1px solid var(--ad-line-strong)', width: 280 }}>
            <span style={{ color: 'var(--ad-muted)', display: 'flex' }}>{AIcon.search(14)}</span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="제목 검색"
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
          <AdminLoading label="문의 목록을 불러오는 중…" />
        ) : isError ? (
          <AdminError error={error} onRetry={refetch} />
        ) : !data || data.rows.length === 0 ? (
          <AdminEmpty label="조건에 맞는 문의가 없습니다" />
        ) : (
          <>
            <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
              <DataTable columns={columns} rows={data.rows} rowKey="inquirySeq" onRowClick={(r) => setDetailId(r.inquirySeq)} />
            </div>
            <Pagination page={page} total={data.totalElements} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Card>

      <InquiryDetailModal inquirySeq={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}

// ─── 문의 상세 / 답변 모달 (CS-2) ───
function InquiryDetailModal({ inquirySeq, onClose }: { inquirySeq: number | null; onClose: () => void }) {
  const [reply, setReply] = useState('')
  useModalDismiss(onClose, inquirySeq != null)
  const { data, isLoading, isError, error, refetch } = useInquiry(inquirySeq)
  const replyMut = useCreateInquiryReply(inquirySeq ?? -1)

  useEffect(() => {
    setReply('') // 모달 열릴 때 답변 초기화
    replyMut.reset()
  }, [inquirySeq])

  if (inquirySeq == null) return null

  const trimmed = reply.trim()
  const canSubmit = trimmed.length > 0 && trimmed.length <= 2000 && !replyMut.isPending
  const submitReply = () => {
    if (!canSubmit) return
    // 성공 시 상세 invalidate → 답변 목록·상태(ANSWERED)·answeredDate 자동 갱신. append-only.
    replyMut.mutate(trimmed, { onSuccess: () => setReply('') })
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: 'min(820px, 100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line-strong)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 26px', borderBottom: '1px solid var(--ad-line)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.18em', marginBottom: 4 }}>INQUIRY DETAIL</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: '#3a2552', fontWeight: 500 }}>{data?.inquiryNo ?? ''}</span>
              {data && <StatusChip status={data.statusLabel} />}
              {data?.privateYn === 'Y' && <span style={{ fontSize: 10.5, color: '#a85050', fontFamily: 'var(--mono)', border: '1px solid #e0c0c0', padding: '1px 6px', borderRadius: 3 }}>비공개</span>}
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, marginTop: 10, fontWeight: 500 }}>{data?.title ?? '문의 상세'}</div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--ad-line-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: 26, overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <AdminLoading label="문의 정보를 불러오는 중…" />
          ) : isError ? (
            <AdminError error={error} onRetry={refetch} />
          ) : data ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, padding: '12px 0 18px', borderBottom: '1px solid var(--ad-line)', fontSize: 12 }}>
                <KVCol label="작성자" value={`#${data.userSeq}`} mono />
                <KVCol label="카테고리" value={data.typeLabel} />
                <KVCol label="접수일시" value={data.createdDate} mono />
                <KVCol label="최초 응답일시" value={data.answeredDate || '-'} mono />
              </div>

              <div style={{ marginTop: 20, padding: 18, background: 'var(--ad-paper-2)', border: '1px solid var(--ad-line)', fontSize: 13.5, lineHeight: 1.7, color: 'var(--ad-ink)', whiteSpace: 'pre-wrap' }}>{data.content}</div>

              {data.replies.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }}>등록된 답변 ({data.replies.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.replies.map((r) => (
                      <div key={r.replySeq} style={{ padding: 14, background: '#f7f4fb', border: '1px solid var(--ad-line)', fontSize: 13, lineHeight: 1.65, color: 'var(--ad-ink)', whiteSpace: 'pre-wrap' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 10.5, color: 'var(--ad-muted)', fontFamily: 'var(--mono)' }}>
                          <span>관리자 #{r.adminSeq}</span>
                          <span>{r.createdDate}</span>
                        </div>
                        {r.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {data.replies.length > 0 ? '답변 추가' : '답변 작성'}
                </div>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: reply.trim().length > 2000 ? '#a85050' : 'var(--ad-muted)' }}>{reply.trim().length} / 2000</span>
              </div>
              {data.replies.length > 0 && (
                <div style={{ marginBottom: 8, fontSize: 11.5, color: 'var(--ad-muted)', lineHeight: 1.5 }}>
                  이미 답변 완료된 문의입니다. 추가 답변을 등록해도 <b>최초 응답일시는 바뀌지 않습니다</b>(답변은 수정·삭제 불가, 정정은 새 답변으로).
                </div>
              )}
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                maxLength={2000}
                placeholder="고객에게 보낼 답변을 작성하세요"
                style={{ width: '100%', minHeight: 140, padding: '12px 14px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)', lineHeight: 1.6, outline: 'none', resize: 'vertical' }}
              />
              {replyMut.error != null && (
                <div role="alert" style={{ marginTop: 8, fontSize: 12.5, color: '#8a3a2c' }}>{adminErrorMessage(replyMut.error)}</div>
              )}
            </>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 26px', borderTop: '1px solid var(--ad-line)', background: 'var(--ad-paper-2)' }}>
          <AdminBtn onClick={onClose}>닫기</AdminBtn>
          <button
            type="button"
            onClick={submitReply}
            disabled={!canSubmit}
            style={{ padding: '8px 18px', background: '#3a2552', color: '#f5f1ea', border: '1px solid #3a2552', cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'var(--sans)', fontSize: 12.5, letterSpacing: '0.02em', opacity: canSubmit ? 1 : 0.5 }}
          >
            {replyMut.isPending ? '전송 중…' : data?.replies.length ? '답변 추가' : '답변 전송'}
          </button>
        </div>
      </div>
    </div>
  )
}
