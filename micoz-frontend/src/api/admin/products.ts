// 관리자 상품 도메인 — 출처: docs/admin_api.md §C. Catalog — 상품 (C-5 목록 · C-6 상세).
// members.ts 구조 복제: DTO(명세 그대로) → 매퍼 → 뷰모델 → React Query 훅.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageResponse } from '../types'
import { adminGet, adminPost, adminPut, adminPatch, adminDelete } from './client'
import { adminProductStatusLabel } from './labels'
import { fmtDate, fmtDateTime, toNum } from './format'

/* ─── DTO (명세 그대로) ─── */
// C-5 AdminProductListItem
export interface AdminProductListItemDto {
  productSeq: number
  productCode: string
  productName: string
  productStatus: string // ON_SALE/LOW_STOCK/SOLD_OUT/STOPPED
  categorySeq: number | null
  categoryName: string | null
  basePrice: number | string // BigDecimal
  displayYn: string // Y/N
  useYn: string // Y/N
  totalStock: number // 활성 옵션 재고합
  createdDate: string
}

// C-6 AdminOptionDto / AdminImageDto / AdminLabelDto
export interface AdminProductOptionDto {
  optionSeq: number
  optionName: string
  finalPrice: number | string
  stockQty: number
  sortOrder: number
  useYn: string
}
export interface AdminProductImageDto {
  imageSeq: number
  imageType: string // MAIN/SUB/DETAIL
  imageUrl: string
  imageAlt?: string | null
  sortOrder: number
  useYn: string
}
export interface AdminProductLabelDto {
  labelSeq: number
  labelName: string
}

// C-6 AdminProductDetailResponse
export interface AdminProductDetailDto {
  productSeq: number
  productCode: string
  productName: string
  productStatus: string
  categorySeq: number | null
  categoryName: string | null
  basePrice: number | string
  shortDesc?: string | null
  detailDesc?: string | null
  ingredientInfo?: string | null
  usageInfo?: string | null
  displayYn: string
  useYn: string
  options: AdminProductOptionDto[]
  images: AdminProductImageDto[]
  labels: AdminProductLabelDto[]
  createdDate: string
  lastModifiedDate: string
}

// C-5 ProductSearchCondition(전부 선택) + 페이징
export interface ProductSearchParams {
  q?: string
  productCode?: string
  categorySeq?: number
  displayYn?: string // Y/N
  status?: string // ON_SALE/LOW_STOCK/SOLD_OUT/STOPPED
  page?: number // 0-based
  size?: number
  sort?: string // 화이트리스트: productSeq·productCode·productName·basePrice·productStatus·displayYn·createdDate
}

/* ─── 뷰모델 ───
   mock 의 line(브랜드라인, presentational)·sales30(30일판매량, 집계)는 C-5 에 없음 → 목록에서 제외(계획 매퍼 갭).
   updatedDate 도 C-5 에 없음(createdDate 만 제공) → '등록일'로 표기. */
export interface AdminProductRow {
  productSeq: number
  productCode: string
  productName: string
  productStatus: string
  statusLabel: string
  categorySeq: number | null
  categoryName: string
  basePrice: number
  displayYn: string
  useYn: string
  totalStock: number
  createdDate: string // 'YYYY-MM-DD'
}

export interface AdminProductOptionRow {
  optionSeq: number
  optionName: string
  finalPrice: number
  stockQty: number
  sortOrder: number
  useYn: string
}
export interface AdminProductImageRow {
  imageSeq: number
  imageType: string
  imageUrl: string
  imageAlt: string
  sortOrder: number
  useYn: string
}
export interface AdminProductLabelRow {
  labelSeq: number
  labelName: string
}

export interface AdminProductDetail {
  productSeq: number
  productCode: string
  productName: string
  productStatus: string
  statusLabel: string
  categorySeq: number | null
  categoryName: string
  basePrice: number
  shortDesc: string
  detailDesc: string
  ingredientInfo: string
  usageInfo: string
  displayYn: string
  useYn: string
  options: AdminProductOptionRow[]
  images: AdminProductImageRow[]
  labels: AdminProductLabelRow[]
  createdDate: string // 'YYYY-MM-DD HH:mm'
  lastModifiedDate: string
}

/* ─── 매퍼 ─── */
export function toProductRow(d: AdminProductListItemDto): AdminProductRow {
  return {
    productSeq: d.productSeq,
    productCode: d.productCode,
    productName: d.productName,
    productStatus: d.productStatus,
    statusLabel: adminProductStatusLabel(d.productStatus),
    categorySeq: d.categorySeq,
    categoryName: d.categoryName ?? '',
    basePrice: toNum(d.basePrice),
    displayYn: d.displayYn,
    useYn: d.useYn,
    totalStock: d.totalStock ?? 0,
    createdDate: fmtDate(d.createdDate),
  }
}

