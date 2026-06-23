package com.micoz.admin.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 관리자 활성/비활성 변경 요청 (F-T6). true=활성(useYn=Y), false=비활성(useYn=N). */
@Getter
@Setter
@NoArgsConstructor
public class UpdateAdminStatusRequest {

    @NotNull
    private Boolean active;
}
