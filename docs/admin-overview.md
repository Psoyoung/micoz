# MICOZ 관리자 백오피스 — 모듈 개요 (M7 상위 맵)

> **목적**: M7 관리자 마일스톤에 들어가기 전, 도메인을 모듈로 그룹핑한 **상위 맵**.
> 세부 task 분해와 구현은 본 문서 다음 단계에서 모듈별로 진행한다.
> **기준 문서**: `MICOZ_PRD.md` §5 Epic G (FR-ADM-01~11), §11 미해결 항목.

---

## 1. 모듈 그룹핑

| # | 모듈 | 포함 FR | 리소스 (테이블) | 핵심 화면/기능 |
|---|------|---------|----------------|---------------|
| **F** | **Foundation (관리자 기반)** | FR-ADM-10, FR-ADM-11 | `mst_user(role=ADMIN)`, `dat_refresh_token` | 관리자 로그인 진입점, 관리자 계정 추가/상태 관리, `/api/v1/admin/**` 권한 게이팅, AdminPrincipal 분리 |
| **M** | **Member 회원 관리** | FR-ADM-02 | `mst_user`, `mst_user_grade`, `his_point` | 회원 목록·검색, 등급/상태 변경, 회원 등록, 포인트 수동 조정 (참고용) |
| **C** | **Catalog 카탈로그** | FR-ADM-03, FR-ADM-04 | `mst_category`, `mst_product`, `mst_product_option/image/label`, `map_product_label` | 2단계 카테고리 CRUD/노출/정렬, 상품·옵션·이미지·라벨 등록/수정, 재고·판매상태 관리 |
| **O** | **Order Ops 주문 운영** | FR-ADM-05 | `dat_order`, `dat_order_item`, `dat_order_shipping`, `dat_order_payment` | 주문 목록·검색·상세, **상태 전이**(PAID → PREPARING → SHIPPED → IN_TRANSIT → DELIVERED), **운송장 번호 입력** (→ FR-SHIP-01 완전화) |
| **R** | **Returns 반품/교환 처리** | FR-ADM-06 | `dat_return`, `dat_return_item` | 신청 처리 워크플로우 (REQUESTED → APPROVED → COLLECTED → INSPECTED → COMPLETED/REJECTED), 환불 금액 산정 |
| **CS** | **Customer Support 문의 응대** | FR-ADM-07 | `dat_inquiry`, `dat_inquiry_reply` | 문의 목록·답변 등록 (WAITING → ANSWERED, → FR-MY-04 완전화) |
| **S** | **Operation Settings 운영 설정** | FR-ADM-08, FR-ADM-09 | `mst_banner`, `mst_shipping` | 메인 배너 CRUD/노출/정렬, 기본 배송비·무료배송 기준·도서산간 추가비 (단일행 수정) |
| **D** | **Dashboard 대시보드** | FR-ADM-01 | (집계 — 위 모든 모듈) | 매출/주문 KPI, 매출 추이, 유입 위젯(GA 의존), 기간 필터 |

**미연결 화면 (PRD §11 보류)**: `SalesView`, `SettingsBrand/Notify/Api` — 본 맵 범위 외. §11 결정 후 별도 모듈 신설.

---

## 2. 모듈 의존성 및 구현 추천 순서

```
   ┌──────────────────────────┐
   │ F. Foundation (RBAC)     │  ← 모든 모듈의 전제
   └────────────┬─────────────┘
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
  ┌─────────┐      ┌──────────┐
  │ M. Member│     │ C. Catalog│   ← 도메인 마스터 (다른 모듈에서 참조)
  └────┬─────┘     └──────┬───┘
       │                  │
       │                  ▼
       │             ┌──────────┐
       │             │ S. Settings│  ← 카탈로그/배너 운영
       │             └──────────┘
       │
       ▼
  ┌─────────┐
  │ O. Order │  ← 회원/카탈로그 참조
  └────┬────┘
       ▼
  ┌─────────┐
  │ R. Returns│  ← 주문 참조
  └────┬─────┘
       │
       ▼
  ┌──────┐
  │ CS    │  ← 모든 도메인의 끝단 (문의가 다른 리소스 참조 가능)
  └──┬───┘
     ▼
  ┌─────────┐
  │ D. Dashboard│  ← 모든 모듈의 집계
  └─────────┘
```

### 권장 순서
1. **F. Foundation** — RBAC/관리자 로그인이 없으면 다른 모듈이 무방비. 최우선.
2. **M. Member** + **C. Catalog** — 독립 모듈. 병렬 진행 가능. 다른 운영 모듈의 참조 마스터.
3. **S. Settings** — 카탈로그와 함께 운영 작업. M/C 이후 또는 병렬 가능.
4. **O. Order Ops** — 주문 상태 전이 + 운송장 입력. FR-SHIP-01 완전화에 직결.
5. **R. Returns** — 주문 워크플로우의 후속. O 완료 후.
6. **CS** — 비교적 독립적이지만 사용자 측 FR-MY-04 답변 노출이 막혀있어 우선순위 조정 가능.
7. **D. Dashboard** — 위 데이터 집계 기반. 모든 운영 흐름이 동작한 뒤 의미.

