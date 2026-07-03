# M7 R. Returns (반품/교환 처리) — Task 분할

> **기준 문서**: `docs/admin-overview.md` §1(R)·§3(공통) / **결정 정본**: `docs/return-decisions.md` §5
> **대상 테이블**: `dat_return`(신청·상태·환불금액), `dat_return_item`(반품 아이템·수량·교환옵션) / 참조: `dat_order`·`dat_order_item`·`dat_order_payment`·`mst_product_option`·`his_point`·`map_user_coupon`
> **관련 FR**: FR-ADM-06(반품/교환 처리 워크플로우 + 환불 산정)
> **재사용 기반**: F(RBAC) · M/C(ApiResponse·PageResponse·Specification·정렬 화이트리스트·LIKE) · O(엔티티 전이 가드 표준·`Order.changeStatus`·재고 복원 대칭 메서드) · M5(사용자 측 반품 신청/조회 — 이미 존재)
> **상태**: 결정 확정(`return-decisions.md` §5) → task 분할. **R-T1 → R-T2 → R-T3 → R-T4** 순.
>
> **확정 결정(2026-07-03, return-decisions.md §5)**: RD1=O 답습(ReturnStatus enum+전이가드, COLLECTED/INSPECTED) / RD1-b=EXCHANGE 재출고 제외(전이만, 빚) / RD2=비례배분+누적 반올림 불변식+포인트 사용분 현금제외 / RD3=markRefunded+Mock PG+타입별 종결+재판매분만 재고복원(DEFECT 제외+검수 오버라이드) / RD3-b=O-T2와 "주문종결+재고복원" 공유 추출.

---

## 0. 엔드포인트 계약 (신규 — admin 처리 워크플로우)

모든 엔드포인트: `/api/v1/admin/**` URL 게이팅 + 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")` 2차 방어(F-T4 표준). 응답 봉투 `ApiResponse<T>`/`PageResponse<T>`. 감사 `u_user` 자동. **관리자는 전 회원 반품 대상**(사용자 측 `MyReturnController` 본인-행 제약과 분리).

> **기존(M5, user)**: `POST /api/v1/me/orders/{orderSeq}/returns`(신청), `GET /api/v1/me/returns`·`/{seq}`. **admin 처리 = 없음(greenfield)** — 아래가 신규.

| # | 메서드·경로 | 액션 | 전이 | task |
|---|---|---|---|---|
| RA1 | `GET /api/v1/admin/returns` | 목록(검색·페이징) | — | R-T4 |
| RA2 | `GET /api/v1/admin/returns/{returnSeq}` | 상세(+예상 환불액) | — | R-T4 |
| RA3 | `PATCH /api/v1/admin/returns/{returnSeq}/approve` | 승인 | REQUESTED→APPROVED | R-T4 |
| RA4 | `PATCH /api/v1/admin/returns/{returnSeq}/reject` | 반려 | {REQUESTED\|APPROVED\|INSPECTED}→REJECTED | R-T4 |
| RA5 | `PATCH /api/v1/admin/returns/{returnSeq}/collect` | 회수 | APPROVED→COLLECTED | R-T4 |
| RA6 | `PATCH /api/v1/admin/returns/{returnSeq}/inspect` | 검수 | COLLECTED→INSPECTED (+재입고 판단) | R-T4 |
| RA7 | `PATCH /api/v1/admin/returns/{returnSeq}/complete` | 완료 | INSPECTED→COMPLETED (**환불확정+order종결+payment+재고**) | R-T4 (money core=R-T3) |

**검색축(RA1)** — §3.1 도메인 권장(반품: returnNo/returnStatus) + 확장:

