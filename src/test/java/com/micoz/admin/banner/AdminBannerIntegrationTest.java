package com.micoz.admin.banner;

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
 * S-T1 배너 CRUD E2E. 자동커밋 태스크의 3대 커밋전 검증 포인트를 포함한다:
 * <ol>
 *   <li>BannerSpecs 규약 — null-safe 정적 팩토리(blank 무시) + LIKE 이스케이프 + 정렬 화이트리스트(미허용 400)</li>
 *   <li>사용자 경로 교차검증 — display_yn='N'/소프트삭제한 HERO 배너가 GET /api/v1/banners에서 사라짐</li>
 *   <li>목록 N+1 없음 — 배너 수가 늘어도 statement 수 상수(평면 조회)</li>
 * </ol>
 * 픽스처는 title 'ST-%', admin user_id 'stbn%' 접두사로 생성 후 정리. 비밀번호는 테스트 픽스처(실제 시크릿 아님).
 */
class AdminBannerIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "Settings#Test1234";

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
        adminId = "stbn" + sfx;
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, "
                        + "point_balance, user_status, use_yn, i_user) "
                        + "VALUES (?, ?, '설정관리자', 'ADMIN', 0, 'ACTIVE', 'Y', 'TEST')",
                adminId, passwordEncoder.encode(ADMIN_PW));
        adminToken = adminLogin(adminId, ADMIN_PW);
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM mst_banner WHERE title   LIKE 'ST-%'");
        jdbcTemplate.update("DELETE FROM mst_user   WHERE user_id LIKE 'stbn%'");
    }

    // ─────────────────────────────────────────────────────────────
    // 생성 → 목록 → 상세
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("생성 → 목록 등장 → 상세 전체 필드 반환")
    void createListDetail() {
        String title = "ST-hero-" + sfx;
        long seq = createBanner("HERO", title, "http://cdn/x.png");

        JsonNode listed = findInList(false, title);
        assertThat(listed).isNotNull();
        assertThat(listed.path("bannerType").asText()).isEqualTo("HERO");
        assertThat(listed.path("displayYn").asText()).isEqualTo("Y");
        assertThat(listed.path("useYn").asText()).isEqualTo("Y");

        JsonNode detail = parse(getJson("/api/v1/admin/banners/" + seq, adminToken).getBody()).path("data");
        assertThat(detail.path("title").asText()).isEqualTo(title);
        assertThat(detail.path("imageUrl").asText()).isEqualTo("http://cdn/x.png");
    }

    @Test
    @DisplayName("수정(PUT) → 제목·이미지·정렬·노출 반영")
    void updateFields() {
        long seq = createBanner("HERO", "ST-upd-" + sfx, "http://cdn/old.png");

        Map<String, Object> body = new HashMap<>();
        body.put("title", "ST-updnew-" + sfx);
        body.put("imageUrl", "http://cdn/new.png");
        body.put("bannerType", "PROMO");
        body.put("sortOrder", 42);
        body.put("displayYn", "N");
        ResponseEntity<String> resp = putJson("/api/v1/admin/banners/" + seq, adminToken, body);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);

        Map<String, Object> row = jdbcTemplate.queryForMap(
                "SELECT title, image_url, banner_type, sort_order, display_yn FROM mst_banner WHERE banner_seq = ?", seq);
        assertThat(row.get("title")).isEqualTo("ST-updnew-" + sfx);
        assertThat(row.get("image_url")).isEqualTo("http://cdn/new.png");
        assertThat(row.get("banner_type").toString().trim()).isEqualTo("PROMO");
        assertThat(((Number) row.get("sort_order")).intValue()).isEqualTo(42);
        assertThat(row.get("display_yn").toString().trim()).isEqualTo("N");
    }

    @Test
    @DisplayName("노출 토글(PATCH /display) → display_yn만 변경")
    void toggleDisplay() {
        long seq = createBanner("HERO", "ST-tog-" + sfx, "http://cdn/x.png");

        assertThat(patchJson("/api/v1/admin/banners/" + seq + "/display", adminToken, Map.of("displayYn", "N"))
                .getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(displayYnOf(seq)).isEqualTo("N");

        assertThat(patchJson("/api/v1/admin/banners/" + seq + "/display", adminToken, Map.of("displayYn", "Y"))
                .getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(displayYnOf(seq)).isEqualTo("Y");
        // 여전히 활성
        assertThat(useYnOf(seq)).isEqualTo("Y");
    }

    @Test
    @DisplayName("잘못된 displayYn 값 → 400")
    void toggleDisplayInvalid() {
        long seq = createBanner("HERO", "ST-toginv-" + sfx, "http://cdn/x.png");
        ResponseEntity<String> resp = patchJson(
                "/api/v1/admin/banners/" + seq + "/display", adminToken, Map.of("displayYn", "X"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    // ─────────────────────────────────────────────────────────────
    // 소프트삭제 + includeDeleted
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("소프트삭제 → use_yn='N' AND display_yn='N', 기본 목록 소거 / includeDeleted=true 노출")
    void softDeleteAndIncludeDeleted() {
        String title = "ST-del-" + sfx;
        long seq = createBanner("HERO", title, "http://cdn/x.png");

        assertThat(deleteJson("/api/v1/admin/banners/" + seq, adminToken).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        Map<String, Object> row = jdbcTemplate.queryForMap(
                "SELECT use_yn, display_yn FROM mst_banner WHERE banner_seq = ?", seq);
        assertThat(row.get("use_yn").toString().trim()).isEqualTo("N");
        assertThat(row.get("display_yn").toString().trim()).isEqualTo("N");

        assertThat(findInList(false, title)).as("기본 목록에서 소거").isNull();
        JsonNode shown = findInList(true, title);
        assertThat(shown).as("includeDeleted=true 노출").isNotNull();
        assertThat(shown.path("useYn").asText()).isEqualTo("N");
    }

    // ─────────────────────────────────────────────────────────────
    // [검증1] BannerSpecs 규약
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("[Specs] blank 조건 무시 + bannerType/displayYn eq 필터")
    void specsFilters() {
        createBanner("HERO", "ST-f-hero-" + sfx, "http://cdn/a.png");
        long promoSeq = createBanner("PROMO", "ST-f-promo-" + sfx, "http://cdn/b.png");
        // promo만 노출 off
        patchJson("/api/v1/admin/banners/" + promoSeq + "/display", adminToken, Map.of("displayYn", "N"));

        // bannerType=PROMO 필터 → promo만
        JsonNode byType = listData("?bannerType=PROMO");
        assertThat(hasTitle(byType, "ST-f-promo-" + sfx)).isTrue();
        assertThat(hasTitle(byType, "ST-f-hero-" + sfx)).isFalse();

        // displayYn=N 필터 → promo(노출off)만
        JsonNode byDisplay = listData("?displayYn=N&q=ST-f-");
        assertThat(hasTitle(byDisplay, "ST-f-promo-" + sfx)).isTrue();
        assertThat(hasTitle(byDisplay, "ST-f-hero-" + sfx)).isFalse();
    }

    @Test
    @DisplayName("[Specs] LIKE 메타문자 이스케이프 — '_'는 와일드카드가 아닌 리터럴로 매칭")
    void specsLikeEscape() {
        // '_'는 LIKE 단일문자 와일드카드이자 URL-safe 문자 → RestTemplate URI 템플릿 훼손 없이 이스케이프 검증 가능.
        // ('%'는 RestTemplate가 URI 템플릿으로 재해석해 테스트 하네스 레벨에서 훼손되므로 부적합)
        createBanner("HERO", "ST-a_b-" + sfx, "http://cdn/a.png");
        createBanner("HERO", "ST-aXb-" + sfx, "http://cdn/b.png");

        // q="a_b" — '_'가 이스케이프되어 리터럴 매칭이면 '_'-변형만 잡힘(X-변형 제외)
        JsonNode data = listData("?q=a_b");
        assertThat(hasTitle(data, "ST-a_b-" + sfx)).as("리터럴 a_b 매칭").isTrue();
        assertThat(hasTitle(data, "ST-aXb-" + sfx)).as("'_'가 와일드카드로 오작동하면 안 됨").isFalse();
    }

    @Test
    @DisplayName("[Specs] 미허용 정렬키 → 400 COMMON_INVALID_REQUEST")
    void specsSortWhitelist() {
        createBanner("HERO", "ST-sort-" + sfx, "http://cdn/a.png");
        ResponseEntity<String> resp = getJson("/api/v1/admin/banners?sort=title,asc", adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_INVALID_REQUEST");
    }

    // ─────────────────────────────────────────────────────────────
    // [검증2] 사용자 경로 교차검증
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("[사용자경로] display_yn='N' → GET /api/v1/banners에서 사라짐, Y로 되돌리면 재등장")
    void userPathDisplayToggle() {
        String title = "ST-user-" + sfx;
        long seq = createBanner("HERO", title, "http://cdn/x.png");
        assertThat(userBannerHasTitle(title)).as("노출 상태 → 사용자 목록 등장").isTrue();

        patchJson("/api/v1/admin/banners/" + seq + "/display", adminToken, Map.of("displayYn", "N"));
        assertThat(userBannerHasTitle(title)).as("노출 off → 사용자 목록 소거").isFalse();

        patchJson("/api/v1/admin/banners/" + seq + "/display", adminToken, Map.of("displayYn", "Y"));
        assertThat(userBannerHasTitle(title)).as("노출 on → 재등장").isTrue();
    }

    @Test
    @DisplayName("[사용자경로] 소프트삭제 → GET /api/v1/banners에서 사라짐")
    void userPathSoftDelete() {
        String title = "ST-userdel-" + sfx;
        long seq = createBanner("HERO", title, "http://cdn/x.png");
        assertThat(userBannerHasTitle(title)).isTrue();

        deleteJson("/api/v1/admin/banners/" + seq, adminToken);
        assertThat(userBannerHasTitle(title)).as("소프트삭제 → 사용자 목록 소거").isFalse();
    }

    // ─────────────────────────────────────────────────────────────
    // [검증3] 목록 N+1 없음
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("[N+1] 배너 수가 늘어도 목록 statement 수 상수(평면 조회)")
    void listNoNPlusOne() {
        getJson("/api/v1/admin/banners?q=ST-np-", adminToken); // 워밍업

        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);

        // 두 측정 모두 '가득 찬 첫 페이지'가 되도록 21건 이상 시드한다.
        // (Spring Data는 첫 페이지가 덜 차면 count 쿼리를 생략(PageableExecutionUtils)하므로,
        //  부분 페이지끼리 비교하면 count 유무로 statement 수가 달라져 N+1과 무관하게 어긋난다)
        for (int i = 0; i < 21; i++) {
            insertBanner("ST-np-a-" + i + "-" + sfx);
        }
        stats.clear();
        listData("?q=ST-np-");
        long small = stats.getPrepareStatementCount();

        for (int i = 0; i < 21; i++) {
            insertBanner("ST-np-b-" + i + "-" + sfx);
        }
        stats.clear();
        listData("?q=ST-np-");
        long large = stats.getPrepareStatementCount();

        assertThat(large)
                .as("배너 수가 21→42로 늘어도 목록 statement는 상수여야 함(N+1 금지)")
                .isEqualTo(small);
        assertThat(small)
                .as("content + count(+ 인증 부수) 정도의 상수")
                .isLessThanOrEqualTo(6);
    }

    // ─────────────────────────────────────────────────────────────
    // 404
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("미존재 대상 상세/수정/토글/삭제 → 404 BANNER_NOT_FOUND")
    void notFound() {
        assertThat(parse(getJson("/api/v1/admin/banners/99999999", adminToken).getBody())
                .path("code").asText()).isEqualTo("BANNER_NOT_FOUND");

        Map<String, Object> upd = new HashMap<>();
        upd.put("title", "x");
        upd.put("imageUrl", "http://cdn/x.png");
        assertThat(putJson("/api/v1/admin/banners/99999999", adminToken, upd).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        assertThat(patchJson("/api/v1/admin/banners/99999999/display", adminToken, Map.of("displayYn", "N"))
                .getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        assertThat(deleteJson("/api/v1/admin/banners/99999999", adminToken).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ─────────────────────────────────────────────────────────────
    // helpers
    // ─────────────────────────────────────────────────────────────
    private long createBanner(String type, String title, String imageUrl) {
        Map<String, Object> body = new HashMap<>();
        body.put("bannerType", type);
        body.put("title", title);
        body.put("imageUrl", imageUrl);
        ResponseEntity<String> resp = postJson("/api/v1/admin/banners", adminToken, body);
        assertThat(resp.getStatusCode()).as("생성 성공 기대: %s", resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data").path("bannerSeq").asLong();
    }

    private JsonNode listData(String queryString) {
        ResponseEntity<String> resp = getJson("/api/v1/admin/banners" + queryString, adminToken);
        assertThat(resp.getStatusCode()).as("목록 성공: %s", resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data").path("content");
    }

    private JsonNode findInList(boolean includeDeleted, String title) {
        JsonNode content = listData("?includeDeleted=" + includeDeleted + "&q=" + enc(title));
        for (JsonNode n : content) {
            if (title.equals(n.path("title").asText())) {
                return n;
            }
        }
        return null;
    }

    private boolean hasTitle(JsonNode content, String title) {
        for (JsonNode n : content) {
            if (title.equals(n.path("title").asText())) {
                return true;
            }
        }
        return false;
    }

    private boolean userBannerHasTitle(String title) {
        ResponseEntity<String> resp = rest.getForEntity(baseUrl() + "/api/v1/banners", String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        for (JsonNode n : parse(resp.getBody()).path("data")) {
            if (title.equals(n.path("title").asText())) {
                return true;
            }
        }
        return false;
    }

    private void insertBanner(String title) {
        jdbcTemplate.update(
                "INSERT INTO mst_banner (banner_type, title, image_url, sort_order, display_yn, use_yn, i_user) "
                        + "VALUES ('HERO', ?, 'http://cdn/x.png', 0, 'Y', 'Y', 'TEST')",
                title);
    }

    private String displayYnOf(long bannerSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT display_yn FROM mst_banner WHERE banner_seq = ?", String.class, bannerSeq).trim();
    }

    private String useYnOf(long bannerSeq) {
        return jdbcTemplate.queryForObject(
                "SELECT use_yn FROM mst_banner WHERE banner_seq = ?", String.class, bannerSeq).trim();
    }

    // 로컬 PUT 헬퍼 — 기반 클래스는 PATCH/POST/GET/DELETE만 제공(C-T3 상품 테스트와 동일 패턴).
    private ResponseEntity<String> putJson(String path, String token, Object body) {
        return rest.exchange(baseUrl() + path, org.springframework.http.HttpMethod.PUT,
                new org.springframework.http.HttpEntity<>(body, authHeaders(token)), String.class);
    }

    private String adminLogin(String userId, String pw) {
        ResponseEntity<String> resp = rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", userId, "userPw", pw), String.class);
        return parse(resp.getBody()).path("data").path("accessToken").asText();
    }

    private String enc(String v) {
        return java.net.URLEncoder.encode(v, java.nio.charset.StandardCharsets.UTF_8);
    }

    private String suffix() {
        String unique = String.valueOf(System.nanoTime());
        return unique.substring(unique.length() - 8);
    }
}
