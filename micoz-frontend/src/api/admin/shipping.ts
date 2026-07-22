// 관리자 배송비 정책 설정 — 출처: docs/admin_api.md §S. Settings — 배송 설정 (S-7 조회 · S-8 수정).
// 이건 주문 배송(§O)이 아니라 mst_shipping 단일행 정책(기본 배송비/무료배송 기준/도서산간 추가/안내문구).
// [members.ts 레퍼런스 따름] DTO(명세 그대로) → 매퍼 → 뷰모델 → React Query 훅.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminGet, adminPatch } from './client'
import { fmtDateTime, toNum } from './format'

/* ─── DTO (명세 그대로) ─── */
// S-7 ShippingSettingResponse
export interface ShippingSettingDto {
  shipSeq: number
  shippingName: string
  shippingFee: number | string // BigDecimal
  freeShippingMin: number | string // BigDecimal — 0=항상 무료
  remoteExtraFee: number | string // BigDecimal
  shippingNotice: string
  updatedAt: string
  updatedBy: string
}

/* ─── 뷰모델 ─── */
export interface AdminShippingSetting {
  shipSeq: number
  shippingName: string
  shippingFee: number
  freeShippingMin: number
  remoteExtraFee: number
  shippingNotice: string
  updatedAt: string // 'YYYY-MM-DD HH:mm'
  updatedBy: string
}

/* ─── 매퍼 ─── */
export function toShippingSetting(d: ShippingSettingDto): AdminShippingSetting {
  return {
    shipSeq: d.shipSeq,
    shippingName: d.shippingName,
    shippingFee: toNum(d.shippingFee),
    freeShippingMin: toNum(d.freeShippingMin),
    remoteExtraFee: toNum(d.remoteExtraFee),
    shippingNotice: d.shippingNotice ?? '',
    updatedAt: fmtDateTime(d.updatedAt),
    updatedBy: d.updatedBy ?? '',
  }
}

// S-8 요청(전부 선택, 제공된 필드만 변경)
export interface UpdateShippingRequest {
  shippingFee?: number // ≥0
  freeShippingMin?: number // ≥0, 0=항상 무료
  remoteExtraFee?: number // ≥0
  shippingName?: string
  shippingNotice?: string
}

/* ─── API ─── */
export function getShippingSetting(): Promise<ShippingSettingDto> {
  return adminGet<ShippingSettingDto>('/admin/settings/shipping')
}
export function updateShipping(body: UpdateShippingRequest): Promise<void> {
  return adminPatch<void>('/admin/settings/shipping', body)
}

/* ─── 훅 ─── */
export const shippingKeys = {
  detail: ['admin', 'shipping'] as const,
}

export function useShippingSetting() {
  return useQuery({
    queryKey: shippingKeys.detail,
    queryFn: getShippingSetting,
    select: toShippingSetting,
  })
}

export function useUpdateShipping() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateShipping,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shippingKeys.detail })
    },
  })
}
