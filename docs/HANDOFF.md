# MICOZ M7 관리자 백오피스 — 세션 인계 문서

> 새 세션이 5분 안에 맥락을 복원하기 위한 문서. **기존 커밋·문서·코드에서 추린 사실만.** 새 기능 지시 아님.
> 스택: Spring Boot 3.3.5 / Java 17 / PostgreSQL 15. 빌드·테스트는 Docker 컨테이너(`gradle:8.8-jdk17-alpine` + Docker socket, Testcontainers).
> **러너(실측)**: 이 환경 Docker **24.0.7/MinAPI 1.12**라 통합 러너 정상, 별도 설정 불요. (v29+ 환경에선 min API 1.40+로 Testcontainers 1.19.8의 docker-java 1.32 ping이 막힐 수 있고, **그때만** `src/test/resources/docker-java.properties`에 `api.version=<데몬 min 실측값>` 조건부 A안. 상세 `docs/tasks-CS-support.md` §6.) → "러너 막혔다" 오해나 v29 당황 방지.

---

## 1. 진행 현황 (M7 = 관리자 백오피스, 8개 모듈)

**CS 4커밋 push 완료 → origin/main = `733bb12`**. 로컬은 D 결정/HANDOFF docs가 선행(`92aca0c`~, push는 승인 후). 최신 마이그레이션 = **V10**(다음 컬럼은 V11+). **완료 7모듈 / 남은 1모듈(D — 결정 확정, 분할 착수)**.

| 모듈 | 상태 | 대표 커밋(범위) |
|---|---|---|
| **F** Foundation (관리자 인증·RBAC) | ✅ 완료 | `315aa1e`(F-T2)~`ccb1ecf`(F-T6) |
| **M** Member 회원관리 | ✅ 완료 | `153882c`(M-T1)~`e521048`(M-T6) |
| **C** Catalog 카탈로그 | ✅ 완료 | `829113d`(C-T1)~`c0bf8dc`(C-T5) |
| **S** Settings 운영설정(배너·배송비) | ✅ 완료 | `4a8384a`(S-T1)·`8a56f4a`(S-T2) |
| **O** Order Ops 주문운영 | ✅ 완료 | `747c46d`(O-T1)~`9d5e9bf`(O-T4) |
| **R** Returns 반품/교환 | ✅ 완료 | `67a1d4d`(R-T1)~`08abdd1`(R-T4) |
| **CS** Customer Support 문의응대 | ✅ 완료 | `4d52f5a`(CS-T1)~`b547b89`(CS-T3) |
| **D** Dashboard 대시보드 | ⛔ **남음** | — (FR-ADM-01) |

테스트 총계(최근 빌드): **35 스위트 / 241 테스트 / 실패 0**. 사용자 측 M1~M6(회원가입·상품·카트·주문·반품신청 등)은 M7 이전에 완료됨(`46d1a76`·`83abeff`·`b3b3f8d` 등).

---

## 2. 확립된 표준 패턴 (새 모듈이 반드시 답습 — 정본 경로 포함)

### 2.1 상태 전이 (O·R 공통 골격)
`enum` + `EnumMap` 허용전이표(단일 정본) + **엔티티 레벨 `changeStatus(Enum)` 가드**(단일 choke point, 위반 시 `*_TRANSITION_INVALID` 409). **자유 문자열 `transitTo(String)` 금지**(전부 제거됨). **전수 테스트**(모든 from×to 조합: 허용 전부 통과 + 비허용 전부 예외 + 무순환 + 파싱 방어).
- 정본: [`OrderStatus.java`](../src/main/java/com/micoz/order/entity/OrderStatus.java) + [`Order.changeStatus`](../src/main/java/com/micoz/order/entity/Order.java) / [`ShippingStatus.java`](../src/main/java/com/micoz/order/entity/ShippingStatus.java) / [`ReturnStatus.java`](../src/main/java/com/micoz/returns/entity/ReturnStatus.java)
- 전수 테스트 정본: [`OrderStatusTest`](../src/test/java/com/micoz/order/entity/OrderStatusTest.java) / [`ReturnStatusTest`](../src/test/java/com/micoz/returns/entity/ReturnStatusTest.java)
- 2컬럼 원자 동기화(출고/배송): 사전검증(순수판정)→둘 다 유효할 때만 적용→부분전이 금지. 정본: [`AdminOrderService.ship/deliver`](../src/main/java/com/micoz/admin/order/service/AdminOrderService.java)