| 파라미터 | 대상 | 규칙 |
|---|---|---|
| `q` | `return_no` | LIKE(이스케이프) |
| `returnStatus` | `return_status` | eq (REQUESTED/APPROVED/COLLECTED/INSPECTED/COMPLETED/REJECTED) |
| `returnType` | `return_type` | eq (CANCEL/RETURN/EXCHANGE) |
| `userSeq` | `user_seq` | eq |
| `dateFrom`/`dateTo` | `requested_date` | 범위(ISO-8601) |
| 정렬 | 화이트리스트 | `requestedDate`(기본 desc)·`returnSeq`. 미허용 → 400 `COMMON_INVALID_REQUEST` |

### 0.1 신규 ErrorCode

| 코드 | HTTP | 용도 | task |
|---|---|---|---|
| `RETURN_TRANSITION_INVALID` | 409 | 반품 전이표 위반(from→to 비허용). `Return.changeStatus` 단일 지점 throw. O의 `ORDER_TRANSITION_INVALID`와 동형·의미 분리 | R-T2 |

> 기존 `RETURN_NOT_FOUND`(404) 재사용. 입력 검증은 Bean Validation → `COMMON_VALIDATION_ERROR`.

### 0.2 DTO (신규)

```
AdminReturnSearchCondition { q?, returnStatus?, returnType?, userSeq?, dateFrom?, dateTo? }   // R-T4
AdminReturnListItem        { returnSeq, returnNo, orderSeq, orderNo, userSeq, returnType,
                             returnStatus, returnReasonType, refundAmount, requestedDate, totalItemCount }
AdminReturnDetailResponse  { 반품 전체 + items[원주문상품 스냅샷] + estimatedRefund(미완료 시 예상액) + orderSnapshot }
InspectReturnRequest       { restockYn? }   // 재입고 판단(RD3-a=R-Q1(b)). dat_return_item.restock_yn(V10)에 영속.
                                            // 미지정 시 기본: DEFECT=N(제외), 그 외=Y. admin 오버라이드.
// reject 바디 없음(R-Q2(a) — 반려 사유 미저장, O 취소 동형)
```
- `@JsonInclude(NON_NULL)`. 상세의 items 스냅샷은 `ReturnQueryService`(M5) 매핑 재사용 가능.

---

## 1. 의존성 그래프

```
O(주문) [완료] — Order.changeStatus / 재고 복원 / OrderPayment / Mock PG
      │
      └── R-T1 공유 추출(주문종결+재고복원)  ← O-T2 cancel 로직을 공유 컴포넌트로. O-T2가 즉시 재사용(회귀 크라운).
              │
              ▼
          R-T2 ReturnStatus 전이 골격      ← enum+맵+Return.changeStatus 엔티티 가드. transitTo 제거.
              │
              ▼
          R-T3 환불 산정                    ← 비례+누적 불변식+포인트 제외 계산기 + refund_amount 확정.
              │                              전이는 R-T2 changeStatus로 구동해 테스트.
              ▼
          R-T4 admin 워크플로우             ← 엔드포인트(승인~완료·반려) + 조회 + 완료 시 R-T1(종결·재고)·
                                             R-T3(환불)·markRefunded(Mock) 오케스트레이션.
```
- **R-T1은 O 코드 수정** — O-T2 회귀가 완료기준의 크라운. R-T2~T4의 재고/종결 기반.
- R-T2는 R-T3/R-T4 전이의 전제. R-T3은 R-T4 완료 액션의 금액 코어. 순차 의존.

---

## 2. Task 분할

### R-T1 — 공유 추출: 주문 종결 + 재고 복원 (O-T2 회귀) · **[수동리뷰 필수]**

> **[수동리뷰 필수]** 근거: **O(주문) 프로덕션 코드 수정**. O-T2 취소 동작이 1원도 바뀌면 안 됨 → 회귀가 크라운.

