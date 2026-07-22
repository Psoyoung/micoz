// 관리자 상품관리 — A2: mock ADMIN_PRODUCTS/CATEGORY_TREE → 실 API(C-5 목록 · C-6 상세).
// [A2] 서버 위임 페이징·검색·필터(상태·카테고리·전시여부) + 로딩/에러/빈상태 + 매퍼(api/admin/products.ts). 클라 필터/정렬 제거.
// 매퍼 갭(보고): line(브랜드라인, presentational) → C-5 에 없음, 단순표시라 제거.
//   sales30(30일 판매량, 집계) → C-5 에 없음, 집계 성격이라 백엔드 빚으로 남기고 컬럼 제거.
//   updatedDate → C-5 엔 createdDate 만 제공 → '등록일' 컬럼으로 표기.
//   '상품 표시'(badges) 열 → C-5 목록 DTO에 라벨 없음(라벨은 C-6 상세에만 존재) → 목록 컬럼 제거, 상세 모달에서 표시.
//   원본의 1차/2차 카테고리 계단식·배지·등록일 범위 필터 → C-5 파라미터에 없음(categorySeq 단일값만 지원) → 제거.
import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useUpdateProductStatus,
  useUpdateOptionStock,
  useDeleteProduct,
  type AdminProductRow,
  type AdminProductDetail,
  type AdminProductOptionRow,
  type CreateProductRequest,
  type UpdateProductRequest,
  type ProductOptionInput,
  type ProductImageInput,
} from '../../../api/admin/products'
import { ADMIN_PRODUCT_STATUS_LABEL } from '../../../api/admin/labels'
import { useCategoryOptions } from '../../../api/admin/categories'
import { won } from '../../../api/admin/format'
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
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import { useModalDismiss } from '../../../lib/useModalDismiss'

const pageWrap: CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }
const PAGE_SIZE = 20

const filterLabel: CSSProperties = { display: 'block', fontSize: 10.5, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginBottom: 6, textTransform: 'uppercase' }

const STATUS_OPTS = [{ k: 'all', l: '전체 상태' }, ...Object.entries(ADMIN_PRODUCT_STATUS_LABEL).map(([k, l]) => ({ k, l }))]
const DISPLAY_OPTS = [
  { k: 'all', l: '전체 전시여부' },
  { k: 'Y', l: '전시' },
  { k: 'N', l: '미전시' },
]

