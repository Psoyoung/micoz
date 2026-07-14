package com.micoz.inquiry.entity;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * 문의 처리 상태 (dat_inquiry.inquiry_status) — 관리자 응대(FR-ADM-07).
 * O/R의 {@link com.micoz.returns.entity.ReturnStatus} 전이표 패턴을 그대로 답습한다(CS-T1).
 *
 * <p>아래 {@code ALLOWED} 맵이 허용 전이의 <b>단일 정본</b>이다. 경량 모듈이라 {@code WAITING → ANSWERED}
 * 단일 전이·2상태이며, ANSWERED는 종결 상태(빈 집합)로 되돌리기가 없어 순환이 없다. 전이 강제는
 * {@link Inquiry#changeStatus(InquiryStatus)}가 단일 지점에서 수행한다(위반 시 {@code INQUIRY_TRANSITION_INVALID}).
 *
 * <p><b>범위 밖(CS-Q③=(a) 확정)</b>: 스키마 주석의 {@code CLOSED}는 정의만 되고 FR 근거가 없는 잔재라 enum에
 * 포함하지 않는다. 재문의(ANSWERED→WAITING 되돌리기)도 미지원. 재답변은 <b>상태 전이가 아니므로</b>(CS-Q②=(a))
 * 이 전이표에 없다 — 서비스가 ANSWERED 상태에서는 {@code changeStatus}를 호출하지 않고 답변만 append한다(CS-T3).
 */
public enum InquiryStatus {
    WAITING, ANSWERED;

    private static final Map<InquiryStatus, Set<InquiryStatus>> ALLOWED = new EnumMap<>(InquiryStatus.class);
    static {
        ALLOWED.put(WAITING,  EnumSet.of(ANSWERED));               // 최초 답변 등록
        ALLOWED.put(ANSWERED, EnumSet.noneOf(InquiryStatus.class)); // 종결(재답변은 전이 아님)
    }

    public boolean canTransitionTo(InquiryStatus target) {
        return ALLOWED.get(this).contains(target);
    }

    /** 문자열 상태를 enum으로 파싱. 미지/잘못된 값은 유효 전이 불가로 간주 → INQUIRY_TRANSITION_INVALID. */
    public static InquiryStatus from(String raw) {
        try {
            return InquiryStatus.valueOf(raw);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BusinessException(ErrorCode.INQUIRY_TRANSITION_INVALID);
        }
    }
}
