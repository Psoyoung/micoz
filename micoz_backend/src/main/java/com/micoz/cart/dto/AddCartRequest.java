package com.micoz.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AddCartRequest {

    @NotNull(message = "상품을 선택해주세요.")
    private Long productSeq;

    /** 옵션 필수 상품은 미입력 시 CART_OPTION_REQUIRED */
    private Long optionSeq;

    @NotNull
    @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
    private Integer quantity;
}
