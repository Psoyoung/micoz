# MICOZ 데모/포트폴리오 배포 계획 (무료 티어)

> **계획만.** 실제 배포는 이 계획 검토 후. 코드/설정 실측(2026-07-21, 커밋 `7f0670e`) 기반.
> 목표 구성: **DB=Neon**(무료 Postgres 0.5GB, scale-to-zero) · **백엔드=Render 웹서비스**(Docker, GitHub 자동배포, 15분 유휴 sleep) · **프론트=Render 정적사이트**(무제한 무료, sleep 없음).
> 각 항목 분류: 🟥 **코드 수정 필요** / 🟨 **설정만** / 🟦 **플랫폼 작업**.
> ⚠️ 플랫폼(Render/Neon) 세부 동작은 배포 시점에 각 공식 문서로 재확인(무료 티어 정책·PORT 규약은 변동 가능).
>
> **⚠️ 저장소 구조(실측 — Render 설정에 필수)**: 백엔드와 프론트는 **별도 git 저장소**다.
> - **백엔드**: 저장소 루트 = `C:/soyoung/micoz` → `github.com/Psoyoung/micoz`. 앱은 **`micoz_backend/` 서브디렉터리**에 위치(Dockerfile도 거기). → **Render 백엔드의 Root Directory = `micoz_backend`** 로 지정해야 함.
> - **프론트**: 저장소 루트 = `C:/soyoung/micoz/micoz-front` → **`github.com/Psoyoung/micoz-design`**(다른 origin). → Render 정적사이트는 이 저장소 연결, Root Directory = 저장소 루트.
> - 코드 수정 커밋도 두 저장소로 분리(§5).

---

## 1. 현재 배포 관련 설정 — 실측

### 1.1 컨테이너 (배포 준비 良好)
- **`Dockerfile`**(존재): 멀티스테이지 — ① `gradle:8.8-jdk17-alpine`로 `gradle clean bootJar -x test` ② `eclipse-temurin:17-jre-alpine` 런타임. **non-root**(micoz 유저), `EXPOSE 8080`, `ENTRYPOINT java $JAVA_OPTS -jar app.jar`, `JAVA_OPTS=-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC`. → Render Docker 배포에 그대로 적합.
- **`.dockerignore`**(존재): `.env`·`build`·`.md`(README 제외)·IDE·`node_modules` 제외 → 빌드 컨텍스트 깨끗, 시크릿 유입 없음.
- **`docker-compose.yml`**(존재): 로컬 개발용(postgres 15 + app 번들). **Render는 Dockerfile을 직접 빌드하므로 compose는 배포에 미사용** — Neon이 postgres 서비스를 대체. 로컬용으로 유지.

### 1.2 프로파일·환경변수 (env 분리 良好)
- 프로파일: `spring.profiles.active: ${SPRING_PROFILES_ACTIVE:local}` — **`prod` 프로파일 존재**(`application-prod.yml`: show-sql off·swagger 비활성·로그 INFO/WARN). base + local + prod + test 4종.
- **환경변수로 빠진 것**(전부 `${...}`, 하드코딩 없음):
  | 변수 | base 기본값 | 배포 시 |
  |---|---|---|
  | `DB_URL` | (없음) | Neon JDBC 문자열 |
  | `DB_USERNAME` | (없음) | Neon 유저 |
  | `DB_PASSWORD` | (없음) | Neon 비번 |
  | `JWT_SECRET` | (없음 — 미주입 시 기동차단) | 강한 랜덤 ≥32자 |
  | `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | 프론트 Render URL |
  | `SERVER_PORT` | `8080` | ⚠️ Render는 `PORT` 주입(§2.1) |
  | `ADMIN_INIT_PASSWORD` | `` (빈값→시드 skip) | 최초 관리자 비번 |
  | `ADMIN_INIT_USER_ID/NAME/EMAIL` | admin/운영관리자/빈 | 선택 |
  | `SPRING_PROFILES_ACTIVE` | `local` | `prod` |

### 1.3 Flyway·시드 (자동 프로비저닝 — 큰 이점)
- `flyway.enabled: true`, `validate-on-migrate: true`, `baseline-on-migrate: false`, `locations: classpath:db/migration`. `ddl-auto: validate`.
- **마이그레이션 V1~V11**에 스키마 + **전 시드 데이터 포함**: V2 사용자등급(MEMBER)·V4 카테고리·V5 상품/라벨·V6 배너·V7 배송설정·V8 쿠폰/포인트.
- → **Neon 빈 DB에 첫 배포 시 Flyway가 스키마+시드까지 자동 생성.** 수동 시드·덤프 불요. (앱이 요구하는 "기본 등급 MEMBER"·"배송설정"이 V2·V7로 충족 → 회원가입·주문 정상 동작.)

### 1.4 프론트 (Vite 정적 빌드 — 정적사이트 적합, 단 API base 문제)
- `micoz-front/`: **Vite + React 18 + TS + axios + react-query + react-router**. `npm run build`(`tsc -b && vite build`) → **`dist/`** 정적 산출물. Render 정적사이트에 적합.
- ⚠️ **API base URL이 상대경로 하드코딩**: `src/api/client.ts`·`src/api/admin/client.ts` 각각 `axios.create({ baseURL: '/api/v1' })`(파일당 client+refreshClient = 총 4곳).
  - dev: `vite.config.ts`의 프록시가 `/api`→`http://localhost:8080`로 넘김(빌드에 미포함).
  - **prod: 정적사이트엔 프록시가 없어 `/api/v1`이 정적사이트 자기 도메인으로 감 → 백엔드 못 찾음(404).** → §2.4 코드 수정 필요.
