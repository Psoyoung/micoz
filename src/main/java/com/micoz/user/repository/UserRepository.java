package com.micoz.user.repository;

import com.micoz.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    /** 관리자 목록 (활성/비활성 모두 — 비활성 계정 재활성화 관리 목적) */
    Page<User> findByUserRole(String userRole, Pageable pageable);

    Optional<User> findByUserIdAndUseYn(String userId, String useYn);

    boolean existsByUserIdAndUseYn(String userId, String useYn);

    Optional<User> findByUserNameAndEmailAndUseYn(String userName, String email, String useYn);

    /** 운영 ADMIN 존재 여부 (ROOT 비상 계정 제외) — 부트스트랩 멱등 판정용 */
    boolean existsByUserRoleAndUseYnAndUserIdNot(String userRole, String useYn, String userId);

    /**
     * 운영 ADMIN 수 (ROOT 비상 계정 제외) — 마지막 관리자 보호 판정용.
     * 부트스트랩의 존재 판정(existsByUserRoleAndUseYnAndUserIdNot)과 동일 기준으로 통일.
     */
    long countByUserRoleAndUseYnAndUserIdNot(String userRole, String useYn, String userId);

    default Optional<User> findActiveByUserId(String userId) {
        return findByUserIdAndUseYn(userId, "Y");
    }

    default boolean existsActiveByUserId(String userId) {
        return existsByUserIdAndUseYn(userId, "Y");
    }
}
