// 관리자 계정 도메인 — 출처: docs/admin_api.md §F (F-3 생성 · F-4 목록 · F-5 활성/비활성).
// [members.ts 패턴] DTO(명세 그대로) → 매퍼 → 뷰모델 → React Query 훅.
// 보호 가드(백엔드): ADMIN_SELF_LOCKOUT(본인)·ADMIN_LAST_ADMIN_PROTECTED(마지막 관리자)·ADMIN_ROOT_PROTECTED(ROOT).
//   프론트는 본인 행 비활성 버튼을 사전 차단(self-lockout), 나머지는 409 한글 안내.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageResponse } from '../types'
import { adminGet, adminPost, adminPatch } from './client'
import { fmtDateTime } from './format'

/* ─── DTO (명세 그대로) ─── */
// F-4 AdminListItem
export interface AdminListItemDto {
  userSeq: number
  userId: string
  userName: string
  email: string
  userStatus: string // ACTIVE/DORMANT/SUSPENDED
  useYn: string // Y/N (F-5 active 플래그)
  lastLoginDate: string | null
}

// F-3 요청/응답
export interface CreateAdminRequest {
  userId: string
  userPw: string
  userName: string
  email?: string
}
export interface AdminCreatedDto {
  userSeq: number
  userId: string
}

// F-5 요청
export interface UpdateAdminStatusRequest {
  active: boolean // true=활성 useYn=Y, false=비활성 useYn=N
}

// F-4 페이징/정렬(검색 파라미터 없음 — 페이징·정렬만)
export interface AdminSearchParams {
  page?: number // 0-based
  size?: number
  sort?: string // 화이트리스트: userSeq·userId·userName·email·userStatus·useYn·lastLoginDate·pointBalance
}

/* ─── 뷰모델 ─── */
export interface AdminAccountRow {
  userSeq: number
  userId: string
  userName: string
  email: string
  userStatus: string
  useYn: string
  active: boolean // useYn === 'Y'
  activeLabel: string // 활성 / 비활성
  lastLoginDate: string // 'YYYY-MM-DD HH:mm' | ''
}

/* ─── 매퍼 ─── */
export function toAdminAccountRow(d: AdminListItemDto): AdminAccountRow {
  const active = d.useYn === 'Y'
  return {
    userSeq: d.userSeq,
    userId: d.userId,
    userName: d.userName,
    email: d.email ?? '',
    userStatus: d.userStatus,
    useYn: d.useYn,
    active,
    activeLabel: active ? '활성' : '비활성',
    lastLoginDate: fmtDateTime(d.lastLoginDate),
  }
}

/* ─── API ─── */
export function listAdmins(params: AdminSearchParams): Promise<PageResponse<AdminListItemDto>> {
  return adminGet<PageResponse<AdminListItemDto>>('/admin/admins', { params })
}
export function createAdmin(body: CreateAdminRequest): Promise<AdminCreatedDto> {
  return adminPost<AdminCreatedDto>('/admin/admins', body)
}
export function updateAdminStatus(userSeq: number, active: boolean): Promise<void> {
  return adminPatch<void>(`/admin/admins/${userSeq}/status`, { active } satisfies UpdateAdminStatusRequest)
}

/* ─── 훅 ─── */
export const adminAccountKeys = {
  list: (p: AdminSearchParams) => ['admin', 'admins', 'list', p] as const,
}

export function useAdmins(params: AdminSearchParams) {
  return useQuery({
    queryKey: adminAccountKeys.list(params),
    queryFn: () => listAdmins(params),
    select: (page): { rows: AdminAccountRow[]; totalElements: number; totalPages: number } => ({
      rows: page.content.map(toAdminAccountRow),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
    }),
  })
}

export function useCreateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAdminRequest) => createAdmin(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'admins'] }),
  })
}

export function useUpdateAdminStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userSeq, active }: { userSeq: number; active: boolean }) => updateAdminStatus(userSeq, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'admins'] }),
  })
}
