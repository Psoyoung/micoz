// 관리자 카테고리 관리 — A2(조회 C-1) + A3a(변이 C-2 생성 · C-3 수정 · C-4 삭제).
// [A2] 서버 트리(2단계, 페이징 아님) + 로딩/에러/빈상태 + 매퍼(api/admin/categories.ts). 클라 필터 없음(원래도 없었음).
// [A3a] 우측 편집 카드 실 연동(선택된 카테고리 C-3 PATCH) + 삭제(ConfirmDialog, CATEGORY_HAS_CHILDREN 409 처리)
//       + 생성 모달(대분류 parentSeq=null / 하위 parentSeq=선택 level1). 2단계 강제: level2 행엔 "하위 추가" 버튼 미노출
//       (백엔드도 CATEGORY_INVALID_PARENT 400 으로 차단·한글 매핑됨 — 이중 방어).
import { Fragment, useEffect, useState, type CSSProperties } from 'react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type AdminCategoryVM,
} from '../../../api/admin/categories'
import { adminErrorMessage } from '../../../api/admin/errors'
import Card from '../../../components/admin/Card'
import AdminBtn from '../../../components/admin/AdminBtn'
import { AIcon } from '../../../components/admin/icons'
import { AdminLoading, AdminError, AdminEmpty } from '../../../components/admin/AsyncState'
import { FormField } from '../../../components/admin/FormFields'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import { useModalDismiss } from '../../../lib/useModalDismiss'

const pageWrap: CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }
const rowAction2: CSSProperties = { width: 24, height: 24, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ad-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
const fieldStyle: CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)', outline: 'none' }
const errBox: CSSProperties = { marginTop: 12, padding: '10px 12px', background: '#fbece9', border: '1px solid #e6c8c1', fontSize: 12.5, lineHeight: 1.6, color: '#8a3a2c' }

function findCategory(nodes: AdminCategoryVM[], seq: number): AdminCategoryVM | null {
  for (const n of nodes) {
    if (n.categorySeq === seq) return n
    const child = n.children.find((c) => c.categorySeq === seq)
    if (child) return child
  }
  return null
}
function findParentName(nodes: AdminCategoryVM[], seq: number): string | null {
  for (const n of nodes) {
    if (n.children.some((c) => c.categorySeq === seq)) return n.name
  }
  return null
}

// FormFields 의 Toggle 은 비제어(자체 useState) — 실 변이 폼은 값을 부모가 소유해야 하므로 로컬 제어형 토글을 둔다.
function CtrlToggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)' }}>
      <span style={{ width: 36, height: 20, background: on ? '#3a2552' : '#d4cdc0', position: 'relative', transition: 'background .2s', borderRadius: 10 }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, background: '#fff', transition: 'left .2s', borderRadius: '50%' }} />
      </span>
      {label}
    </button>
  )
}

export default function CategoriesView() {
  const [sel, setSel] = useState<number | null>(null)
  const [createParent, setCreateParent] = useState<{ seq: number | null; name?: string } | null>(null)
  const { data, isLoading, isError, error, refetch } = useCategories()

  const selCat = data && sel != null ? findCategory(data, sel) : null
  const selParentName = data && selCat && selCat.level === 2 ? findParentName(data, selCat.categorySeq) : null

  return (
    <div style={pageWrap}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        {/* Tree */}
        <Card title="카테고리 트리" subtitle="2 LEVELS" padding={0} action={<AdminBtn icon={AIcon.plus(13)} size="sm" variant="primary" onClick={() => setCreateParent({ seq: null })}>대분류 추가</AdminBtn>}>
          {isLoading ? (
            <AdminLoading label="카테고리를 불러오는 중…" />
          ) : isError ? (
            <AdminError error={error} onRetry={refetch} />
          ) : !data || data.length === 0 ? (
            <AdminEmpty label="등록된 카테고리가 없습니다" />
          ) : (
            <div style={{ padding: '8px 0' }}>
              {data.map((c, i) => (
                <Fragment key={c.categorySeq}>
                  <CatRow cat={c} sel={sel === c.categorySeq} onSel={() => setSel(c.categorySeq)} idx={i + 1} onAddChild={() => setCreateParent({ seq: c.categorySeq, name: c.name })} />
                  {c.children?.map((cc, j) => (
                    <CatRow key={cc.categorySeq} cat={cc} sel={sel === cc.categorySeq} onSel={() => setSel(cc.categorySeq)} idx={`${i + 1}.${j + 1}`} />
                  ))}
                </Fragment>
              ))}
            </div>
          )}
        </Card>

        {/* Editor */}
        <EditorCard cat={selCat} parentName={selParentName} onDeleted={() => setSel(null)} />
      </div>

      <CategoryFormModal open={createParent != null} parentSeq={createParent?.seq ?? null} parentName={createParent?.name} onClose={() => setCreateParent(null)} />
    </div>
  )
}

