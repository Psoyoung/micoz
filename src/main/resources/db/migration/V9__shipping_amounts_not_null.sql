-- =====================================================================
-- O-T1 (D2-i): 배송 설정 금액 3필드 NOT NULL 제약
-- =====================================================================
-- 근거: OrderAmountCalculator가 shipping_fee/free_shipping_min/remote_extra_fee를
--       null-guard 없이 사용(주문 금액 계산). 세 필드가 null이면 전 주문 생성이 NPE.
--       컬럼 레벨 NOT NULL로 null 진입을 구조적으로 영구 차단(심층 방어의 1차선).
-- 전제: 세 컬럼은 V1에서 DEFAULT 0, V7 시드 단일행이 이미 non-null.
--       (마이그레이션 전 사전점검: mst_shipping에서 세 필드 NULL 행 count = 0 확인 완료)
-- 계산기 fail-fast(D2-ii)는 애플리케이션 레벨 2차선으로 병행(OrderAmountCalculator).

ALTER TABLE mst_shipping ALTER COLUMN shipping_fee      SET NOT NULL;
ALTER TABLE mst_shipping ALTER COLUMN free_shipping_min SET NOT NULL;
ALTER TABLE mst_shipping ALTER COLUMN remote_extra_fee  SET NOT NULL;
