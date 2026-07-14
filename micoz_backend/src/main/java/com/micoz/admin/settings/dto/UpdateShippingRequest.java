package com.micoz.admin.settings.dto;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 배송 설정 수정 요청 (S-T2). 부분 수정(PATCH) — 제공된 필드만 변경, 미제공(null)은 기존값 유지.
 * 금액 3필드는 제공 시 ≥0 검증(freeShippingMin=0 = 항상 무료 정식 허용, S-Q2). 음수면 400.
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateShippingRequest {

    /** 기본 배송비. 제공 시 ≥0. */
    @PositiveOrZero
    private BigDecimal shippingFee;

    /** 무료배송 기준금액. 제공 시 ≥0 (0 = 항상 무료). */
    @PositiveOrZero
    private BigDecimal freeShippingMin;

    /** 도서산간 추가비. 제공 시 ≥0. */
    @PositiveOrZero
    private BigDecimal remoteExtraFee;

    /** 기본 배송사명(표시용). */
    private String shippingName;

    /** 출고 안내문(표시용). */
    private String shippingNotice;
}
