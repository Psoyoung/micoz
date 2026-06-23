package com.micoz.admin.user.service;

import com.micoz.admin.guard.AdminAccountGuard;
import com.micoz.admin.user.dto.AdminCreatedResponse;
import com.micoz.admin.user.dto.AdminListItem;
import com.micoz.admin.user.dto.CreateAdminRequest;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.user.entity.User;
import com.micoz.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * 관리자 계정 추가/목록/상태(활성·비활성) 관리 (FR-ADM-10, F-T6).
 * 자가 잠금/마지막 ADMIN 보호는 AdminAccountGuard로 위임.
 * role 승강(ADMIN↔CUSTOMER) 및 하드/소프트 삭제 API는 본 task 범위 밖(F6-Q1/Q2 확정).
 */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final String ROLE_ADMIN = "ADMIN";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminAccountGuard adminAccountGuard;

    @Transactional
    public AdminCreatedResponse createAdmin(CreateAdminRequest request) {
        if (userRepository.existsActiveByUserId(request.getUserId())) {
            throw new BusinessException(ErrorCode.USER_DUPLICATED_ID);
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        User admin = User.builder()
                .userId(request.getUserId())
                .userPw(passwordEncoder.encode(request.getUserPw()))
                .userName(request.getUserName())
                .userRole(ROLE_ADMIN)
                .gradeSeq(null)
                .email(blankToNull(request.getEmail()))
                .serviceYn("Y")
                .privacyYn("Y")
                .marketingYn("N")
                .serviceAgreeDate(now)
                .privacyAgreeDate(now)
                .pointBalance(0)
                .userStatus("ACTIVE")
                .useYn("Y")
                .referrerUserSeq(null)
                .build();
        User saved = userRepository.save(admin);
        return new AdminCreatedResponse(saved.getUserSeq(), saved.getUserId());
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminListItem> list(Pageable pageable) {
        Page<User> page = userRepository.findByUserRole(ROLE_ADMIN, pageable);
        List<AdminListItem> items = page.getContent().stream()
                .map(u -> new AdminListItem(
                        u.getUserSeq(), u.getUserId(), u.getUserName(), u.getEmail(),
                        u.getUserStatus(), u.getUseYn(), u.getLastLoginDate()))
                .toList();
        return PageResponse.of(items, page);
    }

    /**
     * 관리자 활성/비활성 변경.
     * - 본인 계정 변경 차단(자가 잠금)
     * - 비활성화 시 마지막 ADMIN 보호(방어적; 실질적으로 self-lockout으로 흡수)
     */
    @Transactional
    public void updateStatus(Long actingAdminSeq, Long targetSeq, boolean active) {
        User target = userRepository.findById(targetSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!ROLE_ADMIN.equals(target.getUserRole())) {
            // 관리자 관리 엔드포인트 — 비관리자 대상은 노출하지 않음
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        adminAccountGuard.assertNotSelf(actingAdminSeq, targetSeq);
        if (!active) {
            adminAccountGuard.assertNotLastAdmin(target);
        }
        target.changeActivation(active);
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
