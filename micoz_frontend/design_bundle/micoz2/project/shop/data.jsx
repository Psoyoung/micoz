// MICOZ — 데이터 모델
// 모든 제품은 그라디언트 색상 블록으로 분위기 표현

const PRODUCTS = [
  {
    id: 'p1',
    name: '비온',
    nameEn: 'BIEON Essence',
    line: '비온 라인',
    category: '에센스',
    desc: '깊은 밤 피어나는 보라색 꽃잎의 정수. 28일의 발효를 담은 시그니처 에센스.',
    price: 138000,
    options: [
      { id: 'o1', label: '50ml', price: 138000 },
      { id: 'o2', label: '100ml', price: 248000 },
      { id: 'o3', label: '리필 50ml', price: 118000 },
    ],
    grad: 'linear-gradient(155deg, #3a2e58 0%, #4d3470 45%, #9a7fb8 100%)',
    accent: '#9a7fb8',
    badge: 'BEST',
  },
  {
    id: 'p2',
    name: '제린 세럼',
    nameEn: 'JERIN Serum',
    line: '제린 라인',
    category: '세럼',
    desc: '한 방울에 담은 일곱 가지 한방 추출물. 묵직한 텍스처와 가벼운 흡수.',
    price: 168000,
    options: [
      { id: 'o1', label: '30ml', price: 168000 },
      { id: 'o2', label: '50ml', price: 258000 },
    ],
    grad: 'linear-gradient(165deg, #2d2347 0%, #3a2552 50%, #6b4d8f 100%)',
    accent: '#6b4d8f',
    badge: 'NEW',
  },
  {
    id: 'p3',
    name: '루안 크림',
    nameEn: 'LUAN Cream',
    line: '루안 라인',
    category: '크림',
    desc: '벨벳처럼 감기는 마무리. 밤사이 피부의 결을 다듬어주는 야간 크림.',
    price: 198000,
    options: [
      { id: 'o1', label: '50ml', price: 198000 },
      { id: 'o2', label: '75ml', price: 278000 },
    ],
    grad: 'linear-gradient(140deg, #352a50 0%, #4d3470 60%, #c4b0d8 100%)',
    accent: '#c4b0d8',
  },
  {
    id: 'p4',
    name: '단아 토너',
    nameEn: 'DANA Toner',
    line: '단아 라인',
    category: '토너',
    desc: '맑고 정제된 첫 단계. 미네랄 워터 베이스의 가벼운 토너.',
    price: 78000,
    options: [
      { id: 'o1', label: '150ml', price: 78000 },
      { id: 'o2', label: '300ml', price: 138000 },
    ],
    grad: 'linear-gradient(170deg, #4d3470 0%, #9a7fb8 50%, #e8d8f0 100%)',
    accent: '#e8d8f0',
  },
  {
    id: 'p5',
    name: '여원 클렌저',
    nameEn: 'YEOWON Cleanser',
    line: '여원 라인',
    category: '클렌징',
    desc: '하루의 마무리를 위한 부드러운 거품. 한방 추출의 깊이 있는 향.',
    price: 58000,
    options: [
      { id: 'o1', label: '180ml', price: 58000 },
    ],
    grad: 'linear-gradient(150deg, #3a2e58 0%, #6b4d8f 100%)',
    accent: '#6b4d8f',
  },
  {
    id: 'p6',
    name: '소단 마스크',
    nameEn: 'SODAN Mask',
    line: '소단 라인',
    category: '마스크',
    desc: '주 1회의 의식. 진한 보랏빛 컴파운드가 피부에 머물며 회복을 돕습니다.',
    price: 88000,
    options: [
      { id: 'o1', label: '120ml', price: 88000 },
      { id: 'o2', label: '5팩 세트', price: 38000 },
    ],
    grad: 'linear-gradient(160deg, #2d2347 0%, #352a50 40%, #4d3470 100%)',
    accent: '#4d3470',
    badge: 'LIMITED',
  },
  {
    id: 'p7',
    name: '청아 미스트',
    nameEn: 'CHEONGA Mist',
    line: '청아 라인',
    category: '미스트',
    desc: '하루 중 어느 순간이라도. 가벼운 수분의 막을 입혀줍니다.',
    price: 48000,
    options: [{ id: 'o1', label: '80ml', price: 48000 }],
    grad: 'linear-gradient(180deg, #6b4d8f 0%, #c4b0d8 60%, #f5edf7 100%)',
    accent: '#c4b0d8',
  },
  {
    id: 'p8',
    name: '아담 아이크림',
    nameEn: 'ADAM Eye',
    line: '아담 라인',
    category: '아이케어',
    desc: '눈가를 위한 가장 섬세한 한 방울. 농축된 텍스처.',
    price: 128000,
    options: [{ id: 'o1', label: '20ml', price: 128000 }],
    grad: 'linear-gradient(155deg, #352a50 0%, #3a2552 50%, #9a7fb8 100%)',
    accent: '#9a7fb8',
  },
];

const CATEGORIES = [
  { id: 'all', name: '전체', count: 24 },
  { id: 'essence', name: '에센스', count: 4 },
  { id: 'serum', name: '세럼', count: 5 },
  { id: 'cream', name: '크림', count: 6 },
  { id: 'toner', name: '토너', count: 3 },
  { id: 'mask', name: '마스크 · 스페셜', count: 4 },
  { id: 'cleanser', name: '클렌징', count: 2 },
];

const COLLECTIONS = [
  {
    id: 'c1',
    title: '비온',
    sub: 'BIEON',
    desc: '깊은 밤의 정수, 28일의 발효',
    grad: 'linear-gradient(155deg, #2d2347 0%, #3a2e58 50%, #6b4d8f 100%)',
  },
  {
    id: 'c2',
    title: '제린',
    sub: 'JERIN',
    desc: '일곱 가지 한방, 한 방울의 균형',
    grad: 'linear-gradient(165deg, #352a50 0%, #4d3470 60%, #9a7fb8 100%)',
  },
  {
    id: 'c3',
    title: '루안',
    sub: 'LUAN',
    desc: '벨벳의 마무리, 밤의 의식',
    grad: 'linear-gradient(140deg, #3a2e58 0%, #6b4d8f 50%, #c4b0d8 100%)',
  },
];

const won = (n) => '₩ ' + n.toLocaleString('ko-KR');

window.MICOZ_DATA = { PRODUCTS, CATEGORIES, COLLECTIONS, won };
