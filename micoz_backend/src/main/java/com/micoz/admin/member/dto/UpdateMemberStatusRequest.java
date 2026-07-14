package com.micoz.admin.member.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 회원 운영 상태 변경 요청 (M-T3). 허용값: ACTIVE/DORMANT/SUSPENDED. */
@Getter
@Setter
@NoArgsConstructor
public class UpdateMemberStatusRequest {

    @NotBlank
    private String status;
}
