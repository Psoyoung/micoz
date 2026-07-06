package com.micoz.admin.inquiry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 답변 등록 요청 (CS-T3, CS-Q⑤). content만 사용자 입력 — admin_seq는 인증 관리자에서 주입(바디 아님). */
@Getter
@Setter
@NoArgsConstructor
public class CreateReplyRequest {

    @NotBlank
    @Size(max = 2000)
    private String content;
}
