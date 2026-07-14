package com.micoz.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TokenResponse {
    private final String accessToken;
    private final String refreshToken;
    private final String tokenType;
    private final long accessTokenExpiresIn;

    public static TokenResponse of(String accessToken, String refreshToken, long expiresInSec) {
        return new TokenResponse(accessToken, refreshToken, "Bearer", expiresInSec);
    }
}
