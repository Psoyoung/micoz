package com.micoz.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 본인확인 통과 시 userId, 미통과 시 null.
 * HTTP 200 + SUCCESS 코드는 동일 (NFR-07 열거방지).
 */
@Getter
@AllArgsConstructor
public class FindIdResponse {
    private final String userId;
}
