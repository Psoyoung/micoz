package com.micoz.admin.product.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 옵션 재고 설정 요청 (C-T4). 절대값 설정(증감 아님), 음수 불가. */
@Getter
@Setter
@NoArgsConstructor
public class UpdateStockRequest {

    @NotNull
    @PositiveOrZero
    private Integer stockQty;
}
