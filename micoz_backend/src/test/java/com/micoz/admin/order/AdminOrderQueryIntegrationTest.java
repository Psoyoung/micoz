package com.micoz.admin.order;

import com.fasterxml.jackson.databind.JsonNode;
import com.micoz.support.IntegrationTestSupport;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
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
 * O-T4 관리자 주문 조회 E2E — 검색(다축·정렬 화이트리스트) / 상세(전 회원·스냅샷) / N+1 / D3(썸네일 placeholder).
 * 비밀번호는 테스트 픽스처(실제 시크릿 아님). N+1은 jdbc 대량삽입으로 측정(HTTP 결제 반복 회피).
 */
class AdminOrderQueryIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "OrderQuery#Admin1234";
    private static final long PRODUCT_TONER = 1L;
    private static final long OPTION_TONER_150 = 1L;
    private static final int QTY1_AMOUNT = 31000;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private String adminId;
    private String adminToken;
    private long adminUserSeq;

    @BeforeEach
    void seedAdmin() {
        adminId = "opquery" + suffix();
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, "
                        + "point_balance, user_status, use_yn, i_user) "
                        + "VALUES (?, ?, '주문조회관리자', 'ADMIN', 0, 'ACTIVE', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);
        adminUserSeq = jdbcTemplate.queryForObject(
                "SELECT user_seq FROM mst_user WHERE user_id = ?", Long.class, adminId);
    }

    @AfterEach
    void cleanup() {
        // N+1 테스트 잔여 주문 정리
        jdbcTemplate.update("DELETE FROM dat_order_item WHERE order_seq IN "
                + "(SELECT order_seq FROM dat_order WHERE order_no LIKE 'NPQ-%')");
        jdbcTemplate.update("DELETE FROM dat_order WHERE order_no LIKE 'NPQ-%'");
        // D3 테스트가 토너 대표이미지를 소프트삭제했을 수 있으니 시드값('Y')으로 원복
        jdbcTemplate.update("UPDATE mst_product_image SET use_yn = 'Y' "
                + "WHERE product_seq = ? AND image_type = 'MAIN'", PRODUCT_TONER);
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'opquery%'");
    }

    @Test
    @DisplayName("검색: orderNo(q)·orderStatus·userSeq 필터 + userSeq 노출")
    void searchFilters() {
        PaidOrder po = createPaidOrder();
        long ownerSeq = jdbcTemplate.queryForObject(
                "SELECT user_seq FROM dat_order WHERE order_seq = ?", Long.class, po.orderSeq());

        // q = 정확한 주문번호 → 1건, 필드 확인
        JsonNode page = listData("?q=" + po.orderNo());
        JsonNode row = firstRowWithOrderSeq(page, po.orderSeq());
        assertThat(row).isNotNull();
        assertThat(row.path("userSeq").asLong()).isEqualTo(ownerSeq);
        assertThat(row.path("orderStatus").asText()).isEqualTo("PAID");
        assertThat(row.path("firstItemName").asText()).isEqualTo("글로우 토너");
        assertThat(row.path("totalItemCount").asInt()).isEqualTo(1);

        // orderStatus=CANCELED → 이 주문 없음
        assertThat(firstRowWithOrderSeq(listData("?q=" + po.orderNo() + "&orderStatus=CANCELED"), po.orderSeq()))
                .isNull();
        // userSeq 필터 → 이 주문 포함
        assertThat(firstRowWithOrderSeq(listData("?userSeq=" + ownerSeq), po.orderSeq())).isNotNull();
    }

    @Test
    @DisplayName("정렬 화이트리스트: 미허용 키 → 400 COMMON_INVALID_REQUEST")
    void sortWhitelistRejectsUnknownKey() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/orders?sort=hackerField,desc", adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_INVALID_REQUEST");
    }

    @Test
    @DisplayName("상세: 전 회원 주문 조회(본인-행 제약 없음) + 스냅샷·배송·결제 결합 + userSeq")
    void detailAllUsers() {
        PaidOrder po = createPaidOrder(); // 주문 소유자는 admin이 아닌 일반 유저
        long ownerSeq = jdbcTemplate.queryForObject(
                "SELECT user_seq FROM dat_order WHERE order_seq = ?", Long.class, po.orderSeq());
        assertThat(ownerSeq).isNotEqualTo(adminUserSeq); // admin은 남의 주문을 본다

        JsonNode d = detailData(po.orderSeq());
        assertThat(d.path("userSeq").asLong()).isEqualTo(ownerSeq);
        assertThat(d.path("orderStatus").asText()).isEqualTo("PAID");
        assertThat(d.path("items").get(0).path("productName").asText()).isEqualTo("글로우 토너");
        assertThat(d.path("items").get(0).path("optionName").asText()).isEqualTo("150ml");
        assertThat(d.path("payment").path("paymentStatus").asText()).isEqualTo("PAID");
        assertThat(d.path("shipping").path("recipientName").asText()).isEqualTo("테스트");
    }

    @Test
    @DisplayName("상세 부재 → 404 ORDER_NOT_FOUND")
    void detailNotFound() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/orders/99999999", adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("ORDER_NOT_FOUND");
    }

    @Test
    @DisplayName("D3: 소프트삭제 상품 상세 → mainImageUrl=null(placeholder)이되 상품명 스냅샷 온전")
    void d3SoftDeletedProductImageBecomesPlaceholder() {
        PaidOrder po = createPaidOrder();
        // 삭제 전: 토너 대표이미지 존재
        assertThat(detailData(po.orderSeq()).path("items").get(0).path("mainImageUrl").asText())
                .startsWith("https://");

        // 상품 대표이미지 소프트삭제(라이브 조인 탈락 유도) — @AfterEach가 원복
        jdbcTemplate.update("UPDATE mst_product_image SET use_yn = 'N' "
                + "WHERE product_seq = ? AND image_type = 'MAIN'", PRODUCT_TONER);

        JsonNode d = detailData(po.orderSeq());
        JsonNode item = d.path("items").get(0);
        assertThat(item.path("mainImageUrl").isMissingNode() || item.path("mainImageUrl").isNull())
                .as("소프트삭제 → 라이브 조인 null(NON_NULL 직렬화로 필드 생략) = placeholder 대상").isTrue();
        // 스냅샷 필드는 온전
        assertThat(item.path("productName").asText()).isEqualTo("글로우 토너");
        assertThat(item.path("unitPrice").asInt()).isEqualTo(28000);
    }

    @Test
    @DisplayName("[N+1] 주문 수가 늘어도 목록 statement 상수(주문 페이지 + 상품 배치조회)")
    void listNoNPlusOne() {
        getJson("/api/v1/admin/orders?q=NPQ-", adminToken); // 워밍업

        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);

        // 두 측정 모두 '가득 찬 첫 페이지(20건)'가 되도록 21건 이상씩 삽입(count 생략 차이 제거)
        for (int i = 0; i < 21; i++) insertOrderWithItem("NPQ-a-" + i + "-" + suffix());
        stats.clear();
        listData("?q=NPQ-&size=20");
        long small = stats.getPrepareStatementCount();

        for (int i = 0; i < 21; i++) insertOrderWithItem("NPQ-b-" + i + "-" + suffix());
        stats.clear();
        listData("?q=NPQ-&size=20");
        long large = stats.getPrepareStatementCount();

        assertThat(large).as("주문 21→42로 늘어도 목록 statement 상수(N+1 금지)").isEqualTo(small);
        assertThat(small).as("content + count + 상품배치(+ 인증 부수) 상수").isLessThanOrEqualTo(8);
    }

    // ───────────────────────── helpers ─────────────────────────

    private JsonNode listData(String queryString) {
        ResponseEntity<String> resp = getJson("/api/v1/admin/orders" + queryString, adminToken);
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
    }

    private JsonNode detailData(long orderSeq) {
        ResponseEntity<String> resp = getJson("/api/v1/admin/orders/" + orderSeq, adminToken);
        assertThat(resp.getStatusCode()).as(resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
    }

    /** 목록 data.content 에서 orderSeq 일치 행 반환(없으면 null). */
    private JsonNode firstRowWithOrderSeq(JsonNode pageData, long orderSeq) {
        for (JsonNode row : pageData.path("content")) {
            if (row.path("orderSeq").asLong() == orderSeq) return row;
        }
        return null;
    }

    private void insertOrderWithItem(String orderNo) {
        jdbcTemplate.update(
                "INSERT INTO dat_order (order_no, user_seq, order_status, final_amount, order_date, i_user) "
                        + "VALUES (?, ?, 'PAID', 31000, NOW(), 'TEST')",
                orderNo, adminUserSeq);
        Long orderSeq = jdbcTemplate.queryForObject(
                "SELECT order_seq FROM dat_order WHERE order_no = ?", Long.class, orderNo);
        jdbcTemplate.update(
                "INSERT INTO dat_order_item (order_seq, product_seq, product_name, unit_price, quantity, item_amount, i_user) "
                        + "VALUES (?, 1, '글로우 토너', 28000, 1, 28000, 'TEST')",
                orderSeq);
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
        JsonNode created = parse(postJson("/api/v1/orders", access, req).getBody()).path("data");
        long orderSeq = created.path("orderSeq").asLong();
        String orderNo = created.path("orderNo").asText();

        ResponseEntity<String> pay = postJson("/api/v1/orders/" + orderSeq + "/pay", access,
                Map.of("paymentType", "CARD", "cardNo", "1234-5678-9012-3456", "installment", 0));
        assertThat(parse(pay.getBody()).path("data").path("orderStatus").asText()).isEqualTo("PAID");
        return new PaidOrder(orderSeq, orderNo);
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

    private record PaidOrder(long orderSeq, String orderNo) {}
}
