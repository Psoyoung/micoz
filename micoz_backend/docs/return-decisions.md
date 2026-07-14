# R. Returns — 진입 전 결정 자료

> **상태**: ✅ **결정 확정 (2026-07-03)**. RD1~RD3 + 세부 8건 확정 → §5 반영. 다음 단계 = R task 분할.
> **범위 밖(이번 라운드 건드리지 않음)**: 실제 PG 환불 API 연동(사업자 미정) — **Mock으로 우선 충족** · **EXCHANGE 재출고(대체옵션 재배송 생성)** — 상태 워크플로우만 열고 재출고 트리거는 빚(RD1-b).
> **기준 문서**: `docs/admin-overview.md` §1(R)·§3(공통) · `docs/order-decisions.md`(O 답습 원천) · `MICOZ_PRD.md` FR-ADM-06.
>
> **아래 §0~§4는 결정에 이른 근거(현황 사실 + 선택지 분석)이고, 확정 설계는 §5에 응집한다. 구현 시 §5를 정본으로 본다.**

---

## 0. 현황 사실 정리 (코드 실측 — 추측 없음)

### 0.1 스키마 (V1 baseline, 실측)

| 테이블 | 상태/금액/수량·사유 컬럼 |
|--------|--------------------------|
| `dat_return` | `return_status VARCHAR(20) DEFAULT 'REQUESTED'` · `return_type VARCHAR(20) NOT NULL`(CANCEL/EXCHANGE/RETURN) · `return_reason_type VARCHAR(30)` · `return_reason VARCHAR(500)` · **`refund_amount NUMERIC(15,2) DEFAULT 0`** · **`return_shipping_fee NUMERIC(15,2) DEFAULT 0`** · pickup_* · requested_date · completed_date |
| `dat_return_item` | `item_seq`(→dat_order_item) · **`quantity INTEGER NOT NULL`** · `exchange_option_seq`(교환 대체옵션) · `use_yn CHAR(1)`(소프트삭제) |

