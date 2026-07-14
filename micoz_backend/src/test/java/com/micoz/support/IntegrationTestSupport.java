package com.micoz.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class IntegrationTestSupport {

    protected static final ObjectMapper objectMapper = new ObjectMapper();

    @LocalServerPort
    protected int port;

    @Autowired
    protected RestTemplateBuilder restTemplateBuilder;

    protected TestRestTemplate rest;

    @BeforeEach
    void initRestTemplate() {
        // PATCH 지원을 위해 Apache HttpComponents 기반 RequestFactory 사용
        TestRestTemplate base = new TestRestTemplate(restTemplateBuilder);
        base.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        this.rest = base;
    }

    protected String baseUrl() {
        return "http://localhost:" + port;
    }

    /** 회원가입 + 로그인 → access token */
    protected String signupAndLogin() {
        String unique = String.valueOf(System.nanoTime());
        String userId = "u" + unique.substring(unique.length() - 8);
        Map<String, Object> signup = Map.of(
                "userId", userId,
                "userPw", "pass1234",
                "userName", "테스트유저",
                "serviceYn", "Y",
                "privacyYn", "Y"
        );
        ResponseEntity<String> signupResp = rest.postForEntity(
                baseUrl() + "/api/v1/auth/signup", signup, String.class);
        if (!signupResp.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("signup failed: " + signupResp.getBody());
        }

        Map<String, String> login = Map.of("userId", userId, "userPw", "pass1234");
        ResponseEntity<String> loginResp = rest.postForEntity(
                baseUrl() + "/api/v1/auth/login", login, String.class);
        try {
            JsonNode root = objectMapper.readTree(loginResp.getBody());
            return root.path("data").path("accessToken").asText();
        } catch (Exception e) {
            throw new RuntimeException("login parse failed", e);
        }
    }

    protected HttpHeaders authHeaders(String accessToken) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(accessToken);
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }

    protected ResponseEntity<String> postJson(String path, String accessToken, Object body) {
        return rest.exchange(baseUrl() + path, HttpMethod.POST,
                new HttpEntity<>(body, authHeaders(accessToken)), String.class);
    }

    protected ResponseEntity<String> getJson(String path, String accessToken) {
        return rest.exchange(baseUrl() + path, HttpMethod.GET,
                new HttpEntity<>(authHeaders(accessToken)), String.class);
    }

    protected ResponseEntity<String> patchJson(String path, String accessToken, Object body) {
        return rest.exchange(baseUrl() + path, HttpMethod.PATCH,
                new HttpEntity<>(body, authHeaders(accessToken)), String.class);
    }

    protected ResponseEntity<String> deleteJson(String path, String accessToken) {
        return rest.exchange(baseUrl() + path, HttpMethod.DELETE,
                new HttpEntity<>(authHeaders(accessToken)), String.class);
    }

    protected JsonNode parse(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
