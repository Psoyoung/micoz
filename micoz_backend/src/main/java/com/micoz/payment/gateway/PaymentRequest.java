package com.micoz.payment.gateway;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class PaymentRequest {
    private String orderNo;
    private BigDecimal amount;
    /** CARD / KAKAO / NAVER */
    private String paymentType;
    private String cardNo;       // 전체 카드번호 (success 시 마스킹 후 저장)
    private Integer installment;
}
