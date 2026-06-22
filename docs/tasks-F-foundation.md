# MICOZ M7 — F. Foundation task 분할

> **전제**: `docs/foundation-decisions.md` 6개 항목 확정(2026-06-22). 본 문서는 F 모듈을
> 독립적으로 테스트·커밋 가능한 단위로 분할한 것. **구현은 본 문서 리뷰 후 시작.**
>
> ⚠️ **F 모듈 전체가 인증·권한 영역이므로 모든 task는 `[수동리뷰 필수]`.**
> 각 task 완료 후 자동 검증(단위테스트 + build + 실제 요청)에 더해 **사람 코드리뷰를 거친 뒤**
> 커밋한다. 보안 회귀(권한 우회/토큰 오발급/평문 노출)는 자동 테스트만으로 못 잡는다.
>
> **공통 검증 절차 (모든 task 공통)**: ① 단위/통합 테스트 작성·통과 → ② `./gradlew build` (또는
> `docker compose up -d --build`) → ③ 실제 HTTP 요청(curl)로 시나리오 E2E → ④ 회귀 스모크
> (기존 사용자 측 인증/카탈로그 핵심 1~2개) → ⑤ **사람 리뷰**.

---

## 의존성 그래프

```
F-T1 부트스트랩 (실제 로그인되는 ADMIN 1개 확보)   ← 최우선, 나머지 전부의 전제
   │
   ▼
F-T2 관리자 로그인 엔드포인트 + role 게이트         (admin access token 확보)
   │
   ▼
F-T3 SecurityConfig /api/v1/admin/** URL 게이팅     (probe로 401/403/200 검증)
   │
   ▼
F-T4 @EnableMethodSecurity + @PreAuthorize 2차 방어  (defense-in-depth)

F-T5 자가 잠금 가드 컴포넌트 + 에러코드 2개          ← F-T1 외 의존 없음(순수 추가+단위테스트). F-T6에서 소비
   │
   ▼
F-T6 관리자 계정 추가/상태 관리 API                  (F-T1·F-T3·F-T4·F-T5 의존)
```

권장 순서: **F-T1 → F-T2 → F-T3 → F-T4 → (F-T5 병렬 가능) → F-T6**

---

## F-T1. 첫 관리자 부트스트랩 (기동 시 환경변수 기반 시드) `[수동리뷰 필수]`

**이게 끝나야 F-T2 이후 모든 task의 검증이 가능하다 (실제 로그인되는 관리자 부재 시 검증 불가).**

### 범위
- `common/config/AdminBootstrapProperties.java` — `@ConfigurationProperties("micoz.admin-init")`
  - `userId`(기본값 예: `admin`), `userName`, `password`(= 환경변수 `ADMIN_INIT_PASSWORD` 주입), `email`(선택)
- `auth/bootstrap/AdminBootstrapRunner.java` — `ApplicationRunner` (또는 `@EventListener(ApplicationReadyEvent)`)
  - 기동 시 1회 실행, **멱등**:
    1. 로그인 가능한 운영 ADMIN 존재 여부 확인
       (= `user_role='ADMIN'` AND `useYn='Y'` AND `user_id != 'ROOT'` 1건 이상)
    2. 존재하면 → **아무 것도 안 함** (로그만)
    3. 없으면 → `ADMIN_INIT_PASSWORD`가 주입되었는지 확인
       - 주입됨: `passwordEncoder.encode(password)`로 BCrypt(12) 해시 생성 후 ADMIN 계정 1개 insert
         (grade=EXECUTIVE 또는 정책 등급, `userStatus='ACTIVE'`, `useYn='Y'`, `referrerUserSeq=null`)
       - 미주입: **계정 생성하지 않고 경고 로그** (앱은 정상 기동 — 크래시 금지)
- `.env.example`에 `ADMIN_INIT_PASSWORD=` placeholder 추가 (값 비움). `.env`는 gitignore 유지.
- ROOT 계정(V3)은 **건드리지 않음** — 비상용 락드 상태 유지.

