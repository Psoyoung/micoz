package com.micoz.admin.member.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** role 승강 요청 (M-T6). 허용값: ADMIN | CUSTOMER. */
@Getter
@Setter
@NoArgsConstructor
public class UpdateMemberRoleRequest {

    @NotBlank
    private String role;
}
