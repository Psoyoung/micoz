package com.micoz.admin.settings;

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

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * S-T2 배송 설정(단일행 update-only) E2E + 연결 회귀검증(관리자 변경 → 실주문 반영).
 *
 * <p><b>공유 행 격리</b>: mst_shipping은 전 테스트 클래스 공유 단일행이다. @BeforeEach에서 원본을
 * 캡처하고 @AfterEach에서 DELETE+INSERT로 원복해, 다른 클래스(OrderIntegrationTest 등)가 시드값을
 * 그대로 보도록 보장한다(테스트 실패 시에도 @AfterEach는 실행됨).
 *
 * <p>토너(product 1 / option 1, finalPrice 28000) 시드를 이용해 실주문 금액을 검증한다.
 * 비밀번호는 테스트 픽스처(실제 시크릿 아님).
 */
class AdminShippingSettingIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "Settings#Ship1234";
    private static final long PRODUCT_TONER = 1L;
    private static final long OPTION_TONER_150 = 1L;
    private static final int TONER_PRICE = 28000;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminId;
    private String adminToken;
    private String sfx;

    // 공유 단일행 원본 스냅샷
    private Map<String, Object> original;

    @BeforeEach
    void seed() {
        original = jdbcTemplate.queryForMap(
                "SELECT shipping_name, shipping_fee, free_shipping_min, remote_extra_fee, shipping_notice "
                        + "FROM mst_shipping ORDER BY ship_seq ASC LIMIT 1");

        sfx = suffix();
        adminId = "stship" + sfx;
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, "
                        + "point_balance, user_status, use_yn, i_user) "
                        + "VALUES (?, ?, '배송설정관리자', 'ADMIN', 0, 'ACTIVE', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);
    }

    @AfterEach
    void restore() {
        // 공유 단일행을 원본으로 원복(부재 테스트가 삭제했더라도 정확히 1행 복원)
        jdbcTemplate.update("DELETE FROM mst_shipping");
        jdbcTemplate.update(
                "INSERT INTO mst_shipping (shipping_name, shipping_fee, free_shipping_min, remote_extra_fee, "
                        + "shipping_notice, i_user) VALUES (?, ?, ?, ?, ?, 'TEST')",
                original.get("shipping_name"), original.get("shipping_fee"),
                original.get("free_shipping_min"), original.get("remote_extra_fee"),
                original.get("shipping_notice"));
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'stship%'");
    }

    // ─────────────────────────────────────────────────────────────
    // 조회 / 수정 기본
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("GET → 시드값(3000/50000/3000) 반환")
    void getReturnsSeed() {
        JsonNode d = getData();
        assertThat(d.path("shippingFee").decimalValue()).isEqualByComparingTo("3000");
        assertThat(d.path("freeShippingMin").decimalValue()).isEqualByComparingTo("50000");
        assertThat(d.path("remoteExtraFee").decimalValue()).isEqualByComparingTo("3000");
        assertThat(d.path("shipSeq").asLong()).isPositive();
    }

    @Test
    @DisplayName("PATCH 후 GET → 변경 반영")
    void patchThenGet() {
        Map<String, Object> body = new HashMap<>();
        body.put("shippingFee", 4500);
        body.put("freeShippingMin", 70000);
        body.put("remoteExtraFee", 5000);
        body.put("shippingName", "새배송사");
        body.put("shippingNotice", "안내문 변경");
        assertThat(patchJson("/api/v1/admin/settings/shipping", adminToken, body).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        JsonNode d = getData();
        assertThat(d.path("shippingFee").decimalValue()).isEqualByComparingTo("4500");
        assertThat(d.path("freeShippingMin").decimalValue()).isEqualByComparingTo("70000");
        assertThat(d.path("remoteExtraFee").decimalValue()).isEqualByComparingTo("5000");
        assertThat(d.path("shippingName").asText()).isEqualTo("새배송사");
        assertThat(d.path("shippingNotice").asText()).isEqualTo("안내문 변경");
        // 감사: updatedBy 관리자 기록
        assertThat(d.path("updatedBy").asText()).isEqualTo(adminId);
    }

    @Test
    @DisplayName("부분 수정 — 준 필드만 변경, 나머지(금액 3필드 포함) 기존값 보존")
    void partialUpdate() {
        // 이름만 변경
        assertThat(patchJson("/api/v1/admin/settings/shipping", adminToken,
                Map.of("shippingName", "부분수정사")).getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode d = getData();
        assertThat(d.path("shippingName").asText()).isEqualTo("부분수정사");
        // 금액 3필드는 시드값 그대로(null 되지 않음)
        assertThat(d.path("shippingFee").decimalValue()).isEqualByComparingTo("3000");
        assertThat(d.path("freeShippingMin").decimalValue()).isEqualByComparingTo("50000");
        assertThat(d.path("remoteExtraFee").decimalValue()).isEqualByComparingTo("3000");
    }

    @Test
    @DisplayName("음수 금액 → 400, 설정 불변")
    void negativeRejected() {
        ResponseEntity<String> resp = patchJson("/api/v1/admin/settings/shipping", adminToken,
                Map.of("shippingFee", -1));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // 불변 확인
        assertThat(getData().path("shippingFee").decimalValue()).isEqualByComparingTo("3000");
    }

    // ─────────────────────────────────────────────────────────────
    // ★ 연결 회귀검증 — 관리자 변경이 실주문 배송비에 반영
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("[연결] PATCH 배송비 → 실주문 shippingFee/finalAmount가 새 설정값으로 산출")
    void adminChangeReflectsInRealOrder() {
        // 무료배송 임계를 매우 높게 → 소액주문도 배송비 부과. 기본 배송비 7777.
        Map<String, Object> body = new HashMap<>();
        body.put("shippingFee", 7777);
        body.put("freeShippingMin", 999999999);
        body.put("remoteExtraFee", 1234);
        assertThat(patchJson("/api/v1/admin/settings/shipping", adminToken, body).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        // 일반(비-도서산간) 주문: 28000 + 7777 = 35777
        JsonNode order = createOrder(1, false, 35777);
        assertThat(order.path("shippingFee").decimalValue()).isEqualByComparingTo("7777");
        assertThat(order.path("finalAmount").decimalValue()).isEqualByComparingTo("35777");

        // 도서산간 주문: 28000 + 7777 + 1234 = 37011
        JsonNode remote = createOrder(1, true, 37011);
        assertThat(remote.path("shippingFee").decimalValue()).isEqualByComparingTo("9011");
        assertThat(remote.path("finalAmount").decimalValue()).isEqualByComparingTo("37011");
    }

    @Test
    @DisplayName("[연결] freeShippingMin=0 → 항상 무료(base 0), 도서산간은 가산")
    void freeShippingZeroMeansAlwaysFree() {
        Map<String, Object> body = new HashMap<>();
        body.put("shippingFee", 7777);
        body.put("freeShippingMin", 0);
        body.put("remoteExtraFee", 1234);
        assertThat(patchJson("/api/v1/admin/settings/shipping", adminToken, body).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        // 소액주문도 base 무료: 28000 + 0 = 28000
        JsonNode order = createOrder(1, false, 28000);
        assertThat(order.path("shippingFee").decimalValue()).isEqualByComparingTo("0");
        assertThat(order.path("finalAmount").decimalValue()).isEqualByComparingTo("28000");

        // 도서산간: base 0 + remote 1234 = 1234
        JsonNode remote = createOrder(1, true, 29234);
        assertThat(remote.path("shippingFee").decimalValue()).isEqualByComparingTo("1234");
    }

    // ─────────────────────────────────────────────────────────────
    // 부재 처리 (S-Q1=A)
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("정본 행 부재 → GET/PATCH 모두 500 SHIPPING_SETTING_NOT_FOUND (@AfterEach가 원복)")
    void missingRowFails() {
        jdbcTemplate.update("DELETE FROM mst_shipping");

        ResponseEntity<String> get = getJson("/api/v1/admin/settings/shipping", adminToken);
        assertThat(get.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(parse(get.getBody()).path("code").asText()).isEqualTo("SHIPPING_SETTING_NOT_FOUND");

        ResponseEntity<String> patch = patchJson("/api/v1/admin/settings/shipping", adminToken,
                Map.of("shippingFee", 1000));
        assertThat(patch.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(parse(patch.getBody()).path("code").asText()).isEqualTo("SHIPPING_SETTING_NOT_FOUND");
    }

    // ─────────────────────────────────────────────────────────────
    // helpers
    // ─────────────────────────────────────────────────────────────
    private JsonNode getData() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/settings/shipping", adminToken);
        assertThat(resp.getStatusCode()).as("조회 성공: %s", resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
    }

    /** 신규 유저로 토너 qty개를 카트에 담아 주문 생성. clientAmount는 기대 최종금액. 생성 응답 data 반환. */
    private JsonNode createOrder(int qty, boolean isRemote, int clientAmount) {
        String access = signupAndLogin();
        ResponseEntity<String> addCart = postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT_TONER, "optionSeq", OPTION_TONER_150, "quantity", qty));
        assertThat(addCart.getStatusCode()).as("카트 담기: %s", addCart.getBody()).isEqualTo(HttpStatus.OK);
        long cartSeq = parse(addCart.getBody()).path("data").path("cartSeq").asLong();

        Map<String, Object> orderReq = new HashMap<>();
        orderReq.put("cartSeqs", List.of(cartSeq));
        orderReq.put("recipientName", "테스트");
        orderReq.put("recipientPhone", "010-0000-0000");
        orderReq.put("zipCode", "06000");
        orderReq.put("address", "테스트 주소");
        orderReq.put("isRemote", isRemote);
        orderReq.put("clientAmount", clientAmount);

        ResponseEntity<String> resp = postJson("/api/v1/orders", access, orderReq);
        assertThat(resp.getStatusCode())
                .as("주문 생성 성공 기대(=관리자 변경값으로 서버 재계산 일치): %s", resp.getBody())
                .isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
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
