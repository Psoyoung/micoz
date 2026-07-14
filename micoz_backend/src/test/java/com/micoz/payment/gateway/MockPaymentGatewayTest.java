package com.micoz.payment.gateway;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class MockPaymentGatewayTest {

    private final MockPaymentGateway gateway = new MockPaymentGateway();

    @Test
    @DisplayName("정상 카드 + 정상 amount → success=true, approvalNo/pgTid non-null")
    void approve_success() {
        PaymentResult result = gateway.approve(PaymentRequest.builder()
                .orderNo("MZ-OD-001")
                .amount(BigDecimal.valueOf(50000))
                .paymentType("CARD")
                .cardNo("1234-5678-9012-3456")
                .installment(0)
                .build());

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getApprovalNo()).startsWith("MZAPV");
        assertThat(result.getPgTid()).startsWith("MZTID");
        assertThat(result.getCardCompany()).isEqualTo("모의카드");
        assertThat(result.getCardNoMasked()).isEqualTo("XXXX-XXXX-XXXX-3456");
    }

    @Test
    @DisplayName("거절 카드(4000-0000-0000-0002) → success=false, MOCK_DECLINED")
    void approve_declined() {
        PaymentResult result = gateway.approve(PaymentRequest.builder()
                .orderNo("MZ-OD-002")
                .amount(BigDecimal.valueOf(50000))
                .paymentType("CARD")
                .cardNo("4000-0000-0000-0002")
                .installment(0)
                .build());

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getFailureReason()).isEqualTo("MOCK_DECLINED");
        assertThat(result.getCardNoMasked()).isEqualTo("XXXX-XXXX-XXXX-0002");
    }

    @Test
    @DisplayName("음수 amount → success=false, MOCK_INVALID_AMOUNT")
    void approve_invalidAmount() {
        PaymentResult result = gateway.approve(PaymentRequest.builder()
                .orderNo("MZ-OD-003")
                .amount(BigDecimal.valueOf(-100))
                .paymentType("CARD")
                .cardNo("1234-5678-9012-3456")
                .build());

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getFailureReason()).isEqualTo("MOCK_INVALID_AMOUNT");
    }

    @Test
    @DisplayName("cardNo=null → 마스킹 placeholder")
    void approve_nullCard() {
        PaymentResult result = gateway.approve(PaymentRequest.builder()
                .orderNo("MZ-OD-004")
                .amount(BigDecimal.valueOf(10000))
                .paymentType("KAKAO")
                .cardNo(null)
                .build());

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getCardNoMasked()).isEqualTo("XXXX-XXXX-XXXX-0000");
    }

    @Test
    @DisplayName("16자리 카드 → 마지막 4자리만 노출 (NFR-10)")
    void mask_lastFour() {
        PaymentResult r1 = gateway.approve(PaymentRequest.builder()
                .amount(BigDecimal.ONE).cardNo("4111-1111-1111-1111").build());
        assertThat(r1.getCardNoMasked()).isEqualTo("XXXX-XXXX-XXXX-1111");

        PaymentResult r2 = gateway.approve(PaymentRequest.builder()
                .amount(BigDecimal.ONE).cardNo("5555444433332222").build());
        assertThat(r2.getCardNoMasked()).isEqualTo("XXXX-XXXX-XXXX-2222");
    }
}
