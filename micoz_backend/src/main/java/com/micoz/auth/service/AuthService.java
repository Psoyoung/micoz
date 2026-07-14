package com.micoz.auth.service;

import com.micoz.auth.dto.FindIdRequest;
import com.micoz.auth.dto.FindIdResponse;
import com.micoz.auth.dto.LoginRequest;
import com.micoz.auth.dto.LogoutRequest;
import com.micoz.auth.dto.RefreshRequest;
import com.micoz.auth.dto.ResetPasswordRequest;
import com.micoz.auth.dto.SignupRequest;
import com.micoz.auth.dto.SignupResponse;
import com.micoz.auth.dto.TokenResponse;
import com.micoz.auth.entity.RefreshToken;
import com.micoz.auth.jwt.JwtTokenProvider;
import com.micoz.auth.repository.RefreshTokenRepository;
import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.util.HashUtil;
import com.micoz.user.entity.User;
import com.micoz.user.entity.UserGrade;
import com.micoz.user.repository.UserGradeRepository;
import com.micoz.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String DEFAULT_GRADE_CODE = "MEMBER";
    private static final String ROLE_CUSTOMER = "CUSTOMER";
    private static final String ROLE_ADMIN = "ADMIN";

    /** 로그인 차단 상태 (M-T3.5). 탈퇴(use_yn='N')는 findActive 단계에서 이미 차단됨. */
    private static final String STATUS_SUSPENDED = "SUSPENDED";

    /** 사용자 존재하지 않을 때 시간차 최소화용 dummy hash (BCrypt 12 stub) */
    private static final String DUMMY_BCRYPT_HASH =
            "$2a$12$invalidplaceholderxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    private final UserRepository userRepository;
    private final UserGradeRepository userGradeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public SignupResponse signup(SignupRequest request) {
        // 1. 추천인 처리 (선택)
        Long referrerSeq = null;
        String referrerUserId = null;
        if (request.getReferrerUserId() != null && !request.getReferrerUserId().isBlank()) {
            User referrer = userRepository.findActiveByUserId(request.getReferrerUserId().trim())
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_REFERRER_NOT_FOUND));
            referrerSeq = referrer.getUserSeq();
            referrerUserId = referrer.getUserId();
        }

        // 2. 아이디 중복 검증
        if (userRepository.existsActiveByUserId(request.getUserId())) {
            throw new BusinessException(ErrorCode.USER_DUPLICATED_ID);
        }

        // 3. 기본 등급 조회
        UserGrade memberGrade = userGradeRepository.findActiveByGradeCode(DEFAULT_GRADE_CODE)
                .orElseThrow(() -> new IllegalStateException(
                        "Default user grade not seeded: " + DEFAULT_GRADE_CODE));

        // 4. 비밀번호 BCrypt 해시
        String encoded = passwordEncoder.encode(request.getUserPw());

        // 5. 약관 동의 일시
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        boolean marketing = "Y".equals(request.getMarketingYn());

        // 6. User 생성/저장
        User user = User.builder()
                .userId(request.getUserId())
                .userPw(encoded)
                .userName(request.getUserName())
                .userRole(ROLE_CUSTOMER)
                .gradeSeq(memberGrade.getGradeSeq())
                .email(request.getEmail())
                .phone(request.getPhone())
                .serviceYn("Y")
                .privacyYn("Y")
                .marketingYn(marketing ? "Y" : "N")
                .serviceAgreeDate(now)
                .privacyAgreeDate(now)
                .marketingAgreeDate(marketing ? now : null)
                .pointBalance(0)
                .userStatus("ACTIVE")
                .useYn("Y")
                .referrerUserSeq(referrerSeq)
                .build();

        User saved = userRepository.save(user);
        return new SignupResponse(saved.getUserSeq(), saved.getUserId(), referrerUserId);
    }

    @Transactional
    public TokenResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = authenticateOrThrow(request.getUserId(), request.getUserPw());
        return issueTokens(user, httpRequest);
    }

    /**
     * 관리자 로그인 (FR-ADM-11, F-T2). 사용자 로그인과 자격증명 검증 흐름을 공유하되,
     * 자격증명이 맞아도 role != ADMIN이면 동일하게 AUTH_INVALID_CREDENTIALS로 거부한다.
     * (NFR-07 열거방지 — 일반 사용자가 관리자 로그인을 시도해도 응답/시간차 동일)
     */
    @Transactional
    public TokenResponse adminLogin(LoginRequest request, HttpServletRequest httpRequest) {
        User user = authenticateOrThrow(request.getUserId(), request.getUserPw());
        if (!ROLE_ADMIN.equals(user.getUserRole())) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }
        return issueTokens(user, httpRequest);
    }

    /**
     * 자격증명 검증. 사용자가 없어도 dummy hash 비교로 시간차를 최소화한다(NFR-07).
     * 실패 시 AUTH_INVALID_CREDENTIALS.
     */
    private User authenticateOrThrow(String userId, String rawPassword) {
        User user = userRepository.findActiveByUserId(userId).orElse(null);
        String hashToCheck = (user != null) ? user.getUserPw() : DUMMY_BCRYPT_HASH;
        boolean matches = passwordEncoder.matches(rawPassword, hashToCheck);
        if (user == null || !matches) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }
        // 운영 상태 게이팅 (M-T3.5): SUSPENDED는 로그인 거부.
        // 자격증명 확인 이후 판정 + 동일 응답으로 상태 비노출/시간차 최소화(NFR-07).
        if (STATUS_SUSPENDED.equals(user.getUserStatus())) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }
        return user;
    }

    /** access 발급 + refresh(SHA-256 해시) 저장 + last_login_date 갱신. 로그인/관리자로그인 공통. */
    private TokenResponse issueTokens(User user, HttpServletRequest httpRequest) {
        String accessToken = jwtTokenProvider.createAccessToken(
                user.getUserSeq(), user.getUserId(), user.getUserRole());
        String refreshRaw = jwtTokenProvider.createRefreshToken();
        String refreshHash = HashUtil.sha256Hex(refreshRaw);

        Instant now = Instant.now();
        OffsetDateTime expireDate = jwtTokenProvider.getRefreshTokenExpiry(now)
                .atOffset(ZoneOffset.UTC);
        RefreshToken token = RefreshToken.builder()
                .userSeq(user.getUserSeq())
                .refreshToken(refreshHash)
                .ipAddress(resolveClientIp(httpRequest))
                .expireDate(expireDate)
                .build();
        refreshTokenRepository.save(token);

        user.updateLastLogin(OffsetDateTime.now(ZoneOffset.UTC));

        return TokenResponse.of(accessToken, refreshRaw, jwtTokenProvider.getAccessTokenValiditySeconds());
    }

    /**
     * Refresh rotation (FR-AUTH-03).
     * - 정상: 이전 refresh revoke + 새 access/refresh 발급
     * - 재사용 탐지(revoked 토큰 재제출): 같은 user의 모든 활성 refresh 무효화 + AUTH_TOKEN_INVALID
     * - 만료: AUTH_TOKEN_EXPIRED
     * - 위조(DB 미존재): AUTH_TOKEN_INVALID (bulk revoke 없음 — userSeq를 알 수 없음)
     *
     * noRollbackFor: 재사용 탐지 시 bulk revoke 후 BusinessException을 throw하더라도
     * revoke 변경사항이 커밋되어야 한다. 다른 BusinessException 경로는 데이터 변경 전 throw라 영향 없음.
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public TokenResponse refresh(RefreshRequest request, HttpServletRequest httpRequest) {
        String hash = HashUtil.sha256Hex(request.getRefreshToken());
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        // 활성 토큰 우선 조회
        RefreshToken active = refreshTokenRepository.findActiveByHash(hash).orElse(null);
        if (active == null) {
            // 재사용 탐지: 같은 해시가 revoked 상태로 존재하면 → 해당 user 전체 무효화
            refreshTokenRepository.findByRefreshToken(hash).ifPresent(found -> {
                List<RefreshToken> userTokens =
                        refreshTokenRepository.findActiveByUserSeq(found.getUserSeq());
                userTokens.forEach(t -> t.revoke(now));
            });
            throw new BusinessException(ErrorCode.AUTH_TOKEN_INVALID);
        }

        // 만료 검사
        if (active.isExpired(now)) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_EXPIRED);
        }

        // 사용자 조회
        User user = userRepository.findById(active.getUserSeq())
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_TOKEN_INVALID));
        if (!"Y".equals(user.getUseYn())) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_INVALID);
        }

        // 새 토큰 발급
        String newAccess = jwtTokenProvider.createAccessToken(
                user.getUserSeq(), user.getUserId(), user.getUserRole());
        String newRefreshRaw = jwtTokenProvider.createRefreshToken();
        String newRefreshHash = HashUtil.sha256Hex(newRefreshRaw);

        // 이전 record revoke + 새 record insert
        active.revoke(now);
        OffsetDateTime newExpire = jwtTokenProvider
                .getRefreshTokenExpiry(Instant.now())
                .atOffset(ZoneOffset.UTC);
        RefreshToken next = RefreshToken.builder()
                .userSeq(user.getUserSeq())
                .refreshToken(newRefreshHash)
                .ipAddress(resolveClientIp(httpRequest))
                .expireDate(newExpire)
                .build();
        refreshTokenRepository.save(next);

        return TokenResponse.of(newAccess, newRefreshRaw, jwtTokenProvider.getAccessTokenValiditySeconds());
    }

    /**
     * 로그아웃 (FR-AUTH-04). 인증된 사용자의 refresh 토큰을 revoke.
     * - 존재하지 않거나 이미 revoked된 토큰: 멱등 처리(에러 아님)
     * - 다른 user의 토큰: AUTH_FORBIDDEN
     */
    @Transactional
    public void logout(LogoutRequest request, UserPrincipal principal) {
        String hash = HashUtil.sha256Hex(request.getRefreshToken());
        RefreshToken token = refreshTokenRepository.findActiveByHash(hash).orElse(null);
        if (token == null) {
            return; // 멱등
        }
        if (!token.getUserSeq().equals(principal.getUserSeq())) {
            throw new BusinessException(ErrorCode.AUTH_FORBIDDEN);
        }
        token.revoke(OffsetDateTime.now(ZoneOffset.UTC));
    }

    /**
     * 아이디 찾기 (FR-AUTH-05). NFR-07: 존재 여부 미노출.
     * - 본인확인(이름+이메일) 통과 시 userId 반환
     * - 미통과 시 userId=null (HTTP/응답코드 동일)
     */
    @Transactional(readOnly = true)
    public FindIdResponse findId(FindIdRequest request) {
        User user = userRepository
                .findByUserNameAndEmailAndUseYn(request.getUserName(), request.getEmail(), "Y")
                .orElse(null);
        // 시간차 최소화: 사용자가 없어도 dummy hash 비교
        if (user == null) {
            passwordEncoder.matches("dummy", DUMMY_BCRYPT_HASH);
            return new FindIdResponse(null);
        }
        return new FindIdResponse(user.getUserId());
    }

    /**
     * 비밀번호 재설정 (FR-AUTH-05). NFR-07: 본인확인 통과 여부 미노출.
     * - userId + userName + email 모두 일치 시 새 비번으로 변경 + 전체 refresh revoke
     * - 미일치 시 변경 없이 SUCCESS 반환
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findActiveByUserId(request.getUserId()).orElse(null);
        boolean verified = (user != null)
                && user.getUserName().equals(request.getUserName())
                && request.getEmail().equalsIgnoreCase(user.getEmail());

        // 시간차 최소화: 미일치 시에도 BCrypt 부담 동일하게 발생시킴
        String dummyEncoded = passwordEncoder.encode(request.getNewPassword());

        if (!verified) {
            // 비노출 — 아무 변경 없이 정상 응답 (dummyEncoded는 사용하지 않음)
            return;
        }

        user.changePassword(dummyEncoded);

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<RefreshToken> active = refreshTokenRepository.findActiveByUserSeq(user.getUserSeq());
        active.forEach(t -> t.revoke(now));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