function CatRow({ cat, sel, onSel, idx, onAddChild }: { cat: AdminCategoryVM; sel: boolean; onSel: () => void; idx: number | string; onAddChild?: () => void }) {
  const depth = cat.level - 1 // categoryLevel 은 1-based → 0-based depth
  const visible = cat.displayYn === 'Y'
  const active = cat.useYn === 'Y'
  return (
    <div
      onClick={onSel}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 22px', paddingLeft: 22 + depth * 24, borderBottom: '1px solid var(--ad-line-soft)', background: sel ? '#f8f4fb' : 'transparent', borderLeft: `2px solid ${sel ? '#3a2552' : 'transparent'}`, cursor: 'pointer' }}
    >
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ad-muted)', letterSpacing: '0.08em', width: 28 }}>{idx}</span>
      <span style={{ fontSize: 13.5, fontWeight: depth === 0 ? 500 : 400, color: visible ? 'var(--ad-ink)' : 'var(--ad-muted)', flex: 1, textDecoration: visible ? 'none' : 'line-through' }}>{cat.name}</span>
      {depth === 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ad-muted)', letterSpacing: '0.04em' }}>하위 {cat.childCount}</span>}
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ad-muted)', letterSpacing: '0.04em' }}>{cat.productCount}개</span>
      {!visible && <span style={{ fontSize: 10, fontFamily: 'var(--mono)', padding: '2px 6px', background: '#f1eef5', color: '#6b5d72', letterSpacing: '0.1em' }}>HIDDEN</span>}
      {!active && <span style={{ fontSize: 10, fontFamily: 'var(--mono)', padding: '2px 6px', background: '#f5eaea', color: '#a05a5a', letterSpacing: '0.1em' }}>삭제됨</span>}
      {/* 2단계 강제: 대분류(depth 0)만 "하위 추가" 노출. 중분류(depth 1)엔 편집 안내 아이콘만 — 행 클릭으로도 선택 가능. */}
      <button
        style={rowAction2}
        onClick={(e) => {
          e.stopPropagation()
          if (depth === 0 && onAddChild) onAddChild()
          else onSel()
        }}
        title={depth === 0 ? '하위 카테고리 추가' : '편집'}
      >
        {depth === 0 ? AIcon.plus(13) : AIcon.edit(13)}
      </button>
    </div>
  )
}

