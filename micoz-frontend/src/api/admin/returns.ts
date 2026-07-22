// 관리자 반품/교환 도메인 — 출처: docs/admin_api.md §R (R-1 목록 · R-2 상세 · R-3~R-7 상태전이).
// [A2 조회] members.ts 구조 그대로 따름: DTO(명세 그대로) → 매퍼 → 뷰모델 → React Query 훅.
// A3b: 상태 전이(§3.3). complete 부수효과는 유형별(CANCEL/RETURN=환불·재고복원·주문종결 / EXCHANGE=상태만).
//   성공 시 data 없음 → 상세 재조회로 refundAmount·상태 확인(admin_api.md 명시).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageResponse } from '../types'
import { adminGet, adminPatch } from './client'
import { adminReturnStatusLabel, adminReturnTypeLabel, adminReturnReasonLabel } from './labels'
import { fmtDateTime, won, toNum } from './format'

/* ─── DTO (명세 그대로) ─── */
// R-1 AdminReturnListItem
export interface AdminReturnListItemDto {
  returnSeq: number
  returnNo: string
  orderSeq: number
  orderNo: string
  userSeq: number
  returnType: string // CANCEL/EXCHANGE/RETURN
  returnStatus: string // REQUESTED/APPROVED/COLLECTED/INSPECTED/COMPLETED/REJECTED
  returnReasonType: string | null
  refundAmount: number
  requestedDate: string
  totalItemCount: number
}

// R-2 ReturnItemDto
export interface AdminReturnItemDto {
  returnItemSeq: number
  itemSeq: number
  productSeq: number
  productName: string
  optionName: string
  unitPrice: number
  quantity: number
  exchangeOptionSeq: number | null
  exchangeOptionName: string | null
}

// R-2 AdminReturnDetailResponse
export interface AdminReturnDetailDto {
  returnSeq: number
  returnNo: string
  orderSeq: number
  orderNo: string
  userSeq: number
  returnType: string
  returnStatus: string
  returnReasonType: string | null
  returnReason: string | null
  returnShippingFee: number
  refundAmount: number
  pickupZipCode: string
  pickupAddress: string
  pickupAddressDetail: string
  pickupPhone: string
  requestedDate: string
  completedDate: string | null
  items: AdminReturnItemDto[]
}

// R-1 검색 파라미터(전부 선택) + 페이징
export interface ReturnSearchParams {
  q?: string // returnNo 부분일치
  returnStatus?: string
  returnType?: string
  userSeq?: number
  dateFrom?: string
  dateTo?: string
  page?: number // 0-based
  size?: number
  sort?: string // 화이트리스트: requestedDate·returnSeq
}

/* ─── 뷰모델 (R-1 이 제공하는 필드로 재구성 — 매퍼 갭 참조) ───
   mock 의 customerName·productName/optionName(평면화)은 목록에서 제외.
   고객명은 R-1이 userSeq만 제공(조인 없음) → 백엔드 빚, userSeq 로 표시.
   상품명/옵션은 R-1 자체가 제공 안 함(totalItemCount만) → 상세(items[])에서만 확인 가능. */
export interface AdminReturnRow {
  returnSeq: number
  returnNo: string
  orderSeq: number
  orderNo: string
  userSeq: number
  returnType: string
  typeLabel: string
  returnStatus: string
  statusLabel: string
  reasonType: string | null
  reasonLabel: string
  refundAmount: number
  requestedDate: string // 'YYYY-MM-DD HH:mm'
  totalItemCount: number
}

export interface AdminReturnDetailItem {
  returnItemSeq: number
  itemSeq: number
  productSeq: number
  productName: string
  optionName: string
  unitPrice: number
  unitPriceLabel: string
  quantity: number
  exchangeOptionSeq: number | null
  exchangeOptionName: string | null
}

