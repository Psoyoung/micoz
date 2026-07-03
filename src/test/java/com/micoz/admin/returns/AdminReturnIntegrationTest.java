package com.micoz.admin.returns;

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
 * R-T4 반품 워크플로우 E2E — 라이프사이클(RETURN/CANCEL) + REJECTED 부수효과-0 + DEFECT 재고 오버라이드 +
 * EXCHANGE 완료 환불사고 방지 + 비허용 전이 + 조회. 비밀번호는 테스트 픽스처(실제 시크릿 아님).
 */
class AdminReturnIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "Returns#Admin1234";
    private static final long PRODUCT = 1L, OPTION = 1L, EXCHANGE_OPTION = 2L;
    private static final int QTY1_FINAL = 31000; // 28000 + 배송 3000

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminId;
    private String adminToken;

    @BeforeEach
    void seedAdmin() {
        adminId = "rtadm" + suffix();
        jdbcTemplate.update("INSERT INTO mst_user (user_id, user_pw, user_name, user_role, point_balance, "
                + "user_status, use_yn, i_user) VALUES (?, ?, '반품관리자', 'ADMIN', 0, 'ACTIVE', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'rtadm%'");
    }

    @Test
    @DisplayName("RETURN 라이프사이클(DEFECT + 재입고 오버라이드): 완료 → order RETURNED · payment REFUNDED · 재고 복원 · refund_amount")
    void returnLifecycleWithRestockOverride() {
        int stockBefore = stock();
        Ordered o = createPaidOrder();
        assertThat(stock()).isEqualTo(stockBefore - 1); // 결제 시 차감
        deliver(o.orderSeq());

        long returnSeq = createReturn(o.access(), o.orderSeq(), "RETURN", "DEFECT", null);
        ok(patch("/api/v1/admin/returns/" + returnSeq + "/approve", Map.of()));
        ok(patch("/api/v1/admin/returns/" + returnSeq + "/collect", Map.of()));
        ok(patch("/api/v1/admin/returns/" + returnSeq + "/inspect", Map.of("restockYn", "Y"))); // DEFECT 오버라이드
        ok(patch("/api/v1/admin/returns/" + returnSeq + "/complete", Map.of()));

        assertThat(returnStatus(returnSeq)).isEqualTo("COMPLETED");
        assertThat(orderStatus(o.orderSeq())).isEqualTo("RETURNED");
        assertThat(paymentStatus(o.orderSeq())).isEqualTo("REFUNDED");
        assertThat(stock()).as("재입고 오버라이드 → 복원").isEqualTo(stockBefore);
        assertThat(refundAmount(returnSeq)).isEqualByComparingTo("31000"); // 28000 + 배송 3000(판매자귀책 전량)
    }

    @Test
    @DisplayName("DEFECT 기본 재입고 제외: 오버라이드 없으면 재고 미복원(재판매 불가)")
    void defectDefaultNoRestock() {
        int stockBefore = stock();
        Ordered o = createPaidOrder();
        deliver(o.orderSeq());
        long returnSeq = createReturn(o.access(), o.orderSeq(), "RETURN", "DEFECT", null);
        driveToInspected(returnSeq, null); // 기본 N
        ok(patch("/api/v1/admin/returns/" + returnSeq + "/complete", Map.of()));

        assertThat(orderStatus(o.orderSeq())).isEqualTo("RETURNED");
        assertThat(stock()).as("DEFECT 기본 → 재고 미복원").isEqualTo(stockBefore - 1);
    }

    @Test
    @DisplayName("CANCEL 라이프사이클: 완료 → order CANCELED · payment REFUNDED · 재고 전량 복원")
    void cancelLifecycle() {
        int stockBefore = stock();
        Ordered o = createPaidOrder(); // PAID (출고 안 함)
        long returnSeq = createReturn(o.access(), o.orderSeq(), "CANCEL", "CHANGE_OF_MIND", null);
        driveToInspected(returnSeq, null);
        ok(patch("/api/v1/admin/returns/" + returnSeq + "/complete", Map.of()));

        assertThat(orderStatus(o.orderSeq())).isEqualTo("CANCELED");
        assertThat(paymentStatus(o.orderSeq())).isEqualTo("REFUNDED");
        assertThat(stock()).as("CANCEL → 전량 복원").isEqualTo(stockBefore);
    }

    @Test
    @DisplayName("REJECTED(즉시 반려): order·payment·재고·refund 부수효과 0")
    void rejectedNoSideEffects() {
        int stockBefore = stock();
        Ordered o = createPaidOrder();
        deliver(o.orderSeq());
        long returnSeq = createReturn(o.access(), o.orderSeq(), "RETURN", "DEFECT", null);
        ok(patch("/api/v1/admin/returns/" + returnSeq + "/reject", Map.of())); // REQUESTED→REJECTED

        assertThat(returnStatus(returnSeq)).isEqualTo("REJECTED");
        assertThat(orderStatus(o.orderSeq())).isEqualTo("DELIVERED"); // 불변
        assertThat(paymentStatus(o.orderSeq())).isEqualTo("PAID");    // 불변
        assertThat(stock()).isEqualTo(stockBefore - 1);               // 복원 안 됨
        assertThat(refundAmountRaw(returnSeq)).isEqualByComparingTo("0"); // 미확정
    }

    @Test
    @DisplayName("EXCHANGE 완료 환불사고 방지: COMPLETED이되 refund 0 · payment 불변 · order 불변 · 재고 불변")
    void exchangeCompleteNoRefundNoClose() {
        int stockBefore = stock();
        Ordered o = createPaidOrder();
        deliver(o.orderSeq());
        long returnSeq = createReturn(o.access(), o.orderSeq(), "EXCHANGE", "CHANGE_OF_MIND", EXCHANGE_OPTION);
        driveToInspected(returnSeq, null);
        ok(patch("/api/v1/admin/returns/" + returnSeq + "/complete", Map.of()));

        assertThat(returnStatus(returnSeq)).isEqualTo("COMPLETED");
        assertThat(refundAmountRaw(returnSeq)).as("환불 미확정").isEqualByComparingTo("0");
        assertThat(paymentStatus(o.orderSeq())).as("payment 불변").isEqualTo("PAID");
        assertThat(orderStatus(o.orderSeq())).as("order 불변").isEqualTo("DELIVERED");
        assertThat(stock()).as("재고 불변").isEqualTo(stockBefore - 1);
    }

    @Test
    @DisplayName("비허용 전이: REQUESTED에서 complete → 409 RETURN_TRANSITION_INVALID")
    void invalidTransition() {
        Ordered o = createPaidOrder();
        deliver(o.orderSeq());
        long returnSeq = createReturn(o.access(), o.orderSeq(), "RETURN", "DEFECT", null);

        ResponseEntity<String> resp = patch("/api/v1/admin/returns/" + returnSeq + "/complete", Map.of());
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("RETURN_TRANSITION_INVALID");
        assertThat(returnStatus(returnSeq)).isEqualTo("REQUESTED");
    }

    @Test
    @DisplayName("목록/상세/정렬 화이트리스트/부재")
    void listDetailSortNotFound() {
        Ordered o = createPaidOrder();
        deliver(o.orderSeq());
        long returnSeq = createReturn(o.access(), o.orderSeq(), "RETURN", "DEFECT", null);
        String returnNo = jdbcTemplate.queryForObject(
                "SELECT return_no FROM dat_return WHERE return_seq = ?", String.class, returnSeq);

        JsonNode list = parse(getJson("/api/v1/admin/returns?q=" + returnNo, adminToken).getBody()).path("data");
        boolean found = false;
        for (JsonNode row : list.path("content")) {
            if (row.path("returnSeq").asLong() == returnSeq) {
                assertThat(row.path("userSeq").asLong()).isPositive();
                assertThat(row.path("returnType").asText()).isEqualTo("RETURN");
                found = true;
            }
        }
        assertThat(found).isTrue();

        JsonNode detail = parse(getJson("/api/v1/admin/returns/" + returnSeq, adminToken).getBody()).path("data");
        assertThat(detail.path("returnStatus").asText()).isEqualTo("REQUESTED");
        assertThat(detail.path("items").get(0).path("productName").asText()).isEqualTo("글로우 토너");

        assertThat(getJson("/api/v1/admin/returns?sort=hackerField,desc", adminToken).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(getJson("/api/v1/admin/returns/99999999", adminToken).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ───────────────────────── helpers ─────────────────────────

    private void driveToInspected(long returnSeq, String restockYn) {
        ok(patch("/api/v1/admin/returns/" + returnSeq + "/approve", Map.of()));
        ok(patch("/api/v1/admin/returns/" + returnSeq + "/collect", Map.of()));
        ok(patch("/api/v1/admin/returns/" + returnSeq + "/inspect",
                restockYn == null ? Map.of() : Map.of("restockYn", restockYn)));
    }

    private long createReturn(String access, long orderSeq, String type, String reason, Long exchangeOption) {
        long itemSeq = jdbcTemplate.queryForObject(
                "SELECT item_seq FROM dat_order_item WHERE order_seq = ? ORDER BY item_seq LIMIT 1",
                Long.class, orderSeq);
        Map<String, Object> item = new HashMap<>();
        item.put("itemSeq", itemSeq);
        item.put("quantity", 1);
        if (exchangeOption != null) item.put("exchangeOptionSeq", exchangeOption);

        Map<String, Object> req = new HashMap<>();
        req.put("returnType", type);
        req.put("returnReasonType", reason);
        req.put("items", List.of(item));
        req.put("pickupZipCode", "06000");
        req.put("pickupAddress", "회수지");
        req.put("pickupPhone", "010-0000-0000");

        ResponseEntity<String> resp = postJson("/api/v1/me/orders/" + orderSeq + "/returns", access, req);
        assertThat(resp.getStatusCode()).as("반품 신청: %s", resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data").path("returnSeq").asLong();
    }

    private Ordered createPaidOrder() {
        String access = signupAndLogin();
        long cartSeq = parse(postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT, "optionSeq", OPTION, "quantity", 1)).getBody())
                .path("data").path("cartSeq").asLong();
        Map<String, Object> req = new HashMap<>();
        req.put("cartSeqs", List.of(cartSeq));
        req.put("recipientName", "테스트");
        req.put("recipientPhone", "010-0000-0000");
        req.put("zipCode", "06000");
        req.put("address", "테스트 주소");
        req.put("clientAmount", QTY1_FINAL);
        long orderSeq = parse(postJson("/api/v1/orders", access, req).getBody()).path("data").path("orderSeq").asLong();
        ResponseEntity<String> pay = postJson("/api/v1/orders/" + orderSeq + "/pay", access,
                Map.of("paymentType", "CARD", "cardNo", "1234-5678-9012-3456", "installment", 0));
        assertThat(parse(pay.getBody()).path("data").path("orderStatus").asText()).isEqualTo("PAID");
        return new Ordered(orderSeq, access);
    }

    /** 관리자 O-T2/T3 경로로 배송완료까지. */
    private void deliver(long orderSeq) {
        ok(patch("/api/v1/admin/orders/" + orderSeq + "/prepare", Map.of()));
        ok(patch("/api/v1/admin/orders/" + orderSeq + "/ship", Map.of("trackingNo", "CJ1234567890")));
        ok(patch("/api/v1/admin/orders/" + orderSeq + "/deliver", Map.of()));
    }

    private ResponseEntity<String> patch(String path, Object body) {
        return patchJson(path, adminToken, body);
    }

    private void ok(ResponseEntity<String> resp) {
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);
    }

    private int stock() {
        return jdbcTemplate.queryForObject(
                "SELECT stock_qty FROM mst_product_option WHERE option_seq = ?", Integer.class, OPTION);
    }

    private String orderStatus(long orderSeq) {
        return jdbcTemplate.queryForObject("SELECT order_status FROM dat_order WHERE order_seq = ?", String.class, orderSeq);
    }

    private String paymentStatus(long orderSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT payment_status FROM dat_order_payment WHERE order_seq = ? ORDER BY payment_seq DESC LIMIT 1",
                String.class, orderSeq);
    }

    private String returnStatus(long returnSeq) {
        return jdbcTemplate.queryForObject("SELECT return_status FROM dat_return WHERE return_seq = ?", String.class, returnSeq);
    }

    private java.math.BigDecimal refundAmount(long returnSeq) {
        return jdbcTemplate.queryForObject("SELECT refund_amount FROM dat_return WHERE return_seq = ?",
                java.math.BigDecimal.class, returnSeq);
    }

    private java.math.BigDecimal refundAmountRaw(long returnSeq) {
        java.math.BigDecimal v = refundAmount(returnSeq);
        return v == null ? java.math.BigDecimal.ZERO : v;
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

    private record Ordered(long orderSeq, String access) {}
}
