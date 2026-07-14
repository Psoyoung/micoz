// MICOZ Admin — mock data

const ADMIN_USER = {
  name: '김지은',
  role: '슈퍼관리자',
  email: 'jieun.kim@micoz.kr',
  lastLogin: '2026-05-20 09:14',
};

// ─── 회원 ─────────────────────────────────────────────
const MEMBERS = [
  { id: 'M-24831', name: '박서영', email: 'seoyoung.p@gmail.com', phone: '010-2841-9921', grade: '전무', joined: '2023-04-12', orders: 28, spend: 4280000, status: '활성', lastBuy: '2026-05-18' },
  { id: 'M-24830', name: '이하늘', email: 'haneul.lee@naver.com',  phone: '010-7720-3318', grade: '상무',  joined: '2023-08-21', orders: 16, spend: 2140000, status: '활성', lastBuy: '2026-05-19' },
  { id: 'M-24829', name: '최민지', email: 'minji.choi@kakao.com',  phone: '010-3091-8842', grade: '마스터', joined: '2024-01-09', orders: 12, spend: 1480000, status: '활성', lastBuy: '2026-05-17' },
  { id: 'M-24828', name: '정유나', email: 'yuna.j@daum.net',       phone: '010-9921-4408', grade: '마스터', joined: '2024-02-28', orders: 9,  spend: 980000,  status: '활성', lastBuy: '2026-05-15' },
  { id: 'M-24827', name: '한지원', email: 'jiwon.han@gmail.com',    phone: '010-5512-7700', grade: '셀러', joined: '2024-06-04', orders: 6, spend: 612000,  status: '활성', lastBuy: '2026-05-14' },
  { id: 'M-24826', name: '오나래', email: 'narae.o@gmail.com',      phone: '010-3380-1199', grade: '셀러', joined: '2024-09-11', orders: 4, spend: 412000,  status: '휴면', lastBuy: '2025-12-02' },
  { id: 'M-24825', name: '윤소희', email: 'sohee.yoon@naver.com',   phone: '010-8841-2230', grade: '회원',  joined: '2025-01-18', orders: 2, spend: 198000,  status: '활성', lastBuy: '2026-04-29' },
  { id: 'M-24824', name: '임채린', email: 'chaerin.lim@kakao.com',  phone: '010-2204-7711', grade: '상무',    joined: '2023-11-30', orders: 14, spend: 1820000, status: '활성', lastBuy: '2026-05-19' },
  { id: 'M-24823', name: '신예진', email: 'yejin.shin@gmail.com',   phone: '010-7012-3399', grade: '회원',  joined: '2025-03-22', orders: 1, spend: 78000,   status: '활성', lastBuy: '2026-05-08' },
  { id: 'M-24822', name: '강주아', email: 'jua.kang@daum.net',      phone: '010-9982-1144', grade: '마스터',   joined: '2024-04-15', orders: 11, spend: 1340000, status: '활성', lastBuy: '2026-05-20' },
  { id: 'M-24821', name: '문서아', email: 'seoa.moon@gmail.com',    phone: '010-3344-2200', grade: '전무',   joined: '2022-12-04', orders: 34, spend: 5120000, status: '활성', lastBuy: '2026-05-20' },
  { id: 'M-24820', name: '백수민', email: 'sumin.baek@naver.com',   phone: '010-1198-7700', grade: '셀러', joined: '2024-10-02', orders: 5, spend: 498000,  status: '탈퇴신청', lastBuy: '2026-03-11' },
];

const GRADE_TIERS = [
  { name: '전무',   min: 4000000, color: '#3a2552', count: 18 },
  { name: '상무',   min: 1500000, color: '#6b4d8f', count: 64 },
  { name: '마스터', min: 800000,  color: '#b89968', count: 142 },
  { name: '셀러',   min: 300000,  color: '#9aa0a6', count: 318 },
  { name: '회원',   min: 0,       color: '#c4b0d8', count: 2429 },
];

