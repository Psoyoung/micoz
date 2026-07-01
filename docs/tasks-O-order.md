# M7 O. Order Ops (주문 운영) — Task 분할

> **기준 문서**: `docs/admin-overview.md` §1(O 모듈)·§3.1(목록)·§3.2(RBAC)·§3.3(응답/에러)·§3.4(삭제 정책)·§3.5(audit) / **결정 정본**: `docs/order-decisions.md` §5
> **대상 테이블**: `dat_order`(주문 마스터·상태전이), `dat_order_shipping`(운송장·배송상태), `dat_order_item`(스냅샷 조회), `dat_order_payment`(조회)
> **관련 FR**: FR-ADM-05(주문 운영), FR-SHIP-01(운송장 입력 완전화)
> **재사용 기반**: F(RBAC·AdminPrincipal·`@PreAuthorize`) / M·C(ApiResponse·PageResponse·AuditorAware·Specification·정렬 화이트리스트·LIKE 이스케이프)
> **상태**: 결정 확정(`order-decisions.md` §5) → task 분할. **O-T1(선행) → O-T2 → O-T3 → O-T4** 순 착수.
>
> **확정 결정(2026-07-01, order-decisions.md §5)**: D1=(A) enum+전이표 / D2=(i)V9 NOT NULL + (ii)계산기 fail-fast 병행(O 첫 task 선행), (iii)nullToZero 금지 / D3=(ii)썸네일 placeholder 유지+빚 존속 / Q-A=(b)2컬럼 분리 유지+동기화 규칙(§5.3) / Q-B=단방향+취소만(순환 없음) / Q-C=전이표는 O 단일소유(R이 O 전이서비스 호출) / Q-E=`ORDER_TRANSITION_INVALID`(409) 신설.

---

## 0. 엔드포인트 계약 (신규)

모든 엔드포인트: `/api/v1/admin/**` URL 게이팅 + 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")` 2차 방어(F-T4 표준). 응답 봉투는 사용자 측과 동일(`ApiResponse<T>` / `PageResponse<T>`). 감사(`u_user`)는 `AuditorAwareImpl` 자동. **관리자는 전 사용자 주문 조회**(사용자 측 `MyOrderController`의 본인-행 제약과 대비 — admin은 `user_seq` 필터 없음).

### 0.1 상태 전이 액션 (O-T2: order_status 단독 / O-T3: 2컬럼 동기화)

전이는 **관리자 액션 단위**로 노출한다(C의 `PATCH /status`·`/stock`, S의 `PATCH /display` 선례 = 액션별 전용 경로). 각 액션은 `order-decisions.md` §5.3 동기화 표를 정본으로 따른다.

| # | 메서드·경로 | 액션 | order_status | shipping_status | task |
|---|---|---|---|---|---|
| O1 | `PATCH /api/v1/admin/orders/{orderSeq}/prepare` | 준비 시작 | PAID → PREPARING | (불변 READY) | O-T2 |
| O2 | `PATCH /api/v1/admin/orders/{orderSeq}/cancel` | 관리자 취소 | {PAID\|PREPARING} → CANCELED | (불변) | O-T2 |
| O3 | `PATCH /api/v1/admin/orders/{orderSeq}/ship` | 출고·운송장 입력 | PREPARING → SHIPPING | READY → SHIPPED | **O-T3** |
| O4 | `PATCH /api/v1/admin/orders/{orderSeq}/in-transit` | 배송중 전환 | (불변 SHIPPING) | SHIPPED → IN_TRANSIT | **O-T3** |
| O5 | `PATCH /api/v1/admin/orders/{orderSeq}/deliver` | 배송완료 | SHIPPING → DELIVERED | {SHIPPED\|IN_TRANSIT} → DELIVERED | **O-T3** |

> **O3(출고)·O5(배송완료)만 두 컬럼을 동시에 움직인다**(§5.3 핵심 동기화 지점). O1·O2는 order_status만, O4는 shipping_status만.
> **RETURNED 진입**(DELIVERED→RETURNED)은 O가 규칙을 소유하되 **트리거는 R 워크플로우 종결**(Q-C). O-T2는 전이서비스에 `markReturned` **메서드**만 제공하고, 엔드포인트는 R 모듈이 소유 — O에서 엔드포인트 신설하지 않음.
> **결제(PENDING→PAID)** 전이도 O-T2 전이표를 경유하도록 승격하되, 트리거는 기존 사용자 결제(`PaymentService`) 그대로 — 신규 admin 엔드포인트 아님.

