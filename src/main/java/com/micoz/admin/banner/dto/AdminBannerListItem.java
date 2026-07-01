package com.micoz.admin.banner.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

/** 관리자 배너 목록 항목 (S-T1). 운영 뷰(노출/삭제 여부 포함). */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminBannerListItem {

    private Long bannerSeq;
    private String bannerType;
    private String title;
    private String imageUrl;
    private Integer sortOrder;
    private String displayYn;
    private String useYn;
}
