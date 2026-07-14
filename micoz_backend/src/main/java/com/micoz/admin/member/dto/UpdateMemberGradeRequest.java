package com.micoz.admin.member.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 회원 등급 변경 요청 (M-T3). */
@Getter
@Setter
@NoArgsConstructor
public class UpdateMemberGradeRequest {

    @NotBlank
    private String gradeCode;
}
