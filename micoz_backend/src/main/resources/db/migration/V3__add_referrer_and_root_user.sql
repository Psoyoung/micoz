-- =====================================================================
-- mst_user 추천인 컬럼 추가 + 추천인 검증용 ROOT 시드 계정
-- =====================================================================

ALTER TABLE mst_user ADD COLUMN referrer_user_seq BIGINT;
COMMENT ON COLUMN mst_user.referrer_user_seq IS '추천인 user_seq (논리적 FK to mst_user.user_seq, 없으면 NULL)';

-- 추천 트리 조회 최적화 (NULL 행은 제외)
CREATE INDEX idx_mst_user_referrer ON mst_user(referrer_user_seq) WHERE referrer_user_seq IS NOT NULL;

-- ROOT 계정: 최초 가입자의 추천인으로 사용. role=ADMIN, grade=EXECUTIVE.
-- 비밀번호는 placeholder(무효 해시) — ROOT 자체는 로그인용이 아니라 추천인 검증용.
-- 실 운영 시 관리자 비밀번호 재설정 흐름으로 교체.
INSERT INTO mst_user (
    user_id, user_pw, user_name, user_role, grade_seq, user_status,
    service_yn, privacy_yn, service_agree_date, privacy_agree_date,
    i_user, referrer_user_seq
) VALUES (
    'ROOT',
    '$2a$12$invalidplaceholderxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    '루트관리자', 'ADMIN',
    (SELECT grade_seq FROM mst_user_grade WHERE grade_code = 'EXECUTIVE'),
    'ACTIVE', 'Y', 'Y', NOW(), NOW(),
    'SYSTEM', NULL
);
