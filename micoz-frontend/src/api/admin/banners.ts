// 관리자 배너 도메인 — 출처: docs/admin_api.md §S. Settings — 배너 (S-1 목록 · S-2 상세 · S-3 생성 · S-4 수정 · S-5 노출토글 · S-6 삭제).
// [members.ts 레퍼런스 따름] DTO(명세 그대로) → 매퍼 → 뷰모델 → React Query 훅.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageResponse } from '../types'
import { adminGet, adminPost, adminPut, adminPatch, adminDelete } from './client'
import { adminBannerTypeLabel } from './labels'

/* ─── DTO (명세 그대로) ─── */
// S-1 AdminBannerListItem
export interface AdminBannerListItemDto {
  bannerSeq: number
  bannerType: string // HERO/CATEGORY/PROMO
  title: string
  imageUrl: string
  sortOrder: number
  displayYn: string // Y/N
  useYn: string // Y/N (N=삭제됨, 소프트삭제)
}

// S-2 AdminBannerDetailResponse
export interface AdminBannerDetailDto {
  bannerSeq: number
  bannerType: string
  title: string
  description?: string
  imageUrl: string
  linkUrl?: string
  sortOrder: number
  displayYn: string
  useYn: string
}

// S-1 검색 파라미터(전부 선택) + 페이징
export interface BannerSearchParams {
  q?: string // title 부분일치
  bannerType?: string // HERO/CATEGORY/PROMO
  displayYn?: string // Y/N
  page?: number // 0-based
  size?: number
  sort?: string // 화이트리스트: sortOrder · bannerSeq · createdDate
}

/* ─── 뷰모델 ─── */
export interface AdminBannerRow {
  bannerSeq: number
  bannerType: string
  typeLabel: string
  title: string
  imageUrl: string
  sortOrder: number
  displayYn: string
  useYn: string
}

export interface AdminBannerDetail {
  bannerSeq: number
  bannerType: string
  typeLabel: string
  title: string
  description: string
  imageUrl: string
  linkUrl: string
  sortOrder: number
  displayYn: string
  useYn: string
}

/* ─── 매퍼 ─── */
export function toBannerRow(d: AdminBannerListItemDto): AdminBannerRow {
  return {
    bannerSeq: d.bannerSeq,
    bannerType: d.bannerType,
    typeLabel: adminBannerTypeLabel(d.bannerType),
    title: d.title,
    imageUrl: d.imageUrl,
    sortOrder: d.sortOrder,
    displayYn: d.displayYn,
    useYn: d.useYn,
  }
}

export function toBannerDetail(d: AdminBannerDetailDto): AdminBannerDetail {
  return {
    bannerSeq: d.bannerSeq,
    bannerType: d.bannerType,
    typeLabel: adminBannerTypeLabel(d.bannerType),
    title: d.title,
    description: d.description ?? '',
    imageUrl: d.imageUrl,
    linkUrl: d.linkUrl ?? '',
    sortOrder: d.sortOrder,
    displayYn: d.displayYn,
    useYn: d.useYn,
  }
}

// S-3 요청/응답
export interface CreateBannerRequest {
  title: string
  imageUrl: string
  bannerType?: string // 미지정 HERO
  description?: string
  linkUrl?: string
  sortOrder?: number // 미지정 0
  displayYn?: string // 미지정 Y
}
export interface BannerCreatedDto {
  bannerSeq: number
}

// S-4 요청(전체 — 미지정 시 기본값 정규화: HERO/0/Y)
export interface UpdateBannerRequest {
  title: string
  imageUrl: string
  bannerType?: string
  description?: string
  linkUrl?: string
  sortOrder?: number
  displayYn?: string
}

// S-5 요청 — displayYn 필수, 정규식 [YNyn]
export interface UpdateBannerDisplayRequest {
  displayYn: string
}

/* ─── API ─── */
export function listBanners(params: BannerSearchParams): Promise<PageResponse<AdminBannerListItemDto>> {
  return adminGet<PageResponse<AdminBannerListItemDto>>('/admin/banners', { params })
}
export function getBanner(bannerSeq: number): Promise<AdminBannerDetailDto> {
  return adminGet<AdminBannerDetailDto>(`/admin/banners/${bannerSeq}`)
}
export function createBanner(body: CreateBannerRequest): Promise<BannerCreatedDto> {
  return adminPost<BannerCreatedDto>('/admin/banners', body)
}
export function updateBanner(bannerSeq: number, body: UpdateBannerRequest): Promise<void> {
  return adminPut<void>(`/admin/banners/${bannerSeq}`, body)
}
export function updateBannerDisplay(bannerSeq: number, body: UpdateBannerDisplayRequest): Promise<void> {
  return adminPatch<void>(`/admin/banners/${bannerSeq}/display`, body)
}
export function deleteBanner(bannerSeq: number): Promise<void> {
  return adminDelete<void>(`/admin/banners/${bannerSeq}`)
}

/* ─── 훅 ─── */
export const bannerKeys = {
  list: (p: BannerSearchParams) => ['admin', 'banners', 'list', p] as const,
  detail: (id: number) => ['admin', 'banners', 'detail', id] as const,
}

export function useBanners(params: BannerSearchParams) {
  return useQuery({
    queryKey: bannerKeys.list(params),
    queryFn: () => listBanners(params),
    select: (page): { rows: AdminBannerRow[]; totalElements: number; totalPages: number } => ({
      rows: page.content.map(toBannerRow),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
    }),
  })
}

export function useBanner(bannerSeq: number | null) {
  return useQuery({
    queryKey: bannerKeys.detail(bannerSeq ?? -1),
    queryFn: () => getBanner(bannerSeq as number),
    enabled: bannerSeq != null,
    select: toBannerDetail,
  })
}

// ─── 변이 훅 (S-3/S-4/S-5/S-6) — 성공 시 banners 목록·상세 invalidate ───
export function useCreateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateBannerRequest) => createBanner(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] })
    },
  })
}

export function useUpdateBanner(bannerSeq: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateBannerRequest) => updateBanner(bannerSeq, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] })
    },
  })
}

export function useUpdateBannerDisplay(bannerSeq: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateBannerDisplayRequest) => updateBannerDisplay(bannerSeq, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] })
    },
  })
}

export function useDeleteBanner(bannerSeq: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deleteBanner(bannerSeq),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] })
    },
  })
}
