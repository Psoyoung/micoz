package com.micoz.product.repository;

import com.micoz.product.entity.ProductOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProductOptionRepository extends JpaRepository<ProductOption, Long> {

    List<ProductOption> findAllByProductSeqAndUseYnOrderBySortOrderAsc(Long productSeq, String useYn);

    default List<ProductOption> findActiveByProductSeq(Long productSeq) {
        return findAllByProductSeqAndUseYnOrderBySortOrderAsc(productSeq, "Y");
    }

    /** 옵션이 해당 상품 소속·활성인지 확인(C-T4 재고 설정). */
    java.util.Optional<ProductOption> findByOptionSeqAndProductSeqAndUseYn(
            Long optionSeq, Long productSeq, String useYn);

    /** 상품 하드삭제 시 자식 물리삭제(C-T5, 미노출 배치 경로용). */
    void deleteByProductSeq(Long productSeq);

    // ── 관리자 (C-T2) ──────────────────────────────────────────
    /** 상품별 활성 옵션 재고 합을 1회 집계 — 목록 totalStock 매핑 시 N+1 방지. */
    @Query("select o.productSeq as productSeq, coalesce(sum(o.stockQty), 0) as totalStock "
            + "from ProductOption o where o.useYn = 'Y' and o.productSeq in :productSeqs "
            + "group by o.productSeq")
    List<ProductStockSum> sumActiveStockByProductSeqIn(@Param("productSeqs") Collection<Long> productSeqs);

    interface ProductStockSum {
        Long getProductSeq();
        long getTotalStock();
    }
}