### 0.2 조회 (O-T4)

| # | 메서드·경로 | 설명 | 성공 | 주요 에러 |
|---|---|---|---|---|
| O6 | `GET /api/v1/admin/orders` | 목록(페이징·다축 검색) | 200 `PageResponse<AdminOrderListItem>` | 400 미허용 정렬키 |
| O7 | `GET /api/v1/admin/orders/{orderSeq}` | 상세(주문·상품스냅샷·배송·결제) | 200 `AdminOrderDetailResponse` | 404 `ORDER_NOT_FOUND` |

**검색축(O6)** — §3.1 도메인별 권장(주문: `orderNo`/`orderStatus`/`userSeq`) 적용:

| 파라미터 | 대상 | 규칙 |
|---|---|---|
| `q` | `order_no` | LIKE(이스케이프) — C/M의 escape 그대로 |
| `orderStatus` | `order_status` | eq (PENDING/PAID/PREPARING/SHIPPING/DELIVERED/CANCELED/RETURNED) |
| `userSeq` | `user_seq` | eq |
| `dateFrom`/`dateTo` | `order_date` | 범위(ISO-8601, §3.1 공통) |
| 정렬 | 화이트리스트 | `orderDate`(기본 desc)·`orderSeq`·`finalAmount`. 미허용 → 400 `COMMON_INVALID_REQUEST` |

> 주문은 트랜잭션 데이터(`dat_*`) → **소프트삭제·`includeDeleted` 개념 없음**(§3.4: 삭제 금지, 상태 전이로 대체). 목록은 상태로 필터.

### 0.3 DTO (신규)

```
// O-T2 (전이 액션)
CancelOrderRequest        { reason? }                       // 취소 사유(선택, 기록용)
// O-T3 (운송장)
ShipOrderRequest          { @NotBlank trackingNo }          // 출고 시 운송장 필수(§5.3 전제)
// O-T4 (조회)
AdminOrderSearchCondition { q?, orderStatus?, userSeq?, dateFrom?, dateTo? }
AdminOrderListItem        { orderSeq, orderNo, orderStatus, userSeq, orderDate, finalAmount, firstItemName, totalItemCount }
AdminOrderDetailResponse  { orderSeq, orderNo, orderStatus, orderDate, itemsTotal, totalDiscount,
                            couponDiscount, pointUsed, shippingFee, finalAmount, pointToEarn,
                            items[AdminOrderItemSnapshot], shipping[AdminOrderShippingInfo], payment[AdminOrderPaymentInfo] }
AdminOrderItemSnapshot    { itemSeq, productSeq, optionSeq, productCode, productName, optionName,
                            unitPrice, quantity, itemAmount, mainImageUrl }   // mainImageUrl = 라이브 조인(D3 placeholder)
AdminOrderShippingInfo    { recipientName, recipientPhone, zipCode, address, addressDetail, shippingMemo,
                            trackingNo, shippingStatus, shippedDate, deliveredDate }
AdminOrderPaymentInfo     { paymentType, paymentStatus, paidAmount, cardCompany, cardNoMasked, installment, approvalNo, paidDate }
```
- `@JsonInclude(NON_NULL)` 유지. 상세 응답 shape은 사용자측 `OrderDetailResponse`를 admin용으로 답습(재사용 가능하면 재사용, 카드번호는 이미 마스킹된 `card_no_masked`만 노출 — 원본 카드번호 저장·노출 없음 확인).

### 0.4 신규 ErrorCode

기존 `ErrorCode` enum 말미(S 블록 뒤)에 O 블록 추가:

