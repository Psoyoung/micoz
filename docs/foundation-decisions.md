# MICOZ M7 Foundation — 결정 라운드 자료

> ## ✅ 확정됨 (2026-06-22)
> 6개 항목 모두 사용자 결정 회신 완료. 아래 추천안대로 확정.
>
> | # | 항목 | 확정 |
> |---|---|---|
> | 1 | 관리자 로그인 | **B** — 별도 진입점 `POST /api/v1/admin/auth/login` + 내부 role 게이트 |
> | 2 | RBAC | **A** — 단일 ADMIN 유지 + `@EnableMethodSecurity` 후크 |
> | 3 | AdminPrincipal | **A** — UserPrincipal 재사용 |
> | 4 | 자가 잠금 | **B** — 균형 정책 + `ADMIN_SELF_LOCKOUT` / `ADMIN_LAST_ADMIN_PROTECTED` 신설 |
> | 5 | 동적 쿼리 | **B** — Spring Data Specification (M 모듈 first try) |
> | 6 | includeDeleted | **B** — 옵션(기본 false), `mst_*`에만 적용 |
>
> **확인 필요 질문 회신 (확정):**
> - **Q1-1**: 관리자 UI = `micoz.com/admin` 서브패스. CORS 동일 출처 기준(별도 분기 불요).
> - **Q1-2 + Q4-1 (첫 관리자 부트스트랩)**: ROOT는 **비상용 락드 계정으로 유지**. 앱 기동 시
>   환경변수 `ADMIN_INIT_PASSWORD` 기반으로 운영 관리자 1명 시드 — 계정 없으면 BCrypt 해시
>   생성 후 저장, 첫 로그인 후 비번 변경 유도. **평문 비밀번호는 코드/마이그레이션/git에 절대 금지**.
> - **Q1-3**: `userStatus` 로그인 검증은 **M 모듈로 미룸** (지금은 `useYn='Y'`만).
> - **Q2-1**: 다단계 role 예정 없음 → **A 확정**.
> - **Q4-2**: 본인 비밀번호 변경 **허용** (차단 대상 아님) 확정.
> - **Q5-1**: 사용자 상품검색 다축화 현재 없음 → **C 모듈에서 재검토**.
> - **Q6-1**: `includeDeleted` 감사 로그는 **S 모듈/운영 인프라 시점으로 미룸**.
>
> → F 모듈 task 분할: `docs/tasks-F-foundation.md`

---

> **목적**: `docs/admin-overview.md` §4 보류 항목 중 **Foundation 진입을 막는 6개**를 닫기 위한
> 사실 기반 의사결정 자료. (아래 본문은 결정 근거 — 확정 결과는 상단 박스 참조.)
> **범위 외**: 운송장 추적 API(§4-7), 환불 PG(§4-8), 대시보드 캐싱(§4-9), GA(§4-10)
> — 해당 모듈 진입 시 별도 라운드.
>
> **사용 양식**: 각 항목 = 코드베이스 사실 → 선택지/트레이드오프 → 추천 + 근거 → 뒤 모듈 영향
> → (필요 시) 확인 필요 질문.

---

## 1. FR-ADM-11 관리자 로그인 플로우

### 코드베이스 사실

| 항목 | 현재 상태 |
|---|---|
| 로그인 엔드포인트 | `POST /api/v1/auth/login` (단일). `AuthController` 외 관리자 전용 진입점 **없음** |
| 로그인 처리 | [AuthService.login](src/main/java/com/micoz/auth/service/AuthService.java:106) — `user_role` 무관하게 ID/PW 일치 + `useYn='Y'` + `userStatus` 검사 없음 (확인 필요) |
| 토큰 발급 | [JwtTokenProvider.createAccessToken(userSeq, userId, role)](src/main/java/com/micoz/auth/jwt/JwtTokenProvider.java:51) — `user.userRole`을 클레임에 그대로 포함 |
| ROOT 시드 | V3 — `user_id='ROOT'`, `user_role='ADMIN'`, pw=placeholder(BCrypt 무효 해시 → **로그인 불가**) |
| 관리자 계정 생성 경로 | **없음** — `signup`은 무조건 `userRole='CUSTOMER'` 고정 ([AuthService.signup:85](src/main/java/com/micoz/auth/service/AuthService.java:85)) |
| 열거방지 정책 | NFR-07 — `AUTH_INVALID_CREDENTIALS` 통일 응답, dummy hash로 시간차 최소화 |

