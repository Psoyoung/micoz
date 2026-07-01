# M7 S. Operation Settings (운영 설정) — Task 분할

> **기준 문서**: `docs/admin-overview.md` §1(S 모듈)·§3.1(목록)·§3.2(RBAC)·§3.3(응답/에러)·§3.4(삭제 정책)·§3.5(audit)
> **대상 테이블**: `mst_banner`(다중 행, 소프트삭제), `mst_shipping`(단일 행 설정, update-only)
> **관련 FR**: FR-ADM-08(배너 관리), FR-ADM-09(배송비 설정)
> **재사용 기반**: F(RBAC·AdminPrincipal·`@PreAuthorize`) / M·C(ApiResponse·PageResponse·AuditorAware·소프트삭제 필터·Specification·정렬 화이트리스트·LIKE 이스케이프)
> **상태**: 계약 확정(S-Q1~Q4 결정 반영). S-T1(자동커밋) → S-T2([수동리뷰 필수]) 순 착수.
>
> **확정 결정(2026-07-01 리뷰)**: S-Q1=(A) 시드 전제+부재 시 `SHIPPING_SETTING_NOT_FOUND` / S-Q2=`freeShippingMin=0`=항상무료 정식 허용(검증 ≥0) / S-Q3=정렬은 PUT 필드 개별 수정 / S-Q4=`updatedAt`·`updatedBy` 노출 / S-T2만 [수동리뷰 필수](금액·라이브 경로).

---

## 0. 엔드포인트 계약 (신규)

모든 엔드포인트: `/api/v1/admin/**` URL 게이팅 + 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")` 2차 방어(F-T4 표준). 응답 봉투는 사용자 측과 동일(`ApiResponse<T>` / `PageResponse<T>`). 감사(`u_user`)는 `AuditorAwareImpl` 자동.

### 0.1 배너 (mst_banner) — S-T1

| # | 메서드·경로 | 설명 | 성공 | 주요 에러 |
|---|---|---|---|---|
| B1 | `GET /api/v1/admin/banners` | 목록(페이징·다축 검색) | 200 `PageResponse<AdminBannerListItem>` | — |
| B2 | `GET /api/v1/admin/banners/{bannerSeq}` | 상세(편집 폼용 전체 필드) | 200 `AdminBannerDetailResponse` | 404 `BANNER_NOT_FOUND` |
| B3 | `POST /api/v1/admin/banners` | 생성 | 200 `BannerCreatedResponse{bannerSeq}` | 400 `COMMON_VALIDATION_ERROR` |
| B4 | `PUT /api/v1/admin/banners/{bannerSeq}` | 전체 수정(제목·설명·이미지·링크·타입·정렬·노출 포함) | 200 `ApiResponse<Void>` | 404 `BANNER_NOT_FOUND`, 400 검증 |
| B5 | `PATCH /api/v1/admin/banners/{bannerSeq}/display` | 노출 토글(빠른 on/off) | 200 `ApiResponse<Void>` | 404 `BANNER_NOT_FOUND`, 400 검증 |
| B6 | `DELETE /api/v1/admin/banners/{bannerSeq}` | 소프트삭제(`use_yn='N'`+`display_yn='N'`) | 200 `ApiResponse<Void>` | 404 `BANNER_NOT_FOUND` |

**검색축(B1)** — §3.1 도메인별 권장을 배너에 적용:

| 파라미터 | 대상 | 규칙 |
|---|---|---|
| `q` | `title` | LIKE(이스케이프) — C의 `escapeLike` 그대로 |
| `bannerType` | `banner_type` | eq (HERO/CATEGORY/PROMO) |
| `displayYn` | `display_yn` | eq (Y/N) |
| `includeDeleted` | `use_yn` | 기본 false → `use_yn='Y'`만. true면 전체(결정6, `mst_*` 한정) |
| 정렬 | 화이트리스트 | `sortOrder`(기본 asc)·`bannerSeq`·`createdDate(i_date)`. 미허용 키 → 400 `COMMON_INVALID_REQUEST` |

> **정렬 기본값**: `@PageableDefault(sort="sortOrder", direction=ASC)` + 2차 키 `bannerSeq asc`(동일 sortOrder 안정 정렬). 사용자 노출 순서(`ORDER BY sort_order ASC`)와 일치시켜 운영자가 보는 순서 = 실제 노출 순서.

