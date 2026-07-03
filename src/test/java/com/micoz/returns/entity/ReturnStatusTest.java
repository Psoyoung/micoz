package com.micoz.returns.entity;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * R-T2 반품 전이표 전수 검증(O의 OrderStatusTest 답습). 독립 기대맵으로 맵을 핀고정하고,
 * 실제 choke point({@link Return#changeStatus})로 "각 상태 × 모든 목표"의 허용/차단을 빠짐없이 단언한다.
 */
class ReturnStatusTest {

    /** 기대 허용 전이 — 프로덕션 맵과 독립 하드코딩(맵 오타를 이 테스트가 잡는다). */
    private static final Map<ReturnStatus, Set<ReturnStatus>> EXPECTED = new EnumMap<>(ReturnStatus.class);
    static {
        EXPECTED.put(ReturnStatus.REQUESTED, EnumSet.of(ReturnStatus.APPROVED, ReturnStatus.REJECTED));
        EXPECTED.put(ReturnStatus.APPROVED,  EnumSet.of(ReturnStatus.COLLECTED, ReturnStatus.REJECTED));
        EXPECTED.put(ReturnStatus.COLLECTED, EnumSet.of(ReturnStatus.INSPECTED));
        EXPECTED.put(ReturnStatus.INSPECTED, EnumSet.of(ReturnStatus.COMPLETED, ReturnStatus.REJECTED));
        EXPECTED.put(ReturnStatus.COMPLETED, EnumSet.noneOf(ReturnStatus.class));
        EXPECTED.put(ReturnStatus.REJECTED,  EnumSet.noneOf(ReturnStatus.class));
    }

    @Test
    @DisplayName("canTransitionTo: 각 상태 × 모든 목표 = 기대맵과 정확히 일치")
    void predicateMatchesExpectedForEveryPair() {
        for (ReturnStatus from : ReturnStatus.values()) {
            for (ReturnStatus to : ReturnStatus.values()) {
                assertThat(from.canTransitionTo(to))
                        .as("%s → %s", from, to)
                        .isEqualTo(EXPECTED.get(from).contains(to));
            }
        }
    }

    @Test
    @DisplayName("changeStatus: 허용 전이 전부 통과 + 비허용 전이 전부 RETURN_TRANSITION_INVALID")
    void changeStatusEnforcesEveryPair() {
        for (ReturnStatus from : ReturnStatus.values()) {
            for (ReturnStatus to : ReturnStatus.values()) {
                if (EXPECTED.get(from).contains(to)) {
                    Return allowed = returnIn(from);
                    assertThatCode(() -> allowed.changeStatus(to)).as("허용 %s → %s", from, to).doesNotThrowAnyException();
                    assertThat(allowed.getReturnStatus()).isEqualTo(to.name());
                } else {
                    Return blocked = returnIn(from);
                    assertThatThrownBy(() -> blocked.changeStatus(to))
                            .as("비허용 %s → %s", from, to)
                            .isInstanceOf(BusinessException.class)
                            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RETURN_TRANSITION_INVALID);
                    assertThat(blocked.getReturnStatus()).as("차단 시 상태 불변").isEqualTo(from.name());
                }
            }
        }
    }

    @Test
    @DisplayName("REJECTED 3진입점(REQUESTED/APPROVED/INSPECTED)만 허용, COLLECTED에선 불가")
    void rejectedEntryPoints() {
        assertThat(ReturnStatus.REQUESTED.canTransitionTo(ReturnStatus.REJECTED)).isTrue();
        assertThat(ReturnStatus.APPROVED.canTransitionTo(ReturnStatus.REJECTED)).isTrue();
        assertThat(ReturnStatus.INSPECTED.canTransitionTo(ReturnStatus.REJECTED)).isTrue();
        assertThat(ReturnStatus.COLLECTED.canTransitionTo(ReturnStatus.REJECTED)).isFalse();
    }

    @Test
    @DisplayName("종결 상태(COMPLETED/REJECTED)는 나가는 전이 없음 → 순환 없음")
    void terminalStatesHaveNoOutgoing() {
        for (ReturnStatus to : ReturnStatus.values()) {
            assertThat(ReturnStatus.COMPLETED.canTransitionTo(to)).isFalse();
            assertThat(ReturnStatus.REJECTED.canTransitionTo(to)).isFalse();
        }
    }

    @Test
    @DisplayName("markCompleted: INSPECTED에서만 허용(완료일시 기록), 그 외 상태는 RETURN_TRANSITION_INVALID")
    void markCompletedOnlyFromInspected() {
        Return inspected = returnIn(ReturnStatus.INSPECTED);
        inspected.markCompleted(java.time.OffsetDateTime.now());
        assertThat(inspected.getReturnStatus()).isEqualTo("COMPLETED");
        assertThat(inspected.getCompletedDate()).isNotNull();

        assertThatThrownBy(() -> returnIn(ReturnStatus.REQUESTED).markCompleted(java.time.OffsetDateTime.now()))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RETURN_TRANSITION_INVALID);
    }

    @Test
    @DisplayName("from: 미지/잘못된 문자열 상태 → RETURN_TRANSITION_INVALID (파싱 방어)")
    void fromRejectsUnknown() {
        assertThatThrownBy(() -> ReturnStatus.from("BOGUS"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RETURN_TRANSITION_INVALID);
        assertThatThrownBy(() -> ReturnStatus.from(null))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RETURN_TRANSITION_INVALID);
    }

    private Return returnIn(ReturnStatus status) {
        return Return.builder()
                .returnNo("R-TEST")
                .orderSeq(1L)
                .userSeq(1L)
                .returnType("RETURN")
                .returnStatus(status.name())
                .build();
    }
}