### 선택지

| # | 안 | 설명 |
|---|---|---|
| **A** | **사용자 로그인 100% 재사용** | `/api/v1/auth/login` 그대로 사용. 발급된 access의 role 클레임이 `ADMIN`이면 관리자. 별도 진입점 없음 |
| **B** | **별도 진입점 신설** | `POST /api/v1/admin/auth/login` 추가. 내부적으로는 동일 자격증명 검증이지만 입구만 분리 (UI 분리/감사 로그 분리/IP 화이트리스트 적용 용이) |
| **C** | **재사용 + 서버측 role 게이트** | A안 기반 + `login` 단계에서 `user_role`을 보고 응답 토큰의 audience/issuer 분리 or 별도 쿠키 발급 |

### 트레이드오프

- **A**: 코드 0줄 추가, 토큰 1종으로 단순. 단 관리자 로그인 UI를 별도 도메인(admin.micoz.com)에 둘 경우에도 같은 엔드포인트라서 침투 표면이 안 줄어듦. 열거방지 정책이 관리자에게도 자동 적용 → 관리자 계정 ID 추측 시도가 사용자 로그인과 섞임 (오히려 장점).
- **B**: 운영적 분리(별도 rate-limit, 별도 감사 로그, 별도 CORS, WAF 룰)가 깔끔. 코드는 컨트롤러 1개 + 서비스 메서드 1개 정도. 단 동일 토큰을 발급하면 분리 의미가 약하므로 **role 검증**까지 같이 가야 함 — `user_role != 'ADMIN'`이면 `AUTH_INVALID_CREDENTIALS`(NFR-07 동일 응답).
- **C**: A/B 중간. audience 클레임 추가 = JWT 검증 로직 분기 발생 → 복잡도 상승. 토큰 1종 정책의 단순함이 깨짐.

### 추천: **B (별도 진입점 + 내부 role 게이트)**

근거:
1. **PRD §11에 명시된 블로커는 "관리자 로그인 화면/플로우 정의"** — 화면이 분리되는 게 정해진 수순이면 백엔드 엔드포인트도 분리하는 게 정합.
2. **현재 코드 변경 비용이 작음** — `AdminAuthController` + `AuthService.adminLogin(...)` 1쌍, 내부에서 `login()`을 호출하되 `user.userRole != 'ADMIN'`이면 `AUTH_INVALID_CREDENTIALS` throw. 사용자 로그인 흐름은 무손상.
3. **규모 목표(동시 1만, P99 50ms)에 직접 영향 없음** — 인증 경로 한 번 더 분기될 뿐.
4. **운영 분리 옵션 확보**: nginx/WAF에서 `/api/v1/admin/**`를 IP 화이트리스트 / 추가 rate-limit 대상으로 손쉽게 묶음.
5. NFR-07 그대로 적용 — 관리자 계정 존재 여부 노출 안 됨.

### 뒤 모듈 영향

- 관리자 컨트롤러 base path = `/api/v1/admin/**`로 일관 → M/O/R/CS/D 모두 동일 prefix 사용. SecurityConfig 게이팅 한 줄로 끝.

### 확인 필요

- **Q1-1.** 관리자 로그인 UI는 사용자 쇼핑몰과 다른 도메인/서브패스를 쓰는가? (admin.micoz.com vs micoz.com/admin) — 답에 따라 CORS 정책 분기 필요.
- **Q1-2.** ROOT 계정 비밀번호를 M7 시작 시점에 실제 해시로 교체할 것인가? 교체 시점/방법(별도 마이그레이션 V9 vs 환경변수 기반 시드 vs CLI 도구)?
- **Q1-3.** 로그인 시 `userStatus` 검증(예: `SUSPENDED` 차단)을 지금 추가할까, M-모듈에서 사용자 정지 기능과 함께 추가할까?

---

## 2. RBAC 세분화

### 코드베이스 사실

