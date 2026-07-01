package com.micoz.product.repository;

import com.micoz.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findAllByProductSeqAndUseYnOrderBySortOrderAsc(Long productSeq, String useYn);

    List<ProductImage> findAllByProductSeqAndImageTypeAndUseYnOrderBySortOrderAsc(Long productSeq, String imageType, String useYn);

    List<ProductImage> findAllByProductSeqInAndImageTypeAndUseYn(java.util.Collection<Long> productSeqs, String imageType, String useYn);

    default List<ProductImage> findActiveByProductSeq(Long productSeq) {
        return findAllByProductSeqAndUseYnOrderBySortOrderAsc(productSeq, "Y");
    }

    default List<ProductImage> findActiveMainByProductSeq(Long productSeq) {
        return findAllByProductSeqAndImageTypeAndUseYnOrderBySortOrderAsc(productSeq, "MAIN", "Y");
    }

    /** 상품 하드삭제 시 자식 물리삭제(C-T5, 미노출 배치 경로용). */
    void deleteByProductSeq(Long productSeq);
}
