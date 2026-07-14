package com.micoz.admin.order.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.OffsetDateTime;

/**
 * 주문 검색 조건 (O-T4). §3.1 도메인 권장(주문: orderNo/orderStatus/userSeq) + 기간 필터.
 * 쿼리 파라미터 바인딩(@ModelAttribute). 전부 선택 — 미지정 시 해당 축 무시(OrderSpecs가 null-safe).
 */
@Getter
@Setter
public class AdminOrderSearchCondition {

    /** 통합 키워드 — order_no 부분일치. */
    private String q;

    /** 주문 상태(order_status) 일치. */
    private String orderStatus;

    /** 특정 회원 주문만. */
    private Long userSeq;

    /** 주문일시 하한(ISO-8601). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private OffsetDateTime dateFrom;

    /** 주문일시 상한(ISO-8601). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private OffsetDateTime dateTo;
}
