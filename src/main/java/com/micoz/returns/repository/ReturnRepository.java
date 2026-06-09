package com.micoz.returns.repository;

import com.micoz.returns.entity.Return;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReturnRepository extends JpaRepository<Return, Long> {

    boolean existsByReturnNo(String returnNo);

    Optional<Return> findByReturnSeqAndUserSeq(Long returnSeq, Long userSeq);

    Page<Return> findAllByUserSeq(Long userSeq, Pageable pageable);

    List<Return> findAllByOrderSeqAndUserSeq(Long orderSeq, Long userSeq);
}