// 검색어 디바운스(서버 요청 절약) — 타이핑 멈춘 뒤 400ms.
function useDebounced<T>(value: T, delay = 400): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export default function ProductsView() {
  const [status, setStatus] = useState('all')
  const [categorySeq, setCategorySeq] = useState('all')
  const [displayYn, setDisplayYn] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1) // 1-based UI
  const [addOpen, setAddOpen] = useState(false)
  const [detailSeq, setDetailSeq] = useState<number | null>(null)

  const catOptions = useCategoryOptions()
  const q = useDebounced(searchInput.trim())

  // 필터/검색 변경 시 1페이지로.
  useEffect(() => { setPage(1) }, [status, categorySeq, displayYn, q])

  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({
    q: q || undefined,
    status: status !== 'all' ? status : undefined,
    categorySeq: categorySeq !== 'all' ? Number(categorySeq) : undefined,
    displayYn: displayYn !== 'all' ? displayYn : undefined,
    page: page - 1, // 0-based
    size: PAGE_SIZE,
    sort: 'productSeq,desc',
  })

  const reset = () => {
    setStatus('all')
    setCategorySeq('all')
    setDisplayYn('all')
    setSearchInput('')
  }

  const columns: Column<AdminProductRow>[] = [
    { key: 'productCode', label: '상품코드', mono: true, nowrap: true, render: (v) => <span style={{ color: '#3a2552' }}>{v as string}</span> },
    { key: 'productName', label: '상품명', render: (v) => <span style={{ fontWeight: 500, fontSize: 13 }}>{v as string}</span> },
    { key: 'categoryName', label: '카테고리', muted: true, render: (v) => (v as string) || '-' },
    { key: 'basePrice', label: '판매가', align: 'right', mono: true, render: (v) => won(v as number) },
    {
      key: 'totalStock',
      label: '재고',
      align: 'right',
      mono: true,
      render: (v) => {
        const n = v as number
        return <span style={{ color: n === 0 ? '#c14d4d' : n < 80 ? '#c08a3a' : 'var(--ad-ink)', fontWeight: n < 80 ? 500 : 400 }}>{n.toLocaleString()}개</span>
      },
    },
    { key: 'displayYn', label: '전시', render: (v) => <span style={{ color: v === 'Y' ? 'var(--ad-ink)' : 'var(--ad-muted)' }}>{v === 'Y' ? '전시' : '미전시'}</span> },
    { key: 'statusLabel', label: '상태', render: (v) => <StatusChip status={v as string} /> },
    { key: 'createdDate', label: '등록일', mono: true, muted: true, nowrap: true },
  ]

  return (
    <div style={pageWrap}>
      {/* 검색 카드 */}
      <Card title="상품 검색" subtitle="SEARCH · FILTER" padding={20}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={filterLabel}>검색어 (상품명 · 상품코드)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fff', border: '1px solid var(--ad-line-strong)', height: 34 }}>
              <span style={{ color: 'var(--ad-muted)', display: 'flex' }}>{AIcon.search(14)}</span>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="상품명 또는 상품코드를 입력하세요"
                style={{ border: 'none', outline: 'none', flex: 1, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ad-ink)', minWidth: 0 }}
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ad-muted)', display: 'flex', padding: 0 }} title="검색어 지우기">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div>
            <div style={filterLabel}>판매 상태</div>
            <AdminDropdown value={status} onChange={setStatus} options={STATUS_OPTS} width="100%" />
          </div>
          <div>
            <div style={filterLabel}>카테고리</div>
            <AdminDropdown value={categorySeq} onChange={setCategorySeq} options={catOptions} width="100%" />
          </div>
          <div>
            <div style={filterLabel}>전시여부</div>
            <AdminDropdown value={displayYn} onChange={setDisplayYn} options={DISPLAY_OPTS} width="100%" />
          </div>
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--ad-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ad-muted)', letterSpacing: '0.04em' }}>
            {data ? `검색 결과 ${data.totalElements.toLocaleString()}건` : '검색 결과 —'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <AdminBtn onClick={reset}>초기화</AdminBtn>
          </div>
        </div>
      </Card>

      {/* 결과 테이블 */}
      <Card padding={0}>
        <FilterBar
          action={
            <>
              <AdminBtn icon={AIcon.download(13)} size="sm">CSV</AdminBtn>
              <AdminBtn icon={AIcon.plus(13)} size="sm" variant="primary" onClick={() => setAddOpen(true)}>상품 등록</AdminBtn>
            </>
          }
        >
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ad-ink)', fontWeight: 500 }}>상품 목록</div>
        </FilterBar>

        {isLoading ? (
          <AdminLoading label="상품 목록을 불러오는 중…" />
        ) : isError ? (
          <AdminError error={error} onRetry={refetch} />
        ) : !data || data.rows.length === 0 ? (
          <AdminEmpty label="조건에 맞는 상품이 없습니다" />
        ) : (
          <>
            <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
              <DataTable columns={columns} rows={data.rows} rowKey="productSeq" onRowClick={(r) => setDetailSeq(r.productSeq)} />
            </div>
            <Pagination page={page} total={data.totalElements} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Card>

      <ProductDetailModal productSeq={detailSeq} onClose={() => setDetailSeq(null)} />
      {addOpen && <ProductCreateModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}

// ─── 공용 모달 스타일/프리미티브 ───
const overlayStyle: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }
const closeBtnStyle: CSSProperties = { width: 32, height: 32, background: 'transparent', border: '1px solid var(--ad-line-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--ad-ink)' }
const fieldStyle: CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)', outline: 'none', boxSizing: 'border-box' }
const monoField: CSSProperties = { ...fieldStyle, fontFamily: 'var(--mono)' }
const textareaStyle: CSSProperties = { ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }
const labelStyle: CSSProperties = { display: 'block', fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginBottom: 6, textTransform: 'uppercase' }
const sectionLabel: CSSProperties = { fontSize: 10, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', textTransform: 'uppercase' }
const rowHeadStyle: CSSProperties = { fontSize: 9.5, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }
const emptyHint: CSSProperties = { fontSize: 12, color: 'var(--ad-muted)', lineHeight: 1.6 }
const cellInput: CSSProperties = { width: '100%', padding: '7px 9px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ad-ink)', outline: 'none', boxSizing: 'border-box' }
const cellMono: CSSProperties = { ...cellInput, fontFamily: 'var(--mono)' }
const rowDelBtn: CSSProperties = { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid var(--ad-line-strong)', color: '#8a3a2c', cursor: 'pointer', fontSize: 12 }
const primaryBtn = (busy: boolean): CSSProperties => ({ padding: '8px 18px', background: '#3a2552', color: '#f5f1ea', border: '1px solid #3a2552', cursor: busy ? 'default' : 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, letterSpacing: '0.02em', opacity: busy ? 0.6 : 1 })
const dangerGhostBtn: CSSProperties = { padding: '8px 18px', background: '#fff', color: '#8a3a2c', border: '1px solid #e6c8c1', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5 }
const statusBtn = (active: boolean): CSSProperties => ({ padding: '8px 14px', background: active ? '#3a2552' : '#fff', color: active ? '#f5f1ea' : 'var(--ad-ink)', border: `1px solid ${active ? '#3a2552' : 'var(--ad-line-strong)'}`, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12 })

const STATUS_ENTRIES = Object.entries(ADMIN_PRODUCT_STATUS_LABEL)
const DISPLAY_ENTRIES: [string, string][] = [['Y', '전시'], ['N', '미전시']]

function ModalHeader({ eyebrow, title, onClose }: { eyebrow: string; title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 26px', borderBottom: '1px solid var(--ad-line)' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.18em', marginBottom: 4 }}>{eyebrow}</div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500 }}>{title}</div>
      </div>
      <button type="button" onClick={onClose} style={closeBtnStyle} title="닫기 (Esc)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  )
}

