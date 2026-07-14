package com.micoz.admin.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 관리자 계정 추가 요청 (F-T6). */
@Getter
@Setter
@NoArgsConstructor
public class CreateAdminRequest {

    @NotBlank
    private String userId;

    @NotBlank
    private String userPw;

    @NotBlank
    private String userName;

    @Email
    private String email;
}
