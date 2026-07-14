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
 * O-T3 운송장 + 출고/배송 액션 E2E — 2컬럼 원자 동기화(§5.3).
 * ★ 핵심: 출고/배송완료의 "두 컬럼 중 하나만 유효, 다른 하나 위반" 상황에서 <b>두 컬럼 모두 원래값 유지</b>
 * (부분 전이 없음)를 증명한다. 비밀번호는 테스트 픽스처(실제 시크릿 아님).
 */
class AdminOrderShippingIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "OrderShip#Admin1234";
    private static final long PRODUCT_TONER = 1L;
    private static final long OPTION_TONER_150 = 1L;
    private static final int QTY1_AMOUNT = 31000; // 28000 + 배송 3000

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminId;
    private String adminToken;

    @BeforeEach
    void seedAdmin() {
        adminId = "opship" + suffix();
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, "
                        + "point_balance, user_status, use_yn, i_user) "
                        + "VALUES (?, ?, '배송관리자', 'ADMIN', 0, 'ACTIVE', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'opship%'");
    }

    @Test
    @DisplayName("전체 라이프사이클: prepare→ship→in-transit→deliver + 운송장/일시 기록 + 사용자 상세 반영")
    void fullLifecycle() {
        PaidOrder po = createPaidOrder();
        long orderSeq = po.orderSeq();

        // PAID → PREPARING
        ok(patchJson(base(orderSeq) + "/prepare", adminToken, Map.of()));

        // 출고: PREPARING→SHIPPING & READY→SHIPPED + 운송장/출고일시
        String tracking = "CJ1234567890";
        ok(patchJson(base(orderSeq) + "/ship", adminToken, Map.of("trackingNo", tracking)));
        assertThat(orderStatus(orderSeq)).isEqualTo("SHIPPING");
        assertThat(shippingStatus(orderSeq)).isEqualTo("SHIPPED");
        assertThat(shippingCol(orderSeq, "tracking_no")).isEqualTo(tracking);
        assertThat(timestampSet(orderSeq, "shipped_date")).isTrue();

        // 사용자 상세에 반영 교차검증
        JsonNode d = parse(getJson("/api/v1/me/orders/" + orderSeq, po.ownerAccess()).getBody()).path("data");
        assertThat(d.path("shipping").path("trackingNo").asText()).isEqualTo(tracking);
        assertThat(d.path("shipping").path("shippingStatus").asText()).isEqualTo("SHIPPED");

        // 배송중: SHIPPED→IN_TRANSIT
        ok(patchJson(base(orderSeq) + "/in-transit", adminToken, Map.of()));
        assertThat(orderStatus(orderSeq)).isEqualTo("SHIPPING"); // order_status 불변
        assertThat(shippingStatus(orderSeq)).isEqualTo("IN_TRANSIT");

        // 배송완료: SHIPPING→DELIVERED & IN_TRANSIT→DELIVERED + 완료일시
        ok(patchJson(base(orderSeq) + "/deliver", adminToken, Map.of()));
        assertThat(orderStatus(orderSeq)).isEqualTo("DELIVERED");
        assertThat(shippingStatus(orderSeq)).isEqualTo("DELIVERED");
        assertThat(timestampSet(orderSeq, "delivered_date")).isTrue();
    }

    @Test
    @DisplayName("배송완료는 IN_TRANSIT 생략(SHIPPED에서 직행) 허용")
    void deliverDirectlyFromShipped() {
        long orderSeq = prepareAndShip();
        ok(patchJson(base(orderSeq) + "/deliver", adminToken, Map.of()));
        assertThat(orderStatus(orderSeq)).isEqualTo("DELIVERED");
        assertThat(shippingStatus(orderSeq)).isEqualTo("DELIVERED");
    }

    @Test
    @DisplayName("출고 운송장 누락 → 400, 두 컬럼 모두 불변(전제 검증이 전이 앞)")
    void shipRequiresTrackingNo() {
        PaidOrder po = createPaidOrder();
        long orderSeq = po.orderSeq();
        ok(patchJson(base(orderSeq) + "/prepare", adminToken, Map.of())); // PREPARING, READY

        ResponseEntity<String> resp = patchJson(base(orderSeq) + "/ship", adminToken, Map.of()); // trackingNo 없음
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(orderStatus(orderSeq)).isEqualTo("PREPARING");
        assertThat(shippingStatus(orderSeq)).isEqualTo("READY");
    }

    @Test
    @DisplayName("★ 원자성: 한 컬럼만 유효(order SHIPPING→DELIVERED) + 다른 컬럼 위반(shipping READY→DELIVERED) → 409, 두 컬럼 모두 불변")
    void partialTransitionRejectedAtomically() {
        long orderSeq = prepareAndShip(); // order SHIPPING, shipping SHIPPED

        // 합성 불일치: shipping만 READY로 되돌림(order는 SHIPPING 유지) — 실제로는 불가한 상태를 강제해 가드 증명
        jdbcTemplate.update("UPDATE dat_order_shipping SET shipping_status = 'READY' WHERE order_seq = ?", orderSeq);

        // deliver: order SHIPPING→DELIVERED는 유효하나 shipping READY→DELIVERED는 비허용 → 전체 거부
        ResponseEntity<String> resp = patchJson(base(orderSeq) + "/deliver", adminToken, Map.of());
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("ORDER_TRANSITION_INVALID");

        // ★ 두 컬럼 모두 원래값 유지 — order_status는 유효했음에도 이동하지 않음(부분 전이 없음)
        assertThat(orderStatus(orderSeq)).isEqualTo("SHIPPING");
        assertThat(shippingStatus(orderSeq)).isEqualTo("READY");
    }

    @Test
    @DisplayName("비허용: PAID(비-PREPARING) 주문 출고 → 409, 두 컬럼 불변")
    void shipOnNonPreparingRejected() {
        long orderSeq = createPaidOrder().orderSeq(); // PAID, READY (prepare 안 함)

        ResponseEntity<String> resp = patchJson(base(orderSeq) + "/ship", adminToken, Map.of("trackingNo", "CJ999"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("ORDER_TRANSITION_INVALID");
        assertThat(orderStatus(orderSeq)).isEqualTo("PAID");
        assertThat(shippingStatus(orderSeq)).isEqualTo("READY");
    }

    @Test
    @DisplayName("부재 주문 → 404")
    void notFound() {
        assertThat(patchJson("/api/v1/admin/orders/99999999/deliver", adminToken, Map.of()).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(patchJson("/api/v1/admin/orders/99999999/ship", adminToken, Map.of("trackingNo", "X")).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ───────────────────────── helpers ─────────────────────────

    private long prepareAndShip() {
        long orderSeq = createPaidOrder().orderSeq();
        ok(patchJson(base(orderSeq) + "/prepare", adminToken, Map.of()));
        ok(patchJson(base(orderSeq) + "/ship", adminToken, Map.of("trackingNo", "CJ1234567890")));
        return orderSeq;
    }

    private PaidOrder createPaidOrder() {
        String access = signupAndLogin();
        long cartSeq = parse(postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT_TONER, "optionSeq", OPTION_TONER_150, "quantity", 1))
                .getBody()).path("data").path("cartSeq").asLong();

        Map<String, Object> req = new HashMap<>();
        req.put("cartSeqs", List.of(cartSeq));
        req.put("recipientName", "테스트");
        req.put("recipientPhone", "010-0000-0000");
        req.put("zipCode", "06000");
        req.put("address", "테스트 주소");
        req.put("clientAmount", QTY1_AMOUNT);
        long orderSeq = parse(postJson("/api/v1/orders", access, req).getBody()).path("data").path("orderSeq").asLong();

        ResponseEntity<String> pay = postJson("/api/v1/orders/" + orderSeq + "/pay", access,
                Map.of("paymentType", "CARD", "cardNo", "1234-5678-9012-3456", "installment", 0));
        assertThat(parse(pay.getBody()).path("data").path("orderStatus").asText()).isEqualTo("PAID");
        return new PaidOrder(orderSeq, access);
    }

    private void ok(ResponseEntity<String> resp) {
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);
    }

    private String base(long orderSeq) {
        return "/api/v1/admin/orders/" + orderSeq;
    }

    private String orderStatus(long orderSeq) {
        return jdbcTemplate.queryForObject("SELECT order_status FROM dat_order WHERE order_seq = ?", String.class, orderSeq);
    }

    private String shippingStatus(long orderSeq) {
        return shippingCol(orderSeq, "shipping_status");
    }

    private String shippingCol(long orderSeq, String col) {
        return jdbcTemplate.queryForObject(
                "SELECT " + col + " FROM dat_order_shipping WHERE order_seq = ?", String.class, orderSeq);
    }

    private boolean timestampSet(long orderSeq, String col) {
        Integer c = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM dat_order_shipping WHERE order_seq = ? AND " + col + " IS NOT NULL",
                Integer.class, orderSeq);
        return c != null && c == 1;
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

    private record PaidOrder(long orderSeq, String ownerAccess) {}
}
