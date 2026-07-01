package com.micoz.admin.banner.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

/** 관리자 배너 상세 (S-T1, 편집 폼용 전체 필드). 소프트삭제된 배너도 조회 가능. */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminBannerDetailResponse {

    private Long bannerSeq;
    private String bannerType;
    private String title;
    private String description;
    private String imageUrl;
    private String linkUrl;
    private Integer sortOrder;
    private String displayYn;
    private String useYn;
}