| 코드 | HTTP | 메시지 | 용도 |
|---|---|---|---|
| `ORDER_TRANSITION_INVALID` | 409 | 허용되지 않은 주문 상태 전이입니다. | O-T2 전이표 위반(from→to 비허용). 전이서비스 단일 지점에서만 throw. 기존 `ORDER_INVALID_STATUS`(비-PENDING 결제 시도)와 **의미 분리**(Q-E) |
| `SHIPPING_SETTING_INVALID` | 500 | 배송 설정 금액이 유효하지 않습니다. | O-T1 계산기 fail-fast — 배송 3필드 중 null 발견 시(정상경로 아님, V9 NOT NULL로 사실상 도달 불가한 심층방어) |

> `ORDER_NOT_FOUND`(404)·`ORDER_INVALID_STATUS`(409)는 기존 재사용. 운송장 필수(`ShipOrderRequest.trackingNo @NotBlank`)·취소 사유 등 입력 검증은 Bean Validation → `COMMON_VALIDATION_ERROR` 재사용.
> `SHIPPING_SETTING_INVALID` 신설이 과하면 기존 `SHIPPING_SETTING_NOT_FOUND`(500) 재사용도 가능(부재≈무효 동일 취급) — **경미, 구현 시 택1**. 기본은 의미 분리 위해 신설.

---

## 1. 의존성 그래프

```
F. Foundation (RBAC·@PreAuthorize·AdminPrincipal)  [완료]
      │
      └── O-T1 계산기 방어(D2)          — 선행. V9 NOT NULL + 계산기 fail-fast. 빚 #1 청산.
              │  (금액 경로가 증명가능하게 안전해진 뒤 주문 변경 착수)
              ▼
          O-T2 전이표 + 전이서비스        — OrderStatus/ShippingStatus enum + 허용전이 맵 + §5.3 액션 레이어 골격.
              │                            기존 transitTo("PAID") 승격. ORDER_TRANSITION_INVALID.
              ▼
          O-T3 운송장·출고/배송 액션      — O-T2 전이서비스 위에 2컬럼 동기화 액션(O3~O5) + OrderShipping mutator.
              │
              ▼
          O-T4 목록·검색·상세(admin)      — OrderSpecs(검색). O-T2 상태 노출 활용. 대체로 독립(조회).
```
- **O-T1은 O 전체의 선행 게이트**(D2 확정: 금액 안전 먼저). O-T2~T4는 O-T1 전제.
- **O-T2는 O-T3의 전제**(전이서비스 골격 위에 동기화 액션을 얹음).
- O-T4는 조회 중심이라 O-T3와 병렬 가능하나, 문서상 순차 기재(상태 노출 일관성 위해 O-T2 후행 권장).

---

## 2. Task 분할

### O-T1 — 계산기 심층 방어 (D2) · **[수동리뷰 필수]**

> **[수동리뷰 필수]** 근거: **금액 경로 + DB 스키마 마이그레이션**. 전 사용자 결제에 영향을 줄 수 있는 계산기·제약 변경 → 커밋 전 검증결과+커밋 후보 제시하고 승인 대기.

**범위**
- **V9 마이그레이션**: `mst_shipping.shipping_fee`·`free_shipping_min`·`remote_extra_fee`에 `NOT NULL` 제약 추가(`ALTER COLUMN ... SET NOT NULL`). 전제: V7 시드 단일행이 이미 non-null(3000/50000/3000)이라 ALTER 즉시 성공. (엔티티 필드에도 `nullable=false` 반영 검토 — 선택.)
- **계산기 fail-fast(D2-ii)**: `OrderAmountCalculator.calculate()` 진입부에서 배송 3필드 null 검사 → 하나라도 null이면 `BusinessException(SHIPPING_SETTING_INVALID)`. **`nullToZero` 확장 금지(D2-iii)** — null을 0으로 삼키면 배송비 조용히 0원 = 과금 사고.
- **빚 #1 청산 명시**: S에서 이월한 "계산기 null-guard 부재"를 이 task로 닫음. `order-decisions.md` §0.5 / `tasks-S-settings.md` §0.2 빚 블록과 연결.
- 표면 최소: 기존 계산 로직(itemsTotal·shippingFee·finalAmount·pointToEarn 산식)·기존 `nullToZero(couponDiscount/gradePointRate)`는 **불변**. 세 배송필드 진입 검증만 추가.

