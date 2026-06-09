package com.micoz.returns.repository;

import com.micoz.returns.entity.ReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ReturnItemRepository extends JpaRepository<ReturnItem, Long> {

    List<ReturnItem> findAllByReturnSeq(Long returnSeq);

    List<ReturnItem> findAllByReturnSeqIn(Collection<Long> returnSeqs);

    List<ReturnItem> findAllByItemSeq(Long itemSeq);
}
