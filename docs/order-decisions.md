# O. Order Ops — 진입 전 결정 자료

> **상태**: ✅ **결정 확정 (2026-07-01)**. D1~D3·Q-A~E 확정 → §5 반영. 다음 단계 = O task 분할.
> **범위 밖(이번 라운드 건드리지 않음)**: 운송장 외부 추적 API(사업자 미정 — 수동 입력으로 우선 충족), 결제 취소 PG 연동. (admin-overview.md §4.2)
> **기준 문서**: `docs/admin-overview.md` §1(O), §2(순서), §3.4(삭제 정책) · `MICOZ_PRD.md` FR-ADM-05.
>
> **아래 §0~§4는 결정에 이른 근거(현황 사실 + 선택지 분석)이고, 확정 설계는 §5에 응집한다. 구현 시 §5를 정본으로 본다.**

---

## 0. 현황 사실 정리 (코드베이스 확인 결과 — 추측 없음)

### 0.1 스키마 (V1 baseline, 실측)

| 테이블 | 상태 컬럼 | 현재 정의된 상태값 (주석) | 운송장/일시 컬럼 |
|--------|-----------|--------------------------|------------------|
| `dat_order` | `order_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'` | `PENDING / PAID / PREPARING / SHIPPING / DELIVERED / CANCELED / RETURNED` | — |
| `dat_order_item` | `item_status VARCHAR(20) DEFAULT 'NORMAL'` | `NORMAL / CANCEL_REQUESTED / CANCELED / RETURN_REQUESTED / RETURNED / EXCHANGED` | — |
| `dat_order_shipping` | `shipping_status VARCHAR(20) DEFAULT 'READY'` | `READY / SHIPPED / IN_TRANSIT / DELIVERED` | `tracking_no VARCHAR(50)` (nullable), `shipped_date`, `delivered_date` (둘 다 nullable, 존재함) |
| `dat_order_payment` | `payment_status VARCHAR(20) DEFAULT 'PENDING'` | `PENDING / PAID / CANCELED / REFUNDED` | `paid_date`, `canceled_date` |

> **핵심 관찰 ①: 상태 컬럼이 둘로 쪼개져 있음.**
> 사용자가 D1에 쓴 체인 `PAID → PREPARING → SHIPPED → IN_TRANSIT → DELIVERED`는 **두 컬럼의 어휘가 섞여 있음**:
> - `PAID`, `PREPARING` → **`order_status`에만** 존재 (`SHIPPING`이라는 값이 order_status의 "배송중"임)
> - `SHIPPED`, `IN_TRANSIT` → **`shipping_status`에만** 존재
> - `DELIVERED` → **양쪽 모두** 존재
> 즉 지금 스키마대로면 `order_status`는 굵은 단위(PAID→PREPARING→SHIPPING→DELIVERED), `shipping_status`는 배송 세부 단위(READY→SHIPPED→IN_TRANSIT→DELIVERED)로 **역할이 분리**돼 있음. 사용자 요청 체인은 이 둘을 하나로 합친 형태 → **어느 컬럼을 O 전이가 구동하는지 확정 필요**(→ 확인필요 Q-A).

### 0.2 현재 상태 전이 메커니즘 (실측)

- `Order.transitTo(String newStatus)` — **검증 전무**. 임의 문자열을 그대로 대입 (`Order.java:76-78`).
- 유일한 호출처: `PaymentService.pay()` → `order.transitTo("PAID")` (`PaymentService.java:125`).
- 결제 전 상태 검증은 문자열 비교 하드코딩: `if (!"PENDING".equals(order.getOrderStatus()))` → `ORDER_INVALID_STATUS`(409) (`PaymentService.java:47-49`).
- **실제로 코드가 기록하는 order_status 값은 `PENDING`(주문 생성)과 `PAID`(결제 완료) 둘뿐.** PREPARING/SHIPPING/DELIVERED/CANCELED/RETURNED는 스키마 주석에만 있고 **쓰는 경로 없음("없음")**.
- `OrderShipping` 엔티티: `shipping_status`는 빌더에서 기본 `READY`만 세팅. **`tracking_no`·`shipping_status`·`shipped_date`·`delivered_date`를 바꾸는 mutator 메서드 없음("없음")** — O가 새로 만들어야 함.
- `OrderPayment`: `markPaid()`, `markCanceled()` 존재. `REFUNDED` 전이 메서드는 없음(R 몫).
- `OrderItem`: `item_status` mutator 없음("없음").

