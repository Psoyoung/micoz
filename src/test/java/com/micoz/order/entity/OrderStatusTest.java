package com.micoz.order.entity;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * O-T2 전이표 전수 검증. 독립 기대맵(EXPECTED)으로 맵 자체를 핀고정하고,
 * 실제 choke point({@link Order#changeStatus})를 통해 "각 상태 × 모든 목표"의 허용/차단을 빠짐없이 단언한다.
 * R(반품) 상태머신이 답습할 표준이므로 누락 없는 전수 테스트가 필수.
 */
class OrderStatusTest {

    /** 기대 허용 전이 — 프로덕션 맵과 독립하게 하드코딩(맵 오타를 이 테스트가 잡는다). */
    private static final Map<OrderStatus, Set<OrderStatus>> EXPECTED = new EnumMap<>(OrderStatus.class);
    static {
        EXPECTED.put(OrderStatus.PENDING,   EnumSet.of(OrderStatus.PAID));
        EXPECTED.put(OrderStatus.PAID,      EnumSet.of(OrderStatus.PREPARING, OrderStatus.CANCELED));
        EXPECTED.put(OrderStatus.PREPARING, EnumSet.of(OrderStatus.SHIPPING, OrderStatus.CANCELED));
        EXPECTED.put(OrderStatus.SHIPPING,  EnumSet.of(OrderStatus.DELIVERED));
        EXPECTED.put(OrderStatus.DELIVERED, EnumSet.of(OrderStatus.RETURNED));
        EXPECTED.put(OrderStatus.CANCELED,  EnumSet.noneOf(OrderStatus.class));
        EXPECTED.put(OrderStatus.RETURNED,  EnumSet.noneOf(OrderStatus.class));
    }

    @Test
    @DisplayName("canTransitionTo: 각 상태 × 모든 목표 = 기대맵과 정확히 일치")
    void predicateMatchesExpectedForEveryPair() {
        for (OrderStatus from : OrderStatus.values()) {
            for (OrderStatus to : OrderStatus.values()) {
                assertThat(from.canTransitionTo(to))
                        .as("%s → %s", from, to)
                        .isEqualTo(EXPECTED.get(from).contains(to));
            }
        }
    }

    @Test
    @DisplayName("changeStatus: 허용 전이는 전부 통과 + 비허용 전이는 전부 ORDER_TRANSITION_INVALID")
    void changeStatusEnforcesEveryPair() {
        for (OrderStatus from : OrderStatus.values()) {
            for (OrderStatus to : OrderStatus.values()) {
                if (EXPECTED.get(from).contains(to)) {
                    Order allowed = orderIn(from);
                    assertThatCode(() -> allowed.changeStatus(to)).as("허용 %s → %s", from, to).doesNotThrowAnyException();
                    assertThat(allowed.getOrderStatus()).isEqualTo(to.name());
                } else {
                    Order blocked = orderIn(from);
                    assertThatThrownBy(() -> blocked.changeStatus(to))
                            .as("비허용 %s → %s", from, to)
                            .isInstanceOf(BusinessException.class)
                            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_TRANSITION_INVALID);
                    assertThat(blocked.getOrderStatus()).as("차단 시 상태 불변").isEqualTo(from.name());
                }
            }
        }
    }

    @Test
    @DisplayName("종결 상태(CANCELED/RETURNED)는 나가는 전이 없음 → 순환 없음")
    void terminalStatesHaveNoOutgoing() {
        assertThat(EXPECTED.get(OrderStatus.CANCELED)).isEmpty();
        assertThat(EXPECTED.get(OrderStatus.RETURNED)).isEmpty();
        for (OrderStatus to : OrderStatus.values()) {
            assertThat(OrderStatus.CANCELED.canTransitionTo(to)).isFalse();
            assertThat(OrderStatus.RETURNED.canTransitionTo(to)).isFalse();
        }
    }

    @Test
    @DisplayName("from: 미지/잘못된 문자열 상태 → ORDER_TRANSITION_INVALID (파싱 방어)")
    void fromRejectsUnknown() {
        assertThatThrownBy(() -> OrderStatus.from("BOGUS"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_TRANSITION_INVALID);
        assertThatThrownBy(() -> OrderStatus.from(null))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_TRANSITION_INVALID);
    }

    private Order orderIn(OrderStatus status) {
        return Order.builder()
                .orderNo("TEST")
                .userSeq(1L)
                .orderStatus(status.name())
                .finalAmount(BigDecimal.ZERO)
                .build();
    }
}
