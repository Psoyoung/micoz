-- =====================================================================
-- 배송 설정 단일행 시드 (mst_shipping)
-- =====================================================================
INSERT INTO mst_shipping (shipping_name, shipping_fee, free_shipping_min, remote_extra_fee, shipping_notice, i_user) VALUES
    ('기본 배송사', 3000, 50000, 3000, '평일 오후 2시 이전 주문 시 당일 출고됩니다.', 'SYSTEM');
