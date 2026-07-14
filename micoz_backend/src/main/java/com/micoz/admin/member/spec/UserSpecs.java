package com.micoz.admin.member.spec;

import com.micoz.user.entity.User;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * 회원 검색 Specification 정적 팩토리 (M-T1). 뒤 모듈(O/R/CS/C)의 동적 검색 표준.
 *
 * <p>설계 원칙:
 * <ul>
 *   <li><b>전부 null-safe</b> — 조건 값이 null/blank면 {@code toPredicate}가 null을 반환,
 *       Specification 합성(.and) 시 자동 무시된다(별도 null 체크 불필요).</li>
 *   <li><b>조인 없음</b> — gradeCode 필터는 서비스에서 gradeSeq로 변환 후 {@link #gradeSeqEq}로 처리
 *       (등급 매핑은 목록에서 일괄 조회, N+1 방지).</li>
 * </ul>
 */
public final class UserSpecs {

    /** LIKE 패턴 이스케이프 문자. */
    private static final char LIKE_ESCAPE = '\\';

    private UserSpecs() {
    }

    /** user_role 고정 일치 (회원 목록은 CUSTOMER만 — ADMIN 행 원천 배제). */
    public static Specification<User> roleEq(String role) {
        return (root, query, cb) -> role == null ? null : cb.equal(root.get("userRole"), role);
    }

    /** userId 부분일치. */
    public static Specification<User> userIdLike(String userId) {
        return (root, query, cb) -> isBlank(userId) ? null
                : cb.like(root.get("userId"), containsPattern(userId), LIKE_ESCAPE);
    }

    /** userName 부분일치. */
    public static Specification<User> userNameLike(String userName) {
        return (root, query, cb) -> isBlank(userName) ? null
                : cb.like(root.get("userName"), containsPattern(userName), LIKE_ESCAPE);
    }

    /** 통합 키워드(q) — userId OR userName 부분일치. */
    public static Specification<User> keyword(String q) {
        return (root, query, cb) -> {
            if (isBlank(q)) {
                return null;
            }
            String pattern = containsPattern(q);
            return cb.or(
                    cb.like(root.get("userId"), pattern, LIKE_ESCAPE),
                    cb.like(root.get("userName"), pattern, LIKE_ESCAPE));
        };
    }

    /** 등급 일치 (gradeCode→gradeSeq 변환 결과를 받음). */
    public static Specification<User> gradeSeqEq(Long gradeSeq) {
        return (root, query, cb) -> gradeSeq == null ? null : cb.equal(root.get("gradeSeq"), gradeSeq);
    }

    /** 운영 상태(user_status) 일치. */
    public static Specification<User> statusEq(String status) {
        return (root, query, cb) -> isBlank(status) ? null : cb.equal(root.get("userStatus"), status);
    }

    /** 가입일(i_date) ≥ from (해당일 00:00 UTC 이상). */
    public static Specification<User> joinedFrom(LocalDate from) {
        return (root, query, cb) -> {
            if (from == null) {
                return null;
            }
            OffsetDateTime start = from.atStartOfDay().atOffset(ZoneOffset.UTC);
            return cb.greaterThanOrEqualTo(root.<OffsetDateTime>get("iDate"), start);
        };
    }

    /** 가입일(i_date) ≤ to (해당일 끝까지 포함 = 익일 00:00 UTC 미만). */
    public static Specification<User> joinedTo(LocalDate to) {
        return (root, query, cb) -> {
            if (to == null) {
                return null;
            }
            OffsetDateTime endExclusive = to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
            return cb.lessThan(root.<OffsetDateTime>get("iDate"), endExclusive);
        };
    }

    /** 소프트삭제 필터 — includeDeleted=false면 use_yn='Y'만, true면 무제한. */
    public static Specification<User> activeOnly(boolean includeDeleted) {
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
