package com.micoz.admin.member;

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

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * M-T1 회원 목록·다축 검색 E2E + 검색 패턴 표준 4대 검증.
 * 모든 픽스처는 'mt' 접두사로 생성 후 정리. 비밀번호는 테스트 픽스처(실제 시크릿 아님).
 *
 * <p>완료기준 4대 포인트:
 * <ol>
 *   <li>UserSpecs null-safe — 조건 없이도 정상 검색(noFilter)</li>
 *   <li>정렬 화이트리스트 — 허용 컬럼 200 / 임의 컬럼 400(sortWhitelist)</li>
 *   <li>gradeCode 등급 매핑 N+1 없음 — 쿼리 수가 결과 행 수와 무관하게 상수(noNPlusOne)</li>
 *   <li>roleEq("CUSTOMER") 고정 — ADMIN 행 결과 미포함(adminExcluded)</li>
 * </ol>
 */
class AdminMemberSearchIntegrationTest extends IntegrationTestSupport {

    private static final String ADMIN_PW = "MemberMgmt#Test1234";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private String adminId;
    private String adminToken;

    @BeforeEach
    void seed() {
        adminId = "mtadmin" + suffix();

        // 운영 관리자(목록 대상 아님 — 배제 검증용)
        insertUser(adminId, "관리자", "ADMIN", null, "ACTIVE", "Y",
                OffsetDateTime.of(2026, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC), 0);

        // 회원 4명: 등급/상태/가입일/소프트삭제 다양화
        insertUser("mtestm1", "김회원", "CUSTOMER", gradeSeq("MEMBER"), "ACTIVE", "Y",
                OffsetDateTime.of(2026, 1, 15, 0, 0, 0, 0, ZoneOffset.UTC), 100);
        insertUser("mtestm2", "이셀러", "CUSTOMER", gradeSeq("SELLER"), "SUSPENDED", "Y",
                OffsetDateTime.of(2026, 3, 20, 0, 0, 0, 0, ZoneOffset.UTC), 200);
        insertUser("mtestm3", "박전무", "CUSTOMER", gradeSeq("EXECUTIVE"), "ACTIVE", "Y",
                OffsetDateTime.of(2020, 5, 1, 0, 0, 0, 0, ZoneOffset.UTC), 0);
        insertUser("mtestm4", "최탈퇴", "CUSTOMER", gradeSeq("MEMBER"), "ACTIVE", "N",
                OffsetDateTime.of(2026, 2, 10, 0, 0, 0, 0, ZoneOffset.UTC), 0);

        adminToken = adminLogin(adminId, ADMIN_PW);
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'mt%'");
    }

