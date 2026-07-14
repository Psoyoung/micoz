package com.micoz.admin.product;

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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * C-T2 상품 목록·다축 검색 + 상세 E2E. 검색 패턴은 M-T1 ProductSpecs 답습(null-safe·정렬 화이트리스트·
 * LIKE 이스케이프·N+1 일괄로드). 픽스처는 product_code 'CT-%', url_slug 'ct-%', user_id 'ct%' 접두사.
 */
class AdminProductSearchIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "Catalog#Test1234";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private String adminId;
    private String adminToken;
    private String sfx;
    private long catA;
    private long catB;

    @BeforeEach
    void seed() {
        sfx = suffix();
        adminId = "ctadmin" + sfx;
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, "
                        + "point_balance, user_status, use_yn, i_user) "
                        + "VALUES (?, ?, '카탈로그관리자', 'ADMIN', 0, 'ACTIVE', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);

        catA = insertCategory("스킨케어A", "ct-cata-" + sfx);
        catB = insertCategory("메이크업B", "ct-catb-" + sfx);

        // 상품 4종: 카테고리/상태/노출/삭제 다양화
        long p1 = insertProduct("CT-TONER-" + sfx, "글로우토너", "ON_SALE", catA, "Y", "Y", 28000);
        insertOption(p1, "150ml", 28000, 10);
        insertOption(p1, "250ml", 40000, 20); // totalStock=30

        long p2 = insertProduct("CT-ESS-" + sfx, "비타에센스", "SOLD_OUT", catA, "N", "Y", 45000);
        insertOption(p2, "30ml", 45000, 0);

        insertProduct("CT-FOUND-" + sfx, "실키파운데이션", "ON_SALE", catB, "Y", "Y", 38000);

        insertProduct("CT-DEL-" + sfx, "삭제상품", "STOPPED", catB, "Y", "N", 19000); // 소프트삭제
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM map_product_label  WHERE product_seq IN (SELECT product_seq FROM mst_product WHERE product_code LIKE 'CT-%')");
        jdbcTemplate.update("DELETE FROM mst_product_option WHERE product_seq IN (SELECT product_seq FROM mst_product WHERE product_code LIKE 'CT-%')");
        jdbcTemplate.update("DELETE FROM mst_product_image  WHERE product_seq IN (SELECT product_seq FROM mst_product WHERE product_code LIKE 'CT-%')");
        jdbcTemplate.update("DELETE FROM mst_product   WHERE product_code LIKE 'CT-%'");
        jdbcTemplate.update("DELETE FROM mst_product_label WHERE label_name LIKE 'CT-%'");
        jdbcTemplate.update("DELETE FROM mst_category  WHERE url_slug LIKE 'ct-%'");
        jdbcTemplate.update("DELETE FROM mst_user      WHERE user_id  LIKE 'ct%'");
    }

    // 1. null-safe
    @Test
    @DisplayName("조건 없는 검색 → 활성 상품만(use_yn=Y), 페이지 메타 정상 (null-safe)")
    void noFilter() {
        JsonNode data = searchData("");
        // 내 활성 상품 3건 + V5 시드 baseline(모두 활성). 삭제 상품(CT-DEL)은 제외되므로 ≥3.
        assertThat(data.path("totalElements").asInt()).isGreaterThanOrEqualTo(3);
        assertThat(data.path("size").asInt()).isEqualTo(20);
        assertThat(data.path("page").asInt()).isZero();
    }

    // 2. 정렬 화이트리스트
    @Test
    @DisplayName("허용 정렬(productCode,asc) → 200 + 정렬 적용")
    void sortAllowed() {
        JsonNode content = searchData("?sort=productCode,asc").path("content");
        // CT-DEL 제외, CT-ESS < CT-FOUND < CT-TONER
        assertThat(content.get(0).path("productCode").asText()).isEqualTo("CT-ESS-" + sfx);
    }

    @Test
    @DisplayName("화이트리스트 밖 컬럼(detailDesc)로 정렬 → 400 (임의 컬럼 차단)")
    void sortWhitelistBlocksArbitraryColumn() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/products?sort=detailDesc,desc", adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_INVALID_REQUEST");
    }

    // 3. N+1 없음 — 카테고리명/재고합 일괄로드
    @Test
    @DisplayName("카테고리명·재고합 일괄로드 — page size 키워도 statement 상수 (N+1 없음)")
    void noNPlusOne() {
        for (int i = 0; i < 8; i++) {
            long p = insertProduct("CT-BULK-" + i + "-" + sfx, "벌크" + i, "ON_SALE",
                    (i % 2 == 0 ? catA : catB), "Y", "Y", 10000 + i);
            insertOption(p, "opt", 10000, i);
        }

        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();

        JsonNode data = searchData("?size=100");
        assertThat(data.path("content").size()).isGreaterThanOrEqualTo(11);

        long statements = stats.getPrepareStatementCount();
        assertThat(statements)
                .as("page+count+카테고리명 일괄+재고합 일괄 = 4 (행 수와 무관). N+1이면 행 수만큼 증가")
                .isLessThanOrEqualTo(5);
    }

    @Test
    @DisplayName("재고합(totalStock) = 활성 옵션 stock 합")
    void totalStockAggregated() {
        JsonNode data = searchData("?productCode=CT-TONER-" + sfx);
        assertThat(data.path("totalElements").asInt()).isEqualTo(1);
        assertThat(data.path("content").get(0).path("totalStock").asInt()).isEqualTo(30);
    }

    // 다축 검색
    @Test
    @DisplayName("카테고리 필터 → 해당 카테고리 상품만 + categoryName 채워짐")
    void filterByCategory() {
        JsonNode data = searchData("?categorySeq=" + catB);
        assertThat(data.path("totalElements").asInt()).isEqualTo(1); // CT-FOUND (CT-DEL은 삭제)
        JsonNode item = data.path("content").get(0);
        assertThat(item.path("productCode").asText()).isEqualTo("CT-FOUND-" + sfx);
        assertThat(item.path("categoryName").asText()).isEqualTo("메이크업B");
    }

    @Test
    @DisplayName("상태 필터(SOLD_OUT) → 해당 상태 상품만")
    void filterByStatus() {
        JsonNode data = searchData("?status=SOLD_OUT");
        assertThat(data.path("totalElements").asInt()).isEqualTo(1);
        assertThat(data.path("content").get(0).path("productCode").asText()).isEqualTo("CT-ESS-" + sfx);
    }

    @Test
    @DisplayName("노출 필터(displayYn=N) → 비노출 활성 상품만")
    void filterByDisplayYn() {
        JsonNode data = searchData("?displayYn=N");
        assertThat(data.path("totalElements").asInt()).isEqualTo(1); // CT-ESS (display N, use Y)
        assertThat(data.path("content").get(0).path("productCode").asText()).isEqualTo("CT-ESS-" + sfx);
    }

    @Test
    @DisplayName("키워드(q) → productCode 또는 productName 부분일치")
    void filterByKeyword() {
        // 시드 상품과 충돌하지 않도록 고유 접미사 포함 코드로 키워드 검색(code OR name).
        JsonNode data = searchData("?q=CT-ESS-" + sfx);
        assertThat(data.path("totalElements").asInt()).isEqualTo(1);
        assertThat(data.path("content").get(0).path("productCode").asText()).isEqualTo("CT-ESS-" + sfx);
    }

    @Test
    @DisplayName("LIKE 메타문자 이스케이프 — '_'는 와일드카드가 아닌 리터럴")
    void likeMetacharEscaped() {
        insertProduct("CT-AB_C-" + sfx, "언더상품", "ON_SALE", catA, "Y", "Y", 1000);
        insertProduct("CT-ABXC-" + sfx, "엑스상품", "ON_SALE", catA, "Y", "Y", 1000);

        JsonNode data = searchData("?productCode=CT-AB_C-" + sfx);
        assertThat(data.path("totalElements").asInt()).isEqualTo(1);
        assertThat(data.path("content").get(0).path("productCode").asText()).isEqualTo("CT-AB_C-" + sfx);
    }

    @Test
    @DisplayName("includeDeleted=false(기본) → 삭제 상품 제외 / true → 포함")
    void includeDeletedToggle() {
        JsonNode without = searchData("?productCode=CT-DEL-" + sfx);
        assertThat(without.path("totalElements").asInt()).isZero();

        JsonNode with = searchData("?productCode=CT-DEL-" + sfx + "&includeDeleted=true");
        assertThat(with.path("totalElements").asInt()).isEqualTo(1);
        assertThat(with.path("content").get(0).path("useYn").asText()).isEqualTo("N");
    }

    // 상세
    @Test
    @DisplayName("상세 → 옵션·이미지·라벨·카테고리명 채워짐")
    void detail() {
        long p = insertProduct("CT-DETAIL-" + sfx, "상세상품", "ON_SALE", catA, "Y", "Y", 50000);
        insertOption(p, "기본", 50000, 5);
        insertImage(p, "MAIN", "https://cdn.example/ct-detail-main.jpg");
        long labelSeq = insertLabel("CT-BEST-" + sfx);
        insertMap(p, labelSeq);

        ResponseEntity<String> resp = getJson("/api/v1/admin/products/" + p, adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode data = parse(resp.getBody()).path("data");
        assertThat(data.path("productCode").asText()).isEqualTo("CT-DETAIL-" + sfx);
        assertThat(data.path("categoryName").asText()).isEqualTo("스킨케어A");
        assertThat(data.path("options").size()).isEqualTo(1);
        assertThat(data.path("options").get(0).path("stockQty").asInt()).isEqualTo(5);
        assertThat(data.path("images").size()).isEqualTo(1);
        assertThat(data.path("labels").size()).isEqualTo(1);
        assertThat(data.path("labels").get(0).path("labelName").asText()).isEqualTo("CT-BEST-" + sfx);
    }

    @Test
    @DisplayName("미존재 상품 상세 → 404 PRODUCT_NOT_FOUND")
    void detailNotFound() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/products/99999999", adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("PRODUCT_NOT_FOUND");
    }

    @Test
    @DisplayName("소프트삭제 상품도 상세 직접 조회 가능(운영 뷰) — useYn='N'")
    void detailSoftDeletedAccessible() {
        Long delSeq = jdbcTemplate.queryForObject(
                "SELECT product_seq FROM mst_product WHERE product_code = ?", Long.class, "CT-DEL-" + sfx);
        ResponseEntity<String> resp = getJson("/api/v1/admin/products/" + delSeq, adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parse(resp.getBody()).path("data").path("useYn").asText()).isEqualTo("N");
    }

    @Test
    @DisplayName("회귀: 사용자 측 /api/v1/products 목록 정상")
    void customerProductListRegression() {
        ResponseEntity<String> resp = rest.getForEntity(baseUrl() + "/api/v1/products", String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("SUCCESS");
    }

    // ─────────────────────────── helpers ───────────────────────────
    private JsonNode searchData(String queryString) {
        ResponseEntity<String> resp = getJson("/api/v1/admin/products" + queryString, adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
    }

    private long insertCategory(String name, String slug) {
        jdbcTemplate.update(
                "INSERT INTO mst_category (category_name, url_slug, category_level, sort_order, "
                        + "display_yn, use_yn, i_user) VALUES (?, ?, 1, 0, 'Y', 'Y', 'TEST')",
                name, slug);
        return jdbcTemplate.queryForObject(
                "SELECT category_seq FROM mst_category WHERE url_slug = ? AND use_yn = 'Y'", Long.class, slug);
    }

    private long insertProduct(String code, String name, String status, long categorySeq,
                               String displayYn, String useYn, int basePrice) {
        jdbcTemplate.update(
                "INSERT INTO mst_product (product_code, product_name, product_status, category_seq, "
                        + "base_price, display_yn, use_yn, i_user) VALUES (?, ?, ?, ?, ?, ?, ?, 'TEST')",
                code, name, status, categorySeq, basePrice, displayYn, useYn);
        return jdbcTemplate.queryForObject(
                "SELECT product_seq FROM mst_product WHERE product_code = ?", Long.class, code);
    }

    private void insertOption(long productSeq, String name, int price, int stock) {
        jdbcTemplate.update(
                "INSERT INTO mst_product_option (product_seq, option_name, final_price, stock_qty, "
                        + "sort_order, use_yn, i_user) VALUES (?, ?, ?, ?, 0, 'Y', 'TEST')",
                productSeq, name, price, stock);
    }

    private void insertImage(long productSeq, String type, String url) {
        jdbcTemplate.update(
                "INSERT INTO mst_product_image (product_seq, image_type, image_url, sort_order, use_yn, i_user) "
                        + "VALUES (?, ?, ?, 0, 'Y', 'TEST')",
                productSeq, type, url);
    }

    private long insertLabel(String name) {
        jdbcTemplate.update(
                "INSERT INTO mst_product_label (label_name, sort_order, use_yn, i_user) VALUES (?, 0, 'Y', 'TEST')",
                name);
        return jdbcTemplate.queryForObject(
                "SELECT label_seq FROM mst_product_label WHERE label_name = ?", Long.class, name);
    }

    private void insertMap(long productSeq, long labelSeq) {
        jdbcTemplate.update(
                "INSERT INTO map_product_label (product_seq, label_seq, i_user) VALUES (?, ?, 'TEST')",
                productSeq, labelSeq);
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
