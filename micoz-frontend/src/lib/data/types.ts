// MICOZ 도메인 뷰모델 타입
// 26테이블 1:1 미러링이 아니라 "화면이 쓰는 단위"로 묶는다.
// 감사컬럼(i_user/u_user 등)·use_yn 은 기본 제외, admin 표시에 필요한 날짜만 선택 포함(*표시).
// `presentational` = 스키마에 없는 화면 전용 필드(원본 목업 값 보존), `derived` = 집계 파생 필드.

import type {
  ProductStatus,
  ImageType,
  UserStatus,
  OrderStatus,
  OrderItemStatus,
  PaymentType,
  PaymentStatus,
  ShippingStatus,
  ReturnType,
  ReturnStatus,
  ReturnReasonType,
  CouponType,
  CouponStatus,
  PointType,
  InquiryStatus,
  InquiryType,
  BannerType,
} from './enums'

/* ═══════════════════════════════════════════════════════════
 * 상품  (출처: mst_product · mst_product_option · mst_product_image · mst_product_label)
 * ═══════════════════════════════════════════════════════════ */

// mst_product_option
export interface ProductOption {
  id: number // option_seq
  name: string // option_name
  price: number // final_price
  stockQty?: number // stock_qty (쇼핑몰 목업엔 없음)
  sortOrder?: number
}

// mst_product_image
export interface ProductImage {
  id: number // image_seq
  type: ImageType // image_type
  url: string // image_url
  alt?: string // image_alt
  sortOrder?: number
}

// 상세 단위. ProductSummary 는 카드용 부분집합.
export interface Product {
  id: number // product_seq  (목업 'p1' → 1)
  code: string // 'p1' 등 표시코드 보존 (쇼핑몰 목업 id)
  name: string // product_name
  nameEn?: string // presentational (스키마 외)
  line?: string // presentational — 브랜드 라인 (스키마 외, 보강 후보)
  categoryName: string // category_seq → 이름 (목업은 이름 문자열)
  basePrice: number // base_price
  shortDesc: string // short_desc
  status?: ProductStatus // product_status (쇼핑몰 목업엔 없음)
  options: ProductOption[]
  labels: string[] // map_product_label → 라벨명 (BEST/NEW/LIMITED)
  // 상세 페이지용 (쇼핑몰 목업엔 없음, 이식 단계에서 채움)
  detailDesc?: string // detail_desc
  ingredientInfo?: string // ingredient_info
  usageInfo?: string // usage_info
  images?: ProductImage[]
  // presentational — 그라디언트 병 비주얼 (스키마 외)
  grad: string
  accent: string
}

export type ProductSummary = Pick<
  Product,
  'id' | 'code' | 'name' | 'nameEn' | 'line' | 'categoryName' | 'basePrice' | 'labels' | 'grad' | 'accent'
>

// mst_product_label
export interface ProductLabel {
  id: number // label_seq
  name: string // label_name
}

// mst_category (쇼핑몰 노출 단위)
export interface StorefrontCategory {
  slug: string // url_slug (목업 id 'all'/'essence' …)
  name: string // category_name
  productCount: number // derived (목업 count)
}

// 쇼핑몰 메인 에디토리얼 컬렉션 — mst_banner 근사이나 sub/tag/body 등 추가 필드 보유 → 별도 presentational 타입
export interface Collection {
  id: string
  title: string
  sub: string
  desc: string
  tag: string
  body: string
  grad: string // presentational
  img: string // image_url
}

/* ═══════════════════════════════════════════════════════════
 * 장바구니  (출처: dat_cart + 상품/옵션 조인) — 런타임 전용, 시드 없음
 * ═══════════════════════════════════════════════════════════ */
export interface CartItem {
  cartId: string // `${productId}-${optionId}`
  product: ProductSummary
  option: ProductOption
  quantity: number
}

/* ═══════════════════════════════════════════════════════════
 * 회원  (출처: mst_user · mst_user_grade · mst_user_address)
 * ═══════════════════════════════════════════════════════════ */

// 관리자 회원목록 행 (mst_user + 집계)
export interface MemberListRow {
  id: number // user_seq (목업 'M-24831' → 24831)
  code: string // 'M-24831' 표시코드 보존
  name: string // user_name
  email: string
  phone: string
  gradeName: string // mst_user_grade.grade_name (목업 '전무' 등)
  status: UserStatus // user_status
  joinedDate: string // * i_date (가입일)
  orderCount: number // derived
  totalSpend: number // derived
  lastBuyDate: string // derived
}

