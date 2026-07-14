package com.micoz.user.repository;

import com.micoz.user.entity.UserGrade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserGradeRepository extends JpaRepository<UserGrade, Long> {

    Optional<UserGrade> findByGradeCodeAndUseYn(String gradeCode, String useYn);

    default Optional<UserGrade> findActiveByGradeCode(String gradeCode) {
        return findByGradeCodeAndUseYn(gradeCode, "Y");
    }
}
