# MICOZ M7 — M. Member(회원 관리) task 분할

> **전제**: F. Foundation 완료(관리자 로그인·RBAC 게이팅·자가잠금 가드 확정). 본 문서는 M 모듈을
> 독립적으로 테스트·커밋 가능한 단위로 분할한 것. **구현은 본 문서 리뷰 후 시작.**
> **기준**: `docs/admin-overview.md` §1(M 모듈)·§3(관리자 공통 패턴), `docs/foundation-decisions.md`(이관 플래그).
>
> ## 진행 방식 변경 (M부터 적용)
> - **task별 승인 게이트를 푼다.** 각 task는 검증 결과 + 커밋 후보를 제시하되, **내 승인 없이 커밋(push 금지)해도 된다.**
> - **예외: `[수동리뷰 필수]` task(M-T1·M-T3.5·M-T5·M-T6)는 F처럼 커밋 전에 멈춰 승인받는다.**
>   (검색 패턴 표준화·기존 로그인 경로 수정·금전성 잔액 변경·권한 승강은 자동 테스트만으로 회귀를 못 잡는다.)
> - **M 전체가 끝나면 통합 검토용 요약을 만들고 멈춘다.**
>
> **공통 검증 절차 (모든 task)**: ① 단위/통합 테스트 작성·통과 → ② `./gradlew build`(또는 `docker compose up -d --build`)
> → ③ 실제 HTTP 요청(curl) E2E → ④ 회귀 스모크(기존 인증/관리자 핵심 1~2개).

---

## 0. 신규 엔드포인트 계약 (모듈 상단 설계)

모든 경로는 `/api/v1/admin/members` 하위. **전부 ADMIN 권한**(URL 게이팅 `/api/v1/admin/**` + 클래스 레벨
`@PreAuthorize("hasRole('ADMIN')")` 2차 방어 = F-T4 표준). 응답은 `ApiResponse<T>` 봉투, 목록은 `PageResponse<T>`.
감사: 모든 변경은 `AuditorAwareImpl`로 `u_user`=실행 관리자 user_id 자동 기록.

> **회원 vs 관리자 식별 경계**: 본 엔드포인트군은 **일반 회원(`user_role='CUSTOMER'`)**을 대상으로 한다.
> 대상 `user_role`이 CUSTOMER가 아니면(=ADMIN) `USER_NOT_FOUND`로 비노출(관리자 계정 관리는 `/api/v1/admin/admins`).
> **단, ⑥ role 승강(M-T6)만 예외** — CUSTOMER↔ADMIN 경계를 넘는 작업이므로 양쪽을 모두 대상으로 한다.

### 0.1 엔드포인트 표

| # | Method | Path | 설명 | 성공 | 주요 에러 |
|---|--------|------|------|------|----------|
| ① | GET | `/api/v1/admin/members` | 회원 목록·다축 검색 | 200 `PageResponse<MemberListItem>` | — |
| ② | GET | `/api/v1/admin/members/{userSeq}` | 회원 상세 | 200 `MemberDetailResponse` | 404 `USER_NOT_FOUND` |
| ③a | PATCH | `/api/v1/admin/members/{userSeq}/grade` | 등급 변경 | 200 `Void` | 404 `USER_NOT_FOUND`/`GRADE_NOT_FOUND` |
| ③b | PATCH | `/api/v1/admin/members/{userSeq}/status` | 상태 변경(`user_status`: ACTIVE/DORMANT/SUSPENDED) | 200 `Void` | 404 `USER_NOT_FOUND`, 400 `MEMBER_INVALID_STATUS` |
| ④ | POST | `/api/v1/admin/members` | 회원 등록 | 200 `MemberCreatedResponse` | 409 `USER_DUPLICATED_ID`, 404 `GRADE_NOT_FOUND` |
| ⑤ | POST | `/api/v1/admin/members/{userSeq}/points` | 포인트 수동 조정(참고용) | 200 `PointAdjustResponse` | 404 `USER_NOT_FOUND`, 400 `POINT_INSUFFICIENT`/`COMMON_VALIDATION_ERROR` |
| ⑥ | PATCH | `/api/v1/admin/members/{userSeq}/role` | role 승강(ADMIN↔CUSTOMER) | 200 `Void` | 404 `USER_NOT_FOUND`/`GRADE_NOT_FOUND`, 409 `ADMIN_SELF_LOCKOUT`/`ADMIN_LAST_ADMIN_PROTECTED` |