function ModalFooter({ error, children }: { error?: string | null; children: ReactNode }) {
  return (
    <div style={{ borderTop: '1px solid var(--ad-line)', background: 'var(--ad-paper-2)' }}>
      {error && (
        <div role="alert" style={{ margin: '12px 26px 0', padding: '10px 12px', background: '#fbece9', border: '1px solid #e6c8c1', fontSize: 12.5, lineHeight: 1.6, color: '#8a3a2c' }}>{error}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 26px' }}>{children}</div>
    </div>
  )
}

// ─── 상품 폼 상태 훅 (C-7 생성 · C-8 수정 공용) ───
// initial 있으면 C-6 상세를 폼 초기값으로 로드(수정). 옵션/이미지 seq 보존(기존행) vs null(신규행).
type OptRow = { key: string; optionSeq: number | null; optionName: string; finalPrice: string; stockQty: string; sortOrder: string }
type ImgRow = { key: string; imageSeq: number | null; imageType: string; imageUrl: string; imageAlt: string; sortOrder: string }

let __rowSeq = 0
const nextKey = () => `row-${++__rowSeq}`
const emptyOpt = (): OptRow => ({ key: nextKey(), optionSeq: null, optionName: '', finalPrice: '', stockQty: '', sortOrder: '' })
const emptyImg = (): ImgRow => ({ key: nextKey(), imageSeq: null, imageType: 'MAIN', imageUrl: '', imageAlt: '', sortOrder: '' })

function useProductFormState(initial?: AdminProductDetail) {
  const [productCode, setProductCode] = useState(initial?.productCode ?? '')
  const [productName, setProductName] = useState(initial?.productName ?? '')
  const [categorySeq, setCategorySeq] = useState(initial?.categorySeq != null ? String(initial.categorySeq) : 'all')
  const [basePrice, setBasePrice] = useState(initial ? String(initial.basePrice) : '')
  const [productStatus, setProductStatus] = useState(initial?.productStatus ?? 'ON_SALE')
  const [displayYn, setDisplayYn] = useState(initial?.displayYn ?? 'Y')
  const [shortDesc, setShortDesc] = useState(initial?.shortDesc ?? '')
  const [detailDesc, setDetailDesc] = useState(initial?.detailDesc ?? '')
  const [ingredientInfo, setIngredientInfo] = useState(initial?.ingredientInfo ?? '')
  const [usageInfo, setUsageInfo] = useState(initial?.usageInfo ?? '')
  const [optRows, setOptRows] = useState<OptRow[]>(() =>
    initial ? initial.options.map((o) => ({ key: nextKey(), optionSeq: o.optionSeq, optionName: o.optionName, finalPrice: String(o.finalPrice), stockQty: String(o.stockQty), sortOrder: String(o.sortOrder) })) : [],
  )
  const [imgRows, setImgRows] = useState<ImgRow[]>(() =>
    initial ? initial.images.map((im) => ({ key: nextKey(), imageSeq: im.imageSeq, imageType: im.imageType, imageUrl: im.imageUrl, imageAlt: im.imageAlt, sortOrder: String(im.sortOrder) })) : [],
  )
  // 라벨: admin_api.md 에 라벨 목록 조회 API 없음(백엔드 빚) → 수정은 기존 labelSeq 유지, 생성은 빈 배열.
  const labelSeqs = initial ? initial.labels.map((l) => l.labelSeq) : []
  const labelNames = initial ? initial.labels.map((l) => l.labelName) : []

  const addOpt = () => setOptRows((r) => [...r, emptyOpt()])
  const removeOpt = (key: string) => setOptRows((r) => r.filter((x) => x.key !== key))
  const setOpt = (key: string, patch: Partial<OptRow>) => setOptRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)))
  const addImg = () => setImgRows((r) => [...r, emptyImg()])
  const removeImg = (key: string) => setImgRows((r) => r.filter((x) => x.key !== key))
  const setImg = (key: string, patch: Partial<ImgRow>) => setImgRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)))

  const validate = (): string | null => {
    if (!productCode.trim()) return '상품코드를 입력해주세요.'
    if (!productName.trim()) return '상품명을 입력해주세요.'
    const bp = Number(basePrice)
    if (basePrice.trim() === '' || !Number.isFinite(bp) || bp < 0) return '판매가는 0 이상의 숫자여야 합니다.'
    for (const o of optRows) {
      if (!o.optionName.trim()) return '옵션명을 모두 입력해주세요.'
      const fp = Number(o.finalPrice)
      if (o.finalPrice.trim() === '' || !Number.isFinite(fp) || fp < 0) return '옵션 판매가는 0 이상의 숫자여야 합니다.'
      if (o.stockQty.trim() !== '' && (!Number.isFinite(Number(o.stockQty)) || Number(o.stockQty) < 0)) return '옵션 재고는 0 이상이어야 합니다.'
    }
    for (const im of imgRows) {
      if (!im.imageUrl.trim()) return '이미지 URL을 모두 입력해주세요.'
    }
    return null
  }

  const buildOptions = (withSeq: boolean): ProductOptionInput[] =>
    optRows.map((o, i) => {
      const base: ProductOptionInput = { optionName: o.optionName.trim(), finalPrice: Number(o.finalPrice), sortOrder: o.sortOrder.trim() !== '' ? Number(o.sortOrder) : i + 1 }
      if (o.stockQty.trim() !== '') base.stockQty = Number(o.stockQty)
      if (withSeq) base.optionSeq = o.optionSeq // null=신규, 값=기존수정
      return base
    })
  const buildImages = (withSeq: boolean): ProductImageInput[] =>
    imgRows.map((im, i) => {
      const base: ProductImageInput = { imageType: im.imageType, imageUrl: im.imageUrl.trim(), sortOrder: im.sortOrder.trim() !== '' ? Number(im.sortOrder) : i + 1 }
      if (im.imageAlt.trim()) base.imageAlt = im.imageAlt.trim()
      if (withSeq) base.imageSeq = im.imageSeq
      return base
    })

  const buildCreate = (): CreateProductRequest => ({
    productCode: productCode.trim(),
    productName: productName.trim(),
    categorySeq: categorySeq !== 'all' ? Number(categorySeq) : null,
    basePrice: Number(basePrice),
    productStatus,
    displayYn,
    shortDesc: shortDesc.trim() || undefined,
    detailDesc: detailDesc.trim() || undefined,
    ingredientInfo: ingredientInfo.trim() || undefined,
    usageInfo: usageInfo.trim() || undefined,
    options: buildOptions(false),
    images: buildImages(false),
    labelSeqs: [],
  })
  const buildUpdate = (): UpdateProductRequest => ({
    productCode: productCode.trim(),
    productName: productName.trim(),
    categorySeq: categorySeq !== 'all' ? Number(categorySeq) : null,
    basePrice: Number(basePrice),
    productStatus,
    displayYn,
    shortDesc: shortDesc.trim() || undefined,
    detailDesc: detailDesc.trim() || undefined,
    ingredientInfo: ingredientInfo.trim() || undefined,
    usageInfo: usageInfo.trim() || undefined,
    options: buildOptions(true),
    images: buildImages(true),
    labelSeqs, // 기존 라벨 유지(목록 API 부재)
  })

  return {
    productCode, setProductCode, productName, setProductName, categorySeq, setCategorySeq,
    basePrice, setBasePrice, productStatus, setProductStatus, displayYn, setDisplayYn,
    shortDesc, setShortDesc, detailDesc, setDetailDesc, ingredientInfo, setIngredientInfo, usageInfo, setUsageInfo,
    optRows, addOpt, removeOpt, setOpt, imgRows, addImg, removeImg, setImg,
    labelSeqs, labelNames, validate, buildCreate, buildUpdate,
  }
}

