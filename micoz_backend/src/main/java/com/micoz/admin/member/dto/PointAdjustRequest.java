package com.micoz.admin.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 포인트 수동 조정 요청 (M-T5). amount 부호: 양수=적립, 음수=차감(0은 불허). */
@Getter
@Setter
@NoArgsConstructor
public class PointAdjustRequest {

    @NotNull
    private Integer amount;

    @NotBlank
    private String reason;
}
