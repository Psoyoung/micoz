-- =====================================================================
-- 상품/옵션/이미지/라벨 시드 (소규모): 상품 5개, 각 옵션 2개, MAIN 이미지 1개
-- =====================================================================

-- 라벨 마스터 4종
INSERT INTO mst_product_label (label_name, sort_order, use_yn, i_user) VALUES
    ('BEST', 1, 'Y', 'SYSTEM'),
    ('NEW',  2, 'Y', 'SYSTEM'),
    ('HIT',  3, 'Y', 'SYSTEM'),
    ('SALE', 4, 'Y', 'SYSTEM');

-- 상품 5종
INSERT INTO mst_product (product_code, product_name, product_status, category_seq,
                          base_price, short_desc, detail_desc, ingredient_info, usage_info,
                          display_yn, use_yn, i_user) VALUES
    ('MZ-TN-001', '글로우 토너',         'ON_SALE',
        (SELECT category_seq FROM mst_category WHERE url_slug='toner'),
        28000, '맑은 윤기를 더해주는 토너',
        '피부결을 정돈하고 수분을 공급하는 데일리 토너입니다.',
        '나이아신아마이드, 히알루론산, 알란토인',
        '세안 후 적당량을 화장솜이나 손에 덜어 얼굴 전체에 부드럽게 닦아냅니다.',
        'Y', 'Y', 'SYSTEM'),
    ('MZ-ES-001', '비타 에센스',         'ON_SALE',
        (SELECT category_seq FROM mst_category WHERE url_slug='essence-ampoule'),
        45000, '비타민 가득 광채 에센스',
        '비타민C 유도체로 칙칙한 피부에 광채를 더하는 에센스입니다.',
        '아스코르브산글루코사이드, 비타민E, 시카',
        '토너 후 2-3방울을 손에 덜어 얼굴 전체에 부드럽게 흡수시킵니다.',
        'Y', 'Y', 'SYSTEM'),
    ('MZ-FD-001', '실키 파운데이션',     'ON_SALE',
        (SELECT category_seq FROM mst_category WHERE url_slug='base'),
        38000, '얇고 가볍게 밀착되는 파운데이션',
        '24시간 지속력과 가벼운 발림성을 모두 갖춘 베이스입니다.',
        '실리카, 이소노난산이소노닐, 토코페롤',
        '베이스 메이크업 후 손이나 퍼프로 얼굴 전체에 얇게 펴 발라줍니다.',
        'Y', 'Y', 'SYSTEM'),
    ('MZ-LP-001', '벨벳 립스틱',         'ON_SALE',
        (SELECT category_seq FROM mst_category WHERE url_slug='lip'),
        22000, '벨벳 매트 텍스처 립스틱',
        '풍부한 발색과 부드러운 발림감의 벨벳 매트 립스틱입니다.',
        '카르나우바왁스, 호호바씨드오일, 비타민E',
        '입술 중앙부터 외곽으로 자연스럽게 발라줍니다.',
        'Y', 'Y', 'SYSTEM'),
    ('MZ-BD-001', '모이스처 바디로션',   'ON_SALE',
        (SELECT category_seq FROM mst_category WHERE url_slug='body-lotion'),
        19000, '데일리 보습 바디로션',
        '24시간 보습을 유지해주는 가벼운 텍스처의 바디로션입니다.',
        '판테놀, 시어버터, 세라마이드',
        '샤워 후 물기를 가볍게 닦은 뒤 전신에 부드럽게 마사지해 줍니다.',
        'Y', 'Y', 'SYSTEM');

-- 상품 옵션 (각 상품 2개씩)
INSERT INTO mst_product_option (product_seq, option_name, final_price, stock_qty, sort_order, use_yn, i_user) VALUES
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-TN-001'), '150ml', 28000, 120, 1, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-TN-001'), '250ml', 40000,  80, 2, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-ES-001'), '30ml',  45000, 100, 1, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-ES-001'), '50ml',  68000,  60, 2, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-FD-001'), '21호',  38000,  70, 1, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-FD-001'), '23호',  38000,  90, 2, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-LP-001'), '코랄',  22000,  50, 1, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-LP-001'), '로즈',  22000,  60, 2, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-BD-001'), '250ml', 19000, 150, 1, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-BD-001'), '500ml', 32000, 100, 2, 'Y', 'SYSTEM');

-- 상품 대표 이미지 (MAIN 1개씩)
INSERT INTO mst_product_image (product_seq, image_type, image_url, image_alt, sort_order, use_yn, i_user) VALUES
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-TN-001'), 'MAIN', 'https://cdn.micoz.example/products/MZ-TN-001-main.jpg', '글로우 토너 대표 이미지', 1, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-ES-001'), 'MAIN', 'https://cdn.micoz.example/products/MZ-ES-001-main.jpg', '비타 에센스 대표 이미지', 1, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-FD-001'), 'MAIN', 'https://cdn.micoz.example/products/MZ-FD-001-main.jpg', '실키 파운데이션 대표 이미지', 1, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-LP-001'), 'MAIN', 'https://cdn.micoz.example/products/MZ-LP-001-main.jpg', '벨벳 립스틱 대표 이미지', 1, 'Y', 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-BD-001'), 'MAIN', 'https://cdn.micoz.example/products/MZ-BD-001-main.jpg', '모이스처 바디로션 대표 이미지', 1, 'Y', 'SYSTEM');

-- 라벨 매핑 (총 7행)
INSERT INTO map_product_label (product_seq, label_seq, i_user) VALUES
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-TN-001'),
     (SELECT label_seq   FROM mst_product_label WHERE label_name='BEST'), 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-ES-001'),
     (SELECT label_seq   FROM mst_product_label WHERE label_name='BEST'), 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-ES-001'),
     (SELECT label_seq   FROM mst_product_label WHERE label_name='NEW'),  'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-FD-001'),
     (SELECT label_seq   FROM mst_product_label WHERE label_name='HIT'),  'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-LP-001'),
     (SELECT label_seq   FROM mst_product_label WHERE label_name='NEW'),  'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-BD-001'),
     (SELECT label_seq   FROM mst_product_label WHERE label_name='SALE'), 'SYSTEM'),
    ((SELECT product_seq FROM mst_product WHERE product_code='MZ-BD-001'),
     (SELECT label_seq   FROM mst_product_label WHERE label_name='BEST'), 'SYSTEM');
