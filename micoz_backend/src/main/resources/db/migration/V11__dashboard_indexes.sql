-- =====================================================================
-- V11. 대시보드 집계 인덱스 (D-T3, FR-ADM-01)
-- =====================================================================
-- 근거: D-T1 EXPLAIN 실측 — 아래 집계 쿼리는 필터 컬럼에 지원 인덱스가 없어 Seq Scan
--       (dat_order는 기존 idx_dat_order_user_seq가 user_seq 선두라 order_date 시크 불가, full index scan).
-- 설계 규칙:
--   · 부분 인덱스: 쿼리의 등치 술어가 "고정 상수"(항상 같은 값) → WHERE로 구워 인덱스를 대상 행으로 축소.
--   · 복합 인덱스: 등치 컬럼이 "가변 값"(다른 값으로도 조회) → 인덱스 컬럼으로 둔다.
-- 주: 데이터 초기엔 플래너가 Seq Scan을 고를 수 있으나(소량), 누적 시 활용될 인덱스로 선반영한다.

-- 1) dat_order — 총매출/주문건수/추이. order_status ∈ 결제성사집합(고정) → 부분 인덱스 + order_date 범위 시크.
--    기존 idx_dat_order_user_seq(user_seq 선두)는 order_date 시크 불가라 별도 필요. 비결제성사(PENDING/CANCELED) 제외.
CREATE INDEX idx_dat_order_revenue ON dat_order (order_date)
    WHERE order_status IN ('PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'RETURNED');

-- 2) dat_return — 순매출 차감. return_type='RETURN' AND return_status='COMPLETED'(둘 다 고정) → 부분 인덱스.
--    RETURN·COMPLETED 행만 담아 completed_date 범위 시크. 취소/교환/미완료 반품 제외로 매우 컴팩트.
CREATE INDEX idx_dat_return_completed ON dat_return (completed_date)
    WHERE return_type = 'RETURN' AND return_status = 'COMPLETED';

-- 3) mst_user — 신규회원. user_role는 가변(CUSTOMER/ADMIN 등 다른 값으로도 카운트 가능) → 복합 (user_role, i_date).
--    선두 등치(user_role) + 후행 범위(i_date). 부분(WHERE user_role='CUSTOMER')은 CUSTOMER가 다수라 축소 효과 작음.
CREATE INDEX idx_mst_user_role_idate ON mst_user (user_role, i_date);

-- 4) dat_inquiry — 문의 KPI. inquiry_status는 가변(WAITING·ANSWERED 둘 다 조회) → 복합 (inquiry_status, answered_date).
--    avgResponse(ANSWERED + answered_date 범위) 완전 대응, waiting(WAITING count) 선두컬럼 대응.
CREATE INDEX idx_dat_inquiry_status_answered ON dat_inquiry (inquiry_status, answered_date);
