package com.micoz.returns.repository;

import com.micoz.returns.entity.Return;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface ReturnRepository extends JpaRepository<Return, Long>, JpaSpecificationExecutor<Return> {

    boolean existsByReturnNo(String returnNo);

    Optional<Return> findByReturnSeqAndUserSeq(Long returnSeq, Long userSeq);

    Page<Return> findAllByUserSeq(Long userSeq, Pageable pageable);

    List<Return> findAllByOrderSeqAndUserSeq(Long orderSeq, Long userSeq);

    /** 주문의 전 반품(관리자·환불 누적 계산용 — 이전 완료분 prior gross 산출). */
    List<Return> findAllByOrderSeq(Long orderSeq);
}