- 인증: Bearer 토큰(localStorage, `token.ts`) — 쿠키 아님. 크로스오리진 시 SameSite 쿠키 이슈 없음(CORS 허용 + Authorization 헤더면 됨).

---

## 2. 배포용으로 바꿔야 할 것

### 2.1 🟥 백엔드 PORT — Render `$PORT` 바인딩
- **현재**: 앱이 `server.port: ${SERVER_PORT:8080}`로 8080 고정. Render 웹서비스는 **`PORT` 환경변수를 주입**하고 컨테이너가 그 포트를 리슨하길 기대(무료 Docker 서비스, 기본 10000).
- **수정(설정 파일)**: `application.yml` → `server.port: ${PORT:${SERVER_PORT:8080}}` (Render의 PORT 우선, 없으면 SERVER_PORT, 없으면 8080). Dockerfile `EXPOSE`는 문서용이라 무관.
  - *대안(플랫폼)*: Render에서 서비스 포트를 명시 지정 + `SERVER_PORT` env로 맞추기. 단 env는 `PORT` 값을 보간 못 하므로 **코드 fallback이 더 견고** → 권장.
- **재확인**: 배포 시점 Render의 Docker 포트 감지 규약(PORT 주입/포트 명시) 문서 확인.

### 2.2 🟨 DB 연결 — Neon 문자열 + SSL
- **설정만**: `DB_URL=jdbc:postgresql://<neon-host>/<db>?sslmode=require` (Neon은 **SSL 필수** — `sslmode=require` 누락 시 연결 실패). `DB_USERNAME`·`DB_PASSWORD`는 Neon 대시보드 값.
  - Neon 연결 문자열은 `postgresql://user:pass@host/db?sslmode=require` 형태로 주어짐 → JDBC용으로 `jdbc:` 접두 + host/db만 URL에, user/pw는 별도 env로 분리 권장.
  - Neon **pooled 연결 문자열**(`-pooler` 호스트) 사용 권장(scale-to-zero + 서버리스에 적합). 배포 시 Neon 문서 확인.

### 2.3 🟨 CORS — 배포 도메인 수용
- **설정만**: `CORS_ALLOWED_ORIGINS`를 프론트 Render URL(예: `https://micoz-front.onrender.com`)로. `CorsConfig`는 콤마분리 다중 origin 지원 → 커스텀 도메인 추가 시 콤마로.
- ⚠️ **닭-달걀**: CORS엔 프론트 URL이, 프론트엔 백엔드 URL이 필요 → §3 순서(백엔드 먼저 배포→URL 확보→프론트 배포→백엔드 CORS 갱신)로 해소.

### 2.4 🟥 프론트 API base URL — 환경변수화
- **수정(코드, 2파일 4곳)**: `client.ts`·`admin/client.ts`의 `baseURL: '/api/v1'` → `baseURL: (import.meta.env.VITE_API_BASE_URL ?? '') + '/api/v1'`.
  - dev: `VITE_API_BASE_URL` 미설정 → `'/api/v1'`(상대, Vite 프록시 유지).
  - prod: Render 정적사이트 빌드 env `VITE_API_BASE_URL=https://<백엔드>.onrender.com` → `https://.../api/v1`(절대, 크로스오리진 + CORS).
