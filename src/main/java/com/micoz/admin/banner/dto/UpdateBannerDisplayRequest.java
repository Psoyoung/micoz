package com.micoz.admin.banner.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 배너 노출 토글 요청 (S-T1). display_yn만 빠르게 on/off (C-T4 상품 status/stock PATCH 선례). */
@Getter
@Setter
@NoArgsConstructor
public class UpdateBannerDisplayRequest {

    @NotNull
    @Pattern(regexp = "[YNyn]", message = "displayYn은 Y 또는 N이어야 합니다.")
    private String displayYn;
}
