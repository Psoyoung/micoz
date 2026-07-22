// 관리자 회원 도메인 — 출처: docs/admin_api.md §M (M-1 목록 · M-2 등록 · M-3 상세 · M-4 등급 · M-5 상태 · M-6 포인트).
// [레퍼런스 모듈] DTO(명세 그대로) → 매퍼 → 뷰모델 → React Query 훅. 다른 A2 도메인이 이 구조를 따른다.
// M-7(역할변경)은 A3c(관리자계정) 범위 — 여기 미구현.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageResponse } from '../types'
import { adminGet, adminPatch, adminPost } from './client'
import { adminGradeLabel, adminMemberStatusLabel } from './labels'
import { fmtDate, fmtDateTime } from './format'

/* ─── DTO (명세 그대로) ─── */
// M-1 MemberListItem
export interface MemberListItemDto {
  userSeq: number
  userId: string
  userName: string
  gradeCode: string
  pointBalance: number
  userStatus: string // ACTIVE/DORMANT/SUSPENDED
  useYn: string // Y/N (N=탈퇴)
  joinedDate: string
  lastLoginDate: string | null
}

// M-3 MemberDetailResponse (null 필드 생략)
export interface MemberDetailDto {
  userSeq: number
  userId: string
  userName: string
  userRole: string
  gradeCode: string
  gradeName: string
  userStatus: string
  useYn: string
  email?: string
  phone?: string
  birthDate?: string
  zipCode?: string
  address?: string
  addressDetail?: string
  memo?: string
  pointBalance: number
  serviceYn?: string
  privacyYn?: string
  marketingYn?: string
  referrerUserId?: string
  lastLoginDate?: string
  joinedDate: string
}

// M-1 검색 파라미터(전부 선택) + 페이징
export interface MemberSearchParams {
  q?: string
  gradeCode?: string
  status?: string // ACTIVE/DORMANT/SUSPENDED
  page?: number // 0-based
  size?: number
  sort?: string // 화이트리스트: userSeq·userId·userName·pointBalance·lastLoginDate·joinedDate·userStatus
}

/* ─── 뷰모델 (M-1 이 제공하는 필드로 재구성 — 계획 빚#7 참조) ───
   mock 의 이메일·전화(→상세에서), 주문수·누적구매액·최근주문(→백엔드 집계 빚)은 목록에서 제외. */
export interface AdminMemberRow {
  userSeq: number
  userId: string
  userName: string
  gradeCode: string
  gradeLabel: string
  pointBalance: number
  userStatus: string
  statusLabel: string
  useYn: string // N=탈퇴 배지
  joinedDate: string // 'YYYY-MM-DD'
  lastLoginDate: string // 'YYYY-MM-DD' | ''
}

export interface AdminMemberDetail {
  userSeq: number
  userId: string
  userName: string
  userRole: string
  gradeCode: string
  gradeLabel: string
  userStatus: string
  statusLabel: string
  useYn: string
  email: string
  phone: string
  birthDate: string
  address: string // zip + address + detail 합성
  memo: string
  pointBalance: number
  marketingYn: string
  referrerUserId: string
  joinedDate: string // 'YYYY-MM-DD HH:mm'
  lastLoginDate: string
}

/* ─── 매퍼 ─── */
export function toMemberRow(d: MemberListItemDto): AdminMemberRow {
  return {
    userSeq: d.userSeq,
    userId: d.userId,
    userName: d.userName,
    gradeCode: d.gradeCode,
    gradeLabel: adminGradeLabel(d.gradeCode),
    pointBalance: d.pointBalance ?? 0,
    userStatus: d.userStatus,
    statusLabel: adminMemberStatusLabel(d.userStatus),
    useYn: d.useYn,
    joinedDate: fmtDate(d.joinedDate),
    lastLoginDate: fmtDate(d.lastLoginDate),
  }
}

export function toMemberDetail(d: MemberDetailDto): AdminMemberDetail {
  const addr = [d.zipCode ? `(${d.zipCode})` : '', d.address ?? '', d.addressDetail ?? ''].filter(Boolean).join(' ')
  return {
    userSeq: d.userSeq,
    userId: d.userId,
    userName: d.userName,
    userRole: d.userRole,
    gradeCode: d.gradeCode,
    gradeLabel: d.gradeName || adminGradeLabel(d.gradeCode),
    userStatus: d.userStatus,
    statusLabel: adminMemberStatusLabel(d.userStatus),
    useYn: d.useYn,
    email: d.email ?? '',
    phone: d.phone ?? '',
    birthDate: fmtDate(d.birthDate),
    address: addr,
    memo: d.memo ?? '',
    pointBalance: d.pointBalance ?? 0,
    marketingYn: d.marketingYn ?? 'N',
    referrerUserId: d.referrerUserId ?? '',
    joinedDate: fmtDateTime(d.joinedDate),
    lastLoginDate: fmtDateTime(d.lastLoginDate),
  }
}

