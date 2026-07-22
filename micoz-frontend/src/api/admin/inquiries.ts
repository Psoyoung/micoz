// 관리자 1:1 문의 도메인 — 출처: docs/admin_api.md §CS (CS-1 목록 · CS-2 상세 · CS-3 답변등록).
// [members.ts 패턴 준용] DTO(명세 그대로) → 매퍼 → 뷰모델 → React Query 훅.
// A3b: CS-3 답변 등록 = 최초 답변 시 WAITING→ANSWERED 전이 + answeredDate 기록.
//   재답변(다중) 허용하나 상태·answeredDate 불변(최초 응답 시각 고정). append-only(수정/삭제 API 없음).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageResponse } from '../types'
import { adminGet, adminPost } from './client'
import { adminInquiryStatusLabel, adminInquiryTypeLabel } from './labels'
import { fmtDateTime } from './format'

/* ─── DTO (명세 그대로) ─── */
// CS-1 AdminInquiryListItem
export interface AdminInquiryListItemDto {
  inquirySeq: number
  inquiryNo: string
  userSeq: number
  inquiryType: string // §2.6 PRODUCT/ORDER/DELIVERY/RETURN/ETC
  title: string
  inquiryStatus: string // §2.5 WAITING/ANSWERED
  privateYn: string // Y/N
  hasReply: boolean
  createdDate: string
  answeredDate: string | null
}

// CS-2 AdminInquiryDetailResponse
export interface AdminInquiryReplyDto {
  replySeq: number
  adminSeq: number
  content: string
  createdDate: string
}

export interface AdminInquiryDetailDto {
  inquirySeq: number
  inquiryNo: string
  userSeq: number
  inquiryType: string
  title: string
  content: string
  productSeq: number | null
  orderSeq: number | null
  inquiryStatus: string
  privateYn: string
  createdDate: string
  answeredDate: string | null
  replies: AdminInquiryReplyDto[]
}

// CS-1 검색 파라미터(전부 선택) + 페이징
export interface InquirySearchParams {
  q?: string
  inquiryType?: string
  inquiryStatus?: string
  userSeq?: number
  privateYn?: string
  dateFrom?: string
  dateTo?: string
  page?: number // 0-based
  size?: number
  sort?: string // 화이트리스트: inquirySeq·iDate. 기본 inquirySeq,desc
}

/* ─── 뷰모델 (CS-1 이 제공하는 필드로 재구성 — 매퍼 갭 참조) ───
   mock 의 작성자명·이메일은 목록 미제공(userSeq 만 제공) → 백엔드 조인 빚으로 판단해 목록에서 제외. */
export interface AdminInquiryRow {
  inquirySeq: number
  inquiryNo: string
  userSeq: number
  inquiryType: string
  typeLabel: string
  title: string
  inquiryStatus: string
  statusLabel: string
  privateYn: string // Y=비공개 배지
  hasReply: boolean
  createdDate: string // 'YYYY-MM-DD HH:mm'
  answeredDate: string // 'YYYY-MM-DD HH:mm' | ''
}

export interface AdminInquiryReplyVm {
  replySeq: number
  adminSeq: number
  content: string
  createdDate: string // 'YYYY-MM-DD HH:mm'
}

export interface AdminInquiryDetail {
  inquirySeq: number
  inquiryNo: string
  userSeq: number
  inquiryType: string
  typeLabel: string
  title: string
  content: string
  productSeq: number | null
  orderSeq: number | null
  inquiryStatus: string
  statusLabel: string
  privateYn: string
  createdDate: string
  answeredDate: string
  replies: AdminInquiryReplyVm[]
}

/* ─── 매퍼 ─── */
export function toInquiryRow(d: AdminInquiryListItemDto): AdminInquiryRow {
  return {
    inquirySeq: d.inquirySeq,
    inquiryNo: d.inquiryNo,
    userSeq: d.userSeq,
    inquiryType: d.inquiryType,
    typeLabel: adminInquiryTypeLabel(d.inquiryType),
    title: d.title,
    inquiryStatus: d.inquiryStatus,
    statusLabel: adminInquiryStatusLabel(d.inquiryStatus),
    privateYn: d.privateYn,
    hasReply: d.hasReply,
    createdDate: fmtDateTime(d.createdDate),
    answeredDate: fmtDateTime(d.answeredDate),
  }
}

export function toInquiryDetail(d: AdminInquiryDetailDto): AdminInquiryDetail {
  return {
    inquirySeq: d.inquirySeq,
    inquiryNo: d.inquiryNo,
    userSeq: d.userSeq,
    inquiryType: d.inquiryType,
    typeLabel: adminInquiryTypeLabel(d.inquiryType),
    title: d.title,
    content: d.content,
    productSeq: d.productSeq,
    orderSeq: d.orderSeq,
    inquiryStatus: d.inquiryStatus,
    statusLabel: adminInquiryStatusLabel(d.inquiryStatus),
    privateYn: d.privateYn,
    createdDate: fmtDateTime(d.createdDate),
    answeredDate: fmtDateTime(d.answeredDate),
    replies: (d.replies ?? []).map((r) => ({
      replySeq: r.replySeq,
      adminSeq: r.adminSeq,
      content: r.content,
      createdDate: fmtDateTime(r.createdDate),
    })),
  }
}

/* ─── API ─── */
export function listInquiries(params: InquirySearchParams): Promise<PageResponse<AdminInquiryListItemDto>> {
  return adminGet<PageResponse<AdminInquiryListItemDto>>('/admin/inquiries', { params })
}
export function getInquiry(inquirySeq: number): Promise<AdminInquiryDetailDto> {
  return adminGet<AdminInquiryDetailDto>(`/admin/inquiries/${inquirySeq}`)
}

/* ─── 훅 ─── */
export const inquiryKeys = {
  list: (p: InquirySearchParams) => ['admin', 'inquiries', 'list', p] as const,
  detail: (id: number) => ['admin', 'inquiries', 'detail', id] as const,
}

export function useInquiries(params: InquirySearchParams) {
  return useQuery({
    queryKey: inquiryKeys.list(params),
    queryFn: () => listInquiries(params),
    select: (page): { rows: AdminInquiryRow[]; totalElements: number; totalPages: number } => ({
      rows: page.content.map(toInquiryRow),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
    }),
  })
}

export function useInquiry(inquirySeq: number | null) {
  return useQuery({
    queryKey: inquiryKeys.detail(inquirySeq ?? -1),
    queryFn: () => getInquiry(inquirySeq as number),
    enabled: inquirySeq != null,
    select: toInquiryDetail,
  })
}

/* ─── CS-3 답변 등록 ─── */
// content 필수·최대 2000자(@Size). adminSeq는 인증 관리자에서 주입(바디 아님). 200·data 없음.
export interface CreateReplyRequest {
  content: string
}
export function createInquiryReply(inquirySeq: number, body: CreateReplyRequest): Promise<void> {
  return adminPost<void>(`/admin/inquiries/${inquirySeq}/replies`, body)
}

// 답변 등록 훅 — 성공 시 문의 목록+상세 invalidate(상세 재조회로 답변·상태·answeredDate 갱신).
export function useCreateInquiryReply(inquirySeq: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => createInquiryReply(inquirySeq, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'inquiries'] })
    },
  })
}
