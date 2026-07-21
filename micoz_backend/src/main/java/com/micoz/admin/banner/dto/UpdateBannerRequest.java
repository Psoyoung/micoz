package com.micoz.admin.banner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

    // 저장형 XSS 차단(S-2): http/https만 허용 → javascript:/data:/vbscript: 등 위험 스킴 거부. @Pattern은 전체일치.
    @NotBlank
    @Pattern(regexp = "https?://.+", flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "imageUrl은 http 또는 https URL이어야 합니다.")
    private String imageUrl;

    private String bannerType;
    private String description;

    // linkUrl은 선택 — null/빈값 허용. http/https 절대 URL 또는 내부 상대경로(/시작).
    // //evil.com(프로토콜-상대)·/\evil.com(백슬래시 우회)은 외부로 나가므로 차단(S-2).
    @Pattern(regexp = "(https?://.+|/([^/\\\\].*)?)?", flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "linkUrl은 http/https URL 또는 내부 상대경로(/로 시작)여야 합니다.")
    private String linkUrl;
    private Integer sortOrder;
    private String displayYn;
}
