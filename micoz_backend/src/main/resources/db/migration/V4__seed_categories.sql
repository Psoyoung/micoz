-- =====================================================================
-- 카테고리 시드 (소규모): 3 대분류 + 5 중분류
-- =====================================================================

-- 대분류 (level 1)
INSERT INTO mst_category (parent_seq, category_name, url_slug, category_level, sort_order, display_yn, use_yn, i_user) VALUES
    (NULL, '스킨케어',   'skincare', 1, 1, 'Y', 'Y', 'SYSTEM'),
    (NULL, '메이크업',   'makeup',   1, 2, 'Y', 'Y', 'SYSTEM'),
    (NULL, '바디케어',   'bodycare', 1, 3, 'Y', 'Y', 'SYSTEM');

-- 중분류 (level 2) — parent_seq를 url_slug로 조회
INSERT INTO mst_category (parent_seq, category_name, url_slug, category_level, sort_order, display_yn, use_yn, i_user) VALUES
    ((SELECT category_seq FROM mst_category WHERE url_slug='skincare'), '토너',       'toner',           2, 1, 'Y', 'Y', 'SYSTEM'),
    ((SELECT category_seq FROM mst_category WHERE url_slug='skincare'), '에센스/앰플', 'essence-ampoule', 2, 2, 'Y', 'Y', 'SYSTEM'),
    ((SELECT category_seq FROM mst_category WHERE url_slug='makeup'),   '베이스',     'base',            2, 1, 'Y', 'Y', 'SYSTEM'),
    ((SELECT category_seq FROM mst_category WHERE url_slug='makeup'),   '립',         'lip',             2, 2, 'Y', 'Y', 'SYSTEM'),
    ((SELECT category_seq FROM mst_category WHERE url_slug='bodycare'), '바디로션',   'body-lotion',     2, 1, 'Y', 'Y', 'SYSTEM');