### 0.2 요청/응답 DTO 초안

```
// ── ① 목록·검색 ───────────────────────────────────────────────
MemberSearchCondition (쿼리 바인딩)
  String  q            // userId 또는 userName 부분일치(선택)
  String  userId       // 정확/부분(선택)
  String  userName     // 부분일치(선택)
  String  gradeCode    // MEMBER/SELLER/MASTER/SENIOR/EXECUTIVE(선택)
  String  status       // user_status(선택)
  LocalDate joinedFrom // 가입일(i_date) ≥ (선택, ISO-8601)
  LocalDate joinedTo   // 가입일(i_date) ≤ (선택)
  boolean includeDeleted = false   // true면 use_yn='N' 포함(결정6, mst_*만)
  // 페이징/정렬은 Pageable(@PageableDefault size=20, sort=userSeq,desc)

MemberListItem
  Long userSeq, String userId, String userName, String gradeCode,
  Integer pointBalance, String userStatus, String useYn,
  OffsetDateTime joinedDate(i_date), OffsetDateTime lastLoginDate

// ── ② 상세 ───────────────────────────────────────────────────
MemberDetailResponse  // 비밀번호 절대 미포함
  Long userSeq, String userId, String userName, String userRole,
  String gradeCode, String gradeName, String userStatus, String useYn,
  String email, String phone, LocalDate birthDate,
  String zipCode, String address, String addressDetail, String memo,
  Integer pointBalance,
  String serviceYn, String privacyYn, String marketingYn,
  String referrerUserId,
  OffsetDateTime lastLoginDate, OffsetDateTime joinedDate(i_date)

// ── ③ 등급/상태 변경 ─────────────────────────────────────────
UpdateMemberGradeRequest   { @NotBlank String gradeCode }
UpdateMemberStatusRequest  { @NotBlank String status }     // 허용값: ACTIVE | DORMANT | SUSPENDED (확정)

// ── ④ 회원 등록 ──────────────────────────────────────────────
CreateMemberRequest
  @NotBlank userId, @NotBlank userPw, @NotBlank userName,
  String gradeCode(선택, 미지정 시 MEMBER), String email, String phone
MemberCreatedResponse { Long userSeq, String userId }

// ── ⑤ 포인트 수동 조정 ───────────────────────────────────────
PointAdjustRequest
  @NotNull Integer amount,        // 양수=적립, 음수=차감 (또는 type+양수, M-Q5)
  @NotBlank String reason
PointAdjustResponse { Long userSeq, Integer pointBalance, Long pointSeq }

// ── ⑥ role 승강 ──────────────────────────────────────────────
UpdateMemberRoleRequest { @NotBlank String role }   // ADMIN | CUSTOMER
```

### 0.3 신규 에러코드 (M에서 `ErrorCode`에 추가)

| 코드 | HTTP | 메시지 | 사용처 |
|------|------|--------|--------|
| `GRADE_NOT_FOUND` | 404 | 등급을 찾을 수 없습니다. | ③a, ④, ⑥(강등 시 등급 부여) |
| `MEMBER_INVALID_STATUS` | 400 | 허용되지 않는 회원 상태입니다. | ③b (허용값 ACTIVE/DORMANT/SUSPENDED 외) |
| `ADMIN_ROOT_PROTECTED` | 409 | ROOT 계정은 변경할 수 없습니다. | ⑥ (ROOT 대상 role 변경 차단, M-Q6 확정) |

> 재사용(추가 없음): `USER_NOT_FOUND`, `USER_DUPLICATED_ID`, `POINT_INSUFFICIENT`,
> `ADMIN_SELF_LOCKOUT`, `ADMIN_LAST_ADMIN_PROTECTED`(F-T5에서 이미 존재).

---

## 1. 의존성 그래프

```
M-T1 회원 목록·검색 (UserSpecs + SearchCondition 패턴 확립)  ← [수동리뷰 필수], 검색 인프라
   │   (UserRepository extends JpaSpecificationExecutor)
   ▼
M-T2 회원 상세
   │
   ├─▶ M-T3   등급·상태 변경 (user_status 필드 갱신)
   │     │
   │     ▼
   │   M-T3.5 로그인 user_status 게이팅 (기존 authenticateOrThrow 수정)  ← [수동리뷰 필수]
   ├─▶ M-T4   회원 등록
   └─▶ M-T5   포인트 수동 조정(참고용) ← [수동리뷰 필수] (금전성 잔액 변경)

M-T6 role 승강(ADMIN↔CUSTOMER) + 자가잠금/마지막ADMIN 가드 E2E  ← [수동리뷰 필수]
     (F-T5 AdminAccountGuard 재사용. M-T2 상세 조회 기반)
```