### 0.3 사용자 측 주문 경로가 상태를 다루는 방식 (실측)

- 생성: `OrderService.create()` → `orderStatus("PENDING")` 고정 (`OrderService.java:129`).
- 조회(목록): `OrderQueryService.getMyOrders()` → `order_status` 문자열을 그대로 응답에 노출, **필터/검증 없음** (`OrderQueryService.java:69`).
- 조회(상세): `getDetail()` → `order_status` 그대로 노출. `shipping_status`·`tracking_no`·`shipped_date`·`delivered_date`도 그대로 `OrderShippingInfo`로 노출 (`OrderQueryService.java:144-157`) — **즉 O가 이 값들을 채우면 사용자 상세에 자동 반영되는 구조(연결 확인됨)**.
- `payment`는 `PAID` 상태 결제행만 조회해 노출 (`OrderQueryService.java:107-109`).

### 0.4 주문 상세의 상품 정보 참조 방식 (D3 관련, 실측)

| 필드 | 출처 | 소프트삭제 시 |
|------|------|--------------|
| productCode, productName, optionName, unitPrice, quantity, itemAmount | `dat_order_item` **스냅샷 컬럼** (주문 시점 고정, `OrderService.java:149-153`) | **온전** |
| **mainImageUrl** | `mst_product_image` **라이브 조인** (`loadMainImages()` → `findAllByProductSeqInAndImageTypeAndUseYn(seqs,"MAIN","Y")`, `OrderQueryService.java:133-142`) | 이미지행/상품 `use_yn='N'` 시 조인 탈락 → **null로 사라짐** |

→ C가 넘긴 썸네일 빚 확정. 스냅샷 컬럼 후보 `dat_order_item.image_url` 은 **현재 없음**.

### 0.5 계산기 null-guard 현황 (S 빚 #1, 재확인)

- `OrderAmountCalculator.calculate()` (`OrderAmountCalculator.java:39-43`):
  - `setting.getFreeShippingMin()`, `setting.getShippingFee()`, `setting.getRemoteExtraFee()` → **세 배송 필드 직접 호출, null-guard 없음** (확정).
  - 반면 `couponDiscount`·`gradePointRate`는 `nullToZero()`로 보호됨 → **배송 3필드만 무방비**.
- 방어선 현황: mst_shipping 세 컬럼은 스키마상 `DEFAULT 0`이나 **`NOT NULL` 제약은 없음** (V1 확인). 즉 UPDATE로 null 진입 시 계산기 NPE 창이 열림.
- 부수 관찰: `OrderService.create()`는 배송설정 부재 시 `IllegalStateException`을 던짐(`OrderService.java:107-108`) — admin 서비스의 `SHIPPING_SETTING_NOT_FOUND`(BusinessException)와 **불일치**. O 진입 시 통일 검토 가치 있음(사소).

### 0.6 admin 쪽 주문 코드 유무

- `com.micoz.admin.order.*` → **없음(greenfield)**. 기존 admin 모듈은 user/member/category/product/banner/settings 뿐.
- 재사용 자산: `ProductSpecs`/`BannerSpecs` 패턴(null-safe 정적 팩토리 + LIKE 이스케이프 + 정렬 화이트리스트), `ApiResponse`/`PageResponse`, `@PreAuthorize("hasRole('ADMIN')")` + URL 게이팅 2차 방어, AuditorAware.
- 참고: `dat_return`/`dat_return_item` 테이블은 이미 V1에 존재(R 몫). `dat_return.return_status` 주석은 `REQUESTED/APPROVED/PICKUP/INSPECTING/COMPLETED/REJECTED`인데 admin-overview §1 R행은 `…APPROVED→COLLECTED→INSPECTED…`로 **또 어휘 불일치** → R 진입 시 동일한 정합성 결정이 재발함(D1 결정이 그 선례가 됨).

---

## D1. 주문 상태 전이 표현 방식 (핵심 — O의 골격, R이 답습)

