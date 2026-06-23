package com.micoz.admin.guard;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.user.entity.User;
import com.micoz.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 관리자 자가 잠금 방지 가드 (F-T5).
 * 관리자 계정 상태/권한 변경 시 운영 사고(자기 강등·마지막 관리자 비활성화)를 막는다.
 * 본인 비밀번호 변경은 차단 대상이 아니다(Q4-2). 엔드포인트 연결은 F-T6.
 */
@Component
@RequiredArgsConstructor
public class AdminAccountGuard {

    private static final String ROLE_ADMIN = "ADMIN";
    private static final String USE_Y = "Y";

    private final UserRepository userRepository;

    /** 본인 계정을 대상으로 한 변경 차단 (자기 강등/비활성화 방지). */
    public void assertNotSelf(Long actingAdminSeq, Long targetSeq) {
        if (actingAdminSeq != null && actingAdminSeq.equals(targetSeq)) {
            throw new BusinessException(ErrorCode.ADMIN_SELF_LOCKOUT);
        }
    }

    /** 대상이 마지막 활성 ADMIN이면 변경 차단 (시스템 락아웃 방지). 대상이 관리자가 아니면 무관. */
    public void assertNotLastAdmin(User target) {
        if (!ROLE_ADMIN.equals(target.getUserRole())) {
            return;
        }
        long activeAdmins = userRepository.countByUserRoleAndUseYn(ROLE_ADMIN, USE_Y);
        if (activeAdmins <= 1) {
            throw new BusinessException(ErrorCode.ADMIN_LAST_ADMIN_PROTECTED);
        }
    }
}
