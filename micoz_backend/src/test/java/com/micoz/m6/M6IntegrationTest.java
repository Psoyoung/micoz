package com.micoz.m6;

import com.fasterxml.jackson.databind.JsonNode;
import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class M6IntegrationTest extends IntegrationTestSupport {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /** signup + login 후 새 user_seq를 반환. */
    private long signupAndUserSeq(String[] accessHolder) {
        String access = signupAndLogin();
        accessHolder[0] = access;
        // me 호출로 본인 userSeq 획득
        ResponseEntity<String> me = getJson("/api/v1/me", access);
        return parse(me.getBody()).path("data").path("userSeq").asLong();
    }

    @Test
    @DisplayName("FR-MY-03: 포인트 잔액·이력 조회 정합성")
    void pointBalanceAndHistory() {
        String[] accessHolder = new String[1];
        long userSeq = signupAndUserSeq(accessHolder);
        String access = accessHolder[0];

        // 포인트 이력 + 잔액 직접 삽입
        jdbcTemplate.update(
                "INSERT INTO his_point (user_seq, point_type, point_amount, balance_after, reason, i_user) " +
                        "VALUES (?, 'EARN', 2000, 2000, '가입 적립', 'TEST')", userSeq);
        jdbcTemplate.update(
                "INSERT INTO his_point (user_seq, point_type, point_amount, balance_after, reason, i_user) " +
                        "VALUES (?, 'USE', -500, 1500, '주문 사용', 'TEST')", userSeq);
        jdbcTemplate.update("UPDATE mst_user SET point_balance = 1500 WHERE user_seq = ?", userSeq);

        ResponseEntity<String> resp = getJson("/api/v1/me/points", access);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode data = parse(resp.getBody()).path("data");
        assertThat(data.path("balance").asInt()).isEqualTo(1500);
        assertThat(data.path("history").path("totalElements").asInt()).isEqualTo(2);
    }

    @Test
    @DisplayName("FR-MY-03: 쿠폰 보유 + 상태별 필터")
    void couponList() {
        String[] accessHolder = new String[1];
        long userSeq = signupAndUserSeq(accessHolder);
        String access = accessHolder[0];

        // 쿠폰 마스터 1개 + 사용자 발급 2건 (AVAILABLE + USED)
        Long couponSeq = jdbcTemplate.queryForObject(
                "INSERT INTO mst_coupon (coupon_code, coupon_name, coupon_type, discount_value, " +
                        "min_order_amount, valid_days, description, use_yn, i_user) " +
                        "VALUES (?, ?, 'FIXED', 3000, 10000, 30, 'test', 'Y', 'TEST') RETURNING coupon_seq",
                Long.class, "TC" + System.nanoTime() % 100000, "테스트쿠폰");
        jdbcTemplate.update(
                "INSERT INTO map_user_coupon (user_seq, coupon_seq, coupon_status, issued_date, expire_date, use_yn, i_user) " +
                        "VALUES (?, ?, 'AVAILABLE', NOW(), NOW() + INTERVAL '30 days', 'Y', 'TEST')",
                userSeq, couponSeq);
        jdbcTemplate.update(
                "INSERT INTO map_user_coupon (user_seq, coupon_seq, coupon_status, issued_date, expire_date, used_date, use_yn, i_user) " +
                        "VALUES (?, ?, 'USED', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', NOW(), 'Y', 'TEST')",
                userSeq, couponSeq);

        // 전체 2건
        JsonNode all = parse(getJson("/api/v1/me/coupons", access).getBody()).path("data");
        assertThat(all.path("totalElements").asInt()).isEqualTo(2);

        // AVAILABLE 1건
        JsonNode avail = parse(getJson("/api/v1/me/coupons?status=AVAILABLE", access).getBody()).path("data");
        assertThat(avail.path("totalElements").asInt()).isEqualTo(1);
        assertThat(avail.path("content").get(0).path("couponStatus").asText()).isEqualTo("AVAILABLE");

        // USED 1건
        JsonNode used = parse(getJson("/api/v1/me/coupons?status=USED", access).getBody()).path("data");
        assertThat(used.path("totalElements").asInt()).isEqualTo(1);
        assertThat(used.path("content").get(0).path("usedDate").asText()).isNotEmpty();
    }

    @Test
    @DisplayName("FR-MY-04: 문의 작성 → 목록 → 상세")
    void inquiryFullScenario() {
        String access = signupAndLogin();

        Map<String, Object> req = Map.of(
                "inquiryType", "PRODUCT",
                "title", "성분 문의",
                "content", "안전한가요?",
                "productSeq", 1,
                "privateYn", "N");
        ResponseEntity<String> create = postJson("/api/v1/me/inquiries", access, req);
        assertThat(create.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode created = parse(create.getBody()).path("data");
        assertThat(created.path("inquiryNo").asText()).startsWith("IQ-");
        long inquirySeq = created.path("inquirySeq").asLong();

        // 목록
        JsonNode list = parse(getJson("/api/v1/me/inquiries", access).getBody()).path("data");
        assertThat(list.path("totalElements").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(list.path("content").get(0).path("hasReply").asBoolean()).isFalse();

        // 상세
        JsonNode detail = parse(getJson("/api/v1/me/inquiries/" + inquirySeq, access).getBody()).path("data");
        assertThat(detail.path("inquiryStatus").asText()).isEqualTo("WAITING");
        assertThat(detail.path("replies")).isEmpty();
    }

    @Test
    @DisplayName("FR-MY-04: 잘못된 inquiryType → COMMON_VALIDATION_ERROR")
    void inquiryInvalidType() {
        String access = signupAndLogin();

        Map<String, Object> req = Map.of(
                "inquiryType", "WEIRD",
                "title", "x",
                "content", "y");
        ResponseEntity<String> r = postJson("/api/v1/me/inquiries", access, req);
        assertThat(parse(r.getBody()).path("code").asText()).isEqualTo("COMMON_VALIDATION_ERROR");
    }
}