권장 순서: **M-T1 → M-T2 → (M-T3 → M-T3.5) · M-T4 · M-T5 → M-T6**

> **`[수동리뷰 필수]` task: M-T1 · M-T3.5 · M-T5 · M-T6** (커밋 전 멈춰 승인). 그 외(M-T2·M-T3·M-T4)는 승인 없이 커밋 가능(push 금지).

---

## M-T1. 회원 목록·다축 검색 + Specification 패턴 확립 `[수동리뷰 필수]`

**이 task가 뒤 모듈(O/R/CS/C)의 동적 검색 표준이 된다 → 패턴 품질이 핵심 리뷰 포인트.**

### 범위
- `UserRepository extends JpaSpecificationExecutor<User>` 추가(기존 파생 쿼리 유지).
- `admin/member/spec/UserSpecs.java` — 정적 팩토리 모음(각각 `Specification<User>` 반환, null 조건은 무시):
  - `roleEq("CUSTOMER")`(고정), `userIdLike`, `userNameLike`, `keyword(q)`(userId OR userName),
    `gradeCodeEq`(grade_seq 조인 또는 서브쿼리), `statusEq`, `joinedBetween(from,to)`(i_date),
    `activeOnly()`(use_yn='Y') / `includeDeleted` 분기.
  - 조합은 `Specification.allOf(...)` 또는 `.and()` 체인. **모든 조건은 옵셔널·null-safe.**
- `admin/member/dto/MemberSearchCondition.java` — 쿼리 바인딩 DTO(위 0.2). 컨트롤러에서 `Pageable`과 분리 수령.
- `admin/member/controller/AdminMemberController.java` — `GET /api/v1/admin/members`(`@PreAuthorize("hasRole('ADMIN')")`).
- `admin/member/service/AdminMemberService.java` — 조건→Specification 변환 + `findAll(spec, pageable)` →
  `PageResponse<MemberListItem>` 매핑. 등급코드↔등급명은 등급 조회로 채움.
- `admin/member/dto/MemberListItem.java`.

### 설계 결정(패턴 표준)
- **정적 팩토리 + allOf 조합**을 표준으로 한다(QueryDSL 미도입 — 의존성 추가 회피, 결정5 first-try).
- 정렬은 화이트리스트로 제한(허용 필드 외 sort 차단) — 임의 컬럼 정렬로 인한 오류/성능 사고 방지.
- `gradeCode` 필터는 `mst_user_grade` 조인 — N+1 주의(목록 매핑 시 등급 일괄 조회 또는 fetch 전략 명시).

### 완료 기준
- **통합 테스트**(Testcontainers): 조건별 단독·조합 검색( id/name/grade/status/가입기간), `includeDeleted`
  on/off로 use_yn='N' 포함 여부, 페이징/정렬, **ADMIN 행은 결과에서 제외**(roleEq CUSTOMER 고정), 빈 결과.
- **build**: BUILD SUCCESSFUL.
- **실제 요청**: 다축 조합 curl 1~2건 + `includeDeleted=true` 1건으로 응답 형태/페이지 메타 확인.
- **회귀**: 기존 사용자 측 `UserRepository` 파생 쿼리(로그인/회원조회) 정상.

### 의존성 / 위험도
- 의존: 없음(M 시작점). · **위험도: 중** — 패턴이 뒤 모듈로 전파되므로 설계 일관성·null-safety·정렬 화이트리스트가 핵심.

### 확정 (M-Q1)
- `user_status` 허용값 = **`ACTIVE` / `DORMANT` / `SUSPENDED` 3개**(WITHDRAWN 제외).
  탈퇴는 `use_yn='N'`이 **단독으로** 표현 — status와 use_yn이 같은 사실을 중복 인코딩하지 않는다(M-Q2 정합).
- 본 task는 status를 **문자열 필터**로만 다루고, 값 검증은 M-T3, 로그인 게이팅은 M-T3.5에서 처리.

---

## M-T2. 회원 상세

