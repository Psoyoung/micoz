package com.micoz.admin.banner.service;

import com.micoz.admin.banner.dto.AdminBannerDetailResponse;
import com.micoz.admin.banner.dto.AdminBannerListItem;
import com.micoz.admin.banner.dto.AdminBannerSearchCondition;
import com.micoz.admin.banner.dto.BannerCreatedResponse;
import com.micoz.admin.banner.dto.CreateBannerRequest;
import com.micoz.admin.banner.dto.UpdateBannerRequest;
import com.micoz.admin.banner.spec.BannerSpecs;
import com.micoz.banner.entity.Banner;
import com.micoz.banner.repository.BannerRepository;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 관리자 배너 CRUD (S-T1). 목록·다축검색 + 생성 + 전체수정 + 노출토글 + 소프트삭제.
 * C 모듈 관리자 패턴(Specs + SearchCondition + 정렬 화이트리스트 + 소프트삭제 필터)을 그대로 답습한다.
 * 사용자용 {@code BannerService}/{@code findActiveHeroBanners}는 손대지 않는다.
 */
@Service
@RequiredArgsConstructor
public class AdminBannerService {

    private static final String USE_Y = "Y";
    private static final String DEFAULT_TYPE = "HERO";

    /** 정렬 화이트리스트: API 정렬키 → 엔티티 프로퍼티. 미허용 컬럼 정렬은 400. */
    private static final Map<String, String> SORT_WHITELIST = Map.of(
            "sortOrder", "sortOrder",
            "bannerSeq", "bannerSeq",
            "createdDate", "iDate"
    );

    private final BannerRepository bannerRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminBannerListItem> search(AdminBannerSearchCondition condition, Pageable pageable) {
        Specification<Banner> spec = Specification.where(BannerSpecs.titleLike(condition.getQ()))
                .and(BannerSpecs.bannerTypeEq(condition.getBannerType()))
                .and(BannerSpecs.displayYnEq(condition.getDisplayYn()))
                .and(BannerSpecs.activeOnly(condition.isIncludeDeleted()));

        Page<Banner> page = bannerRepository.findAll(spec, sanitizeSort(pageable));
        List<AdminBannerListItem> items = page.getContent().stream()
                .map(b -> AdminBannerListItem.builder()
                        .bannerSeq(b.getBannerSeq())
                        .bannerType(b.getBannerType())
                        .title(b.getTitle())
                        .imageUrl(b.getImageUrl())
                        .sortOrder(b.getSortOrder())
                        .displayYn(b.getDisplayYn())
                        .useYn(b.getUseYn())
                        .build())
                .toList();
        return PageResponse.of(items, page);
    }

    /** 상세(운영 뷰). 직접 seq 조회 — 소프트삭제 배너도 조회 가능. 미존재면 BANNER_NOT_FOUND. */
    @Transactional(readOnly = true)
    public AdminBannerDetailResponse getDetail(Long bannerSeq) {
        Banner b = bannerRepository.findById(bannerSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));
        return AdminBannerDetailResponse.builder()
                .bannerSeq(b.getBannerSeq())
                .bannerType(b.getBannerType())
                .title(b.getTitle())
                .description(b.getDescription())
                .imageUrl(b.getImageUrl())
                .linkUrl(b.getLinkUrl())
                .sortOrder(b.getSortOrder())
                .displayYn(b.getDisplayYn())
                .useYn(b.getUseYn())
                .build();
    }

    @Transactional
    public BannerCreatedResponse create(CreateBannerRequest req) {
        Banner banner = Banner.builder()
                .bannerType(normalizeType(req.getBannerType()))
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .imageUrl(req.getImageUrl().trim())
                .linkUrl(req.getLinkUrl())
                .sortOrder(req.getSortOrder())            // null → 엔티티 기본값 0
                .displayYn(normalizeYn(req.getDisplayYn()))
                .useYn(USE_Y)
                .build();
        return new BannerCreatedResponse(bannerRepository.save(banner).getBannerSeq());
    }

    /** 전체 수정(PUT). 미지정 필드는 기본값으로 정규화(C-T3 답습). 노출값도 재계산되므로 부분 토글은 changeDisplay 사용. */
    @Transactional
    public void update(Long bannerSeq, UpdateBannerRequest req) {
        Banner b = activeBanner(bannerSeq);
        b.updateInfo(
                normalizeType(req.getBannerType()),
                req.getTitle().trim(),
                req.getDescription(),
                req.getImageUrl().trim(),
                req.getLinkUrl(),
                req.getSortOrder() != null ? req.getSortOrder() : 0,
                normalizeYn(req.getDisplayYn()));
    }

    /** 노출 토글(빠른 on/off). */
    @Transactional
    public void changeDisplay(Long bannerSeq, String displayYn) {
        Banner b = activeBanner(bannerSeq);
        b.changeDisplay(normalizeYn(displayYn));
    }

    /** 소프트삭제 — use_yn='N' + display_yn='N'(노출 차단). 단일 트랜잭션(조회+상태변경). */
    @Transactional
    public void delete(Long bannerSeq) {
        Banner b = activeBanner(bannerSeq);
        b.softDelete();
    }

    // 활성 배너 조회 — 미존재/소프트삭제면 BANNER_NOT_FOUND(수정·토글·삭제 대상).
    private Banner activeBanner(Long bannerSeq) {
        return bannerRepository.findById(bannerSeq)
                .filter(b -> USE_Y.equals(b.getUseYn()))
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));
    }

    private String normalizeType(String type) {
        return (type == null || type.isBlank()) ? DEFAULT_TYPE : type.trim();
    }

    private String normalizeYn(String value) {
        return "N".equalsIgnoreCase(value == null ? null : value.trim()) ? "N" : "Y";
    }

    /** 정렬 프로퍼티를 화이트리스트로 검증·치환. 미허용 컬럼이면 400. */
    private Pageable sanitizeSort(Pageable pageable) {
        Sort sort = pageable.getSort();
        if (sort.isUnsorted()) {
            return pageable;
        }
        List<Sort.Order> translated = new ArrayList<>();
        for (Sort.Order order : sort) {
            String mapped = SORT_WHITELIST.get(order.getProperty());
            if (mapped == null) {
                throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST);
            }
            translated.add(new Sort.Order(order.getDirection(), mapped));
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(translated));
    }
}