**문제**: 지금은 `transitTo(String)`이 아무 문자열이나 대입 → 허용되지 않은 전이(예: DELIVERED→PENDING)를 막을 장치가 전혀 없음. "허용된 전이만" 강제하는 단일 소스가 필요.

### 선택지

| | 방식 | 장점 | 단점 |
|---|------|------|------|
| **(A) 전이표 (enum + Map/EnumSet)** ⭐ | `enum OrderStatus` 정의 + `static Map<OrderStatus, Set<OrderStatus>> ALLOWED`. 서비스가 `ALLOWED.get(from).contains(to)` 검증 후 위반 시 예외. DB는 VARCHAR 유지, 경계에서 문자열↔enum 변환 | 전이 규칙이 **한 곳(맵)**에 응집 → 테스트로 전수 검증 쉽고, R이 그대로 답습 가능. 되돌리기·취소도 "맵에 항목 추가"로 표현(특수 장치 불요). DB 컬럼 타입 변경·마이그레이션 불요 | enum↔String 변환 보일러플레이트. 잘못된 문자열이 DB에 이미 있으면 파싱 지점 방어 필요 |
| **(B) 상태별 메서드 (`status.canTransitionTo(next)`)** | 각 enum 상수가 자기 다음 상태 집합을 선언 | 객체지향적, 상태 로컬 | 규칙이 상수마다 흩어져 전체 조망이 어려움. 되돌리기 추가 시 여러 상수 수정. 전이표를 결국 상수에 분산 표현한 것과 동치 |
| **(C) 자유 문자열 + 검증 테이블 유지** | 지금 `transitTo(String)` 유지 + 서비스에서 별도 검증 맵 | 최소 변경 | 타입 안전성 없음, 오타 상태값이 런타임까지 살아남음. (A)의 장점을 포기하고 위험만 남김 |

### 추천: **(A) 전이표(enum + Map)** — 기존 코드 근거

- 이미 `PaymentService`가 `"PENDING"` 문자열 하드코딩으로 상태를 가드하고 있음 → 이 검증을 enum 전이표로 승격하면 **흩어진 문자열 비교를 단일 choke point로 수렴**. 기존 `PAID` 전이(`transitTo("PAID")`)도 전이표를 타도록 리팩터(단, M4 결제 경로 회귀 없게 최소 개입).
- DB는 VARCHAR 유지 → **스키마 마이그레이션 불필요**, 엔티티 변경 최소. enum은 admin 전이 서비스 경계에서만 사용(문자열로 읽어 검증 후 문자열로 저장).
- **되돌리기(취소·이전 상태 복귀)**: 별도 메커니즘 없이 전이표 항목으로 표현. 예 — 정상 전진은 `PAID→PREPARING→…`, 관리자 취소는 `PAID→CANCELED`, `PREPARING→CANCELED`처럼 맵에 명시. **오조작 복구(예: SHIPPED→PREPARING 되돌리기) 허용 여부는 비즈니스 결정** → 확인필요 Q-B.
- **`ORDER_TRANSITION_INVALID` 던지는 위치**: 전이 서비스(`AdminOrderService.transition()`) 단일 지점. 전이표에 없는 (from→to)면 즉시 예외. HTTP 409(CONFLICT) 권장 — 기존 `ORDER_INVALID_STATUS`(409)와 격 맞춤. **신규 코드 신설 vs 기존 재사용**은 확인필요 Q-E.

### R(반품) 영향

- R의 `return_status` 워크플로우(REQUESTED→APPROVED→…→COMPLETED/REJECTED)는 **구조가 동일한 상태 전이 문제**. D1에서 정한 패턴(enum+전이표+단일 choke point+`*_TRANSITION_INVALID`)을 R이 그대로 복제 → **D1은 O뿐 아니라 R의 골격을 확정하는 결정**. (A) 채택 시 R은 `ReturnStatus` enum + 맵만 새로 쓰면 됨.
- R 완료 시 order를 `RETURNED`로 넘기는 역참조가 생김 → O의 전이표에 `…→RETURNED` 진입점을 누가 소유하는지(O냐 R이냐)를 D1 확정 시 함께 못박아야 R에서 재논쟁 없음(→ Q-C).