**완료 기준**
- 단위: `OrderAmountCalculator` — 세 배송필드 각각 null 주입 시 `SHIPPING_SETTING_INVALID` throw(3케이스), 정상값 시 기존 산식 결과 불변(회귀 없음).
- 통합(실 HTTP): 기존 주문 생성 E2E가 **여전히 green**(정상 설정으로 주문 금액 정확 산출 — 회귀 없음 증명). V9 적용 후 `mst_shipping` 조회/PATCH(S-T2 경로) 정상.
- 마이그레이션: V9가 clean apply(기존 시드행 통과). Flyway 순서·checksum 정상.
- `./gradlew build`(Docker) green — 기존 Order/Shipping 통합테스트 전부 통과(S-T2 포함).
- 실제 요청: compose E2E로 정상 주문 1건 생성 → `shippingFee`/`finalAmount` 정확 확인.

**의존성**: F(완료) + 기존 Order/계산기/ShippingSetting(존재). O의 선행.
**위험도**: **중** — 로직 단순하나 **금액 계산기 + DB 제약** 변경이라 회귀 시 전 결제 영향. 완료기준의 "기존 산식 불변·주문 E2E green"이 안전판. **[수동리뷰 필수]**.

---

### O-T2 — 상태 전이표 + 전이 서비스 (D1) · **[수동리뷰 필수]**

> **[수동리뷰 필수]** 근거: **상태머신 골격 — R이 그대로 답습할 표준**. 여기서 굳힌 패턴(enum+맵+단일 choke point)이 R까지 전파되므로 커밋 전 승인.