- **설정(플랫폼)**: Render 정적사이트 빌드 환경변수 `VITE_API_BASE_URL` 주입(빌드타임에 번들로 인라인됨).

### 2.5 🟦 프론트 SPA 라우팅 rewrite
- react-router 클라이언트 라우팅 → 정적사이트에 **`/* → /index.html`(200 rewrite)** 규칙 필요(딥링크·새로고침 404 방지). Render 정적사이트 Redirect/Rewrite 설정.

---

## 3. 배포 절차 체크리스트

> 순서 중요(닭-달걀·자동 마이그레이션 의존성).

| # | 단계 | 분류 |
|---|---|---|
| 1 | **코드 수정 선반영·커밋·push**: §2.1 PORT fallback(백엔드) + §2.4 API base env(프론트). 배포 전 origin 반영 | 🟥 |
| 2 | **Neon 프로젝트 생성**(⚠️ **리전 먼저 결정** — 3번 Render 백엔드를 이 리전에 맞춤) → DB 생성 → **연결 문자열 확보**(host/db/user/pw, pooled 권장). `sslmode=require` 확인 | 🟦 |
| 3 | **Render 백엔드 웹서비스 생성**: micoz_backend GitHub 연결, 런타임 Docker(Dockerfile 자동 감지). ⚠️ **리전을 Neon과 같은/인접 리전으로**(멀면 쿼리마다 왕복 지연 수백ms → 목록 화면 느려짐). **헬스체크 경로 `/actuator/health`** 지정(포트 바인딩만 보는 것보다 정확 — S-1에서 health 익명 허용 유지). **환경변수 주입**: `SPRING_PROFILES_ACTIVE=prod`·`DB_URL`(Neon)·`DB_USERNAME`·`DB_PASSWORD`·`JWT_SECRET`(강한 랜덤)·`ADMIN_INIT_PASSWORD`(**강하게** — /admin/login이 인터넷 공개됨)·`CORS_ALLOWED_ORIGINS`(임시 placeholder, 7번서 갱신) | 🟦🟨 |
| 4 | **1차 배포 → Flyway 자동 마이그레이션 확인**: 로그에서 V1~V11 적용 + 시드 완료. `ddl-auto=validate` 통과. Neon에 스키마·시드 생성됨 | 🟦 |
| 5 | **관리자 부트스트랩 확인**: 로그 "운영 관리자 계정을 시드했습니다: userId=admin". `/actuator/health` 200 확인(익명 허용). Render 헬스체크 green 확인 | 🟦 |
| 6 | **Render 정적사이트 생성**: micoz-front 연결, **build `npm run build`·publish `dist`**, env `VITE_API_BASE_URL=https://<백엔드>.onrender.com`. **SPA rewrite `/*→/index.html`** 추가 | 🟦🟨 |
| 7 | **CORS 연결**: 백엔드 `CORS_ALLOWED_ORIGINS`를 정적사이트 URL로 갱신 → 백엔드 재배포 | 🟨🟦 |
| 8 | **E2E 스모크**: 프론트 로드 → 회원가입/로그인 → 관리자 로그인 → 크로스오리진 API 정상(카탈로그·주문·관리자 목록) | 🟦 |
| 9 | **O-2 보안 마감 — 배포 당일 완료**: 배포 순간 `/admin/login`이 인터넷 공개되므로 미루지 말 것. 앱에서 관리자 비밀번호 변경 → Render에서 **`ADMIN_INIT_PASSWORD` env 삭제**(회수). (부트스트랩은 멱등이라 이미 관리자 존재 시 재시드 안 함 — 안전) | 🟨🟦 |

> **O-1**(보안 감사): 3·6번에서 `JWT_SECRET` 강한 랜덤·`DB_PASSWORD`·`CORS_ALLOWED_ORIGINS` 실제 주입이 곧 O-1 이행.
> **O-2 당일 완료**: `/admin/login` 공개 노출 = 유일한 인터넷 공격면. `ADMIN_INIT_PASSWORD`를 강하게 설정하고, 비번 변경 + env 회수를 배포 당일 마감(9번).

---

## 4. 무료 티어 제약 & UX 대응

