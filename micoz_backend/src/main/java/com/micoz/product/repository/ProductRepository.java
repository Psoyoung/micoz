package com.micoz.product.repository;

import com.micoz.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByProductSeqAndUseYnAndDisplayYn(Long productSeq, String useYn, String displayYn);

    // ── 관리자 (C-T1) ──────────────────────────────────────────
    /** 카테고리 삭제 가드: 해당 카테고리의 활성 소속 상품 수. */
    long countByCategorySeqAndUseYn(Long categorySeq, String useYn);

    // ── 관리자 (C-T3) ──────────────────────────────────────────
    /** 상품 코드 활성 중복(등록). */
    boolean existsByProductCodeAndUseYn(String productCode, String useYn);

    /** 상품 코드 활성 중복(수정, 본인 제외). */
    boolean existsByProductCodeAndUseYnAndProductSeqNot(String productCode, String useYn, Long productSeq);

    /** 카테고리 트리의 소속 상품 수를 1회 집계(category_seq별) — 목록 매핑 시 N+1 방지. */
    @Query("select p.categorySeq as categorySeq, count(p) as count from Product p "
            + "where p.useYn = 'Y' and p.categorySeq is not null group by p.categorySeq")
    List<CategoryProductCount> countActiveGroupByCategory();

    interface CategoryProductCount {
        Long getCategorySeq();
        long getCount();
    }

    Page<Product> findAllByUseYnAndDisplayYn(String useYn, String displayYn, Pageable pageable);

    Page<Product> findAllByCategorySeqAndUseYnAndDisplayYn(Long categorySeq, String useYn, String displayYn, Pageable pageable);

    java.util.List<Product> findAllByProductSeqInAndUseYnAndDisplayYn(java.util.Collection<Long> productSeqs, String useYn, String displayYn);

    default Optional<Product> findVisibleByProductSeq(Long productSeq) {
        return findByProductSeqAndUseYnAndDisplayYn(productSeq, "Y", "Y");
    }
}
