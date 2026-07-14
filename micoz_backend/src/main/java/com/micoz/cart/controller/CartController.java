package com.micoz.cart.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.cart.dto.AddCartRequest;
import com.micoz.cart.dto.CartItemResponse;
import com.micoz.cart.dto.CartListResponse;
import com.micoz.cart.dto.UpdateCartQuantityRequest;
import com.micoz.cart.service.CartService;
import com.micoz.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @PostMapping
    public ApiResponse<CartItemResponse> addToCart(@AuthenticationPrincipal UserPrincipal principal,
                                                   @Valid @RequestBody AddCartRequest request) {
        return ApiResponse.success(cartService.addToCart(principal.getUserSeq(), request));
    }

    @GetMapping
    public ApiResponse<CartListResponse> getMyCart(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(cartService.getMyCart(principal.getUserSeq()));
    }

    @PatchMapping("/{cartSeq}")
    public ApiResponse<CartItemResponse> updateQuantity(@AuthenticationPrincipal UserPrincipal principal,
                                                        @PathVariable Long cartSeq,
                                                        @Valid @RequestBody UpdateCartQuantityRequest request) {
        return ApiResponse.success(cartService.updateQuantity(principal.getUserSeq(), cartSeq, request.getQuantity()));
    }

    @DeleteMapping("/{cartSeq}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                    @PathVariable Long cartSeq) {
        cartService.delete(principal.getUserSeq(), cartSeq);
        return ApiResponse.success();
    }
}
