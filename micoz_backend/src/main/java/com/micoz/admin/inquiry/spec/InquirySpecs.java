package com.micoz.admin.inquiry.spec;

import com.micoz.inquiry.entity.Inquiry;
import org.springframework.data.jpa.domain.Specification;

import java.time.OffsetDateTime;

/**
 * 문의 검색 Specification 정적 팩토리 (CS-T2). O-T4 {@code OrderSpecs}·R-T4 {@code ReturnSpecs} 패턴을 답습한다.
 * 전부 null-safe(값 없으면 predicate null → .and 합성 시 무시), LIKE 메타문자 이스케이프, 조인 없음.
 * 관리자용이라 {@code user_seq} 제약 없이 전 회원 문의를 대상으로 한다(사용자 측 본인-행 제약과 분리).
 * 비공개 문의({@code private_yn='Y'})도 관리자에겐 노출 — {@code privateYnEq}는 <b>선택 필터</b>일 뿐 기본 배제 아님.
 */
public final class InquirySpecs {

    private static final char LIKE_ESCAPE = '\\';

    private InquirySpecs() {
    }

    /** 제목(title) 부분일치. */
    public static Specification<Inquiry> titleLike(String q) {
        return (root, query, cb) -> isBlank(q) ? null
                : cb.like(root.get("title"), containsPattern(q), LIKE_ESCAPE);
    }

    /** 문의 유형(inquiry_type) 일치. */
    public static Specification<Inquiry> inquiryTypeEq(String inquiryType) {
        return (root, query, cb) -> isBlank(inquiryType) ? null : cb.equal(root.get("inquiryType"), inquiryType);
    }

    /** 문의 상태(inquiry_status) 일치. */
    public static Specification<Inquiry> inquiryStatusEq(String inquiryStatus) {
        return (root, query, cb) -> isBlank(inquiryStatus) ? null : cb.equal(root.get("inquiryStatus"), inquiryStatus);
    }

    /** 특정 회원(user_seq) 문의만. */
    public static Specification<Inquiry> userSeqEq(Long userSeq) {
        return (root, query, cb) -> userSeq == null ? null : cb.equal(root.get("userSeq"), userSeq);
    }

    /** 비공개 여부(private_yn) 일치 — 선택 필터(미지정 시 공개/비공개 모두). */
    public static Specification<Inquiry> privateYnEq(String privateYn) {
        return (root, query, cb) -> isBlank(privateYn) ? null : cb.equal(root.get("privateYn"), privateYn);
    }

    /** 등록일시 하한(i_date ≥ from) — 문의 전용 일자컬럼 없음, audit i_date 사용. */
    public static Specification<Inquiry> createdGoe(OffsetDateTime from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("iDate"), from);
    }

    /** 등록일시 상한(i_date ≤ to). */
    public static Specification<Inquiry> createdLoe(OffsetDateTime to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("iDate"), to);
    }

    /** 소프트삭제 필터(use_yn) — 목록은 활성 행만. */
    public static Specification<Inquiry> useYnEq(String useYn) {
        return (root, query, cb) -> isBlank(useYn) ? null : cb.equal(root.get("useYn"), useYn);
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
