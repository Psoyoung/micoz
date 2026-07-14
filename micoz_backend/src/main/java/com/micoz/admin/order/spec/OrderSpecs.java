package com.micoz.admin.order.spec;

import com.micoz.order.entity.Order;
import org.springframework.data.jpa.domain.Specification;

import java.time.OffsetDateTime;

/**
 * 주문 검색 Specification 정적 팩토리 (O-T4). C-T2 {@code ProductSpecs}·M-T1 {@code UserSpecs} 패턴을 답습한다.
 * 전부 null-safe(값 없으면 predicate null → .and 합성 시 무시), LIKE 메타문자 이스케이프, 조인 없음.
 * 관리자용이라 {@code user_seq} 제약 없이 전 주문을 대상으로 한다(사용자 측 본인-행 제약과 분리).
 */
public final class OrderSpecs {

    private static final char LIKE_ESCAPE = '\\';

    private OrderSpecs() {
    }

    /** 주문번호(order_no) 부분일치. */
    public static Specification<Order> orderNoLike(String q) {
        return (root, query, cb) -> isBlank(q) ? null
                : cb.like(root.get("orderNo"), containsPattern(q), LIKE_ESCAPE);
    }

    /** 주문 상태(order_status) 일치. */
    public static Specification<Order> orderStatusEq(String orderStatus) {
        return (root, query, cb) -> isBlank(orderStatus) ? null : cb.equal(root.get("orderStatus"), orderStatus);
    }

    /** 특정 회원(user_seq) 주문만. */
    public static Specification<Order> userSeqEq(Long userSeq) {
        return (root, query, cb) -> userSeq == null ? null : cb.equal(root.get("userSeq"), userSeq);
    }

    /** 주문일시 하한(order_date ≥ from). */
    public static Specification<Order> orderDateGoe(OffsetDateTime from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("orderDate"), from);
    }

    /** 주문일시 상한(order_date ≤ to). */
    public static Specification<Order> orderDateLoe(OffsetDateTime to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("orderDate"), to);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    /** 부분일치 LIKE 패턴 — 사용자 입력의 메타문자(\, %, _)를 이스케이프. */
    private static String containsPattern(String value) {
        String escaped = value.trim()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