// M-2 요청
export interface CreateMemberRequest {
  userId: string
  userPw: string
  userName: string
  gradeCode?: string
  email?: string
  phone?: string
}
export interface MemberCreatedDto {
  userSeq: number
  userId: string
}

// M-4 요청
export interface UpdateMemberGradeRequest {
  gradeCode: string
}

// M-5 요청
export interface UpdateMemberStatusRequest {
  status: string // ACTIVE/DORMANT/SUSPENDED
}

// M-6 요청/응답
export interface PointAdjustRequest {
  amount: number // 양수=적립, 음수=차감, 0 불허
  reason: string
}
export interface PointAdjustDto {
  userSeq: number
  pointBalance: number
  pointSeq: number
}

/* ─── API ─── */
export function listMembers(params: MemberSearchParams): Promise<PageResponse<MemberListItemDto>> {
  return adminGet<PageResponse<MemberListItemDto>>('/admin/members', { params })
}
export function getMember(userSeq: number): Promise<MemberDetailDto> {
  return adminGet<MemberDetailDto>(`/admin/members/${userSeq}`)
}
export function createMember(body: CreateMemberRequest): Promise<MemberCreatedDto> {
  return adminPost<MemberCreatedDto>('/admin/members', body)
}
export function updateMemberGrade(userSeq: number, body: UpdateMemberGradeRequest): Promise<void> {
  return adminPatch<void>(`/admin/members/${userSeq}/grade`, body)
}
export function updateMemberStatus(userSeq: number, body: UpdateMemberStatusRequest): Promise<void> {
  return adminPatch<void>(`/admin/members/${userSeq}/status`, body)
}
export function adjustMemberPoints(userSeq: number, body: PointAdjustRequest): Promise<PointAdjustDto> {
  return adminPost<PointAdjustDto>(`/admin/members/${userSeq}/points`, body)
}
// M-7 역할 변경(승강): ADMIN/CUSTOMER. 보호: ADMIN_ROOT_PROTECTED·ADMIN_SELF_LOCKOUT·ADMIN_LAST_ADMIN_PROTECTED(409).
export interface UpdateMemberRoleRequest {
  role: string // ADMIN | CUSTOMER
}
export function updateMemberRole(userSeq: number, role: string): Promise<void> {
  return adminPatch<void>(`/admin/members/${userSeq}/role`, { role } satisfies UpdateMemberRoleRequest)
}

/* ─── 훅 ─── */
export const memberKeys = {
  list: (p: MemberSearchParams) => ['admin', 'members', 'list', p] as const,
  detail: (id: number) => ['admin', 'members', 'detail', id] as const,
}

export function useMembers(params: MemberSearchParams) {
  return useQuery({
    queryKey: memberKeys.list(params),
    queryFn: () => listMembers(params),
    select: (page): { rows: AdminMemberRow[]; totalElements: number; totalPages: number } => ({
      rows: page.content.map(toMemberRow),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
    }),
  })
}

export function useMember(userSeq: number | null) {
  return useQuery({
    queryKey: memberKeys.detail(userSeq ?? -1),
    queryFn: () => getMember(userSeq as number),
    enabled: userSeq != null,
    select: toMemberDetail,
  })
}

// ─── 변이 훅 (M-2/M-4/M-5/M-6) — 성공 시 members 목록·상세 invalidate ───
export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateMemberRequest) => createMember(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'members'] })
    },
  })
}

export function useUpdateMemberGrade(userSeq: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMemberGradeRequest) => updateMemberGrade(userSeq, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'members'] })
    },
  })
}

export function useUpdateMemberStatus(userSeq: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMemberStatusRequest) => updateMemberStatus(userSeq, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'members'] })
    },
  })
}

export function useAdjustMemberPoints(userSeq: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PointAdjustRequest) => adjustMemberPoints(userSeq, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'members'] })
    },
  })
}

// M-7 역할 변경(승강) — 성공 시 members 목록·상세 invalidate.
export function useUpdateMemberRole(userSeq: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (role: string) => updateMemberRole(userSeq, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'members'] })
    },
  })
}