type ProductFormState = ReturnType<typeof useProductFormState>

// ─── 상품 폼 필드 (생성/수정 공용 프레젠테이션) ───
function ProductFields({ f, catOptions, disabled, showLabels }: { f: ProductFormState; catOptions: { k: string; l: string }[]; disabled?: boolean; showLabels?: boolean }) {
  // useCategoryOptions 의 'all'(=전체 카테고리)은 폼에서 '선택 안 함'(카테고리 없음)을 의미.
  const formCatOptions = [{ k: 'all', l: '선택 안 함' }, ...catOptions.filter((o) => o.k !== 'all')]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 18px' }}>
        <div>
          <div style={labelStyle}>상품코드 <span style={{ color: '#a05a5a' }}>*</span></div>
          <input style={monoField} placeholder="MZ-001" value={f.productCode} onChange={(e) => f.setProductCode(e.target.value.toUpperCase())} disabled={disabled} />
        </div>
        <div>
          <div style={labelStyle}>상품명 <span style={{ color: '#a05a5a' }}>*</span></div>
          <input style={fieldStyle} placeholder="수분 토너" value={f.productName} onChange={(e) => f.setProductName(e.target.value)} disabled={disabled} />
        </div>
        <div>
          <div style={labelStyle}>카테고리</div>
          <AdminDropdown value={f.categorySeq} onChange={f.setCategorySeq} options={formCatOptions} width="100%" />
        </div>
        <div>
          <div style={labelStyle}>판매가 (₩) <span style={{ color: '#a05a5a' }}>*</span></div>
          <input type="number" min="0" step="1000" style={monoField} placeholder="25000" value={f.basePrice} onChange={(e) => f.setBasePrice(e.target.value)} disabled={disabled} />
        </div>
        <div>
          <div style={labelStyle}>판매 상태</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_ENTRIES.map(([k, l]) => (
              <button key={k} type="button" onClick={() => f.setProductStatus(k)} disabled={disabled} style={statusBtn(f.productStatus === k)}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={labelStyle}>전시여부</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {DISPLAY_ENTRIES.map(([k, l]) => (
              <button key={k} type="button" onClick={() => f.setDisplayYn(k)} disabled={disabled} style={statusBtn(f.displayYn === k)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={labelStyle}>짧은 설명</div>
          <input style={fieldStyle} value={f.shortDesc} onChange={(e) => f.setShortDesc(e.target.value)} disabled={disabled} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={labelStyle}>상세 설명</div>
          <textarea style={textareaStyle} rows={3} value={f.detailDesc} onChange={(e) => f.setDetailDesc(e.target.value)} disabled={disabled} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={labelStyle}>성분</div>
          <textarea style={textareaStyle} rows={2} value={f.ingredientInfo} onChange={(e) => f.setIngredientInfo(e.target.value)} disabled={disabled} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={labelStyle}>사용법</div>
          <textarea style={textareaStyle} rows={2} value={f.usageInfo} onChange={(e) => f.setUsageInfo(e.target.value)} disabled={disabled} />
        </div>
      </div>

      {/* 옵션 다중행 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={sectionLabel}>옵션 ({f.optRows.length})</div>
          <AdminBtn size="sm" icon={AIcon.plus(12)} onClick={f.addOpt}>옵션 추가</AdminBtn>
        </div>
        {f.optRows.length === 0 ? (
          <div style={emptyHint}>옵션이 없습니다. 단일 상품이면 비워둬도 됩니다.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 32px', gap: 8, ...rowHeadStyle }}>
              <span>옵션명 *</span><span>판매가 *</span><span>재고</span><span>정렬</span><span />
            </div>
            {f.optRows.map((o) => (
              <div key={o.key} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 32px', gap: 8, alignItems: 'center' }}>
                <input style={cellInput} placeholder="150ml" value={o.optionName} onChange={(e) => f.setOpt(o.key, { optionName: e.target.value })} disabled={disabled} />
                <input type="number" min="0" style={cellMono} placeholder="25000" value={o.finalPrice} onChange={(e) => f.setOpt(o.key, { finalPrice: e.target.value })} disabled={disabled} />
                <input type="number" min="0" style={cellMono} placeholder="0" value={o.stockQty} onChange={(e) => f.setOpt(o.key, { stockQty: e.target.value })} disabled={disabled} />
                <input type="number" min="0" style={cellMono} placeholder="1" value={o.sortOrder} onChange={(e) => f.setOpt(o.key, { sortOrder: e.target.value })} disabled={disabled} />
                <button type="button" onClick={() => f.removeOpt(o.key)} disabled={disabled} style={rowDelBtn} title="옵션 삭제">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 이미지 다중행 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={sectionLabel}>이미지 ({f.imgRows.length})</div>
          <AdminBtn size="sm" icon={AIcon.plus(12)} onClick={f.addImg}>이미지 추가</AdminBtn>
        </div>
        {f.imgRows.length === 0 ? (
          <div style={emptyHint}>이미지가 없습니다.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 2.4fr 1.4fr 0.7fr 32px', gap: 8, ...rowHeadStyle }}>
              <span>유형 *</span><span>URL *</span><span>ALT</span><span>정렬</span><span />
            </div>
            {f.imgRows.map((im) => (
              <div key={im.key} style={{ display: 'grid', gridTemplateColumns: '0.9fr 2.4fr 1.4fr 0.7fr 32px', gap: 8, alignItems: 'center' }}>
                <select style={cellInput} value={im.imageType} onChange={(e) => f.setImg(im.key, { imageType: e.target.value })} disabled={disabled}>
                  <option value="MAIN">MAIN</option>
                  <option value="SUB">SUB</option>
                  <option value="DETAIL">DETAIL</option>
                </select>
                <input style={cellMono} placeholder="https://…" value={im.imageUrl} onChange={(e) => f.setImg(im.key, { imageUrl: e.target.value })} disabled={disabled} />
                <input style={cellInput} placeholder="대체 텍스트" value={im.imageAlt} onChange={(e) => f.setImg(im.key, { imageAlt: e.target.value })} disabled={disabled} />
                <input type="number" min="0" style={cellMono} placeholder="1" value={im.sortOrder} onChange={(e) => f.setImg(im.key, { sortOrder: e.target.value })} disabled={disabled} />
                <button type="button" onClick={() => f.removeImg(im.key)} disabled={disabled} style={rowDelBtn} title="이미지 삭제">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 라벨 — 목록 조회 API 부재(백엔드 빚). 수정은 기존 유지, 생성은 없음. */}
      {showLabels && (
        <div>
          <div style={sectionLabel}>라벨</div>
          {f.labelNames.length === 0 ? (
            <div style={{ ...emptyHint, marginTop: 4 }}>연결된 라벨이 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {f.labelNames.map((n, i) => (
                <span key={i} style={{ padding: '3px 10px', background: '#3a2552', color: '#f5edf7', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>{n}</span>
              ))}
            </div>
          )}
          <div style={{ ...emptyHint, marginTop: 6 }}>* 라벨 목록 조회 API가 없어 기존 라벨만 유지됩니다(추가·변경 불가).</div>
        </div>
      )}
    </div>
  )
}

// ─── 상품 등록 모달 (C-7) — 단일 트랜잭션 생성 ───
function ProductCreateModal({ onClose }: { onClose: () => void }) {
  const catOptions = useCategoryOptions()
  const f = useProductFormState()
  const create = useCreateProduct()
  const [clientErr, setClientErr] = useState<string | null>(null)
  useModalDismiss(() => { if (!create.isPending) onClose() }, true)

  const shownErr = clientErr ?? (create.isError ? adminErrorMessage(create.error) : null)

  return (
    <div onClick={() => !create.isPending && onClose()} style={overlayStyle}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          const v = f.validate()
          if (v) { setClientErr(v); return }
          setClientErr(null)
          create.mutate(f.buildCreate(), { onSuccess: () => onClose() })
        }}
        style={{ background: '#fff', width: 'min(760px, 100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line-strong)' }}
      >
        <ModalHeader eyebrow="NEW PRODUCT" title="상품 등록" onClose={() => !create.isPending && onClose()} />
        <div style={{ padding: 26, overflowY: 'auto', flex: 1 }}>
          <ProductFields f={f} catOptions={catOptions} disabled={create.isPending} />
        </div>
        <ModalFooter error={shownErr}>
          <AdminBtn onClick={() => !create.isPending && onClose()}>취소</AdminBtn>
          <button type="submit" disabled={create.isPending} style={primaryBtn(create.isPending)}>{create.isPending ? '저장 중…' : '상품 등록'}</button>
        </ModalFooter>
      </form>
    </div>
  )
}

// ─── 상품 수정 폼 (C-8) — 상세 모달 내부. 전체 교체·단일 트랜잭션 ───
function ProductEditForm({ productSeq, initial, onCancel }: { productSeq: number; initial: AdminProductDetail; onCancel: () => void }) {
  const catOptions = useCategoryOptions()
  const f = useProductFormState(initial)
  const upd = useUpdateProduct(productSeq)
  const [clientErr, setClientErr] = useState<string | null>(null)

  const submit = () => {
    const v = f.validate()
    if (v) { setClientErr(v); return }
    setClientErr(null)
    upd.mutate(f.buildUpdate(), { onSuccess: () => onCancel() })
  }
  const shownErr = clientErr ?? (upd.isError ? adminErrorMessage(upd.error) : null)

  return (
    <>
      <div style={{ padding: 26, overflowY: 'auto', flex: 1 }}>
        <div style={{ ...emptyHint, marginBottom: 16, padding: '10px 12px', background: 'var(--ad-paper-2)', border: '1px solid var(--ad-line)' }}>
          수정은 단일 트랜잭션입니다. 옵션·이미지·라벨을 포함해 전체가 함께 저장되며, 하나라도 실패하면 아무것도 반영되지 않습니다. 요청에서 빠진 기존 옵션·이미지는 삭제 처리됩니다.
        </div>
        <ProductFields f={f} catOptions={catOptions} disabled={upd.isPending} showLabels />
      </div>
      <ModalFooter error={shownErr}>
        <AdminBtn onClick={() => !upd.isPending && onCancel()}>취소</AdminBtn>
        <button type="button" onClick={submit} disabled={upd.isPending} style={primaryBtn(upd.isPending)}>{upd.isPending ? '저장 중…' : '변경 저장'}</button>
      </ModalFooter>
    </>
  )
}

// ─── 판매상태 변경 컨트롤 (C-9) — 상세 뷰 인라인 ───
function ProductStatusControl({ productSeq, current }: { productSeq: number; current: string }) {
  const [status, setStatus] = useState(current)
  const m = useUpdateProductStatus(productSeq)
  useEffect(() => { setStatus(current) }, [current])
  const changed = status !== current
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ ...sectionLabel, marginBottom: 8 }}>판매 상태 변경</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_ENTRIES.map(([k, l]) => (
            <button key={k} type="button" disabled={m.isPending} onClick={() => setStatus(k)} style={statusBtn(status === k)}>{l}</button>
          ))}
        </div>
        <button type="button" disabled={!changed || m.isPending} onClick={() => m.mutate({ status })} style={primaryBtn(m.isPending || !changed)}>{m.isPending ? '변경 중…' : '변경'}</button>
      </div>
      {m.isError && <div role="alert" style={{ marginTop: 8, fontSize: 12, color: '#8a3a2c' }}>{adminErrorMessage(m.error)}</div>}
    </div>
  )
}

// ─── 옵션별 재고 설정 (C-10) — 절대값 ───
function OptionStockEditor({ productSeq, option }: { productSeq: number; option: AdminProductOptionRow }) {
  const [qty, setQty] = useState(String(option.stockQty))
  const m = useUpdateOptionStock(productSeq)
  useEffect(() => { setQty(String(option.stockQty)) }, [option.stockQty])
  const n = Number(qty)
  const valid = qty.trim() !== '' && Number.isFinite(n) && n >= 0
  const changed = valid && n !== option.stockQty
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
      <input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} disabled={m.isPending} style={{ ...cellMono, width: 74, textAlign: 'right' }} />
      <button type="button" disabled={!changed || m.isPending} onClick={() => m.mutate({ optionSeq: option.optionSeq, stockQty: n })} style={{ padding: '5px 10px', background: changed && !m.isPending ? '#3a2552' : '#efeaf2', color: changed && !m.isPending ? '#f5f1ea' : 'var(--ad-muted)', border: '1px solid var(--ad-line-strong)', cursor: changed && !m.isPending ? 'pointer' : 'default', fontFamily: 'var(--sans)', fontSize: 11.5 }}>{m.isPending ? '…' : '설정'}</button>
      {m.isError && <span title={adminErrorMessage(m.error)} style={{ color: '#8a3a2c', fontSize: 13 }}>⚠</span>}
    </span>
  )
}

