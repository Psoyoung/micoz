package com.micoz.admin.member.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 관리자 회원 등록 요청 (M-T4). 비밀번호는 요청 바디로만 받고 즉시 BCrypt 해시(M-Q4 (a)). */
@Getter
@Setter
@NoArgsConstructor
public class CreateMemberRequest {

    @NotBlank
    private String userId;

    @NotBlank
    private String userPw;

    @NotBlank
    private String userName;

    /** 미지정 시 MEMBER. */
    private String gradeCode;

    private String email;

    private String phone;
}