| 항목 | 현재 상태 |
|---|---|
| role 컬럼 | `mst_user.user_role VARCHAR(20) NOT NULL` ([V1 baseline:76](src/main/resources/db/migration/V1__baseline_schema.sql:76)) — COMMENT "사용자 구분: CUSTOMER/ADMIN" |
| 코드상 role 값 | `"CUSTOMER"` (회원가입 고정), `"ADMIN"` (ROOT 시드) — 2개 |
| role 사용 위치 | `JwtTokenProvider.createAccessToken` 클레임 / `JwtAuthenticationFilter`의 `ROLE_` prefix authority 부여 — 그게 전부. 어떤 컨트롤러/서비스도 role 분기 없음 |
| 권한 게이트 | `SecurityConfig.anyRequest().authenticated()` — 인증만 통과하면 모두 접근. `/api/v1/admin/**` 매칭 **없음** |
| 메서드 보안 | `@EnableMethodSecurity` **없음**, `@PreAuthorize` 사용처 **없음** |

### 선택지

| # | 안 | 설명 |
|---|---|---|
| **A** | **단일 ADMIN 유지** (현 모델) | `CUSTOMER` / `ADMIN` 2단계. 모든 관리자 액션은 ADMIN이면 OK |
| **B** | **다단계 도입 (예: SUPER_ADMIN/ADMIN/OPS/CS)** | role 컬럼 그대로 사용, 값만 늘림 |
| **C** | **role + permission 분리** | `mst_user.user_role`(직책)과 별도 `mst_admin_permission`(액션별 권한) 테이블. RBAC 라이브러리 풀세트 |

### 트레이드오프

- **A**: 가장 단순. 코드 변경 0. 단 "특정 직원에게 회원 정보만 보여주고 주문은 보여주지 마" 같은 요구는 못 함. PRD §5 G그룹은 "관리자" 단일 페르소나로 쓰여있어 현 시점 비즈니스 요구상 충분.
- **B**: role enum 값만 늘리면 됨. SecurityConfig에서 `hasAnyRole("ADMIN","OPS","CS")`로 분기. 단 권한 매트릭스(어떤 role이 어떤 액션 가능)를 코드에 흩뿌리면 유지보수 비용 상승. 보통 4~6개 role까지는 enum이 견딤.
- **C**: 가장 유연. 그러나 테이블 1~2개 추가 + 권한 캐시 + 권한 부여 UI까지 늘어남. PRD에 요구 없는데 도입하면 §2 "Simplicity First" 위반.

### 추천: **A 유지 + B/C로의 확장 후크만 코드에 남기기**

근거:
1. **PRD에 다단계 요구가 명시되지 않음** — 현 단계에서 B/C는 추측 기반 과설계.
2. **확장 비용이 낮음** — `user_role`이 VARCHAR(20) 자유 문자열이고 JWT 클레임도 단순 문자열이라, 새 role 값 추가는 마이그레이션 0줄 + 코드 분기 추가만으로 끝남.
3. **확장 후크 = 권한 게이트의 위치를 일관되게 둘 것**:
   - 1차 방어: `SecurityConfig`에서 `/api/v1/admin/**` → `hasRole("ADMIN")`
   - 2차 방어: 컨트롤러/서비스 메서드에 `@PreAuthorize("hasRole('ADMIN')")` 명시 (`@EnableMethodSecurity` 활성화)
   - 향후 role 추가 시 `@PreAuthorize` 표현식만 수정 → 변경 면적 국소화
4. **규모 목표(P99 50ms) 무관** — RBAC 검사는 인메모리 O(1).

### 뒤 모듈 영향

- M/O/R/CS/D 컨트롤러는 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")` 1줄로 통일. 향후 role 세분화 시 메서드 단위로만 내려서 수정.

### 확인 필요

- **Q2-1.** "운영팀이 회원 가입승인만 한다" 같은 분리 요구가 사업 측에서 예정되어 있는가? 있다면 B 선제 도입 검토.

---

## 3. AdminPrincipal 분리

### 코드베이스 사실

