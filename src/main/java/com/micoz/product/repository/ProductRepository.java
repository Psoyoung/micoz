package com.micoz.product.repository;

import com.micoz.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByProductSeqAndUseYnAndDisplayYn(Long productSeq, String useYn, String displayYn);

    Page<Product> findAllByUseYnAndDisplayYn(String useYn, String displayYn, Pageable pageable);

    Page<Product> findAllByCategorySeqAndUseYnAndDisplayYn(Long categorySeq, String useYn, String displayYn, Pageable pageable);

    java.util.List<Product> findAllByProductSeqInAndUseYnAndDisplayYn(java.util.Collection<Long> productSeqs, String useYn, String displayYn);

    default Optional<Product> findVisibleByProductSeq(Long productSeq) {
        return findByProductSeqAndUseYnAndDisplayYn(productSeq, "Y", "Y");
    }
}
