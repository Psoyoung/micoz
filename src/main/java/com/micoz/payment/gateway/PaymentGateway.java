package com.micoz.payment.gateway;

/**
 * PG 결제 추상화.
 * 실제 PG 사업자(토스/카카오/네이버 등) 확정 시 구현체만 추가 (PRD §11 미해결, §10 완화안).
 */
public interface PaymentGateway {

    PaymentResult approve(PaymentRequest request);

    void cancel(String pgTid);
}
