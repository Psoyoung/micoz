package com.micoz.favorite.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.common.response.PageResponse;
import com.micoz.favorite.dto.ToggleFavResponse;
import com.micoz.favorite.service.FavoriteService;
import com.micoz.product.dto.ProductListItem;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/{productSeq}")
    public ApiResponse<ToggleFavResponse> toggle(@AuthenticationPrincipal UserPrincipal principal,
                                                 @PathVariable Long productSeq) {
        return ApiResponse.success(favoriteService.toggle(principal.getUserSeq(), productSeq));
    }

    @DeleteMapping("/{productSeq}")
    public ApiResponse<Void> remove(@AuthenticationPrincipal UserPrincipal principal,
                                    @PathVariable Long productSeq) {
        favoriteService.remove(principal.getUserSeq(), productSeq);
        return ApiResponse.success();
    }

    @GetMapping
    public ApiResponse<PageResponse<ProductListItem>> getMyFavorites(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "productSeq", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.success(favoriteService.getMyFavorites(principal.getUserSeq(), pageable));
    }
}
