package com.micoz.admin.order.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.micoz.order.dto.OrderItemSnapshot;
import com.micoz.order.dto.OrderPaymentInfo;
import com.micoz.order.dto.OrderShippingInfo;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * 관리자 주문 상세 (O-T4). 사용자측 {@code OrderDetailResponse} shape 답습 + {@code userSeq}(전 주문 조회).
 * 내부 읽기모델(items/shipping/payment)은 사용자측과 동일하므로 {@code order.dto}의 DTO를 재사용한다.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminOrderDetailResponse {

    private Long orderSeq;
    private String orderNo;
    private Long userSeq;
    private String orderStatus;
    private OffsetDateTime orderDate;
    private BigDecimal itemsTotal;
    private BigDecimal totalDiscount;
    private BigDecimal couponDiscount;
    private Integer pointUsed;
    private BigDecimal shippingFee;
    private BigDecimal finalAmount;
    private Integer pointToEarn;
    private List<OrderItemSnapshot> items;
    private OrderShippingInfo shipping;
    private OrderPaymentInfo payment;
}