**범위**
- **enum + 허용전이 맵**(`order-decisions.md` §5.2): `OrderStatus`, `ShippingStatus` enum + 각자의 `static Map<_, Set<_>> ALLOWED`. DB 컬럼은 VARCHAR 유지(마이그레이션 불요), 경계에서 문자열↔enum 변환 + 파싱 방어.
- **전이 서비스**(`AdminOrderService` 또는 전용 `OrderTransitionService`): from→to를 맵으로 검증, 위반 시 `ORDER_TRANSITION_INVALID`(409)를 **단일 지점**에서 throw. §5.3 액션 레이어의 골격(액션→어느 컬럼 이동) 정의.
- **order_status 단독 액션 엔드포인트**(O1 prepare, O2 cancel) + `markReturned` **서비스 메서드**(R이 호출, 엔드포인트는 R 소유).
- **기존 `transitTo("PAID")` 승격**: `PaymentService`의 `order.transitTo("PAID")`를 전이표 경유로 바꾸되 **M4 결제 경로 회귀 없게 최소 개입**(PENDING→PAID가 맵 허용전이임을 보장).
- **취소(O2) 부수효과 = O-Q1 확정(2026-07-01)**: 관리자 취소 = `order_status→CANCELED` + **재고 즉시 복원** + **`payment_status` 불변**. 취소는 **O-T2 안에 유지**(별도 task 분리 안 함).
  - **(a) 재고 복원 — 즉시**: 취소 시점에 차감됐던 옵션 재고를 즉시 복원한다. 재고는 PG 무관 내부 상태이므로 미루면 취소 주문의 재고가 묶여 **유령 품절**이 생김. 차감이 [`PaymentService.java:91`](../src/main/java/com/micoz/order/service/PaymentService.java#L91) `decreaseStock`에 있으므로 **복원은 그와 대칭**되게 — 동일 재고 조작 메서드(예: `ProductOption.increaseStock`)/동일 패턴을 공유.
  - **(b) 결제 상태 — 불변**: `payment_status`를 **건드리지 않는다**. O가 REFUNDED로 바꾸면 "환불 표시했는데 돈 안 나감"이라는 더 나쁜 거짓이 됨. **"order=CANCELED인데 payment=PAID"를 의도된 중간 상태로 확정**하고, 실제 PG 환불 실행 + payment 정합은 **R 모듈 소유**(이번 범위 밖).
  - 🧱 **빚(재고 도메인 분산, 향후 과제)**: 재고 차감(결제)·복원(취소)이 `PaymentService`와 취소 서비스에 **흩어짐**. O 범위에선 대칭 메서드 공유로 최소화하되, 재고 조작을 한 도메인으로 응집하는 리팩터는 **하지 않고 빚으로 명시**(R/재고 정리 시 통합 검토).

**완료 기준**
- 단위(**전수 테스트 — R 답습 표준이므로 필수**):
  - **허용 전이 전부 통과**: §5.2 두 맵의 모든 (from→to) 허용 항목이 예외 없이 성공.
  - **비허용 전이 전부 차단**: 각 상태에서 허용집합에 없는 모든 목표로의 전이가 **빠짐없이 `ORDER_TRANSITION_INVALID`**(예: DELIVERED→PENDING, SHIPPING→PAID, CANCELED→*(terminal) 등). 순환 없음(Q-B) 검증.
  - 잘못된/미지 문자열 상태 파싱 방어.
- 통합(실 HTTP): O1(prepare) PAID→PREPARING 성공·응답 상태 반영; O2(cancel) PAID·PREPARING에서 성공, SHIPPING 이후 시도는 `ORDER_TRANSITION_INVALID`.
- **취소 재고 복원 검증(O-Q1(a), 촘촘히)**:
  - PAID 주문 취소 → 차감됐던 옵션 재고가 **정확히 원복**(복원량 == 차감량, 대칭). 취소 전/후 `stock_qty` 단언.
  - **이중 복원 방지(멱등)**: 취소를 두 번 호출해도 재고가 **이중 복원되지 않음** — 이미 CANCELED면 `{PAID|PREPARING}→CANCELED`가 허용전이에 없어 **두 번째 호출은 전이 단계에서 `ORDER_TRANSITION_INVALID`로 차단**됨(재고 복원은 전이 성공 뒤에만 실행되므로 재고 미변경). 이 경로를 통합테스트로 단언.
  - **결제 불변(O-Q1(b))**: 취소 후 `payment_status`가 여전히 `PAID`(REFUNDED 아님)임을 단언 — 의도된 중간 상태.
- **M4 결제 회귀검증(필수)**: 기존 결제 E2E(`PaymentService.pay` → PAID) 그대로 green — 전이표 승격이 결제 상태전이를 깨지 않음.
- `./gradlew build` green(기존 order/payment 통합테스트 전부 통과).
- 실제 요청: compose E2E로 결제(PENDING→PAID) → prepare(→PREPARING) → cancel 왕복.

**의존성**: O-T1(금액 안전 선행). F(완료).
**위험도**: **중~고** — 상태머신이 O·R 공통 골격. 전이 규칙 누락/과다는 하류 전 모듈에 전파. 전수 테스트가 안전판. **[수동리뷰 필수]**.

---

### O-T3 — 운송장 + 출고/배송 액션 (2컬럼 원자 동기화, §5.3) · **[수동리뷰 필수]**

> **[수동리뷰 필수]** 근거: **2컬럼 원자 동기화 + 운송장** — 부분 전이 시 데이터 정합성 붕괴 위험. 커밋 전 승인.

**범위**
- **`OrderShipping` mutator 신설**(현재 없음): `tracking_no`·`shipping_status`·`shipped_date`·`delivered_date` 변경 메서드. 사용자 상세(`OrderQueryService.getDetail`)가 이 값들을 이미 노출하므로 **채우면 사용자 화면에 자동 반영**(order-decisions §0.3 연결 확인).
- **동기화 액션 3종**(O3 ship / O4 in-transit / O5 deliver) — §5.3 표대로:
  - **O3 ship**: `trackingNo` 필수 → PREPARING→SHIPPING **및** READY→SHIPPED 동시, `shipped_date=now`.
  - **O4 in-transit**: SHIPPED→IN_TRANSIT(shipping_status만).
  - **O5 deliver**: SHIPPING→DELIVERED **및** {SHIPPED|IN_TRANSIT}→DELIVERED 동시, `delivered_date=now`.
- **§5.3 원칙 명시 구현 순서(액션 실행 계약)**:
  1. **모든 전제 먼저 검증** — 대상 주문 존재, `trackingNo` 필수(O3), 현재 상태 확인.
  2. **두 컬럼 전이 각각 자기 맵에서 유효 확인**(§5.2) — 하나라도 위반이면 `ORDER_TRANSITION_INVALID`.
  3. **원자 커밋** — 단일 `@Transactional`에서 두 컬럼 + 부수필드(운송장/일시) 함께 기록.
  4. **부분 전이 절대 금지** — 한 컬럼만 이동하고 다른 컬럼 실패로 남는 상태 불허. 실패 시 **전체 롤백**.

**완료 기준**
- 단위: 각 액션의 전제 검증(운송장 누락 시 O3 400), 두 컬럼 전이 유효성 조합.
- 통합(실 HTTP):
  - O3 정상: PREPARING+READY → ship(trackingNo) → SHIPPING+SHIPPED, `tracking_no`·`shipped_date` 기록, **사용자 상세에서도 반영** 교차검증.
  - O4: SHIPPED→IN_TRANSIT. O5: {SHIPPED|IN_TRANSIT}→DELIVERED + SHIPPING→DELIVERED, `delivered_date` 기록.
  - O3 운송장 누락 → 400, **두 컬럼 모두 불변**(전제 검증이 전이 앞).
  - **★ 원자성 증명(핵심)**: 출고·배송완료에서 "두 컬럼 동시 이동 중 하나가 맵 위반"인 상황을 유도 → `ORDER_TRANSITION_INVALID` + **두 컬럼 모두 원래값 유지(부분 전이 없음)** 를 통합테스트로 단언. (예: order_status는 이동 가능하나 shipping_status가 비허용 상태인 케이스를 구성해 전체 롤백 확인.)
- `./gradlew build` green.
- 실제 요청: compose E2E로 prepare→ship→in-transit→deliver 전체 라이프사이클 왕복 + 운송장/일시 확인.

**의존성**: O-T2(전이서비스 골격). O-T1.
**위험도**: **고** — 2컬럼 원자 동기화·운송장. 부분 전이는 정합성 붕괴(주문은 배송완료인데 배송상태는 준비중 등). 원자성 통합테스트가 안전판. **[수동리뷰 필수]**.

---

### O-T4 — 주문 목록·검색·상세 (admin) · 자동 커밋

> **자동 커밋**: M-T1(회원 검색)·C-T2(상품 검색) 패턴 답습 → 신규 판단로직 낮음. 검증 통과 시 승인 없이 단독 커밋(push 금지).

**범위**
- **`OrderSpecs`**: C의 `ProductSpecs` 답습 — null-safe 정적 팩토리(`orderNoLike`·`orderStatusEq`·`userSeqEq`·`orderDateBetween`) + LIKE 이스케이프 + 정렬 화이트리스트(§0.2).
- `AdminOrderController`(`/api/v1/admin/orders`) O6/O7 + admin 조회 서비스 + DTO(§0.3).
- **상세(O7)**: 사용자측 `OrderQueryService.getDetail` shape 답습 — 주문·상품스냅샷·배송·결제 결합. **관리자는 전 주문 조회**(user_seq 제약 없음).
- **D3 빚 반영(썸네일 placeholder)**: 상세의 `mainImageUrl`은 사용자측과 동일하게 **`mst_product_image` 라이브 조인**(스냅샷 컬럼 추가 안 함, D3=(ii) 확정). 소프트삭제 상품은 null → **프런트 placeholder**. 상품명 스냅샷으로 식별 가능하므로 admin 실무 지장 없음. **빚 존속을 문서·주석에 명시**(M4 주문생성 경로 불변).

**완료 기준**
- 단위: `OrderSpecs` — null 입력 predicate 무시, LIKE 이스케이프, 정렬 화이트리스트 미허용 키 → 예외.
- 통합(실 HTTP):
  - 다축 검색: `q`(orderNo LIKE)·`orderStatus`·`userSeq`·`dateFrom/To` 조합, 정렬(`orderDate` desc 기본)·미허용 정렬키 400.
  - 상세: 주문+상품스냅샷+배송(운송장/상태)+결제 결합 정확. 부재 주문 → 404 `ORDER_NOT_FOUND`.
  - **D3 검증**: 소프트삭제된 상품이 든 과거 주문 상세 조회 → `mainImageUrl=null`(placeholder 대상)이되 상품명 스냅샷·나머지 필드 온전.
  - N+1: 목록은 주문 페이지 + item/image 배치 조회(사용자측 `getMyOrders` 패턴) → statement 상수.
- `./gradlew build` green.
- 실제 요청: compose E2E로 O6(검색)·O7(상세) 왕복.

**의존성**: O-T2(상태 노출 일관성 권장). F(완료). 조회라 O-T3와 병렬 가능.
**위험도**: **저** — 검색·조회 패턴 답습, 상태 변경 없음. 자동 커밋.

---

## 3. 진행 방식 · 리뷰 제안

- **O-T1·O-T2·O-T3**: **[수동리뷰 필수]** — 검증 통과 후 커밋 전 멈춰 검증결과+커밋 후보 제시하고 승인 대기. 승인 후 커밋(push 금지).
  - O-T1: 금액 심층방어(V9 마이그레이션 + 계산기 가드).
  - O-T2: 상태머신 골격(R이 답습) — 전이표 전수 테스트 + M4 결제 회귀 없음 결과 포함.
  - O-T3: 2컬럼 원자 동기화 + 운송장 — 출고/배송완료 "부분 전이 시 전체 롤백" 원자성 통합테스트 결과 포함.
- **O-T4**: 저위험 → 검증 통과 시 **승인 없이 단독 커밋**(push 금지).
- 커밋: Conventional Commits, 제목 한국어. O 전체 완료 후 **통합 검토 요약**(빚 #1 청산 결과, D3 placeholder 존속, R 진입 시 답습 포인트 정리).
- push는 별도 명시 승인 전까지 금지.

---

## 4. 확정 결과 · 잔여 확인

- **O-Q1 ✅ 확정 (2026-07-01, 관리자 취소 O2 부수효과 — a/b 분리)**:
  - **(a) 재고 복원 = O 취소 시점 즉시**. 재고는 PG 무관 내부 상태 → 미루면 취소 주문 재고가 묶여 유령 품절. 차감([`PaymentService.java:91`](../src/main/java/com/micoz/order/service/PaymentService.java#L91))과 **대칭 메서드 공유**. 재고 로직 분산은 🧱빚으로 명시(향후 응집).
  - **(b) `payment_status` 불변**. O는 REFUNDED로 바꾸지 않음("환불 표시했는데 미실행"이 더 나쁜 거짓). **"order=CANCELED / payment=PAID"는 의도된 중간 상태**, 환불 실행 + payment 정합은 **R 소유**.
  - 취소는 **O-T2 안에 유지**(별도 task 분리 안 함). 재고 복원·이중복원 방지·결제 불변은 O-T2 완료기준에서 별도로 촘촘히 검증(위 O-T2 참조).
- (경미, 미확정) `SHIPPING_SETTING_INVALID` 신설 vs `SHIPPING_SETTING_NOT_FOUND` 재사용(§0.4) — 구현 시 택1, 기본은 신설. **블로킹 아님**(O-T1에서 구현자 판단).

> O-Q1 확정으로 **모든 블로킹 결정 해소** — O-T1부터 착수 가능.

---

## 5. 결정 참조 (order-decisions.md §5 요약)

| 항목 | 확정 | 반영 위치 |
|---|---|---|
| D1 전이 표현 | (A) enum + 전이표(Map) | O-T2 |
| D2 계산기 방어 | (i)V9 NOT NULL + (ii)fail-fast 병행, O 첫 task, (iii)nullToZero 금지 | **O-T1** |
| D3 썸네일 | (ii) placeholder 유지 + 빚 존속(스냅샷 컬럼 없음) | **O-T4** |
| Q-A 2컬럼 | (b) 분리 유지 + §5.3 동기화 규칙 | O-T3(핵심) |
| Q-B 되돌리기 | 단방향 + 취소만, 순환 없음 | O-T2 전이표 |
| Q-C 소유권 | 전이표=O 단일소유, R이 O 전이서비스 호출 | O-T2(markReturned 메서드) |
| Q-E 에러코드 | `ORDER_TRANSITION_INVALID`(409) 신설 | O-T2 |
| **O-Q1 취소 부수효과** | (a)재고 즉시복원(대칭 메서드) + (b)payment 불변(환불=R). "order=CANCELED/payment=PAID"=의도된 중간상태 | **O-T2**(취소 O2) |