### 보안 불변식 (리뷰 체크포인트)
- **평문 비밀번호가 코드/로그/마이그레이션/git 어디에도 남지 않음** — env로만 주입, 해시만 DB 저장.
- 부트스트랩 로그에 비밀번호/해시 출력 금지 (userId만 로그).
- 이미 운영 ADMIN이 있으면 절대 덮어쓰지 않음(멱등) — 운영 계정 password reset 사고 방지.

### 완료 기준
- **단위/통합 테스트**:
  - `AdminBootstrapRunnerTest` (Testcontainers): (a) ADMIN 없을 때 + 패스워드 주입 시 1건 생성 +
    `passwordEncoder.matches(rawPassword, savedHash)`=true 검증, (b) 재기동(러너 재실행) 시 중복 생성 안 됨(멱등),
    (c) 패스워드 미주입 시 생성 안 됨 + 예외 없이 통과, (d) 기존 운영 ADMIN 존재 시 새로 안 만듦.
- **build**: `./gradlew build` BUILD SUCCESSFUL.
- **실제 요청 검증**:
  1. `ADMIN_INIT_PASSWORD=<test_pw>`로 컨테이너 기동 → 로그에 "운영 관리자 시드 생성: admin" 1회.
  2. DB 조회: `SELECT user_id,user_role,use_yn FROM mst_user WHERE user_role='ADMIN'` →
     ROOT + admin 2행, admin의 `user_pw`가 `$2a$12$`로 시작(BCrypt).
  3. **이 task의 핵심 완료 기준** = 다음 단계(F-T2) 구현 전이라도, 임시로 기존 `/api/v1/auth/login`에
     admin/`<test_pw>` 호출 시 토큰 발급됨을 확인 → **"실제로 로그인되는 관리자 1개 확보" 입증.**
     (F-T2에서 별도 엔드포인트로 이관하더라도, 자격증명 자체가 유효함을 여기서 못 박는다.)
  4. 재기동 → admin 행 그대로(중복 없음, password 불변).

### 의존성
- 없음 (F 모듈 시작점). 기존 `PasswordEncoder` 빈, `UserRepository`, `UserGradeRepository` 재사용.

### 위험도
- **높음** — 평문 누설/계정 덮어쓰기/기동 실패 모두 운영 직격. 멱등성·env-only·no-crash 3원칙이 핵심.

### 확인 필요
- **F1-Q1.** "첫 로그인 후 비번 변경 유도" 구현 방식:
  현재 `mst_user`에 비번 변경 강제 플래그 컬럼 **없음** (`last_login_date`, `user_status`만 존재).
  - (a) **무스키마 휴리스틱**: 로그인 응답에 `passwordChangeRecommended = (last_login_date IS NULL)` 포함.
    마이그레이션 0, 단 "한 번도 로그인 안 한 모든 계정"에 동일 적용(부정확).
  - (b) **신규 컬럼**: V9로 `mst_user.pwd_init_yn CHAR(1) DEFAULT 'N'` 추가, 부트스트랩 시 'Y',
    비번 변경 시 'N'. 정확하지만 스키마 변경.
  - **추천: (a)** — F 범위 최소화. 강제(force)가 아니라 "유도"이므로 응답 플래그로 충분.
    → **어느 쪽으로 갈지 결정 요청.**
- **F1-Q2.** 시드 관리자의 `user_id` 고정값(`admin`) / 등급(EXECUTIVE 가정) 확정 여부.

---

## F-T2. 별도 관리자 로그인 엔드포인트 + 내부 role 게이트 `[수동리뷰 필수]`

