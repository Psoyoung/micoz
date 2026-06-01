-- =====================================================================
-- MICOZ Cosmetics Shopping Mall - PostgreSQL 15 Schema
-- Naming: mst_(master) / dat_(data) / map_(mapping) / his_(history)
-- Soft delete: use_yn / Audit: i_user, i_date, u_user, u_date
-- FK: 논리적 연결만 (물리 FK 미설정)
-- =====================================================================


-- =====================================================================
-- 1. 사용자 / 권한
-- =====================================================================

-- 1-1. 회원 등급 마스터
CREATE TABLE mst_user_grade (
    grade_seq         BIGSERIAL PRIMARY KEY,
    grade_code        VARCHAR(20)   NOT NULL,
    grade_name        VARCHAR(100)  NOT NULL,
    point_rate        NUMERIC(5,2)  DEFAULT 0,
    sort_order        INTEGER       DEFAULT 0,
    description       VARCHAR(500),
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  mst_user_grade               IS '회원 등급 마스터 (회원/VIP/마스터 등)';
COMMENT ON COLUMN mst_user_grade.grade_seq     IS '등급 일련번호';
COMMENT ON COLUMN mst_user_grade.grade_code    IS '등급 코드';
COMMENT ON COLUMN mst_user_grade.grade_name    IS '등급명';
COMMENT ON COLUMN mst_user_grade.point_rate    IS '구매 시 적립률(%) - VIP 5% 등';
COMMENT ON COLUMN mst_user_grade.sort_order    IS '정렬 순서';
COMMENT ON COLUMN mst_user_grade.description   IS '등급 설명';
COMMENT ON COLUMN mst_user_grade.use_yn        IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN mst_user_grade.i_user        IS '등록자 ID';
COMMENT ON COLUMN mst_user_grade.i_date        IS '등록일시';
COMMENT ON COLUMN mst_user_grade.u_user        IS '수정자 ID';
COMMENT ON COLUMN mst_user_grade.u_date        IS '수정일시';


-- 1-2. 사용자 마스터 (관리자 + 일반 회원 통합)
CREATE TABLE mst_user (
    user_seq          BIGSERIAL PRIMARY KEY,
    user_id           VARCHAR(50)   NOT NULL,
    user_pw           VARCHAR(255)  NOT NULL,
    user_name         VARCHAR(100)  NOT NULL,
    user_role         VARCHAR(20)   NOT NULL DEFAULT 'CUSTOMER',
    grade_seq         BIGINT,
    email             VARCHAR(100),
    phone             VARCHAR(20),
    birth_date        DATE,
    zip_code          VARCHAR(10),
    address           VARCHAR(500),
    address_detail    VARCHAR(500),
    memo              VARCHAR(500),
    service_yn        CHAR(1)       DEFAULT 'N',
    privacy_yn        CHAR(1)       DEFAULT 'N',
    marketing_yn      CHAR(1)       DEFAULT 'N',
    service_agree_date    TIMESTAMPTZ,
    privacy_agree_date    TIMESTAMPTZ,
    marketing_agree_date  TIMESTAMPTZ,
    last_login_date   TIMESTAMPTZ,
    point_balance     INTEGER       DEFAULT 0,
    user_status       VARCHAR(20)   DEFAULT 'ACTIVE',
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  mst_user                     IS '사용자 마스터 (관리자 + 일반회원 통합)';
COMMENT ON COLUMN mst_user.user_seq            IS '사용자 일련번호';
COMMENT ON COLUMN mst_user.user_id             IS '로그인 아이디';
COMMENT ON COLUMN mst_user.user_pw             IS '비밀번호 (bcrypt 등 해시)';
COMMENT ON COLUMN mst_user.user_name           IS '이름';
COMMENT ON COLUMN mst_user.user_role           IS '사용자 구분: CUSTOMER/ADMIN';
COMMENT ON COLUMN mst_user.grade_seq           IS '회원 등급 (mst_user_grade.grade_seq)';
COMMENT ON COLUMN mst_user.email               IS '이메일';
COMMENT ON COLUMN mst_user.phone               IS '휴대폰 번호';
COMMENT ON COLUMN mst_user.birth_date          IS '생년월일';
COMMENT ON COLUMN mst_user.zip_code            IS '우편번호';
COMMENT ON COLUMN mst_user.address             IS '기본 주소';
COMMENT ON COLUMN mst_user.address_detail      IS '상세 주소';
COMMENT ON COLUMN mst_user.memo                IS '관리자 메모 (고객 응대 참고)';
COMMENT ON COLUMN mst_user.service_yn          IS '이용약관 동의 여부 (필수)';
COMMENT ON COLUMN mst_user.privacy_yn          IS '개인정보 수집·이용 동의 여부 (필수)';
COMMENT ON COLUMN mst_user.marketing_yn        IS '마케팅 정보 수신 동의 여부 (선택)';
COMMENT ON COLUMN mst_user.service_agree_date  IS '이용약관 동의 일시';
COMMENT ON COLUMN mst_user.privacy_agree_date  IS '개인정보 동의 일시';
COMMENT ON COLUMN mst_user.marketing_agree_date IS '마케팅 수신 동의 일시';
COMMENT ON COLUMN mst_user.last_login_date     IS '최종 로그인 일시';
COMMENT ON COLUMN mst_user.point_balance       IS '현재 보유 포인트';
COMMENT ON COLUMN mst_user.user_status         IS '회원상태: ACTIVE/DORMANT/WITHDRAWN';
COMMENT ON COLUMN mst_user.use_yn              IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN mst_user.i_user              IS '등록자 ID';
COMMENT ON COLUMN mst_user.i_date              IS '등록일시';
COMMENT ON COLUMN mst_user.u_user              IS '수정자 ID';
COMMENT ON COLUMN mst_user.u_date              IS '수정일시';


-- 1-3. 사용자 배송지
CREATE TABLE mst_user_address (
    address_seq       BIGSERIAL PRIMARY KEY,
    user_seq          BIGINT        NOT NULL,
    address_name      VARCHAR(100),
    recipient_name    VARCHAR(100)  NOT NULL,
    recipient_phone   VARCHAR(20)   NOT NULL,
    zip_code          VARCHAR(10)   NOT NULL,
    address           VARCHAR(500)  NOT NULL,
    address_detail    VARCHAR(500),
    default_yn        CHAR(1)       DEFAULT 'N',
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  mst_user_address                 IS '사용자 배송지';
COMMENT ON COLUMN mst_user_address.address_seq     IS '배송지 일련번호';
COMMENT ON COLUMN mst_user_address.user_seq        IS '사용자 일련번호 (mst_user.user_seq)';
COMMENT ON COLUMN mst_user_address.address_name    IS '배송지 별칭 (집/회사 등)';
COMMENT ON COLUMN mst_user_address.recipient_name  IS '수령인 이름';
COMMENT ON COLUMN mst_user_address.recipient_phone IS '수령인 연락처';
COMMENT ON COLUMN mst_user_address.zip_code        IS '우편번호';
COMMENT ON COLUMN mst_user_address.address         IS '기본 주소';
COMMENT ON COLUMN mst_user_address.address_detail  IS '상세 주소';
COMMENT ON COLUMN mst_user_address.default_yn      IS '기본 배송지 여부 (Y/N)';
COMMENT ON COLUMN mst_user_address.use_yn          IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN mst_user_address.i_user          IS '등록자 ID';
COMMENT ON COLUMN mst_user_address.i_date          IS '등록일시';
COMMENT ON COLUMN mst_user_address.u_user          IS '수정자 ID';
COMMENT ON COLUMN mst_user_address.u_date          IS '수정일시';


-- 1-4. JWT Refresh Token
CREATE TABLE dat_refresh_token (
    token_seq         BIGSERIAL PRIMARY KEY,
    user_seq          BIGINT        NOT NULL,
    refresh_token     VARCHAR(500)  NOT NULL,
    ip_address        VARCHAR(45),
    expire_date       TIMESTAMPTZ   NOT NULL,
    revoked_yn        CHAR(1)       DEFAULT 'N',
    revoked_date      TIMESTAMPTZ,
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  dat_refresh_token               IS 'JWT Refresh Token';
COMMENT ON COLUMN dat_refresh_token.token_seq     IS '토큰 일련번호';
COMMENT ON COLUMN dat_refresh_token.user_seq      IS '사용자 일련번호 (mst_user.user_seq)';
COMMENT ON COLUMN dat_refresh_token.refresh_token IS 'Refresh Token 값 (또는 SHA256 해시)';
COMMENT ON COLUMN dat_refresh_token.ip_address    IS '발급 시 클라이언트 IP (IPv4/IPv6)';
COMMENT ON COLUMN dat_refresh_token.expire_date   IS '만료 일시';
COMMENT ON COLUMN dat_refresh_token.revoked_yn    IS '폐기 여부 (Y/N)';
COMMENT ON COLUMN dat_refresh_token.revoked_date  IS '폐기 일시';
COMMENT ON COLUMN dat_refresh_token.i_user        IS '등록자 ID';
COMMENT ON COLUMN dat_refresh_token.i_date        IS '등록일시';


-- =====================================================================
-- 2. 카테고리
-- =====================================================================

-- 2-1. 카테고리 마스터 (2 LEVELS)
CREATE TABLE mst_category (
    category_seq      BIGSERIAL PRIMARY KEY,
    parent_seq        BIGINT,
    category_name     VARCHAR(100)  NOT NULL,
    url_slug          VARCHAR(100)  NOT NULL,
    category_level    INTEGER       NOT NULL DEFAULT 1,
    sort_order        INTEGER       DEFAULT 0,
    display_yn        CHAR(1)       DEFAULT 'Y',
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  mst_category                IS '상품 카테고리 (2단계: 대분류/중분류)';
COMMENT ON COLUMN mst_category.category_seq   IS '카테고리 일련번호';
COMMENT ON COLUMN mst_category.parent_seq     IS '상위 카테고리 (1차는 NULL)';
COMMENT ON COLUMN mst_category.category_name  IS '카테고리명';
COMMENT ON COLUMN mst_category.url_slug       IS 'URL 슬러그 (예: essence-ampoule)';
COMMENT ON COLUMN mst_category.category_level IS '1=대분류, 2=중분류';
COMMENT ON COLUMN mst_category.sort_order     IS '정렬 순서';
COMMENT ON COLUMN mst_category.display_yn     IS '쇼핑몰 노출 여부 (Y/N)';
COMMENT ON COLUMN mst_category.use_yn         IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN mst_category.i_user         IS '등록자 ID';
COMMENT ON COLUMN mst_category.i_date         IS '등록일시';
COMMENT ON COLUMN mst_category.u_user         IS '수정자 ID';
COMMENT ON COLUMN mst_category.u_date         IS '수정일시';


-- =====================================================================
-- 3. 상품
-- =====================================================================

-- 3-1. 상품 마스터
CREATE TABLE mst_product (
    product_seq       BIGSERIAL PRIMARY KEY,
    product_code      VARCHAR(50)   NOT NULL,
    product_name      VARCHAR(100)  NOT NULL,
    product_status    VARCHAR(20)   DEFAULT 'ON_SALE',
    category_seq      BIGINT,
    base_price        NUMERIC(15,2) NOT NULL DEFAULT 0,
    short_desc        VARCHAR(500),
    detail_desc       TEXT,
    ingredient_info   TEXT,
    usage_info        TEXT,
    display_yn        CHAR(1)       DEFAULT 'Y',
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  mst_product                 IS '상품 마스터';
COMMENT ON COLUMN mst_product.product_seq     IS '상품 일련번호';
COMMENT ON COLUMN mst_product.product_code    IS '상품 코드 (예: BIE-ES-050)';
COMMENT ON COLUMN mst_product.product_name    IS '상품명';
COMMENT ON COLUMN mst_product.product_status  IS '판매상태: ON_SALE(판매중)/LOW_STOCK(재고부족)/SOLD_OUT(품절)/STOPPED(판매중지)';
COMMENT ON COLUMN mst_product.category_seq    IS '카테고리 (mst_category.category_seq)';
COMMENT ON COLUMN mst_product.base_price      IS '대표 판매가';
COMMENT ON COLUMN mst_product.short_desc      IS '짧은 설명 (리스트·카드용)';
COMMENT ON COLUMN mst_product.detail_desc     IS '상세 설명 (상세 페이지 본문)';
COMMENT ON COLUMN mst_product.ingredient_info IS '성분 정보';
COMMENT ON COLUMN mst_product.usage_info      IS '사용법';
COMMENT ON COLUMN mst_product.display_yn      IS '쇼핑몰 노출 여부 (Y/N)';
COMMENT ON COLUMN mst_product.use_yn          IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN mst_product.i_user          IS '등록자 ID';
COMMENT ON COLUMN mst_product.i_date          IS '등록일시';
COMMENT ON COLUMN mst_product.u_user          IS '수정자 ID';
COMMENT ON COLUMN mst_product.u_date          IS '수정일시';


-- 3-2. 상품 옵션 (용량별 가격/재고)
CREATE TABLE mst_product_option (
    option_seq        BIGSERIAL PRIMARY KEY,
    product_seq       BIGINT        NOT NULL,
    option_name       VARCHAR(100)  NOT NULL,
    final_price       NUMERIC(15,2) NOT NULL DEFAULT 0,
    stock_qty         INTEGER       DEFAULT 0,
    sort_order        INTEGER       DEFAULT 0,
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  mst_product_option             IS '상품 옵션 (50ml/100ml/리필 등). 옵션 없는 상품도 기본 옵션 1건 자동 생성';
COMMENT ON COLUMN mst_product_option.option_seq  IS '옵션 일련번호';
COMMENT ON COLUMN mst_product_option.product_seq IS '상품 일련번호 (mst_product.product_seq)';
COMMENT ON COLUMN mst_product_option.option_name IS '옵션명 (예: 50ml)';
COMMENT ON COLUMN mst_product_option.final_price IS '최종 판매 단가';
COMMENT ON COLUMN mst_product_option.stock_qty   IS '재고 수량';
COMMENT ON COLUMN mst_product_option.sort_order  IS '정렬 순서';
COMMENT ON COLUMN mst_product_option.use_yn      IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN mst_product_option.i_user      IS '등록자 ID';
COMMENT ON COLUMN mst_product_option.i_date      IS '등록일시';
COMMENT ON COLUMN mst_product_option.u_user      IS '수정자 ID';
COMMENT ON COLUMN mst_product_option.u_date      IS '수정일시';


-- 3-3. 상품 이미지
CREATE TABLE mst_product_image (
    image_seq         BIGSERIAL PRIMARY KEY,
    product_seq       BIGINT        NOT NULL,
    image_type        VARCHAR(20)   NOT NULL,
    image_url         VARCHAR(500)  NOT NULL,
    image_alt         VARCHAR(100),
    sort_order        INTEGER       DEFAULT 0,
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  mst_product_image             IS '상품 이미지 (대표/서브/상세)';
COMMENT ON COLUMN mst_product_image.image_seq   IS '이미지 일련번호';
COMMENT ON COLUMN mst_product_image.product_seq IS '상품 일련번호 (mst_product.product_seq)';
COMMENT ON COLUMN mst_product_image.image_type  IS 'MAIN(대표)/SUB(서브)/DETAIL(상세페이지)';
COMMENT ON COLUMN mst_product_image.image_url   IS '이미지 URL';
COMMENT ON COLUMN mst_product_image.image_alt   IS '이미지 대체 텍스트';
COMMENT ON COLUMN mst_product_image.sort_order  IS '정렬 순서';
COMMENT ON COLUMN mst_product_image.use_yn      IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN mst_product_image.i_user      IS '등록자 ID';
COMMENT ON COLUMN mst_product_image.i_date      IS '등록일시';
COMMENT ON COLUMN mst_product_image.u_user      IS '수정자 ID';
COMMENT ON COLUMN mst_product_image.u_date      IS '수정일시';


-- 3-4. 라벨 마스터
CREATE TABLE mst_product_label (
    label_seq         BIGSERIAL PRIMARY KEY,
    label_name        VARCHAR(100)  NOT NULL,
    sort_order        INTEGER       DEFAULT 0,
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  mst_product_label            IS '상품 라벨 마스터 (BEST/HIT/NEW/한정/SALE)';
COMMENT ON COLUMN mst_product_label.label_seq  IS '라벨 일련번호';
COMMENT ON COLUMN mst_product_label.label_name IS '라벨명 (BEST/HIT/NEW/한정/SALE)';
COMMENT ON COLUMN mst_product_label.sort_order IS '정렬 순서';
COMMENT ON COLUMN mst_product_label.use_yn     IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN mst_product_label.i_user     IS '등록자 ID';
COMMENT ON COLUMN mst_product_label.i_date     IS '등록일시';
COMMENT ON COLUMN mst_product_label.u_user     IS '수정자 ID';
COMMENT ON COLUMN mst_product_label.u_date     IS '수정일시';


-- 3-5. 상품-라벨 매핑
CREATE TABLE map_product_label (
    product_seq       BIGINT        NOT NULL,
    label_seq         BIGINT        NOT NULL,
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    PRIMARY KEY (product_seq, label_seq)
);
COMMENT ON TABLE  map_product_label             IS '상품-라벨 매핑';
COMMENT ON COLUMN map_product_label.product_seq IS '상품 일련번호 (mst_product.product_seq)';
COMMENT ON COLUMN map_product_label.label_seq   IS '라벨 일련번호 (mst_product_label.label_seq)';
COMMENT ON COLUMN map_product_label.i_user      IS '등록자 ID';
COMMENT ON COLUMN map_product_label.i_date      IS '등록일시';


-- =====================================================================
-- 4. 장바구니 / 찜
-- =====================================================================

-- 4-1. 장바구니
CREATE TABLE dat_cart (
    cart_seq          BIGSERIAL PRIMARY KEY,
    user_seq          BIGINT        NOT NULL,
    product_seq       BIGINT        NOT NULL,
    option_seq        BIGINT,
    quantity          INTEGER       NOT NULL DEFAULT 1,
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  dat_cart             IS '장바구니';
COMMENT ON COLUMN dat_cart.cart_seq    IS '장바구니 일련번호';
COMMENT ON COLUMN dat_cart.user_seq    IS '사용자 일련번호 (mst_user.user_seq)';
COMMENT ON COLUMN dat_cart.product_seq IS '상품 일련번호 (mst_product.product_seq)';
COMMENT ON COLUMN dat_cart.option_seq  IS '옵션 일련번호 (mst_product_option.option_seq)';
COMMENT ON COLUMN dat_cart.quantity    IS '담은 수량';
COMMENT ON COLUMN dat_cart.i_user      IS '등록자 ID';
COMMENT ON COLUMN dat_cart.i_date      IS '등록일시';


-- 4-2. 찜 (위시리스트)
CREATE TABLE map_product_fav (
    user_seq          BIGINT        NOT NULL,
    product_seq       BIGINT        NOT NULL,
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    PRIMARY KEY (user_seq, product_seq)
);
COMMENT ON TABLE  map_product_fav             IS '찜한 상품 (사용자-상품 매핑)';
COMMENT ON COLUMN map_product_fav.user_seq    IS '사용자 일련번호 (mst_user.user_seq)';
COMMENT ON COLUMN map_product_fav.product_seq IS '상품 일련번호 (mst_product.product_seq)';
COMMENT ON COLUMN map_product_fav.i_user      IS '등록자 ID';
COMMENT ON COLUMN map_product_fav.i_date      IS '등록일시';


-- =====================================================================
-- 5. 주문 / 결제 / 배송
-- =====================================================================

-- 5-1. 주문 마스터
CREATE TABLE dat_order (
    order_seq         BIGSERIAL PRIMARY KEY,
    order_no          VARCHAR(50)   NOT NULL,
    user_seq          BIGINT        NOT NULL,
    order_status      VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    shipping_fee      NUMERIC(15,2) DEFAULT 0,
    coupon_discount   NUMERIC(15,2) DEFAULT 0,
    point_used        INTEGER       DEFAULT 0,
    total_discount    NUMERIC(15,2) DEFAULT 0,
    final_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
    point_to_earn     INTEGER       DEFAULT 0,
    order_date        TIMESTAMPTZ   DEFAULT NOW(),
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  dat_order                 IS '주문 마스터';
COMMENT ON COLUMN dat_order.order_seq       IS '주문 일련번호';
COMMENT ON COLUMN dat_order.order_no        IS '주문번호 (예: MZ-26050700428)';
COMMENT ON COLUMN dat_order.user_seq        IS '사용자 일련번호 (mst_user.user_seq)';
COMMENT ON COLUMN dat_order.order_status    IS 'PENDING(대기)/PAID(결제완료)/PREPARING(준비중)/SHIPPING(배송중)/DELIVERED(배송완료)/CANCELED(취소)/RETURNED(반품)';
COMMENT ON COLUMN dat_order.shipping_fee    IS '배송비';
COMMENT ON COLUMN dat_order.coupon_discount IS '쿠폰 할인 금액';
COMMENT ON COLUMN dat_order.point_used      IS '사용한 포인트';
COMMENT ON COLUMN dat_order.total_discount  IS '총 할인 금액 (쿠폰 + 포인트 등)';
COMMENT ON COLUMN dat_order.final_amount    IS '최종 결제 금액';
COMMENT ON COLUMN dat_order.point_to_earn   IS '적립 예정 포인트';
COMMENT ON COLUMN dat_order.order_date      IS '주문 일시';
COMMENT ON COLUMN dat_order.i_user          IS '등록자 ID';
COMMENT ON COLUMN dat_order.i_date          IS '등록일시';
COMMENT ON COLUMN dat_order.u_user          IS '수정자 ID';
COMMENT ON COLUMN dat_order.u_date          IS '수정일시';


-- 5-2. 주문 상품
CREATE TABLE dat_order_item (
    item_seq          BIGSERIAL PRIMARY KEY,
    order_seq         BIGINT        NOT NULL,
    product_seq       BIGINT        NOT NULL,
    option_seq        BIGINT,
    product_code      VARCHAR(50),
    product_name      VARCHAR(100)  NOT NULL,
    option_name       VARCHAR(100),
    unit_price        NUMERIC(15,2) NOT NULL,
    quantity          INTEGER       NOT NULL,
    item_amount       NUMERIC(15,2) NOT NULL,
    item_status       VARCHAR(20)   DEFAULT 'NORMAL',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  dat_order_item              IS '주문 상품';
COMMENT ON COLUMN dat_order_item.item_seq     IS '주문 상품 일련번호';
COMMENT ON COLUMN dat_order_item.order_seq    IS '주문 일련번호 (dat_order.order_seq)';
COMMENT ON COLUMN dat_order_item.product_seq  IS '상품 일련번호 (mst_product.product_seq)';
COMMENT ON COLUMN dat_order_item.option_seq   IS '옵션 일련번호 (mst_product_option.option_seq)';
COMMENT ON COLUMN dat_order_item.product_code IS '주문 시점 상품 코드 (스냅샷)';
COMMENT ON COLUMN dat_order_item.product_name IS '주문 시점 상품명 (스냅샷)';
COMMENT ON COLUMN dat_order_item.option_name  IS '주문 시점 옵션명 (스냅샷)';
COMMENT ON COLUMN dat_order_item.unit_price   IS '주문 시점 단가 (스냅샷)';
COMMENT ON COLUMN dat_order_item.quantity     IS '주문 수량';
COMMENT ON COLUMN dat_order_item.item_amount  IS '항목 합계 금액 (unit_price * quantity)';
COMMENT ON COLUMN dat_order_item.item_status  IS 'NORMAL/CANCEL_REQUESTED/CANCELED/RETURN_REQUESTED/RETURNED/EXCHANGED';
COMMENT ON COLUMN dat_order_item.i_user       IS '등록자 ID';
COMMENT ON COLUMN dat_order_item.i_date       IS '등록일시';
COMMENT ON COLUMN dat_order_item.u_user       IS '수정자 ID';
COMMENT ON COLUMN dat_order_item.u_date       IS '수정일시';


-- 5-3. 주문 결제
CREATE TABLE dat_order_payment (
    payment_seq       BIGSERIAL PRIMARY KEY,
    order_seq         BIGINT        NOT NULL,
    payment_type      VARCHAR(20)   NOT NULL,
    payment_status    VARCHAR(20)   DEFAULT 'PENDING',
    paid_amount       NUMERIC(15,2) NOT NULL,
    card_company      VARCHAR(50),
    card_no_masked    VARCHAR(30),
    installment       INTEGER       DEFAULT 0,
    approval_no       VARCHAR(50),
    pg_tid            VARCHAR(100),
    paid_date         TIMESTAMPTZ,
    canceled_date     TIMESTAMPTZ,
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  dat_order_payment                IS '주문 결제';
COMMENT ON COLUMN dat_order_payment.payment_seq    IS '결제 일련번호';
COMMENT ON COLUMN dat_order_payment.order_seq      IS '주문 일련번호 (dat_order.order_seq)';
COMMENT ON COLUMN dat_order_payment.payment_type   IS 'CARD/VBANK/BANK/PHONE/KAKAOPAY/NAVERPAY/TOSS/SAMSUNGPAY/PAYCO/POINT';
COMMENT ON COLUMN dat_order_payment.payment_status IS 'PENDING/PAID/CANCELED/REFUNDED';
COMMENT ON COLUMN dat_order_payment.paid_amount    IS '결제 금액';
COMMENT ON COLUMN dat_order_payment.card_company   IS '카드사 (예: 신한)';
COMMENT ON COLUMN dat_order_payment.card_no_masked IS '카드번호 마스킹 (예: 1234-****-****-5421)';
COMMENT ON COLUMN dat_order_payment.installment    IS '할부 개월 (0=일시불)';
COMMENT ON COLUMN dat_order_payment.approval_no    IS '승인 번호';
COMMENT ON COLUMN dat_order_payment.pg_tid         IS 'PG사 거래 ID';
COMMENT ON COLUMN dat_order_payment.paid_date      IS '결제 완료 일시';
COMMENT ON COLUMN dat_order_payment.canceled_date  IS '결제 취소 일시';
COMMENT ON COLUMN dat_order_payment.i_user         IS '등록자 ID';
COMMENT ON COLUMN dat_order_payment.i_date         IS '등록일시';
COMMENT ON COLUMN dat_order_payment.u_user         IS '수정자 ID';
COMMENT ON COLUMN dat_order_payment.u_date         IS '수정일시';


-- 5-4. 주문 배송
CREATE TABLE dat_order_shipping (
    order_ship_seq    BIGSERIAL PRIMARY KEY,
    order_seq         BIGINT        NOT NULL,
    recipient_name    VARCHAR(100)  NOT NULL,
    recipient_phone   VARCHAR(20)   NOT NULL,
    zip_code          VARCHAR(10)   NOT NULL,
    address           VARCHAR(500)  NOT NULL,
    address_detail    VARCHAR(500),
    shipping_memo     VARCHAR(500),
    tracking_no       VARCHAR(50),
    shipping_status   VARCHAR(20)   DEFAULT 'READY',
    shipped_date      TIMESTAMPTZ,
    delivered_date    TIMESTAMPTZ,
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  dat_order_shipping                 IS '주문 배송 정보';
COMMENT ON COLUMN dat_order_shipping.order_ship_seq  IS '주문 배송 일련번호';
COMMENT ON COLUMN dat_order_shipping.order_seq       IS '주문 일련번호 (dat_order.order_seq)';
COMMENT ON COLUMN dat_order_shipping.recipient_name  IS '수령인 이름';
COMMENT ON COLUMN dat_order_shipping.recipient_phone IS '수령인 연락처';
COMMENT ON COLUMN dat_order_shipping.zip_code        IS '우편번호';
COMMENT ON COLUMN dat_order_shipping.address         IS '기본 주소';
COMMENT ON COLUMN dat_order_shipping.address_detail  IS '상세 주소';
COMMENT ON COLUMN dat_order_shipping.shipping_memo   IS '배송 메모 (예: 부재 시 경비실 보관)';
COMMENT ON COLUMN dat_order_shipping.tracking_no     IS '운송장 번호';
COMMENT ON COLUMN dat_order_shipping.shipping_status IS 'READY(준비중)/SHIPPED(출고)/IN_TRANSIT(배송중)/DELIVERED(완료)';
COMMENT ON COLUMN dat_order_shipping.shipped_date    IS '출고 일시';
COMMENT ON COLUMN dat_order_shipping.delivered_date  IS '배송 완료 일시';
COMMENT ON COLUMN dat_order_shipping.i_user          IS '등록자 ID';
COMMENT ON COLUMN dat_order_shipping.i_date          IS '등록일시';
COMMENT ON COLUMN dat_order_shipping.u_user          IS '수정자 ID';
COMMENT ON COLUMN dat_order_shipping.u_date          IS '수정일시';


-- =====================================================================
-- 6. 취소 / 교환 / 반품
-- =====================================================================

-- 6-1. 반품/교환/취소 신청
CREATE TABLE dat_return (
    return_seq        BIGSERIAL PRIMARY KEY,
    return_no         VARCHAR(50)   NOT NULL,
    order_seq         BIGINT        NOT NULL,
    user_seq          BIGINT        NOT NULL,
    return_type       VARCHAR(20)   NOT NULL,
    return_status     VARCHAR(20)   DEFAULT 'REQUESTED',
    return_reason_type VARCHAR(30),
    return_reason     VARCHAR(500),
    return_shipping_fee NUMERIC(15,2) DEFAULT 0,
    refund_amount     NUMERIC(15,2) DEFAULT 0,
    pickup_zip_code   VARCHAR(10),
    pickup_address    VARCHAR(500),
    pickup_address_detail VARCHAR(500),
    pickup_phone      VARCHAR(20),
    requested_date    TIMESTAMPTZ   DEFAULT NOW(),
    completed_date    TIMESTAMPTZ,
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  dat_return                       IS '취소/교환/반품 신청';
COMMENT ON COLUMN dat_return.return_seq            IS '신청 일련번호';
COMMENT ON COLUMN dat_return.return_no             IS '신청 번호';
COMMENT ON COLUMN dat_return.order_seq             IS '원 주문 일련번호 (dat_order.order_seq)';
COMMENT ON COLUMN dat_return.user_seq              IS '사용자 일련번호 (mst_user.user_seq)';
COMMENT ON COLUMN dat_return.return_type           IS 'CANCEL(취소)/EXCHANGE(교환)/RETURN(반품)';
COMMENT ON COLUMN dat_return.return_status         IS 'REQUESTED(신청)/APPROVED(승인)/PICKUP(회수중)/INSPECTING(검수)/COMPLETED(완료)/REJECTED(반려)';
COMMENT ON COLUMN dat_return.return_reason_type    IS 'CHANGE_MIND(단순변심)/DEFECT(불량)/WRONG_DELIVERY(오배송)/OTHER';
COMMENT ON COLUMN dat_return.return_reason         IS '상세 사유';
COMMENT ON COLUMN dat_return.return_shipping_fee   IS '반품 배송비';
COMMENT ON COLUMN dat_return.refund_amount         IS '환불 금액';
COMMENT ON COLUMN dat_return.pickup_zip_code       IS '회수지 우편번호';
COMMENT ON COLUMN dat_return.pickup_address        IS '회수지 기본 주소';
COMMENT ON COLUMN dat_return.pickup_address_detail IS '회수지 상세 주소';
COMMENT ON COLUMN dat_return.pickup_phone          IS '회수지 연락처';
COMMENT ON COLUMN dat_return.requested_date        IS '신청 일시';
COMMENT ON COLUMN dat_return.completed_date        IS '완료 일시';
COMMENT ON COLUMN dat_return.i_user                IS '등록자 ID';
COMMENT ON COLUMN dat_return.i_date                IS '등록일시';
COMMENT ON COLUMN dat_return.u_user                IS '수정자 ID';
COMMENT ON COLUMN dat_return.u_date                IS '수정일시';


-- 6-2. 반품 상품
CREATE TABLE dat_return_item (
    return_item_seq   BIGSERIAL PRIMARY KEY,
    return_seq        BIGINT        NOT NULL,
    item_seq          BIGINT        NOT NULL,
    quantity          INTEGER       NOT NULL,
    exchange_option_seq BIGINT,
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  dat_return_item                     IS '반품/교환 대상 상품';
COMMENT ON COLUMN dat_return_item.return_item_seq     IS '반품 상품 일련번호';
COMMENT ON COLUMN dat_return_item.return_seq          IS '반품 신청 일련번호 (dat_return.return_seq)';
COMMENT ON COLUMN dat_return_item.item_seq            IS '원 주문상품 (dat_order_item.item_seq)';
COMMENT ON COLUMN dat_return_item.quantity            IS '반품/교환 수량';
COMMENT ON COLUMN dat_return_item.exchange_option_seq IS '교환 시 대체 옵션 (mst_product_option.option_seq)';
COMMENT ON COLUMN dat_return_item.use_yn              IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN dat_return_item.i_user              IS '등록자 ID';
COMMENT ON COLUMN dat_return_item.i_date              IS '등록일시';


-- =====================================================================
-- 7. 쿠폰 / 포인트
-- =====================================================================

-- 7-1. 쿠폰 마스터
CREATE TABLE mst_coupon (
    coupon_seq        BIGSERIAL PRIMARY KEY,
    coupon_code       VARCHAR(50)   NOT NULL,
    coupon_name       VARCHAR(100)  NOT NULL,
    coupon_type       VARCHAR(20)   NOT NULL,
    discount_value    NUMERIC(15,2) NOT NULL,
    min_order_amount  NUMERIC(15,2) DEFAULT 0,
    max_discount      NUMERIC(15,2),
    issue_start_date  TIMESTAMPTZ,
    issue_end_date    TIMESTAMPTZ,
    valid_days        INTEGER,
    description       VARCHAR(500),
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  mst_coupon                  IS '쿠폰 마스터';
COMMENT ON COLUMN mst_coupon.coupon_seq       IS '쿠폰 일련번호';
COMMENT ON COLUMN mst_coupon.coupon_code      IS '쿠폰 코드';
COMMENT ON COLUMN mst_coupon.coupon_name      IS '쿠폰명';
COMMENT ON COLUMN mst_coupon.coupon_type      IS 'AMOUNT(정액)/RATE(정률)';
COMMENT ON COLUMN mst_coupon.discount_value   IS '할인값 (정액=원, 정률=%)';
COMMENT ON COLUMN mst_coupon.min_order_amount IS '최소 주문 금액';
COMMENT ON COLUMN mst_coupon.max_discount     IS '최대 할인 금액 (정률 쿠폰 상한)';
COMMENT ON COLUMN mst_coupon.issue_start_date IS '발급 시작 일시';
COMMENT ON COLUMN mst_coupon.issue_end_date   IS '발급 종료 일시';
COMMENT ON COLUMN mst_coupon.valid_days       IS '발급 후 유효 일수';
COMMENT ON COLUMN mst_coupon.description      IS '쿠폰 설명';
COMMENT ON COLUMN mst_coupon.use_yn           IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN mst_coupon.i_user           IS '등록자 ID';
COMMENT ON COLUMN mst_coupon.i_date           IS '등록일시';
COMMENT ON COLUMN mst_coupon.u_user           IS '수정자 ID';
COMMENT ON COLUMN mst_coupon.u_date           IS '수정일시';


-- 7-2. 사용자-쿠폰 매핑 (발급된 쿠폰)
CREATE TABLE map_user_coupon (
    user_coupon_seq   BIGSERIAL PRIMARY KEY,
    user_seq          BIGINT        NOT NULL,
    coupon_seq        BIGINT        NOT NULL,
    coupon_status     VARCHAR(20)   DEFAULT 'AVAILABLE',
    issued_date       TIMESTAMPTZ   DEFAULT NOW(),
    expire_date       TIMESTAMPTZ,
    used_date         TIMESTAMPTZ,
    order_seq         BIGINT,
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  map_user_coupon                 IS '사용자에게 발급된 쿠폰';
COMMENT ON COLUMN map_user_coupon.user_coupon_seq IS '발급 쿠폰 일련번호';
COMMENT ON COLUMN map_user_coupon.user_seq        IS '사용자 일련번호 (mst_user.user_seq)';
COMMENT ON COLUMN map_user_coupon.coupon_seq      IS '쿠폰 일련번호 (mst_coupon.coupon_seq)';
COMMENT ON COLUMN map_user_coupon.coupon_status   IS 'AVAILABLE(사용가능)/USED(사용완료)/EXPIRED(만료)';
COMMENT ON COLUMN map_user_coupon.issued_date     IS '발급 일시';
COMMENT ON COLUMN map_user_coupon.expire_date     IS '만료 일시';
COMMENT ON COLUMN map_user_coupon.used_date       IS '사용 일시';
COMMENT ON COLUMN map_user_coupon.order_seq       IS '사용한 주문 (dat_order.order_seq)';
COMMENT ON COLUMN map_user_coupon.use_yn          IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN map_user_coupon.i_user          IS '등록자 ID';
COMMENT ON COLUMN map_user_coupon.i_date          IS '등록일시';
COMMENT ON COLUMN map_user_coupon.u_user          IS '수정자 ID';
COMMENT ON COLUMN map_user_coupon.u_date          IS '수정일시';


-- 7-3. 포인트 적립/사용 이력
CREATE TABLE his_point (
    point_seq         BIGSERIAL PRIMARY KEY,
    user_seq          BIGINT        NOT NULL,
    point_type        VARCHAR(20)   NOT NULL,
    point_amount      INTEGER       NOT NULL,
    balance_after     INTEGER       NOT NULL,
    reason            VARCHAR(500),
    order_seq         BIGINT,
    expire_date       TIMESTAMPTZ,
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  his_point               IS '포인트 적립/사용 이력';
COMMENT ON COLUMN his_point.point_seq     IS '포인트 이력 일련번호';
COMMENT ON COLUMN his_point.user_seq      IS '사용자 일련번호 (mst_user.user_seq)';
COMMENT ON COLUMN his_point.point_type    IS 'EARN(적립)/USE(사용)/EXPIRE(소멸)/CANCEL(취소환원)';
COMMENT ON COLUMN his_point.point_amount  IS '변동량 (적립=양수, 사용=음수)';
COMMENT ON COLUMN his_point.balance_after IS '변동 후 잔액';
COMMENT ON COLUMN his_point.reason        IS '사유';
COMMENT ON COLUMN his_point.order_seq     IS '연관 주문 (dat_order.order_seq)';
COMMENT ON COLUMN his_point.expire_date   IS '소멸 예정 일시 (적립 포인트)';
COMMENT ON COLUMN his_point.use_yn        IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN his_point.i_user        IS '등록자 ID';
COMMENT ON COLUMN his_point.i_date        IS '등록일시';


-- =====================================================================
-- 8. 리뷰
-- =====================================================================

CREATE TABLE dat_review (
    review_seq        BIGSERIAL PRIMARY KEY,
    user_seq          BIGINT        NOT NULL,
    product_seq       BIGINT        NOT NULL,
    order_seq         BIGINT,
    item_seq          BIGINT,
    rating            INTEGER       NOT NULL,
    title             VARCHAR(100),
    content           VARCHAR(500)  NOT NULL,
    image_urls        TEXT,
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  dat_review             IS '상품 리뷰';
COMMENT ON COLUMN dat_review.review_seq  IS '리뷰 일련번호';
COMMENT ON COLUMN dat_review.user_seq    IS '작성자 (mst_user.user_seq)';
COMMENT ON COLUMN dat_review.product_seq IS '상품 일련번호 (mst_product.product_seq)';
COMMENT ON COLUMN dat_review.order_seq   IS '구매 주문 (dat_order.order_seq)';
COMMENT ON COLUMN dat_review.item_seq    IS '구매 주문 상품 (dat_order_item.item_seq)';
COMMENT ON COLUMN dat_review.rating      IS '평점 1~5';
COMMENT ON COLUMN dat_review.title       IS '리뷰 제목';
COMMENT ON COLUMN dat_review.content     IS '리뷰 본문';
COMMENT ON COLUMN dat_review.image_urls  IS '첨부 이미지 URL (JSON 배열)';
COMMENT ON COLUMN dat_review.use_yn      IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN dat_review.i_user      IS '등록자 ID';
COMMENT ON COLUMN dat_review.i_date      IS '등록일시';
COMMENT ON COLUMN dat_review.u_user      IS '수정자 ID';
COMMENT ON COLUMN dat_review.u_date      IS '수정일시';


-- =====================================================================
-- 9. 1:1 문의
-- =====================================================================

-- 9-1. 문의 마스터
CREATE TABLE dat_inquiry (
    inquiry_seq       BIGSERIAL PRIMARY KEY,
    inquiry_no        VARCHAR(50)   NOT NULL,
    user_seq          BIGINT        NOT NULL,
    inquiry_type      VARCHAR(30)   NOT NULL,
    title             VARCHAR(100)  NOT NULL,
    content           TEXT          NOT NULL,
    product_seq       BIGINT,
    order_seq         BIGINT,
    inquiry_status    VARCHAR(20)   DEFAULT 'WAITING',
    private_yn        CHAR(1)       DEFAULT 'N',
    answered_date     TIMESTAMPTZ,
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  dat_inquiry                IS '1:1 문의';
COMMENT ON COLUMN dat_inquiry.inquiry_seq    IS '문의 일련번호';
COMMENT ON COLUMN dat_inquiry.inquiry_no     IS '문의번호 (예: Q-2641)';
COMMENT ON COLUMN dat_inquiry.user_seq       IS '작성자 (mst_user.user_seq)';
COMMENT ON COLUMN dat_inquiry.inquiry_type   IS '재입고/배송/결제/교환반품/상품/기타';
COMMENT ON COLUMN dat_inquiry.title          IS '문의 제목';
COMMENT ON COLUMN dat_inquiry.content        IS '문의 본문';
COMMENT ON COLUMN dat_inquiry.product_seq    IS '관련 상품 (mst_product.product_seq)';
COMMENT ON COLUMN dat_inquiry.order_seq      IS '관련 주문 (dat_order.order_seq)';
COMMENT ON COLUMN dat_inquiry.inquiry_status IS 'WAITING(대기)/ANSWERED(답변완료)/CLOSED(종료)';
COMMENT ON COLUMN dat_inquiry.private_yn     IS '비공개 여부 (Y/N)';
COMMENT ON COLUMN dat_inquiry.answered_date  IS '답변 완료 일시';
COMMENT ON COLUMN dat_inquiry.use_yn         IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN dat_inquiry.i_user         IS '등록자 ID';
COMMENT ON COLUMN dat_inquiry.i_date         IS '등록일시';
COMMENT ON COLUMN dat_inquiry.u_user         IS '수정자 ID';
COMMENT ON COLUMN dat_inquiry.u_date         IS '수정일시';


-- 9-2. 문의 답변
CREATE TABLE dat_inquiry_reply (
    reply_seq         BIGSERIAL PRIMARY KEY,
    inquiry_seq       BIGINT        NOT NULL,
    admin_seq         BIGINT        NOT NULL,
    content           TEXT          NOT NULL,
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  dat_inquiry_reply             IS '1:1 문의 답변';
COMMENT ON COLUMN dat_inquiry_reply.reply_seq   IS '답변 일련번호';
COMMENT ON COLUMN dat_inquiry_reply.inquiry_seq IS '문의 일련번호 (dat_inquiry.inquiry_seq)';
COMMENT ON COLUMN dat_inquiry_reply.admin_seq   IS '답변 관리자 (mst_user.user_seq)';
COMMENT ON COLUMN dat_inquiry_reply.content     IS '답변 본문';
COMMENT ON COLUMN dat_inquiry_reply.use_yn      IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN dat_inquiry_reply.i_user      IS '등록자 ID';
COMMENT ON COLUMN dat_inquiry_reply.i_date      IS '등록일시';
COMMENT ON COLUMN dat_inquiry_reply.u_user      IS '수정자 ID';
COMMENT ON COLUMN dat_inquiry_reply.u_date      IS '수정일시';


-- =====================================================================
-- 10. 배너 / 배송 설정
-- =====================================================================

-- 10-1. 메인 히어로 배너
CREATE TABLE mst_banner (
    banner_seq        BIGSERIAL PRIMARY KEY,
    banner_type       VARCHAR(20)   DEFAULT 'HERO',
    title             VARCHAR(100)  NOT NULL,
    description       VARCHAR(500),
    image_url         VARCHAR(500)  NOT NULL,
    link_url          VARCHAR(500),
    sort_order        INTEGER       DEFAULT 0,
    display_yn        CHAR(1)       DEFAULT 'Y',
    use_yn            CHAR(1)       DEFAULT 'Y',
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  mst_banner                    IS '메인 히어로 배너';
COMMENT ON COLUMN mst_banner.banner_seq         IS '배너 일련번호';
COMMENT ON COLUMN mst_banner.banner_type        IS 'HERO(메인)/CATEGORY/PROMO 등';
COMMENT ON COLUMN mst_banner.title              IS '배너 제목';
COMMENT ON COLUMN mst_banner.description        IS '배너 설명';
COMMENT ON COLUMN mst_banner.image_url          IS '대표 이미지 URL';
COMMENT ON COLUMN mst_banner.link_url           IS '클릭 시 이동 URL';
COMMENT ON COLUMN mst_banner.sort_order         IS '슬라이드 순서';
COMMENT ON COLUMN mst_banner.display_yn         IS '노출 여부 (노출중/숨김)';
COMMENT ON COLUMN mst_banner.use_yn             IS '사용 여부 (Y/N, 소프트 딜리트)';
COMMENT ON COLUMN mst_banner.i_user             IS '등록자 ID';
COMMENT ON COLUMN mst_banner.i_date             IS '등록일시';
COMMENT ON COLUMN mst_banner.u_user             IS '수정자 ID';
COMMENT ON COLUMN mst_banner.u_date             IS '수정일시';


-- 10-2. 배송 설정 (단일행)
CREATE TABLE mst_shipping (
    ship_seq          BIGSERIAL PRIMARY KEY,
    shipping_name     VARCHAR(100),
    shipping_fee      NUMERIC(15,2) DEFAULT 3000,
    free_shipping_min NUMERIC(15,2) DEFAULT 50000,
    remote_extra_fee  NUMERIC(15,2) DEFAULT 3000,
    shipping_notice   VARCHAR(500),
    i_user            VARCHAR(50),
    i_date            TIMESTAMPTZ   DEFAULT NOW(),
    u_user            VARCHAR(50),
    u_date            TIMESTAMPTZ   DEFAULT NOW()
);
COMMENT ON TABLE  mst_shipping                   IS '배송 설정 (단일행)';
COMMENT ON COLUMN mst_shipping.ship_seq          IS '배송 설정 일련번호';
COMMENT ON COLUMN mst_shipping.shipping_name     IS '기본 배송사명 (예: CJ대한통운)';
COMMENT ON COLUMN mst_shipping.shipping_fee      IS '기본 배송비';
COMMENT ON COLUMN mst_shipping.free_shipping_min IS '무료배송 기준 금액';
COMMENT ON COLUMN mst_shipping.remote_extra_fee  IS '제주/도서산간 추가 배송비';
COMMENT ON COLUMN mst_shipping.shipping_notice   IS '출고일 안내문';
COMMENT ON COLUMN mst_shipping.i_user            IS '등록자 ID';
COMMENT ON COLUMN mst_shipping.i_date            IS '등록일시';
COMMENT ON COLUMN mst_shipping.u_user            IS '수정자 ID';
COMMENT ON COLUMN mst_shipping.u_date            IS '수정일시';


-- =====================================================================
-- 인덱스 (꼭 필요한 것만)
--   1) UNIQUE: 비즈니스 무결성 (중복 방지)
--   2) FK 컬럼: 조인·조회 성능 (가장 자주 사용되는 경로만)
-- =====================================================================

-- 1) UNIQUE 인덱스
CREATE UNIQUE INDEX idx_mst_user_user_id           ON mst_user(user_id)             WHERE use_yn = 'Y';
CREATE UNIQUE INDEX idx_mst_product_product_code   ON mst_product(product_code)     WHERE use_yn = 'Y';
CREATE UNIQUE INDEX idx_mst_category_url_slug      ON mst_category(url_slug)        WHERE use_yn = 'Y';
CREATE UNIQUE INDEX idx_mst_coupon_coupon_code     ON mst_coupon(coupon_code)       WHERE use_yn = 'Y';
CREATE UNIQUE INDEX idx_dat_order_order_no         ON dat_order(order_no);
CREATE UNIQUE INDEX idx_dat_return_return_no       ON dat_return(return_no);
CREATE UNIQUE INDEX idx_dat_inquiry_inquiry_no     ON dat_inquiry(inquiry_no)       WHERE use_yn = 'Y';

-- 2) FK / 조회 인덱스
CREATE INDEX idx_mst_user_address_user_seq         ON mst_user_address(user_seq);
CREATE INDEX idx_mst_product_category_seq          ON mst_product(category_seq);
CREATE INDEX idx_mst_product_option_product_seq    ON mst_product_option(product_seq);
CREATE INDEX idx_mst_product_image_product_seq     ON mst_product_image(product_seq);
CREATE INDEX idx_dat_cart_user_seq                 ON dat_cart(user_seq);
CREATE INDEX idx_dat_order_user_seq                ON dat_order(user_seq, order_date DESC);
CREATE INDEX idx_dat_order_item_order_seq          ON dat_order_item(order_seq);
CREATE INDEX idx_dat_order_payment_order_seq       ON dat_order_payment(order_seq);
CREATE INDEX idx_dat_order_shipping_order_seq      ON dat_order_shipping(order_seq);
CREATE INDEX idx_dat_return_user_seq               ON dat_return(user_seq);
CREATE INDEX idx_dat_review_product_seq            ON dat_review(product_seq);
CREATE INDEX idx_dat_inquiry_user_seq              ON dat_inquiry(user_seq);
CREATE INDEX idx_map_user_coupon_user_seq          ON map_user_coupon(user_seq);
CREATE INDEX idx_his_point_user_seq                ON his_point(user_seq);

-- 3) JWT Refresh Token
CREATE UNIQUE INDEX idx_dat_refresh_token_token    ON dat_refresh_token(refresh_token);
CREATE INDEX        idx_dat_refresh_token_user_seq ON dat_refresh_token(user_seq);
