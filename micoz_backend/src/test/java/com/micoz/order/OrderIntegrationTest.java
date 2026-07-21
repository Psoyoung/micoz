package com.micoz.order;

import com.fasterxml.jackson.databind.JsonNode;
import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class OrderIntegrationTest extends IntegrationTestSupport {

    private static final long PRODUCT_TONER = 1L;
    private static final long OPTION_TONER_150 = 1L;

    @Test
    @DisplayName("M4 DoD: 주문→승인→PAID 전이·금액 재검증 풀 시나리오")
    void fullOrderPayScenario() {
        String access = signupAndLogin();

        // 1) 카트 담기
        ResponseEntity<String> addCart = postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT_TONER, "optionSeq", OPTION_TONER_150, "quantity", 2));
        assertThat(addCart.getStatusCode()).isEqualTo(HttpStatus.OK);
        long cartSeq = parse(addCart.getBody()).path("data").path("cartSeq").asLong();

        // 2) 주문 생성 (토너 28000 × 2 = 56000, 무료배송 도달)
        Map<String, Object> orderReq = new HashMap<>();
        orderReq.put("cartSeqs", java.util.List.of(cartSeq));
        orderReq.put("recipientName", "테스트");
        orderReq.put("recipientPhone", "010-0000-0000");
        orderReq.put("zipCode", "06000");
        orderReq.put("address", "테스트 주소");
        orderReq.put("clientAmount", 56000);
        ResponseEntity<String> createOrder = postJson("/api/v1/orders", access, orderReq);
        assertThat(createOrder.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode orderData = parse(createOrder.getBody()).path("data");
        long orderSeq = orderData.path("orderSeq").asLong();
        assertThat(orderData.path("orderStatus").asText()).isEqualTo("PENDING");
        assertThat(orderData.path("finalAmount").asInt()).isEqualTo(56000);

        // 3) 결제 처리 (정상 카드)
        ResponseEntity<String> pay = postJson("/api/v1/orders/" + orderSeq + "/pay", access,
                Map.of("paymentType", "CARD", "cardNo", "1234-5678-9012-3456", "installment", 0));
        assertThat(pay.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode payData = parse(pay.getBody()).path("data");
        assertThat(payData.path("orderStatus").asText()).isEqualTo("PAID");
        assertThat(payData.path("paymentStatus").asText()).isEqualTo("PAID");
        assertThat(payData.path("approvalNo").asText()).startsWith("MZAPV");
        assertThat(payData.path("cardNoMasked").asText()).isEqualTo("XXXX-XXXX-XXXX-3456");

        // 4) 주문 상세 — items 스냅샷 / shipping / payment 확인
        ResponseEntity<String> detail = getJson("/api/v1/me/orders/" + orderSeq, access);
        JsonNode d = parse(detail.getBody()).path("data");
        assertThat(d.path("orderStatus").asText()).isEqualTo("PAID");
        assertThat(d.path("items").get(0).path("productName").asText()).isEqualTo("글로우 토너");
        assertThat(d.path("items").get(0).path("optionName").asText()).isEqualTo("150ml");
        assertThat(d.path("payment").path("paymentStatus").asText()).isEqualTo("PAID");

        // 5) 이미 PAID → ORDER_INVALID_STATUS
        ResponseEntity<String> repay = postJson("/api/v1/orders/" + orderSeq + "/pay", access,
                Map.of("paymentType", "CARD", "cardNo", "1234-5678-9012-3456"));
        assertThat(parse(repay.getBody()).path("code").asText()).isEqualTo("ORDER_INVALID_STATUS");

        // 6) 카트 자동 정리 확인
        ResponseEntity<String> cart = getJson("/api/v1/cart", access);
        assertThat(parse(cart.getBody()).path("data").path("itemCount").asInt()).isEqualTo(0);
    }

    @Test
    @DisplayName("FR-ORDER-01 / NFR-11: clientAmount 불일치 → ORDER_AMOUNT_MISMATCH")
    void amountMismatch() {
        String access = signupAndLogin();
        ResponseEntity<String> addCart = postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT_TONER, "optionSeq", OPTION_TONER_150, "quantity", 2));
        long cartSeq = parse(addCart.getBody()).path("data").path("cartSeq").asLong();

        Map<String, Object> orderReq = new HashMap<>();
        orderReq.put("cartSeqs", java.util.List.of(cartSeq));
        orderReq.put("recipientName", "테스트");
        orderReq.put("recipientPhone", "010-0000-0000");
        orderReq.put("zipCode", "06000");
        orderReq.put("address", "테스트 주소");
        orderReq.put("clientAmount", 99999); // 서버 재계산은 56000

        ResponseEntity<String> r = postJson("/api/v1/orders", access, orderReq);
        assertThat(parse(r.getBody()).path("code").asText()).isEqualTo("ORDER_AMOUNT_MISMATCH");
    }

    @Test
    @DisplayName("FR-PAY-01: 거절카드 → PAY_APPROVAL_FAILED, 주문 PENDING 유지 후 재결제 성공")
    void declineAndRetry() {
        String access = signupAndLogin();
        ResponseEntity<String> addCart = postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT_TONER, "optionSeq", OPTION_TONER_150, "quantity", 2));
        long cartSeq = parse(addCart.getBody()).path("data").path("cartSeq").asLong();

        Map<String, Object> orderReq = new HashMap<>();
        orderReq.put("cartSeqs", java.util.List.of(cartSeq));
        orderReq.put("recipientName", "테스트");
        orderReq.put("recipientPhone", "010-0000-0000");
        orderReq.put("zipCode", "06000");
        orderReq.put("address", "테스트 주소");
        orderReq.put("clientAmount", 56000);
        long orderSeq = parse(postJson("/api/v1/orders", access, orderReq).getBody())
                .path("data").path("orderSeq").asLong();

        // 거절 카드
        ResponseEntity<String> declined = postJson("/api/v1/orders/" + orderSeq + "/pay", access,
                Map.of("paymentType", "CARD", "cardNo", "4000-0000-0000-0002"));
        assertThat(parse(declined.getBody()).path("code").asText()).isEqualTo("PAY_APPROVAL_FAILED");

        // PENDING 유지 확인
        ResponseEntity<String> d1 = getJson("/api/v1/me/orders/" + orderSeq, access);
        assertThat(parse(d1.getBody()).path("data").path("orderStatus").asText()).isEqualTo("PENDING");

        // 정상 카드로 재시도 → PAID
        ResponseEntity<String> retry = postJson("/api/v1/orders/" + orderSeq + "/pay", access,
                Map.of("paymentType", "CARD", "cardNo", "1234-5678-9012-3456"));
        assertThat(parse(retry.getBody()).path("data").path("orderStatus").asText()).isEqualTo("PAID");
    }

    @Test
    @DisplayName("결제표시 빚: 재시도 이력(FAILED+PAID 다중행) 주문 상세 → 500 없이 성공 결제행 표시 (사용자)")
    void retryHistoryOrderDetailShowsSuccessPayment() {
        String access = signupAndLogin();
        long cartSeq = parse(postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT_TONER, "optionSeq", OPTION_TONER_150, "quantity", 2)).getBody())
                .path("data").path("cartSeq").asLong();

        Map<String, Object> orderReq = new HashMap<>();
        orderReq.put("cartSeqs", java.util.List.of(cartSeq));
        orderReq.put("recipientName", "테스트");
        orderReq.put("recipientPhone", "010-0000-0000");
        orderReq.put("zipCode", "06000");
        orderReq.put("address", "테스트 주소");
        orderReq.put("clientAmount", 56000);
        long orderSeq = parse(postJson("/api/v1/orders", access, orderReq).getBody())
                .path("data").path("orderSeq").asLong();

        // 거절카드 → FAILED 행 잔존(noRollbackFor), order PENDING 유지 → 정상카드 재결제 → PAID 행 추가(다중행)
        postJson("/api/v1/orders/" + orderSeq + "/pay", access,
                Map.of("paymentType", "CARD", "cardNo", "4000-0000-0000-0002"));
        ResponseEntity<String> retry = postJson("/api/v1/orders/" + orderSeq + "/pay", access,
                Map.of("paymentType", "CARD", "cardNo", "1234-5678-9012-3456"));
        assertThat(parse(retry.getBody()).path("data").path("orderStatus").asText()).isEqualTo("PAID");

        // 상세: 다중행에도 500 없이 성공행(PAID) 표시 — A안(findByOrderSeq Optional)이 못 하던 것
        ResponseEntity<String> detail = getJson("/api/v1/me/orders/" + orderSeq, access);
        assertThat(detail.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode payment = parse(detail.getBody()).path("data").path("payment");
        assertThat(payment.isMissingNode() || payment.isNull()).as("payment 표시됨").isFalse();
        assertThat(payment.path("paymentStatus").asText()).isEqualTo("PAID");
    }
}