### 범위
- `auth/controller/AdminAuthController.java` — `POST /api/v1/admin/auth/login`
- `AuthService.adminLogin(LoginRequest, HttpServletRequest)` (또는 별도 `AdminAuthService`):
  - 기존 `login()` 자격증명 검증 흐름 재사용 (BCrypt matches + dummy hash 시간차 최소화, NFR-07)
  - **내부 role 게이트**: 자격증명이 맞아도 `user.userRole != 'ADMIN'`이면 `AUTH_INVALID_CREDENTIALS`
    (존재/권한 여부 비노출 — 일반 사용자가 관리자 로그인 시도해도 동일 응답)
  - 성공 시 기존과 동일하게 access(JWT, role=ADMIN 클레임) + refresh(SHA-256 해시 저장) 발급
- `auth/controller/AdminAuthController` 또는 별도 probe: `GET /api/v1/admin/me`
  (현재 관리자 식별 정보 반환 — F-T3/F-T4 검증 test vehicle 겸용. UserPrincipal 재사용)
- `application.yml` CORS: `micoz.com/admin` 동일 출처이므로 기존 `CORS_ALLOWED_ORIGINS` 정책 그대로 (분기 없음).

### 완료 기준
- **단위/통합 테스트**:
  - admin 계정 로그인 → 200 + access/refresh + role 클레임=ADMIN.
  - **CUSTOMER 계정으로 `/api/v1/admin/auth/login` → `AUTH_INVALID_CREDENTIALS`** (role 게이트).
  - 존재하지 않는 ID → `AUTH_INVALID_CREDENTIALS` (동일 응답, NFR-07).
  - (시간차) 존재 CUSTOMER vs 미존재 ID 응답 형태/코드 동일.
- **build**: 통과.
- **실제 요청 검증**:
  1. `POST /api/v1/admin/auth/login {admin, <pw>}` → 토큰 + role=ADMIN (jwt.io 디코드 확인).
  2. 동일 엔드포인트에 일반 사용자 계정 → 401 `AUTH_INVALID_CREDENTIALS`.
  3. 발급 admin access로 `GET /api/v1/admin/me` → 200 (단, F-T3 게이팅 전이라 인증만 되면 통과 — F-T3에서 강화).
- **회귀**: 기존 `POST /api/v1/auth/login` 사용자 로그인 정상.

### 의존성
- **F-T1** (로그인 가능한 ADMIN 필요).

### 위험도
- **중** — role 게이트 누락 시 일반 사용자가 관리자 토큰 영역 진입. 게이트 분기 + 동일응답이 핵심.

---

## F-T3. SecurityConfig `/api/v1/admin/**` URL 레벨 게이팅 `[수동리뷰 필수]`

