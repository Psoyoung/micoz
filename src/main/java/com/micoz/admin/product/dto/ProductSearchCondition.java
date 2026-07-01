package com.micoz.admin.product.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 상품 목록·다축 검색 조건 (C-T2). 쿼리 파라미터 → @ModelAttribute 바인딩.
 * 모든 조건은 옵셔널. 페이징/정렬은 별도 Pageable로 수령. (M-T1 MemberSearchCondition와 동형)
 */
@Getter
@Setter
public class ProductSearchCondition {

    /** productCode 또는 productName 부분일치 */
    private String q;

    /** productCode 부분일치 */
    private String productCode;

    /** 카테고리 일치 */
    private Long categorySeq;

    /** 노출 여부 (Y/N) */
    private String displayYn;

    /** 판매상태 (ON_SALE/LOW_STOCK/SOLD_OUT/STOPPED) */
    private String status;

    /** true면 소프트삭제(use_yn='N') 포함 (결정6, mst_* 한정). 기본 false. */
    private boolean includeDeleted = false;
}