> **블로커**: FR-ADM-11 관리자 로그인 화면/플로우 정의(PRD §11)가 미확정. Foundation 진입 전 결정 필요.

---

## 3. 관리자 공통 패턴

### 3.1 목록 API 공통 규칙

모든 관리자 목록 엔드포인트는 다음 형식을 따른다.

| 항목 | 규약 |
|---|---|
| **경로** | `GET /api/v1/admin/{resource}` |
| **페이징** | Spring Data `Pageable` — `page` (0부터, default 0), `size` (default 20, 최대 100 권장) |
| **정렬** | `sort={field},{asc\|desc}` 다중 허용 (예: `sort=orderDate,desc&sort=orderSeq,desc`). 도메인별 기본 정렬값을 컨트롤러 `@PageableDefault`로 지정 |
| **검색 (공통)** | `q` (검색어, 도메인별 대상 컬럼 지정), `dateFrom`/`dateTo` (ISO-8601, audit `i_date` 또는 도메인 일자 컬럼), `status` (상태 enum) |
| **검색 (도메인별 권장)** | 회원: `userId`/`userName`/`gradeCode` · 주문: `orderNo`/`orderStatus`/`userSeq` · 반품: `returnNo`/`returnStatus` · 상품: `productCode`/`categorySeq`/`displayYn` · 문의: `inquiryType`/`inquiryStatus` |
| **응답** | `PageResponse<T>` (사용자 측과 동일 — `content`/`page`/`size`/`totalElements`/`totalPages`) |
| **소프트 삭제 필터** | 별도 옵션 없으면 활성 행(`use_yn='Y'`)만 노출. `includeDeleted=true`로 전체 노출 옵션 검토 |

**구현 시 주의**: 검색 조건 조합이 도메인마다 다르므로 도메인별 Specification 또는 QueryDSL 도입 검토 (현재 코드베이스는 Spring Data 파생 쿼리 위주 — 관리자에서는 동적 쿼리 필요).

### 3.2 권한 체크 (RBAC)

| 항목 | 정책 |
|---|---|
| **현재 role 모델** | `mst_user.user_role` 단일 컬럼. `CUSTOMER` / `ADMIN` 2단계 (PRD §11 RBAC 세분화 미확정) |
| **권한 게이팅 위치** | `SecurityConfig` 패턴 매칭(`/api/v1/admin/**`) + Service 메서드 단위 `@PreAuthorize("hasRole('ADMIN')")` 이중 방어 권장 |
| **AdminPrincipal 분리 여부** | (결정 필요) — 사용자 `UserPrincipal` 재사용 vs `AdminPrincipal` 별도 클래스. 단일 role이면 재사용 + role 검사로 충분. RBAC 세분화 시 분리 권장 |
| **JWT** | 사용자 측과 동일 토큰 발급 흐름 재사용. role 클레임은 이미 발급 시 포함됨 |
| **권한 미달 응답** | `AUTH_FORBIDDEN` (HTTP 403). `CustomAccessDeniedHandler`에서 처리됨 |
| **감사 (audit)** | 모든 변경은 `u_user` = 관리자 `user_id` 자동 기록 (NFR-12, M1 `AuditorAwareImpl` 그대로 활용) |

### 3.3 공통 응답/에러 포맷

사용자 측과 **완전 동일**한 봉투를 사용한다.

- 성공: `ApiResponse<T>` — `code="SUCCESS"`, `message`, `data`
- 페이지: `PageResponse<T>`
- 에러: `ApiResponse.error(ErrorCode)` — `code`, `message`

새 에러가 필요하면 기존 `ErrorCode` enum에 도메인 프리픽스로 추가. 예시 (M7 신규 후보):
- `ADMIN_TARGET_NOT_FOUND` (404 — 관리 대상 리소스 미존재 일반 케이스)
- `ORDER_TRANSITION_INVALID` (409 — 허용되지 않는 상태 전이)
- `RETURN_TRANSITION_INVALID` (409 — 동일)
- `INQUIRY_ALREADY_ANSWERED` (409 — 중복 답변 시도)
- `CATEGORY_HAS_CHILDREN` (409 — 자식 있는 카테고리 삭제 시도)
- `PRODUCT_HAS_ORDERS` (409 — 주문 이력이 있는 상품 하드 삭제 시도)

> 신규 에러는 본 맵에서는 "후보"로만 두고, 모듈별 task 분해 시 확정.

### 3.4 삭제 정책 (소프트 vs 하드)