### 범위
- `common/config/SecurityConfig` 개정:
  - `/api/v1/admin/auth/login`은 **permitAll** (로그인 자체는 비인증 진입)
  - 그 외 `/api/v1/admin/**` → `.hasRole("ADMIN")` (= `ROLE_ADMIN` authority. 필터가 `ROLE_` prefix 부여 중 — 확인됨)
  - 기존 사용자 측 매칭(auth/**, 카탈로그 GET, actuator 등) 순서·우선순위 보존
- 매칭 순서 주의: 더 구체적인 `/api/v1/admin/auth/login` permitAll을 `/api/v1/admin/**` hasRole보다 **먼저** 선언.

### 완료 기준
- **단위/통합 테스트** (MockMvc + Testcontainers 또는 @SpringBootTest):
  - 토큰 없이 `GET /api/v1/admin/me` → **401** `AUTH_UNAUTHORIZED`.
  - CUSTOMER 토큰으로 `GET /api/v1/admin/me` → **403** `AUTH_FORBIDDEN`.
  - ADMIN 토큰으로 `GET /api/v1/admin/me` → **200**.
  - `/api/v1/admin/auth/login`은 토큰 없이도 접근 가능(401 아님).
- **build**: 통과.
- **실제 요청 검증**: 위 3종(무토큰/CUSTOMER/ADMIN)을 curl로 각각 401/403/200 확인.
- **회귀**: 사용자 측 보호 엔드포인트(예: `/api/v1/me`, `/api/v1/cart`)가 CUSTOMER 토큰으로 여전히 200;
  사용자 토큰이 admin 경로에서 403으로 정확히 막히는지 동시 확인.

### 의존성
- **F-T2** (admin/CUSTOMER 양쪽 토큰과 probe 엔드포인트 필요).

### 위험도
- **높음** — SecurityConfig 매칭 순서 실수 시 전체 권한 체계 붕괴. 매칭 우선순위가 핵심 리뷰 포인트.

---

## F-T4. `@EnableMethodSecurity` 활성화 + `@PreAuthorize` 2차 방어 `[수동리뷰 필수]`

### 범위
- `common/config/SecurityConfig`(또는 별도 `MethodSecurityConfig`)에 `@EnableMethodSecurity` 추가.
- 관리자 컨트롤러(현재 `AdminAuthController` 등)에 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")` 적용
  (단 `/api/v1/admin/auth/login` 메서드는 제외 — `@PreAuthorize` 미부착 또는 permitAll 유지).
  → URL 게이팅(F-T3)과 **이중 방어(defense-in-depth)**. F-T6 이후 모든 관리자 컨트롤러의 표준.

### 완료 기준
- **단위/통합 테스트**:
  - `@SpringBootTest` + `@WithMockUser(roles = "CUSTOMER")`로 probe 메서드 호출 → 403/AccessDenied.
  - `@WithMockUser(roles = "ADMIN")` → 통과.
  - **메서드 보안 단독 검증**: 메서드 보안 슬라이스 테스트로 `@PreAuthorize`가 실제 적용됨을 확인
    (URL 레이어와 무관하게 method invocation 레벨에서 거부되는지).
- **build**: 통과.
- **실제 요청 검증**: F-T3 시나리오(401/403/200) 재확인 — 외형 동일하나 2차 방어가 추가됨을 코드/로그로 확인.
- **회귀**: 사용자 측 컨트롤러에는 `@PreAuthorize` 미적용 → 기존 동작 무변화 확인.

### 의존성
- **F-T3** (probe 엔드포인트 + 게이팅 기반 위에 2차 방어 추가).

### 위험도
- **중** — 잘못 적용 시 정상 관리자도 차단되거나, 누락 시 2차 방어 공백.
- ⚠️ **테스트 한계 명시**: URL 레이어(F-T3)가 이미 차단하므로 실제 HTTP만으로는 F-T4 단독 효과를
  구분 불가. 그래서 **메서드 보안 슬라이스/`@WithMockUser` 테스트로 독립 검증**한다(위 완료 기준).

### 확인 필요
- **F4-Q1.** 2차 방어를 (a) 컨트롤러 클래스 레벨 일괄 `@PreAuthorize` vs (b) 서비스 메서드 레벨까지
  내릴지. **추천: (a) 컨트롤러 레벨** (현 단일 ADMIN 단계에선 충분, 서비스 레벨은 RBAC 세분화 시).

---

## F-T5. 자가 잠금 방지 가드 + 신규 에러코드 2개 `[수동리뷰 필수]`

### 범위
- `common/response/ErrorCode`에 추가:
  ```java
  ADMIN_SELF_LOCKOUT(HttpStatus.CONFLICT, "본인 계정의 권한/상태를 변경할 수 없습니다."),
  ADMIN_LAST_ADMIN_PROTECTED(HttpStatus.CONFLICT, "마지막 관리자 계정은 권한/상태를 변경할 수 없습니다."),
  ```
- `auth/admin/AdminAccountGuard.java` (또는 service 내부 private) — 재사용 가능한 가드:
  - `assertNotSelf(actingAdminSeq, targetSeq)` → 같으면 `ADMIN_SELF_LOCKOUT`
  - `assertNotLastAdmin(targetUser)` → target이 ADMIN인데 활성 ADMIN 수 ≤ 1이면 `ADMIN_LAST_ADMIN_PROTECTED`
- `UserRepository`에 `countByUserRoleAndUseYn("ADMIN","Y")` 파생 쿼리 추가.
- 적용 대상(논리): 본인 role 변경 / 본인 소프트삭제 / 본인 비활성화(`userStatus`) / 마지막 ADMIN 강등·삭제.
  - **본인 비밀번호 변경은 차단 대상 아님**(확정 Q4-2) — 가드 미적용.
- 본 task는 **가드 컴포넌트 + 에러코드 + 단위테스트까지**. 실제 엔드포인트 연결은 F-T6.

### 완료 기준
- **단위 테스트** (가드 순수 로직, 컨테이너 불필요):
  - `assertNotSelf`: 동일 seq → `ADMIN_SELF_LOCKOUT`, 다른 seq → 통과.
  - `assertNotLastAdmin`: 활성 ADMIN 1명일 때 그 ADMIN 대상 → `ADMIN_LAST_ADMIN_PROTECTED`;
    2명 이상이면 통과; target이 CUSTOMER면 통과(해당 없음).
  - `GlobalExceptionHandler`가 두 신규 코드를 409로 매핑하는지(기존 BusinessException 경로 재사용 확인).
- **build**: 통과.
- **실제 요청 검증**: 본 task 단독으로는 호출 엔드포인트 없음 → **F-T6에서 E2E**. 여기서는
  단위테스트 그린 + 에러코드 enum 노출 확인까지.

### 의존성
- **F-T1** (ADMIN 존재 전제). 그 외 독립 — F-T2/F-T3/F-T4와 **병렬 가능**.

### 위험도
- **중** — 카운트 경합(동시 강등) 가능성. 단일 트랜잭션 내 검사+변경으로 처리(필요 시 행 잠금은 F-T6에서 검토).

---

## F-T6. 관리자 계정 추가/상태 관리 API `[수동리뷰 필수]`

### 범위 (FR-ADM-10)
- `admin/user/controller/AdminUserController.java` (`@PreAuthorize("hasRole('ADMIN')")`):
  - `POST   /api/v1/admin/admins` — 관리자 계정 추가 (userId/userName/password/email)
  - `GET    /api/v1/admin/admins` — 관리자 목록 (페이징; 단순 목록이면 파생쿼리, 검색 다축은 M의 Specification 패턴 예고만)
  - `PATCH  /api/v1/admin/admins/{userSeq}/status` — 활성/비활성(`userStatus`) 또는 `useYn` 토글
  - `PATCH  /api/v1/admin/admins/{userSeq}/role` — role 변경(ADMIN↔CUSTOMER 강등/승격) *(범위 확인: F6-Q1)*
- `admin/user/service/AdminUserService.java`:
  - 계정 추가: userId 중복 시 `USER_DUPLICATED_ID`, BCrypt(12) 해시, role=ADMIN, grade 정책값.
  - 상태/role 변경: **F-T5 가드 적용** — `assertNotSelf` + `assertNotLastAdmin`.
  - 모든 변경은 `AuditorAwareImpl`로 `u_user`=실행 관리자 user_id 자동 기록(확인됨).
- DTO: `CreateAdminRequest`(검증 애너테이션) / `AdminListItem` / `UpdateAdminStatusRequest` / `UpdateAdminRoleRequest`.

### 완료 기준
- **통합 테스트** (Testcontainers, ADMIN 토큰 기반 E2E):
  - 계정 추가 → 200 + 새 ADMIN 로그인 가능(추가 계정으로 `/api/v1/admin/auth/login` 성공).
  - 중복 userId → `USER_DUPLICATED_ID`.
  - **자가 잠금**: 본인 role을 CUSTOMER로 변경 시도 → `ADMIN_SELF_LOCKOUT`.
  - **본인 비활성화** 시도 → `ADMIN_SELF_LOCKOUT`.
  - **마지막 ADMIN 강등**: 활성 ADMIN 1명만 남긴 뒤 그 계정 강등 → `ADMIN_LAST_ADMIN_PROTECTED`.
  - 정상 케이스: 2명 이상일 때 타 관리자 강등/비활성화 → 200, DB 반영 + `u_user` 기록.
  - 평문 비밀번호가 응답/로그에 미노출.
- **build**: 통과.
- **실제 요청 검증**: 위 시나리오 curl E2E + DB 상태 확인 + audit 컬럼(`u_user`) 확인.
- **회귀**: 전체 `./gradlew test` 그린 (기존 M0~M6 테스트 포함).

### 의존성
- **F-T1, F-T3, F-T4, F-T5** 모두.

### 위험도
- **높음** — 권한 승격/강등 + 자가 잠금이 모두 모이는 지점. 동시성(마지막 ADMIN 경합) + 가드 누락이 핵심.

### 확인 필요
- **F6-Q1.** role 변경(ADMIN↔CUSTOMER) API를 F에 포함할지, M(회원관리)으로 넘길지.
  관리자↔일반 전환은 F의 "관리자 계정 관리"와 M의 "회원 등급/상태 관리" 경계에 걸침.
  **추천: 관리자 생성/상태관리는 F, 일반회원↔관리자 승강은 M으로** (책임 분리). → 결정 요청.
- **F6-Q2.** 관리자 계정 **삭제**(소프트) 노출 여부. 자가 잠금/마지막 ADMIN 가드는 동일 적용.
  비활성화로 충분하면 삭제 API 생략 가능. → 결정 요청.

---

## 신규/수정 파일 (대표 경로)

```
src/main/java/com/micoz/common/config/AdminBootstrapProperties.java        (신규, F-T1)
src/main/java/com/micoz/auth/bootstrap/AdminBootstrapRunner.java           (신규, F-T1)
src/main/java/com/micoz/auth/controller/AdminAuthController.java           (신규, F-T2)
src/main/java/com/micoz/auth/service/AuthService.java                      (수정, F-T2: adminLogin)
src/main/java/com/micoz/common/config/SecurityConfig.java                  (수정, F-T3·F-T4)
src/main/java/com/micoz/common/response/ErrorCode.java                     (수정, F-T5: +2)
src/main/java/com/micoz/auth/admin/AdminAccountGuard.java                  (신규, F-T5)
src/main/java/com/micoz/user/repository/UserRepository.java               (수정, F-T5: count)
src/main/java/com/micoz/admin/user/controller/AdminUserController.java     (신규, F-T6)
src/main/java/com/micoz/admin/user/service/AdminUserService.java          (신규, F-T6)
src/main/java/com/micoz/admin/user/dto/*.java                             (신규, F-T6)
.env.example                                                              (수정, F-T1)
src/test/java/com/micoz/auth/bootstrap/AdminBootstrapRunnerTest.java       (신규, F-T1)
src/test/java/com/micoz/auth/AdminAuthIntegrationTest.java                 (신규, F-T2·T3·T4)
src/test/java/com/micoz/auth/admin/AdminAccountGuardTest.java              (신규, F-T5)
src/test/java/com/micoz/admin/user/AdminUserIntegrationTest.java           (신규, F-T6)
```

> 스키마 변경(V9)은 F1-Q1을 (b)로 결정할 때만 발생. 기본 추천(a)에서는 마이그레이션 0.

---

## 확정 대기 질문 모음 (리뷰 시 회신 부탁)

- **F1-Q1.** "비번 변경 유도" — (a) 무스키마 휴리스틱(`last_login_date IS NULL`) vs (b) V9 신규 컬럼. **추천 (a)**
- **F1-Q2.** 시드 관리자 `user_id`(=`admin`?) / 등급(=EXECUTIVE?) 확정
- **F4-Q1.** 2차 방어 위치 — (a) 컨트롤러 레벨 vs (b) 서비스 레벨까지. **추천 (a)**
- **F6-Q1.** role 승강 API를 F vs M 어디에 둘지. **추천: 생성/상태=F, 회원↔관리자 승강=M**
- **F6-Q2.** 관리자 소프트 삭제 API 노출 여부. **추천: 비활성화로 대체, 삭제 생략**

> 본 문서 리뷰 + 위 질문 회신 후 F-T1부터 구현 시작.
