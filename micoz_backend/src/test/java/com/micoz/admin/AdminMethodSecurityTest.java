package com.micoz.admin;

import com.micoz.admin.controller.AdminController;
import com.micoz.auth.security.UserPrincipal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * F-T4 메서드 보안 2차 방어 검증.
 * URL 게이팅(F-T3)과 독립적으로 @PreAuthorize가 적용됨을 확인하기 위해,
 * HTTP 필터 체인을 거치지 않고 프록시된 컨트롤러 빈 메서드를 직접 호출한다.
 * SecurityContext는 @WithMockUser로 주입한다.
 */
@SpringBootTest
@ActiveProfiles("test")
class AdminMethodSecurityTest {

    @Autowired
    private AdminController adminController;

    private final UserPrincipal principal = new UserPrincipal(1L, "tester", "ADMIN");

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("ADMIN 권한 → 메서드 호출 통과")
    void adminRoleAllowed() {
        var resp = adminController.me(principal);
        assertThat(resp.getData().getUserId()).isEqualTo("tester");
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    @DisplayName("CUSTOMER 권한 → @PreAuthorize가 AccessDeniedException 던짐 (URL 레이어와 무관)")
    void customerRoleDenied() {
        assertThatThrownBy(() -> adminController.me(principal))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("미인증(SecurityContext 비어있음) → @PreAuthorize가 거부")
    void anonymousDenied() {
        // 인증 객체 자체가 없으면 메서드 보안은 AuthenticationCredentialsNotFoundException을 던진다
        assertThatThrownBy(() -> adminController.me(principal))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }
}
