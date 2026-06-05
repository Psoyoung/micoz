package com.micoz.cart;

import com.fasterxml.jackson.databind.JsonNode;
import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CartIntegrationTest extends IntegrationTestSupport {

    private static final long PRODUCT_TONER = 1L;
    private static final long OPTION_TONER_150 = 1L;
    private static final long PRODUCT_ESSENCE = 2L;
    private static final long OPTION_ESSENCE_30 = 3L;

    @Test
    @DisplayName("FR-CART-01: 담기 → 합산 → 옵션필수 → 재고초과 → PATCH → DELETE 시나리오")
    void cartFullScenario() {
        String access = signupAndLogin();

        // [1] 정상 담기
        ResponseEntity<String> r1 = postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT_TONER, "optionSeq", OPTION_TONER_150, "quantity", 2));
        assertThat(r1.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode d1 = parse(r1.getBody()).path("data");
        assertThat(d1.path("quantity").asInt()).isEqualTo(2);
        long cartSeq = d1.path("cartSeq").asLong();

        // [2] 동일 재 POST → 수량 합산(2+3=5)
        ResponseEntity<String> r2 = postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT_TONER, "optionSeq", OPTION_TONER_150, "quantity", 3));
        assertThat(r2.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode d2 = parse(r2.getBody()).path("data");
        assertThat(d2.path("cartSeq").asLong()).isEqualTo(cartSeq);
        assertThat(d2.path("quantity").asInt()).isEqualTo(5);

        // [3] 옵션 미입력 → CART_OPTION_REQUIRED
        Map<String, Object> noOption = new HashMap<>();
        noOption.put("productSeq", PRODUCT_ESSENCE);
        noOption.put("quantity", 1);
        ResponseEntity<String> r3 = postJson("/api/v1/cart", access, noOption);
        assertThat(parse(r3.getBody()).path("code").asText()).isEqualTo("CART_OPTION_REQUIRED");

        // [4] 재고 초과 → PRODUCT_SOLD_OUT
        ResponseEntity<String> r4 = postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT_ESSENCE, "optionSeq", OPTION_ESSENCE_30, "quantity", 99999));
        assertThat(parse(r4.getBody()).path("code").asText()).isEqualTo("PRODUCT_SOLD_OUT");

        // [5] PATCH 수량 변경 (5→4)
        ResponseEntity<String> r5 = patchJson("/api/v1/cart/" + cartSeq, access, Map.of("quantity", 4));
        assertThat(r5.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parse(r5.getBody()).path("data").path("quantity").asInt()).isEqualTo(4);

        // [6] GET → cart 1건, totalAmount 정확
        ResponseEntity<String> r6 = getJson("/api/v1/cart", access);
        JsonNode list = parse(r6.getBody()).path("data");
        assertThat(list.path("itemCount").asInt()).isEqualTo(1);
        assertThat(list.path("items").get(0).path("quantity").asInt()).isEqualTo(4);

        // [7] DELETE → 200, GET 시 비어있음
        ResponseEntity<String> r7 = deleteJson("/api/v1/cart/" + cartSeq, access);
        assertThat(r7.getStatusCode()).isEqualTo(HttpStatus.OK);
        ResponseEntity<String> r8 = getJson("/api/v1/cart", access);
        assertThat(parse(r8.getBody()).path("data").path("itemCount").asInt()).isEqualTo(0);

        // [8] 이미 삭제된 행 재 DELETE → CART_ITEM_NOT_FOUND
        ResponseEntity<String> r9 = deleteJson("/api/v1/cart/" + cartSeq, access);
        assertThat(parse(r9.getBody()).path("code").asText()).isEqualTo("CART_ITEM_NOT_FOUND");
    }

    @Test
    @DisplayName("타인 카트 PATCH는 CART_ITEM_NOT_FOUND로 비노출")
    void otherUserCannotAccess() {
        String aliceAccess = signupAndLogin();
        ResponseEntity<String> add = postJson("/api/v1/cart", aliceAccess,
                Map.of("productSeq", PRODUCT_TONER, "optionSeq", OPTION_TONER_150, "quantity", 1));
        long aliceCartSeq = parse(add.getBody()).path("data").path("cartSeq").asLong();

        String bobAccess = signupAndLogin();
        ResponseEntity<String> attempt = patchJson("/api/v1/cart/" + aliceCartSeq, bobAccess,
                Map.of("quantity", 2));
        assertThat(parse(attempt.getBody()).path("code").asText()).isEqualTo("CART_ITEM_NOT_FOUND");
    }
}
