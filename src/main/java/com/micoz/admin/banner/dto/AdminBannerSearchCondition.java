package com.micoz.admin.banner.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 배너 목록·다축 검색 조건 (S-T1). 쿼리 파라미터 → @ModelAttribute 바인딩. 모든 조건은 옵셔널.
 * 페이징/정렬은 별도 Pageable로 수령. (C-T2 ProductSearchCondition와 동형)
 */
@Getter
@Setter
public class AdminBannerSearchCondition {

    /** title 부분일치 */
    private String q;

    /** 배너 타입 일치 (HERO/CATEGORY/PROMO) */
    private String bannerType;

    /** 노출 여부 (Y/N) */
    private String displayYn;

    /** true면 소프트삭제(use_yn='N') 포함 (결정6, mst_* 한정). 기본 false. */
    private boolean includeDeleted = false;
}