| 항목 | 현재 상태 |
|---|---|
| Principal 클래스 | [UserPrincipal](src/main/java/com/micoz/auth/security/UserPrincipal.java:14) — `userSeq`, `userId`, `role` 3필드 |
| Principal 주입 | 모든 컨트롤러 `@AuthenticationPrincipal UserPrincipal principal` — 18개 컨트롤러에서 동일 패턴 |
| audit 매핑 | [AuditorAwareImpl](src/main/java/com/micoz/common/config/AuditorAwareImpl.java:23) — `principal instanceof UserPrincipal up` 분기. **분리 시 여기도 분기 추가 필요** |
| role-aware 사용처 | 코드 전체에서 `principal.getRole()` 호출 **없음** (필터에서만 `ROLE_` prefix용으로 사용) |

### 선택지

| # | 안 | 설명 |
|---|---|---|
| **A** | **UserPrincipal 재사용** | 관리자도 같은 클래스. `role == "ADMIN"`으로 식별 |
| **B** | **AdminPrincipal 신설** | 별도 클래스. JwtAuthenticationFilter에서 role 보고 분기 생성 |
| **C** | **공통 인터페이스 + 두 구현** | `Principal` 인터페이스, `CustomerPrincipal`/`AdminPrincipal` 구현 |

### 트레이드오프

- **A**: 코드 변경 0. 단점 — 관리자에만 있는 필드(예: 마지막 권한 변경 일시, 담당 부서)를 나중에 추가하려면 `UserPrincipal`이 비대해지거나 nullable 필드가 늘어남. **현재 추가 필드 요구 없음**.
- **B**: 명시적 타입 안전. 관리자 컨트롤러 시그니처가 `@AuthenticationPrincipal AdminPrincipal admin`이 되어 의도가 코드에 드러남. 비용: 필터에서 role 분기, AuditorAware 분기, 테스트 빌더 1쌍 추가. 사용자 컨트롤러가 AdminPrincipal을 받는 실수는 시그니처에서 즉시 차단.
- **C**: B 위에 추상화 1단 더. 지금 단계엔 과설계.

### 추천: **A 유지 (단일 ADMIN 단계 한정)** — RBAC 세분화 시 B로 전환

근거:
1. **§2에서 단일 ADMIN을 추천했으므로** 관리자 전용 데이터가 추가되지 않는 한 분리할 이득이 없음.
2. **현재 어느 컨트롤러도 `principal.getRole()`을 분기 조건으로 안 씀** — SecurityConfig + `@PreAuthorize`가 정문에서 막으므로 컨트롤러 내부에서 role 검사 불필요.
3. **분리 비용은 작지만, 분리 가치도 지금은 작음** — 코드 0줄 추가가 가장 단순.
4. **단, AuditorAware는 `principal.getUserId()`만 호출** → A로 가도 `i_user`/`u_user`에 관리자 user_id가 자연스럽게 기록됨. NFR-12 충족.
5. RBAC 세분화 결정이 B로 바뀌면 그때 `AdminPrincipal` 도입 — 마이그레이션 영향 없음(런타임 객체만 분리).

### 뒤 모듈 영향

- 관리자 컨트롤러도 `@AuthenticationPrincipal UserPrincipal principal` 동일 패턴. AuditorAware 변경 없음.

---

## 4. 관리자 자가 잠금 방지

### 코드베이스 사실

| 항목 | 현재 상태 |
|---|---|
| role 변경 API | **없음** (관리자 모듈 미구현) |
| 사용자 소프트 삭제 | `User.softDelete()` 메서드 존재 ([User.java:144](src/main/java/com/micoz/user/entity/User.java:144)) — `useYn='N'`. 호출처는 아직 없음 |
| 자기 자신 보호 로직 | **없음** |
| ROOT 계정 | V3 시드. 코드 레벨에서 ROOT임을 식별하는 상수/플래그 없음. `user_id='ROOT'` 문자열 매칭만 가능 |

### 선택지 (4가지 케이스를 묶은 정책 세트)

| 케이스 | A안 (느슨) | B안 (균형) | C안 (엄격) |
|---|---|---|---|
| 본인 role을 CUSTOMER로 변경 | 허용 | **차단** | 차단 |
| 본인 계정 소프트 삭제(`useYn=N`) | 허용 | **차단** | 차단 |
| 본인 계정 비활성화(`userStatus=SUSPENDED`) | 허용 | **차단** | 차단 |
| 마지막 ADMIN 계정 강등/삭제 | 허용 | **차단** | 차단 |
| ROOT 계정(`user_id='ROOT'`) 변경 | 허용 | 허용 | **차단** (특수 보호) |

