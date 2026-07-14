package com.micoz.order.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PayOrderRequest {

    /** CARD / KAKAO / NAVER */
    @NotBlank
    private String paymentType;

    /** 카드번호 전체 (서버에서 마스킹) */
    private String cardNo;

    private Integer installment;
}