**범위**
- `AdminOrderService.cancel`의 "재고 복원" 로직(`restoreStock`: 주문상품 옵션별 `increaseStock`)을 **공유 컴포넌트로 추출**(예: `com.micoz.order.service.OrderStockRestorer` 또는 `OrderClosingService`). O-T2 `cancel`을 이 컴포넌트 사용으로 **재배선**(동작 동일).
- 필요 시 "주문 종결(`changeStatus`)+재고 복원"을 묶은 메서드도 공유(예: `closeAndRestore(orderSeq, targetStatus)`) — CANCEL/RETURN 공용. 단 **재판매 가능분만 복원**하는 파라미터(R용, DEFECT 제외)를 인터페이스에 열어두되 O-T2 경로는 기존과 동일(전량 복원) 동작 보존.
- 표면 최소: O-T2의 `prepare`/`ship`/`in-transit`/`deliver`는 불변. 추출은 `cancel`의 재고 부분만.

**완료 기준**
- 단위: 추출된 컴포넌트 — 옵션별 정확 복원(차감 대칭), 재판매분 필터 파라미터 동작.
- 통합(실 HTTP, **크라운 = O-T2 회귀**):
  - **기존 `AdminOrderIntegrationTest`(6) + `AdminOrderShippingIntegrationTest`(6) 전부 그대로 green** — 특히 `cancelRestoresStockAndKeepsPayment`·`doubleCancelBlocked`·`cancelFromPreparing`에서 **재고 복원량·payment 불변·전이가 추출 전과 동일**(O 취소가 1원도 안 바뀜을 증명).
  - 추출 컴포넌트를 O-T2 cancel이 실제로 경유하는지(중복 로직 제거 확인).
- `./gradlew build`(Docker) green — order/admin/returns 전 스위트 통과.
- 실제 요청: compose E2E로 O-T2 취소 1건 재확인(재고 복원·payment PAID 유지).

**의존성**: O(완료). R 전체의 기반.
**위험도**: **중~고** — O 프로덕션 리팩터. 회귀 통합테스트가 안전판. **[수동리뷰 필수]**.

---

### R-T2 — ReturnStatus 전이 골격 (O 답습) · **[수동리뷰 필수]**

> **[수동리뷰 필수]** 근거: 상태머신 — O의 엔티티 가드 표준을 R에 복제. 하류(R-T3/T4) 전이의 기반.

**범위**
- `ReturnStatus` enum + `EnumMap ALLOWED` 전이표(§5.2) + `Return.changeStatus(ReturnStatus)` 엔티티 가드(위반 시 `RETURN_TRANSITION_INVALID`). `RETURN_TRANSITION_INVALID`(409) 신설.
- **기존 `Return.transitTo(String)` 제거**(호출처 없음 확인됨 — 안전). `markCompleted`는 `changeStatus(COMPLETED)` 경유로 정리하거나 유지 검토.
- 전이표(§5.2): `REQUESTED→{APPROVED,REJECTED}` · `APPROVED→{COLLECTED,REJECTED}` · `COLLECTED→{INSPECTED}` · `INSPECTED→{COMPLETED,REJECTED}` · `COMPLETED/REJECTED` 종결. 단방향·무순환. EXCHANGE도 동일 전이표 사용.

**완료 기준**
- 단위(**전수 테스트 — O 답습 표준**):
  - 허용 전이 전부 통과 + **비허용 전이 전부 `RETURN_TRANSITION_INVALID`**(각 상태×모든 목표). 종결 상태 나가는 전이 없음(무순환). 미지 문자열 파싱 방어.
  - REJECTED 3진입점(REQUESTED/APPROVED/INSPECTED)에서만 허용, COLLECTED에서는 불가 등 정확.
- `./gradlew build` green.
- (엔드포인트는 R-T4 — 여기선 enum/엔티티 단위 검증 중심.)

**의존성**: R-T1. F(완료).
**위험도**: **중** — 상태머신, O 답습. 전수 테스트가 안전판. **[수동리뷰 필수]**.

---

### R-T3 — 환불 산정 (비례 배분 + 누적 불변식 + 포인트 제외) · **[수동리뷰 필수·금액]**

> **[수동리뷰 필수]** 근거: **금액 계산**. 과다/과소 환불은 직접 손실. R 고유 불변식 검증이 크라운.