// ─── 카테고리 트리 ─────────────────────────────────────
const CATEGORIES_TREE = [
  { id: 'c-skin', name: '스킨케어', depth: 0, productCount: 42, visible: true, children: [
    { id: 'c-skin-essence', name: '에센스 · 앰플', depth: 1, productCount: 14, visible: true },
    { id: 'c-skin-serum',   name: '세럼',          depth: 1, productCount: 11, visible: true },
    { id: 'c-skin-cream',   name: '크림 · 모이스처', depth: 1, productCount: 9,  visible: true },
    { id: 'c-skin-toner',   name: '토너 · 미스트',  depth: 1, productCount: 8,  visible: true },
  ]},
  { id: 'c-clean', name: '클렌징', depth: 0, productCount: 14, visible: true, children: [
    { id: 'c-clean-foam', name: '폼 · 젤', depth: 1, productCount: 6, visible: true },
    { id: 'c-clean-oil',  name: '오일 · 밤', depth: 1, productCount: 5, visible: true },
    { id: 'c-clean-pad',  name: '클렌징 패드', depth: 1, productCount: 3, visible: false },
  ]},
  { id: 'c-spec', name: '스페셜케어', depth: 0, productCount: 18, visible: true, children: [
    { id: 'c-spec-mask',  name: '마스크 팩', depth: 1, productCount: 9, visible: true },
    { id: 'c-spec-eye',   name: '아이케어',  depth: 1, productCount: 5, visible: true },
    { id: 'c-spec-neck',  name: '넥 · 데콜테', depth: 1, productCount: 4, visible: true },
  ]},
  { id: 'c-set',  name: '세트 · 키트',  depth: 0, productCount: 11, visible: true },
  { id: 'c-mens', name: '맨즈 라인',    depth: 0, productCount: 7,  visible: true },
  { id: 'c-disc', name: '아카이브 · 단종', depth: 0, productCount: 9, visible: false },
];

// ─── 상품 (관리자 시점) ──────────────────────────────────
const ADMIN_PRODUCTS = [
  { sku: 'BIE-ES-050', name: '비온 에센스 50ml',        line: '비온', category: '에센스', price: 138000, stock: 412, status: '판매중', updated: '2026-05-12', sales30: 286,
    options: [
      { name: '50ml',      price: 138000, stock: 412, sort: 0 },
      { name: '100ml',     price: 248000, stock: 188, sort: 1 },
      { name: '리필 50ml', price: 118000, stock:  76, sort: 2 },
    ] },
  { sku: 'BIE-ES-100', name: '비온 에센스 100ml',       line: '비온', category: '에센스', price: 248000, stock: 188, status: '판매중', updated: '2026-05-12', sales30: 124 },
  { sku: 'BIE-RE-050', name: '비온 에센스 리필 50ml',    line: '비온', category: '에센스', price: 118000, stock:  76, status: '재고부족', updated: '2026-05-08', sales30: 92  },
  { sku: 'JER-SE-030', name: '제린 세럼 30ml',          line: '제린', category: '세럼',  price: 168000, stock: 240, status: '판매중', updated: '2026-05-15', sales30: 198 },
  { sku: 'JER-SE-050', name: '제린 세럼 50ml',          line: '제린', category: '세럼',  price: 258000, stock: 122, status: '판매중', updated: '2026-05-15', sales30: 84  },
  { sku: 'LUA-CR-050', name: '루안 크림 50ml',          line: '루안', category: '크림',  price: 198000, stock: 308, status: '판매중', updated: '2026-05-09', sales30: 156 },
  { sku: 'LUA-CR-075', name: '루안 크림 75ml',          line: '루안', category: '크림',  price: 278000, stock:  44, status: '재고부족', updated: '2026-05-09', sales30: 62 },
  { sku: 'DAN-TO-150', name: '단아 토너 150ml',         line: '단아', category: '토너',  price:  78000, stock: 522, status: '판매중', updated: '2026-04-28', sales30: 412 },
  { sku: 'DAN-TO-300', name: '단아 토너 300ml',         line: '단아', category: '토너',  price: 138000, stock: 218, status: '판매중', updated: '2026-04-28', sales30: 168 },
  { sku: 'YEO-CL-180', name: '여원 클렌저 180ml',       line: '여원', category: '클렌징', price:  58000, stock: 612, status: '판매중', updated: '2026-05-02', sales30: 528 },
  { sku: 'SOD-MS-120', name: '소단 마스크 120ml',       line: '소단', category: '마스크', price:  88000, stock:   0, status: '품절',   updated: '2026-05-18', sales30: 244 },
  { sku: 'SOD-MS-PK5', name: '소단 마스크 5팩 세트',     line: '소단', category: '마스크', price:  38000, stock: 184, status: '판매중', updated: '2026-05-18', sales30: 318 },
  { sku: 'CHE-MI-080', name: '청아 미스트 80ml',        line: '청아', category: '미스트', price:  48000, stock: 388, status: '판매중', updated: '2026-04-22', sales30: 276 },
  { sku: 'ADA-EY-020', name: '아담 아이크림 20ml',      line: '아담', category: '아이케어', price: 128000, stock: 162, status: '판매중', updated: '2026-05-11', sales30: 108 },
  { sku: 'BIE-KT-SET', name: '비온 디스커버리 키트',     line: '비온', category: '세트',  price: 168000, stock:  92, status: '판매중', updated: '2026-05-06', sales30: 142 },
  { sku: 'WIN-LE-001', name: '윈터 에디션 — 단종',      line: '아카이브', category: '세트', price: 198000, stock:  18, status: '판매중지', updated: '2026-01-14', sales30: 0  },
];

