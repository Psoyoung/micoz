-- =====================================================================
-- 히어로 배너 시드 (2개)
-- =====================================================================

INSERT INTO mst_banner (banner_type, title, description, image_url, link_url, sort_order, display_yn, use_yn, i_user) VALUES
    ('HERO', '봄 컬렉션', '봄의 광채를 담은 새 시즌 컬렉션',
        'https://cdn.micoz.example/banners/spring-collection.jpg',
        '/collections/spring', 1, 'Y', 'Y', 'SYSTEM'),
    ('HERO', '베스트 셀러',  '회원이 가장 사랑하는 베스트 5',
        'https://cdn.micoz.example/banners/bestsellers.jpg',
        '/bestsellers', 2, 'Y', 'Y', 'SYSTEM');
