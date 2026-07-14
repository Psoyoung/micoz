package com.micoz.payment.gateway;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * 모의 PG (PRD §10 완화안).
 * - 카드번호 "4000-0000-0000-0002" → 거절
 * - amount ≤ 0 → 거절
 * - 그 외 → 승인
 * 실 PG 도입 시 별도 @Profile("real-pg") 구현체로 교체.
 */
@Slf4j
@Component
@Profile("!real-pg")
public class MockPaymentGateway implements PaymentGateway {

    private static final String DECLINED_CARD = "4000-0000-0000-0002";

    @Override
    public PaymentResult approve(PaymentRequest request) {
        BigDecimal amount = request.getAmount();
        boolean amountInvalid = amount == null || amount.signum() <= 0;
        boolean cardDeclined = DECLINED_CARD.equals(request.getCardNo());

        if (amountInvalid) {
            return PaymentResult.builder()
                    .success(false)
                    .failureReason("MOCK_INVALID_AMOUNT")
                    .build();
        }
        if (cardDeclined) {
            return PaymentResult.builder()
                    .success(false)
                    .failureReason("MOCK_DECLINED")
                    .cardNoMasked(maskCard(request.getCardNo()))
                    .build();
        }

        String suffix = String.valueOf(System.nanoTime());
        return PaymentResult.builder()
                .success(true)
                .approvalNo("MZAPV" + suffix)
                .pgTid("MZTID" + suffix)
                .cardCompany("모의카드")
                .cardNoMasked(maskCard(request.getCardNo()))
                .build();
    }

    @Override
    public void cancel(String pgTid) {
        log.info("MockPaymentGateway.cancel called: pgTid={}", pgTid);
    }

    private String maskCard(String cardNo) {
        if (cardNo == null || cardNo.isBlank()) {
            return "XXXX-XXXX-XXXX-0000";
        }
        String digits = cardNo.replaceAll("[^0-9]", "");
        if (digits.length() < 4) {
            return "XXXX-XXXX-XXXX-0000";
        }
        return "XXXX-XXXX-XXXX-" + digits.substring(digits.length() - 4);
    }
}