export function toProductDetail(d: AdminProductDetailDto): AdminProductDetail {
  return {
    productSeq: d.productSeq,
    productCode: d.productCode,
    productName: d.productName,
    productStatus: d.productStatus,
    statusLabel: adminProductStatusLabel(d.productStatus),
    categorySeq: d.categorySeq,
    categoryName: d.categoryName ?? '',
    basePrice: toNum(d.basePrice),
    shortDesc: d.shortDesc ?? '',
    detailDesc: d.detailDesc ?? '',
    ingredientInfo: d.ingredientInfo ?? '',
    usageInfo: d.usageInfo ?? '',
    displayYn: d.displayYn,
    useYn: d.useYn,
    options: (d.options ?? [])
      .map((o) => ({
        optionSeq: o.optionSeq,
        optionName: o.optionName,
        finalPrice: toNum(o.finalPrice),
        stockQty: o.stockQty ?? 0,
        sortOrder: o.sortOrder ?? 0,
        useYn: o.useYn,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    images: (d.images ?? [])
      .map((im) => ({
        imageSeq: im.imageSeq,
        imageType: im.imageType,
        imageUrl: im.imageUrl,
        imageAlt: im.imageAlt ?? '',
        sortOrder: im.sortOrder ?? 0,
        useYn: im.useYn,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    labels: (d.labels ?? []).map((l) => ({ labelSeq: l.labelSeq, labelName: l.labelName })),
    createdDate: fmtDateTime(d.createdDate),
    lastModifiedDate: fmtDateTime(d.lastModifiedDate),
  }
}

/* ─── 변이 요청 DTO (C-7 생성 · C-8 수정 · C-9 상태 · C-10 재고) ───
   C-7 OptionInput/ImageInput 은 seq 없음. C-8 OptionUpsert/ImageUpsert 는 seq(null=신규/값=기존).
   두 케이스를 한 타입으로: optionSeq/imageSeq 를 optional 로 두고, 생성 payload 빌드 시 생략한다. */
export interface ProductOptionInput {
  optionSeq?: number | null // C-8 전용: null=신규, 값=기존수정
  optionName: string
  finalPrice: number
  stockQty?: number
  sortOrder?: number
}
export interface ProductImageInput {
  imageSeq?: number | null // C-8 전용: null=신규, 값=기존수정
  imageType: string // MAIN/SUB/DETAIL
  imageUrl: string
  imageAlt?: string
  sortOrder?: number
}

// C-7 CreateProductRequest — options/images/labelSeqs 모두 선택(0개 허용)
export interface CreateProductRequest {
  productCode: string
  productName: string
  categorySeq?: number | null
  basePrice: number
  productStatus?: string
  shortDesc?: string
  detailDesc?: string
  ingredientInfo?: string
  usageInfo?: string
  displayYn?: string
  options?: ProductOptionInput[]
  images?: ProductImageInput[]
  labelSeqs?: number[]
}
export interface ProductCreatedDto {
  productSeq: number
  productCode: string
}

// C-8 UpdateProductRequest — 전체 교체(단일 트랜잭션). options/images/labelSeqs 는 항상 전송(빠진 기존행=소프트삭제).
export interface UpdateProductRequest {
  productCode: string
  productName: string
  categorySeq?: number | null
  basePrice: number
  productStatus?: string
  shortDesc?: string
  detailDesc?: string
  ingredientInfo?: string
  usageInfo?: string
  displayYn?: string
  options: ProductOptionInput[]
  images: ProductImageInput[]
  labelSeqs: number[]
}

// C-9 / C-10 요청
export interface UpdateProductStatusRequest {
  status: string // ON_SALE/LOW_STOCK/SOLD_OUT/STOPPED
}
export interface UpdateStockRequest {
  stockQty: number // 절대값(증감 아님), ≥0
}

/* ─── API ─── */
export function listProducts(params: ProductSearchParams): Promise<PageResponse<AdminProductListItemDto>> {
  return adminGet<PageResponse<AdminProductListItemDto>>('/admin/products', { params })
}
export function getProduct(productSeq: number): Promise<AdminProductDetailDto> {
  return adminGet<AdminProductDetailDto>(`/admin/products/${productSeq}`)
}
export function createProduct(body: CreateProductRequest): Promise<ProductCreatedDto> {
  return adminPost<ProductCreatedDto>('/admin/products', body)
}
export function updateProduct(productSeq: number, body: UpdateProductRequest): Promise<void> {
  return adminPut<void>(`/admin/products/${productSeq}`, body)
}
export function updateProductStatus(productSeq: number, body: UpdateProductStatusRequest): Promise<void> {
  return adminPatch<void>(`/admin/products/${productSeq}/status`, body)
}
export function updateOptionStock(productSeq: number, optionSeq: number, body: UpdateStockRequest): Promise<void> {
  return adminPatch<void>(`/admin/products/${productSeq}/options/${optionSeq}/stock`, body)
}
export function deleteProduct(productSeq: number): Promise<void> {
  return adminDelete<void>(`/admin/products/${productSeq}`)
}

/* ─── 훅 ─── */
export const productKeys = {
  list: (p: ProductSearchParams) => ['admin', 'products', 'list', p] as const,
  detail: (id: number) => ['admin', 'products', 'detail', id] as const,
  all: ['admin', 'products'] as const,
}

export function useProducts(params: ProductSearchParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => listProducts(params),
    select: (page): { rows: AdminProductRow[]; totalElements: number; totalPages: number } => ({
      rows: page.content.map(toProductRow),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
    }),
  })
}

export function useProduct(productSeq: number | null) {
  return useQuery({
    queryKey: productKeys.detail(productSeq ?? -1),
    queryFn: () => getProduct(productSeq as number),
    enabled: productSeq != null,
    select: toProductDetail,
  })
}

/* ─── 변이 훅 (C-7/C-8/C-9/C-10/C-11) — 성공 시 products 목록·상세 invalidate ───
   C-8 은 단일 트랜잭션(전체 성공 or 전체 실패) → onError 시 부분 반영 없음. */
export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateProductRequest) => createProduct(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export function useUpdateProduct(productSeq: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateProductRequest) => updateProduct(productSeq, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export function useUpdateProductStatus(productSeq: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateProductStatusRequest) => updateProductStatus(productSeq, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export function useUpdateOptionStock(productSeq: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { optionSeq: number; stockQty: number }) => updateOptionStock(productSeq, v.optionSeq, { stockQty: v.stockQty }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (productSeq: number) => deleteProduct(productSeq),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}
