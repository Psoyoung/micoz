# D(Dashboard, FR-ADM-01) — 결정 라운드

> M7 마지막 모듈. **순수 read 집계** — 상태·금액을 바꾸지 않으므로 전이/원자성 관심사가 없다.
> 대신 새 관심사: ⓐ **집계 정확성**(무엇을 매출로 세나), ⓑ **성능**(풀스캔·인덱스), ⓒ **기간 경계**(타임존).
> **실측 우선**: 아래 §1은 코드/스키마에서 확인한 사실만. 선택지·트레이드오프는 §2, **확정 결정(2026-07-06)은 §3**.
> 진행: 이 문서 확정 → `docs/tasks-D-dashboard.md` 분할 → 게이트(검증→커밋후보→승인). **구현·분할은 아직 안 함.**

---

## 1. 실측 결과 (사실만)

### 1.1 매출/주문 원천 — `dat_order`
```
order_status  VARCHAR(20) NOT NULL DEFAULT 'PENDING'
final_amount  NUMERIC(15,2) NOT NULL DEFAULT 0   -- 최종 결제 금액
order_date    TIMESTAMPTZ DEFAULT NOW()          -- 주문 일시
i_date        TIMESTAMPTZ DEFAULT NOW()          -- 등록 일시
```
- **상태 enum 정본** `OrderStatus.java`: `PENDING · PAID · PREPARING · SHIPPING · DELIVERED · CANCELED · RETURNED` (7). 전이표: PENDING→PAID(결제 성사) → PREPARING → SHIPPING → DELIVERED → RETURNED. PAID/PREPARING에서 CANCELED 분기. **CANCELED·RETURNED는 종결**.
- **⚠️ 주문 단위 상태에 "부분반품"이 없다.** `RETURNED`는 **주문 전체가 반품된 경우만**. 부분반품은 `order_status`를 바꾸지 않고(예: DELIVERED 유지) `dat_order_item.item_status='RETURNED'` + `dat_return`에만 기록된다. → **order_status만으로 순매출을 빼면 부분반품이 누락**된다(D1의 핵심).

### 1.2 환불 원천 — `dat_return`
```
return_type   VARCHAR(20) NOT NULL   -- CANCEL / EXCHANGE / RETURN
return_status VARCHAR(20)            -- enum 정본 ReturnStatus
refund_amount NUMERIC(15,2) DEFAULT 0
completed_date TIMESTAMPTZ           -- 완료(환불 확정) 일시
```
- **상태 enum 정본** `ReturnStatus.java`: `REQUESTED · APPROVED · COLLECTED · INSPECTED · COMPLETED · REJECTED`. **COMPLETED가 환불 확정 종결**. (스키마 주석의 `PICKUP/INSPECTING`은 **구값** — enum이 정본. 실측 우선 원칙.)
- `refund_amount`는 R-T4에서 **실제 확정된 환불액**(부분/전체 공통). `completed_date`가 환불 확정 시점.
- `return_type` 3종: CANCEL(주문 취소 경로) / EXCHANGE(교환) / RETURN(반품 환불).
- **✅ EXCHANGE refund_amount 실측(Q2 확인)**: `refund_amount` 쓰기 지점은 딱 둘 — `Return` 생성자(null→`BigDecimal.ZERO`, `Return.java:93`)와 `applyRefund`(`Return.java:121`, **`finalizeRefund`에서만** 호출). 생성 시(`ReturnService.java:89`) `refundAmount` 미지정 → **0**. 완료 시 `AdminReturnService.complete`의 **EXCHANGE 분기는 `markCompleted`만 하고 조기 return**(`AdminReturnService.java:84`) → `finalizeRefund` 미탑승. ∴ **EXCHANGE는 전 경로에서 refund_amount = 0**(0 아닌 케이스 없음). → 순매출 차감 대상에서 제외(빚으로 기록, 차액 교환 구현 시 포함).

### 1.3 기존 집계 코드 — **없음**
- 대시보드/통계용 **다중 주문 매출 집계 로직은 코드에 부재**. `SUM/COUNT`는 재고 카운트·`ReturnRefundCalculator` 등 도메인 국소용뿐. **"매출" 정의가 코드에 아직 없다 → 이번에 최초 확정**(참고할 기존 정의가 없으므로 결정이 곧 정본).

