// 주문 생성 — 데스크탑/모바일 체크아웃이 공유하는 Order 객체 빌더(클라이언트 목업).
// generateOrderNo + 금액/항목/결제/배송 구성. 실제 발급은 API 단계.
import { generateOrderNo, type Order, type CartItem } from '../../../lib/data'

export type ShippingInput = {
  recipientName: string
  recipientPhone: string
  zipCode: string
  address: string
  addressDetail?: string
  shippingMemo?: string
}

function orderDateString(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function buildOrder(params: {
  cart: CartItem[]
  pay: string // 'credit' | 'vbank'
  shipping: ShippingInput
  discount?: number // 회원 할인 등
  pointUsed?: number
  couponDiscount?: number
}): Order {
  const { cart, pay, shipping, discount = 0, pointUsed = 0, couponDiscount = 0 } = params
  const isCard = pay === 'credit'
  const sub = cart.reduce((s, i) => s + i.option.price * i.quantity, 0)
  const ship = sub >= 50000 ? 0 : 3000
  const totalDiscount = discount + pointUsed + couponDiscount
  const total = sub + ship - totalDiscount
  const earn = Math.floor(sub * 0.05)

  return {
    orderNo: generateOrderNo(),
    orderDate: orderDateString(),
    orderStatus: isCard ? 'PAID' : 'PENDING',
    shippingFee: ship,
    couponDiscount,
    pointUsed,
    totalDiscount,
    finalAmount: total,
    pointToEarn: earn,
    items: cart.map((it, i) => ({
      id: i + 1,
      productId: it.product.id,
      optionId: it.option.id,
      productName: it.product.name,
      optionName: it.option.name,
      unitPrice: it.option.price,
      quantity: it.quantity,
      itemAmount: it.option.price * it.quantity,
      itemStatus: 'NORMAL',
    })),
    payment: {
      paymentType: isCard ? 'CARD' : 'VBANK',
      paymentStatus: isCard ? 'PAID' : 'PENDING',
      paidAmount: total,
    },
    shipping: {
      recipientName: shipping.recipientName,
      recipientPhone: shipping.recipientPhone,
      zipCode: shipping.zipCode,
      address: shipping.address,
      addressDetail: shipping.addressDetail,
      shippingMemo: shipping.shippingMemo,
      shippingStatus: 'READY',
    },
  }
}
