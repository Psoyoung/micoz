package com.micoz.favorite;

import com.fasterxml.jackson.databind.JsonNode;
import com.micoz.support.IntegrationTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class FavoriteIntegrationTest extends IntegrationTestSupport {

    private static final long PRODUCT_TONER = 1L;
    private static final long PRODUCT_ESSENCE = 2L;
    private static final long PRODUCT_BODY = 5L;

    @Test
    @DisplayName("FR-FAV-01: 토글 추가/해제 → 추가 → GET 목록 → DELETE 시나리오")
    void favoriteFullScenario() {
        String access = signupAndLogin();

        // [1] POST 1 → favorited=true
        ResponseEntity<String> r1 = postJson("/api/v1/me/favorites/" + PRODUCT_TONER, access, null);
        assertThat(r1.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parse(r1.getBody()).path("data").path("favorited").asBoolean()).isTrue();

        // [2] POST 1 다시 → favorited=false (토글 해제)
        ResponseEntity<String> r2 = postJson("/api/v1/me/favorites/" + PRODUCT_TONER, access, null);
        assertThat(parse(r2.getBody()).path("data").path("favorited").asBoolean()).isFalse();

        // [3] 1, 2, 5 추가
        postJson("/api/v1/me/favorites/" + PRODUCT_TONER, access, null);
        postJson("/api/v1/me/favorites/" + PRODUCT_ESSENCE, access, null);
        postJson("/api/v1/me/favorites/" + PRODUCT_BODY, access, null);

        // [4] GET — 3건
        ResponseEntity<String> r4 = getJson("/api/v1/me/favorites", access);
        JsonNode data = parse(r4.getBody()).path("data");
        assertThat(data.path("totalElements").asInt()).isEqualTo(3);
        assertThat(data.path("content").size()).isEqualTo(3);

        // [5] DELETE 명시
        ResponseEntity<String> r5 = deleteJson("/api/v1/me/favorites/" + PRODUCT_ESSENCE, access);
        assertThat(r5.getStatusCode()).isEqualTo(HttpStatus.OK);

        // [6] 없는 상품 DELETE → 멱등 200
        ResponseEntity<String> r6 = deleteJson("/api/v1/me/favorites/9999", access);
        assertThat(r6.getStatusCode()).isEqualTo(HttpStatus.OK);

        // [7] 없는 상품 POST → PRODUCT_NOT_FOUND
        ResponseEntity<String> r7 = postJson("/api/v1/me/favorites/9999", access, null);
        assertThat(parse(r7.getBody()).path("code").asText()).isEqualTo("PRODUCT_NOT_FOUND");

        // [8] GET 후 2건
        ResponseEntity<String> r8 = getJson("/api/v1/me/favorites", access);
        assertThat(parse(r8.getBody()).path("data").path("totalElements").asInt()).isEqualTo(2);
    }
}
