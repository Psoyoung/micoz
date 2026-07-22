// 관리자 회원·등급 — 출처: 원본 admin/admin-data.jsx MEMBERS·GRADE_TIERS (값 보존)
// id 'M-24831' → id:24831 + code:'M-24831' (D-2). status 한글 → UserStatus.
// 휴면→DORMANT, 탈퇴신청→WITHDRAW_REQUESTED (D-4).

import type { MemberListRow } from './types'

// 주의: MEMBERS 는 shop 마이페이지(current-user.ts)가 아직 사용 → A5 정리 대상 아님(유지).
//   관리자 GRADE_TIERS(등급관리 mock)는 미사용이라 제거함.
export const MEMBERS: MemberListRow[] = [
  { id: 24831, code: 'M-24831', name: '박서영', email: 'seoyoung.p@gmail.com', phone: '010-2841-9921', gradeName: '전무', joinedDate: '2023-04-12', orderCount: 28, totalSpend: 4280000, status: 'ACTIVE', lastBuyDate: '2026-05-18' },
  { id: 24830, code: 'M-24830', name: '이하늘', email: 'haneul.lee@naver.com', phone: '010-7720-3318', gradeName: '상무', joinedDate: '2023-08-21', orderCount: 16, totalSpend: 2140000, status: 'ACTIVE', lastBuyDate: '2026-05-19' },
  { id: 24829, code: 'M-24829', name: '최민지', email: 'minji.choi@kakao.com', phone: '010-3091-8842', gradeName: '마스터', joinedDate: '2024-01-09', orderCount: 12, totalSpend: 1480000, status: 'ACTIVE', lastBuyDate: '2026-05-17' },
  { id: 24828, code: 'M-24828', name: '정유나', email: 'yuna.j@daum.net', phone: '010-9921-4408', gradeName: '마스터', joinedDate: '2024-02-28', orderCount: 9, totalSpend: 980000, status: 'ACTIVE', lastBuyDate: '2026-05-15' },
  { id: 24827, code: 'M-24827', name: '한지원', email: 'jiwon.han@gmail.com', phone: '010-5512-7700', gradeName: '셀러', joinedDate: '2024-06-04', orderCount: 6, totalSpend: 612000, status: 'ACTIVE', lastBuyDate: '2026-05-14' },
  { id: 24826, code: 'M-24826', name: '오나래', email: 'narae.o@gmail.com', phone: '010-3380-1199', gradeName: '셀러', joinedDate: '2024-09-11', orderCount: 4, totalSpend: 412000, status: 'DORMANT', lastBuyDate: '2025-12-02' },
  { id: 24825, code: 'M-24825', name: '윤소희', email: 'sohee.yoon@naver.com', phone: '010-8841-2230', gradeName: '회원', joinedDate: '2025-01-18', orderCount: 2, totalSpend: 198000, status: 'ACTIVE', lastBuyDate: '2026-04-29' },
  { id: 24824, code: 'M-24824', name: '임채린', email: 'chaerin.lim@kakao.com', phone: '010-2204-7711', gradeName: '상무', joinedDate: '2023-11-30', orderCount: 14, totalSpend: 1820000, status: 'ACTIVE', lastBuyDate: '2026-05-19' },
  { id: 24823, code: 'M-24823', name: '신예진', email: 'yejin.shin@gmail.com', phone: '010-7012-3399', gradeName: '회원', joinedDate: '2025-03-22', orderCount: 1, totalSpend: 78000, status: 'ACTIVE', lastBuyDate: '2026-05-08' },
  { id: 24822, code: 'M-24822', name: '강주아', email: 'jua.kang@daum.net', phone: '010-9982-1144', gradeName: '마스터', joinedDate: '2024-04-15', orderCount: 11, totalSpend: 1340000, status: 'ACTIVE', lastBuyDate: '2026-05-20' },
  { id: 24821, code: 'M-24821', name: '문서아', email: 'seoa.moon@gmail.com', phone: '010-3344-2200', gradeName: '전무', joinedDate: '2022-12-04', orderCount: 34, totalSpend: 5120000, status: 'ACTIVE', lastBuyDate: '2026-05-20' },
  { id: 24820, code: 'M-24820', name: '백수민', email: 'sumin.baek@naver.com', phone: '010-1198-7700', gradeName: '셀러', joinedDate: '2024-10-02', orderCount: 5, totalSpend: 498000, status: 'WITHDRAW_REQUESTED', lastBuyDate: '2026-03-11' },
]