### 범위
- `GET /api/v1/admin/members/{userSeq}` → `MemberDetailResponse`(0.2). **비밀번호·해시 절대 미포함.**
- 대상이 CUSTOMER가 아니면 `USER_NOT_FOUND`. 등급명·추천인 userId 조인 채움. 가입일=i_date.
- `admin/member/dto/MemberDetailResponse.java`.

### 완료 기준
- 통합 테스트: 존재 회원 200(필드 매핑 + 등급명/추천인 채워짐), 미존재 404, **ADMIN 대상 404**(비노출),
  응답 JSON에 `userPw` 부재.
- build 통과. 실제 요청 curl 1건. 회귀: 영향 없음(읽기 전용 신규).

### 의존성 / 위험도
- 의존: M-T1(컨트롤러/서비스 골격). · **위험도: 저** — 읽기 전용. 단 민감필드(비번) 노출 금지만 확인.

---

## M-T3. 등급·상태 변경

### 범위
- `PATCH /members/{userSeq}/grade` — `UpdateMemberGradeRequest{gradeCode}` → 유효 등급(`use_yn='Y'`) 조회,
  없으면 `GRADE_NOT_FOUND`, 있으면 `user.grade_seq` 갱신. 대상 비CUSTOMER → `USER_NOT_FOUND`.
- `PATCH /members/{userSeq}/status` — `UpdateMemberStatusRequest{status}` → 허용값(**ACTIVE/DORMANT/SUSPENDED**) 검증,
  외면 `MEMBER_INVALID_STATUS`, 통과 시 `user.user_status` 갱신. **`use_yn`(탈퇴)은 본 API가 건드리지 않음**(M-Q2).
- `User`에 도메인 메서드 추가: `changeGrade(Long gradeSeq)`, `changeStatus(String status)`.
  - 허용값 검증은 enum 또는 화이트리스트 상수로(애플리케이션 레벨, 스키마 CHECK 미도입 = 마이그레이션 0).

### 완료 기준
- 통합 테스트: 등급 변경 200 + DB 반영 + `u_user` 기록, 미존재 등급 404, 상태 변경 200, 잘못된 상태값 400,
  비CUSTOMER 대상 404.
- build 통과. 실제 요청 curl(등급 1, 상태 1). 회귀: 영향 없음.

### 의존성 / 위험도
- 의존: M-T2(대상 조회). · **위험도: 저~중** — 값 검증·감사 기록이 핵심. role은 본 task 범위 밖(⑥/M-T6).
  로그인 게이팅은 본 task가 아니라 M-T3.5(별도 [수동리뷰 필수]).

### 확정 (M-Q2)
- `user_status`(운영상태: ACTIVE/DORMANT/SUSPENDED) ↔ `use_yn`(탈퇴/소프트삭제)는 **별개 개념**.
  ③b는 `user_status`만 토글, 탈퇴/복구는 목록의 `includeDeleted`로 가시화하되 **별도 삭제 API는 두지 않음**.

---

## M-T3.5. 로그인 `user_status` 게이팅 (기존 인증 경로 수정) `[수동리뷰 필수]`

**기존 사용자 로그인 경로(`AuthService.authenticateOrThrow`)를 수정하므로 회귀 위험 — 별도 분리 + 커밋 전 승인.**

### 범위
- `AuthService.authenticateOrThrow`(login/adminLogin 공통 경로)에 **`user_status` 검사 추가**:
  - 거부 대상은 **`SUSPENDED`만**. (`WITHDRAWN`은 미사용 — 탈퇴는 `use_yn='N'`이며 `findActiveByUserId`가 이미 차단.
    `DORMANT`는 로그인 허용 — 휴면 해제 플로우는 별도 과제, 본 범위 밖.)
  - 거부 시 **`AUTH_INVALID_CREDENTIALS` 동일응답**(NFR-07 — 상태 노출 금지, 시간차 최소화 유지).
  - 검사 위치는 비밀번호 매칭 **이후**(자격증명이 맞은 계정에 한해 상태 판정 → 열거 방지 일관).
- M-T3에서 `SUSPENDED`로 전이된 회원이 실제 로그인 차단되는지 본 task에서 E2E로 닫는다.