---

## D2. 빚 #1 (계산기 null-guard) 처리 시점·방식

**문제**: `OrderAmountCalculator`가 배송 3필드를 null-guard 없이 사용(§0.5). mst_shipping에 `NOT NULL` 제약도 없어, 세 필드 중 하나라도 null이면 실주문 생성 시 NPE.

### 처리 시점

- **추천: O의 첫 task로 먼저 갚기.** 근거 — O는 주문 상태를 실제로 변경하기 시작하는 모듈이고, 금액 경로가 증명 가능하게 안전해진 뒤 전이 작업에 들어가는 게 순서상 맞음. S에서 "O 입력 빚, 우선순위 高"로 넘긴 합의와도 일치. O 본체와 병렬로 두면 "안전 증명 전 주문 변경"이 되어 부적절.

### 방식 선택지

| | 방식 | 심층 방어 수준 | 마이그레이션 비용 |
|---|------|---------------|------------------|
| **(i) V9 `NOT NULL` 제약** ⭐ (기본) | `ALTER TABLE mst_shipping ALTER COLUMN {shipping_fee, free_shipping_min, remote_extra_fee} SET NOT NULL` | **최상** — 컬럼이 구조적으로 null 불가. admin PATCH는 이미 부분수정(null 필드 skip)이라 null 진입 못 하고, 제약이 그걸 영구 보증 | 극소. 현재 시드 단일행 이미 non-null(3000/50000/3000) → ALTER 즉시 성공. 위험 ≈ 0 |
| **(ii) 계산기 fail-fast 가드** (보완) | 계산기 진입부에서 세 필드 null 검사 → null이면 명시적 예외(`SHIPPING_SETTING_INVALID` 등) | 중 — 오설정을 **조용히 무료배송으로 만들지 않고 시끄럽게 실패**시킴 | 코드만, 마이그레이션 없음 |
| **(iii) `nullToZero` 확장** ❌ | 배송 3필드도 nullToZero 처리 | **낮음/위험** — null을 0으로 삼키면 배송비가 조용히 0원이 됨(과금 사고). 비추천 | — |

### 추천: **(i)를 기본 + (ii)를 심층 방어로 병행**

- **(i) V9 NOT NULL이 주 방어** — 구멍을 근원(컬럼)에서 영구히 닫음, 가장 싸고 확실. 
- **(ii) fail-fast는 벨트+멜빵** — 만일의 우회 경로(직접 SQL 등)에도 계산기가 조용히 오작동하지 않게. (iii)는 채택 금지(무료배송 사고).
- 순서: V9 마이그레이션 → 계산기 가드 → 이후 O 전이 task.

### R 영향

- R은 `refund_amount`·`return_shipping_fee` 산정 시 배송 설정을 재참조할 가능성이 높음 → NOT NULL 보증이 R의 환불 계산도 동일하게 보호. D2를 O 초입에 갚아두면 R이 그 위에서 안전하게 계산.

---

## D3. 주문 상세의 상품 정보 스냅샷 정책 (C 넘긴 썸네일 빚)

**문제**: 상품명·옵션명·가격은 스냅샷 온전(§0.4). **썸네일(mainImageUrl)만 라이브 조인** → 상품/이미지 소프트삭제 시 과거 주문에서 이미지가 null로 사라짐.

### 선택지

| | 방식 | 장점 | 단점 / 파급 |
|---|------|------|-----------|
| **(i) `dat_order_item.image_url` 스냅샷 컬럼 추가 (V9+)** | 주문 생성 시 대표이미지 URL을 함께 스냅샷, 조회는 스냅샷에서 | 상품명과 동일하게 영구 온전. R도 동일 이득 | **주문 생성 경로(M4 `OrderService.create`, `:145-156`) 수정 필요 → O(admin)의 blast radius가 사용자측 쓰기 경로까지 확장.** 기존 주문은 컬럼 null → 백필 별도 판단 |
| **(ii) placeholder 유지 + 빚 존속** ⭐ | null이면 프런트가 placeholder 표시. O에서 코드/마이그레이션 0 | O 범위를 admin에 가둠. 상품명 스냅샷이 있어 식별엔 지장 없음 | 썸네일 소실이라는 표시상 결함은 남음 |
| **(iii) 하이브리드** | 앞으로는 (i)로 스냅샷 + 과거 null은 (ii) placeholder | 신규 주문 완전 + 과거 관대 | (i)의 M4 경로 수정 파급을 동일하게 짊어짐 |

