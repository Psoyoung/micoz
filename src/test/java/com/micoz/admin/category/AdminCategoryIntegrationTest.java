package com.micoz.admin.category;

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
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * C-T1 카테고리 2단계 트리 CRUD E2E + 삭제 무결성 4대 검증.
 * 모든 픽스처는 user_id 'ct%', url_slug 'ct-%', product_code 'CT-%' 접두사로 생성 후 정리.
 * 비밀번호는 테스트 픽스처(실제 시크릿 아님).
 *
 * <p>완료기준 4대 포인트:
 * <ol>
 *   <li>자식 가드 2경로 — 활성 하위 카테고리 보유 / 활성 소속 상품 보유 둘 다 CATEGORY_HAS_CHILDREN</li>
 *   <li>2단계 강제 — level2 밑 생성(3단계) 시도 → CATEGORY_INVALID_PARENT</li>
 *   <li>트리 카운트 일괄집계 — 카테고리 수 늘려도 statement 수 상수(N+1 없음)</li>
 *   <li>리프 삭제 시 use_yn='N' + display_yn='N' 동시 세팅</li>
 * </ol>
 */
class AdminCategoryIntegrationTest extends IntegrationTestSupport {

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
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM mst_product  WHERE product_code LIKE 'CT-%'");
        jdbcTemplate.update("DELETE FROM mst_category WHERE url_slug    LIKE 'ct-%'");
        jdbcTemplate.update("DELETE FROM mst_user     WHERE user_id     LIKE 'ct%'");
    }

    // ─────────────────────────────────────────────────────────────
    // 생성 + 트리 구조/카운트
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("level1 생성 → level2 생성 → 트리가 중첩 구조 + childCategoryCount/productCount 반영")
    void createAndTree() {
        String rootSlug = "ct-skincare-" + sfx;
        String childSlug = "ct-toner-" + sfx;
        long rootSeq = createCategory(null, "스킨케어", rootSlug);
        long childSeq = createCategory(rootSeq, "토너", childSlug);
        // 자식 카테고리에 활성 상품 1건
        insertProduct(childSeq, "CT-P1-" + sfx);

        JsonNode tree = getTree(false);
        JsonNode root = findBySlug(tree, rootSlug);
        assertThat(root).isNotNull();
        assertThat(root.path("categoryLevel").asInt()).isEqualTo(1);
        // 루트는 parentSeq 없음 — NON_NULL 직렬화로 필드 자체가 생략됨(missing) 또는 null
        assertThat(root.path("parentSeq").isMissingNode() || root.path("parentSeq").isNull()).isTrue();
        assertThat(root.path("childCategoryCount").asInt()).isEqualTo(1);

        JsonNode child = root.path("children").get(0);
        assertThat(child.path("categorySeq").asLong()).isEqualTo(childSeq);
        assertThat(child.path("categoryLevel").asInt()).isEqualTo(2);
        assertThat(child.path("parentSeq").asLong()).isEqualTo(rootSeq);
        assertThat(child.path("productCount").asInt()).isEqualTo(1);
    }

    // ─────────────────────────────────────────────────────────────
    // [핵심2] 2단계 강제
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("level2 밑에 또 생성(3단계) 시도 → 400 CATEGORY_INVALID_PARENT")
    void createUnderLevel2Blocked() {
        long rootSeq = createCategory(null, "대분류", "ct-l1-" + sfx);
        long childSeq = createCategory(rootSeq, "중분류", "ct-l2-" + sfx);

        ResponseEntity<String> resp = postCategory(childSeq, "손자", "ct-l3-" + sfx);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("CATEGORY_INVALID_PARENT");
    }

    @Test
    @DisplayName("존재하지 않는 부모로 생성 → 404 CATEGORY_NOT_FOUND")
    void createUnknownParent() {
        ResponseEntity<String> resp = postCategory(99999999L, "고아", "ct-orphan-" + sfx);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("CATEGORY_NOT_FOUND");
    }

    @Test
    @DisplayName("슬러그 중복 생성 → 409 CATEGORY_DUPLICATED_SLUG")
    void createDuplicateSlug() {
        String slug = "ct-dup-" + sfx;
        createCategory(null, "원본", slug);
        ResponseEntity<String> resp = postCategory(null, "중복", slug);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("CATEGORY_DUPLICATED_SLUG");
    }

    // ─────────────────────────────────────────────────────────────
    // 수정
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("수정 → 이름·슬러그·정렬·노출 반영")
    void updateFields() {
        String slug = "ct-upd-" + sfx;
        String newSlug = "ct-updnew-" + sfx;
        long seq = createCategory(null, "수정전", slug);

        Map<String, Object> body = new HashMap<>();
        body.put("categoryName", "수정후");
        body.put("urlSlug", newSlug);
        body.put("sortOrder", 99);
        body.put("displayYn", "N");
        ResponseEntity<String> resp = patchJson("/api/v1/admin/categories/" + seq, adminToken, body);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);

        Map<String, Object> row = jdbcTemplate.queryForMap(
                "SELECT category_name, url_slug, sort_order, display_yn FROM mst_category WHERE category_seq = ?", seq);
        assertThat(row.get("category_name")).isEqualTo("수정후");
        assertThat(row.get("url_slug")).isEqualTo(newSlug);
        assertThat(((Number) row.get("sort_order")).intValue()).isEqualTo(99);
        assertThat(row.get("display_yn").toString().trim()).isEqualTo("N");
    }

    @Test
    @DisplayName("수정 시 슬러그 중복(타 카테고리) → 409 CATEGORY_DUPLICATED_SLUG")
    void updateDuplicateSlug() {
        String slugA = "ct-a-" + sfx;
        String slugB = "ct-b-" + sfx;
        createCategory(null, "A", slugA);
        long seqB = createCategory(null, "B", slugB);

        Map<String, Object> body = new HashMap<>();
        body.put("urlSlug", slugA);
        ResponseEntity<String> resp = patchJson("/api/v1/admin/categories/" + seqB, adminToken, body);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("CATEGORY_DUPLICATED_SLUG");
    }

    @Test
    @DisplayName("미존재 카테고리 수정 → 404 CATEGORY_NOT_FOUND")
    void updateNotFound() {
        Map<String, Object> body = new HashMap<>();
        body.put("categoryName", "x");
        ResponseEntity<String> resp = patchJson("/api/v1/admin/categories/99999999", adminToken, body);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("CATEGORY_NOT_FOUND");
    }

    // ─────────────────────────────────────────────────────────────
    // [핵심1] 자식 가드 2경로
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("활성 하위 카테고리 보유 → 삭제 차단 409 CATEGORY_HAS_CHILDREN")
    void deleteBlockedByChildCategory() {
        long rootSeq = createCategory(null, "부모", "ct-par-" + sfx);
        createCategory(rootSeq, "자식", "ct-chi-" + sfx);

        ResponseEntity<String> resp = deleteJson("/api/v1/admin/categories/" + rootSeq, adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("CATEGORY_HAS_CHILDREN");
        // 차단되었으므로 여전히 활성
        assertThat(useYnOf(rootSeq)).isEqualTo("Y");
    }

    @Test
    @DisplayName("활성 소속 상품 보유 → 삭제 차단 409 CATEGORY_HAS_CHILDREN")
    void deleteBlockedByChildProduct() {
        long seq = createCategory(null, "상품보유", "ct-hasprod-" + sfx);
        insertProduct(seq, "CT-HP-" + sfx);

        ResponseEntity<String> resp = deleteJson("/api/v1/admin/categories/" + seq, adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("CATEGORY_HAS_CHILDREN");
        assertThat(useYnOf(seq)).isEqualTo("Y");
    }

    @Test
    @DisplayName("소프트삭제된 자식만 있으면 → 삭제 허용(활성 자식만 차단)")
    void deleteAllowedWhenChildrenSoftDeleted() {
        long rootSeq = createCategory(null, "부모2", "ct-par2-" + sfx);
        long childSeq = createCategory(rootSeq, "자식2", "ct-chi2-" + sfx);
        // 자식을 먼저 소프트삭제 → 부모는 활성 자식 없음
        assertThat(deleteJson("/api/v1/admin/categories/" + childSeq, adminToken).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        ResponseEntity<String> resp = deleteJson("/api/v1/admin/categories/" + rootSeq, adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(useYnOf(rootSeq)).isEqualTo("N");
    }

    // ─────────────────────────────────────────────────────────────
    // [핵심4] 리프 삭제 → use_yn='N' + display_yn='N'
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("자식 없는 카테고리 삭제 → 200 + use_yn='N' AND display_yn='N'")
    void deleteLeafSoftDeletes() {
        long seq = createCategory(null, "리프", "ct-leaf-" + sfx);

        ResponseEntity<String> resp = deleteJson("/api/v1/admin/categories/" + seq, adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);

        Map<String, Object> row = jdbcTemplate.queryForMap(
                "SELECT use_yn, display_yn FROM mst_category WHERE category_seq = ?", seq);
        assertThat(row.get("use_yn").toString().trim()).isEqualTo("N");
        assertThat(row.get("display_yn").toString().trim()).isEqualTo("N");
    }

    @Test
    @DisplayName("미존재 카테고리 삭제 → 404 CATEGORY_NOT_FOUND")
    void deleteNotFound() {
        ResponseEntity<String> resp = deleteJson("/api/v1/admin/categories/99999999", adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("CATEGORY_NOT_FOUND");
    }

    @Test
    @DisplayName("includeDeleted=false(기본) → 삭제 카테고리 미노출 / true → 노출(useYn='N')")
    void includeDeletedToggle() {
        String slug = "ct-del-" + sfx;
        long seq = createCategory(null, "삭제대상", slug);
        deleteJson("/api/v1/admin/categories/" + seq, adminToken);

        assertThat(findBySlug(getTree(false), slug)).isNull();
        JsonNode shown = findBySlug(getTree(true), slug);
        assertThat(shown).isNotNull();
        assertThat(shown.path("useYn").asText()).isEqualTo("N");
    }

    // ─────────────────────────────────────────────────────────────
    // [핵심3] 트리 카운트 일괄집계 — N+1 없음
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("childCategoryCount/productCount 일괄집계 — 카테고리 수 늘려도 statement 수 상수(N+1 없음)")
    void treeCountsBatchedNoNPlusOne() {
        // 워밍업(최초 호출 1회성 초기화 제외)
        getTree(false);

        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);

        // 소규모: 루트1 + 자식1 + 상품1
        long r1 = insertCategory(null, "소규모루트", "ct-small-" + sfx, 1);
        long c1 = insertCategory(r1, "소규모자식", "ct-smallc-" + sfx, 2);
        insertProduct(c1, "CT-SM-" + sfx);

        stats.clear();
        getTree(false);
        long small = stats.getPrepareStatementCount();

        // 대규모: 루트10 + 각 자식2 + 일부 상품
        for (int i = 0; i < 10; i++) {
            long r = insertCategory(null, "대규모루트" + i, "ct-big-" + i + "-" + sfx, 1);
            for (int j = 0; j < 2; j++) {
                long c = insertCategory(r, "대규모자식" + i + "-" + j, "ct-bigc-" + i + "-" + j + "-" + sfx, 2);
                insertProduct(c, "CT-BG-" + i + "-" + j + "-" + sfx);
            }
        }

        stats.clear();
        getTree(false);
        long large = stats.getPrepareStatementCount();

        assertThat(large)
                .as("카테고리/상품 수가 늘어도 트리 조회 statement는 상수여야 함(N+1 금지)")
                .isEqualTo(small);
        assertThat(small)
                .as("트리 1회 로드 + 상품수 1회 집계(인증 부수 포함 여유)")
                .isLessThanOrEqualTo(4);
    }

    // ─────────────────────────────────────────────────────────────
    // 회귀: 기존 사용자 측 카테고리 트리
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("회귀: 사용자 측 /api/v1/categories 노출 트리 정상")
    void customerCategoryTreeRegression() {
        ResponseEntity<String> resp = rest.getForEntity(baseUrl() + "/api/v1/categories", String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("SUCCESS");
    }

    // ─────────────────────────────────────────────────────────────
    // helpers
    // ─────────────────────────────────────────────────────────────
    private long createCategory(Long parentSeq, String name, String slug) {
        ResponseEntity<String> resp = postCategory(parentSeq, name, slug);
        assertThat(resp.getStatusCode()).as("생성 성공 기대: %s", resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data").path("categorySeq").asLong();
    }

    private ResponseEntity<String> postCategory(Long parentSeq, String name, String slug) {
        Map<String, Object> body = new HashMap<>();
        body.put("parentSeq", parentSeq); // null 허용 위해 HashMap 사용
        body.put("categoryName", name);
        body.put("urlSlug", slug);
        return postJson("/api/v1/admin/categories", adminToken, body);
    }

    private JsonNode getTree(boolean includeDeleted) {
        ResponseEntity<String> resp = getJson(
                "/api/v1/admin/categories?includeDeleted=" + includeDeleted, adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
    }

    /** 트리(루트 배열)에서 urlSlug로 노드 재귀 탐색. */
    private JsonNode findBySlug(JsonNode nodes, String slug) {
        if (nodes == null || !nodes.isArray()) return null;
        for (JsonNode n : nodes) {
            if (slug.equals(n.path("urlSlug").asText())) return n;
            JsonNode found = findBySlug(n.path("children"), slug);
            if (found != null) return found;
        }
        return null;
    }

    private long insertCategory(Long parentSeq, String name, String slug, int level) {
        jdbcTemplate.update(
                "INSERT INTO mst_category (parent_seq, category_name, url_slug, category_level, "
                        + "sort_order, display_yn, use_yn, i_user) "
                        + "VALUES (?, ?, ?, ?, 0, 'Y', 'Y', 'TEST')",
                parentSeq, name, slug, level);
        return jdbcTemplate.queryForObject(
                "SELECT category_seq FROM mst_category WHERE url_slug = ? AND use_yn = 'Y'", Long.class, slug);
    }

    private void insertProduct(long categorySeq, String code) {
        jdbcTemplate.update(
                "INSERT INTO mst_product (product_code, product_name, product_status, category_seq, "
                        + "base_price, display_yn, use_yn, i_user) "
                        + "VALUES (?, ?, 'ON_SALE', ?, 1000, 'Y', 'Y', 'TEST')",
                code, code, categorySeq);
    }

    private String useYnOf(long categorySeq) {
        return jdbcTemplate.queryForObject(
                "SELECT use_yn FROM mst_category WHERE category_seq = ?", String.class, categorySeq).trim();
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
