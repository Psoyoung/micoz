package com.micoz.admin.returns.spec;

import com.micoz.returns.entity.Return;
import org.springframework.data.jpa.domain.Specification;

import java.time.OffsetDateTime;

/**
 * 반품 검색 Specification 정적 팩토리 (R-T4). O-T4 {@code OrderSpecs} 패턴 답습.
 * 전부 null-safe(값 없으면 predicate null → .and 무시), LIKE 이스케이프, 조인 없음. 관리자용(전 회원 반품).
 */
public final class ReturnSpecs {

    private static final char LIKE_ESCAPE = '\\';

    private ReturnSpecs() {
    }

    /** 반품번호(return_no) 부분일치. */
    public static Specification<Return> returnNoLike(String q) {
        return (root, query, cb) -> isBlank(q) ? null
                : cb.like(root.get("returnNo"), containsPattern(q), LIKE_ESCAPE);
    }

    /** 반품 상태(return_status) 일치. */
    public static Specification<Return> returnStatusEq(String status) {
        return (root, query, cb) -> isBlank(status) ? null : cb.equal(root.get("returnStatus"), status);
    }

    /** 반품 유형(return_type) 일치. */
    public static Specification<Return> returnTypeEq(String type) {
        return (root, query, cb) -> isBlank(type) ? null : cb.equal(root.get("returnType"), type);
    }

    /** 특정 회원(user_seq) 반품만. */
    public static Specification<Return> userSeqEq(Long userSeq) {
        return (root, query, cb) -> userSeq == null ? null : cb.equal(root.get("userSeq"), userSeq);
    }

    /** 신청일시 하한(requested_date ≥ from). */
    public static Specification<Return> requestedGoe(OffsetDateTime from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("requestedDate"), from);
    }

    /** 신청일시 상한(requested_date ≤ to). */
    public static Specification<Return> requestedLoe(OffsetDateTime to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("requestedDate"), to);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String containsPattern(String value) {
        String escaped = value.trim()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
