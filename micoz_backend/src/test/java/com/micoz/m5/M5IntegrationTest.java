package com.micoz.m5;

import com.fasterxml.jackson.databind.JsonNode;
import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class M5IntegrationTest extends IntegrationTestSupport {

    private static final long PRODUCT_TONER = 1L;
    private static final long OPTION_TONER_150 = 1L;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private long createPaidOrder(String access) {
        // 카트 담기
        ResponseEntity<String> addCart = postJson("/api/v1/cart", access,
                Map.of("productSeq", PRODUCT_TONER, "optionSeq", OPTION_TONER_150, "quantity", 2));
        long cartSeq = parse(addCart.getBody()).path("data").path("cartSeq").asLong();

        // 주문
        Map<String, Object> orderReq = new HashMap<>();
        orderReq.put("cartSeqs", List.of(cartSeq));
        orderReq.put("recipientName", "테스트");
        orderReq.put("recipientPhone", "010-0000-0000");
        orderReq.put("zipCode", "06000");
        orderReq.put("address", "테스트 주소");
        orderReq.put("clientAmount", 56000);
        long orderSeq = parse(postJson("/api/v1/orders", access, orderReq).getBody())
                .path("data").path("orderSeq").asLong();

        // 결제
        postJson("/api/v1/orders/" + orderSeq + "/pay", access,
                Map.of("paymentType", "CARD", "cardNo", "1234-5678-9012-3456", "installment", 0));
        return orderSeq;
    }

    private void markDelivered(long orderSeq, int daysAgo) {
        jdbcTemplate.update("UPDATE dat_order SET order_status='DELIVERED' WHERE order_seq=?", orderSeq);
        jdbcTemplate.update(
                "UPDATE dat_order_shipping SET shipping_status='DELIVERED', " +
                        "delivered_date = NOW() - (? || ' days')::interval WHERE order_seq=?",
                String.valueOf(daysAgo), orderSeq);
    }

    private long firstItemSeq(long orderSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT item_seq FROM dat_order_item WHERE order_seq=? ORDER BY item_seq LIMIT 1",
                Long.class, orderSeq);
    }

    @Test
    @DisplayName("M5 DoD: 주문→PAID→DELIVERED→반품 신청 풀 시나리오")
    void returnFullScenario() {
        String access = signupAndLogin();
        long orderSeq = createPaidOrder(access);
        markDelivered(orderSeq, 0); // 오늘 배송 완료
        long itemSeq = firstItemSeq(orderSeq);

        // 반품 신청
        Map<String, Object> retReq = Map.of(
                "returnType", "RETURN",
                "returnReasonType", "DEFECT",
                "returnReason", "흠집",
                "items", List.of(Map.of("itemSeq", itemSeq, "quantity", 1)));
        ResponseEntity<String> create = postJson(
                "/api/v1/me/orders/" + orderSeq + "/returns", access, retReq);
        assertThat(create.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode created = parse(create.getBody()).path("data");
        assertThat(created.path("returnStatus").asText()).isEqualTo("REQUESTED");
        assertThat(created.path("returnNo").asText()).startsWith("RT-");
        long returnSeq = created.path("returnSeq").asLong();

        // 목록 조회
        ResponseEntity<String> list = getJson("/api/v1/me/returns", access);
        assertThat(parse(list.getBody()).path("data").path("totalElements").asInt()).isEqualTo(1);

        // 상세 조회
        ResponseEntity<String> detail = getJson("/api/v1/me/returns/" + returnSeq, access);
        JsonNode d = parse(detail.getBody()).path("data");
        assertThat(d.path("returnType").asText()).isEqualTo("RETURN");
        assertThat(d.path("items").get(0).path("productName").asText()).isEqualTo("글로우 토너");
    }

    @Test
    @DisplayName("반품 가능 기간(7일) 초과 → RETURN_PERIOD_EXPIRED")
    void returnPeriodExpired() {
        String access = signupAndLogin();
        long orderSeq = createPaidOrder(access);
        markDelivered(orderSeq, 8); // 8일 전 배송 완료
        long itemSeq = firstItemSeq(orderSeq);

        Map<String, Object> retReq = Map.of(
                "returnType", "RETURN",
                "returnReasonType", "DEFECT",
                "items", List.of(Map.of("itemSeq", itemSeq, "quantity", 1)));
        ResponseEntity<String> r = postJson(
                "/api/v1/me/orders/" + orderSeq + "/returns", access, retReq);
        assertThat(parse(r.getBody()).path("code").asText()).isEqualTo("RETURN_PERIOD_EXPIRED");
    }

    @Test
    @DisplayName("FR-REV-01: 리뷰 작성 → 상품 리뷰 조회 → 중복 → REVIEW_ALREADY_WRITTEN")
    void reviewFullScenario() {
        String access = signupAndLogin();
        long orderSeq = createPaidOrder(access);
        markDelivered(orderSeq, 0);
        long itemSeq = firstItemSeq(orderSeq);

        // 리뷰 작성
        Map<String, Object> reviewReq = Map.of(
                "itemSeq", itemSeq,
                "rating", 5,
                "title", "좋아요",
                "content", "수분감이 좋습니다",
                "imageUrls", List.of("https://cdn.example.com/x.jpg"));
        ResponseEntity<String> create = postJson("/api/v1/reviews", access, reviewReq);
        assertThat(create.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode created = parse(create.getBody()).path("data");
        assertThat(created.path("userIdMasked").asText()).contains("*");
        assertThat(created.path("imageUrls").get(0).asText()).startsWith("https://");

        // 상품 리뷰 조회
        ResponseEntity<String> list = getJson("/api/v1/products/" + PRODUCT_TONER + "/reviews", access);
        assertThat(parse(list.getBody()).path("data").path("totalElements").asInt()).isGreaterThanOrEqualTo(1);

        // 중복 작성
        ResponseEntity<String> dup = postJson("/api/v1/reviews", access, reviewReq);
        assertThat(parse(dup.getBody()).path("code").asText()).isEqualTo("REVIEW_ALREADY_WRITTEN");
    }

    @Test
    @DisplayName("PAID 상태(미배송)에서 리뷰 시도 → REVIEW_NOT_ALLOWED")
    void reviewNotAllowedBeforeDelivery() {
        String access = signupAndLogin();
        long orderSeq = createPaidOrder(access);
        // markDelivered 호출하지 않음 → PAID 상태 유지
        long itemSeq = firstItemSeq(orderSeq);

        Map<String, Object> reviewReq = Map.of(
                "itemSeq", itemSeq,
                "rating", 4,
                "content", "잘 받았어요");
        ResponseEntity<String> r = postJson("/api/v1/reviews", access, reviewReq);
        assertThat(parse(r.getBody()).path("code").asText()).isEqualTo("REVIEW_NOT_ALLOWED");
    }
}
