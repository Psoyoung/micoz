package com.micoz.auth.bootstrap;

import com.micoz.common.config.AdminBootstrapProperties;
import com.micoz.user.entity.User;
import com.micoz.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * 첫 운영 관리자 부트스트랩 (F-T1).
 *
 * 앱 기동 시 1회 실행되며 멱등하다:
 *  1. 로그인 가능한 운영 ADMIN(role=ADMIN, useYn=Y, ROOT 제외)이 이미 있으면 → 아무것도 안 함.
 *  2. 없고 ADMIN_INIT_PASSWORD 주입됨 → BCrypt 해시 생성 후 관리자 1명 시드.
 *  3. 없고 비밀번호 미주입 → 경고 로그만, 앱은 정상 기동(크래시 금지).
 *
 * 보안 불변식:
 *  - 평문 비밀번호는 환경변수로만 주입, DB엔 BCrypt 해시만 저장.
 *  - 로그에 비밀번호/해시 출력 금지(userId만).
 *  - 기존 운영 ADMIN을 절대 덮어쓰지 않음(멱등).
 *  - ROOT(비상용 락드 계정)는 건드리지 않음.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final String ROLE_ADMIN = "ADMIN";
    private static final String USE_Y = "Y";
    private static final String RESERVED_ROOT_ID = "ROOT";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminBootstrapProperties properties;

    @Override
    public void run(ApplicationArguments args) {
        seedAdminIfMissing();
    }

    /**
     * 운영 관리자가 없을 때만 시드. 멱등.
     *
     * @return 새로 생성했으면 true, 건너뛰었으면 false
     */
    @Transactional
    public boolean seedAdminIfMissing() {
        // 1. 이미 운영 ADMIN 존재 → 덮어쓰지 않음
        if (userRepository.existsByUserRoleAndUseYnAndUserIdNot(ROLE_ADMIN, USE_Y, RESERVED_ROOT_ID)) {
            log.info("[AdminBootstrap] 운영 관리자 계정이 이미 존재합니다. 시드를 건너뜁니다.");
            return false;
        }

        // 2. 비밀번호 미주입 → 생성하지 않고 경고(크래시 금지)
        String rawPassword = properties.getPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            log.warn("[AdminBootstrap] 운영 관리자가 없고 ADMIN_INIT_PASSWORD가 설정되지 않았습니다. "
                    + "관리자 로그인을 위해 ADMIN_INIT_PASSWORD 환경변수를 설정한 뒤 재기동하세요.");
            return false;
        }

        // 3. 설정된 관리자 아이디가 이미 사용 중(예: 일반 회원) → 중복 로그인 아이디 방지
        String adminUserId = properties.getUserId();
        if (userRepository.existsActiveByUserId(adminUserId)) {
            log.warn("[AdminBootstrap] 설정된 관리자 아이디('{}')가 이미 사용 중이라 시드를 생략합니다.", adminUserId);
            return false;
        }

        // 4. 시드 생성 (grade_seq=NULL: 관리자는 고객 멤버십 등급 개념 없음 — F1-Q2 확정)
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        User admin = User.builder()
                .userId(adminUserId)
                .userPw(passwordEncoder.encode(rawPassword))
                .userName(properties.getUserName())
                .userRole(ROLE_ADMIN)
                .gradeSeq(null)
                .email(blankToNull(properties.getEmail()))
                .serviceYn("Y")
                .privacyYn("Y")
                .marketingYn("N")
                .serviceAgreeDate(now)
                .privacyAgreeDate(now)
                .pointBalance(0)
                .userStatus("ACTIVE")
                .useYn(USE_Y)
                .referrerUserSeq(null)
                .build();
        userRepository.save(admin);

        log.info("[AdminBootstrap] 운영 관리자 계정을 시드했습니다: userId={} (최초 로그인 후 비밀번호 변경을 권장)",
                adminUserId);
        return true;
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
