package com.micoz.product.repository;

import com.micoz.product.entity.ProductOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductOptionRepository extends JpaRepository<ProductOption, Long> {

    List<ProductOption> findAllByProductSeqAndUseYnOrderBySortOrderAsc(Long productSeq, String useYn);

    default List<ProductOption> findActiveByProductSeq(Long productSeq) {
        return findAllByProductSeqAndUseYnOrderBySortOrderAsc(productSeq, "Y");
    }
}
