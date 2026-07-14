package com.micoz.promotion.repository;

import com.micoz.promotion.entity.PointHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointHistoryRepository extends JpaRepository<PointHistory, Long> {

    Page<PointHistory> findAllByUserSeqAndUseYn(Long userSeq, String useYn, Pageable pageable);
}