**범위**
- **환불 계산기**(순수 컴포넌트, `OrderAmountCalculator` 답습): §5.3 산정식.
  - 누적 기반 안분: `cumGross = priorGross + thisGross`, `cumRatio = cumGross/itemsTotal`, `thisDiscountAlloc = round(totalDiscount×cumRatio) − priorDiscountAlloc`, 적립 회수 동형.
  - 현금 환불: `netProduct = thisGross − thisDiscountAlloc`(=coupon+point 통째 차감 → **포인트 사용분 현금 제외**), 배송비 규칙(RD2-a/b: 변심계열 회수비 고객부담·전량+판매자귀책만 원배송비 환불), `refund_amount = netProduct + 배송비환불 − return_shipping_fee`.
- **prior(이전) 반품 조회**: 주문의 이전 **완료(COMPLETED) 반품** gross 합산이 필요 → `ReturnRepository.findAllByOrderSeq(...)`/`ReturnItemRepository` 확장(현재 admin용 orderSeq-only 조회 없음 → 신규). "완료된 것만 prior로 계산"(반려분 제외, 이중계산 방지).
- **refund_amount 확정**: 완료 시 계산 결과를 `Return.refundAmount`·`returnShippingFee`에 기록(엔티티 mutator 신설).

**완료 기준**
- 단위(불변식 핵심 — 합성 시퀀스로):
  - **① 누적 반올림**: 나누어떨어지지 않는 할인(예: totalDiscount=10, 3분할)으로 순차 부분 반품 → 각 `thisDiscountAlloc` 합 = totalDiscount 정확(잔차 0), 어떤 순서로도 `Σ ≤ finalAmount`.
  - **② 포인트 제외**: pointUsed>0 주문의 전량 반품 → `refund_amount = finalAmount`(카드 결제분만), 포인트분은 현금에 안 섞임.
  - 배송비 규칙(변심/하자 × 부분/전량) 케이스.
- 통합(실 HTTP/서비스, **"여러 번 부분 반품" 시나리오**):
  - 한 주문에 부분 반품을 **여러 번 생성·완료**(R-T2 `changeStatus`로 상태 구동) → 각 회차 `refund_amount` 누적이 **Σ ≤ finalAmount, 전량 완료 시 정확히 finalAmount(포인트분 제외분과 정합)**. 이전 완료분을 prior로 정확히 차감하는지 단언.
- `./gradlew build` green.

**의존성**: R-T2(전이로 완료 상태 구동), R-T1(선행). O 스냅샷 read.
**위험도**: **중~고** — 금액·R 고유 불변식. 누적/포인트 통합테스트가 안전판. **[수동리뷰 필수]**.

---

### R-T4 — admin 워크플로우 + 조회 · **[수동리뷰 필수]**

> **[수동리뷰 필수]** 근거: 대부분 워크플로우·조회지만 **완료(RA7)가 환불확정+order 종결+payment 전이+재고 복원을 한 번에 트리거**하는 되돌리기 어려운 돈·상태 이동. 완료 경로가 크라운 → task 전체 승인 게이트.

**범위**
- `AdminReturnController`(`/api/v1/admin/returns`) RA1~RA7 + `AdminReturnService`(전이 오케스트레이션) + `AdminReturnQueryService`(목록·상세, `ReturnSpecs`) + DTO(§0.2).
- **전이 액션**(RA3~RA6): `Return.changeStatus`(R-T2) 경유 — approve/collect/inspect/reject. `reject`는 3진입점.
- **V10 마이그레이션(R-Q1(b))**: `dat_return_item`에 `restock_yn CHAR(1)` 추가(재입고 여부, nullable — 미결정/기본 도출). 감사: 값(무엇)은 이 컬럼, **누가·언제**는 검수 시 갱신되는 `dat_return.u_user`/`u_date`(AuditorAware 자동, §3.5)로 탄다.
- **검수(RA6)**: 재입고 판단(RD3-a) — `InspectReturnRequest.restockYn`을 `dat_return_item.restock_yn`에 기록. **미지정 시 기본 DEFECT=N·그 외=Y**, admin 오버라이드로 하자품 재입고(또는 정상품 폐기) 가능.
- **완료(RA7)** 오케스트레이션 — **CANCEL/RETURN만**:
  - `INSPECTED→COMPLETED` 전이 → **R-T3 환불 확정**(refund_amount 기록) → **`OrderPayment.markRefunded` 신설 + Mock PG(`PaymentGateway.cancel(pgTid)`) 호출**(실이체 없음) → **타입별 order 종결**(CANCEL→`changeStatus(CANCELED)`, RETURN→`changeStatus(RETURNED)`; R-T1 공유) → **재고 복원**(R-T1 공유, **`restock_yn='Y'` 아이템만**). 단일 `@Transactional` 원자.
