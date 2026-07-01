package com.micoz.admin.banner.spec;

import com.micoz.banner.entity.Banner;
import org.springframework.data.jpa.domain.Specification;

/**
 * 배너 검색 Specification 정적 팩토리 (S-T1). C-T2 {@code ProductSpecs} / M-T1 {@code UserSpecs}
 * 규약을 그대로 답습한다.
 *
 * <p>설계 원칙(동일):
 * <ul>
 *   <li><b>전부 null-safe</b> — 조건 값이 null/blank면 {@code toPredicate}가 null 반환,
 *       Specification 합성(.and) 시 자동 무시.</li>
 *   <li><b>조인 없음</b> — 평면 컬럼 eq/like만. (배너는 자식 테이블 없음)</li>
 *   <li><b>LIKE 메타문자 이스케이프</b>(\, %, _) — ProductSpecs와 동일 helper.</li>
 * </ul>
 */
public final class BannerSpecs {

    /** LIKE 패턴 이스케이프 문자. */
    private static final char LIKE_ESCAPE = '\\';

    private BannerSpecs() {
    }

    /** title 부분일치. */
    public static Specification<Banner> titleLike(String title) {
        return (root, query, cb) -> isBlank(title) ? null
                : cb.like(root.get("title"), containsPattern(title), LIKE_ESCAPE);
    }

    /** 배너 타입(banner_type) 일치. */
    public static Specification<Banner> bannerTypeEq(String bannerType) {
        return (root, query, cb) -> isBlank(bannerType) ? null : cb.equal(root.get("bannerType"), bannerType);
    }

    /** 노출 여부(display_yn) 일치. */
    public static Specification<Banner> displayYnEq(String displayYn) {
        return (root, query, cb) -> isBlank(displayYn) ? null : cb.equal(root.get("displayYn"), displayYn);
    }

    /** 소프트삭제 필터 — includeDeleted=false면 use_yn='Y'만, true면 무제한. */
    public static Specification<Banner> activeOnly(boolean includeDeleted) {
        return (root, query, cb) -> includeDeleted ? null : cb.equal(root.get("useYn"), "Y");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    /**
     * 부분일치(contains) LIKE 패턴 생성. 사용자 입력의 LIKE 메타문자(\, %, _)를 이스케이프해
     * 와일드카드 오작동을 막는다. {@link #LIKE_ESCAPE}를 escape 문자로 함께 지정해야 한다.
     */
    private static String containsPattern(String value) {
        String escaped = value.trim()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