### 2.2 검색 (목록 API)
`Specification` 정적 팩토리(**전부 null-safe**: 값 없으면 predicate null→`.and` 무시) + **LIKE 메타문자 이스케이프**(`\ % _`) + **정렬 화이트리스트**(API키→엔티티속성, 미허용→400 `COMMON_INVALID_REQUEST`) + **N+1 방지**(페이지 조회 후 연관 배치 로드).
- 정본: [`UserSpecs`](../src/main/java/com/micoz/admin/member/spec/UserSpecs.java) / [`ProductSpecs`](../src/main/java/com/micoz/admin/product/spec/ProductSpecs.java) / [`OrderSpecs`](../src/main/java/com/micoz/admin/order/spec/OrderSpecs.java) / [`ReturnSpecs`](../src/main/java/com/micoz/admin/returns/spec/ReturnSpecs.java)
- `sanitizeSort` 정본: [`AdminOrderQueryService`](../src/main/java/com/micoz/admin/order/service/AdminOrderQueryService.java) · 리포지토리는 `JpaSpecificationExecutor` 추가.

### 2.3 응답 / 에러 / 감사
- 봉투: `ApiResponse<T>`(성공) / `PageResponse<T>`(페이지). [`common/response/ApiResponse.java`](../src/main/java/com/micoz/common/response/ApiResponse.java)
- 에러: `ErrorCode` enum에 **도메인 블록**으로 추가(HttpStatus + 메시지). [`common/response/ErrorCode.java`](../src/main/java/com/micoz/common/response/ErrorCode.java)
- 감사: [`BaseEntity`](../src/main/java/com/micoz/common/entity/BaseEntity.java)의 `i_user/i_date/u_user/u_date`를 **AuditorAware가 자동 기록**(관리자 액션 시 `u_user`에 관리자 ID). 갱신 없는 엔티티는 `BaseCreatedEntity`(i_*만).
- 권한: `/api/v1/admin/**` URL 게이팅(F-T3) + 컨트롤러 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")` 2차 방어(F-T4).

### 2.4 삭제 정책 (`docs/admin-overview.md` §3.4)
- `mst_*`(마스터): **소프트삭제**(`use_yn='N'` [+ `display_yn='N'`]). 주문 이력 있으면 하드삭제 금지(가드).
- `dat_*`(트랜잭션): **삭제 금지 — 상태 전이로 대체**(스냅샷 보존).
- `map_*`: 이력성(예: 쿠폰 사용 이력)은 불변, 상태성 매핑은 교체 허용.

### 2.5 위험 로직 규율
- **금액·재고·상태처럼 되돌리기 어려운 로직 = [수동리뷰 필수]**.
- "검사 + 상태변경"은 **단일 `@Transactional`**로 원자화(부분 반영 금지, 실패 시 전체 롤백).
- 예: 계산기 null-guard·DB NOT NULL 병행(O-T1), 2컬럼 원자 동기화(O-T3), 환불 확정+payment+order+재고 원자(R-T4).

---

## 3. 진행 방식 (게이트)

- **[수동리뷰 필수] task**: 검증 결과 + 커밋 후보 제시 → **멈추고 승인 대기** → 승인 후 커밋. (금액/스키마/상태머신/공유코드 등)
- **저위험 task**: 검증 통과 시 **승인 없이 단독 커밋**. (검색·조회 등 패턴 답습)
- **push는 항상 별도 명시 승인 후**(각 커밋은 push 금지가 기본).
- **모듈 종료 시 통합 검토 요약**(빚 정리·다음 진입점 포함).
- 커밋: **Conventional Commits, 제목 한국어**. Co-Authored-By 트레일러 포함.
- **검증 = 단위 + 통합(실 HTTP, `TestRestTemplate`) + `./gradlew build`(Docker) + 실제 요청(compose E2E)**. 위험 변경은 코드뿐 아니라 **데이터/동시성/회귀**까지 확인(예: R-T1은 O-T2 특정 테스트 3종 green으로 "취소가 1원도 안 바뀜" 증명).
- 결정이 필요한 지점은 단정 말고 "확인 필요"로 질문(각 모듈 `*-decisions.md`에 확정 기록).
- **실측 우선**: 결정·계약 설계 시 `admin-overview`나 스키마 주석의 서술을 그대로 믿지 말고 **실제 코드/스키마를 실측해 확인**한다. 이 프로젝트에서 반복적으로 사고를 막은 습관 — 예: 옵션 0개 허용(`CartService` 실측), 배송비 실주문 반영(`OrderService` 실측), order/shipping 상태 2컬럼 분리(스키마 실측). **문서 서술과 코드가 다르면 코드가 정본.**