- **EXCHANGE(R-Q3(a))**: 전이는 COMPLETED까지 동일하게 열되, **완료가 환불확정·payment·재고 오케스트레이션을 타지 않는다**(상태 전이만). 재출고 트리거는 빚(RD1-b). → "교환인데 환불 나가는" 사고를 구조적으로 차단(타입 분기: EXCHANGE는 오케스트레이션 skip).
- `OrderSpecs`(O-T4) 답습한 `ReturnSpecs`(null-safe·LIKE·정렬 화이트리스트).

**완료 기준**
- 단위: `ReturnSpecs`(null 무시·LIKE 이스케이프·정렬 화이트리스트 미허용 400).
- 통합(실 HTTP, 전체 라이프사이클):
  - **RETURN 정상**: 신청(user)→approve→collect→inspect→complete → **order=RETURNED, payment=REFUNDED, 재고 복원, refund_amount 기록**, 사용자 상세에도 반영.
  - **CANCEL 정상**: → order=CANCELED + 재고 복원 + payment REFUNDED (R-T1 공유 경로).
  - **REJECTED 3진입점**: REQUESTED/APPROVED/INSPECTED에서 reject → REJECTED, **환불·재고·order 종결 없음**(부수효과 0). COLLECTED에서 reject 시도 → 409.
  - **DEFECT 재고 제외**: DEFECT 반품 완료 → 기본 재고 복원 안 함. admin 오버라이드 시 복원.
  - **비허용 전이**: 건너뛰기(예: REQUESTED에서 complete) → 409 `RETURN_TRANSITION_INVALID`, 부수효과 0.
  - 목록·상세: 다축 검색·정렬 화이트리스트(400)·부재 404. N+1 없음(반품 페이지 + 아이템/주문 배치).
  - **EXCHANGE 환불사고 방지(핵심)**: EXCHANGE를 COMPLETED까지 전이 → **refund_amount=0(미확정)·payment 불변(REFUNDED 아님)·재고 불변·order 종결 없음**을 단언(환불/종결 오케스트레이션이 EXCHANGE엔 절대 안 탐).
  - **재입고 오버라이드**: DEFECT 반품에 `restockYn=Y` 오버라이드 → 완료 시 재고 복원됨 / 오버라이드 없으면(기본 N) 복원 안 됨. 정상품에 `restockYn=N` → 복원 안 됨. `restock_yn` 기록 확인.
- `./gradlew build` green.
- 실제 요청: compose E2E로 RETURN 전체 라이프사이클 왕복.

**의존성**: R-T1·R-T2·R-T3 전부.
**위험도**: **고** — 완료가 금액·order·payment·재고를 원자 트리거. 라이프사이클·부수효과-0(반려/비허용) 통합검증이 안전판. **[수동리뷰 필수]**.

---

## 3. 진행 방식 · 리뷰 제안