### 4.1 제약 (실측 구성 기준)
- **Render 백엔드(무료 웹서비스)**: **15분 유휴 → sleep**. 다음 요청 시 **콜드스타트 ~1분**(컨테이너 기동 + JVM 부팅 + Flyway validate + Spring 컨텍스트). RAM **512MB**. **선제 튜닝 반영됨**(이번 코드 배치): `Dockerfile` `MaxRAMPercentage=65%`(힙 ~333MB, 여유 확보) + prod `hikari.maximum-pool-size=3`(연결/메모리 절약). OOM 여전히 나면 `JAVA_OPTS`에서 추가 하향 또는 플랫폼 상향.
- **리전 정합**: Render 백엔드 ↔ Neon DB 리전이 멀면 **쿼리마다 왕복 지연(수백ms)** → 목록 화면 체감 저하. Neon 리전 먼저 정하고 Render를 같은/인접 리전으로(§3-2·3).
- **Neon(무료)**: 스토리지 **0.5GB**, **scale-to-zero**(유휴 시 컴퓨트 정지), 월 컴퓨트 한도(~**100 CU-hours** 급, 배포 시 재확인). 유휴 후 첫 쿼리에 **웨이크(~수백ms~수초)**.
- **콜드스타트 중첩**: 유휴 후 첫 요청 = Render 컨테이너 기동(~30~60s) + Neon 웨이크(~1~5s). 데모에서 첫 로드가 느림.
- **정적사이트**: sleep 없음·무제한 → 프론트는 항상 즉시. **첫 API 호출만 백엔드 콜드스타트에 걸림.**

### 4.2 UX 대응 (권장 — 별도 후속, 이번 계획 범위 밖 실행)
- 🟥 프론트: 첫 API 호출/앱 진입 시 **"서버 기동 중(최대 1분)" 안내 + 스피너 + 재시도**. axios 타임아웃을 콜드스타트에 맞춰 넉넉히(현재 `axios.create`에 timeout 미설정=무한 → 스피너만 있으면 됨; 명시 타임아웃 줄 경우 60s+).
- 🟨 선택: Render 백엔드에 **외부 핑(예: cron-job.org 5~10분 간격 `/actuator/health`)**으로 sleep 방지 — 단 무료 컴퓨트(Neon CU-hours) 소모 가속하므로 데모용은 "느린 첫 로드 감수 + 안내"가 더 무난.
- 🟦 데모 안내: 포트폴리오 설명에 "무료 인프라라 첫 접속 시 기동 지연" 한 줄.

---

## 5. 요약 — 분류별 할 일

**🟥 코드 수정 (이번 배치 — 커밋 대상):**
1. 백엔드 `application.yml` — `server.port: ${PORT:${SERVER_PORT:8080}}` (§2.1) ✅
2. 프론트 `client.ts`·`admin/client.ts` — `baseURL`를 `VITE_API_BASE_URL` 기반으로(공유 상수 `API_BASE_URL`) + `vite-env.d.ts` 타입 (§2.4, 4곳) ✅
3. 선제 메모리 튜닝 — `Dockerfile` MaxRAMPercentage 75→65 + prod `hikari.maximum-pool-size=3` (§4.1) ✅
4. (선택·후속) 프론트 콜드스타트 UX 안내 (§4.2) — 이번 배치 밖

**🟨 설정만 (환경변수·플랫폼 옵션):**
- `SPRING_PROFILES_ACTIVE=prod`·Neon `DB_*`(+sslmode)·`JWT_SECRET`·`CORS_ALLOWED_ORIGINS`·`ADMIN_INIT_PASSWORD`·프론트 `VITE_API_BASE_URL`·SPA rewrite

**🟦 플랫폼 작업:**
- Neon 프로젝트·Render 백엔드 웹서비스·Render 정적사이트 생성, 자동배포 연결, 마이그레이션/부트스트랩 확인, E2E 스모크, O-2 비번 회수

**배포 성패 핵심 3가지**: (1) PORT 바인딩(§2.1) — 안 하면 Render 헬스체크 실패, (2) 프론트 API base(§2.4) — 안 하면 프론트에서 API 404, (3) CORS+SSL(§2.2~2.3) — 안 하면 크로스오리진/DB 연결 실패. Flyway 시드는 자동이라 걱정 없음(§1.3).

---

## 6. 다음 단계
1. 이 계획 검토 → 우선순위·범위 확정.
2. 🟥 코드 수정 2건(PORT·프론트 base) 먼저 반영(각 [수동리뷰]는 아니나 배포 직결이라 검증 동반) → 커밋/push.
3. 🟦 플랫폼 작업은 Neon/Render 계정에서 진행(§3 체크리스트) — 실제 배포 단계.
