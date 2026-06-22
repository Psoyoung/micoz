package com.micoz.auth.bootstrap;

import com.micoz.common.config.AdminBootstrapProperties;
import com.micoz.user.entity.User;
import com.micoz.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * F-T1 첫 관리자 부트스트랩 검증.
 * test 프로파일은 ADMIN_INIT_PASSWORD를 설정하지 않으므로 기동 시 러너는 no-op(경고만).
 * 본 테스트는 통제된 비밀번호로 러너 로직을 직접 구동해 검증한다.
 *
 * 아래 비밀번호는 테스트 픽스처(실제 시크릿 아님).
 */
@SpringBootTest
@ActiveProfiles("test")
class AdminBootstrapRunnerTest {

    private static final String TEST_ADMIN_ID = "admin";
    private static final String TEST_ADMIN_PW = "Bootstrap#Test1234";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private AdminBootstrapRunner newRunner(String password) {
        AdminBootstrapProperties props = new AdminBootstrapProperties();
        props.setUserId(TEST_ADMIN_ID);
        props.setUserName("운영관리자");
        props.setPassword(password);
        return new AdminBootstrapRunner(userRepository, passwordEncoder, props);
    }

    @BeforeEach
    void cleanAdmin() {
        // ROOT 외 운영 관리자/테스트 admin 제거로 결정적 시작 상태 보장
        jdbcTemplate.update("DELETE FROM mst_user WHERE user_id = ?", TEST_ADMIN_ID);
    }

    @Test
    @DisplayName("운영 ADMIN 없음 + 비밀번호 주입 → 관리자 1명 시드, 해시 검증")
    void seedsAdminWhenMissing() {
        boolean created = newRunner(TEST_ADMIN_PW).seedAdminIfMissing();

        assertThat(created).isTrue();
        User admin = userRepository.findActiveByUserId(TEST_ADMIN_ID).orElseThrow();
        assertThat(admin.getUserRole()).isEqualTo("ADMIN");
        assertThat(admin.getUseYn()).isEqualTo("Y");
        assertThat(admin.getGradeSeq()).isNull();
        assertThat(admin.getLastLoginDate()).isNull(); // 비번 변경 유도 휴리스틱 전제
        // 평문이 아닌 BCrypt 해시로 저장되었고, 원문과 매칭됨
        assertThat(admin.getUserPw()).startsWith("$2");
        assertThat(admin.getUserPw()).isNotEqualTo(TEST_ADMIN_PW);
        assertThat(passwordEncoder.matches(TEST_ADMIN_PW, admin.getUserPw())).isTrue();
    }

    @Test
    @DisplayName("재실행해도 중복 생성 안 함(멱등)")
    void idempotentOnRerun() {
        AdminBootstrapRunner runner = newRunner(TEST_ADMIN_PW);
        assertThat(runner.seedAdminIfMissing()).isTrue();
        String hashAfterFirst = userRepository.findActiveByUserId(TEST_ADMIN_ID).orElseThrow().getUserPw();

        boolean secondRun = newRunner(TEST_ADMIN_PW).seedAdminIfMissing();

        assertThat(secondRun).isFalse();
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM mst_user WHERE user_id = ?", Integer.class, TEST_ADMIN_ID);
        assertThat(count).isEqualTo(1);
        // 비밀번호 불변(덮어쓰기 없음)
        assertThat(userRepository.findActiveByUserId(TEST_ADMIN_ID).orElseThrow().getUserPw())
                .isEqualTo(hashAfterFirst);
    }

    @Test
    @DisplayName("비밀번호 미주입 → 생성 안 함, 예외 없이 통과")
    void skipsWhenPasswordMissing() {
        boolean created = newRunner("  ").seedAdminIfMissing();

        assertThat(created).isFalse();
        assertThat(userRepository.findActiveByUserId(TEST_ADMIN_ID)).isEmpty();
    }

    @Test
    @DisplayName("이미 운영 ADMIN 존재 → 새로 만들지 않음")
    void skipsWhenOperationalAdminExists() {
        // 다른 아이디의 운영 ADMIN을 선점
        jdbcTemplate.update(
                "INSERT INTO mst_user (user_id, user_pw, user_name, user_role, user_status, "
                        + "service_yn, privacy_yn, use_yn, i_user) "
                        + "VALUES ('ops01', '$2a$12$placeholderhashplaceholderhashplaceholderhashpl', "
                        + "'운영자', 'ADMIN', 'ACTIVE', 'Y', 'Y', 'Y', 'TEST')");
        try {
            boolean created = newRunner(TEST_ADMIN_PW).seedAdminIfMissing();

            assertThat(created).isFalse();
            assertThat(userRepository.findActiveByUserId(TEST_ADMIN_ID)).isEmpty();
        } finally {
            jdbcTemplate.update("DELETE FROM mst_user WHERE user_id = 'ops01'");
        }
    }
}