### 완료 기준
- **단위/통합 테스트**:
  - SUSPENDED 회원 로그인 → `AUTH_INVALID_CREDENTIALS`(상태 비노출).
  - ACTIVE/DORMANT 회원 로그인 → 정상 200.
  - 관리자 로그인 경로(`adminLogin`)에도 동일 적용되는지(공통 헬퍼라 자동) 확인.
- **build**: 통과.
- **실제 요청**: 정상회원 로그인 → 상태 SUSPENDED 전환(M-T3) → 동일 계정 로그인 401 재현 curl.
- **회귀 스모크(필수 2건)**: ① **정지회원 로그인 차단** ② **기존 정상회원 로그인 무영향**(M0~M6 로그인 테스트 그린).

### 의존성 / 위험도
- 의존: M-T3(`SUSPENDED` 전이 수단). · **위험도: 중~높음** — 전 사용자 로그인 경로 공통 수정. 동일응답·정상회원 무영향이 핵심.

---

## M-T4. 회원 등록

### 범위
- `POST /api/v1/admin/members` — `CreateMemberRequest`(0.2). userId 중복(`existsActiveByUserId`) →
  `USER_DUPLICATED_ID`. 비번 BCrypt(12). `user_role='CUSTOMER'`, 등급 미지정 시 `MEMBER`(없으면 `GRADE_NOT_FOUND`),
  약관(`service_yn`/`privacy_yn`) 'Y' + 동의일시, `user_status='ACTIVE'`, `use_yn='Y'`.
- `admin/member/dto/CreateMemberRequest.java`, `MemberCreatedResponse.java`.
- 가능하면 `AuthService.signup`의 등급/약관/해시 로직과 중복 최소화(공유 헬퍼 검토, 단 surgical).

### 완료 기준
- 통합 테스트: 등록 200 + 해당 계정 사용자 로그인 가능, 중복 ID 409, 미존재 등급코드 404,
  응답/로그에 평문 비번 미노출.
- build 통과. 실제 요청 curl(등록 → 로그인). 회귀: 기존 회원가입 정상.

### 의존성 / 위험도
- 의존: M-T2(서비스 골격). · **위험도: 저~중** — 평문 비번 미노출 + 중복/등급 검증.

### 확정 (M-Q4)
- 관리자 등록 회원 비밀번호 = **(a) 관리자 평문 입력**(요청 바디). 평문은 요청 바디로만 받고 즉시 BCrypt(12) 해시·미저장.
  (전달 채널/임시비번 강제변경은 별도 과제.)

---

## M-T5. 포인트 수동 조정 (참고용) `[수동리뷰 필수]`

**잔액을 바꾸는 금전성 로직 — `balance_after`/`point_balance` 정합 + 과차감 음수 방지가 트랜잭션 안에서 도는지가 핵심. 커밋 전 멈춰 승인.**

### 범위
- `POST /members/{userSeq}/points` — `PointAdjustRequest{amount, reason}`. **amount 부호 방식**(양수=적립/음수=차감).
  - **원자적**(단일 `@Transactional`): 대상 회원 조회 → `balance_after = point_balance + amount` 계산 →
    음수면 `POINT_INSUFFICIENT`(throw → 롤백) → `his_point` insert(`point_type`=EARN(amount>0)/USE(amount<0),
    `point_amount`=amount, `balance_after`, `reason`, `use_yn='Y'`) + `user.point_balance = balance_after` 갱신.
  - amount=0 → `COMMON_VALIDATION_ERROR`(검증). 대상 비CUSTOMER → `USER_NOT_FOUND`.
  - `his_point`는 append-only(`BaseCreatedEntity`) — 수정/삭제 없음.
  - **동시성**: 단일 트랜잭션 read-modify-write(낙관락/행잠금 미도입 — 고부하 보정은 별도 과제). 본 task는
    "검사+잔액변경+이력기록이 같은 트랜잭션에서 원자적으로 도는지"를 리뷰·테스트로 닫는다.
- `promotion/repository/PointHistoryRepository.java`(없으면 신규), `admin/member/dto/PointAdjust*.java`.

### 완료 기준
- 통합 테스트: 적립 후 `point_balance`==`balance_after`==기존+amount 정합, 차감 정상,
  **과차감 400 `POINT_INSUFFICIENT` + 잔액·his_point 무변화(롤백 확인)**, amount=0 검증오류,
  his_point 행 1건 생성 + `i_user` 기록, 비CUSTOMER 대상 404.
