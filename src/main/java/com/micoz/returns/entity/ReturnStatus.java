package com.micoz.returns.entity;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * 반품 처리 상태 (dat_return.return_status) — 관리자 워크플로우(FR-ADM-06).
 * O의 {@link com.micoz.order.entity.OrderStatus} 전이표 패턴을 그대로 답습한다(RD1).
 *
 * <p>아래 {@code ALLOWED} 맵이 허용 전이의 <b>단일 정본</b>이다. 단방향 전진 + REJECTED 분기(RD1-a: 3진입점)로
 * 역방향 항목이 없어 순환이 없다. COMPLETED/REJECTED는 종결 상태(빈 집합). 전이 강제는
 * {@link Return#changeStatus(ReturnStatus)}가 단일 지점에서 수행한다(위반 시 {@code RETURN_TRANSITION_INVALID}).
 * 어휘는 COLLECTED/INSPECTED로 통일(RD1: 엔티티·admin-overview·코드 관례).
 */
public enum ReturnStatus {
    REQUESTED, APPROVED, COLLECTED, INSPECTED, COMPLETED, REJECTED;

    private static final Map<ReturnStatus, Set<ReturnStatus>> ALLOWED = new EnumMap<>(ReturnStatus.class);
    static {
        ALLOWED.put(REQUESTED, EnumSet.of(APPROVED, REJECTED));   // 승인 / 즉시 반려
        ALLOWED.put(APPROVED,  EnumSet.of(COLLECTED, REJECTED));  // 회수 시작 / 반려
        ALLOWED.put(COLLECTED, EnumSet.of(INSPECTED));            // 검수 진입
        ALLOWED.put(INSPECTED, EnumSet.of(COMPLETED, REJECTED));  // 완료 / 검수 반려
        ALLOWED.put(COMPLETED, EnumSet.noneOf(ReturnStatus.class));// 종결
        ALLOWED.put(REJECTED,  EnumSet.noneOf(ReturnStatus.class));// 종결
    }

    public boolean canTransitionTo(ReturnStatus target) {
        return ALLOWED.get(this).contains(target);
    }

    /** 문자열 상태를 enum으로 파싱. 미지/잘못된 값은 유효 전이 불가로 간주 → RETURN_TRANSITION_INVALID. */
    public static ReturnStatus from(String raw) {
        try {
            return ReturnStatus.valueOf(raw);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BusinessException(ErrorCode.RETURN_TRANSITION_INVALID);
        }
    }
}