### 트레이드오프

- **A (느슨)**: 코드 0줄. 단 운영 사고(본인이 본인을 강등 → 시스템 락아웃) 발생 가능. 복구는 DB 직접 수정뿐 → 운영 비용 ↑.
- **B (균형)**: "현재 인증된 본인 + 마지막 ADMIN" 4가지 경우만 차단. 모두 단순 조건문(`if (principal.userSeq.equals(targetSeq)) throw ...`, `if (adminCount() <= 1 && target.role=='ADMIN') throw ...`). 운영자가 다른 관리자에게 부탁하면 풀 수 있음.
- **C (엄격)**: ROOT 특수 보호 추가. ROOT 비밀번호가 placeholder라 로그인 불가 상태인데, role/use_yn 변경까지 막으면 DB에서 직접 수정해야 회복 가능 → 정합. 단 ROOT를 정상 운영 계정으로 쓸 거라면 과한 제약.

### 추천: **B (균형) + 차단 시 `ADMIN_SELF_LOCKOUT` 에러**

근거:
1. **운영 사고 방지가 RBAC 세분화 이전부터 필요** — 단일 ADMIN 단계에서 자기 강등 = 즉시 시스템 락아웃이라 영향 큼.
2. **로직이 단순** — Service 메서드에 가드 2개(self 체크 + count 체크) 추가. 인덱스/스키마 변경 0.
3. **마지막 ADMIN 카운트 쿼리**: `userRepository.countByUserRoleAndUseYn("ADMIN", "Y")` — 파생 쿼리로 충분. P99 영향 무관 (관리자 수는 한 자릿수 단위 가정).
4. **ROOT 특수 보호는 분리 결정 (Q4-1)** — placeholder 비밀번호라 현재 로그인 불가 → 운영 계정으로 쓸 의도라면 비밀번호 교체와 함께 정책 정하는 게 자연스러움. §1 Q1-2와 연결.

### 신규 에러 코드 (확정 후보)

```java
ADMIN_SELF_LOCKOUT_FORBIDDEN(HttpStatus.CONFLICT, "본인 계정의 권한/상태를 변경할 수 없습니다."),
ADMIN_LAST_ADMIN_PROTECTED(HttpStatus.CONFLICT, "마지막 관리자 계정은 권한/상태를 변경할 수 없습니다.")
```

### 뒤 모듈 영향

- **M 모듈에 직접 영향** — 회원 관리(`PATCH /api/v1/admin/members/{seq}/role`, `DELETE /api/v1/admin/members/{seq}`)에 가드 삽입. M 모듈 task 분해 시 필수 항목.

### 확인 필요

- **Q4-1.** ROOT 계정을 (1) 영구 추천인 검증용 락드 계정으로 유지할지, (2) 실제 운영 슈퍼관리자로 활성화할지. 답에 따라 C안 일부 도입.
- **Q4-2.** 본인 비밀번호 변경은 차단 대상 아님(FR-MY-01 그대로 허용). 확인.

---

## 5. 동적 검색 쿼리 도구 (공통 패턴 — 방향만)

### 코드베이스 사실

| 항목 | 현재 상태 |
|---|---|
| QueryDSL 의존성 | **없음** ([build.gradle](build.gradle)) |
| `JpaSpecificationExecutor` | **사용 없음** |
| 동적 쿼리 패턴 | **없음** — 모든 Repository가 Spring Data 파생 쿼리 (`findByXxxAnd...`) |
| `@Query` 사용처 | 2건뿐, 모두 ReviewRepository 집계용(count/avg) |
| 검색 요구 복잡도 (사용자 측) | 단순 (카테고리/상태/페이징 정도) |
| 검색 요구 복잡도 (관리자 측) | 높음 — 회원 검색(ID/이름/등급/상태/가입기간), 주문 검색(주문번호/상태/회원/기간/금액범위), 반품/상품/문의 모두 다축 검색 |

### 선택지