### 추천: **관리자 표시 정책이므로 사용자 결정 필요** — 기본선은 (ii)

- O는 **관리자용** 주문 상세임. 소프트삭제 상품의 썸네일이 없어도 **상품명 스냅샷으로 식별 가능** → admin 실무 지장은 작음. 반면 (i)/(iii)는 **사용자측 주문 생성 코드(M4)를 건드려** O의 위험 표면을 키움.
- 따라서 **O 자체 범위에서는 (ii) placeholder + 빚 존속을 기본 권장**. 다만 "주문 이력의 썸네일 영구 보존"이 제품 요구로 확정된다면 (i)를 O와 **분리된 별도 task**(M4 경로 수정이므로)로 올리는 게 맞음.
- **정말 사용자 결정 사항**: 썸네일 영구 보존을 지금 O에서 갚을지(→ M4 경로 수정 감수), 아니면 placeholder로 두고 빚 유지할지 → 확인필요 Q-D.

### R 영향

- R 상세(반품 상품 표시)도 같은 이미지 출처를 씀 → (i) 채택 시 R도 자동 이득. (ii) 유지 시 R도 동일 빚 상속.

---

## 확인 필요 (단정하지 않고 질문 — 결정해 주시면 반영)

- **Q-A (D1, 필수)**: O 전이 체인이 구동하는 컬럼은? 스키마상 `PAID`/`PREPARING`은 `order_status`, `SHIPPED`/`IN_TRANSIT`은 `shipping_status`에만 있음(§0.1). 
  - (a) `order_status` 하나로 통합(SHIPPED/IN_TRANSIT를 order_status 어휘에 추가, shipping_status는 폐지/보조) 
  - (b) 2컬럼 분리 유지 — `order_status`: PAID→PREPARING→SHIPPING→DELIVERED(굵게), `shipping_status`: READY→SHIPPED→IN_TRANSIT→DELIVERED(세부), 운송장 입력 시 둘을 좌표 이동 
  - (c) 기타. → **이게 정해져야 전이표의 노드 집합이 확정됨.**
- **Q-B (D1)**: 되돌리기 허용 범위? 관리자 오조작 복구(예: 실수로 SHIPPED→다시 PREPARING) 허용 여부와, 어느 전이까지 역방향 허용인지.
- **Q-C (D1/R 경계)**: `CANCELED`/`RETURNED`로의 진입을 O가 소유하나, R이 소유하나? (RETURNED는 R 종결로 보이고, CANCELED는 O 관리자취소일 수도/R 취소승인일 수도.) 전이표 소유권을 지금 못박으면 R에서 재논쟁 없음.
- **Q-D (D3)**: 썸네일 영구 보존을 O에서 지금 갚나(=M4 주문생성 경로 수정 감수), placeholder로 빚 유지하나?
- **Q-E (D1)**: 전이 위반 에러코드 — 신규 `ORDER_TRANSITION_INVALID`(409) 신설 vs 기존 `ORDER_INVALID_STATUS`(409) 재사용? (기존은 "비-PENDING 주문 결제 시도"에 이미 쓰임 → 의미 분리 위해 신설 권장이나 확인.)

---

## 5. 확정 설계 (반영본 — 구현 정본)

### 5.1 결정 요약

