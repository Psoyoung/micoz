package com.micoz.admin.order.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** 주문 목록 행 (O-T4). 관리자는 전 회원 주문을 보므로 user_seq 노출(사용자 측 OrderListItem과 구분). */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminOrderListItem {

    private Long orderSeq;
    private String orderNo;
    private String orderStatus;
    private Long userSeq;
    private OffsetDateTime orderDate;
    private BigDecimal finalAmount;
    private String firstItemName;
    private int totalItemCount;
}
