// 관리자 배너 설정 — A2(조회 S-1·S-2) + A3a(변이 S-3 생성·S-4 수정·S-5 노출토글·S-6 삭제) 실 API 연동.
// [members.ts/MembersView.tsx 레퍼런스 따름] 서버 위임 페이징·검색·타입/전시 필터 + 로딩/에러/빈상태 + 상세 모달 + 생성/수정 폼 + 토글 + 삭제확인.
// 매퍼 갭: mock 의 순서 변경(move, 드래그 재정렬)은 전용 엔드포인트 부재 — 정렬순서는 폼의 숫자 입력으로만 변경(빚 아님, 명세 범위).
import { useState, useEffect, type CSSProperties, type FormEvent } from 'react'
import {
  useBanners,
  useBanner,
  useCreateBanner,
  useUpdateBanner,
  useUpdateBannerDisplay,
  useDeleteBanner,
  type AdminBannerRow,
} from '../../../api/admin/banners'
import { ADMIN_BANNER_TYPE_LABEL } from '../../../api/admin/labels'
import { adminErrorMessage } from '../../../api/admin/errors'
import Card from '../../../components/admin/Card'
import { FilterBar } from '../../../components/admin/filters'
import AdminDropdown from '../../../components/admin/AdminDropdown'
import AdminBtn from '../../../components/admin/AdminBtn'
import DataTable, { type Column } from '../../../components/admin/DataTable'
import Pagination from '../../../components/admin/Pagination'
import KVCol from '../../../components/admin/KVCol'
import { AIcon } from '../../../components/admin/icons'
import { AdminLoading, AdminError, AdminEmpty } from '../../../components/admin/AsyncState'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import { useModalDismiss } from '../../../lib/useModalDismiss'

const pageWrap: CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }
const PAGE_SIZE = 20

const TYPE_OPTS = [{ k: 'all', l: '전체 유형' }, ...Object.entries(ADMIN_BANNER_TYPE_LABEL).map(([k, l]) => ({ k, l }))]
const DISPLAY_OPTS = [{ k: 'all', l: '전체 상태' }, { k: 'Y', l: '노출' }, { k: 'N', l: '숨김' }]
const BANNER_TYPE_OPTS = Object.entries(ADMIN_BANNER_TYPE_LABEL).map(([k, l]) => ({ k, l }))

const rowIconBtn: CSSProperties = { width: 26, height: 26, background: '#fff', border: '1px solid var(--ad-line-strong)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ad-ink)' }

// 검색어 디바운스(서버 요청 절약) — 타이핑 멈춘 뒤 400ms.
function useDebounced<T>(value: T, delay = 400): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

function TypeBadge({ label }: { label: string }) {
  return (
    <span style={{ padding: '3px 9px', background: '#f1edf7', color: '#4d3470', fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{label}</span>
  )
}

// 전시 토글(S-5) — 목록/상세 공용. useYn='N'(삭제됨)은 토글 비활성.
function DisplayToggle({ bannerSeq, displayYn, useYn, size = 'sm' }: { bannerSeq: number; displayYn: string; useYn: string; size?: 'sm' | 'md' }) {
  const mutation = useUpdateBannerDisplay(bannerSeq)
  const on = displayYn === 'Y'
  const disabled = mutation.isPending || useYn === 'N'
  const pad = size === 'sm' ? '3px 10px 3px 8px' : '6px 14px 6px 10px'
  const fontSize = size === 'sm' ? 11.5 : 12.5
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); mutation.mutate({ displayYn: on ? 'N' : 'Y' }) }}
        title={useYn === 'N' ? '삭제된 배너는 전시할 수 없습니다' : on ? '숨기기' : '노출하기'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: pad, background: on ? '#eaf4ee' : '#f1eef5', color: on ? '#2d6a44' : '#6b5d72', fontSize, fontFamily: 'var(--sans)', fontWeight: 500, border: 'none', cursor: disabled ? 'default' : 'pointer', opacity: mutation.isPending ? 0.6 : 1 }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: on ? '#3a8a5a' : '#9a8fa6' }} />
        {mutation.isPending ? '변경 중…' : on ? '노출' : '숨김'}
      </button>
      {mutation.isError && <span style={{ fontSize: 10.5, color: '#a85050', fontFamily: 'var(--mono)' }} title={adminErrorMessage(mutation.error)}>오류</span>}
    </span>
  )
}