---

## 4. 열린 빚 (우선순위 + 진입점)

| # | 빚 | 우선 | 진입점 |
|---|---|---|---|
| 1 | **환불 원장 정합** — 쿠폰 복원(`map_user_coupon`)·포인트 환원/적립회수(`his_point`). 현재 `refund_amount` 금액만 정확, 원장 미반영 | 中 | `AdminReturnService.complete` / `ReturnRefundService` 뒤에 원장 반영 추가 |
| 2 | **prior 동시성** — 같은 주문 두 반품 동시 완료 시 서로 prior 못 봐 Σ환불 > finalAmount 가능(단일 tx가 주문단위 직렬화 아님) | 中 | `ReturnRefundService.finalizeRefund`에 `dat_order` 비관적 락(SELECT FOR UPDATE) 또는 주문단위 직렬화 |
| 3 | **EXCHANGE 재출고** — 현재 EXCHANGE 완료는 상태만. 대체옵션(`exchange_option_seq`) 재배송 미생성 | — | `AdminReturnService.complete` EXCHANGE 분기 + O 배송 로직 |
| 4 | **회수비 설정화** — 현재 독립 상수 3000 | — | `ReturnRefundService.RETURN_SHIPPING_FEE` → `mst_shipping.return_shipping_fee` 컬럼(V11) |
| 5 | **취소사유 컬럼** — 관리자 취소 사유 미저장 | — | `dat_order.cancel_reason` V11 + `CancelOrderRequest` |
| 6 | **재고 차감 응집 미완** — 복원은 `OrderStockRestorer`로 응집(R-T1), **차감(`decreaseStock`)은 `PaymentService`에 잔존** | 낮 | 차감도 공유 컴포넌트로 이동 검토 |
| 7 | **malformed 바디 → 500** — 원론상 400 | 낮 | `GlobalExceptionHandler`에 `HttpMessageNotReadableException` 핸들러 |
| 8 | **배너 imageUrl URL 형식 미검증** | 낮 | `CreateBannerRequest`/`UpdateBannerRequest` |
| 9 | **AdminMemberSearch 격리 취약** — 활성 CUSTOMER 전수를 절대값(==3)으로 단언 → 선행 테스트가 CUSTOMER 남기면 red(잠복 격리 계열). CS 테스트는 자체 `@AfterEach`로 회피 | 낮 | `AdminMemberSearchIntegrationTest`를 seeded-only 필터로 견고화, 또는 공용 `signupAndLogin`에 정리 훅 |
| 10 | **EXCHANGE 차액 순매출 편입** — D 순매출은 `return_type='RETURN'` COMPLETED refund만 차감. EXCHANGE는 현재 `refund_amount` 항상 0(차액 교환·재출고 미구현, 빚 #3 연동)이라 대상 제외. 차액 교환 구현 시 순매출 차감 대상 편입 필요 | — | 빚 #3(EXCHANGE 재출고) 구현 시 `refund_amount` 산정 + D 순매출 산식에 EXCHANGE COMPLETED 포함 |
| 11 | **GA 유입 위젯** — D 대시보드 유입경로 위젯은 GA 연동 범위 미확정(PRD FR-ADM-01·§9, admin-overview §4.2)이라 D 범위 제외(Mock도 미제공) | — | GA 연동 범위 확정 후 유입 위젯 엔드포인트 신설 |

**현황(2026-07-06)**: 11건 **전부 열림**(#10·#11은 D 결정 라운드에서 식별된 범위밖 이연 — 구현 부채 아닌 스코프 이연). 특히 **#1 환불 원장 정합(中)·#2 prior 동시성(中)** 은 D(read 집계)와 무관하므로 그대로 열림 유지. CS 관련 추가 미구현(CLOSED 종료 흐름·재문의 되돌리기·답변 알림)은 FR 근거 없어 빚 아님(범위 밖).
닫힌 빚: 계산기 null-guard(O-T1, V9 NOT NULL + fail-fast) ✅.

---

## 5. 공유 컴포넌트

**`OrderStockRestorer`** ([`order/service/OrderStockRestorer.java`](../src/main/java/com/micoz/order/service/OrderStockRestorer.java)) — 재고 복원, O·R 공용.
- `restore(orderSeq, Predicate<OrderItem>)`: 주문 아이템 **전량**(주문수량) 복원 → **O 취소** · **R CANCEL 완료**(`i->true`).
- `restoreQuantities(Collection<StockRestoreUnit>)`: 지정 **(옵션,수량)만** 복원 → **R RETURN 완료**(재판매분 `restock_yn='Y'`).
- `decreaseStock` 대칭(`increaseStock`, `ProductOption`).

**의존 방향 원칙**: 공유 로직은 **중립 도메인**(`com.micoz.order.service`)에 둔다 — `admin.*`·`returns.*`가 이것을 의존, **역전 금지**(R 패키지에 두면 O→R 역전). 새 공유 코드도 이 원칙 준수.

---

## 6. 기준 문서 위치

- **`docs/admin-overview.md`** — 모듈 맵(§1) · 의존성/순서(§2) · **공통 패턴(§3: 목록·RBAC·응답/에러·삭제정책·감사)** · 결정 보류항목(§4).
- 모듈별: `docs/tasks-{F,M,C,S,O,R}-*.md`(task 분할·엔드포인트 계약·완료기준) + `docs/{foundation,order,return}-decisions.md`(결정 라운드 확정 기록, 구현 정본은 각 §5).
- PRD: `docs/MICOZ_PRD.md`(FR-ADM-01~11 등).

---

## 7. 다음 작업

권장 순서(admin-overview §2): **D (유일 잔여 모듈)**. CS는 완료(아래).

- **CS. Customer Support** — ✅ **완료**(`4d52f5a`~`b547b89`). 결정·구현 정본 `docs/tasks-CS-support.md`(§4 CS-Q 확정: append-only 정책·answeredDate 불변·2상태·CLOSED 유령상태). 진입 시 확인할 것들은 전부 실측으로 확정됨.
- **D. Dashboard** (FR-ADM-01, **최우선·잔여 유일**): 매출/주문 KPI·추이·기간 필터 — **O/R/M/C/CS 전반 read 집계**(앞 모듈 완료가 전제).
  - **위험 프로파일이 write 모듈과 다름**: 상태·금액을 바꾸지 않는 **순수 read**라 전이/원자성 관심사가 없다. 대신 새 관심사는 ⓐ **집계 정확성**(합계·건수 정의), ⓑ **성능**(N+1·풀스캔 — 기간·상태 인덱스), ⓒ **기간 필터 경계**(타임존 — `i_date`/주문일 등 TIMESTAMPTZ vs 로컬 일자 경계).
  - 문의 KPI 즉시 산출 가능: WAITING 적체 = `status=WAITING` count, 평균 응답시간 = `answeredDate − i_date`(CS-Q② answeredDate 불변이 이 집계를 정확히 유지).
  - **결정 확정**(`docs/dashboard-decisions.md`, 2026-07-06):
    - **총매출** = `Σ final_amount WHERE order_status ∈ {PAID,PREPARING,SHIPPING,DELIVERED,RETURNED}`(**CANCELED만 제외**), `order_date` 귀속.
    - **순매출** = 총매출 − `Σ refund_amount WHERE return_type='RETURN' AND status='COMPLETED'`, `completed_date` 귀속. (EXCHANGE refund 항상 0 실측 → 제외; CANCEL은 총매출 제외로 이미 반영 = 이중차감 회피.)
    - **순매출 음수 가능**: 총매출은 order_date·환불은 completed_date 귀속이라 귀속 컬럼 상이 → 발생주의의 정확한 귀결(버그 아님).
    - 부분반품 함정 실측: order_status는 전체반품만 잡음 → 순매출은 반드시 `refund_amount`로 차감. 타임존: KST 명시 산출 + 반개구간 `[start,nextStart)`. 인덱스: D-T1 EXPLAIN 실측 후 V11.
  - **GA 의존 유입 위젯 = 범위 제외 확정**(Mock 미제공, 빚 #11).

새 모듈도 동일하게 **결정 라운드(`*-decisions.md`) → task 분할(`tasks-*.md`) → 게이트(검증→커밋후보→승인)** 방식으로 진행.
