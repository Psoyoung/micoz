package com.micoz.common;

import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 배포 전 보안 점검 배치 2(위생) 중 HTTP 레벨 검증.
 * - S-3: malformed 요청 바디 → 400(500 아님).
 * - S-4: 비-prod 프로파일에서 Swagger 익명 접근 유지(개발 편의 회귀 없음).
 *   (prod 프로파일의 ADMIN 전용 분기는 prod datasource 의존으로 통합테스트 부적합 — 코드 리뷰로 검증)
 */
class SecurityHygieneIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("[S-3] malformed JSON 바디 → 400 COMMON_INVALID_REQUEST (500 아님)")
    void malformedBodyReturns400() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // 깨진 JSON(닫히지 않음) → HttpMessageNotReadableException
        HttpEntity<String> req = new HttpEntity<>("{\"userId\": ", headers);

        ResponseEntity<String> resp = rest.postForEntity(
                baseUrl() + "/api/v1/auth/login", req, String.class);

        assertThat(resp.getStatusCode()).as("500이 아니라 400").isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_INVALID_REQUEST");
    }

    @Test
    @DisplayName("[S-3] 경로변수 타입 불일치(/products/abc) → 400 COMMON_INVALID_REQUEST (500 아님)")
    void pathVariableTypeMismatchReturns400() {
        // /api/v1/products/{productSeq}는 Long — "abc" 바인딩 실패 → MethodArgumentTypeMismatchException.
        // 공개(permitAll) 경로라 토큰 불요. 기존엔 500이었음.
        ResponseEntity<String> resp = rest.getForEntity(
                baseUrl() + "/api/v1/products/abc", String.class);

        assertThat(resp.getStatusCode()).as("500이 아니라 400").isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(parse(resp.getBody()).path("code").asText()).isEqualTo("COMMON_INVALID_REQUEST");
    }

    @Test
    @DisplayName("[S-4] 비-prod(test) 프로파일 → Swagger api-docs 익명 접근 가능(개발 편의 회귀 없음)")
    void swaggerAnonymousInNonProd() {
        ResponseEntity<String> resp = rest.getForEntity(baseUrl() + "/v3/api-docs", String.class);
        assertThat(resp.getStatusCode()).as("비-prod는 permitAll → 접근 가능").isEqualTo(HttpStatus.OK);
    }
}