- **R-T1~R-T4 전부 [수동리뷰 필수]** — R은 상태·금액·재고·payment가 전면에 걸려 자동커밋 task 없음. 각 task 검증 통과 후 커밋 전 멈춰 검증결과+커밋 후보 제시하고 승인 대기. 승인 후 커밋(push 금지).
  - R-T1: **O-T2 회귀 green**(취소 1원도 안 바뀜) 결과 포함.
  - R-T2: 전이표 전수 테스트 결과.
  - R-T3: 누적 불변식 + 포인트 제외 "여러 번 부분 반품" 통합 결과.
  - R-T4: 라이프사이클 + 반려/비허용 부수효과-0 + DEFECT 재고 결과.
- 커밋: Conventional Commits, 제목 한국어. R 전체 완료 후 **통합 검토 요약**(빚 정리: 환불 원장 정합·EXCHANGE 재출고 / O 공유 추출 결과 / D 진입 시 집계 포인트).
- push는 별도 명시 승인 전까지 금지.

---

## 4. 확정 결과 (R-Q) — 2026-07-03

| # | 항목 | 확정 | 근거 |
|---|---|---|---|
| **R-Q1** | 재입고 오버라이드 저장 | **(b) `dat_return_item.restock_yn` V10 컬럼** | DEFECT 재입고는 재고를 움직이는 결정 → **감사 필요**("누가 이 하자품을 재입고?"). 값=컬럼, 누가·언제=검수 시 `dat_return.u_user`/`u_date`(§3.5 자동). 비영속 파라미터는 재고변경 미추적이라 부적합 |
| **R-Q2** | 반려 사유 저장 | **(a) 저장 안 함** | O 취소 사유 미저장과 동형. 필요 시 후속 V10 |
| **R-Q3** | EXCHANGE 완료 의미 | **(a) COMPLETED까지 열되 효과 없음(상태만)** | 재출고가 빚이므로 EXCHANGE 완료는 상태 전이만. **환불확정·payment·재고 오케스트레이션은 CANCEL/RETURN만** — "교환인데 환불 나가는" 사고 구조적 차단(R-T4 완료기준) |

> **R-Q 확정으로 R-T4 범위 확정.** V10 restock_yn(R-T4)·EXCHANGE 오케스트레이션 제외를 §0.2·R-T4에 반영.

---

## 5. 결정 참조 (return-decisions.md §5 요약)

| 항목 | 확정 | 반영 위치 |
|---|---|---|
| RD1 전이 | ReturnStatus enum+전이표+`Return.changeStatus` 엔티티 가드, `RETURN_TRANSITION_INVALID`, COLLECTED/INSPECTED | R-T2 |
| RD1-a REJECTED | 3진입점(REQUESTED/APPROVED/INSPECTED) | R-T2/R-T4 |
| RD1-b EXCHANGE | 전이만, 재출고 제외(빚) | R-T4(+빚) |
| RD2 산정 | 비례+누적 반올림 불변식+포인트 사용분 현금제외 | **R-T3** |
| RD2-a/b | ETC=변심(고객부담) / 전량+판매자귀책만 원배송비 환불 | R-T3 |
| RD2-c | refund_amount 금액만 정확, 원장 복원=빚 | R-T3(+빚) |
| RD3 payment/재고 | markRefunded+Mock PG+타입별 종결+재판매분만 복원 | R-T4(완료) |
| RD3-a DEFECT | 재고 제외 기본 + 검수 오버라이드 → **`dat_return_item.restock_yn` V10**(R-Q1(b)) | R-T4 |
| R-Q3 EXCHANGE 완료 | 상태만, 환불·payment·재고 오케스트레이션 제외(CANCEL/RETURN만) | R-T4 |
| RD3-b 공유 추출 | O-T2와 주문종결+재고복원 공유, O 회귀 필수 | **R-T1** |

### 빚 (R 진입 시 명시)
1. **환불 원장 정합(RD2-c, 우선순위 中)** — 쿠폰 복원(`map_user_coupon`)·포인트 환원/차감(`his_point`). 이번은 금액만.
2. **EXCHANGE 재출고(RD1-b)** — 대체옵션 재배송 생성(O 배송 로직 연계).
3. (저우선) V1 stale 주석 정리.