- build 통과. 실제 요청 curl(적립 1, 과차감 1 → 잔액 불변 확인). 회귀: 영향 없음.

### 의존성 / 위험도
- 의존: M-T2. · **위험도: 중~높음** — 금전성 잔액 변경. 정합성·롤백·원자성이 핵심 리뷰 포인트.

### 확정 (M-Q5)
- **(a) 쓰기 포함** + **amount 부호 방식** + **단일 트랜잭션**(낙관락/행잠금 미도입). 적립률·자동적립은 범위 밖.

---

## M-T6. role 승강 (ADMIN↔CUSTOMER) + 자가잠금/마지막ADMIN 가드 E2E `[수동리뷰 필수]`

**F에서 이관된 권한 경계 작업. 권한 승격/강등 + 자가잠금이 모이는 지점 → 수동리뷰 필수.**

### 범위 (FR-ADM-02 경계 + F 이관)
- `PATCH /api/v1/admin/members/{userSeq}/role` — `UpdateMemberRoleRequest{role}`(ADMIN|CUSTOMER).
  - **CUSTOMER → ADMIN(승격)**: `user_role='ADMIN'`, `grade_seq=null`(관리자=등급 없음, F 부트스트랩과 정합).
  - **ADMIN → CUSTOMER(강등)**: `user_role='CUSTOMER'`, 등급 부여(미지정 시 `MEMBER`, 없으면 `GRADE_NOT_FOUND`).
  - **F-T5 `AdminAccountGuard` 재사용**(신규 가드 금지):
    - `assertNotSelf(actingSeq, targetSeq)` — 본인 role 변경 차단 → `ADMIN_SELF_LOCKOUT`.
    - **강등 시** `assertNotLastAdmin(target)` — 마지막 운영 ADMIN(ROOT 제외) 강등 차단 → `ADMIN_LAST_ADMIN_PROTECTED`.
  - **ROOT 불변 보호**: 대상이 ROOT(예약 계정, `user_id='ROOT'`)면 변경 차단 → **`ADMIN_ROOT_PROTECTED`**(신설, M-Q6 확정).
- 모든 변경 `u_user` 자동 기록.

### 완료 기준 (E2E)
- 통합 테스트(Testcontainers, ADMIN 토큰):
  - 승격: CUSTOMER → ADMIN 200 + 승격 계정으로 `/api/v1/admin/auth/login` 성공 + `/admin/me` role=ADMIN.
  - 강등: ADMIN(2명 이상) → CUSTOMER 200 + 강등 계정 `/admin/auth/login` 거부(role 게이트) + 일반 로그인 가능.
  - **자가잠금**: 본인 role 강등 시도 → `ADMIN_SELF_LOCKOUT`.
  - **마지막 ADMIN**: 운영 ADMIN 1명만 남긴 뒤 강등 → `ADMIN_LAST_ADMIN_PROTECTED`.
  - **ROOT 대상** 변경 시도 → `ADMIN_ROOT_PROTECTED`(409).
  - 강등 시 grade_seq 부여 확인, 승격 시 grade_seq=null 확인.
- build 통과. 실제 요청 curl E2E + DB/audit(`u_user`) 확인.
- **회귀**: `/api/v1/admin/admins`(F-T6) 자가잠금/마지막ADMIN 동작 무변화, 전체 `./gradlew test` 그린.

### 의존성 / 위험도
- 의존: F-T5 가드, M-T2 조회. · **위험도: 높음** — 권한 경계 + 자가잠금 + 마지막ADMIN 경합 + ROOT 보호.

### 확정 (M-Q6 / M-Q7)
- **M-Q6.** ROOT 대상 변경 차단 = **전용 코드 `ADMIN_ROOT_PROTECTED`(409) 신설**.
- **M-Q7.** **즉시 토큰 무효화 = (a) 수용 + 한계 명시**(F 펜테스트 3-(2)와 동일 결정). stateless JWT 특성상
  강등/비활성 직후에도 기존 access 토큰이 만료(≤30분)까지 통한다. refresh는 이미 차단됨(`AuthService.refresh`의
  `use_yn` 검사). 토큰 블랙리스트/버전 도입은 별도 인프라 과제.

---

## 신규/수정 파일 (대표 경로)

