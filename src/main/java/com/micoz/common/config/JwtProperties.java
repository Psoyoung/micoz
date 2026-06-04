package com.micoz.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * micoz.jwt.* 설정 바인딩.
 * application.yml:
 *   micoz.jwt.secret               (>= 32바이트 권장)
 *   micoz.jwt.access-token-validity-minutes
 *   micoz.jwt.refresh-token-validity-days
 */
@ConfigurationProperties(prefix = "micoz.jwt")
public class JwtProperties {

    private String secret;
    private long accessTokenValidityMinutes = 30;
    private long refreshTokenValidityDays = 14;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getAccessTokenValidityMinutes() {
        return accessTokenValidityMinutes;
    }

    public void setAccessTokenValidityMinutes(long accessTokenValidityMinutes) {
        this.accessTokenValidityMinutes = accessTokenValidityMinutes;
    }

    public long getRefreshTokenValidityDays() {
        return refreshTokenValidityDays;
    }

    public void setRefreshTokenValidityDays(long refreshTokenValidityDays) {
        this.refreshTokenValidityDays = refreshTokenValidityDays;
    }
}
