package com.micoz.order.entity;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * 배송 세부 상태 (dat_order_shipping.shipping_status) — 세부 단위.
 * 주문 생명주기({@link OrderStatus})와 분리된 도메인 모델(Q-A(b)).
 *
 * <p>{@code ALLOWED} 맵이 허용 전이의 단일 정본이다. 단방향 전진(순환 없음), DELIVERED는 종결.
 * 배송완료(deliver)는 SHIPPED/IN_TRANSIT 양쪽에서 허용(관리자가 IN_TRANSIT 단계를 생략하는
 * 수동 운영 현실 반영). 두 컬럼의 동시 이동(출고·배송완료)은 O-T3의 액션 레이어가 원자적으로 조정한다.
 */
public enum ShippingStatus {
    READY, SHIPPED, IN_TRANSIT, DELIVERED;

    private static final Map<ShippingStatus, Set<ShippingStatus>> ALLOWED = new EnumMap<>(ShippingStatus.class);
    static {
        ALLOWED.put(READY,      EnumSet.of(SHIPPED));                  // 운송장 입력·출고
        ALLOWED.put(SHIPPED,    EnumSet.of(IN_TRANSIT, DELIVERED));    // 배송중 전환 / (IN_TRANSIT 생략)완료
        ALLOWED.put(IN_TRANSIT, EnumSet.of(DELIVERED));               // 배송완료
        ALLOWED.put(DELIVERED,  EnumSet.noneOf(ShippingStatus.class));// 종결
    }

    public boolean canTransitionTo(ShippingStatus target) {
        return ALLOWED.get(this).contains(target);
    }

    /** 문자열 상태를 enum으로 파싱. 미지/잘못된 값은 유효 전이 불가로 간주 → ORDER_TRANSITION_INVALID. */
    public static ShippingStatus from(String raw) {
        try {
            return ShippingStatus.valueOf(raw);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BusinessException(ErrorCode.ORDER_TRANSITION_INVALID);
        }
    }
}
