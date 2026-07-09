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
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 관리자 계정 추가/목록/상태(활성·비활성) 관리 (FR-ADM-10, F-T6).
 * 자가 잠금/마지막 ADMIN 보호는 AdminAccountGuard로 위임.
 * role 승강(ADMIN↔CUSTOMER) 및 하드/소프트 삭제 API는 본 task 범위 밖(F6-Q1/Q2 확정).
 */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final String ROLE_ADMIN = "ADMIN";

    /**
     * 허용 정렬 필드(API 키 → User 엔티티 속성). <b>목록 노출 컬럼만</b> — {@code userPw} 등 민감/내부 컬럼 제외.
     * M~D 도메인 정렬 화이트리스트 표준 답습(빚 #12 해소). 미허용 키는 400 {@code COMMON_INVALID_REQUEST}.
     */
    private static final Map<String, String> SORT_WHITELIST = Map.of(
            "userSeq", "userSeq",
            "userId", "userId",
            "userName", "userName",
            "email", "email",
            "userStatus", "userStatus",
            "useYn", "useYn",
            "lastLoginDate", "lastLoginDate",
            "pointBalance", "pointBalance");

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
        Page<User> page = userRepository.findByUserRole(ROLE_ADMIN, sanitizeSort(pageable));
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

    /** 정렬 화이트리스트 검증 — 미허용 키는 COMMON_INVALID_REQUEST(400). AdminOrderQueryService 등 표준 답습. */
    private Pageable sanitizeSort(Pageable pageable) {
        Sort sort = pageable.getSort();
        if (sort.isUnsorted()) {
            return pageable;
        }
        List<Sort.Order> translated = new ArrayList<>();
        for (Sort.Order order : sort) {
            String mapped = SORT_WHITELIST.get(order.getProperty());
            if (mapped == null) {
                throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST);
            }
            translated.add(new Sort.Order(order.getDirection(), mapped));
        }
        return org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(), pageable.getPageSize(), Sort.by(translated));
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
