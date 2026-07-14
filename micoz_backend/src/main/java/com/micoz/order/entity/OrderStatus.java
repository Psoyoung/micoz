package com.micoz.order.entity;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * 주문 생명주기 상태 (dat_order.order_status) — 굵은 단위.
 * 배송 세부 단계는 {@link ShippingStatus}가 별도로 답한다(Q-A(b): 2컬럼 분리 유지).
 *
 * <p>아래 {@code ALLOWED} 맵이 허용 전이의 <b>단일 정본</b>이다(D1). 단방향 전진 + 관리자 취소만
 * 허용하며(Q-B) 역방향 항목이 없어 그래프에 순환이 없다. CANCELED/RETURNED는 종결 상태(빈 집합).
 * 전이 강제는 {@link Order#changeStatus(OrderStatus)}가 단일 지점에서 수행한다
 * (위반 시 {@code ORDER_TRANSITION_INVALID}). R(반품)의 상태머신은 이 패턴을 그대로 답습한다.
 */
public enum OrderStatus {
    PENDING, PAID, PREPARING, SHIPPING, DELIVERED, CANCELED, RETURNED;

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED = new EnumMap<>(OrderStatus.class);
    static {
        ALLOWED.put(PENDING,   EnumSet.of(PAID));                 // 결제(M4 기존, 전이표로 승격)
        ALLOWED.put(PAID,      EnumSet.of(PREPARING, CANCELED));  // 준비 시작 / 관리자 취소
        ALLOWED.put(PREPARING, EnumSet.of(SHIPPING, CANCELED));   // 출고 / 관리자 취소
        ALLOWED.put(SHIPPING,  EnumSet.of(DELIVERED));            // 배송완료
        ALLOWED.put(DELIVERED, EnumSet.of(RETURNED));             // R 종결이 유발(R→전이서비스)
        ALLOWED.put(CANCELED,  EnumSet.noneOf(OrderStatus.class));// 종결
        ALLOWED.put(RETURNED,  EnumSet.noneOf(OrderStatus.class));// 종결
    }

    public boolean canTransitionTo(OrderStatus target) {
        return ALLOWED.get(this).contains(target);
    }

    /** 문자열 상태를 enum으로 파싱. 미지/잘못된 값은 유효 전이 불가로 간주 → ORDER_TRANSITION_INVALID. */
    public static OrderStatus from(String raw) {
        try {
            return OrderStatus.valueOf(raw);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BusinessException(ErrorCode.ORDER_TRANSITION_INVALID);
        }
    }
}