// ─── 주문 ─────────────────────────────────────────────
const ORDERS = [
  { id: 'O-260520-0421', date: '2026-05-20 14:22', customer: '문서아', items: 3, amount: 484000, payment: '카드', status: '결제완료', shipping: '준비중' },
  { id: 'O-260520-0420', date: '2026-05-20 13:48', customer: '강주아', items: 2, amount: 296000, payment: '계좌이체', status: '입금대기', shipping: '대기'   },
  { id: 'O-260520-0419', date: '2026-05-20 12:31', customer: '박서영', items: 5, amount: 812000, payment: '카드', status: '결제완료', shipping: '배송중'   },
  { id: 'O-260520-0418', date: '2026-05-20 11:09', customer: '한지원', items: 1, amount: 138000, payment: '카드', status: '결제완료', shipping: '준비중'   },
  { id: 'O-260520-0417', date: '2026-05-20 10:54', customer: '임채린', items: 2, amount: 326000, payment: '간편결제', status: '결제완료', shipping: '준비중' },
  { id: 'O-260520-0416', date: '2026-05-20 09:32', customer: '신예진', items: 1, amount:  78000, payment: '카드', status: '결제완료', shipping: '배송완료' },
  { id: 'O-260519-0418', date: '2026-05-19 22:15', customer: '이하늘', items: 4, amount: 538000, payment: '카드', status: '결제완료', shipping: '배송중'   },
  { id: 'O-260519-0417', date: '2026-05-19 20:41', customer: '최민지', items: 2, amount: 246000, payment: '간편결제', status: '결제완료', shipping: '배송중' },
  { id: 'O-260519-0416', date: '2026-05-19 18:22', customer: '정유나', items: 1, amount: 198000, payment: '카드', status: '결제완료', shipping: '배송완료' },
  { id: 'O-260519-0415', date: '2026-05-19 17:58', customer: '윤소희', items: 3, amount: 264000, payment: '카드', status: '취소', shipping: '취소'   },
  { id: 'O-260519-0414', date: '2026-05-19 16:11', customer: '문서아', items: 2, amount: 416000, payment: '카드', status: '결제완료', shipping: '배송완료' },
  { id: 'O-260519-0413', date: '2026-05-19 14:02', customer: '백수민', items: 1, amount:  88000, payment: '카드', status: '환불', shipping: '반품완료' },
  { id: 'O-260519-0412', date: '2026-05-19 11:39', customer: '한지원', items: 2, amount: 196000, payment: '간편결제', status: '결제완료', shipping: '배송완료' },
  { id: 'O-260518-0419', date: '2026-05-18 21:48', customer: '박서영', items: 6, amount: 924000, payment: '카드', status: '결제완료', shipping: '배송완료' },
];

