package com.micoz.admin.banner.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 배너 수정 요청 (S-T1, 전체 수정). title·imageUrl 필수. 나머지 필드는 전체 교체(PUT 시맨틱) —
 * 미지정 시 엔티티 기본값(bannerType→HERO, sortOrder→0, displayYn→Y)으로 정규화(C-T3 상품수정 답습).
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateBannerRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String imageUrl;

    private String bannerType;
    private String description;
    private String linkUrl;
    private Integer sortOrder;
    private String displayYn;
}