| 항목 | 확정 | 핵심 |
|------|------|------|
| **D1** | (A) enum + 전이표(Map) | 두 상태 enum 각각의 허용전이 맵 + **동기화 규칙(§5.3)을 액션 레이어로 응집**. 위반 시 `ORDER_TRANSITION_INVALID`(409) 단일 choke point |
| **D2** | (i) V9 `NOT NULL` + (ii) 계산기 fail-fast **병행**. **O 첫 task로 선행**. (iii) nullToZero **금지** | 배송 3필드 구조적 non-null + 시끄러운 실패. 무료배송 사고 방지 |
| **D3** | (ii) placeholder 유지 + 빚 존속 | M4 주문생성 경로 불변. `dat_order_item.image_url` 스냅샷 컬럼 **추가 안 함** |
| **Q-A** | (b) **2컬럼 분리 유지** | `order_status`(주문 생명주기) · `shipping_status`(배송 세부)는 서로 다른 질문에 답하는 도메인 모델 → 합치지 않음. 스키마 그대로. **동기화 규칙을 §5.3에 명시** |
| **Q-B** | 되돌리기 최소화 | 단방향 전진 + 관리자 취소(→CANCELED)만. 역방향 금지. **전이 그래프에 순환 없음** |
| **Q-C** | 전이표(규칙) = **O 단일 소유** | O 전이표에 관리자 직접취소(PAID/PREPARING→CANCELED) 포함. R발 CANCELED/RETURNED는 **R이 O의 `Order.changeStatus`(엔티티 전이 가드)를 호출**(규칙=O, 트리거=액션 소유자). RETURNED 진입은 R 종결이 유발 |
| **Q-D** | (ii) placeholder | D3와 동일 |
| **Q-E** | 신규 `ORDER_TRANSITION_INVALID`(409) | 기존 `ORDER_INVALID_STATUS`("비-PENDING 결제 시도")와 의미 분리 |

### 5.2 두 컬럼의 허용 전이 맵 (D1, Q-A(b))

두 상태는 **독립된 enum + 독립된 허용전이 맵**으로 모델링한다. 조정(어느 액션이 둘을 함께 움직이는가)은 §5.3 액션 레이어가 담당한다.

**`OrderStatus` (dat_order.order_status — 주문 생명주기, 굵은 단위)**

```
PENDING    → { PAID }                       // 결제(M4 기존, 전이표로 승격)
PAID       → { PREPARING, CANCELED }        // 준비 시작 / 관리자 취소
PREPARING  → { SHIPPING, CANCELED }         // 출고 / 관리자 취소
SHIPPING   → { DELIVERED }                  // 배송완료
DELIVERED  → { RETURNED }                   // R 종결이 유발(R→O 전이서비스 호출)
CANCELED   → { }                            // 종결(terminal)
RETURNED   → { }                            // 종결(terminal)
```

> `order_status`에는 `SHIPPED`/`IN_TRANSIT`가 **없다**(Q-A(b) 확정) — 그 둘은 `shipping_status`의 세부 단계이고, 주문 생명주기에서는 `SHIPPING` 하나로 본다.

**`ShippingStatus` (dat_order_shipping.shipping_status — 배송 세부 단위)**

```
READY      → { SHIPPED }                    // 운송장 입력·출고
SHIPPED    → { IN_TRANSIT, DELIVERED }      // 배송중 전환 / (IN_TRANSIT 생략하고) 완료
IN_TRANSIT → { DELIVERED }                  // 배송완료
DELIVERED  → { }                            // 종결(terminal)
```

- 두 맵 모두 **역방향 항목 없음 → 순환 없음**(Q-B). 관리자 오조작 복구가 실무상 필요해지면 **명시적 전이 항목을 맵에 추가**하는 방식으로만 허용(별도 메커니즘 금지).
- 잘못된 문자열이 DB에 있을 때를 대비해 enum 파싱 지점(문자열→enum)에서 방어. DB 컬럼은 VARCHAR 유지(마이그레이션 불요).

### 5.3 2컬럼 동기화 규칙 (Q-A 핵심 — O 설계의 심장)

전이는 관리자 **액션(command)** 단위로 일어나고, 각 액션이 **어느 컬럼을 함께/따로 움직이는지**를 아래 표가 단일 정본으로 규정한다. 이 조정이 O 서비스의 핵심 — 두 맵을 개별 호출하지 말고, 액션 하나가 관련 컬럼 전이를 **한 트랜잭션에서 원자적으로** 수행한다.

