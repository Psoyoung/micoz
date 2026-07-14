package com.micoz.admin.product.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 판매상태 변경 요청 (C-T4). 허용값: ON_SALE/LOW_STOCK/SOLD_OUT/STOPPED. */
@Getter
@Setter
@NoArgsConstructor
public class UpdateProductStatusRequest {

    @NotBlank
    private String status;
}
