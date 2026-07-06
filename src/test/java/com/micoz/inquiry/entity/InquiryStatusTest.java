package com.micoz.inquiry.entity;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * CS-T1 문의 전이표 전수 검증(R의 ReturnStatusTest 답습). 독립 기대맵으로 맵을 핀고정하고,
 * 실제 choke point({@link Inquiry#changeStatus})로 "각 상태 × 모든 목표"의 허용/차단을 빠짐없이 단언한다.
 * 경량 2상태(WAITING→ANSWERED)라 조합 수는 적지만, 되돌리기/자기전이 차단을 명시적으로 고정한다.
 */
class InquiryStatusTest {

    /** 기대 허용 전이 — 프로덕션 맵과 독립 하드코딩(맵 오타를 이 테스트가 잡는다). */
    private static final Map<InquiryStatus, Set<InquiryStatus>> EXPECTED = new EnumMap<>(InquiryStatus.class);
    static {
        EXPECTED.put(InquiryStatus.WAITING,  EnumSet.of(InquiryStatus.ANSWERED));
        EXPECTED.put(InquiryStatus.ANSWERED, EnumSet.noneOf(InquiryStatus.class));
    }

    @Test
    @DisplayName("canTransitionTo: 각 상태 × 모든 목표 = 기대맵과 정확히 일치")
    void predicateMatchesExpectedForEveryPair() {
        for (InquiryStatus from : InquiryStatus.values()) {
            for (InquiryStatus to : InquiryStatus.values()) {
                assertThat(from.canTransitionTo(to))
                        .as("%s → %s", from, to)
                        .isEqualTo(EXPECTED.get(from).contains(to));
            }
        }
    }

    @Test
    @DisplayName("changeStatus: 허용 전이 전부 통과 + 비허용 전이 전부 INQUIRY_TRANSITION_INVALID")
    void changeStatusEnforcesEveryPair() {
        for (InquiryStatus from : InquiryStatus.values()) {
            for (InquiryStatus to : InquiryStatus.values()) {
                if (EXPECTED.get(from).contains(to)) {
                    Inquiry allowed = inquiryIn(from);
                    assertThatCode(() -> allowed.changeStatus(to)).as("허용 %s → %s", from, to).doesNotThrowAnyException();
                    assertThat(allowed.getInquiryStatus()).isEqualTo(to.name());
                } else {
                    Inquiry blocked = inquiryIn(from);
                    assertThatThrownBy(() -> blocked.changeStatus(to))
                            .as("비허용 %s → %s", from, to)
                            .isInstanceOf(BusinessException.class)
                            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INQUIRY_TRANSITION_INVALID);
                    assertThat(blocked.getInquiryStatus()).as("차단 시 상태 불변").isEqualTo(from.name());
                }
            }
        }
    }

    @Test
    @DisplayName("종결 상태(ANSWERED)는 나가는 전이 없음 → 되돌리기·자기전이 차단, 순환 없음")
    void answeredIsTerminal() {
        for (InquiryStatus to : InquiryStatus.values()) {
            assertThat(InquiryStatus.ANSWERED.canTransitionTo(to)).as("ANSWERED → %s", to).isFalse();
        }
    }

    @Test
    @DisplayName("markAnswered: WAITING에서만 허용(답변완료일시 기록), 이미 ANSWERED면 INQUIRY_TRANSITION_INVALID")
    void markAnsweredOnlyFromWaiting() {
        Inquiry waiting = inquiryIn(InquiryStatus.WAITING);
        OffsetDateTime when = OffsetDateTime.now();
        waiting.markAnswered(when);
        assertThat(waiting.getInquiryStatus()).isEqualTo("ANSWERED");
        assertThat(waiting.getAnsweredDate()).isEqualTo(when);

        // 이미 ANSWERED에서 markAnswered 재호출(ANSWERED→ANSWERED 비허용) → 차단.
        // (재답변 시 서비스는 markAnswered를 호출하지 않고 답변만 append — CS-T3에서 검증.)
        Inquiry answered = inquiryIn(InquiryStatus.ANSWERED);
        assertThatThrownBy(() -> answered.markAnswered(OffsetDateTime.now()))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INQUIRY_TRANSITION_INVALID);
    }

    @Test
    @DisplayName("from: 미지/잘못된 문자열 상태 → INQUIRY_TRANSITION_INVALID (파싱 방어)")
    void fromRejectsUnknown() {
        assertThatThrownBy(() -> InquiryStatus.from("BOGUS"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INQUIRY_TRANSITION_INVALID);
        assertThatThrownBy(() -> InquiryStatus.from("CLOSED")) // 스키마 잔재(CS-Q③) — enum 미포함이라 파싱 거절
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INQUIRY_TRANSITION_INVALID);
        assertThatThrownBy(() -> InquiryStatus.from(null))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INQUIRY_TRANSITION_INVALID);
    }

    private Inquiry inquiryIn(InquiryStatus status) {
        return Inquiry.builder()
                .inquiryNo("IQ-TEST")
                .userSeq(1L)
                .inquiryType("PRODUCT")
                .title("제목")
                .content("본문")
                .inquiryStatus(status.name())
                .build();
    }
}
