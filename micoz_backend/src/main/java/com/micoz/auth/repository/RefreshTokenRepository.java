package com.micoz.auth.repository;

import com.micoz.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByRefreshTokenAndRevokedYn(String refreshTokenHash, String revokedYn);

    List<RefreshToken> findAllByUserSeqAndRevokedYn(Long userSeq, String revokedYn);

    /** 해시 일치하는 활성 토큰 (rotation용) */
    default Optional<RefreshToken> findActiveByHash(String hash) {
        return findByRefreshTokenAndRevokedYn(hash, "N");
    }

    /** 사용자의 모든 활성 refresh (bulk revoke용) */
    default List<RefreshToken> findActiveByUserSeq(Long userSeq) {
        return findAllByUserSeqAndRevokedYn(userSeq, "N");
    }

    /** 해시로 어떤 상태든 조회 (재사용 탐지용) */
    Optional<RefreshToken> findByRefreshToken(String refreshTokenHash);
}
