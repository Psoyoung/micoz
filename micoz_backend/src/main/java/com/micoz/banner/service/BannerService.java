package com.micoz.banner.service;

import com.micoz.banner.dto.BannerResponse;
import com.micoz.banner.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BannerService {

    private final BannerRepository bannerRepository;

    @Transactional(readOnly = true)
    public List<BannerResponse> getActiveHeroBanners() {
        return bannerRepository.findActiveHeroBanners().stream()
                .map(b -> BannerResponse.builder()
                        .bannerSeq(b.getBannerSeq())
                        .bannerType(b.getBannerType())
                        .title(b.getTitle())
                        .description(b.getDescription())
                        .imageUrl(b.getImageUrl())
                        .linkUrl(b.getLinkUrl())
                        .sortOrder(b.getSortOrder())
                        .build())
                .toList();
    }
}
