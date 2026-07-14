-- =====================================================================
-- 회원 등급 5단계 시드 (회원 / 셀러 / 마스터 / 상무 / 전무)
-- =====================================================================

INSERT INTO mst_user_grade (grade_code, grade_name, point_rate, sort_order, use_yn, i_user) VALUES
    ('MEMBER',    '회원',   0.00,  1, 'Y', 'SYSTEM'),
    ('SELLER',    '셀러',   1.00,  2, 'Y', 'SYSTEM'),
    ('MASTER',    '마스터', 3.00,  3, 'Y', 'SYSTEM'),
    ('SENIOR',    '상무',   5.00,  4, 'Y', 'SYSTEM'),
    ('EXECUTIVE', '전무',  10.00,  5, 'Y', 'SYSTEM');