| 관리자 액션 | order_status | shipping_status | 부수 효과 | 동기화 |
|-------------|--------------|-----------------|-----------|--------|
| **준비 시작** `startPreparing` | PAID → PREPARING | (불변: READY) | — | order만 |
| **출고 / 운송장 입력** `ship` | PREPARING → SHIPPING | READY → SHIPPED | `tracking_no` **필수 입력**, `shipped_date = now` | **양 컬럼 동시**(핵심 동기화 지점) |
| **배송중 전환** `markInTransit` | (불변: SHIPPING) | SHIPPED → IN_TRANSIT | — | shipping만 |
| **배송완료** `markDelivered` | SHIPPING → DELIVERED | {SHIPPED\|IN_TRANSIT} → DELIVERED | `delivered_date = now` | **양 컬럼 동시** |
| **관리자 취소** `cancelByAdmin` | {PAID\|PREPARING} → CANCELED | (불변) | 취소 사유 기록(선택) | order만 |
| **반품 종결** `markReturned` (R 트리거) | DELIVERED → RETURNED | (불변: DELIVERED) | R이 O 전이서비스 호출 | order만 |

동기화 원칙:
1. **출고(`ship`)와 배송완료(`markDelivered`)만 두 컬럼을 동시에 움직인다.** 나머지는 한쪽만.
2. 동시 이동 액션은 **두 컬럼의 전이가 각각 자기 맵에서 유효할 때만** 커밋. 하나라도 위반이면 `ORDER_TRANSITION_INVALID` → 전체 롤백(부분 전이 금지).
3. `markDelivered`는 `shipping_status ∈ {SHIPPED, IN_TRANSIT}` 양쪽에서 허용(관리자가 IN_TRANSIT 단계를 생략할 수 있는 수동 운영 현실 반영). — *세부 확정은 전이 task 착수 시 재확인, 기본값은 "생략 허용".*
4. 취소는 **출고 전(PAID/PREPARING)에서만** 가능(Q-B). SHIPPING 이후는 취소 대신 반품(R) 경로.

### 5.4 에러코드 (Q-E)

- 신설: `ORDER_TRANSITION_INVALID(HttpStatus.CONFLICT, "허용되지 않은 주문 상태 전이입니다.")`
- 기존 `ORDER_INVALID_STATUS`(409)는 그대로 두고 의미 분리(비-PENDING 결제 시도 전용).
- **엔티티 `Order.changeStatus` 단일 choke point**에서만 던진다(구현 확정 — 서비스가 아니라 엔티티 레벨, 어떤 호출자도 우회 불가). 기존 엔티티 메서드가 "검증 없이 set"였던 것과 달리 비즈니스 불변식을 강제하는 첫 사례이며, R의 `ReturnStatus`도 이 방식을 답습한다.

### 5.5 O task 분할 순서 (다음 단계 — 이 문서 확정 후 별도 분할 문서로)

1. **O-T1 (선행): 계산기 방어(D2)** — V9 `NOT NULL`(shipping_fee/free_shipping_min/remote_extra_fee) + `OrderAmountCalculator` fail-fast 가드. O 본체 전 완료. *(빚 #1 청산)*
2. **O-T2: 상태 전이표 + 엔티티 전이 가드** — OrderStatus/ShippingStatus enum + 허용전이 맵 + `Order.changeStatus`(단일 choke point) + `ORDER_TRANSITION_INVALID`. 기존 `transitTo("PAID")`도 `changeStatus(PAID)`로 승격(M4 회귀 없게 최소 개입).
3. **O-T3: 운송장 입력 + 출고/배송 액션** — `OrderShipping`에 mutator 신설(tracking_no/shipping_status/shipped_date/delivered_date), `ship`/`markInTransit`/`markDelivered` 엔드포인트. 사용자 상세에 자동 반영됨(§0.3 연결 확인).
4. **O-T4: 주문 목록·검색·상세(admin)** — `OrderSpecs`(orderNo/orderStatus/userSeq/기간, ProductSpecs 패턴 답습), admin 주문 상세.

> [수동리뷰 필수] 후보: O-T1(금액·마이그레이션), O-T2(전이 골격 — R이 답습). 나머지는 분할 시 위험도 재평가.

---

## 참고: 이번 라운드 범위 밖 (재확인)

- 운송장 **외부 추적 API**(택배사 연동) — 사업자 미정, **수동 입력**으로 우선 충족. tracking_no 수동 입력 필드만 O 범위.
- 결제 취소 **PG 실연동** — 범위 밖. (payment_status REFUNDED 전이 표현은 R에서.)