    // ─────────────────────────────────────────────────────────────
    // 1. null-safe: 조건 없이 검색 → 활성 회원 전체(ADMIN·탈퇴 제외)
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("조건 없는 검색 → 활성 회원만(use_yn=Y), 페이지 메타 정상 (null-safe)")
    void noFilter() {
        JsonNode data = searchData("");

        assertThat(data.path("totalElements").asInt()).isEqualTo(3); // m1,m2,m3 (m4 탈퇴·admin 제외)
        assertThat(data.path("content").size()).isEqualTo(3);
        assertThat(data.path("size").asInt()).isEqualTo(20);
        assertThat(data.path("page").asInt()).isEqualTo(0);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. 정렬 화이트리스트
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("허용 정렬 컬럼(userId,asc) → 200 + 정렬 적용")
    void sortAllowed() {
        JsonNode data = searchData("?sort=userId,asc");
        JsonNode content = data.path("content");
        assertThat(content.get(0).path("userId").asText()).isEqualTo("mtestm1");
        assertThat(content.get(1).path("userId").asText()).isEqualTo("mtestm2");
    }

    @Test
    @DisplayName("화이트리스트 밖 컬럼(userPw)로 정렬 시도 → 400 (임의 컬럼 정렬 차단)")
    void sortWhitelistBlocksArbitraryColumn() {
        ResponseEntity<String> resp = getJson("/api/v1/admin/members?sort=userPw,desc", adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_INVALID_REQUEST");
    }

    // ─────────────────────────────────────────────────────────────
    // 3. N+1 없음: 등급 매핑이 결과 행 수와 무관한 상수 쿼리
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("등급 매핑은 일괄 조회 — 쿼리 수가 결과 행 수와 무관하게 상수 (N+1 없음)")
    void noNPlusOne() {
        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();

        JsonNode data = searchData(""); // 활성 회원 3명, 서로 다른 등급 3종(MEMBER/SELLER/EXECUTIVE)
        assertThat(data.path("content").size()).isEqualTo(3);

        // 페이지 조회(1) + count(1) + 등급 일괄 조회(1) = 3. N+1이면 회원 수만큼 등급 select 추가됨.
        long statements = stats.getPrepareStatementCount();
        assertThat(statements)
                .as("등급 매핑 N+1이면 결과 행 수(3)만큼 statement가 늘어난다")
                .isLessThanOrEqualTo(4);

        // 등급 코드가 실제로 채워졌는지(일괄 맵 동작 확인)
        boolean allGradesResolved = true;
        for (JsonNode item : data.path("content")) {
            if (item.path("gradeCode").asText(null) == null || item.path("gradeCode").isNull()) {
                allGradesResolved = false;
            }
        }
        assertThat(allGradesResolved).isTrue();
    }

    @Test
    @DisplayName("등급 매핑은 page size와 무관하게 상수 — size=100·결과 다수여도 statement 불변 (전체 1회 로드 고정)")
    void gradeLoadConstantRegardlessOfPageSize() {
        // 활성 회원을 추가해 결과 집합을 키운다(서로 다른 등급 포함).
        insertUser("mtestp1", "추가회원1", "CUSTOMER", gradeSeq("MEMBER"), "ACTIVE", "Y",
                OffsetDateTime.of(2026, 4, 1, 0, 0, 0, 0, ZoneOffset.UTC), 0);
        insertUser("mtestp2", "추가회원2", "CUSTOMER", gradeSeq("SELLER"), "ACTIVE", "Y",
                OffsetDateTime.of(2026, 4, 2, 0, 0, 0, 0, ZoneOffset.UTC), 0);
        insertUser("mtestp3", "추가회원3", "CUSTOMER", gradeSeq("MASTER"), "ACTIVE", "Y",
                OffsetDateTime.of(2026, 4, 3, 0, 0, 0, 0, ZoneOffset.UTC), 0);
        // 활성 회원: m1,m2,m3 + p1,p2,p3 = 6명, 등급 4종(MEMBER/SELLER/EXECUTIVE/MASTER)

        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();

        JsonNode data = searchData("?size=100");
        assertThat(data.path("content").size()).isEqualTo(6);

        // 회원별 개별 등급 조회면 size=100·6행에서 statement가 6+로 늘어난다. 전체 1회 로드면 상수(3).
        long statements = stats.getPrepareStatementCount();
        assertThat(statements)
                .as("size=100·6행이어도 등급 로드는 1회여야 함(page+count+등급일괄=3)")
                .isLessThanOrEqualTo(4);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. ADMIN 행 배제
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("roleEq(CUSTOMER) 고정 → 어떤 검색에도 ADMIN 행 미포함")
    void adminExcluded() {
        // 관리자 userName('관리자')으로 직접 검색해도 결과 0
        JsonNode byName = searchData("?userName=관리자");
        assertThat(byName.path("totalElements").asInt()).isZero();

        // 전체 검색 결과에도 admin userId 부재
        JsonNode all = searchData("");
        for (JsonNode item : all.path("content")) {
            assertThat(item.path("userId").asText()).isNotEqualTo(adminId);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 다축 검색 동작
    // ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("등급 코드 필터 → 해당 등급 회원만")
    void filterByGrade() {
        JsonNode data = searchData("?gradeCode=EXECUTIVE");
        assertThat(data.path("totalElements").asInt()).isEqualTo(1);
        assertThat(data.path("content").get(0).path("userId").asText()).isEqualTo("mtestm3");
    }

    @Test
    @DisplayName("존재하지 않는 등급 코드 → 200 + 빈 결과(에러 아님)")
    void filterByUnknownGrade() {
        JsonNode data = searchData("?gradeCode=NOPE");
        assertThat(data.path("totalElements").asInt()).isZero();
        assertThat(data.path("content").size()).isZero();
    }

    @Test
    @DisplayName("상태 필터(SUSPENDED) → 정지 회원만")
    void filterByStatus() {
        JsonNode data = searchData("?status=SUSPENDED");
        assertThat(data.path("totalElements").asInt()).isEqualTo(1);
        assertThat(data.path("content").get(0).path("userId").asText()).isEqualTo("mtestm2");
    }

    @Test
    @DisplayName("가입기간 필터(joinedFrom) → 기간 이전 가입 회원 제외")
    void filterByJoinedPeriod() {
        // 2021-01-01 이후 가입 → 2020 가입한 m3 제외 → m1,m2
        JsonNode data = searchData("?joinedFrom=2021-01-01");
        assertThat(data.path("totalElements").asInt()).isEqualTo(2);
        for (JsonNode item : data.path("content")) {
            assertThat(item.path("userId").asText()).isNotEqualTo("mtestm3");
        }
    }

    @Test
    @DisplayName("키워드(q) → userId 또는 userName 부분일치")
    void filterByKeyword() {
        JsonNode byName = searchData("?q=셀러");
        assertThat(byName.path("totalElements").asInt()).isEqualTo(1);
        assertThat(byName.path("content").get(0).path("userId").asText()).isEqualTo("mtestm2");
    }

    @Test
    @DisplayName("LIKE 메타문자 이스케이프 — '_'는 와일드카드가 아닌 리터럴로 매칭")
    void likeMetacharEscaped() {
        // 언더스코어 포함/미포함 두 회원. 이스케이프 없으면 '_'가 단일문자 와일드카드라 둘 다 매칭됨.
        insertUser("mtestu_a", "리터럴_매칭", "CUSTOMER", gradeSeq("MEMBER"), "ACTIVE", "Y",
                OffsetDateTime.of(2026, 5, 1, 0, 0, 0, 0, ZoneOffset.UTC), 0);
        insertUser("mtestuXa", "리터럴X매칭", "CUSTOMER", gradeSeq("MEMBER"), "ACTIVE", "Y",
                OffsetDateTime.of(2026, 5, 2, 0, 0, 0, 0, ZoneOffset.UTC), 0);

        // userName='리터럴_매칭' 검색 → 이스케이프되면 언더스코어 회원만(1건)
        JsonNode byName = searchData("?userName=리터럴_매칭");
        assertThat(byName.path("totalElements").asInt()).isEqualTo(1);
        assertThat(byName.path("content").get(0).path("userId").asText()).isEqualTo("mtestu_a");

        // userId='mtestu_a' 검색 → 언더스코어 리터럴 → mtestuXa는 매칭되지 않음(1건)
        JsonNode byId = searchData("?userId=mtestu_a");
        assertThat(byId.path("totalElements").asInt()).isEqualTo(1);
        assertThat(byId.path("content").get(0).path("userId").asText()).isEqualTo("mtestu_a");
    }

    @Test
    @DisplayName("includeDeleted=false(기본) → 탈퇴 제외 / true → 탈퇴 포함")
    void includeDeletedToggle() {
        JsonNode without = searchData("?userId=mtestm4");
        assertThat(without.path("totalElements").asInt()).isZero();

        JsonNode with = searchData("?userId=mtestm4&includeDeleted=true");
        assertThat(with.path("totalElements").asInt()).isEqualTo(1);
        assertThat(with.path("content").get(0).path("useYn").asText()).isEqualTo("N");
    }

    // ─────────────────────────────────────────────────────────────
    // helpers
    // ─────────────────────────────────────────────────────────────
    private JsonNode searchData(String queryString) {
        ResponseEntity<String> resp = getJson("/api/v1/admin/members" + queryString, adminToken);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data");
    }

    private String adminLogin(String userId, String pw) {
        ResponseEntity<String> resp = rest.postForEntity(baseUrl() + "/api/v1/admin/auth/login",
                Map.of("userId", userId, "userPw", pw), String.class);
        return parse(resp.getBody()).path("data").path("accessToken").asText();
    }

    private Long gradeSeq(String gradeCode) {
        return jdbcTemplate.queryForObject(
                "SELECT grade_seq FROM mst_user_grade WHERE grade_code = ? AND use_yn = 'Y'",
                Long.class, gradeCode);
    }

    private void insertUser(String userId, String userName, String role, Long gradeSeq,
                            String status, String useYn, OffsetDateTime joinedDate, int pointBalance) {
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, grade_seq, "
                        + "point_balance, user_status, use_yn, i_user, i_date) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'TEST', ?)",
                userId, passwordEncoder.encode(ADMIN_PW), userName, role, gradeSeq,
                pointBalance, status, useYn, joinedDate);
    }

    private String suffix() {
        String unique = String.valueOf(System.nanoTime());
        return unique.substring(unique.length() - 8);
    }
}