| # | 안 | 설명 |
|---|---|---|
| **A** | **파생 쿼리 유지 + 다축 조합을 `@Query` JPQL로** | 의존성 추가 0. 조건 조합 수가 폭증하면 메서드 폭발 |
| **B** | **Spring Data `Specification`** | 의존성 추가 0 (이미 spring-data-jpa 포함). Repository에 `JpaSpecificationExecutor<T>` 상속 + `Specification` 컴포즈 |
| **C** | **QueryDSL 도입** | annotation processor + Q타입 빌드. 타입 세이프 컴파일타임 검증. 의존성/빌드 시간 추가 |

### 트레이드오프

- **A**: 가장 가볍지만, 회원 검색에 5축 검색(ID/이름/등급/상태/기간) = OR/AND 조합 메서드 10개 폭발. `@Query`로 `:userId is null or u.user_id like :userId` 같은 트릭은 가능하나 6축 넘어가면 가독성 빠르게 무너짐.
- **B**: 추가 의존성 0, 컴파일 타임 안전성은 낮지만(필드명 문자열) 표준 Spring Data 패턴이라 학습 비용 낮음. 다축 조합을 `where(spec1).and(spec2)`로 메서드 컴포즈 → 재사용 가능. **현재 관리자 검색 복잡도엔 충분**.
- **C**: 타입 세이프, IDE 자동완성, 복잡 JOIN 가독성 우수. 단 annotation processor 설정 + Q타입 생성 + IDE 설정(빌드 디렉터리 마킹) 등 인프라 비용. PRD가 명시한 도구 아님 → §2 Simplicity First 관점에서 도입은 명분이 필요.

### 추천: **B (Specification) — M 모듈 회원검색에서 먼저 도입**

근거:
1. **현재 코드베이스에 동적 쿼리 도구 없음** → 어떤 안이든 신규 도입. 가장 비용 작은 게 B.
2. **PRD 명시 검색 축이 도메인당 3~6개** — QueryDSL의 타입 세이프함이 진가를 발휘하는 10+ 축 / 복잡 JOIN 시나리오는 아님.
3. **규모 목표(P99 50ms, 동시 1만)에 직접 영향 없음** — 둘 다 동일 SQL 생성. 인덱스 설계(audit + 검색축)가 P99 결정 요인.
4. **확장 후크 확보** — 운영 중 검색 복잡도가 폭증하면 C(QueryDSL)로 갈아탈 수 있음. Specification에서 만든 SQL을 reference로 QueryDSL 재작성 비용은 작음.
5. **M 모듈에서 first try 후 평가** — 다른 운영 모듈은 그 경험으로 동일 패턴 답습.

### 뒤 모듈 영향

- M/O/R/C/CS 모두 동일 패턴. `Specifications` 정적 팩토리 클래스(`UserSpecs`, `OrderSpecs` …)에 조건자 모음 → 컨트롤러는 `SearchCondition` DTO를 받아 컴포즈.

### 확인 필요

- **Q5-1.** 사용자 쇼핑몰 측 상품 검색(`/api/v1/products?q=...`)이 다축화될 가능성? — 있으면 사용자 측도 동일 패턴 적용 검토.

---

## 6. `includeDeleted=true` 옵션 노출

### 코드베이스 사실

| 항목 | 현재 상태 |
|---|---|
| `use_yn` 컬럼 | 거의 모든 `mst_*`/`dat_*` 테이블 보유 |
| 사용자 측 조회 정책 | 모두 `useYn='Y'` 필터링 (`findActiveByXxx` 패턴) |
| 관리자 측 조회 | 미구현 — 정책 결정 대상 |
| 권한 분리 | 관리자만 접근 가능한 엔드포인트 (§1 추천 B안 기준 `/api/v1/admin/**`) |

### 선택지

| # | 안 | 설명 |
|---|---|---|
| **A** | **노출 안 함** | 관리자도 활성 행만. 삭제된 데이터는 DB 직접 접근으로만 |
| **B** | **`includeDeleted=true` 쿼리 파라미터 노출 (기본 false)** | 관리자 한정. 별도 권한 없이 ADMIN이면 가능 |
| **C** | **별도 엔드포인트** | `GET /api/v1/admin/members/deleted` 등 삭제된 행만 전용 조회 |

### 트레이드오프

