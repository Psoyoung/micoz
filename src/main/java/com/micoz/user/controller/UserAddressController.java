package com.micoz.user.controller;

import com.micoz.auth.security.UserPrincipal;
import com.micoz.common.response.ApiResponse;
import com.micoz.user.dto.AddressResponse;
import com.micoz.user.dto.CreateAddressRequest;
import com.micoz.user.dto.UpdateAddressRequest;
import com.micoz.user.service.UserAddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/me/addresses")
@RequiredArgsConstructor
public class UserAddressController {

    private final UserAddressService userAddressService;

    @GetMapping
    public ApiResponse<List<AddressResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(userAddressService.getMyAddresses(principal.getUserSeq()));
    }

    @PostMapping
    public ApiResponse<AddressResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                               @Valid @RequestBody CreateAddressRequest request) {
        return ApiResponse.success(userAddressService.create(principal.getUserSeq(), request));
    }

    @PatchMapping("/{addressSeq}")
    public ApiResponse<AddressResponse> update(@AuthenticationPrincipal UserPrincipal principal,
                                               @PathVariable Long addressSeq,
                                               @Valid @RequestBody UpdateAddressRequest request) {
        return ApiResponse.success(userAddressService.update(principal.getUserSeq(), addressSeq, request));
    }

    @DeleteMapping("/{addressSeq}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                    @PathVariable Long addressSeq) {
        userAddressService.delete(principal.getUserSeq(), addressSeq);
        return ApiResponse.success();
    }

    @PutMapping("/{addressSeq}/default")
    public ApiResponse<AddressResponse> setDefault(@AuthenticationPrincipal UserPrincipal principal,
                                                   @PathVariable Long addressSeq) {
        return ApiResponse.success(userAddressService.setDefault(principal.getUserSeq(), addressSeq));
    }
}