### 1.4 타임존
- `application.yml`: `spring.jpa.properties.hibernate.jdbc.time_zone: UTC`. 모든 일시 컬럼 **TIMESTAMPTZ(instant)**. **앱 레벨 KST(Asia/Seoul) 존 설정 없음.** 도메인은 `OffsetDateTime` 사용.
- 기존 기간필터 패턴(`AdminOrderSearchCondition` + `OrderSpecs`): `dateFrom`/`dateTo`를 `OffsetDateTime`(@DateTimeFormat ISO DATE_TIME)로 받아 **폐구간 `[from, to]`**(`≥from` AND `≤to`)로 조회.
- → **"오늘/이번주/이번달" 프리셋 경계는 서버가 KST 기준으로 명시 계산**해야 한다(KST 자정 = UTC 15:00 전일). JVM/DB 기본값에 의존하면 9시간 어긋난다.

### 1.5 인덱스 (성능)
```
idx_dat_order_user_seq   ON dat_order(user_seq, order_date DESC)   -- 선두컬럼 user_seq
idx_dat_inquiry_user_seq ON dat_inquiry(user_seq)
```
- **`order_date`/`order_status` 단독(또는 선두) 인덱스 없음**, `inquiry_status` 인덱스 없음. → **기간·상태 기준 전체 집계는 현재 인덱스 미활용 = 풀스캔.** 데이터 초기엔 무해하나 누적 시 성능 관심사(D3).

### 1.6 캐시 / GA (범위 근거)
- **캐시**: PRD §9 가정 — "기술 스택은 개요서 명시 범위 고정(**Redis/Kafka/ES 미도입**)". admin-overview §4.2 "집계 캐싱 = 인프라 도입 결정 의존". → 캐시 인프라 도입은 범위 밖 근거 명확.
- **GA**: PRD FR-ADM-01 "유입은 GA 범위에 의존", §9 의존성 "GA 연동 범위" 미확정, §10 "미연결 화면 범위 §11 결정 전까지 Out of Scope 고정", admin-overview §4.2 미해결. + 사용자 지시 "GA 실연동·외부 분석 API는 범위 밖".

---

## 2. 결정 항목 (선택지 + 트레이드오프 + 추천)

### D1. 매출 집계 기준 — 총매출 vs 순매출 정의 **[핵심 · 수동리뷰 필수]**

무엇을 매출로 세고, 반품을 어떻게 반영하나. §1.1의 "부분반품은 order_status를 안 바꾼다"는 실측이 이 결정을 지배한다.

**총매출(gross) — 어느 상태를 포함?**
- CANCELED = 결제 취소(주문 성사 실패) → **제외**가 자연스러움.
- PENDING = 미결제(장바구니성) → **제외**.
- PAID/PREPARING/SHIPPING/DELIVERED = 결제 성사·이행중/완료 → **포함**.
- RETURNED = 결제됐다가 전체 반품 종결 → 여기가 갈림.

| 정의 | 총매출 대상 | 순매출 | 부분반품 정확성 | 복잡도 |
|---|---|---|---|---|
| **A. 상태만(단순)** | order_status ∈ {PAID,PREPARING,SHIPPING,DELIVERED} 의 Σfinal_amount. RETURNED·CANCELED 제외 | 총매출과 동일(환불 별도 차감 안 함) | ❌ **부분반품 미차감(과대계상)** — order_status가 안 바뀌어 DELIVERED로 남아 전액 매출로 셈 | 낮음 |
| **B. 환불 차감(정확)** | order_status ∈ {PAID,PREPARING,SHIPPING,DELIVERED,**RETURNED**} 의 Σfinal_amount (CANCELED만 제외 = 결제 성사한 전체) | 총매출 − Σ`refund_amount`(COMPLETED 반품) | ✅ 부분·전체 반품 모두 refund로 일관 차감 | 중간(이중차감·기간귀속 주의) |

**✅ 확정: 정의 B**(환불 차감형). 근거: `refund_amount`가 부분/전체 공통으로 실제 확정 환불액이라(§1.2), order_status만으론 못 잡는 부분반품을 정확히 반영한다. "총매출 = 결제 성사분, 순매출 = 총매출 − 확정환불"은 회계 통념과도 일치.

**확정된 산식(이중차감 2개 정합):**
- **총매출** = `Σ final_amount WHERE order_status ∈ {PAID, PREPARING, SHIPPING, DELIVERED, RETURNED}` (**CANCELED만 제외** = 결제 성사한 전체). order_date 귀속.
- **순매출** = 총매출 − `Σ refund_amount WHERE return_type='RETURN' AND return_status='COMPLETED'`. completed_date 귀속(Q3).
- **이중차감 방지 ①(전체반품)**: 전체반품 주문을 총매출에 **포함(RETURNED 포함)**한 뒤 refund로만 차감 → 일관. RETURNED를 총매출에서 빼면서 refund도 빼는 이중차감을 회피.
- **이중차감 방지 ②(CANCEL-type)**: CANCELED 주문(=`return_type=CANCEL` 환불)은 이미 총매출에서 제외됐으므로 refund 차감 대상 아님 → **`return_type='RETURN'`만** 차감.
- **EXCHANGE**: refund_amount 항상 0 실측 확정(§1.2) → 차감 대상 아님. **빚**으로 기록(차액 교환 구현 시 포함).

