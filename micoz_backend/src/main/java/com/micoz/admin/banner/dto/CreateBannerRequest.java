package com.micoz.admin.banner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

    // 저장형 XSS 차단(S-2): http/https만 허용 → javascript:/data:/vbscript: 등 위험 스킴 거부. @Pattern은 전체일치.
    @NotBlank
    @Pattern(regexp = "https?://.+", flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "imageUrl은 http 또는 https URL이어야 합니다.")
    private String imageUrl;

    /** 배너 타입(선택). 미지정 시 HERO. */
    private String bannerType;

    private String description;

    // linkUrl은 선택 — null/빈값 허용. http/https 절대 URL 또는 내부 상대경로(/시작).
    // //evil.com(프로토콜-상대)·/\evil.com(백슬래시 우회)은 외부로 나가므로 차단(S-2).
    @Pattern(regexp = "(https?://.+|/([^/\\\\].*)?)?", flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "linkUrl은 http/https URL 또는 내부 상대경로(/로 시작)여야 합니다.")
    private String linkUrl;

    /** 정렬 순서(선택). 미지정 시 0. */
    private Integer sortOrder;

    /** 노출 여부(Y/N). 미지정 시 Y. */
    private String displayYn;
}
