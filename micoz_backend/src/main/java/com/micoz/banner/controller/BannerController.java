package com.micoz.banner.controller;

import com.micoz.banner.dto.BannerResponse;
import com.micoz.banner.service.BannerService;
import com.micoz.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/banners")
@RequiredArgsConstructor
public class BannerController {

    private final BannerService bannerService;

    @GetMapping
    public ApiResponse<List<BannerResponse>> getBanners() {
        return ApiResponse.success(bannerService.getActiveHeroBanners());
    }
}