> **PATCH `/display` 분리 근거**: "노출 on/off"는 운영자가 가장 자주 누르는 단건 액션 → 상품의 `PATCH /status`·`/stock`(C-T4) 선례와 동일하게 전용 경로 제공. 정렬값(`sort_order`)은 별도 배치 reorder 없이 B4(PUT)의 필드로 처리(YAGNI, S-Q3).

### 0.2 배송 설정 (mst_shipping) — S-T2

**단일행 설정**: 경로에 id 없음. GET/PATCH 모두 **`ship_seq` 최소 행(단일 정본)** 을 대상으로 한다. 이는 주문 생성 경로(`OrderService`)가 읽는 행과 **반드시 동일**해야 하므로 `findFirstByOrderByShipSeqAsc()` 하나로 통일한다.

| # | 메서드·경로 | 설명 | 성공 | 주요 에러 |
|---|---|---|---|---|
| S1 | `GET /api/v1/admin/settings/shipping` | 현재 설정 조회 | 200 `ShippingSettingResponse` | (부재 처리 → S-Q1) |
| S2 | `PATCH /api/v1/admin/settings/shipping` | 설정 수정(부분) | 200 `ApiResponse<Void>` | 400 `COMMON_VALIDATION_ERROR`, (부재 → S-Q1) |

**금액 검증 규칙(S2, 촘촘히)**:

| 필드 | 타입 | 검증 | 계산기 사용 |
|---|---|---|---|
| `shippingFee` | BigDecimal | `≥ 0`, **null 불가 실질보장**(값 제공 시 `@PositiveOrZero`, 미제공 시 기존값 유지) | ✅ base fee |
| `freeShippingMin` | BigDecimal | `≥ 0` (`0` = 항상 무료, S-Q2) | ✅ 무료 임계 |
| `remoteExtraFee` | BigDecimal | `≥ 0` | ✅ 도서산간 가산 |
| `shippingName` | String(100) | 선택, 길이 제한 | ❌ 표시용 |
| `shippingNotice` | String(500) | 선택, 길이 제한 | ❌ 표시용 |

