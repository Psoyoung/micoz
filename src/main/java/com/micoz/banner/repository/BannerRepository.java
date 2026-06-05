package com.micoz.banner.repository;

import com.micoz.banner.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Long> {

    List<Banner> findAllByBannerTypeAndUseYnAndDisplayYnOrderBySortOrderAsc(String bannerType, String useYn, String displayYn);

    default List<Banner> findActiveHeroBanners() {
        return findAllByBannerTypeAndUseYnAndDisplayYnOrderBySortOrderAsc("HERO", "Y", "Y");
    }
}
