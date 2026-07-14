package com.micoz.auth.jwt;

import com.micoz.common.config.JwtProperties;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

/**
 * JWT access token 생성/파싱 + refresh token raw 값 생성.
 * - access: HS256 서명, claims(userSeq, userId, role)
 * - refresh: 32바이트 SecureRandom Base64URL (서명 없음 — DB의 SHA-256 해시가 신원 증명)
 */
@Component
public class JwtTokenProvider {

    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_ROLE = "role";
    private static final int REFRESH_TOKEN_BYTE_LENGTH = 32;

    private final JwtProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();
    private SecretKey signingKey;

    public JwtTokenProvider(JwtProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void init() {
        if (properties.getSecret() == null || properties.getSecret().length() < 32) {
            throw new IllegalStateException(
                    "micoz.jwt.secret must be at least 32 characters (HS256 requires 256-bit key)");
        }
        this.signingKey = Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(Long userSeq, String userId, String role) {
        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofMinutes(properties.getAccessTokenValidityMinutes()));
        return Jwts.builder()
                .subject(String.valueOf(userSeq))
                .claim(CLAIM_USER_ID, userId)
                .claim(CLAIM_ROLE, role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public String createRefreshToken() {
        byte[] random = new byte[REFRESH_TOKEN_BYTE_LENGTH];
        secureRandom.nextBytes(random);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(random);
    }

    public Claims parseAccessToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_INVALID);
        }
    }

    public Long getUserSeq(Claims claims) {
        return Long.parseLong(claims.getSubject());
    }

    public String getUserId(Claims claims) {
        return claims.get(CLAIM_USER_ID, String.class);
    }

    public String getRole(Claims claims) {
        return claims.get(CLAIM_ROLE, String.class);
    }

    public long getAccessTokenValiditySeconds() {
        return properties.getAccessTokenValidityMinutes() * 60L;
    }

    public Instant getRefreshTokenExpiry(Instant from) {
        return from.plus(Duration.ofDays(properties.getRefreshTokenValidityDays()));
    }
}