function BannerActions({ row, onEdit, onDelete }: { row: AdminBannerRow; onEdit: () => void; onDelete: () => void }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={onEdit} title="수정" style={rowIconBtn}>{AIcon.edit(13)}</button>
      <button type="button" onClick={onDelete} title="삭제" disabled={row.useYn === 'N'} style={{ ...rowIconBtn, opacity: row.useYn === 'N' ? 0.4 : 1, cursor: row.useYn === 'N' ? 'default' : 'pointer' }}>{AIcon.trash(13)}</button>
    </span>
  )
}

export default function BannerView() {
  const [type, setType] = useState('all')
  const [display, setDisplay] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1) // 1-based UI
  const [detailId, setDetailId] = useState<number | null>(null)
  const [formTarget, setFormTarget] = useState<'create' | number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminBannerRow | null>(null)

  const columns: Column<AdminBannerRow>[] = [
    { key: 'imageUrl', label: '이미지', w: 90, render: (v) => (
      (v as string) ? (
        <img src={v as string} alt="" style={{ width: 72, height: 32, objectFit: 'cover', border: '1px solid var(--ad-line-strong)', display: 'block' }} />
      ) : (
        <div style={{ width: 72, height: 32, background: 'var(--ad-paper-2)', border: '1px dashed var(--ad-line-strong)' }} />
      )
    ) },
    { key: 'title', label: '제목', render: (v) => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    { key: 'typeLabel', label: '유형', render: (v) => <TypeBadge label={v as string} /> },
    { key: 'sortOrder', label: '정렬순서', align: 'right', mono: true, nowrap: true },
    { key: 'displayYn', label: '전시', render: (_v, r) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <DisplayToggle bannerSeq={r.bannerSeq} displayYn={r.displayYn} useYn={r.useYn} />
        {r.useYn === 'N' && <span style={{ fontSize: 10.5, color: '#a85050', fontFamily: 'var(--mono)' }}>삭제됨</span>}
      </span>
    ) },
    { key: 'bannerSeq', label: '관리', w: 80, render: (_v, r) => (
      <BannerActions row={r} onEdit={() => setFormTarget(r.bannerSeq)} onDelete={() => setDeleteTarget(r)} />
    ) },
  ]

  const q = useDebounced(searchInput.trim())

  // 필터/검색 변경 시 1페이지로.
  useEffect(() => { setPage(1) }, [type, display, q])

  const { data, isLoading, isError, error, refetch, isFetching } = useBanners({
    q: q || undefined,
    bannerType: type !== 'all' ? type : undefined,
    displayYn: display !== 'all' ? display : undefined,
    page: page - 1, // 0-based
    size: PAGE_SIZE,
    sort: 'sortOrder,asc',
  })

  return (
    <div style={pageWrap}>
      <Card title="배너 관리" subtitle="메인 · 카테고리 · 프로모션 배너" padding={0}>
        <FilterBar
          action={
            <AdminBtn icon={AIcon.plus(13)} size="sm" variant="primary" onClick={() => setFormTarget('create')}>배너 추가</AdminBtn>
          }
        >
          <AdminDropdown value={type} onChange={setType} options={TYPE_OPTS} width={150} />
          <AdminDropdown value={display} onChange={setDisplay} options={DISPLAY_OPTS} width={140} />
          <span style={{ width: 1, height: 22, background: 'var(--ad-line)', margin: '0 4px' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fff', border: '1px solid var(--ad-line-strong)', width: 260 }}>
            <span style={{ color: 'var(--ad-muted)', display: 'flex' }}>{AIcon.search(14)}</span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="배너 제목 검색"
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
          <AdminLoading label="배너 목록을 불러오는 중…" />
        ) : isError ? (
          <AdminError error={error} onRetry={refetch} />
        ) : !data || data.rows.length === 0 ? (
          <AdminEmpty label="조건에 맞는 배너가 없습니다" />
        ) : (
          <>
            <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
              <DataTable columns={columns} rows={data.rows} rowKey="bannerSeq" onRowClick={(r) => setDetailId(r.bannerSeq)} />
            </div>
            <Pagination page={page} total={data.totalElements} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Card>

      <BannerDetailModal
        bannerSeq={detailId}
        onClose={() => setDetailId(null)}
        onEdit={(seq) => { setDetailId(null); setFormTarget(seq) }}
        onDelete={(row) => { setDetailId(null); setDeleteTarget(row) }}
      />
      <BannerFormModal
        key={formTarget === null ? 'closed' : String(formTarget)}
        bannerSeq={typeof formTarget === 'number' ? formTarget : null}
        open={formTarget != null}
        onClose={() => setFormTarget(null)}
      />
      <DeleteBannerDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  )
}

// ─── 배너 상세 모달 (S-2) — 전시 토글 + 수정/삭제 진입점 ───
function BannerDetailModal({ bannerSeq, onClose, onEdit, onDelete }: { bannerSeq: number | null; onClose: () => void; onEdit: (bannerSeq: number) => void; onDelete: (row: AdminBannerRow) => void }) {
  useModalDismiss(onClose, bannerSeq != null)
  const { data, isLoading, isError, error, refetch } = useBanner(bannerSeq)
  if (bannerSeq == null) return null

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: 'min(640px, 100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line-strong)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 26px', borderBottom: '1px solid var(--ad-line)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.18em', marginBottom: 4 }}>BANNER DETAIL</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500 }}>{data ? data.title : '배너 상세'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {data && bannerSeq != null && (
              <>
                <button type="button" onClick={() => onEdit(bannerSeq)} title="수정" style={rowIconBtn}>{AIcon.edit(13)}</button>
                <button
                  type="button"
                  onClick={() => onDelete({ bannerSeq, bannerType: data.bannerType, typeLabel: data.typeLabel, title: data.title, imageUrl: data.imageUrl, sortOrder: data.sortOrder, displayYn: data.displayYn, useYn: data.useYn })}
                  title="삭제"
                  disabled={data.useYn === 'N'}
                  style={{ ...rowIconBtn, opacity: data.useYn === 'N' ? 0.4 : 1, cursor: data.useYn === 'N' ? 'default' : 'pointer' }}
                >
                  {AIcon.trash(13)}
                </button>
              </>
            )}
            <button type="button" onClick={onClose} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--ad-line-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="닫기 (Esc)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>

        <div style={{ padding: 26, overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <AdminLoading label="배너 정보를 불러오는 중…" />
          ) : isError ? (
            <AdminError error={error} onRetry={refetch} />
          ) : data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {data.imageUrl ? (
                <img src={data.imageUrl} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', border: '1px solid var(--ad-line-strong)' }} />
              ) : (
                <div style={{ width: '100%', height: 160, background: 'var(--ad-paper-2)', border: '1px dashed var(--ad-line-strong)' }} />
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, fontSize: 12 }}>
                <KVCol label="유형" value={data.typeLabel} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>전시 여부</div>
                  <DisplayToggle bannerSeq={bannerSeq} displayYn={data.displayYn} useYn={data.useYn} />
                </div>
                <KVCol label="정렬순서" value={String(data.sortOrder)} mono />
                {data.useYn === 'N' && <KVCol label="상태" value="삭제됨" />}
                <div style={{ gridColumn: '1 / -1' }}><KVCol label="링크" value={data.linkUrl || '-'} mono /></div>
                <div style={{ gridColumn: '1 / -1' }}><KVCol label="설명" value={data.description || '-'} /></div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── 배너 생성/수정 폼 (S-3/S-4) — bannerSeq=null 이면 생성, 지정 시 수정(상세 fetch 후 프리필). ───
const fieldStyle: CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)', outline: 'none' }
const labelStyle: CSSProperties = { display: 'block', fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginBottom: 6, textTransform: 'uppercase' }

type BannerFormValues = {
  title: string
  imageUrl: string
  bannerType: string
  description: string
  linkUrl: string
  sortOrder: string
  displayYn: boolean
}
const EMPTY_BANNER_FORM: BannerFormValues = { title: '', imageUrl: '', bannerType: 'HERO', description: '', linkUrl: '', sortOrder: '0', displayYn: true }

function BannerFormModal({ bannerSeq, open, onClose }: { bannerSeq: number | null; open: boolean; onClose: () => void }) {
  const isEdit = bannerSeq != null
  const detail = useBanner(isEdit ? bannerSeq : null)
  const createM = useCreateBanner()
  const updateM = useUpdateBanner(bannerSeq ?? -1)
  const mutation = isEdit ? updateM : createM
  const [form, setForm] = useState<BannerFormValues>(EMPTY_BANNER_FORM)
  useModalDismiss(onClose, open)

  useEffect(() => {
    if (!open) return
    if (isEdit && detail.data) {
      setForm({
        title: detail.data.title,
        imageUrl: detail.data.imageUrl,
        bannerType: detail.data.bannerType,
        description: detail.data.description,
        linkUrl: detail.data.linkUrl,
        sortOrder: String(detail.data.sortOrder),
        displayYn: detail.data.displayYn === 'Y',
      })
    } else if (!isEdit) {
      setForm(EMPTY_BANNER_FORM)
    }
  }, [open, isEdit, detail.data])

  if (!open) return null

  const loadingDetail = isEdit && detail.isLoading
  const detailFailed = isEdit && detail.isError

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const body = {
      title: form.title,
      imageUrl: form.imageUrl,
      bannerType: form.bannerType,
      description: form.description || undefined,
      linkUrl: form.linkUrl || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      displayYn: form.displayYn ? 'Y' : 'N',
    }
    mutation.mutate(body, { onSuccess: () => onClose() })
  }

  return (
    <div onClick={() => !mutation.isPending && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={{ background: '#fff', width: 'min(560px, 100%)', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 26px', borderBottom: '1px solid var(--ad-line)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.18em', marginBottom: 4 }}>{isEdit ? 'EDIT BANNER' : 'NEW BANNER'}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, color: 'var(--ad-ink)' }}>{isEdit ? '배너 수정' : '배너 추가'}</div>
          </div>
          <button type="button" onClick={onClose} disabled={mutation.isPending} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--ad-line-strong)', cursor: mutation.isPending ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ad-ink)', flexShrink: 0, opacity: mutation.isPending ? 0.5 : 1 }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {loadingDetail ? (
          <div style={{ padding: 26 }}><AdminLoading label="배너 정보를 불러오는 중…" /></div>
        ) : detailFailed ? (
          <div style={{ padding: 26 }}><AdminError error={detail.error} onRetry={detail.refetch} /></div>
        ) : (
          <div style={{ padding: 26, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 18px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>제목 <span style={{ color: '#a05a5a' }}>*</span></div>
              <input style={fieldStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="배너 제목" required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>이미지 URL <span style={{ color: '#a05a5a' }}>*</span></div>
              <input style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://…" required />
            </div>
            <div>
              <div style={labelStyle}>유형</div>
              <select style={fieldStyle} value={form.bannerType} onChange={(e) => setForm((f) => ({ ...f, bannerType: e.target.value }))}>
                {BANNER_TYPE_OPTS.map((o) => (<option key={o.k} value={o.k}>{o.l}</option>))}
              </select>
            </div>
            <div>
              <div style={labelStyle}>정렬순서</div>
              <input type="number" style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>링크 URL</div>
              <input style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} placeholder="/products/123" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>설명</div>
              <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: 72, fontFamily: 'var(--sans)' }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="배너 설명" />
            </div>
            <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--ad-ink)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.displayYn} onChange={(e) => setForm((f) => ({ ...f, displayYn: e.target.checked }))} />
              전시(노출)
            </label>
            {mutation.isError && (
              <div role="alert" style={{ gridColumn: '1 / -1', padding: '10px 12px', background: '#fbece9', border: '1px solid #e6c8c1', fontSize: 12.5, lineHeight: 1.6, color: '#8a3a2c' }}>
                {adminErrorMessage(mutation.error)}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 26px', borderTop: '1px solid var(--ad-line)', background: 'var(--ad-paper-2)' }}>
          <AdminBtn onClick={onClose} style={mutation.isPending ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>취소</AdminBtn>
          <button type="submit" disabled={mutation.isPending || loadingDetail || detailFailed} style={{ padding: '8px 18px', background: '#3a2552', color: '#f5f1ea', border: '1px solid #3a2552', cursor: mutation.isPending ? 'default' : 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, letterSpacing: '0.02em', opacity: mutation.isPending ? 0.6 : 1 }}>
            {mutation.isPending ? '저장 중…' : isEdit ? '저장' : '배너 추가'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── 배너 삭제 확인 (S-6) ───
function DeleteBannerDialog({ target, onClose }: { target: AdminBannerRow | null; onClose: () => void }) {
  const mutation = useDeleteBanner(target?.bannerSeq ?? -1)
  return (
    <ConfirmDialog
      open={target != null}
      title="배너 삭제"
      message={target ? <>“{target.title}” 배너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</> : null}
      confirmLabel="삭제"
      danger
      busy={mutation.isPending}
      error={mutation.error}
      onConfirm={() => mutation.mutate(undefined, { onSuccess: onClose })}
      onCancel={() => { if (!mutation.isPending) { mutation.reset(); onClose() } }}
    />
  )
}