// 회원 상세 (mst_user + grade + address) — 시드 없음, 이식 단계에서 채움
export interface Member {
  id: number
  code: string
  name: string
  email: string
  phone: string
  birthDate?: string // birth_date
  gradeName: string
  status: UserStatus
  pointBalance: number // point_balance
  zipCode?: string
  address?: string
  addressDetail?: string
  joinedDate: string // * i_date
  addresses?: UserAddress[]
}

// mst_user_grade
export interface UserGrade {
  name: string // grade_name
  code?: string // grade_code (목업엔 없음)
  pointRate?: number // point_rate (목업엔 없음)
  sortOrder?: number
  minSpend: number // presentational — 등급 기준 구매액 (스키마 외)
  color: string // presentational
  memberCount: number // derived (목업 count)
}

// mst_user_address — 시드 없음
export interface UserAddress {
  id: number // address_seq
  addressName?: string // address_name (집/회사)
  recipientName: string // recipient_name
  recipientPhone: string // recipient_phone
  zipCode: string
  address: string
  addressDetail?: string
  isDefault: boolean // default_yn → boolean
}

/* ═══════════════════════════════════════════════════════════
 * 주문  (출처: dat_order · dat_order_item · dat_order_payment · dat_order_shipping)
 * ═══════════════════════════════════════════════════════════ */

// 관리자 주문목록 행
export interface OrderListRow {
  orderNo: string // order_no (목업 'O-260520-0421')
  orderDate: string // order_date
  customerName: string // user 조인
  itemCount: number // derived (주문 상품 종 수)
  finalAmount: number // final_amount
  paymentType: PaymentType // 목업 '카드'/'계좌이체'/'간편결제' → 코드
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus // '환불' 파생을 위해 함께 보존
  shippingStatus: ShippingStatus | null // 취소/반품 주문은 null (deriveOrderShippingDisplay)
}

// 주문 상세 합성 — 원본은 런타임 생성이라 시드 없음, 이식 단계에서 처리
export interface Order {
  orderNo: string
  orderDate: string
  orderStatus: OrderStatus
  shippingFee: number
  couponDiscount: number
  pointUsed: number
  totalDiscount: number
  finalAmount: number
  pointToEarn: number
  items: OrderItem[]
  payment: OrderPayment
  shipping: OrderShipping
}

// dat_order_item
export interface OrderItem {
  id: number // item_seq
  productId: number // product_seq
  optionId?: number // option_seq
  productCode?: string // 스냅샷
  productName: string // 스냅샷
  optionName?: string // 스냅샷
  unitPrice: number
  quantity: number
  itemAmount: number
  itemStatus: OrderItemStatus
}

// dat_order_payment
export interface OrderPayment {
  paymentType: PaymentType
  paymentStatus: PaymentStatus
  paidAmount: number
  cardCompany?: string
  cardNoMasked?: string
  installment?: number
  approvalNo?: string
  paidDate?: string
}

// dat_order_shipping
export interface OrderShipping {
  recipientName: string
  recipientPhone: string
  zipCode: string
  address: string
  addressDetail?: string
  shippingMemo?: string
  trackingNo?: string
  shippingStatus: ShippingStatus
  shippedDate?: string
  deliveredDate?: string
}

/* ═══════════════════════════════════════════════════════════
 * 반품 / 교환 / 취소  (출처: dat_return · dat_return_item)
 * ═══════════════════════════════════════════════════════════ */

// 목업이 단일 상품으로 평면화되어 있어 상품 필드를 직접 보유.
// dat_return_item 정규화(다상품)는 이식 단계로 미룸.
export interface ReturnRequest {
  returnNo: string // return_no
  orderNo: string // 원 주문 order_no
  customerName: string
  type: ReturnType // return_type
  status: ReturnStatus // return_status
  reasonType: ReturnReasonType // return_reason_type
  reason: string // return_reason
  productName: string // (평면화) 대상 상품명
  optionName: string // (평면화) 옵션명
  quantity: number
  refundAmount: number // refund_amount
  returnShippingFee: number // return_shipping_fee
  pickupZipCode: string // pickup_zip_code
  pickupAddress: string // pickup_address
  pickupPhone: string // pickup_phone
  requestedDate: string // requested_date
  completedDate: string | null // completed_date
}

// dat_return_item — 시드 없음(평면화 사용)
export interface ReturnItem {
  id: number // return_item_seq
  itemSeq: number // 원 주문상품 item_seq
  quantity: number
  exchangeOptionSeq?: number
}

