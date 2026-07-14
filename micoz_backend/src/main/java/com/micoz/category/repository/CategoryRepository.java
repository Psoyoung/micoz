package com.micoz.category.repository;

import com.micoz.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByUseYnAndDisplayYnOrderBySortOrderAsc(String useYn, String displayYn);

    default List<Category> findAllVisible() {
        return findAllByUseYnAndDisplayYnOrderBySortOrderAsc("Y", "Y");
    }

    // ── 관리자 (C-T1) ──────────────────────────────────────────
    /** 운영 뷰 트리 로드: display_yn 무관, use_yn만 분기(includeDeleted=false → 'Y'). */
    List<Category> findAllByUseYn(String useYn);

    /** 활성 카테고리 단건(수정/삭제 대상). */
    Optional<Category> findByCategorySeqAndUseYn(Long categorySeq, String useYn);

    /** 슬러그 활성 중복(생성). */
    boolean existsByUrlSlugAndUseYn(String urlSlug, String useYn);

    /** 슬러그 활성 중복(수정, 본인 제외). */
    boolean existsByUrlSlugAndUseYnAndCategorySeqNot(String urlSlug, String useYn, Long categorySeq);

    /** 삭제 가드: 활성 하위 카테고리 수. */
    long countByParentSeqAndUseYn(Long parentSeq, String useYn);
}