> **어휘 불일치(핵심 관찰 ①)**: `return_status` 값을
> - **스키마 주석(V1)**: `REQUESTED/APPROVED/PICKUP/INSPECTING/COMPLETED/REJECTED`
> - **엔티티 주석([Return.java:42](../src/main/java/com/micoz/returns/entity/Return.java#L42))**: `REQUESTED/APPROVED/COLLECTED/INSPECTED/COMPLETED/REJECTED`
> - **admin-overview §1**: `REQUESTED → APPROVED → COLLECTED → INSPECTED → COMPLETED/REJECTED`
> 컬럼은 VARCHAR(20), **CHECK 제약 없음** → 어느 어휘든 저장 가능. 코드(엔티티)·문서는 **COLLECTED/INSPECTED**로 이미 수렴, 스키마 주석만 PICKUP/INSPECTING(코멘트라 무기능). → RD1에서 통일 확정.
>
> **사유 어휘도 불일치**: 스키마 주석 `CHANGE_MIND/DEFECT/WRONG_DELIVERY/OTHER` vs **코드 실제**(엔티티 주석 + `ReturnService.ALLOWED_REASONS`) `CHANGE_OF_MIND/DEFECT/WRONG_DELIVERY/ETC`. **코드가 정본** → `CHANGE_OF_MIND/DEFECT/WRONG_DELIVERY/ETC`.

### 0.2 기존 사용자 측 반품(M5) — 실측

- **엔드포인트(둘 다 user)**: `POST /api/v1/me/orders/{orderSeq}/returns`(신청), `GET /api/v1/me/returns`·`/{returnSeq}`(목록·상세). **관리자 처리 엔드포인트 = 없음(greenfield)**.
- **`ReturnService.create()`**([ReturnService.java](../src/main/java/com/micoz/returns/service/ReturnService.java)): 신청만 기록.
  - 검증: return_type·reason 화이트리스트 / CANCEL은 order `PAID|PREPARING`, RETURN·EXCHANGE는 order `DELIVERED` + **배송완료 후 7일 이내**(`shipping.deliveredDate` 기준) / item이 본 주문 소속·이미 반품수량 합산 초과 금지(`RETURN_QUANTITY_EXCEEDED`).
  - 저장: `Return`(status=`REQUESTED`) + `ReturnItem`들. **`refund_amount`·`return_shipping_fee` 미설정 → DEFAULT 0**.
  - **하지 않는 것**: 환불 금액 산정 / 재고 복원 / 주문 상태 전이 / payment 변경 — **전부 R(관리자)에 위임**.
- `ReturnQueryService`: 목록·상세(refundAmount/returnShippingFee 노출 — 현재 0). 상세는 반품아이템 + 원 주문상품 스냅샷 조인.
- **에러코드 존재**: `RETURN_PERIOD_EXPIRED`(409)·`RETURN_ITEM_INVALID`(400)·`RETURN_QUANTITY_EXCEEDED`(400)·`RETURN_NOT_FOUND`(404)·`RETURN_EMPTY_ITEMS`(400). (M5)

### 0.3 상태 전이 메커니즘 — 실측

- **`Return.transitTo(String)`** 자유 문자열 대입, **검증 전무**([Return.java:99](../src/main/java/com/micoz/returns/entity/Return.java#L99)) — O가 승격 권장한 그것. **호출처 없음**(현재 아무도 안 부름 = 워크플로우 미구현).
- `Return.markCompleted(when)`: status=COMPLETED + completed_date.
- 실제 기록되는 status: `REQUESTED`(생성)뿐. APPROVED/COLLECTED/INSPECTED/COMPLETED/REJECTED는 **쓰는 경로 없음("없음")**.

### 0.4 환불 역산에 필요한 금액 스냅샷 — 실측

| 레벨 | 필드 | 반품 역산 용도 |
|------|------|----------------|
| **주문상품**(`dat_order_item`) | `unitPrice`·`quantity`·`itemAmount`(=unit×qty) | 반품 아이템/수량별 환불 총액(gross) 산출 — 아이템 단위 스냅샷 온전 |
| **주문**(`dat_order`) | `couponDiscount`·`pointUsed`·`totalDiscount`(=coupon+point)·`shippingFee`·`finalAmount`·`pointToEarn` | 할인/배송비/적립은 **주문 레벨 총액** — 아이템별 배분 안 돼 있음 → 부분 반품 시 **비례 배분 필요** |
| 쿠폰/포인트 원장 | `map_user_coupon`(order_seq 참조)·`his_point`(적립/사용 이력) | 쿠폰 복원·포인트 환원 시 참조(현재 R이 건드리는 코드 없음) |

> **핵심 관찰 ②**: 할인(쿠폰+포인트)·배송비·적립은 **주문 레벨에만** 있고 아이템에 배분돼 있지 않다. 부분 반품 환불은 **반품 아이템 gross ÷ 전체 itemsTotal 비율**로 역산해야 한다(RD2).

### 0.5 O가 넘긴 것 — 실측

- **`Order.changeStatus(OrderStatus)`** 전이 가드(O-T2). 허용전이표에 `DELIVERED→RETURNED`, `{PAID|PREPARING}→CANCELED` 존재 → **R이 이 메서드를 호출**해 주문을 종결(Q-C: 규칙=O, 트리거=R).
- **재고 복원 대칭 메서드** `ProductOption.increaseStock(int)`(O-T2, `decreaseStock`의 대칭) — R도 재사용 가능.
- **"order=CANCELED / payment=PAID" 중간 상태**(O-Q1): O 취소는 order+재고만 처리, **payment 정합·환불 실행은 R 소유**로 명시 이월.
- `OrderPayment`: `markPaid`·`markCanceled(when)`(status=CANCELED+canceled_date) 존재. **`REFUNDED` 전이 메서드 없음**(R이 추가). payment_status 어휘: PENDING/PAID/CANCELED/**REFUNDED**.
- **Mock PG**: `PaymentGateway`(`approve`/`cancel(pgTid)`) — `PaymentService`가 이미 사용. R의 Mock 환불은 이 게이트웨이 재사용 가능.

### 0.6 CANCEL 타입 반품 ↔ O-T2 admin 취소 중복 (핵심 관찰 ③)

- 사용자 CANCEL 반품(`PAID|PREPARING` 주문) 처리 = 주문 CANCELED + 재고 복원 + 환불 → **O-T2 `PATCH /cancel`(admin 직접 취소)과 효과가 겹침**.
- 차이: O-T2 취소는 **admin 발의**(사용자 신청 없음), CANCEL 반품은 **user 발의 → admin 처리**. 둘 다 order/재고 로직은 동일해야 함 → R 설계 시 **공유 or 정합** 결정 필요(RD3).

---

## RD1. 반품 상태 전이 표현 (O 답습 확인)

### 선택지

| | 방식 | 트레이드오프 |
|---|------|-------------|
| **(A) O 패턴 그대로 답습** ⭐ | `ReturnStatus` enum + `EnumMap` 전이표 + `Return.changeStatus(ReturnStatus)` 엔티티 가드(위반 시 `RETURN_TRANSITION_INVALID` 신설). `transitTo(String)` 제거 | O(주문)과 **동일 표준** → 일관성·전수 테스트 재사용. O 통합요약이 명시 권장. 신규 에러코드 1개 |
| (B) 별도 방식(문자열 검증 서비스 등) | R만 다른 패턴 | O와 불일치, 우회 가능성. 비추천 |

### 추천: **(A) O 답습** — 근거

- O-T2가 `Order.changeStatus` 엔티티 가드를 **R이 답습할 표준**으로 확정(order-decisions §5.4). Return도 동일하게 `ReturnStatus` enum + 전이표 + `Return.changeStatus`. 자유 문자열 `transitTo(String)` 제거(O의 `transitTo("PAID")` 승격과 동형).
- **전이표(제안)** — admin-overview 체인 + REJECTED 분기, 단방향·무순환:
  ```
  REQUESTED  → { APPROVED, REJECTED }     // 승인 / 즉시 반려
  APPROVED   → { COLLECTED, REJECTED }    // 회수 시작 / 반려
  COLLECTED  → { INSPECTED }              // 검수 진입
  INSPECTED  → { COMPLETED, REJECTED }    // 완료 / 검수 반려(예: 하자 아님·오사용)
  COMPLETED  → { }                        // 종결
  REJECTED   → { }                        // 종결
  ```
- **어휘 통일**: **COLLECTED/INSPECTED 채택**(엔티티·admin-overview·코드 관례와 일치). 스키마 V1 주석의 PICKUP/INSPECTING은 **stale 코멘트**(무기능) — 정리하려면 코멘트 전용 마이그레이션(V10) 가능하나 **저우선**(선택). 사유 어휘도 코드 정본 `CHANGE_OF_MIND/DEFECT/WRONG_DELIVERY/ETC`.
- **`RETURN_TRANSITION_INVALID`(409) 신설**(O의 `ORDER_TRANSITION_INVALID`와 동형·의미 분리).
- 되돌리기: 없음(단방향). REJECTED 진입점은 위 표대로 REQUESTED/APPROVED/INSPECTED 세 곳(→ 확인 필요 RD1-a).

### O/CS/D 영향

- **O**: R이 종결 시 `Order.changeStatus(RETURNED 또는 CANCELED)` 호출 — O 전이표의 R provision 사용. O 코드 변경 없음(호출만).
- **CS**: 무관.
- **D(대시보드)**: 반품 상태별 집계에 이 enum이 표준 축이 됨(향후).

---

## RD2. 환불 금액 산정 규칙 (R 고유 핵심 — 돈)

**현재**: `refund_amount`=0(미산정). R이 산정·기록. 주문 레벨 할인/배송비/적립을 부분 반품에 **비례 배분**해야 함(§0.4).

### 산정식 (제안 — 비례 배분)

```
반품 대상 gross   = Σ (orderItem.unitPrice × returnItem.quantity)          // 반품 아이템/수량
비율 ratio        = 반품 대상 gross ÷ order.itemsTotal(=Σ 전체 itemAmount)
할인 배분         = round( order.totalDiscount × ratio )                    // 쿠폰+포인트 비례
적립 회수         = round( order.pointToEarn × ratio )                      // 적립예정 비례 환수
────────────────────────────────────────────────
net 상품 환불     = 반품 대상 gross − 할인 배분
배송비 조정       = (사유·전액반품 여부에 따라, 아래 RD2 배송비 규칙)
refund_amount     = net 상품 환불 + 배송비 환불 − return_shipping_fee(회수 배송비)
```

### 세부 결정

| 항목 | 선택지 | 추천 |
|---|---|---|
| **부분 반품 할인 역산** | (a) 비례 배분 / (b) 전액(마지막 반품에 몰기) / (c) 무시(gross 전액 환불) | **(a) 비례 배분** — 전액 반품은 ratio=1의 특수케이스로 자연 포함. (c)는 과다환불(할인분까지 돌려줌) |
| **배송비 환불** | 사유별 차등 | **사유 기반**: `CHANGE_OF_MIND`(단순변심) → 원배송비 **환불 안 함** + 회수 배송비(`return_shipping_fee`) **고객 부담**(차감). `DEFECT`·`WRONG_DELIVERY`(판매자 귀책) → 원배송비 **환불** + 회수 배송비 **미부과**. `ETC`는 확인 필요 |
| **적립 포인트 회수** | (a) 비례 회수 / (b) 무시 | **(a) 비례 회수** — 반품분의 적립예정/적립분을 환수(악용 방지). 이미 적립됐으면 `his_point` 차감 이력 |
| **환불 확정 시점** | (a) 신청 시 / (b) 승인 시 / (c) **검수 후(COMPLETED 직전)** | **(c) INSPECTED→COMPLETED 시 확정** — 실물 검수로 최종 상태(하자 유무·수량) 확인 후 확정. 신청~검수 중엔 미확정(0 유지) 또는 예상액 표시 |

> **배송비 환불의 "전액 반품" 특례**: 부분 반품이면 원배송비는 통상 환불 안 함(배송은 이미 발생). **전 아이템 반품(ratio=1)일 때만** 판매자 귀책이면 원배송비 환불 대상. → 규칙에 반영(확인 필요 RD2-b).

### O/CS/D 영향

- **O**: 환불액은 order 스냅샷(itemsTotal/totalDiscount/shippingFee/pointToEarn)에서 역산 — O 데이터 read만.
- **쿠폰/포인트 원장**: 할인 배분·적립 회수를 실제 `map_user_coupon`(쿠폰 복원?)·`his_point`(포인트 환원/차감)에 반영할지 = **RD2 확장 결정**(→ 확인 필요 RD2-c).
- **D**: 환불액 집계(매출 차감)에 직결.

---

## RD3. payment 정합 + 재고 처리 (O가 R로 넘긴 것)

### "order=CANCELED / payment=PAID" 중간 상태를 R이 닫기

| 처리 | 선택지 | 추천 |
|---|---|---|
| **payment_status → REFUNDED 시점** | (a) 승인 시 / (b) **COMPLETED 시** | **(b) COMPLETED** — 환불 확정·실행과 동시. `OrderPayment.markRefunded(when)` 신설(status=REFUNDED, canceled_date 재사용 or `refunded_date` 컬럼 추가 검토) |
| **Mock 환불 경계** | 무엇을 실제로/표시만 | **Mock PG(`PaymentGateway.cancel(pgTid)`) 호출** → 성공 시 payment=REFUNDED + refund_amount 기록. **실제 결제사 API 없음**(범위 밖). "돈이 돌아갔다"는 Mock 세계에서만 참 — 실제 이체 없음 |
| **주문 상태 종결** | 타입별 | `RETURN`/`EXCHANGE`(배송완료 후) → `Order.changeStatus(RETURNED)`. `CANCEL`(배송 전) → `Order.changeStatus(CANCELED)`. **COMPLETED 시** |
| **재고 복원 시점·조건** | (a) COLLECTED / (b) INSPECTED / (c) COMPLETED · 하자품 제외? | **(c) COMPLETED + 재판매 가능분만** `increaseStock`. **`DEFECT`(하자) 반품은 재고 복원 안 함**(재판매 불가) → 확인 필요 RD3-a |

### CANCEL 반품 ↔ O-T2 취소 정합 (§0.6)

- **추천**: CANCEL 타입 반품의 COMPLETED 처리는 **O-T2 취소와 동일한 order/재고 효과**(`changeStatus(CANCELED)` + `increaseStock`)를 내되, R은 여기에 **payment=REFUNDED + refund_amount**를 더한다. 공통 로직(주문취소+재고복원)은 **O 서비스 메서드 재사용 또는 공유 컴포넌트로 추출**해 이중 구현 회피(→ 확인 필요 RD3-b).
- 반대로 **O-T2 직접 취소도 결국 환불이 필요**(현재 payment 불변으로 남겨둠) → O-T2 취소분의 payment 정합도 R 로직으로 닫을지(사후 환불 처리) 함께 정리.

### O/CS/D 영향

- **O**: `OrderPayment.markRefunded` 신설(O 소유 엔티티에 R용 메서드 추가) + O-T2 취소와의 공유 로직 정리.
- **CS**: 무관. **D**: 환불 완료가 매출·정산 집계에 반영.

---

## 확인 필요 → ✅ 전부 확정 (2026-07-03, 아래 질문은 근거용 보존 · 확정값은 §5)

> RD1-a=REJECTED 3진입점 채택 / RD1-b=EXCHANGE 재출고 제외(빚) / RD1-c=주석 정리 저우선(선택) /
> RD2-a=ETC 변심취급 / RD2-b=전량+판매자귀책만 원배송비 환불 / RD2-c=금액만, 원장복원 빚 /
> RD3-a=DEFECT 재고제외 + admin 오버라이드 / RD3-b=O 취소와 공유 추출([수동리뷰 필수]·O 회귀). 상세 §5.

- **RD1-a (REJECTED 진입점)**: REJECTED를 REQUESTED/APPROVED/INSPECTED 세 곳에서 허용하는 게 맞나? (즉시 반려 + 회수 후 검수 반려) 아니면 더 좁게(예: REQUESTED·INSPECTED만)?
- **RD1-b (EXCHANGE 범위)**: 교환(EXCHANGE)은 환불이 아니라 **대체옵션 재출고**가 종결 효과다. R이 **교환 재출고까지 완전 구현**하나(새 배송 생성), 아니면 이번엔 **CANCEL/RETURN(환불) 우선**하고 EXCHANGE는 상태 워크플로우만/후속으로 뺄까? (재출고는 O 배송 로직과 얽혀 복잡)
- **RD1-c (스키마 주석 정리)**: V1의 stale 주석(PICKUP/INSPECTING, CHANGE_MIND/OTHER)을 코멘트 전용 마이그레이션(V10)으로 정리할지, 무기능이라 방치할지(저우선).
- **RD2-a (`ETC` 사유 배송비)**: 기타(ETC) 사유의 배송비 부담은 변심 취급(고객 부담)인가 개별 판단인가?
- **RD2-b (전액 반품 원배송비)**: "전 아이템 반품 + 판매자 귀책"일 때만 원배송비 환불 — 이 특례 규칙 채택?
- **RD2-c (쿠폰/포인트 원장 반영)**: 환불 시 **사용 쿠폰 복원**(map_user_coupon 재사용가능화)·**사용 포인트 환원**(his_point 적립)까지 R이 실제 반영하나, 아니면 refund_amount 금액에만 녹이고 원장은 후속(빚)인가?
- **RD3-a (하자품 재고)**: `DEFECT` 반품은 재고 복원 제외(재판매 불가)로 확정? 검수 결과에 따라 admin이 "재입고 가능/불가" 선택하게 할까?
- **RD3-b (O 취소와 공유)**: CANCEL 반품 완료 = O-T2 취소 로직 재사용으로 공유 추출할지, R에 별도 구현할지. 그리고 O-T2 직접취소의 payment 환불 정합을 R 로직으로 사후 처리할지.

---

## 5. 확정 설계 (반영본 — 구현 정본)

### 5.1 결정 요약

| 항목 | 확정 |
|---|---|
| **RD1** | O 답습 — `ReturnStatus` enum + `EnumMap` 전이표 + `Return.changeStatus` 엔티티 가드 + `RETURN_TRANSITION_INVALID`(409) 신설. `transitTo(String)` 제거. 어휘 **COLLECTED/INSPECTED** 통일 |
| RD1-a | REJECTED 3진입점(REQUESTED/APPROVED/INSPECTED) |
| RD1-b | **EXCHANGE 재출고 제외** — 상태 워크플로우만. 완전구현 = CANCEL/RETURN(환불). 재출고 트리거 = 빚 |
| RD1-c | stale 주석 정리 저우선(선택, 안 해도 무방) |
| **RD2** | 비례 배분 + **누적 반올림 불변식** + **포인트 사용분 현금환불 제외**(§5.3) |
| RD2-a | ETC = 변심 취급(고객 부담) |
| RD2-b | 전량 반품 + 판매자귀책일 때만 원배송비 환불 특례 |
| RD2-c | refund_amount는 금액만 정확 반영, 쿠폰/포인트 **원장 복원은 빚** |
| **RD3** | `markRefunded` 신설 + Mock PG(실이체 없음) + 타입별 order 종결 + COMPLETED 시 재판매 가능분만 재고복원 |
| RD3-a | DEFECT 재고복원 기본 제외 + **검수 단계 admin 오버라이드(재입고 가능/불가)** |
| RD3-b | **O-T2 취소와 "주문종결+재고복원" 공유 추출** — O 코드 수정 → O-T2 green 회귀 필수, 추출 task **[수동리뷰 필수]** |

### 5.2 RD1 — 상태 전이 (구현 정본)

`ReturnStatus` enum + `EnumMap ALLOWED` 단일 정본 + `Return.changeStatus(ReturnStatus)` 엔티티 가드(위반 시 `RETURN_TRANSITION_INVALID`). O의 `Order.changeStatus`와 동형. `transitTo(String)` 제거.

```
REQUESTED  → { APPROVED, REJECTED }     // 승인 / 즉시 반려
APPROVED   → { COLLECTED, REJECTED }    // 회수 시작 / 반려
COLLECTED  → { INSPECTED }              // 검수 진입
INSPECTED  → { COMPLETED, REJECTED }    // 완료 / 검수 반려
COMPLETED  → { }   REJECTED → { }        // 종결(단방향·무순환)
```

- **return_type별 종결 효과(COMPLETED 시)**: `CANCEL` → `Order.changeStatus(CANCELED)` + 환불, `RETURN` → `Order.changeStatus(RETURNED)` + 환불, `EXCHANGE` → **상태 전이만**(재출고 트리거는 빚 #2).
- EXCHANGE도 동일 전이표를 타되(승인·회수·검수·완료), 완료 시 재배송을 만들지 않는다(범위 밖) — COMPLETED가 "교환 승인·검수 완료"까지만 의미.

### 5.3 RD2 — 환불 산정식 (R 고유 핵심)

**(1) 누적 반올림 불변식** — 부분 반품을 여러 번 해도 총 환불이 원결제액을 초과/미달하지 않도록, **개별 반품이 아니라 누적 반품 gross 기준으로 안분하고 이전 반품 누계를 차감**한다:

```
thisGross            = Σ (orderItem.unitPrice × returnItem.quantity)          // 이 반품분
priorGross           = Σ (이 주문의 이전 처리·완료 반품 gross)
cumGross             = priorGross + thisGross
cumRatio             = cumGross ÷ order.itemsTotal                            // 0..1
cumDiscountAlloc     = round( order.totalDiscount × cumRatio )               // 누적 할인 안분
cumPointEarnRecover  = round( order.pointToEarn  × cumRatio )                // 누적 적립 회수
thisDiscountAlloc    = cumDiscountAlloc    − priorDiscountAlloc              // 이 반품 몫
thisPointEarnRecover = cumPointEarnRecover − priorPointEarnRecover
```

> **불변식**: 전량 반품(cumRatio=1) 시 `cumDiscountAlloc = totalDiscount` 정확 → 잔차 0. 어떤 부분 반품 순서·횟수로도 **Σ 환불 ≤ finalAmount, 전량 소진 시 정확히 일치**(반올림 누적 오차로 인한 과다/과소 환불 원천 차단). **O 계산기엔 없던 R 고유 불변식** — R은 항상 주문의 이전 반품 이력을 읽어 누적으로 계산한다.

**(2) 현금 환불액 + 포인트 사용분 처리**:

```
netProduct(cash)    = thisGross − thisDiscountAlloc                          // discount = coupon+point 통째 차감
배송비 환불          = (RD2-b) 전량 반품 && 판매자귀책(DEFECT|WRONG_DELIVERY) ? order.shippingFee : 0
return_shipping_fee  = (RD2-a) 변심계열(CHANGE_OF_MIND|ETC) ? 회수 배송비(고객 부담) : 0
refund_amount(cash)  = netProduct + 배송비 환불 − return_shipping_fee
```

> **포인트 사용분(핵심 명시)**: `totalDiscount = couponDiscount + pointUsed`이고 위 식은 이를 **통째로 차감**한다 → **포인트로 낸 부분은 현금 환불(`refund_amount`)에서 자동 제외**된다. 근거: 고객이 카드로 낸 건 `finalAmount`(이미 포인트 할인 반영 후 금액)뿐이므로 **현금 환불은 그 부분만** 정확히 환원한다(전량 시 `refund_amount = finalAmount` 성립). 포인트로 낸 부분은 **포인트로 돌려줘야 옳고**, 그 `his_point` 환원은 이번 범위 밖 = **빚 #1**.
> **결과(이번 라운드)**: 현금 환불은 **정확·완결**. 포인트 사용분의 포인트 환원 + 쿠폰 복원 + 적립분(`thisPointEarnRecover`) 실제 `his_point` 차감은 **원장 정합 빚(#1)**으로 이월(금액 계산엔 반영, 원장 반영만 후속). → 이중 환불(현금+포인트 동시) 없음.

**확정 시점**: `INSPECTED → COMPLETED` 전이 시 refund_amount 확정·기록(검수로 최종 수량·하자 확인 후). 신청~검수 중엔 미확정(0) 또는 예상액 표시.

### 5.4 RD3 — payment 정합 + 재고

- **payment**: `OrderPayment.markRefunded(when)` 신설(status=REFUNDED). **COMPLETED 시** Mock PG(`PaymentGateway.cancel(pgTid)`) 호출 → 성공 시 REFUNDED + refund_amount 기록. **실제 이체 없음**(범위 밖).
- **order 종결**: CANCEL→`changeStatus(CANCELED)`, RETURN→`changeStatus(RETURNED)` (COMPLETED 시). "order=CANCELED/payment=PAID" 중간상태를 여기서 닫음.
- **재고**: COMPLETED 시 **재판매 가능분만** `increaseStock`. `DEFECT` 반품은 **기본 제외**(재판매 불가), 단 **검수(INSPECTED) 단계에서 admin이 재입고 가능/불가 오버라이드** 가능(기본 제외 + 명시적 재입고 선택).
- **RD3-b 공유 추출**: "주문 취소/종결 + 재고 복원" 공통 로직을 O-T2와 R이 공유하도록 **공유 컴포넌트로 추출**(이중 구현 회피). O 코드를 건드리므로 **O-T2 기존 동작(prepare/cancel/ship/deliver) green 회귀 필수**, 이 추출 task는 **[수동리뷰 필수]**. O-T2 직접취소의 payment 환불 정합도 이 로직으로 사후 처리 검토.

### 5.5 빚 (R/후속)

1. **환불 원장 정합(RD2-c, 우선순위 中)** — 쿠폰 복원(`map_user_coupon` 재사용가능화)·포인트 환원/차감(`his_point`: 사용 포인트 환원 + 적립분 회수). 이번은 refund_amount 금액만 정확, 원장 실반영은 전용 라운드(재사용/연쇄 정합 문제).
2. **EXCHANGE 재출고 트리거(RD1-b)** — 대체옵션(`exchange_option_seq`) 재배송 생성. O 배송 로직과 얽혀 별도 라운드.
3. (선택·저우선) V1 stale 주석(PICKUP/INSPECTING, CHANGE_MIND/OTHER) 코멘트 정리(RD1-c).

### 5.6 task 분할 예고 (다음 라운드에서 확정)

순서 후보: **① 공유 추출**(주문종결+재고복원, O-T2 회귀) [수동리뷰 필수] → **② ReturnStatus 전이 골격**(enum+맵+엔티티 가드, transitTo 제거) [수동리뷰 필수] → **③ 환불 산정**(비례+누적 불변식+포인트 처리) [수동리뷰 필수·금액] → **④ admin 워크플로우**(승인/회수/검수/완료·반려 엔드포인트 + 목록·상세). 정확한 분할·완료기준은 task 분할 라운드에서.

---

## 참고: 범위 밖 (재확인)

- **실제 PG 환불 API** — 사업자 미정, **Mock**(`PaymentGateway`)으로 충족. 실제 이체·결제사 연동 없음.
- 교환 재출고의 실제 배송 생성은 RD1-b 결정에 종속(범위 판단 필요).
