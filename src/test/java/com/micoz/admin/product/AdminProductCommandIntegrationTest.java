package com.micoz.admin.product;

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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * C-T3 상품 등록·수정(옵션·이미지·라벨 일괄) E2E. 핵심: 단일 트랜잭션 원자성(자식 실패 시 전체 롤백),
 * 옵션 seq upsert, 라벨 차집합 교체. 픽스처는 product_code 'CT-%', url_slug 'ct-%', user_id 'ct%' 접두사.
 */
class AdminProductCommandIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "Catalog#Test1234";
    private static final String PRODUCTS = "/api/v1/admin/products";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String sfx;
    private long catA;
    private long catB;
    private long labelA;
    private long labelB;
    private long labelC;

    @BeforeEach
    void seed() {
        sfx = suffix();
        String adminId = "ctadmin" + sfx;
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, "
                        + "point_balance, user_status, use_yn, i_user) "
                        + "VALUES (?, ?, '카탈로그관리자', 'ADMIN', 0, 'ACTIVE', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);

        catA = insertCategory("스킨케어A", "ct-cata-" + sfx);
        catB = insertCategory("메이크업B", "ct-catb-" + sfx);
        labelA = insertLabel("CT-LA-" + sfx);
        labelB = insertLabel("CT-LB-" + sfx);
        labelC = insertLabel("CT-LC-" + sfx);
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

    // ─────────────────────────── 등록 ───────────────────────────
    @Test
    @DisplayName("등록 → 상품 + 옵션2 + 이미지2 + 라벨2 모두 생성")
    void createFull() {
        Map<String, Object> body = baseCreate("CT-NEW-" + sfx, "신규상품", 30000);
        body.put("categorySeq", catA);
        body.put("options", List.of(option(null, "50ml", 30000, 10, 1), option(null, "100ml", 50000, 5, 2)));
        body.put("images", List.of(image(null, "MAIN", "https://cdn.example/main.jpg", "대표", 1),
                image(null, "SUB", "https://cdn.example/sub.jpg", "서브", 2)));
        body.put("labelSeqs", List.of(labelA, labelB));

        ResponseEntity<String> resp = postJson(PRODUCTS, adminToken, body);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        long productSeq = parse(resp.getBody()).path("data").path("productSeq").asLong();

        JsonNode detail = detail(productSeq);
        assertThat(detail.path("categoryName").asText()).isEqualTo("스킨케어A");
        assertThat(detail.path("options").size()).isEqualTo(2);
        assertThat(detail.path("images").size()).isEqualTo(2);
        assertThat(detail.path("labels").size()).isEqualTo(2);
    }

    @Test
    @DisplayName("옵션·이미지·라벨 0개 등록 → 200 (옵션 없는 단일상품 허용, C-Q4)")
    void createZeroChildren() {
        Map<String, Object> body = baseCreate("CT-BARE-" + sfx, "무옵션상품", 10000);
        ResponseEntity<String> resp = postJson(PRODUCTS, adminToken, body);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        long productSeq = parse(resp.getBody()).path("data").path("productSeq").asLong();
        JsonNode detail = detail(productSeq);
        assertThat(detail.path("options").size()).isZero();
        assertThat(detail.path("images").size()).isZero();
        assertThat(detail.path("labels").size()).isZero();
    }

    @Test
    @DisplayName("상품 코드 중복 → 409 PRODUCT_DUPLICATED_CODE")
    void createDuplicateCode() {
        String code = "CT-DUP-" + sfx;
        assertThat(postJson(PRODUCTS, adminToken, baseCreate(code, "원본", 1000)).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        ResponseEntity<String> resp = postJson(PRODUCTS, adminToken, baseCreate(code, "중복", 2000));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("PRODUCT_DUPLICATED_CODE");
    }

    @Test
    @DisplayName("미존재 카테고리 → 404 CATEGORY_NOT_FOUND")
    void createUnknownCategory() {
        Map<String, Object> body = baseCreate("CT-NOCAT-" + sfx, "상품", 1000);
        body.put("categorySeq", 99999999L);
        ResponseEntity<String> resp = postJson(PRODUCTS, adminToken, body);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("CATEGORY_NOT_FOUND");
    }

    @Test
    @DisplayName("미존재 라벨 → 404 LABEL_NOT_FOUND")
    void createUnknownLabel() {
        Map<String, Object> body = baseCreate("CT-NOLBL-" + sfx, "상품", 1000);
        body.put("labelSeqs", List.of(labelA, 99999999L));
        ResponseEntity<String> resp = postJson(PRODUCTS, adminToken, body);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("LABEL_NOT_FOUND");
    }

    @Test
    @DisplayName("자식 insert 중 실패(이미지 URL 초과) → 전체 롤백(상품·옵션·이미지·매핑 0건)")
    void createAtomicRollback() {
        String code = "CT-ATOMIC-" + sfx;
        // 상품·옵션 저장 이후 이미지 insert가 DB 컬럼 한도(VARCHAR 500) 초과로 실패 → 단일 트랜잭션 롤백.
        String tooLongUrl = "https://cdn.example/" + "x".repeat(600);
        Map<String, Object> body = baseCreate(code, "원자성상품", 1000);
        body.put("categorySeq", catA);
        body.put("options", List.of(option(null, "opt", 1000, 3, 1)));
        body.put("images", List.of(image(null, "MAIN", tooLongUrl, "대표", 1)));
        body.put("labelSeqs", List.of(labelA));

        ResponseEntity<String> resp = postJson(PRODUCTS, adminToken, body);
        assertThat(resp.getStatusCode().is2xxSuccessful())
                .as("자식 실패 시 성공 응답이면 안 됨").isFalse();

        // 롤백 확인: 상품·옵션·이미지·라벨매핑 모두 0건
        assertThat(countProductByCode(code)).as("상품 롤백").isZero();
        Long orphanOptions = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM mst_product_option o JOIN mst_product p ON o.product_seq=p.product_seq "
                        + "WHERE p.product_code = ?", Long.class, code);
        assertThat(orphanOptions).as("옵션 롤백").isZero();
    }

    // ─────────────────────────── 수정 ───────────────────────────
    @Test
    @DisplayName("수정 → 본문(이름·상태·가격·카테고리·노출) 반영")
    void updateBody() {
        long seq = createProduct("CT-UPD-" + sfx, "수정전", 1000, catA);

        Map<String, Object> body = baseUpdate("CT-UPD-" + sfx, "수정후", 2500);
        body.put("productStatus", "STOPPED");
        body.put("categorySeq", catB);
        body.put("displayYn", "N");
        ResponseEntity<String> resp = putJson(PRODUCTS + "/" + seq, adminToken, body);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);

        Map<String, Object> row = jdbcTemplate.queryForMap(
                "SELECT product_name, product_status, base_price, category_seq, display_yn "
                        + "FROM mst_product WHERE product_seq = ?", seq);
        assertThat(row.get("product_name")).isEqualTo("수정후");
        assertThat(row.get("product_status")).isEqualTo("STOPPED");
        assertThat(((Number) row.get("base_price")).intValue()).isEqualTo(2500);
        assertThat(((Number) row.get("category_seq")).longValue()).isEqualTo(catB);
        assertThat(row.get("display_yn").toString().trim()).isEqualTo("N");
    }

    @Test
    @DisplayName("옵션 upsert → 기존 수정 + 신규 추가 + 미포함 기존 소프트삭제")
    void updateOptionUpsert() {
        long seq = createProduct("CT-OPTUP-" + sfx, "옵션상품", 1000, catA);
        // 옵션 A, B 등록
        Map<String, Object> init = baseUpdate("CT-OPTUP-" + sfx, "옵션상품", 1000);
        init.put("options", List.of(option(null, "A", 1000, 5, 1), option(null, "B", 2000, 3, 2)));
        putJson(PRODUCTS + "/" + seq, adminToken, init);

        long optA = optionSeqByName(seq, "A");
        long optB = optionSeqByName(seq, "B");

        // A 수정, C 신규, B 미포함(→ 소프트삭제)
        Map<String, Object> upd = baseUpdate("CT-OPTUP-" + sfx, "옵션상품", 1000);
        upd.put("options", List.of(option(optA, "A-수정", 1500, 9, 1), option(null, "C", 3000, 1, 3)));
        ResponseEntity<String> resp = putJson(PRODUCTS + "/" + seq, adminToken, upd);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode detail = detail(seq);
        List<String> activeNames = new ArrayList<>();
        for (JsonNode o : detail.path("options")) activeNames.add(o.path("optionName").asText());
        assertThat(activeNames).containsExactlyInAnyOrder("A-수정", "C");

        // B는 소프트삭제(use_yn='N')
        assertThat(useYnOfOption(optB)).isEqualTo("N");
    }

    @Test
    @DisplayName("존재하지 않는 optionSeq 수정 → 404 PRODUCT_OPTION_NOT_FOUND")
    void updateInvalidOptionSeq() {
        long seq = createProduct("CT-BADOPT-" + sfx, "상품", 1000, catA);
        Map<String, Object> upd = baseUpdate("CT-BADOPT-" + sfx, "상품", 1000);
        upd.put("options", List.of(option(99999999L, "없는옵션", 1000, 1, 1)));
        ResponseEntity<String> resp = putJson(PRODUCTS + "/" + seq, adminToken, upd);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("PRODUCT_OPTION_NOT_FOUND");
    }

    @Test
    @DisplayName("존재하지 않는 imageSeq 수정 → 404 PRODUCT_IMAGE_NOT_FOUND (옵션과 대칭)")
    void updateInvalidImageSeq() {
        long seq = createProduct("CT-BADIMG-" + sfx, "상품", 1000, catA);
        Map<String, Object> upd = baseUpdate("CT-BADIMG-" + sfx, "상품", 1000);
        upd.put("images", List.of(image(99999999L, "MAIN", "https://cdn.example/x.jpg", "x", 1)));
        ResponseEntity<String> resp = putJson(PRODUCTS + "/" + seq, adminToken, upd);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("PRODUCT_IMAGE_NOT_FOUND");
    }

    @Test
    @DisplayName("라벨 차집합 교체 → 빠진 것만 삭제·새 것만 삽입·변경 없는 건 미변경(i_date 보존)")
    void updateLabelDiff() {
        long seq = createProduct("CT-LBLDIFF-" + sfx, "라벨상품", 1000, catA);
        // 라벨 {A,B} 부여
        Map<String, Object> init = baseUpdate("CT-LBLDIFF-" + sfx, "라벨상품", 1000);
        init.put("labelSeqs", List.of(labelA, labelB));
        putJson(PRODUCTS + "/" + seq, adminToken, init);

        String labelBIdateBefore = mapIdate(seq, labelB);
        assertThat(labelBIdateBefore).isNotNull();

        // {A,B} → {B,C}: A 삭제, C 삽입, B 미변경
        Map<String, Object> upd = baseUpdate("CT-LBLDIFF-" + sfx, "라벨상품", 1000);
        upd.put("labelSeqs", List.of(labelB, labelC));
        ResponseEntity<String> resp = putJson(PRODUCTS + "/" + seq, adminToken, upd);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);

        List<Long> mapped = jdbcTemplate.queryForList(
                "SELECT label_seq FROM map_product_label WHERE product_seq = ?", Long.class, seq);
        assertThat(mapped).containsExactlyInAnyOrder(labelB, labelC);
        assertThat(mapped).doesNotContain(labelA);
        // B는 재삽입 없이 유지 → i_date 불변
        assertThat(mapIdate(seq, labelB)).isEqualTo(labelBIdateBefore);
    }

    @Test
    @DisplayName("수정 시 코드 중복(타 상품) → 409 PRODUCT_DUPLICATED_CODE")
    void updateDuplicateCode() {
        createProduct("CT-EXIST-" + sfx, "기존", 1000, catA);
        long seq = createProduct("CT-ME-" + sfx, "나", 1000, catA);
        Map<String, Object> upd = baseUpdate("CT-EXIST-" + sfx, "나", 1000); // 남의 코드로 변경 시도
        ResponseEntity<String> resp = putJson(PRODUCTS + "/" + seq, adminToken, upd);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("PRODUCT_DUPLICATED_CODE");
    }

    @Test
    @DisplayName("미존재 상품 수정 → 404 PRODUCT_NOT_FOUND")
    void updateNotFound() {
        ResponseEntity<String> resp = putJson(PRODUCTS + "/99999999", adminToken,
                baseUpdate("CT-X-" + sfx, "x", 1000));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("PRODUCT_NOT_FOUND");
    }

    // ─────────────────────────── helpers ───────────────────────────
    private ResponseEntity<String> putJson(String path, String token, Object body) {
        return rest.exchange(baseUrl() + path, org.springframework.http.HttpMethod.PUT,
                new org.springframework.http.HttpEntity<>(body, authHeaders(token)), String.class);
    }

    private Map<String, Object> baseCreate(String code, String name, int basePrice) {
        Map<String, Object> m = new HashMap<>();
        m.put("productCode", code);
        m.put("productName", name);
        m.put("basePrice", basePrice);
        return m;
    }

    private Map<String, Object> baseUpdate(String code, String name, int basePrice) {
        return baseCreate(code, name, basePrice); // 동일 필수 필드 구조
    }

    private Map<String, Object> option(Long optionSeq, String name, int price, int stock, int sort) {
        Map<String, Object> m = new HashMap<>();
        if (optionSeq != null) m.put("optionSeq", optionSeq);
        m.put("optionName", name);
        m.put("finalPrice", price);
        m.put("stockQty", stock);
        m.put("sortOrder", sort);
        return m;
    }

    private Map<String, Object> image(Long imageSeq, String type, String url, String alt, int sort) {
        Map<String, Object> m = new HashMap<>();
        if (imageSeq != null) m.put("imageSeq", imageSeq);
        m.put("imageType", type);
        m.put("imageUrl", url);
        m.put("imageAlt", alt);
        m.put("sortOrder", sort);
        return m;
    }

    private long createProduct(String code, String name, int basePrice, long categorySeq) {
        Map<String, Object> body = baseCreate(code, name, basePrice);
        body.put("categorySeq", categorySeq);
        ResponseEntity<String> resp = postJson(PRODUCTS, adminToken, body);
        assertThat(resp.getStatusCode()).as("생성: %s", resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data").path("productSeq").asLong();
    }

    private JsonNode detail(long productSeq) {
        ResponseEntity<String> resp = getJson(PRODUCTS + "/" + productSeq, adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
    }

    private long optionSeqByName(long productSeq, String name) {
        for (JsonNode o : detail(productSeq).path("options")) {
            if (name.equals(o.path("optionName").asText())) return o.path("optionSeq").asLong();
        }
        throw new IllegalStateException("option not found: " + name);
    }

    private String useYnOfOption(long optionSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT use_yn FROM mst_product_option WHERE option_seq = ?", String.class, optionSeq).trim();
    }

    private String mapIdate(long productSeq, long labelSeq) {
        List<String> r = jdbcTemplate.queryForList(
                "SELECT i_date::text FROM map_product_label WHERE product_seq = ? AND label_seq = ?",
                String.class, productSeq, labelSeq);
        return r.isEmpty() ? null : r.get(0);
    }

    private long countProductByCode(String code) {
        return jdbcTemplate.queryForObject(
                "SELECT count(*) FROM mst_product WHERE product_code = ?", Long.class, code);
    }

    private long insertCategory(String name, String slug) {
        jdbcTemplate.update(
                "INSERT INTO mst_category (category_name, url_slug, category_level, sort_order, "
                        + "display_yn, use_yn, i_user) VALUES (?, ?, 1, 0, 'Y', 'Y', 'TEST')",
                name, slug);
        return jdbcTemplate.queryForObject(
                "SELECT category_seq FROM mst_category WHERE url_slug = ? AND use_yn = 'Y'", Long.class, slug);
    }

    private long insertLabel(String name) {
        jdbcTemplate.update(
                "INSERT INTO mst_product_label (label_name, sort_order, use_yn, i_user) VALUES (?, 0, 'Y', 'TEST')",
                name);
        return jdbcTemplate.queryForObject(
                "SELECT label_seq FROM mst_product_label WHERE label_name = ?", Long.class, name);
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
