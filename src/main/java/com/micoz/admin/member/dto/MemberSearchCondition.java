package com.micoz.admin.member.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * 회원 목록·다축 검색 조건 (M-T1). 쿼리 파라미터 → @ModelAttribute 바인딩.
 * 모든 조건은 옵셔널. 페이징/정렬은 별도 Pageable로 수령.
 */
@Getter
@Setter
public class MemberSearchCondition {

    /** userId 또는 userName 부분일치 */
    private String q;

    /** userId 부분일치 */
    private String userId;

    /** userName 부분일치 */
    private String userName;

    /** 등급 코드 (MEMBER/SELLER/MASTER/SENIOR/EXECUTIVE) */
    private String gradeCode;

    /** 운영 상태 (ACTIVE/DORMANT/SUSPENDED) */
    private String status;

    /** 가입일(i_date) ≥ */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate joinedFrom;

    /** 가입일(i_date) ≤ (해당일 끝까지 포함) */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate joinedTo;

    /** true면 소프트삭제(use_yn='N') 포함 (결정6, mst_* 한정). 기본 false. */
    private boolean includeDeleted = false;
}
