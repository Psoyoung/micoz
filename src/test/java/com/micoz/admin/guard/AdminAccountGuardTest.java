package com.micoz.admin.guard;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.user.entity.User;
import com.micoz.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * F-T5 자가 잠금 가드 순수 로직 검증 (컨테이너 불필요, UserRepository는 mock).
 */
@ExtendWith(MockitoExtension.class)
class AdminAccountGuardTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminAccountGuard guard;

    private User admin() {
        return User.builder().userRole("ADMIN").build();
    }

    private User customer() {
        return User.builder().userRole("CUSTOMER").build();
    }

    @Test
    @DisplayName("assertNotSelf: 본인 대상이면 ADMIN_SELF_LOCKOUT")
    void selfBlocked() {
        assertThatThrownBy(() -> guard.assertNotSelf(1L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.ADMIN_SELF_LOCKOUT);
    }

    @Test
    @DisplayName("assertNotSelf: 다른 대상이면 통과")
    void otherAllowed() {
        assertThatCode(() -> guard.assertNotSelf(1L, 2L)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("assertNotLastAdmin: 운영 ADMIN(ROOT 제외) 1명일 때 그 ADMIN 대상이면 ADMIN_LAST_ADMIN_PROTECTED")
    void lastAdminBlocked() {
        when(userRepository.countByUserRoleAndUseYnAndUserIdNot("ADMIN", "Y", "ROOT")).thenReturn(1L);

        assertThatThrownBy(() -> guard.assertNotLastAdmin(admin()))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.ADMIN_LAST_ADMIN_PROTECTED);
    }

    @Test
    @DisplayName("assertNotLastAdmin: 운영 ADMIN(ROOT 제외) 2명 이상이면 통과")
    void notLastAdminAllowed() {
        when(userRepository.countByUserRoleAndUseYnAndUserIdNot("ADMIN", "Y", "ROOT")).thenReturn(2L);

        assertThatCode(() -> guard.assertNotLastAdmin(admin())).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("assertNotLastAdmin: 대상이 관리자가 아니면 카운트 조회 없이 통과")
    void nonAdminTargetAllowed() {
        assertThatCode(() -> guard.assertNotLastAdmin(customer())).doesNotThrowAnyException();
    }
}