**⚠️ 순매출 음수 가능(Q3, 정확한 회계 — 버그 아님)**: 총매출은 `order_date`, 환불 차감은 `completed_date` 귀속이라 **귀속 컬럼이 다르다**. 특정 기간에 그달 주문이 적고 **이전달 주문의 환불이 그달에 몰리면 순매출 < 0** 이 나올 수 있다. 이는 발생주의(과거 확정 매출을 소급 변경 안 함 — CS `answeredDate` 불변과 같은 "과거 확정값 고정" 철학)의 정확한 귀결이다. → **D-T1 완료기준·응답/UI 힌트에 "순매출 음수 가능(발생주의)" 명시**.

---

### D2. 기간 필터 경계 · 타임존 **[수동리뷰 권장 — 경계 산출 정확성]**

**타임존 기준**: §1.4 실측상 KST 설정이 없으므로 **서버가 `ZoneId.of("Asia/Seoul")` 상수로 프리셋 경계를 명시 산출**한다. (추천 확정 — 대안 없음. UTC/JVM 기본에 맡기면 9시간 밀림.)

**경계 방식**:
| 옵션 | 방식 | 트레이드오프 |
|---|---|---|
| (a) 폐구간 `[from, to]` | 기존 OrderSpecs 재사용 | `to`=`23:59:59.999…` 표현 애매(밀리초/나노 경계 누락·중복 위험) |
| (b) **반개구간 `[start, nextStart)`** | `≥start` AND `<nextStart` | 자정 경계 정확, 누락·중복 없음. **집계 표준** |

**추천**:
- **프리셋 경계는 반개구간 (b)** — 오늘=`[KST 00:00, 내일 KST 00:00)`, 이번달=`[1일 00:00, 다음달 1일 00:00)`. 서버가 KST로 산출 후 `OffsetDateTime`(UTC instant)로 변환해 쿼리.
- **커스텀 기간**은 기존 패턴대로 `dateFrom`/`dateTo`(ISO offset 포함) 허용.
- **귀속 컬럼**: 매출/주문 집계는 `order_date` 기준(§1.1). 환불 차감은 `completed_date` 기준(§1.2) — Q3 확정(§2 D1 음수 가능 참조).

**✅ 확정(Q4)**: 프리셋 = **오늘 · 이번주 · 이번달 · 최근7일 · 커스텀**, **주 시작 = 월요일**. 프리셋 경계는 서버가 `Asia/Seoul`로 산출 → `OffsetDateTime`(UTC instant) 변환 → 반개구간 `[start, nextStart)` 조회. 커스텀은 기존 `dateFrom`/`dateTo`(ISO offset) 재사용.

---

### D3. 집계 방식 — 실시간 쿼리 vs 캐시

| 옵션 | 내용 | 트레이드오프 |
|---|---|---|
| (a) **실시간 직접 쿼리** | 요청마다 집계 쿼리 | 단순·항상 최신. 누적 시 풀스캔 부담(§1.5) |
| (b) 캐시(Redis 등) | 주기 집계 캐싱 | **PRD §9 가정상 범위 밖**(미도입 명시). 스테일 관리 복잡 |

**✅ 확정: (a) 실시간 쿼리.** 근거: 관리자 수 적고 실시간성 유용, PRD가 캐시 인프라 미도입을 가정으로 못박음(§1.6). 캐시 미도입.

**✅ 확정(Q5): V11 인덱스 D 범위 포함하되 순서는 D-T1(집계 로직) 먼저 → 인덱스는 그 뒤.** D-T1에서 **실제 집계 쿼리의 `EXPLAIN`을 실측**해 어느 컬럼 조합에 인덱스를 걸지 정한다(추측으로 인덱스 먼저 박지 않음 — 실측 우선). 인덱스 task(D-T3)는 **스키마 변경이라 [수동리뷰 필수]**.

---

### D4. GA 의존 유입 위젯

| 옵션 | 내용 | 트레이드오프 |
|---|---|---|
| (a) **범위 제외(위젯·엔드포인트 미제공)** | 이번 D에서 유입 지표 안 만듦 | FR 일부 미충족이나 근거 명확(외부 연동 미확정) |
| (b) Mock 스텁 | 고정/랜덤 유입값 반환 | **가짜 데이터가 운영 오인 유발**, 나중에 교체 부채 |

