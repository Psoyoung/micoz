package com.micoz.user.repository;

import com.micoz.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUserIdAndUseYn(String userId, String useYn);

    boolean existsByUserIdAndUseYn(String userId, String useYn);

    Optional<User> findByUserNameAndEmailAndUseYn(String userName, String email, String useYn);

    /** 운영 ADMIN 존재 여부 (ROOT 비상 계정 제외) — 부트스트랩 멱등 판정용 */
    boolean existsByUserRoleAndUseYnAndUserIdNot(String userRole, String useYn, String userId);

    default Optional<User> findActiveByUserId(String userId) {
        return findByUserIdAndUseYn(userId, "Y");
    }

    default boolean existsActiveByUserId(String userId) {
        return existsByUserIdAndUseYn(userId, "Y");
    }
}
