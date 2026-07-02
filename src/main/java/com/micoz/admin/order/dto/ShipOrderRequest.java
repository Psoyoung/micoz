package com.micoz.admin.order.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 출고 요청 (O-T3). 운송장 번호 필수(§5.3 전제) — 누락 시 @Valid가 전이 전에 400으로 차단. */
@Getter
@Setter
@NoArgsConstructor
public class ShipOrderRequest {

    @NotBlank
    private String trackingNo;
}