- **A**: 가장 안전. 단 "왜 안 보이지? 삭제됐었나?" 같은 운영 디버깅 시 DB 접근 필요 → 운영 비용 ↑. 회원 탈퇴 후 재가입 검토 같은 정상 운영 시나리오에도 막힘.
- **B**: 운영 디버깅 비용 ↓. 단 디폴트가 false라도 누군가 항상 true를 넣으면 정책 의미가 약해짐. Specification에 조건자 1개 추가로 끝나는 단순 구현.
- **C**: 분리가 명확. 단 엔드포인트 수가 도메인×2로 늘어남 → API 표면적 증가.

### 추천: **B (옵션 노출, 기본 false)** + 단 **트랜잭션 테이블 제외**

근거:
1. **운영 디버깅 가치가 명확** — "삭제된 회원/상품/카테고리/배너" 조회는 실무에 자주 발생.
2. **소프트 삭제 대상이 `mst_*`에 한정됨** (§3.4 정책) — `dat_*`는 상태 전이만 하므로 `includeDeleted`가 의미를 갖지 않음. **B안의 적용 범위 = `mst_*`만**.
3. **`includeDeleted=true`도 ADMIN 권한이 전제** — 정문이 이미 막혀 있어 외부 노출 위험 없음.
4. **`includeDeleted=true` 사용 시 응답에 `useYn` 컬럼 포함** → 운영자가 어느 행이 삭제됐는지 즉시 식별 가능.
5. **감사 로그 권장** — `includeDeleted=true` 호출은 access log에서 별도 마킹(향후 운영 모니터링 항목).

### 뒤 모듈 영향

- 관리자 목록 API 공통 쿼리 파라미터에 `includeDeleted` 1개 추가. `Specification` 빌더에서 `useYn` 조건자 토글로 처리. `dat_*` 도메인(O/R)에는 적용 안 함.

### 확인 필요

- **Q6-1.** `includeDeleted=true` 호출을 별도 감사 로그로 남길지(파일/DB) — 본 라운드 결정 범위 외, S 모듈/운영 인프라 결정 시점으로 미룸. 단 결정만 확정해두면 좋음.

---

## 종합 — 결정 회신용 요약 시트

| # | 항목 | 추천 | 회신 칸 |
|---|---|---|---|
| 1 | 관리자 로그인 플로우 | **B (별도 진입점 + 내부 role 게이트)** | [ ] |
| 2 | RBAC 세분화 | **A 유지 + `@EnableMethodSecurity`로 후크 확보** | [ ] |
| 3 | AdminPrincipal 분리 | **A (UserPrincipal 재사용)** | [ ] |
| 4 | 자가 잠금 방지 | **B 균형 정책 + `ADMIN_SELF_LOCKOUT` / `ADMIN_LAST_ADMIN_PROTECTED` 신설** | [ ] |
| 5 | 동적 검색 쿼리 | **B (Spring Data Specification)** | [ ] |
| 6 | `includeDeleted=true` 노출 | **B (옵션 노출, 기본 false, `mst_*`에만 적용)** | [ ] |

### 확인 필요 질문 모음 (별도 회신 부탁)

- **Q1-1.** 관리자 UI 도메인 분리 여부 (admin.micoz.com vs micoz.com/admin)
- **Q1-2.** ROOT 계정 비밀번호 실해시 교체 시점/방법
- **Q1-3.** `userStatus` 검증 도입 시점 (지금 vs M 모듈)
- **Q2-1.** 다단계 role 분리 사업 요구 예정 여부
- **Q4-1.** ROOT 계정 운명 (락드 유지 vs 운영 슈퍼관리자)
- **Q4-2.** 본인 비밀번호 변경은 차단 대상 아님 확인
- **Q5-1.** 사용자 측 상품 검색 다축화 가능성
- **Q6-1.** `includeDeleted=true` 감사 로그 정책 (당장 결정 불요, 회신은 선택)

---

## 본 문서 범위 외 (재확인)

- §4-7 운송장 추적 외부 API → **O 모듈 진입 시**
- §4-8 반품 환불 PG → **R 모듈 진입 시**
- §4-9 대시보드 집계 캐싱 → **D 모듈 진입 시**
- §4-10 GA 연동 → **D 모듈 진입 시**

> 본 6개 항목 결정 회신 후 → `docs/admin-overview.md` §4 갱신 + F 모듈 task 분할 진입.