**추천: (a) 범위 제외.** 근거: §1.6(PRD·overview·§11 전부 미확정) + 사용자 명시("GA 실연동 붙이지 마"). Mock도 만들지 않음(가짜 매출/유입은 대시보드 신뢰 훼손). 프론트가 "미지원" 처리, 빚 목록에 "GA 유입 위젯 = GA 연동 확정 후" 1줄 기록.

---

### D5. 문의(CS) KPI — 포함 확정

CS-Q②(answeredDate 불변)가 응답시간 집계를 안정적으로 만든다(재답변해도 최초 전이 시각 고정).

- **WAITING 적체**: `count(dat_inquiry WHERE inquiry_status='WAITING' AND use_yn='Y')` — **현시점 스냅샷**(기간 무관).
- **평균 응답시간**: `avg(answered_date − i_date)` for ANSWERED — 기간 내 대상(귀속 컬럼 §3 Q3와 연계).

**✅ 확정: 포함.** 즉시 산출 가능하고 CS 모듈이 이미 데이터를 남긴다. WAITING 인덱스 부재(§1.5)는 D3 인덱스 검토에 포함.

**✅ 확정(Q6) 노출 KPI 목록**: **오늘 매출 · 오늘 주문건수 · 신규회원수 · WAITING 문의수 · 평균 응답시간** + **일별 매출 추이(최근 30일, Q7)**.

---

## 3. 확정 결정 (2026-07-06)

| # | 결정 | 관련 |
|---|---|---|
| **Q1** | 매출 **정의 B(환불 차감형)** 채택 | D1 |
| **Q2** | 차감 대상 = **`return_type='RETURN'` COMPLETED만**. EXCHANGE는 **refund 항상 0 실측 확정**(§1.2) → 대상 제외 + **빚 기록**(차액 교환 구현 시 포함). CANCEL은 총매출 제외로 이미 반영 → 제외 | D1 |
| **Q3** | **`completed_date` 기준(발생주의)** — 과거 확정 매출 소급 변경 안 함. **순매출 음수 가능**(귀속 컬럼 상이)은 정확한 회계, D-T1 완료기준·UI 힌트에 명시 | D1·D2·D5 |
| **Q4** | 프리셋 = **오늘·이번주·이번달·최근7일·커스텀**, **주 시작 월요일**. 반개구간 `[start,nextStart)`, KST 산출 | D2 |
| **Q5** | V11 인덱스 **D 범위 포함**, 단 **D-T1(집계) 먼저 → EXPLAIN 실측 후 인덱스**. 인덱스 task = **[수동리뷰 필수]** | D3 |
| **Q6** | 노출 KPI = **오늘 매출·주문건수·신규회원·WAITING 문의·평균 응답시간 + 일별 매출 추이** | D5 |
| **Q7** | 매출 추이 = **일별 · 최근 30일** | D2 |
| **D2** | 타임존 = **KST(`Asia/Seoul`) 명시 산출 + 반개구간 `[start,nextStart)`** | D2 |
| **D4** | **GA 유입 위젯 범위 제외**(Mock도 안 만듦). 빚 1줄 기록 | D4 |
| **D5** | 문의 KPI **포함 확정** | D5 |

---

## 4. 확정 후 다음 단계 (참고 — 아직 진행 안 함)

`docs/tasks-D-dashboard.md`로 분할 예정. 예상 골격(순서 = Q5 반영):
- **D-T1**: 매출/주문 집계 리포지토리 + 서비스(정의 B: 총매출 order_status 필터 + 순매출 RETURN-COMPLETED refund 차감, KST 반개구간 경계 유틸). 순수 read, 전수 계산 단위테스트 + 통합. **완료기준에 "순매출 음수 가능(발생주의)" 단언 포함.** 여기서 집계 쿼리 `EXPLAIN` 실측.
- **D-T2**: KPI 요약(Q6) + 일별 매출 추이(Q7) 엔드포인트(`GET /api/v1/admin/dashboard/...`), RBAC 답습(URL 게이팅 + 클래스 `@PreAuthorize`).
- **D-T3**: V11 인덱스 마이그레이션 — D-T1의 EXPLAIN 실측으로 컬럼 조합 결정. **[수동리뷰 필수]**.
- 범위 밖: GA 유입 위젯(D4).

**신규 빚 후보(반영 시 HANDOFF §4 추가)**:
- EXCHANGE 순매출 차감 미포함 — 현재 refund_amount 항상 0(차액 교환 미구현). 차액 교환 구현 시 순매출 차감 대상 편입 필요.
- GA 유입 위젯 — GA 연동 범위 확정 후.
