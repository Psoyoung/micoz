package com.micoz.common.config;

import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.AfterEach;
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
 * S-1 Actuator 게이팅 — 운영 지표(metrics/prometheus 등)의 익명 노출 차단 검증.
 * health(+probes)만 익명 허용, 그 외 actuator는 ADMIN 전용.
 * 픽스처는 user_id 'acta%' 접두사로 시드 후 정리(빚 #9 격리 취약 회피 — 활성 CUSTOMER 누출 방지).
 */
class ActuatorSecurityIntegrationTest extends IntegrationTestSupport {

    private static final String PW = "Actuator#Test1234";

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM dat_refresh_token WHERE user_seq IN "
                + "(SELECT user_seq FROM mst_user WHERE user_id LIKE 'acta%')");
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id LIKE 'acta%'");
    }

    @Test
    @DisplayName("익명 → /actuator/metrics 차단(401)")
    void anonymousMetricsBlocked() {
        ResponseEntity<String> resp = rest.getForEntity(baseUrl() + "/actuator/metrics", String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("익명 → /actuator/prometheus 차단(401)")
    void anonymousPrometheusBlocked() {
        ResponseEntity<String> resp = rest.getForEntity(baseUrl() + "/actuator/prometheus", String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("익명 → /actuator/health 허용(200) — 로드밸런서 헬스체크")
    void anonymousHealthAllowed() {
        ResponseEntity<String> resp = rest.getForEntity(baseUrl() + "/actuator/health", String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("ADMIN 인증 → /actuator/metrics 접근 가능(200)")
    void adminCanAccessMetrics() {
        String token = seedAndLogin("ADMIN");
        assertThat(getJson("/actuator/metrics", token).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("CUSTOMER 인증 → /actuator/metrics 차단(403)")
    void customerCannotAccessMetrics() {
        String token = seedAndLogin("CUSTOMER");
        assertThat(getJson("/actuator/metrics", token).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    /** 'acta' 마커 사용자 시드 + 로그인 → access token. ADMIN은 관리자 로그인 경로. */
    private String seedAndLogin(String role) {
        String uid = "acta" + role.substring(0, 2).toLowerCase() + suffix();
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, point_balance, "
                        + "user_status, use_yn, i_user) VALUES (?, ?, '액추에이터테스트', ?, 0, 'ACTIVE', 'Y', 'TEST')",
                uid, passwordEncoder.encode(PW), role);
        String path = "ADMIN".equals(role) ? "/api/v1/admin/auth/login" : "/api/v1/auth/login";
        ResponseEntity<String> resp = rest.postForEntity(
                baseUrl() + path, Map.of("userId", uid, "userPw", PW), String.class);
        assertThat(resp.getStatusCode()).as("로그인 성공: %s", resp.getBody()).isEqualTo(HttpStatus.OK);
        return parse(resp.getBody()).path("data").path("accessToken").asText();
    }

    private String suffix() {
        String unique = String.valueOf(System.nanoTime());
        return unique.substring(unique.length() - 8);
    }
}
