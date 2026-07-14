package com.micoz.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * micoz.admin-init.* 설정 바인딩 — 첫 운영 관리자 부트스트랩(F-T1)용.
 * application.yml:
 *   micoz.admin-init.user-id    (기본 admin)
 *   micoz.admin-init.user-name  (기본 운영관리자)
 *   micoz.admin-init.password   (= 환경변수 ADMIN_INIT_PASSWORD, 미설정 시 시드 생략)
 *   micoz.admin-init.email      (선택)
 *
 * 비밀번호는 환경변수로만 주입하며 평문은 코드/로그/마이그레이션/git에 남기지 않는다.
 */
@ConfigurationProperties(prefix = "micoz.admin-init")
public class AdminBootstrapProperties {

    private String userId = "admin";
    private String userName = "운영관리자";
    private String password;
    private String email;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