```
src/main/java/com/micoz/admin/member/controller/AdminMemberController.java   (신규, M-T1~T6)
src/main/java/com/micoz/admin/member/service/AdminMemberService.java         (신규, M-T1~T6)
src/main/java/com/micoz/admin/member/spec/UserSpecs.java                     (신규, M-T1)
src/main/java/com/micoz/admin/member/dto/MemberSearchCondition.java          (신규, M-T1)
src/main/java/com/micoz/admin/member/dto/MemberListItem.java                 (신규, M-T1)
src/main/java/com/micoz/admin/member/dto/MemberDetailResponse.java           (신규, M-T2)
src/main/java/com/micoz/admin/member/dto/UpdateMemberGradeRequest.java       (신규, M-T3)
src/main/java/com/micoz/admin/member/dto/UpdateMemberStatusRequest.java      (신규, M-T3)
src/main/java/com/micoz/admin/member/dto/CreateMemberRequest.java            (신규, M-T4)
src/main/java/com/micoz/admin/member/dto/MemberCreatedResponse.java          (신규, M-T4)
src/main/java/com/micoz/admin/member/dto/PointAdjustRequest.java             (신규, M-T5)
src/main/java/com/micoz/admin/member/dto/PointAdjustResponse.java            (신규, M-T5)
src/main/java/com/micoz/admin/member/dto/UpdateMemberRoleRequest.java        (신규, M-T6)
src/main/java/com/micoz/promotion/repository/PointHistoryRepository.java     (신규, M-T5)
src/main/java/com/micoz/user/repository/UserRepository.java                  (수정, M-T1: JpaSpecificationExecutor)
src/main/java/com/micoz/user/entity/User.java                               (수정, M-T3/T6: changeGrade/changeStatus/role)
src/main/java/com/micoz/common/response/ErrorCode.java                       (수정, M-T3/T5/T6: +GRADE_NOT_FOUND/MEMBER_INVALID_STATUS/ADMIN_ROOT_PROTECTED)
src/main/java/com/micoz/auth/service/AuthService.java                        (수정, M-T3.5: SUSPENDED 로그인 게이팅)
src/test/java/com/micoz/admin/member/AdminMemberSearchIntegrationTest.java   (신규, M-T1)
src/test/java/com/micoz/admin/member/AdminMemberIntegrationTest.java         (신규, M-T2~T5)
src/test/java/com/micoz/auth/AdminMemberLoginGatingTest.java                 (신규, M-T3.5: SUSPENDED 차단 + 정상회원 무영향)
src/test/java/com/micoz/admin/member/AdminMemberRoleIntegrationTest.java     (신규, M-T6)
```

> DB 마이그레이션(V9+): **불필요**. `user_status` 허용값은 애플리케이션 레벨 검증(화이트리스트/enum),
> CHECK 제약 미도입 = 마이그레이션 0.

---

## 확정 결과 (2026-06-25 리뷰 반영)

| # | 항목 | 확정 |
|---|------|------|
| M-Q1 | `user_status` 허용값 | **ACTIVE / DORMANT / SUSPENDED**(WITHDRAWN 제외). 탈퇴는 `use_yn='N'` 단독 표현 |
| M-Q2 | status ↔ use_yn 분리 | **채택** — 운영상태/탈퇴 개념 분리, 별도 삭제 API 없음 |
| M-Q3 | 로그인 status 게이팅 | **도입하되 M-T3.5로 분리** `[수동리뷰 필수]`. 거부 대상 **SUSPENDED만**(DORMANT 허용, WITHDRAWN은 use_yn으로 이미 차단). 회귀 스모크 2건(정지 차단 + 정상회원 무영향) |
| M-Q4 | 등록 비번 | **(a) 관리자 평문 입력** → 즉시 BCrypt 해시·미저장 |
| M-Q5 | 포인트 수동 조정 | **쓰기 포함·부호 방식·단일 트랜잭션**. M-T5 `[수동리뷰 필수]` 승격(금전성) |
| M-Q6 | ROOT 보호 코드 | **`ADMIN_ROOT_PROTECTED`(409) 신설** |
| M-Q7 | 즉시 토큰 무효화 | **(a) 수용 + 한계 명시**(F 펜테스트 3-(2)와 동일) |

**`[수동리뷰 필수]` task: M-T1 · M-T3.5 · M-T5 · M-T6** (커밋 전 멈춰 승인).
그 외(M-T2 · M-T3 · M-T4)는 승인 없이 커밋 가능(push 금지).

> 확정 완료. M-T1부터 구현 시작.
