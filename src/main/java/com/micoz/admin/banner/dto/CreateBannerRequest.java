package com.micoz.admin.banner.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 배너 등록 요청 (S-T1). title·imageUrl 필수(NOT NULL 컬럼). 나머지는 옵셔널·엔티티 기본값 적용. */
@Getter
@Setter
@NoArgsConstructor
public class CreateBannerRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String imageUrl;

    /** 배너 타입(선택). 미지정 시 HERO. */
    private String bannerType;

    private String description;
    private String linkUrl;

    /** 정렬 순서(선택). 미지정 시 0. */
    private Integer sortOrder;

    /** 노출 여부(Y/N). 미지정 시 Y. */
    private String displayYn;
}
