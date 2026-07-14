package com.micoz.admin.order;

import com.fasterxml.jackson.databind.JsonNode;
import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * O-T2 주문 상태 전이 E2E — 준비/취소 액션 + O-Q1(재고 즉시 복원 + payment 불변).
 *
 * <p>admin 토큰: ADMIN 유저를 직접 insert 후 /api/v1/admin/auth/login. 비밀번호는 테스트 픽스처(실제 시크릿 아님).
 * 토너(product 1 / option 1, 28000) 시드로 주문을 만든다. 재고(stock_qty)는 전 클래스 공유 가변 상태이므로
 * 절대값이 아닌 <b>상대 델타</b>(취소 전/후 캡처)로 단언한다.
 */
class AdminOrderIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "OrderOps#Admin1234";
    private static final long PRODUCT_TONER = 1L;
    private static final long OPTION_TONER_150 = 1L;
    private static final int QTY1_AMOUNT = 31000; // 28000 + 배송 3000 (시드: 무료기준 50000 미달)

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminId;
    private String adminToken;

    @BeforeEach
    void seedAdmin() {
        adminId = "oporder" + suffix();
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, "
                        + "point_balance, user_status, use_yn, i_user) "
                        + "VALUES (?, ?, '주문운영관리자', 'ADMIN', 0, 'ACTIVE', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'oporder%'");
    }

    @Test
    @DisplayName("준비 시작: PAID → PREPARING")
    void prepareFromPaid() {
        long orderSeq = createPaidOrder(1, QTY1_AMOUNT);

        ResponseEntity<String> resp = patchJson("/api/v1/admin/orders/" + orderSeq + "/prepare", adminToken, Map.of());
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);
        assertThat(orderStatusOf(orderSeq)).isEqualTo("PREPARING");
    }

    @Test
    @DisplayName("관리자 취소(PAID→CANCELED): 재고 정확 원복 + payment 불변(PAID 유지)")
    void cancelRestoresStockAndKeepsPayment() {
        int stockBefore = stockOf(OPTION_TONER_150);
        long orderSeq = createPaidOrder(1, QTY1_AMOUNT);
        assertThat(stockOf(OPTION_TONER_150)).as("결제 시 1 차감").isEqualTo(stockBefore - 1);

        ResponseEntity<String> resp = patchJson("/api/v1/admin/orders/" + orderSeq + "/cancel", adminToken, Map.of());
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);

        assertThat(orderStatusOf(orderSeq)).isEqualTo("CANCELED");
        assertThat(stockOf(OPTION_TONER_150)).as("취소 시 정확히 원복").isEqualTo(stockBefore);
        assertThat(paymentStatusOf(orderSeq)).as("payment는 불변(환불=R)").isEqualTo("PAID");
    }

    @Test
    @DisplayName("취소 후 CANCELED에서 준비 시작 불가: PREPARING 경유해 취소도 재고 복원")
    void cancelFromPreparing() {
        int stockBefore = stockOf(OPTION_TONER_150);
        long orderSeq = createPaidOrder(1, QTY1_AMOUNT);
        // PAID → PREPARING
        assertThat(patchJson("/api/v1/admin/orders/" + orderSeq + "/prepare", adminToken, Map.of()).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        // PREPARING → CANCELED (재고 복원)
        assertThat(patchJson("/api/v1/admin/orders/" + orderSeq + "/cancel", adminToken, Map.of()).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(orderStatusOf(orderSeq)).isEqualTo("CANCELED");
        assertThat(stockOf(OPTION_TONER_150)).as("PREPARING 취소도 원복").isEqualTo(stockBefore);
    }

    @Test
    @DisplayName("이중 취소 차단(멱등): 두 번째 취소 → 409 ORDER_TRANSITION_INVALID, 재고 이중복원 없음")
    void doubleCancelBlocked() {
        long orderSeq = createPaidOrder(1, QTY1_AMOUNT);
        assertThat(patchJson("/api/v1/admin/orders/" + orderSeq + "/cancel", adminToken, Map.of()).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        int stockAfterFirst = stockOf(OPTION_TONER_150);

        ResponseEntity<String> second = patchJson("/api/v1/admin/orders/" + orderSeq + "/cancel", adminToken, Map.of());
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(second.getBody()).path("code").asText()).isEqualTo("ORDER_TRANSITION_INVALID");
        assertThat(stockOf(OPTION_TONER_150)).as("두 번째 취소는 전이 단계에서 막혀 재고 미변경").isEqualTo(stockAfterFirst);
    }

    @Test
    @DisplayName("비허용 전이: PENDING 주문에 준비 시작 → 409 ORDER_TRANSITION_INVALID")
    void prepareOnPendingRejected() {
        long orderSeq = createPendingOrder(1, QTY1_AMOUNT); // 결제 안 함 → PENDING

        ResponseEntity<String> resp = patchJson("/api/v1/admin/orders/" + orderSeq + "/prepare", adminToken, Map.of());
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("ORDER_TRANSITION_INVALID");
        assertThat(orderStatusOf(orderSeq)).as("차단 시 상태 불변").isEqualTo("PENDING");
    }

    @Test
    @DisplayName("부재 주문 → 404 ORDER_NOT_FOUND")
    void notFound() {
        ResponseEntity<String> prepare = patchJson("/api/v1/admin/orders/99999999/prepare", adminToken, Map.of());
        assertThat(prepare.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(prepare.getBody()).path("code").asText()).isEqualTo("ORDER_NOT_FOUND");

        ResponseEntity<String> cancel = patchJson("/api/v1/admin/orders/99999999/cancel", adminToken, Map.of());
        assertThat(cancel.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ───────────────────────── helpers ─────────────────────────

    /** 신규 유저로 토너 qty개 주문 생성 후 정상 카드로 결제 → PAID. orderSeq 반환. */
    private long createPaidOrder(int qty, int clientAmount) {
        String access = signupAndLogin();
        long orderSeq = placeOrder(access, qty, clientAmount);
        ResponseEntity<String> pay = postJson("/api/v1/orders/" + orderSeq + "/pay", access,
                Map.of("paymentType", "CARD", "cardNo", "1234-5678-9012-3456", "installment", 0));
        assertThat(pay.getStatusCode()).as("결제: %s", pay.getBody()).isEqualTo(HttpStatus.OK);
        // M4 회귀: 전이표 승격 후에도 PENDING→PAID 정상
        assertThat(parse(pay.getBody()).path("data").path("orderStatus").asText()).isEqualTo("PAID");
        return orderSeq;
    }

    /** 결제 없이 PENDING 주문만 생성. */
    private long createPendingOrder(int qty, int clientAmount) {
        return placeOrder(signupAndLogin(), qty, clientAmount);
    }

    private long placeOrder(String access, int qty, int clientAmount) {
        ResponseEntity<String> addCart = postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT_TONER, "optionSeq", OPTION_TONER_150, "quantity", qty));
        assertThat(addCart.getStatusCode()).as("카트: %s", addCart.getBody()).isEqualTo(HttpStatus.OK);
        long cartSeq = parse(addCart.getBody()).path("data").path("cartSeq").asLong();

        Map<String, Object> req = new HashMap<>();
        req.put("cartSeqs", List.of(cartSeq));
        req.put("recipientName", "테스트");
        req.put("recipientPhone", "010-0000-0000");
        req.put("zipCode", "06000");
        req.put("address", "테스트 주소");
        req.put("clientAmount", clientAmount);
        ResponseEntity<String> resp = postJson("/api/v1/orders", access, req);
        assertThat(resp.getStatusCode()).as("주문 생성: %s", resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data").path("orderSeq").asLong();
    }

    private int stockOf(long optionSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT stock_qty FROM mst_product_option WHERE option_seq = ?", Integer.class, optionSeq);
    }

    private String orderStatusOf(long orderSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT order_status FROM dat_order WHERE order_seq = ?", String.class, orderSeq);
    }

    private String paymentStatusOf(long orderSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT payment_status FROM dat_order_payment WHERE order_seq = ? ORDER BY payment_seq DESC LIMIT 1",
                String.class, orderSeq);
    }

    private String adminLogin(String userId, String pw) {
        ResponseEntity<String> resp = rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", userId, "userPw", pw), String.class);
        return parse(resp.getBody()).path("data").path("accessToken").asText();
    }

    private String suffix() {
        String unique = String.valueOf(System.nanoTime());
        return unique.substring(unique.length() - 8);
    }
}
