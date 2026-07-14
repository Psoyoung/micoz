package com.micoz.admin.banner.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** 배너 등록 응답 (S-T1). */
@Getter
@AllArgsConstructor
public class BannerCreatedResponse {
    private final Long bannerSeq;
}