function EditorCard({ cat, parentName, onDeleted }: { cat: AdminCategoryVM | null; parentName: string | null; onDeleted: () => void }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [displayYn, setDisplayYn] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const update = useUpdateCategory()
  const del = useDeleteCategory()

  // 선택 변경 시 폼을 선택된 카테고리 값으로 초기화.
  useEffect(() => {
    if (cat) {
      setName(cat.name)
      setSlug(cat.slug)
      setSortOrder(String(cat.sortOrder))
      setDisplayYn(cat.displayYn === 'Y')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat?.categorySeq])

  if (!cat) {
    return (
      <Card title="카테고리 편집" subtitle="EDIT" padding={22}>
        <AdminEmpty label="좌측 트리에서 카테고리를 선택하세요" />
      </Card>
    )
  }

  const invalid = !name.trim() || !slug.trim()
  const submit = () => {
    if (invalid) return
    update.mutate({
      categorySeq: cat.categorySeq,
      req: { categoryName: name.trim(), urlSlug: slug.trim(), sortOrder: sortOrder ? Number(sortOrder) : undefined, displayYn: displayYn ? 'Y' : 'N' },
    })
  }
  const resetToOriginal = () => {
    setName(cat.name)
    setSlug(cat.slug)
    setSortOrder(String(cat.sortOrder))
    setDisplayYn(cat.displayYn === 'Y')
    update.reset()
  }

  return (
    <Card title="카테고리 편집" subtitle={`EDIT · ${cat.name}`} padding={22}>
      {/* AdminBtn 은 type 미지정(암묵 submit) — <form> 안에서 "취소"/"삭제" 클릭 시 의도치 않게 같이 제출되는 것을 피하려 form 미사용, 버튼 클릭으로 직접 제출. */}
      <div>
        <FormField label="카테고리명">
          <input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="URL 슬러그">
          <input style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </FormField>
        <FormField label="상위 카테고리" hint="부모/레벨 이동은 지원하지 않습니다.">
          <input style={fieldStyle} value={cat.level === 1 ? '— (대분류)' : (parentName ?? '')} disabled />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="정렬 순서">
            <input style={{ ...fieldStyle, width: 100, fontFamily: 'var(--mono)' }} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} inputMode="numeric" />
          </FormField>
          <FormField label="노출">
            <CtrlToggle on={displayYn} onChange={setDisplayYn} label="쇼핑몰에 공개" />
          </FormField>
        </div>

        {update.isError && <div role="alert" style={errBox}>{adminErrorMessage(update.error)}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--ad-line)', marginTop: 16 }}>
          <AdminBtn variant="danger" icon={AIcon.trash(13)} onClick={() => setConfirmOpen(true)}>삭제</AdminBtn>
          <div style={{ display: 'flex', gap: 8 }}>
            <AdminBtn onClick={resetToOriginal}>취소</AdminBtn>
            <button
              type="button"
              onClick={submit}
              disabled={update.isPending || invalid}
              style={{ padding: '8px 18px', background: '#3a2552', color: '#f5f1ea', border: '1px solid #3a2552', cursor: update.isPending || invalid ? 'default' : 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, letterSpacing: '0.02em', opacity: update.isPending || invalid ? 0.6 : 1 }}
            >
              {update.isPending ? '저장 중…' : '변경 저장'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="카테고리 삭제"
        message={<>‘{cat.name}’ 카테고리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</>}
        confirmLabel="삭제"
        danger
        busy={del.isPending}
        error={del.error}
        onConfirm={() => del.mutate(cat.categorySeq, { onSuccess: () => { setConfirmOpen(false); onDeleted() } })}
        onCancel={() => { del.reset(); setConfirmOpen(false) }}
      />
    </Card>
  )
}

// ─── 카테고리 추가 모달 (C-2) — parentSeq=null 대분류 / parentSeq=선택 level1 중분류. ───
function CategoryFormModal({ open, parentSeq, parentName, onClose }: { open: boolean; parentSeq: number | null; parentName?: string; onClose: () => void }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [displayYn, setDisplayYn] = useState(true)
  const create = useCreateCategory()

  const resetForm = () => { setName(''); setSlug(''); setSortOrder(''); setDisplayYn(true) }
  const handleClose = () => { resetForm(); create.reset(); onClose() }

  useModalDismiss(handleClose, open)
  if (!open) return null

  const invalid = !name.trim() || !slug.trim()
  const submit = () => {
    if (invalid) return
    create.mutate(
      { parentSeq, categoryName: name.trim(), urlSlug: slug.trim(), sortOrder: sortOrder ? Number(sortOrder) : undefined, displayYn: displayYn ? 'Y' : 'N' },
      { onSuccess: () => { resetForm(); onClose() } },
    )
  }

  return (
    <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }}>
      {/* AdminBtn 은 type 미지정(암묵 submit) — <form> 미사용, "추가" 버튼 클릭으로 직접 제출(취소 버튼과의 의도치 않은 동시 제출 방지). */}
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: 'min(480px, 100%)', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 26px', borderBottom: '1px solid var(--ad-line)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.18em', marginBottom: 4 }}>{parentSeq == null ? 'NEW CATEGORY' : 'NEW SUBCATEGORY'}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, color: 'var(--ad-ink)' }}>{parentSeq == null ? '대분류 추가' : `‘${parentName ?? ''}’ 하위 추가`}</div>
          </div>
          <button type="button" onClick={handleClose} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--ad-line-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ad-ink)', flexShrink: 0 }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div style={{ padding: 26 }}>
          <FormField label="카테고리명">
            <input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 토너" required autoFocus />
          </FormField>
          <FormField label="URL 슬러그">
            <input style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="toner" required />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="정렬 순서">
              <input style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} inputMode="numeric" placeholder="선택" />
            </FormField>
            <FormField label="노출">
              <CtrlToggle on={displayYn} onChange={setDisplayYn} label="쇼핑몰에 공개" />
            </FormField>
          </div>
          {create.isError && <div role="alert" style={errBox}>{adminErrorMessage(create.error)}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 26px', borderTop: '1px solid var(--ad-line)', background: 'var(--ad-paper-2)' }}>
          <AdminBtn onClick={handleClose}>취소</AdminBtn>
          <button
            type="button"
            onClick={submit}
            disabled={create.isPending || invalid}
            style={{ padding: '8px 18px', background: '#3a2552', color: '#f5f1ea', border: '1px solid #3a2552', cursor: create.isPending || invalid ? 'default' : 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, letterSpacing: '0.02em', opacity: create.isPending || invalid ? 0.6 : 1 }}
          >
            {create.isPending ? '추가 중…' : '추가'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 폼 헬퍼(FormField)는 components/admin/FormFields 승격됨(배송 설정에서도 사용). Input/Select/Toggle 은 비제어라
// 이 화면의 실 변이 폼에는 쓰지 않고 로컬 controlled input/CtrlToggle 을 사용한다.