export interface AdminReturnDetail {
  returnSeq: number
  returnNo: string
  orderSeq: number
  orderNo: string
  userSeq: number
  returnType: string
  typeLabel: string
  returnStatus: string
  statusLabel: string
  reasonType: string | null
  reasonLabel: string
  reason: string
  returnShippingFee: number
  refundAmount: number
  pickupZipCode: string
  pickupAddress: string
  pickupAddressDetail: string
  pickupPhone: string
  pickupFull: string // zip + address + detail 합성 ('' = 회수지 정보 없음, 예: CANCEL 유형)
  requestedDate: string // 'YYYY-MM-DD HH:mm'
  completedDate: string // '' | 'YYYY-MM-DD HH:mm'
  items: AdminReturnDetailItem[]
}

/* ─── 매퍼 ─── */
export function toReturnRow(d: AdminReturnListItemDto): AdminReturnRow {
  return {
    returnSeq: d.returnSeq,
    returnNo: d.returnNo,
    orderSeq: d.orderSeq,
    orderNo: d.orderNo,
    userSeq: d.userSeq,
    returnType: d.returnType,
    typeLabel: adminReturnTypeLabel(d.returnType),
    returnStatus: d.returnStatus,
    statusLabel: adminReturnStatusLabel(d.returnStatus),
    reasonType: d.returnReasonType,
    reasonLabel: d.returnReasonType ? adminReturnReasonLabel(d.returnReasonType) : '-',
    refundAmount: toNum(d.refundAmount),
    requestedDate: fmtDateTime(d.requestedDate),
    totalItemCount: d.totalItemCount,
  }
}

export function toReturnDetail(d: AdminReturnDetailDto): AdminReturnDetail {
  const pickupFull = [d.pickupZipCode ? `(${d.pickupZipCode})` : '', d.pickupAddress ?? '', d.pickupAddressDetail ?? '']
    .filter(Boolean)
    .join(' ')
  return {
    returnSeq: d.returnSeq,
    returnNo: d.returnNo,
    orderSeq: d.orderSeq,
    orderNo: d.orderNo,
    userSeq: d.userSeq,
    returnType: d.returnType,
    typeLabel: adminReturnTypeLabel(d.returnType),
    returnStatus: d.returnStatus,
    statusLabel: adminReturnStatusLabel(d.returnStatus),
    reasonType: d.returnReasonType,
    reasonLabel: d.returnReasonType ? adminReturnReasonLabel(d.returnReasonType) : '-',
    reason: d.returnReason ?? '',
    returnShippingFee: toNum(d.returnShippingFee),
    refundAmount: toNum(d.refundAmount),
    pickupZipCode: d.pickupZipCode ?? '',
    pickupAddress: d.pickupAddress ?? '',
    pickupAddressDetail: d.pickupAddressDetail ?? '',
    pickupPhone: d.pickupPhone ?? '',
    pickupFull,
    requestedDate: fmtDateTime(d.requestedDate),
    completedDate: fmtDateTime(d.completedDate),
    items: (d.items ?? []).map((it) => ({
      returnItemSeq: it.returnItemSeq,
      itemSeq: it.itemSeq,
      productSeq: it.productSeq,
      productName: it.productName,
      optionName: it.optionName,
      unitPrice: toNum(it.unitPrice),
      unitPriceLabel: won(it.unitPrice),
      quantity: it.quantity,
      exchangeOptionSeq: it.exchangeOptionSeq,
      exchangeOptionName: it.exchangeOptionName,
    })),
  }
}

/* ─── API ─── */
export function listReturns(params: ReturnSearchParams): Promise<PageResponse<AdminReturnListItemDto>> {
  return adminGet<PageResponse<AdminReturnListItemDto>>('/admin/returns', { params })
}
export function getReturn(returnSeq: number): Promise<AdminReturnDetailDto> {
  return adminGet<AdminReturnDetailDto>(`/admin/returns/${returnSeq}`)
}

/* ─── 훅 ─── */
export const returnKeys = {
  list: (p: ReturnSearchParams) => ['admin', 'returns', 'list', p] as const,
  detail: (id: number) => ['admin', 'returns', 'detail', id] as const,
}

