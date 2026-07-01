package com.micoz.product.repository;

import com.micoz.product.entity.MapProductLabel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MapProductLabelRepository
        extends JpaRepository<MapProductLabel, MapProductLabel.MapProductLabelId> {

    List<MapProductLabel> findAllByProductSeq(Long productSeq);

    List<MapProductLabel> findAllByLabelSeq(Long labelSeq);

    List<MapProductLabel> findAllByProductSeqIn(java.util.Collection<Long> productSeqs);

    /** 상품 하드삭제 시 라벨 매핑 물리삭제(C-T5, 미노출 배치 경로용). */
    void deleteByProductSeq(Long productSeq);
}
