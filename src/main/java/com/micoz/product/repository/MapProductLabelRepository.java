package com.micoz.product.repository;

import com.micoz.product.entity.MapProductLabel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MapProductLabelRepository
        extends JpaRepository<MapProductLabel, MapProductLabel.MapProductLabelId> {

    List<MapProductLabel> findAllByProductSeq(Long productSeq);

    List<MapProductLabel> findAllByLabelSeq(Long labelSeq);

    List<MapProductLabel> findAllByProductSeqIn(java.util.Collection<Long> productSeqs);
}
