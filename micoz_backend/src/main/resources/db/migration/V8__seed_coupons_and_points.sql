-- =====================================================================
-- 쿠폰 마스터 3종 + alice 발급 쿠폰 2건 + alice 포인트 이력 3행
-- =====================================================================

-- 쿠폰 마스터 (PERCENT/FIXED)
INSERT INTO mst_coupon (coupon_code, coupon_name, coupon_type, discount_value,
                        min_order_amount, max_discount, valid_days, description, use_yn, i_user) VALUES
    ('WELCOME10', '신규 가입 10% 할인', 'PERCENT', 10.00, 30000, 10000, 30,
     '회원가입 후 첫 구매 시 사용 가능한 10% 할인 쿠폰', 'Y', 'SYSTEM'),
    ('STACK5000', '5,000원 적립 쿠폰',  'FIXED',   5000,  20000, NULL, 60,
     '20,000원 이상 구매 시 5,000원 할인',                  'Y', 'SYSTEM'),
    ('HAPPY15',   '봄맞이 15% 할인',     'PERCENT', 15.00, 50000, 20000, 14,
     '봄 시즌 한정 15% 할인 (최대 20,000원)',               'Y', 'SYSTEM');

-- alice(user_seq=2) 발급 쿠폰
INSERT INTO map_user_coupon (user_seq, coupon_seq, coupon_status, issued_date, expire_date, use_yn, i_user) VALUES
    (2, (SELECT coupon_seq FROM mst_coupon WHERE coupon_code='WELCOME10'),
     'AVAILABLE', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 'Y', 'SYSTEM'),
    (2, (SELECT coupon_seq FROM mst_coupon WHERE coupon_code='STACK5000'),
     'USED', NOW() - INTERVAL '20 days', NOW() + INTERVAL '40 days', 'Y', 'SYSTEM');
-- USED 쿠폰의 used_date 설정
UPDATE map_user_coupon SET used_date = NOW() - INTERVAL '10 days'
WHERE user_seq=2 AND coupon_status='USED';

-- alice 포인트 이력 3행
INSERT INTO his_point (user_seq, point_type, point_amount, balance_after, reason, expire_date, i_user) VALUES
    (2, 'EARN', 3000,  3000,  '회원가입 축하 적립',     NOW() + INTERVAL '365 days', 'SYSTEM'),
    (2, 'USE', -1500,  1500,  '주문번호 MZ-260601-00001 사용', NULL, 'SYSTEM'),
    (2, 'EARN', 1000,  2500,  '리뷰 작성 적립',         NOW() + INTERVAL '365 days', 'SYSTEM');

-- alice 잔액 동기화
UPDATE mst_user SET point_balance = 2500 WHERE user_seq = 2;
