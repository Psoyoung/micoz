package com.micoz.user.repository;

import com.micoz.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUserIdAndUseYn(String userId, String useYn);

    boolean existsByUserIdAndUseYn(String userId, String useYn);

    Optional<User> findByUserNameAndEmailAndUseYn(String userName, String email, String useYn);

    default Optional<User> findActiveByUserId(String userId) {
        return findByUserIdAndUseYn(userId, "Y");
    }

    default boolean existsActiveByUserId(String userId) {
        return existsByUserIdAndUseYn(userId, "Y");
    }
}