export function useReturns(params: ReturnSearchParams) {
  return useQuery({
    queryKey: returnKeys.list(params),
    queryFn: () => listReturns(params),
    select: (page): { rows: AdminReturnRow[]; totalElements: number; totalPages: number } => ({
      rows: page.content.map(toReturnRow),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
    }),
  })
}

export function useReturn(returnSeq: number | null) {
  return useQuery({
    queryKey: returnKeys.detail(returnSeq ?? -1),
    queryFn: () => getReturn(returnSeq as number),
    enabled: returnSeq != null,
    select: toReturnDetail,
  })
}

/* ─── 상태전이 API (R-3~R-7) — 전부 200·data 없음 ───
   전이표 §3.3. 위반 시 409 RETURN_TRANSITION_INVALID.
   complete ⚠️ 부수효과(유형별): CANCEL/RETURN=환불확정+payment REFUNDED+주문종결+재고복원(재입고 대상), EXCHANGE=상태만. */
export function approveReturn(returnSeq: number): Promise<void> {
  return adminPatch<void>(`/admin/returns/${returnSeq}/approve`) // REQUESTED → APPROVED
}
export function rejectReturn(returnSeq: number): Promise<void> {
  return adminPatch<void>(`/admin/returns/${returnSeq}/reject`) // {REQUESTED|APPROVED|INSPECTED} → REJECTED (부수효과 없음)
}
export function collectReturn(returnSeq: number): Promise<void> {
  return adminPatch<void>(`/admin/returns/${returnSeq}/collect`) // APPROVED → COLLECTED
}
// R-6: restockYn 미지정 시 백엔드 기본(DEFECT=N, 그 외=Y). 재입고 판정이 완료 시 재고복원 여부를 가름.
export function inspectReturn(returnSeq: number, restockYn?: 'Y' | 'N'): Promise<void> {
  return adminPatch<void>(`/admin/returns/${returnSeq}/inspect`, restockYn ? { restockYn } : undefined) // COLLECTED → INSPECTED
}
export function completeReturn(returnSeq: number): Promise<void> {
  return adminPatch<void>(`/admin/returns/${returnSeq}/complete`) // INSPECTED → COMPLETED (⚠️ 유형별 부수효과)
}

// 상태전이 훅 묶음 — 성공 시 반품 목록+상세 invalidate(상세 재조회로 refundAmount·상태 확인).
export function useReturnTransitions(returnSeq: number) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'returns'] })
  return {
    approve: useMutation({ mutationFn: () => approveReturn(returnSeq), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: () => rejectReturn(returnSeq), onSuccess: invalidate }),
    collect: useMutation({ mutationFn: () => collectReturn(returnSeq), onSuccess: invalidate }),
    inspect: useMutation({ mutationFn: (restockYn?: 'Y' | 'N') => inspectReturn(returnSeq, restockYn), onSuccess: invalidate }),
    complete: useMutation({ mutationFn: () => completeReturn(returnSeq), onSuccess: invalidate }),
  }
}

/* ─── 버튼 노출 근거(§3.3) — 임의로 정하지 말 것 ───
   반려는 REQUESTED/APPROVED/INSPECTED 3진입점만(COLLECTED에선 미노출). */
export interface ReturnActionAvailability {
  canApprove: boolean // REQUESTED
  canReject: boolean // REQUESTED | APPROVED | INSPECTED
  canCollect: boolean // APPROVED
  canInspect: boolean // COLLECTED
  canComplete: boolean // INSPECTED
}
export function returnActions(status: string): ReturnActionAvailability {
  return {
    canApprove: status === 'REQUESTED',
    canReject: status === 'REQUESTED' || status === 'APPROVED' || status === 'INSPECTED',
    canCollect: status === 'APPROVED',
    canInspect: status === 'COLLECTED',
    canComplete: status === 'INSPECTED',
  }
}