/* ═══════════════════════════════════════════════════════════
 * 1:1 문의  (출처: dat_inquiry · dat_inquiry_reply) — 시드 없음(인라인, 이식 단계)
 * ═══════════════════════════════════════════════════════════ */
export interface Inquiry {
  inquiryNo: string // inquiry_no
  inquiryType: InquiryType
  title: string
  content: string
  productSeq?: number
  orderSeq?: number
  status: InquiryStatus // inquiry_status
  isPrivate: boolean // private_yn → boolean
  answeredDate?: string
  replies: InquiryReply[]
}

export interface InquiryReply {
  id: number // reply_seq
  adminSeq: number // admin_seq
  content: string
  createdDate: string // * i_date
}

/* ═══════════════════════════════════════════════════════════
 * 리뷰  (출처: dat_review) — 시드 없음
 * ═══════════════════════════════════════════════════════════ */
export interface Review {
  id: number // review_seq
  productSeq: number
  orderSeq?: number
  rating: number // 1~5
  title?: string
  content: string
  imageUrls: string[] // image_urls (JSON 배열)
  createdDate: string // * i_date
}

/* ═══════════════════════════════════════════════════════════
 * 마케팅 / 설정  (출처: mst_coupon · map_user_coupon · his_point · mst_banner · mst_shipping)
 * 모두 시드 없음 — 이식 단계에서 채움
 * ═══════════════════════════════════════════════════════════ */
// 스키마 정렬 — Coupon·UserCoupon·PointHistory 는 미이식 도메인(쿠폰·포인트 화면 없음). API/후속 화면용 보존.
export interface Coupon {
  id: number // coupon_seq
  code: string // coupon_code
  name: string // coupon_name
  type: CouponType // coupon_type
  discountValue: number // discount_value
  minOrderAmount: number // min_order_amount
  maxDiscount?: number // max_discount
  validDays?: number // valid_days
  description?: string
}

export interface UserCoupon {
  id: number // user_coupon_seq
  couponSeq: number
  status: CouponStatus // coupon_status
  issuedDate: string
  expireDate?: string
  usedDate?: string
  orderSeq?: number
}

export interface PointHistory {
  id: number // point_seq
  type: PointType // point_type
  amount: number // point_amount (적립=양수/사용=음수)
  balanceAfter: number // balance_after
  reason?: string
  orderSeq?: number
  expireDate?: string
}

export interface Banner {
  id: number // banner_seq
  type: BannerType // banner_type
  title: string
  description?: string
  imageUrl: string // image_url
  linkUrl?: string // link_url
  sortOrder: number
  isDisplayed: boolean // display_yn → boolean
}

export interface ShippingPolicy {
  shippingName: string // shipping_name
  shippingFee: number // shipping_fee
  freeShippingMin: number // free_shipping_min
  remoteExtraFee: number // remote_extra_fee
  shippingNotice: string // shipping_notice
}

/* ═══════════════════════════════════════════════════════════
 * 관리자 카테고리 / 상품 (관리자 시점)
 * ═══════════════════════════════════════════════════════════ */

// mst_category 를 self-ref 트리로 구성 (admin CategoriesView)
export interface CategoryTreeNode {
  id: string // url_slug (목업 'c-skin')
  name: string // category_name
  level: number // category_level (1=대분류, 2=중분류) — 목업 0-based 를 +1 시프트해 정렬
  productCount: number // derived
  isVisible: boolean // display_yn → boolean (목업 visible)
  children?: CategoryTreeNode[]
}

// 관리자 상품목록 행 (mst_product + option + category)
export interface AdminProductOption {
  name: string // option_name
  price: number // final_price
  stockQty: number // stock_qty
  sortOrder: number
}

export interface AdminProductRow {
  sku: string // product_code
  name: string // product_name
  line: string // presentational — 브랜드 라인 (스키마 외)
  categoryName: string
  price: number // base_price
  stockQty: number // derived (옵션 재고 합)
  status: ProductStatus // product_status
  updatedDate: string // * u_date
  sales30: number // derived (최근 30일 판매량)
  options?: AdminProductOption[]
}

/* ═══════════════════════════════════════════════════════════
 * 관리자 대시보드 — 스키마 외 집계(리포팅 전용, 출처 테이블 없음)
 * ═══════════════════════════════════════════════════════════ */
export interface DailySales {
  day: number
  amount: number
  orders: number
}

export interface TopProduct {
  name: string
  units: number
  amount: number
}

// ADMIN_USER — mst_user(role=ADMIN) 근사, 표시 전용
export interface AdminProfile {
  name: string
  role: string
  email: string
  lastLogin: string
}
