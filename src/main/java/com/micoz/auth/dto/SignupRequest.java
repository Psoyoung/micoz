package com.micoz.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {

    @NotBlank(message = "아이디는 필수입니다.")
    @Size(min = 4, max = 50)
    private String userId;

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, max = 64)
    private String userPw;

    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 100)
    private String userName;

    @Email
    @Size(max = 100)
    private String email;

    @Size(max = 20)
    private String phone;

    @NotBlank(message = "이용약관 동의는 필수입니다.")
    @Size(min = 1, max = 1)
    private String serviceYn;

    @NotBlank(message = "개인정보 수집 동의는 필수입니다.")
    @Size(min = 1, max = 1)
    private String privacyYn;

    @Size(min = 1, max = 1)
    private String marketingYn;

    /** 추천인의 user_id (선택, 입력 시 존재 검증) */
    @Size(max = 50)
    private String referrerUserId;

    @AssertTrue(message = "이용약관에 동의해야 합니다.")
    public boolean isServiceAgreed() {
        return "Y".equals(serviceYn);
    }

    @AssertTrue(message = "개인정보 수집·이용에 동의해야 합니다.")
    public boolean isPrivacyAgreed() {
        return "Y".equals(privacyYn);
    }
}
