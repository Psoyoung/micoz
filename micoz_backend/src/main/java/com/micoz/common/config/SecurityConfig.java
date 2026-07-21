package com.micoz.common.config;

import com.micoz.auth.jwt.JwtAuthenticationFilter;
import com.micoz.auth.security.CustomAccessDeniedHandler;
import com.micoz.auth.security.JwtAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * M1 보안 정책 — JWT 기반 무상태 인증.
 * - permitAll: /api/v1/auth/**, /v3/api-docs/**, /swagger-ui/**, /actuator/health
 * - 그 외: authenticated()
 * - JWT 필터를 UsernamePasswordAuthenticationFilter 앞에 등록
 * - 401: JwtAuthenticationEntryPoint, 403: CustomAccessDeniedHandler
 */
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final int BCRYPT_STRENGTH = 12;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final CustomAccessDeniedHandler customAccessDeniedHandler;

    /** OpenAPI/Swagger 경로 — prod 재활성 대비 심층방어(S-4)에서 프로파일별로 접근을 달리 한다. */
    private static final String[] SWAGGER_PATHS = {
            "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   CorsConfigurationSource corsConfigurationSource,
                                                   org.springframework.core.env.Environment environment) throws Exception {
        // prod는 springdoc을 비활성(application-prod.yml)하지만, 재활성 시에도 문서가 익명 노출되지 않도록
        // prod에서는 Swagger를 ADMIN 전용으로 이중 방어한다. 비-prod(local/test)는 개발 편의로 익명 허용(S-4).
        boolean isProd = java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod");

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    // logout만 인증 필요 (현재 로그인 사용자가 호출)
                    auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/logout").authenticated();
                    // 관리자 로그인 진입점은 비인증 허용 (반드시 admin/** 게이팅보다 먼저 선언)
                    auth.requestMatchers(HttpMethod.POST, "/api/v1/admin/auth/login").permitAll();
                    auth.requestMatchers(
                            "/api/v1/auth/**",
                            // health(+probes)만 익명 허용 — 로드밸런서 헬스체크용
                            "/actuator/health",
                            "/actuator/health/**"
                    ).permitAll();
                    // Swagger 심층방어(S-4): prod는 ADMIN 전용, 비-prod는 익명 허용
                    if (isProd) {
                        auth.requestMatchers(SWAGGER_PATHS).hasRole("ADMIN");
                    } else {
                        auth.requestMatchers(SWAGGER_PATHS).permitAll();
                    }
                    // 운영 지표(metrics/prometheus/info 등)는 ADMIN 전용 — 익명 정찰 차단(S-1)
                    auth.requestMatchers("/actuator/**").hasRole("ADMIN");
                    // 카탈로그 공개 조회 (M2)
                    auth.requestMatchers(HttpMethod.GET,
                            "/api/v1/categories/**",
                            "/api/v1/products/**",
                            "/api/v1/banners/**"
                    ).permitAll();
                    // 관리자 영역 — ADMIN 권한 필수 (로그인 진입점 제외, 위에서 먼저 허용됨)
                    auth.requestMatchers("/api/v1/admin/**").hasRole("ADMIN");
                    auth.anyRequest().authenticated();
                })
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(customAccessDeniedHandler)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(BCRYPT_STRENGTH);
    }
}
