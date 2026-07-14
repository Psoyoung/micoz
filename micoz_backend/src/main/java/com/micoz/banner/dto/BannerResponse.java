package com.micoz.banner.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BannerResponse {
    private Long bannerSeq;
    private String bannerType;
    private String title;
    private String description;
    private String imageUrl;
    private String linkUrl;
    private Integer sortOrder;
}
