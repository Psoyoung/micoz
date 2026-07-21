# MICOZ 백엔드 — 실운영 배포 전 보안 점검 목록

> **실측 점검 목록 + 처리 결과.** 측정일 2026-07-21, 측정 대상 커밋 `541c393`.
> 각 항목: 현재 상태(실측) / 위험도(高·中·低) / 진입점 / 수정 규모(작음·중간·큼).
> **총평: 高 위험 0건.** 코드베이스는 전반적으로 보안 의식이 높음(시크릿 전부 env, 에러 노출 차단, JWT/refresh 견고, SQL 인젝션 없음, 민감정보 로깅 없음).
> **현황(2026-07-21): 코드 레벨 S-1~S-6 전부 해결(2커밋 `9bfa0da`·`eac5e7c`).** 남은 것은 배포 절차(O-1/O-2)뿐.

---

## 요약 — 처리 결과

### 코드 레벨 — 전부 해결 ✅ (배치 1: `9bfa0da` · 배치 2: `eac5e7c`)
| ID | 항목 | 위험 | 해결 |
|---|---|---|---|
| **S-1** ✅ | Actuator `metrics`/`prometheus` 비인증 노출 | 운영 내부정보 공개 | `SecurityConfig`: health(+probes)만 익명, 그 외 actuator ADMIN 전용 (`9bfa0da`) |
| **S-2** ✅ | 배너 `imageUrl`/`linkUrl` URL 형식 미검증 (빚 #8) | 저장형 XSS | `@Pattern` http/https 화이트리스트 + linkUrl 내부 상대경로 허용(`//`·`/\` 차단). Create/UpdateBannerRequest (`9bfa0da`) |
| **S-3** ✅ | 잘못된 요청 → 500 (빚 #7) | 상태코드 오류 | `GlobalExceptionHandler`: malformed 바디·타입불일치·필수파라미터누락 → 400 COMMON_INVALID_REQUEST (`eac5e7c`) |
| **S-4** ✅ | Swagger permitAll이 prod-disable에만 의존 | 심층방어 부재 | `SecurityConfig` 프로파일 분기: prod ADMIN 전용 / 비-prod 익명 (`eac5e7c`) |
| **S-5** ✅ | `X-Forwarded-For` 첫 값 신뢰(스푸핑 가능) | 감사 IP 부정확 | `AuthService.resolveClientIp` 주석 명시(위조가능·감사전용·보안판정 미사용). 동작 불변 (`eac5e7c`) |
| **S-6** ✅ | local 프로파일 JWT 시크릿 기본값 존재 | local 한정 | 코드 변경 없음 — prod는 `${JWT_SECRET}` env 강제(기본값 없음)·`JwtTokenProvider.init` 32자 미만 기동차단 재확인 |

검증: 전체 41스위트·276테스트·실패 0. 신규 보안 테스트 11종(배너 XSS 3·actuator 5·hygiene 3).

### 운영 체크리스트 — 열림 (코드 아님, 배포 절차)
| ID | 항목 |
|---|---|
| **O-1** | prod 환경변수 실제 주입 확인: `JWT_SECRET`(강한 랜덤 ≥32자)·`DB_PASSWORD`·`ADMIN_INIT_PASSWORD`·`CORS_ALLOWED_ORIGINS` |
| **O-2** | 최초 관리자 시드 후 비밀번호 변경, `ADMIN_INIT_PASSWORD` 환경변수 회수 |

> **"큰 것"은 코드에 없었다.** 모든 코드 수정이 작음이었고 전부 완료. 남은 무거운 항목은 배포 환경 설정(O-1/O-2)뿐 — 배포 담당과 공유.

> 아래 §1~§7은 **측정 시점(수정 전) 실측 기록**이다(감사 근거 보존). 각 항목의 처리 결과는 위 요약표 참조.

---

## §1. 시크릿 관리 — 良好 (低)

**실측:**
- 모든 시크릿이 환경변수: `application.yml`이 `DB_URL`·`DB_USERNAME`·`DB_PASSWORD`·`JWT_SECRET`·`ADMIN_INIT_PASSWORD`를 `${...}`로 참조. **하드코딩 없음.**
- **prod(`application-prod.yml`)엔 시크릿 기본값 없음** → 미주입 시 기동 실패(fail-fast). `JWT_SECRET`은 `JwtTokenProvider.init`에서 32자 미만이면 `IllegalStateException`으로 기동 차단.
- `.gitignore`가 `.env`·`.env.*` 차단(`!.env.example` 예외). **추적되는 시크릿 파일 없음** — `.env.example`(플레이스홀더 전용)만 추적. 실제 `.env` 커밋 이력 **없음**(`git log --diff-filter=A` 0건).
- 커밋된 yml/properties에 하드코딩 롱 시크릿 **없음**(git grep 0건, 전부 `${env}`).
- 관리자 부트스트랩: 평문 비밀번호 env로만 주입, DB엔 BCrypt(strength 12) 해시만. **로그에 비밀번호/해시 안 찍음**(userId만).

**남는 것 (S-6, 低):** `application-local.yml`에 `JWT_SECRET` 기본값(`local-dev-secret-please-change-in-production...`)·`DB_PASSWORD:micoz` 존재 — **local 프로파일 한정**이라 prod와 무관하나, prod 프로파일이 실수로 local 기본값을 상속하지 않는지 배포 시 확인(현재 구조상 prod는 상속 안 함).
- **진입점**: `application-local.yml`. **수정**: 작음(문서화/확인만, 코드 변경 불요).
- **운영(O-1)**: prod에서 `JWT_SECRET`·`DB_PASSWORD`를 강한 값으로 실제 주입하는지가 핵심(코드 아님).

---

## §2. 에러 응답 정보 노출 — 대체로 良好, 정정 1건

**실측 (良好):**
- `server.error.include-message: never` · `include-stacktrace: never` · `include-binding-errors: never` → 스택/바인딩 정보 응답 노출 차단.
- `GlobalExceptionHandler.handleUnexpected`는 스택을 **로그로만** 남기고(`log.error(..., ex)`), 응답엔 `COMMON_INTERNAL_ERROR`(일반 메시지)만. **DB 에러 메시지·내부정보 응답 유출 없음.**
- `BusinessException`은 정의된 `ErrorCode` 메시지만 반환.

**정정 (S-3 = 빚 #7, 低):**
- `GlobalExceptionHandler`에 **`HttpMessageNotReadableException`(malformed JSON 바디) 핸들러가 없음** → `handleUnexpected(Exception)`로 떨어져 **500** 반환(원론상 400이어야). 유사하게 `MethodArgumentTypeMismatchException`(경로/쿼리 타입 불일치)·`MissingServletRequestParameterException`도 500으로 떨어짐.
- 응답 본문엔 스택 없음(누출 아님) — **상태코드 정확성 문제**(500 vs 400).
- **진입점**: `common/exception/GlobalExceptionHandler.java`에 핸들러 추가. **수정**: 작음.

---

## §3. 인증 / 인가 — 良好, Actuator 1건

**실측 (良好):**
- **JWT**: HS256, access 30분 / refresh 14일. access 클레임(userSeq·userId·role). 시크릿 32자 강제(기동 검증).
- **Refresh**: 32바이트 `SecureRandom` Base64URL raw + DB엔 SHA-256 해시만 저장. **회전(rotation)** + **재사용 탐지**(revoked 토큰 재제출 시 해당 user 전체 무효화, `AuthService.refresh` L188-196) + 만료/위조/비활성(use_yn='N') 분기. 로그아웃 멱등·타인 토큰 `AUTH_FORBIDDEN`.
- **열거·타이밍 방어**: 미존재 사용자도 dummy BCrypt 비교(NFR-07), 관리자 로그인도 role 불일치를 동일 `AUTH_INVALID_CREDENTIALS`로.
- **관리자 게이팅**: `SecurityConfig`에서 `/api/v1/admin/**` → `hasRole("ADMIN")`, `POST /api/v1/admin/auth/login`만 permitAll(먼저 선언). 컨트롤러 클래스 레벨 `@PreAuthorize` 2차 방어. **빠진 관리자 경로 없음**(실측: admin 컨트롤러 전부 `/api/v1/admin/*` 프리픽스 → 단일 게이트 커버).
- **CORS**: origin을 `CORS_ALLOWED_ORIGINS` env에서(와일드카드 아님). `allowCredentials(true)` + **명시 origin 리스트**(와일드카드+credentials 조합 아님 = 올바름). 미설정 시 기본 `localhost:3000`(fail-safe/closed).

**남는 것 (S-1, 中):**
- `SecurityConfig` L60-61: `/actuator/metrics/**`·`/actuator/prometheus`가 **permitAll(비인증)**. prod에서 익명 사용자에게 JVM 메모리·HTTP 요청 URI별 지연·DB 풀 등 운영 내부지표가 노출됨(정보 노출). `health`는 `show-details: when_authorized`라 안전, `info`는 경미.
- **진입점**: `SecurityConfig` authorizeHttpRequests에서 `metrics`/`prometheus`를 인증 뒤로 옮기거나, `management.endpoints.web.exposure`를 축소, 또는 별도 관리 포트/네트워크 제한. **수정**: 작음.
- **참고**: refresh 14일은 다소 길지만 회전+재사용탐지가 있어 수용 가능(정책 판단).

---

## §4. 입력 검증 — SQL 인젝션 없음, 배너 URL 1건

**실측 (良好):**
- **SQL 인젝션 없음**: 네이티브 쿼리는 `DashboardAggregationRepository` 8개뿐. 문자열 결합은 **컴파일 상수** `REVENUE_STATUSES`(`'PAID','PREPARING',...`, 사용자 입력 아님)뿐이고, 사용자 값(기간 start/end)은 전부 `:start`/`:end` **바인딩 파라미터**. 그 외 전 리포지토리는 Spring Data 파생 쿼리/JPQL(파라미터 바인딩).
- **파일 업로드 없음**: 이미지는 URL 참조(`imageUrl` 문자열). 업로드 엔드포인트 부재 → 업로드 검증 대상 없음.
- 요청 DTO 대부분 `@NotBlank`/`@NotNull`/`@Min` 등 Bean Validation 적용.

**남는 것 (S-2 = 빚 #8, 中):**
- `CreateBannerRequest`·`UpdateBannerRequest`의 `imageUrl`·`linkUrl`이 **`@NotBlank`만, URL 형식 미검증**. `javascript:...`나 비정상 URL이 저장될 수 있음 → 프론트가 이를 `href`/`src`로 무필터 렌더 시 **저장형 XSS** 소지.
- **위험도 中으로 봄**(기존 빚 #8은 "형식 미검증 低"였으나, `linkUrl`의 XSS 각도로 재평가).
- **진입점**: `CreateBannerRequest`/`UpdateBannerRequest`에 URL 형식·스킴 화이트리스트(`http`/`https`만) 검증 추가. **수정**: 작음. (프론트 렌더 측 방어와 병행이 이상적이나 서버 저장 차단이 1차)

---

## §5. 로깅 — 良好 (低)

**실측:**
- 비밀번호·토큰·시크릿·개인정보(email/phone/card)를 로그로 찍는 코드 **없음**(grep 0건).
- `printStackTrace`·`System.out.print` **없음**(0건). 스택은 SLF4J `log.error`로만.
- 관리자 부트스트랩 로그는 userId만. `BusinessException`은 `code`/message만 warn.
- **남는 것 (S-5, 低)**: `AuthService.resolveClientIp`가 `X-Forwarded-For` 첫 값을 신뢰(스푸핑 가능) — 단 이 IP는 refresh 토큰 **감사 기록용**일 뿐 보안 판정에 안 쓰임. 리버스 프록시 신뢰 경계 확정 시 정정 가능. **수정**: 작음.

---

## §6. 운영 설정 — 良好, 배포 체크리스트

**실측 (良好):**
- `spring.jpa.hibernate.ddl-auto: validate` (프로덕션 안전 — create/update 아님). Flyway `validate-on-migrate: true`, `baseline-on-migrate: false`.
- `open-in-view: false` (좋음).
- prod: `show-sql: false`, `format_sql: false`, 로그 레벨 `com.micoz: INFO`·`org.hibernate.SQL: WARN`. **Swagger prod 비활성**(`springdoc.api-docs.enabled: false`, `swagger-ui.enabled: false`).
- 관리자 부트스트랩: 멱등(기존 운영 ADMIN 있으면 skip), 비밀번호 미주입 시 경고만·크래시 없음, ROOT 미접근.

**남는 것:**
- **S-4 (低)**: `SecurityConfig`가 `/v3/api-docs/**`·`/swagger-ui/**`를 permitAll로 둠. 실제 차단은 **prod의 springdoc 비활성**에만 의존(심층방어 부재) — prod 비활성이 실수로 빠지면 API 문서가 공개됨. **진입점**: prod에서 이중 확인 또는 SecurityConfig에서 프로파일별 분기. **수정**: 작음.
- **O-1/O-2 (운영)**: prod 환경변수 실제 주입 확인(`JWT_SECRET` 강한 랜덤·`DB_PASSWORD`·`ADMIN_INIT_PASSWORD`·`CORS_ALLOWED_ORIGINS`가 실제 프론트 도메인). 최초 관리자 시드 후 비밀번호 변경 + `ADMIN_INIT_PASSWORD` 회수. **코드 아님 — 배포 절차.**

---

## §7. 다음 단계
1. 위 목록 리뷰 → 우선순위 확정.
2. 권장 순서: **中 먼저**(S-1 actuator 게이팅 · S-2 배너 URL 검증) → **低 위생**(S-3 malformed 400 = 빚 #7 · S-4 swagger 심층방어 · S-5 XFF · S-6 local 시크릿 확인).
3. **O-1/O-2**는 코드 아닌 배포 체크리스트 — 배포 담당과 별도 공유.
4. 모든 코드 수정이 "작음"이라 개별 커밋 또는 소규모 묶음 가능. 위험 로직(금액·상태) 아님 → 게이트는 검증 후 커밋 수준(단, S-2 배너 검증은 회귀 테스트 동반 권장).

> HANDOFF §4 기존 빚 통합: **#7 malformed 400 → S-3**, **#8 배너 URL → S-2**(中으로 재평가). 나머지 S-1·S-4·S-5·S-6은 이 감사에서 신규 식별.
