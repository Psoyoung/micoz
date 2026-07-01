package com.micoz.order.entity;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * O-T2 배송 상태 전이표 전수 검증(예측 맵과 독립 대조). 실제 2컬럼 동기화 액션은 O-T3가 이 맵을 사용한다.
 */
class ShippingStatusTest {

    private static final Map<ShippingStatus, Set<ShippingStatus>> EXPECTED = new EnumMap<>(ShippingStatus.class);
    static {
        EXPECTED.put(ShippingStatus.READY,      EnumSet.of(ShippingStatus.SHIPPED));
        EXPECTED.put(ShippingStatus.SHIPPED,    EnumSet.of(ShippingStatus.IN_TRANSIT, ShippingStatus.DELIVERED));
        EXPECTED.put(ShippingStatus.IN_TRANSIT, EnumSet.of(ShippingStatus.DELIVERED));
        EXPECTED.put(ShippingStatus.DELIVERED,  EnumSet.noneOf(ShippingStatus.class));
    }

    @Test
    @DisplayName("canTransitionTo: 각 상태 × 모든 목표 = 기대맵과 정확히 일치")
    void predicateMatchesExpectedForEveryPair() {
        for (ShippingStatus from : ShippingStatus.values()) {
            for (ShippingStatus to : ShippingStatus.values()) {
                assertThat(from.canTransitionTo(to))
                        .as("%s → %s", from, to)
                        .isEqualTo(EXPECTED.get(from).contains(to));
            }
        }
    }

    @Test
    @DisplayName("배송완료(deliver)는 SHIPPED·IN_TRANSIT 양쪽에서 허용(IN_TRANSIT 생략 허용)")
    void deliverFromBothShippedAndInTransit() {
        assertThat(ShippingStatus.SHIPPED.canTransitionTo(ShippingStatus.DELIVERED)).isTrue();
        assertThat(ShippingStatus.IN_TRANSIT.canTransitionTo(ShippingStatus.DELIVERED)).isTrue();
    }

    @Test
    @DisplayName("DELIVERED 종결 → 나가는 전이 없음(순환 없음)")
    void deliveredIsTerminal() {
        for (ShippingStatus to : ShippingStatus.values()) {
            assertThat(ShippingStatus.DELIVERED.canTransitionTo(to)).isFalse();
        }
    }

    @Test
    @DisplayName("from: 미지/잘못된 문자열 → ORDER_TRANSITION_INVALID")
    void fromRejectsUnknown() {
        assertThatThrownBy(() -> ShippingStatus.from("BOGUS"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_TRANSITION_INVALID);
    }
}