| 분류 | 정책 | 대상 |
|---|---|---|
| **마스터 (`mst_*`)** | 원칙 **소프트 삭제** (`use_yn='N'`) | 회원, 카테고리, 상품/옵션/이미지/라벨, 배너, 쿠폰, 관리자 계정 |
| **트랜잭션 (`dat_*`)** | 원칙 **삭제 금지 (상태 전이로 대체)** — PRD §7 스냅샷 보존 정책 | 주문, 결제, 반품, 리뷰 |
| **append-only (`his_*`, `map_*`)** | **변경/삭제 금지** | 포인트 이력, 상품-라벨 매핑, refresh token, 반품 라인 등 |
| **단일행 설정** | **업데이트만**, 삭제 없음 | `mst_shipping`, `mst_user_grade` |

**예외 정책**:
- **카테고리**: 자식 카테고리/상품이 있으면 `use_yn='N'` 차단 → `CATEGORY_HAS_CHILDREN`
- **상품**: 주문 이력이 있으면 하드 삭제 금지 → `use_yn='N'`만 허용. 동시에 `display_yn='N'`로 노출 차단 가능
- **관리자 본인 계정**: 본인 삭제 차단 (자가 잠금 방지)
- **답변(`dat_inquiry_reply`)**: append-only 정책상 수정/삭제 금지. 정정 필요 시 새 답변 추가 + 문의 상태 유지

### 3.5 audit 자동 기록

- `mst_*`, `dat_*` 모두 `BaseEntity` 상속 → `i_user`/`i_date`/`u_user`/`u_date` 자동
- 관리자 작업: `u_user` = 관리자의 `user_id` (예: `ROOT`, `admin01`)
- 사용자 측 통계/이력 노출 시 audit 컬럼 직접 노출 금지 (운영자 정보 비노출)

---

## 4. 결정 보류 항목 (모듈 분해 전 합의 필요)

### 4.1 Foundation 항목 — ✅ 확정 완료 (2026-06-22, `docs/foundation-decisions.md`)

| 항목 | 영향 모듈 | 확정 결과 |
|---|---|---|
| ✅ **FR-ADM-11 관리자 로그인 플로우** | F | **별도 진입점** `POST /api/v1/admin/auth/login` + 내부 role 게이트. UI는 `micoz.com/admin` 서브패스(CORS 동일 출처) |
| ✅ **RBAC 세분화 단계** | F + 모두 | **단일 ADMIN 유지** + `@EnableMethodSecurity` 후크 확보. 다단계 예정 없음 |
| ✅ **AdminPrincipal 분리 여부** | F | **UserPrincipal 재사용** (단일 role 단계 한정) |
| ✅ **자기 자신 ADMIN role 변경/삭제 차단 규칙** | F, M | **균형 정책** — 본인 role 변경/소프트삭제/비활성화 차단 + 마지막 ADMIN 보호. 신규 에러 `ADMIN_SELF_LOCKOUT`, `ADMIN_LAST_ADMIN_PROTECTED`. 본인 비번 변경은 허용 |
| ✅ **동적 검색 쿼리 도구 도입** | M, O, R, CS, C | **Spring Data Specification** — M 모듈 first try. 사용자 측 상품검색은 C 모듈에서 재검토 |
| ✅ **`includeDeleted=true` 옵션 노출 여부** | 모두 | **옵션 노출(기본 false), `mst_*`에만 적용**. `dat_*`는 상태 전이라 미적용. 감사 로그는 S 모듈로 미룸 |

**첫 관리자 부트스트랩 (확정)**: ROOT는 비상용 락드 계정으로 유지. 앱 기동 시 환경변수
`ADMIN_INIT_PASSWORD` 기반으로 운영 관리자 1명 시드(계정 없으면 BCrypt 해시 생성·저장,
첫 로그인 후 비번 변경 유도). **평문 비밀번호는 코드/마이그레이션/git에 절대 금지.**
`userStatus` 로그인 검증은 M 모듈로 미룸(지금은 `useYn='Y'`만).

> → F 모듈 task 분할: `docs/tasks-F-foundation.md`

### 4.2 후속 모듈 항목 — 해당 모듈 진입 시 결정

| 항목 | 영향 모듈 | 비고 |
|---|---|---|
| **운송장 추적 외부 API** | O | PRD §11 — 사업자 미정. 수동 입력으로 우선 충족 |
| **반품 환불 결제 취소** | R | PG 사업자 미정 — Mock 환불 시뮬레이션 가능 |
| **대시보드 집계 캐싱** | D | 운영 인프라(Redis 등) 도입 결정 의존 |
| **GA 연동** | D | 유입 위젯 — §11 미해결 |

---

## 5. 본 맵 범위 외 (명시)

- **세부 task 분할**: 모듈별로 별도 진행 (본 문서 다음 단계).
- **API 명세 (엔드포인트별 Request/Response)**: 모듈 분해 진입 시 `docs/admin-api-spec.md` 등 별도 산출.
- **DB 스키마 변경**: V9+ 마이그레이션이 필요한 경우 모듈별 task에서 결정.
- **프론트엔드 화면 설계**: 본 백엔드 범위 외.