> **⚠️ 계산기 null 안전성(핵심 제약)**: `OrderAmountCalculator`는 `setting.getFreeShippingMin()`/`getShippingFee()`/`getRemoteExtraFee()`를 **null-guard 없이** `.compareTo()`/`.add()` 호출한다([OrderAmountCalculator.java:39-43](../src/main/java/com/micoz/order/calculator/OrderAmountCalculator.java#L39-L43)). 따라서 이 세 필드는 **어떤 경로로도 null이 되면 안 된다** — PATCH는 "부분 수정(제공된 필드만 변경)" 시맨틱으로 두어 미제공 시 기존 비-null 값을 보존하고, 제공 시엔 검증된 비-null만 기록한다. 결과적으로 세 필드는 영구히 비-null 유지.

> **필드 간 관계**: `freeShippingMin`과 `shippingFee` 사이에 강제 대소 제약은 두지 않는다(운영 자유도). `freeShippingMin=0` ⇒ 계산기상 `itemsAfterDis(≥0) ≥ 0` 항상 참 → base fee=0(항상 무료), 단 `remoteExtraFee`는 별도 가산됨. **S-Q2=정식 허용 확정**: 검증은 `≥0`(0 허용), "전 상품 무료배송" 운영 스위치로 유효.

> **🧱 빚(O 주문 모듈 입력, 우선순위 高) — 계산기 null-guard 부재**: S-Q1=(A)+PATCH 부분수정 시맨틱으로 **정상 운영 중** 세 금액 필드가 null 되는 경로는 막힌다. 그러나 `OrderAmountCalculator`가 세 필드를 null-guard 없이 `.compareTo()`/`.add()`로 쓰는 **구조 자체는 그대로 남는다** — 향후 마이그레이션 실수·수동 DML·신규 시드 누락 등으로 행/필드가 null이 되면 **주문 생성 전체가 NPE**(전 사용자 결제 차단). **낮은 확률·높은 영향**. O(주문) 모듈 진입 시 심층 방어를 **우선 검토**: ① `OrderAmountCalculator`에 세 필드 null-guard(또는 fail-fast 검증), 또는 ② `mst_shipping.shipping_fee`/`free_shipping_min`/`remote_extra_fee`에 **NOT NULL DB 제약** 추가(V9+ 마이그레이션). S 범위에서는 닫지 않고 O 입력 빚으로 이월.

### 0.3 DTO (신규)

**배너(S-T1)**
```
ProductSearchCondition 선례 → AdminBannerSearchCondition { q, bannerType, displayYn, includeDeleted }
AdminBannerListItem      { bannerSeq, bannerType, title, imageUrl, sortOrder, displayYn, useYn }
AdminBannerDetailResponse{ bannerSeq, bannerType, title, description, imageUrl, linkUrl, sortOrder, displayYn, useYn }
CreateBannerRequest      { @NotBlank title, @NotBlank imageUrl, bannerType?, description?, linkUrl?, sortOrder?, displayYn? }
UpdateBannerRequest      { title, imageUrl, bannerType, description, linkUrl, sortOrder, displayYn }  // 전체 수정
UpdateBannerDisplayRequest { @NotNull @Pattern(Y|N) displayYn }
BannerCreatedResponse    { bannerSeq }
```
- `@JsonInclude(NON_NULL)` 유지(BannerResponse 선례) — 응답에서 null 필드 생략.
- 기본값 정책은 엔티티 `@Builder`가 이미 보유(bannerType→HERO, sortOrder→0, displayYn→Y, useYn→Y). 등록 시 미지정 필드는 엔티티 기본값 사용.

**배송(S-T2)**
```
ShippingSettingResponse  { shipSeq, shippingName, shippingFee, freeShippingMin, remoteExtraFee, shippingNotice, updatedAt(u_date), updatedBy(u_user) }
UpdateShippingRequest     { @PositiveOrZero shippingFee?, @PositiveOrZero freeShippingMin?, @PositiveOrZero remoteExtraFee?, shippingName?, shippingNotice? }
```
- `updatedAt`/`updatedBy`는 관리자 편의(마지막 변경 시각/자) — 관리자 화면이므로 노출 허용(§3.5의 "사용자 측 비노출"과 무관). 최소화 원하면 생략 가능(minor).

### 0.4 신규 ErrorCode

기존 `ErrorCode` enum 말미(C 블록 뒤)에 S 블록 추가:

| 코드 | HTTP | 메시지 | 용도 |
|---|---|---|---|
| `BANNER_NOT_FOUND` | 404 | 배너를 찾을 수 없습니다. | B2/B4/B5/B6 대상 부재 |
| `SHIPPING_SETTING_NOT_FOUND` | 500 | 배송 설정이 초기화되지 않았습니다. | 단일행 부재(정상경로 아님, S-Q1=(A) 확정) — GET/PATCH가 정본 행 못 찾으면 즉시 실패 |

> S-Q1=(A) 확정: 500(서버 초기화 이상)으로 처리한다. `mst_shipping` 정본 행은 V7 시드가 보장하며, 부재는 마이그레이션/인프라 붕괴 신호이므로 조용한 upsert·지연시드 대신 **명시적 실패**가 안전(주문 경로 `OrderService`도 부재 시 `IllegalStateException`로 동일 철학). 배너 필드 검증은 Bean Validation → `COMMON_VALIDATION_ERROR` 재사용(신규 불필요).

---

## 1. 의존성 그래프

```
F. Foundation (RBAC·@PreAuthorize·AdminPrincipal)  [완료]
      │
      ├── S-T1 배너 CRUD        (mst_banner)      — 독립
      │
      └── S-T2 배송 설정         (mst_shipping)    — Order 모듈 읽기경로에 연결(회귀검증 필요)
                                                     의존: 기존 OrderService/OrderAmountCalculator [존재]
```
- **S-T1 ↔ S-T2 상호 독립** — 순서 무관, 병렬 가능. 문서상 T1 → T2 순 기재.
- 두 태스크 모두 F(완료)만 전제. C/M 산출물 의존 없음(패턴만 재사용).

---

## 2. Task 분할

### S-T1 — 배너 CRUD (목록·생성·수정·노출/정렬·소프트삭제)

**범위**
- `mst_banner` 관리 6종 엔드포인트(B1~B6, §0.1).
- `AdminBannerController`(`/api/v1/admin/banners`) + `AdminBannerService` + DTO(§0.3) + `BannerSpecs`(동적 검색).
- 엔티티 `Banner`에 변경 메서드 추가: `updateInfo(...)`(null-guard 부분 수정), `changeDisplay(String)`, `softDelete()`(`use_yn='N'`+`display_yn='N'`) — C의 Product/Category 선례 그대로.
- `BannerRepository` 확장: `JpaSpecificationExecutor<Banner>` + `findByBannerSeqAndUseYn(...)`(활성 단건). **기존 사용자용 파생쿼리(`findActiveHeroBanners`)는 손대지 않음**(C의 표면적 변경 원칙).
- `BannerSpecs`: C의 `ProductSpecs` 답습 — 전부 null-safe 정적 팩토리(`titleLike`·`bannerTypeEq`·`displayYnEq`·`activeOnly`), LIKE 메타문자 이스케이프, 정렬 화이트리스트(§0.1).

**완료 기준**
- 단위: `BannerSpecs` — null 입력 시 predicate 무시, LIKE 이스케이프(`%`/`_`/`\`), 정렬 화이트리스트 미허용 키 → 예외.
- 통합(실 HTTP, `TestRestTemplate`):
  - 생성 → 목록 등장 → 상세 조회 → PUT 수정 반영 → `PATCH /display`로 `display_yn='N'` → 소프트삭제(`use_yn='N'`) 후 기본 목록에서 소거·`includeDeleted=true`에서 재등장.
  - 다축 검색: `q`(title LIKE·이스케이프)·`bannerType`·`displayYn` 조합, 정렬(`sortOrder` asc) 및 미허용 정렬키 400.
  - **사용자 경로 교차검증**: 관리자가 `display_yn='N'`/소프트삭제한 HERO 배너가 사용자 `GET /api/v1/banners`에서 사라지는지(기존 `findActiveHeroBanners` 필터와 일관).
  - 부재 대상 B2/B4/B5/B6 → 404 `BANNER_NOT_FOUND`.
  - N+1: 목록은 조인 없는 평면 조회 → 페이지 쿼리 상수(Statistics로 확인, 데이터량 무관).
  - 감사: 생성/수정 시 `u_user`=관리자 `user_id` 기록.
- `./gradlew build`(Docker 컨테이너) green.
- 실제 요청: compose E2E로 B1·B3·B4·B6 왕복 확인.

**의존성**: F(완료). 없음.
**위험도**: **저** — 평면 CRUD, C에서 확립된 패턴 그대로. 신규 판단 로직 거의 없음.

---

### S-T2 — 배송 설정 (단일행 update-only, GET + PATCH) · **[수동리뷰 필수]**

> **[수동리뷰 필수]**(S-Q 리뷰에서 (b) 확정): 검증 통과 후 **커밋 전 멈춰** 검증결과+커밋 후보를 제시하고 승인 대기. 근거 = 관리자 입력이 고객 청구 금액을 바꾸는 유일한 라이브 경로(되돌리기 어려운 영향·금액). S-T1(배너)은 자동 커밋.

**범위**
- `mst_shipping` 단일 정본 조회/수정 2종(S1·S2, §0.2).
- `AdminShippingSettingController`(`/api/v1/admin/settings/shipping`) + `AdminShippingSettingService` + DTO(§0.3).
- 엔티티 `ShippingSetting`에 `updateSettings(...)` 추가 — **부분 수정(null 필드 미변경)**, 세 금액 필드 비-null 보존.
- **삭제/생성 API 없음**(§3.4 단일행 = update-only). PATCH는 `findFirstByOrderByShipSeqAsc()` 정본만 수정(주문 경로가 읽는 동일 행).
- 단일 `@Transactional`로 조회+수정 원자화(C-T1/C-T5에서 확정한 "검사+상태변경 단일 트랜잭션" 기준 동일 적용).

**완료 기준 (금액이라 촘촘히)**
- 단위:
  - `updateSettings` 부분 수정 — 일부 필드만 준 경우 나머지 기존값 보존, 세 금액 필드 절대 null 안 됨.
  - 검증: 음수 금액 거부(`@PositiveOrZero`), `freeShippingMin=0` 허용.
- 통합(실 HTTP):
  - `GET` → 시드(V7: fee 3000 / free_min 50000 / remote 3000) 그대로 반환.
  - `PATCH` 후 `GET` 재조회 → 변경 반영.
  - 음수 금액 PATCH → 400, 설정 **불변**(롤백 확인).
  - **★ 연결 회귀검증(핵심)**: `PATCH`로 `shippingFee`/`freeShippingMin` 변경 → 이어서 **실제 주문 생성**(주문 API 또는 `OrderService`) → 생성된 주문의 `shippingFee`/`finalAmount`가 **새 설정값 기준으로 산출**되는지 단언. (관리자 변경 → 실주문 반영 경로가 살아있음을 증명. `OrderService.createOrder`가 매 주문 `findFirstByOrderByShipSeqAsc()`로 재조회 → 캐시 없음, 즉시 반영됨을 검증)
  - `freeShippingMin=0` 설정 후 소액 주문 → base fee=0(항상 무료), 단 `isRemote` 주문은 `remoteExtraFee` 가산.
  - 부재 처리(S-Q1=(A)): 정본 행 없을 때 GET/PATCH → `SHIPPING_SETTING_NOT_FOUND`(500).
- `./gradlew build` green.
- 실제 요청: compose E2E로 GET·PATCH 왕복.

**의존성**: F(완료) + 기존 Order 모듈(회귀검증용, 존재).
**위험도**: **중** — 로직은 단순하나 **쓰는 값이 실주문 청구 금액에 직결**(라이브 가격 경로). 잘못된 값 1건이 이후 모든 주문 금액에 영향. → 완료 기준의 연결 회귀검증·음수 거부·null 보존이 필수. **[수동리뷰 필수]**로 커밋 전 승인 게이트 적용.

---

## 3. 진행 방식 · 리뷰 제안

- **S-T1(배너)**: 저위험 → 검증 통과 시 **승인 없이 단독 커밋**(push 금지).
- **S-T2(배송)**: **[수동리뷰 필수]** 확정 — 검증 통과 후 커밋 전 멈춰 검증결과+커밋 후보 제시하고 승인 대기. 승인 후 커밋(push 금지). 근거 = 금액·라이브 청구 경로.
- 커밋: Conventional Commits, 제목 한국어. S 전체 완료 후 통합 검토 요약.
- push는 별도 명시 승인 전까지 금지.

---

## 4. 확정 결과 (S-Q) — 2026-07-01 리뷰

| # | 항목 | 확정 | 근거 |
|---|---|---|---|
| **S-Q1** | 배송 단일행 **부재 시** 동작 | **(A) 시드 전제 + 부재 시 `SHIPPING_SETTING_NOT_FOUND`(500)** | 계산기가 세 금액 필드를 null-guard 없이 호출 → (B)upsert·(C)지연시드가 만드는 "행 없는 창"이 곧 주문 NPE 창. 행 존재를 인프라 수준에서 보장하는 (A)만 안전. 주문 경로도 부재 시 `IllegalStateException`로 동일 철학. |
| **S-Q2** | `freeShippingMin=0` 의미 | **정식 허용(=항상 무료), 검증 `≥0`** | "전 상품 무료배송" 운영 스위치로 유효. |
| **S-Q3** | 배너 정렬 수정 방식 | **PUT(B4) 필드로 개별 수정** | YAGNI. 일괄 reorder는 요구 발생 시 추가. |
| **S-Q4** | 배송 응답 `updatedAt`/`updatedBy` | **노출** | 관리자 화면 편의(§3.5 비노출은 사용자 측 한정). |
| **S-T2 승격** | 수동리뷰 여부 | **(b) S-T2만 [수동리뷰 필수]** | 금액·라이브 청구 경로. S-T1은 자동 커밋. |

> **계약 확정 완료.** 위 결정을 §0(계약)·§0.4(에러)·S-T2(수동리뷰)·§0.2(계산기 빚)에 반영. S-T1(배너, 자동커밋)부터 착수.
