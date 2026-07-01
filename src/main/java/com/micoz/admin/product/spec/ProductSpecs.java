package com.micoz.admin.product.spec;

import com.micoz.product.entity.Product;
import org.springframework.data.jpa.domain.Specification;

/**
 * 상품 검색 Specification 정적 팩토리 (C-T2). M-T1 {@code UserSpecs} 패턴을 그대로 답습한다.
 *
 * <p>설계 원칙(UserSpecs 동일):
 * <ul>
 *   <li><b>전부 null-safe</b> — 조건 값이 null/blank면 {@code toPredicate}가 null을 반환,
 *       Specification 합성(.and) 시 자동 무시된다.</li>
 *   <li><b>조인 없음</b> — categorySeq는 그대로 equal, 카테고리명은 목록에서 일괄 조회(N+1 방지).</li>
 *   <li><b>LIKE 메타문자 이스케이프</b>(\, %, _) — UserSpecs와 동일 helper.</li>
 * </ul>
 */
public final class ProductSpecs {

    /** LIKE 패턴 이스케이프 문자. */
    private static final char LIKE_ESCAPE = '\\';

    private ProductSpecs() {
    }

    /** productCode 부분일치. */
    public static Specification<Product> productCodeLike(String productCode) {
        return (root, query, cb) -> isBlank(productCode) ? null
                : cb.like(root.get("productCode"), containsPattern(productCode), LIKE_ESCAPE);
    }

    /** productName 부분일치. */
    public static Specification<Product> productNameLike(String productName) {
        return (root, query, cb) -> isBlank(productName) ? null
                : cb.like(root.get("productName"), containsPattern(productName), LIKE_ESCAPE);
    }

    /** 통합 키워드(q) — productCode OR productName 부분일치. */
    public static Specification<Product> keyword(String q) {
        return (root, query, cb) -> {
            if (isBlank(q)) {
                return null;
            }
            String pattern = containsPattern(q);
            return cb.or(
                    cb.like(root.get("productCode"), pattern, LIKE_ESCAPE),
                    cb.like(root.get("productName"), pattern, LIKE_ESCAPE));
        };
    }

    /** 카테고리 일치. */
    public static Specification<Product> categorySeqEq(Long categorySeq) {
        return (root, query, cb) -> categorySeq == null ? null : cb.equal(root.get("categorySeq"), categorySeq);
    }

    /** 노출 여부(display_yn) 일치. */
    public static Specification<Product> displayYnEq(String displayYn) {
        return (root, query, cb) -> isBlank(displayYn) ? null : cb.equal(root.get("displayYn"), displayYn);
    }

    /** 판매상태(product_status) 일치. */
    public static Specification<Product> statusEq(String status) {
        return (root, query, cb) -> isBlank(status) ? null : cb.equal(root.get("productStatus"), status);
    }

    /** 소프트삭제 필터 — includeDeleted=false면 use_yn='Y'만, true면 무제한. */
    public static Specification<Product> activeOnly(boolean includeDeleted) {
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