// ─── 매출 ─────────────────────────────────────────────
// 30일치 일매출
const SALES_30D = [
  18, 22, 19, 28, 31, 24, 17,
  20, 26, 33, 29, 36, 41, 34,
  27, 32, 38, 35, 42, 48, 39,
  31, 36, 44, 51, 47, 52, 58, 61, 64
].map((v, i) => ({
  day: i + 1,
  amount: v * 100000 + Math.round(Math.sin(i) * 80000),
  orders: Math.round(v * 1.4 + Math.cos(i) * 3),
}));

const SALES_BY_LINE = [
  { line: '비온',  amount: 142800000, share: 32 },
  { line: '제린',  amount:  98400000, share: 22 },
  { line: '루안',  amount:  76200000, share: 17 },
  { line: '단아',  amount:  44600000, share: 10 },
  { line: '여원',  amount:  31400000, share:  7 },
  { line: '소단',  amount:  26800000, share:  6 },
  { line: '기타',  amount:  26800000, share:  6 },
];

const SALES_BY_CHANNEL = [
  { ch: '자사몰 (PC)',   amount: 184200000, color: '#3a2552' },
  { ch: '자사몰 (Mobile)', amount: 142800000, color: '#6b4d8f' },
  { ch: '카카오톡 채널',  amount:  68400000, color: '#9a7fb8' },
  { ch: '제휴 부티크',    amount:  42600000, color: '#c4b0d8' },
  { ch: '오프라인 팝업',  amount:  10000000, color: '#e8d8f0' },
];

const TOP_PRODUCTS_30D = [
  { name: '여원 클렌저 180ml',   units: 528, amount: 30624000 },
  { name: '단아 토너 150ml',     units: 412, amount: 32136000 },
  { name: '소단 마스크 5팩',     units: 318, amount: 12084000 },
  { name: '비온 에센스 50ml',    units: 286, amount: 39468000 },
  { name: '청아 미스트 80ml',    units: 276, amount: 13248000 },
];

// ─── 활동 로그 ─────────────────────────────────────────
const ACTIVITY = [
  { t: '14:22', who: '시스템',  msg: '신규 주문 O-260520-0421 (₩484,000) 결제 완료' },
  { t: '14:08', who: '김지은',  msg: '상품 "소단 마스크 120ml" 재고 상태 "품절"로 변경' },
  { t: '13:51', who: '시스템',  msg: '회원 M-24820 탈퇴 신청 접수' },
  { t: '13:32', who: '이수영',  msg: '카테고리 "맨즈 라인" 정렬 순서 수정' },
  { t: '12:14', who: '시스템',  msg: '일일 매출 리포트 생성 (2026-05-19)' },
  { t: '11:02', who: '김지은',  msg: '상품 가격 일괄 조정 — 비온 라인 5개 SKU' },
  { t: '10:18', who: '이수영',  msg: '쿠폰 "MAY-SPECIAL-15" 발행 (1,420명)' },
  { t: '09:14', who: '시스템',  msg: '관리자 로그인 — 김지은 (192.168.1.42)' },
];

