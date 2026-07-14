-- =====================================================================
-- R-T4 (R-Q1): 반품 아이템 재입고 여부 (검수 단계 admin 판정, 감사 대상)
-- =====================================================================
-- DEFECT(하자)는 기본 재입고 제외(N), 그 외 기본 Y. admin이 검수 시 오버라이드.
-- 값(무엇)은 이 컬럼, 누가·언제는 검수 시 갱신되는 dat_return.u_user/u_date로 감사(§3.5).
-- null = 아직 검수 전(미판정).

ALTER TABLE dat_return_item ADD COLUMN restock_yn CHAR(1);
COMMENT ON COLUMN dat_return_item.restock_yn IS '재입고 여부 (Y/N, 검수 시 판정; DEFECT 기본 N·그 외 Y, admin 오버라이드)';