// ─── 상품 상세 모달 (C-6 조회 + C-8 수정 + C-9 상태 + C-10 재고 + C-11 삭제) ───
function ProductDetailModal({ productSeq, onClose }: { productSeq: number | null; onClose: () => void }) {
  const { data, isLoading, isError, error, refetch } = useProduct(productSeq)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [confirmDel, setConfirmDel] = useState(false)
  const del = useDeleteProduct()
  useEffect(() => { setMode('view'); setConfirmDel(false) }, [productSeq])
  useModalDismiss(() => { if (!del.isPending) onClose() }, productSeq != null && !confirmDel)
  if (productSeq == null) return null

  const editing = mode === 'edit' && !!data

  return (
    <>
      <div onClick={() => !del.isPending && onClose()} style={overlayStyle}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: 'min(860px, 100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line-strong)' }}>
          <ModalHeader
            eyebrow={editing ? 'EDIT PRODUCT' : 'PRODUCT DETAIL'}
            title={data ? `${data.productName} (${data.productCode})` : editing ? '상품 수정' : '상품 상세'}
            onClose={() => !del.isPending && onClose()}
          />

          {editing && data ? (
            <ProductEditForm productSeq={productSeq} initial={data} onCancel={() => setMode('view')} />
          ) : (
            <>
              <div style={{ padding: 26, overflowY: 'auto', flex: 1 }}>
                {isLoading ? (
                  <AdminLoading label="상품 정보를 불러오는 중…" />
                ) : isError ? (
                  <AdminError error={error} onRetry={refetch} />
                ) : data ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, fontSize: 12, marginBottom: 22 }}>
                      <KVCol label="카테고리" value={data.categoryName || '-'} />
                      <KVCol label="상태" value={data.statusLabel} />
                      <KVCol label="전시여부" value={data.displayYn === 'Y' ? '전시' : '미전시'} />
                      <KVCol label="판매가" value={won(data.basePrice)} mono />
                      <KVCol label="등록일시" value={data.createdDate} mono />
                      <KVCol label="최종수정일시" value={data.lastModifiedDate || '-'} mono />
                    </div>

                    <ProductStatusControl productSeq={productSeq} current={data.productStatus} />

                    {data.labels.length > 0 && (
                      <div style={{ marginBottom: 22 }}>
                        <div style={{ ...sectionLabel, marginBottom: 8 }}>라벨</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {data.labels.map((l) => (
                            <span key={l.labelSeq} style={{ padding: '3px 10px', background: '#3a2552', color: '#f5edf7', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>{l.labelName}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(data.shortDesc || data.detailDesc || data.ingredientInfo || data.usageInfo) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
                        {data.shortDesc && <KVCol label="짧은 설명" value={data.shortDesc} />}
                        {data.detailDesc && <KVCol label="상세 설명" value={data.detailDesc} />}
                        {data.ingredientInfo && <KVCol label="성분" value={data.ingredientInfo} />}
                        {data.usageInfo && <KVCol label="사용법" value={data.usageInfo} />}
                      </div>
                    )}

                    <div style={{ marginBottom: 22 }}>
                      <div style={{ ...sectionLabel, marginBottom: 8 }}>옵션 ({data.options.length}) · 재고 설정</div>
                      {data.options.length === 0 ? (
                        <div style={emptyHint}>등록된 옵션이 없습니다.</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: 'var(--ad-paper-2)', borderBottom: '1px solid var(--ad-line)' }}>
                              {['옵션명', '판매가', '재고', '정렬', '사용', '재고 설정'].map((h) => (
                                <th key={h} style={{ padding: '8px 10px', textAlign: h === '옵션명' ? 'left' : 'right', fontWeight: 500, fontSize: 10.5, letterSpacing: '0.1em', color: 'var(--ad-muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.options.map((o) => (
                              <tr key={o.optionSeq} style={{ borderBottom: '1px solid var(--ad-line-soft)' }}>
                                <td style={{ padding: '8px 10px' }}>{o.optionName}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{won(o.finalPrice)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{o.stockQty.toLocaleString()}개</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{o.sortOrder}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: o.useYn === 'Y' ? 'var(--ad-ink)' : 'var(--ad-muted)' }}>{o.useYn === 'Y' ? 'Y' : 'N'}</td>
                                <td style={{ padding: '6px 10px', textAlign: 'right' }}><OptionStockEditor productSeq={productSeq} option={o} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div>
                      <div style={{ ...sectionLabel, marginBottom: 8 }}>이미지 ({data.images.length})</div>
                      {data.images.length === 0 ? (
                        <div style={emptyHint}>등록된 이미지가 없습니다.</div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {data.images.map((im) => (
                            <div key={im.imageSeq} style={{ position: 'relative', width: 96, height: 120, border: '1px solid var(--ad-line-strong)' }}>
                              <img src={im.imageUrl} alt={im.imageAlt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, background: 'rgba(15,10,28,0.78)', color: '#f5f1ea', padding: '2px 6px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.04em' }}>{im.imageType}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {data && (
                <ModalFooter>
                  <button type="button" onClick={() => setConfirmDel(true)} style={dangerGhostBtn}>삭제</button>
                  <button type="button" onClick={() => setMode('edit')} style={primaryBtn(false)}>수정</button>
                </ModalFooter>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDel}
        title="상품 삭제"
        danger
        message={<>정말 이 상품을 삭제하시겠어요?<br />주문 이력이 있으면 완전 삭제 대신 비활성 처리됩니다.</>}
        confirmLabel="삭제"
        busy={del.isPending}
        error={del.isError ? del.error : undefined}
        onConfirm={() => del.mutate(productSeq, { onSuccess: () => { setConfirmDel(false); onClose() } })}
        onCancel={() => { if (!del.isPending) setConfirmDel(false) }}
      />
    </>
  )
}