// ─── 반품 · 교환 ───────────────────────────────────────
// type: 취소/교환/반품 (CANCEL/EXCHANGE/RETURN)
// status: 신청/승인/회수중/검수중/완료/반려 (REQUESTED/APPROVED/PICKUP/INSPECTING/COMPLETED/REJECTED)
// reasonType: 단순변심/불량/오배송/기타 (CHANGE_MIND/DEFECT/WRONG_DELIVERY/OTHER)
const RETURNS = [
  { returnNo: 'R-260520-0012', orderNo: 'O-260519-0413', customer: '백수민', type: '반품', status: '검수중',
    reasonType: '단순변심', reason: '향이 생각했던 것과 달라 반품 신청합니다.',
    product: '소단 마스크 120ml', option: '120ml', qty: 1,
    refundAmount: 88000, returnShippingFee: 6000,
    pickupZip: '06236', pickupAddress: '서울 강남구 테헤란로 152', pickupPhone: '010-1198-7700',
    requestedDate: '2026-05-20 09:41', completedDate: null },
  { returnNo: 'R-260519-0011', orderNo: 'O-260518-0419', customer: '박서영', type: '교환',  status: '회수중',
    reasonType: '불량', reason: '펌프 용기가 눌리지 않습니다. 동일 옵션으로 교환 원합니다.',
    product: '비온 에센스 50ml', option: '50ml', qty: 1,
    refundAmount: 0, returnShippingFee: 0,
    pickupZip: '04524', pickupAddress: '서울 중구 세종대로 110', pickupPhone: '010-2841-9921',
    requestedDate: '2026-05-19 18:02', completedDate: null },
  { returnNo: 'R-260519-0010', orderNo: 'O-260519-0415', customer: '윤소희', type: '취소',  status: '완료',
    reasonType: '단순변심', reason: '주문 실수로 취소합니다.',
    product: '단아 토너 150ml', option: '150ml', qty: 2,
    refundAmount: 156000, returnShippingFee: 0,
    pickupZip: '', pickupAddress: '', pickupPhone: '010-8841-2230',
    requestedDate: '2026-05-19 17:10', completedDate: '2026-05-19 17:40' },
  { returnNo: 'R-260518-0009', orderNo: 'O-260517-0388', customer: '임채린', type: '반품',  status: '신청',
    reasonType: '오배송', reason: '주문하지 않은 제품이 배송되었습니다.',
    product: '루안 크림 50ml', option: '50ml', qty: 1,
    refundAmount: 198000, returnShippingFee: 0,
    pickupZip: '03187', pickupAddress: '서울 종로구 종로 1', pickupPhone: '010-2204-7711',
    requestedDate: '2026-05-18 13:25', completedDate: null },
  { returnNo: 'R-260517-0008', orderNo: 'O-260515-0301', customer: '한지원', type: '반품',  status: '승인',
    reasonType: '단순변심', reason: '피부에 맞지 않아 반품합니다.',
    product: '제린 세럼 30ml', option: '30ml', qty: 1,
    refundAmount: 168000, returnShippingFee: 6000,
    pickupZip: '13529', pickupAddress: '경기 성남시 분당구 판교역로 235', pickupPhone: '010-5512-7700',
    requestedDate: '2026-05-17 10:48', completedDate: null },
  { returnNo: 'R-260516-0007', orderNo: 'O-260514-0276', customer: '오나래', type: '교환',  status: '반려',
    reasonType: '단순변심', reason: '색상 교환 요청 — 한정판으로 교환 불가 안내.',
    product: '소단 마스크 5팩 세트', option: '5팩 세트', qty: 1,
    refundAmount: 0, returnShippingFee: 0,
    pickupZip: '', pickupAddress: '', pickupPhone: '010-3380-1199',
    requestedDate: '2026-05-16 20:14', completedDate: '2026-05-17 09:02' },
];

const won = (n) => '₩' + n.toLocaleString('ko-KR');
const wonM = (n) => '₩' + (n / 1000000).toFixed(1) + 'M';

window.ADMIN_DATA = {
  ADMIN_USER, MEMBERS, GRADE_TIERS, CATEGORIES_TREE, ADMIN_PRODUCTS,
  ORDERS, RETURNS, SALES_30D, SALES_BY_LINE, SALES_BY_CHANNEL, TOP_PRODUCTS_30D,
  ACTIVITY, won, wonM,
};
