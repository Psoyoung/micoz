# M7 D. Dashboard (대시보드) — Task 분할

> **기준 문서**: `docs/admin-overview.md` §1(D)·§3(공통) / `docs/HANDOFF.md` §2(표준)·§4(빚)·§7(D) / **`docs/dashboard-decisions.md`(결정 정본, 2026-07-06)**
> **대상 테이블(전부 read-only 집계)**: `dat_order`(매출·주문건수), `dat_return`(순매출 환불 차감), `mst_user`(신규회원), `dat_inquiry`(WAITING·응답시간). **쓰기 0**.
> **관련 FR**: FR-ADM-01(매출·주문 KPI, 매출 추이, 기간 필터. 유입 위젯=GA 의존 → **범위 제외**).
> **재사용 기반**: F(RBAC 게이팅·`@PreAuthorize`) · O/R/M/C/CS **완료 데이터**(집계 원천) · ApiResponse 봉투. 신규 상태머신·전이·payment **없음**.
> **상태**: **결정 전 항목 확정**(`dashboard-decisions.md` §3 + 본 문서 §4 Q-D1~Q-D5, 2026-07-06) → D-T1 착수.
>
> **위험 프로파일이 write 모듈과 다름**: 순수 read라 전이/원자성 관심사가 없다. 새 관심사 = ⓐ **집계 정확성**(정의 B 산식·이중차감·부분반품), ⓑ **성능**(풀스캔 → EXPLAIN 후 인덱스), ⓒ **기간 경계**(KST 반개구간). [수동리뷰 필수]의 **근거가 "상태변경"이 아니라 "집계 정확성(금액)"**.

---

## 0. 엔드포인트 계약 (신규 — greenfield, admin 대시보드)

모든 엔드포인트: `/api/v1/admin/**` URL 게이팅 + 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")` 2차 방어(F-T4 표준). 응답 봉투 `ApiResponse<T>`. **전부 GET·read-only**(감사 `u_*` 변경 없음). 관리자 전체 대상.

| # | 메서드·경로 | 액션 | 파라미터 | task |
|---|---|---|---|---|
| DA1 | `GET /api/v1/admin/dashboard/summary` | KPI 요약(Q6) | `period`(프리셋, 기본 `TODAY`) 또는 `dateFrom`/`dateTo`(커스텀) | D-T2 |
| DA2 | `GET /api/v1/admin/dashboard/sales-trend` | 일별 매출 추이(Q7) | `days`(기본 30) 또는 `dateFrom`/`dateTo` | D-T2 |

> **유입경로 위젯 엔드포인트 없음**(D4 = GA 범위 제외 확정, Mock 미제공. HANDOFF 빚 #11).

**기간 파라미터(공통)** — 프리셋은 KST 산출 → 반개구간 `[start, nextStart)`:

| 프리셋 | 경계(Asia/Seoul) |
|---|---|
| `TODAY` | `[오늘 00:00, 내일 00:00)` |
| `THIS_WEEK` | `[이번주 월요일 00:00, 다음주 월요일 00:00)` (주 시작 **월요일**) |
| `THIS_MONTH` | `[1일 00:00, 다음달 1일 00:00)` |
| `LAST_7_DAYS` | `[6일전 00:00, 내일 00:00)` (오늘 포함 7일) |
| 커스텀 | `dateFrom`/`dateTo`(ISO offset) — 기존 `AdminOrderSearchCondition` 패턴 재사용 |

> 미허용 프리셋/역전 기간(from>to) → **400 `COMMON_INVALID_REQUEST`**(정렬 화이트리스트 위반과 동형).

### 0.1 신규 ErrorCode — **없음**

read-only 집계라 도메인 에러 불요. 입력 검증 실패는 기존 `COMMON_INVALID_REQUEST`(400) 재사용. `INQUIRY_NOT_FOUND` 등 조회 대상 단건 에러도 대시보드엔 없음(전부 집계).

### 0.2 DTO (신규, 전부 `@JsonInclude(NON_NULL)` + `@Builder`)

```
DashboardSummaryResponse {
    period { from, to }                 // 적용된 반개구간(OffsetDateTime) 에코
    grossSales                          // 총매출 BigDecimal
    netSales                            // 순매출 BigDecimal — ⚠️ 음수 가능(발생주의, §3 Q3)
    orderCount                          // 주문 건수(총매출 상태집합 기준 — Q-D4)
    newMemberCount                      // 신규 회원수(CUSTOMER, i_date in period, use_yn 무관 — Q-D3)
    waitingInquiryCount                 // WAITING 문의 — 현시점 스냅샷(period 무관)
    avgResponseSeconds                  // 평균 응답시간(초, ANSWERED·answered_date in period — Q-D2). 대상 0이면 null
}
SalesTrendResponse { points: [ SalesTrendPoint ] }
SalesTrendPoint {
    date                                // LocalDate(KST 일자)
    grossSales                          // 그날 총매출(order_date KST 일)
    netSales                            // 그날 순매출(refund는 completed_date KST 일 귀속) — 음수 가능
    orderCount
}
```
- 금액은 `BigDecimal`(스키마 `NUMERIC(15,2)` 답습). 응답시간은 초(`long`) — UI 포맷은 프론트.
- `SalesTrendPoint.date`는 **KST 일자**(집계 SQL이 `AT TIME ZONE 'Asia/Seoul'`로 버킷팅 — §2 D-T1 기술노트).

---

## 1. 의존성 그래프

```
[완료 모듈 데이터 — read 원천]
  dat_order   ── 총매출·주문건수 (order_status ∈ {PAID,PREPARING,SHIPPING,DELIVERED,RETURNED}, order_date 귀속)
  dat_return  ── 순매출 차감 (return_type='RETURN' AND status='COMPLETED', completed_date 귀속)
  mst_user    ── 신규회원 (user_role='CUSTOMER', i_date 귀속)
  dat_inquiry ── WAITING 스냅샷 · 평균 응답시간(answered_date − i_date)
        │
        ▼
  D-T1  집계 리포지토리 + DashboardQueryService + KST 경계 유틸(KstPeriods)   [수동리뷰 필수]
        │   └─ 여기서 집계 쿼리 EXPLAIN 실측 → D-T3 인덱스 근거
        ▼
  D-T2  AdminDashboardController (DA1 summary · DA2 sales-trend) + period 파싱/검증   [수동리뷰 권장]
        │
        ▼
  D-T3  V11 인덱스 (D-T1 EXPLAIN 결과로 컬럼 결정)   [수동리뷰 필수]
```

- **의존 방향**: D는 모든 도메인의 **말단 소비자**(집계만). 도메인 서비스에 역의존 유발 안 함 — 대시보드 전용 리포지토리/쿼리를 `admin.dashboard.*`에 둔다(신규 공유 컴포넌트 없음).
- **신규 마이그레이션**: D-T1/D-T2는 **없음**(read-only). D-T3만 V11.

---

## 2. Task 정의

### D-T1. 집계 리포지토리 + DashboardQueryService + KST 경계 유틸 — **[수동리뷰 필수]**

> 근거: 상태변경 아님. **금액 집계 정확성**(정의 B 산식·이중차감·부분반품·KST 경계)이 위험면.

**범위**
- `KstPeriods` 유틸: 프리셋(TODAY/THIS_WEEK/THIS_MONTH/LAST_7_DAYS) + 커스텀 → `[start, nextStart)` `OffsetDateTime` 쌍 산출. `ZoneId.of("Asia/Seoul")` 상수, 주 시작 월요일(`TemporalAdjusters`/`WeekFields` 주의 — 명시적으로 MONDAY). **테스트 가능하도록 기준시각(now)을 주입** 받는 순수 함수로(고정 clock 단위테스트).
- 집계 쿼리(대시보드 전용 리포지토리 — JPQL 또는 native):
  - **총매출·주문건수**: `dat_order` WHERE `order_status IN ('PAID','PREPARING','SHIPPING','DELIVERED','RETURNED')` AND `order_date >= :start` AND `order_date < :end` → `SUM(final_amount)`, `COUNT(*)`.
  - **순매출 차감액**: `dat_return` WHERE `return_type='RETURN'` AND `return_status='COMPLETED'` AND `completed_date >= :start` AND `completed_date < :end` → `SUM(refund_amount)`. 순매출 = 총매출 − 차감액.
  - **신규회원**: `mst_user` WHERE `user_role='CUSTOMER'` AND `i_date` in period → `COUNT(*)` (use_yn 필터 여부 Q-D3).
  - **WAITING 스냅샷**: `dat_inquiry` WHERE `inquiry_status='WAITING'` AND `use_yn='Y'` → `COUNT(*)` (period 무관).
  - **평균 응답시간**: `dat_inquiry` WHERE `inquiry_status='ANSWERED'` AND `answered_date` in period → `AVG(EXTRACT(EPOCH FROM (answered_date − i_date)))` 초.
  - **일별 추이(DA2)**: `date_trunc('day', order_date AT TIME ZONE 'Asia/Seoul')` 로 KST 일 버킷, 총매출·주문건수 그룹. 순매출 일별은 `completed_date AT TIME ZONE 'Asia/Seoul'` 버킷의 refund를 차감(별도 집계 후 일자 조인). 빈 날짜는 0으로 채워 30일 연속 배열 반환.
- **기술노트**: KST 일 버킷팅은 `AT TIME ZONE`이 필요해 **native query** 유력(JPQL 미지원). `SUM` NULL(행 0건) → `COALESCE(...,0)`.

**완료기준**
- 전수 계산 단위/통합 검증(시드 → 손계산 일치):
  - **부분반품 케이스**: 부분반품(order_status 미변경·`dat_return` RETURN COMPLETED refund>0) 있는 주문 포함 → 순매출 = 총매출 − 부분환불 손계산값과 **정확히 일치**.
  - **순매출 음수 단언**: 그 기간 주문 적고 이전 기간 주문의 환불이 그 기간 `completed_date`로 몰린 시드 → `netSales < 0` 단언(발생주의 정확성 증명, 버그 아님).
  - **이중차감 0 단언**: CANCELED 주문 + `return_type='CANCEL'` COMPLETED 환불 시드 → 순매출에 영향 0(총매출·차감 양쪽 미포함). EXCHANGE COMPLETED(refund 0) → 영향 0.
  - **KST 경계 단언**: KST 자정 직전(전일 23:59 KST = UTC 14:59)·직후(00:01 KST) 주문이 올바른 KST 일/기간에 귀속(UTC 15:00 경계 오프바이9시간 없음).
  - **평균 응답시간·WAITING**: ANSWERED 응답시간 손계산 일치, WAITING 스냅샷이 period와 무관.
- **집계 쿼리 EXPLAIN 실측**(러너/compose DB) → Seq Scan 여부·비용 기록 → **D-T3 인덱스 컬럼 결정 근거**.

**의존성**: 없음(앞 모듈 완료 데이터). **위험도**: [수동리뷰 필수](금액 집계).

---

### D-T2. AdminDashboardController (DA1·DA2) + period 파싱/검증 — **[수동리뷰 권장]**

> 저위험(패턴 답습·read)이나 **숫자(매출)를 노출**하므로 커밋 전 검증 결과·요약 제시 후 진행(자동커밋 아님).

**범위**
- `AdminDashboardController`: F-T4 표준(`/api/v1/admin/dashboard`, 클래스 `@PreAuthorize`). DA1/DA2 → `DashboardQueryService` 위임.
- period 파싱: 프리셋 enum(`DashboardPeriodPreset`) + 커스텀(`dateFrom`/`dateTo`). 프리셋·커스텀 동시/역전(from>to)·미허용값 → **400 `COMMON_INVALID_REQUEST`**. `days`(DA2) 범위(1~약 90) 가드.
- 응답 조립(DTO §0.2), `period` 에코.

**완료기준**
- 통합 테스트(실 HTTP, `TestRestTemplate`):
  - RBAC: 비인증·비관리자(CUSTOMER 토큰) → **403 `AUTH_FORBIDDEN`**(F 표준).
  - DA1: 시드 대비 `grossSales/netSales/orderCount/newMemberCount/waitingInquiryCount/avgResponseSeconds` 값 일치. `period=TODAY` 기본, 커스텀 기간 동작.
  - DA2: 30일 연속 배열(빈 날 0), 일별 총매출·주문건수 합 = 기간 summary와 정합.
  - **일별 순매출 음수 명시(Q-D5)**: 특정일 환불 완료 몰림 시드 → 그날 `netSales`가 **summary보다 큰 음수** 가능 단언(클램프 안 함 = 정상). 응답/문서에 "일별 순매출 큰 음수 가능(정상)" 명시 → 프론트 차트 축 음수 포함.
  - 검증: 잘못된 preset·역전 기간·범위 초과 `days` → 400.
  - 빈 기간(주문 0) → 0/음수 정상 처리(NPE·NaN 없음).
- **테스트 격리**: 시드 회원/주문 `@AfterEach` 정리(빚 #9 계열 재발 방지 — CS 테스트 패턴 답습).

**의존성**: D-T1. **위험도**: [수동리뷰 권장](숫자 노출).

---

### D-T3. V11 성능 인덱스 (EXPLAIN 결과 기반) — **[수동리뷰 필수]**

> **D-T1의 EXPLAIN 실측 후** 착수. 추측으로 인덱스 먼저 박지 않음(실측 우선, Q5).

**범위**
- D-T1 EXPLAIN이 Seq Scan/고비용을 보인 축에만 인덱스. **후보(실측으로 취사)**:
  - `dat_order(order_status, order_date)` 복합, 또는 `order_date` 부분인덱스 `WHERE order_status IN (...)` — 기간+상태 필터 대응.
  - `dat_return(return_status, completed_date)` 또는 `completed_date` 부분인덱스 `WHERE return_type='RETURN' AND return_status='COMPLETED'`.
  - `dat_inquiry(inquiry_status)` — WAITING 스냅샷/ANSWERED 필터.
- `V11__dashboard_indexes.sql`. `ddl-auto=validate`라 컬럼 추가 아님(인덱스만) — 검증 영향 없음.

**완료기준**
- **EXPLAIN before/after 비교**: 대상 쿼리가 Seq Scan → Index/Bitmap Scan 전환 + 비용 감소 기록. 데이터량이 작아 플래너가 인덱스를 안 써도 무방(근거 기록 후 채택/보류 판단).
- flyway 마이그레이션 적용 성공, 전체 스위트 green(회귀 0).

**의존성**: D-T1(EXPLAIN 근거). **위험도**: [수동리뷰 필수](스키마 변경).

---

## 3. 진행 방식 (게이트 — HANDOFF §3 그대로)

- **D-T1 [수동리뷰 필수]**: 검증(전수 계산·음수·이중차감·KST 경계 단언 통과) + EXPLAIN 결과 + 커밋 후보 제시 → **멈추고 승인 대기** → 승인 후 커밋.
- **D-T2 [수동리뷰 권장]**: 통합 검증 통과 + 요약(값 정합·RBAC·검증) 제시 → 커밋 후보 제시(숫자 노출이라 자동커밋 안 함).
- **D-T3 [수동리뷰 필수]**: EXPLAIN before/after + 마이그레이션 + 회귀 green → 커밋 후보 제시 → 승인 후 커밋.
- **push는 항상 별도 명시 승인 후**. 커밋 = Conventional Commits·제목 한국어·Co-Authored-By 트레일러. task별 분리 커밋.
- **검증 = 단위 + 통합(실 HTTP) + `./gradlew build`(Docker/Testcontainers)**. 러너 정합은 HANDOFF 헤더(24.0.7/MinAPI 1.12 정상) 참조.
- 모듈 종료 시 통합 검토 요약 + HANDOFF 갱신(D 완료·빚·M7 8/8 마감).

---

## 4. 확정 결정 (2026-07-06)

| # | 결정 | 관련 |
|---|---|---|
| **Q-D1** | summary에 **`period` 적용(기본 TODAY)**. WAITING만 현시점 스냅샷 | DA1 |
| **Q-D2** | 평균 응답시간 = **`answered_date` in period** 대상 | DA1·D-T1 |
| **Q-D3** | 신규회원 = **`user_role='CUSTOMER'` + `i_date` in period, `use_yn` 무관**. **근거**: 신규가입은 과거 이벤트라 이후 탈퇴가 소급 변경 안 함 — Q3(순매출 completed_date 귀속)과 같은 **"과거 확정값 고정" 철학**. D 전체가 일관된 회계 철학으로 묶임(음수/카운트 소급 불변) | DA1·D-T1 |
| **Q-D4** | 주문건수 = **총매출과 동일 상태집합**(CANCELED 제외, 결제 성사분) | DA1·D-T1 |
| **Q-D5** | 일별 추이 = **총매출·순매출·주문건수 3계열 + 순매출 음수 허용**. **일별 순매출은 summary보다 음수가 더 자주·크게** 나올 수 있음(특정일 환불 완료 몰림) → **클램프 금지**(회계 왜곡), D-T2 완료기준/응답에 "일별 순매출 큰 음수 가능(정상)" 명시 → 프론트가 차트 축을 음수까지 | DA2 |

> 그 외(응답시간 단위=초, 금액=BigDecimal, 빈 날 0채움)는 §0.2 기본값으로 진행.

---

## 5. 실측 요약 (dashboard-decisions.md §1 정본 — 재확인용)

- `dat_order`: `final_amount NUMERIC(15,2) NOT NULL`, `order_status`(enum 7값, CANCELED/RETURNED 종결), `order_date`·`i_date` TIMESTAMPTZ. 부분반품은 order_status 미변경.
- `dat_return`: `refund_amount NUMERIC(15,2)`, `return_status` COMPLETED 종결, `completed_date` TIMESTAMPTZ, `return_type` CANCEL/EXCHANGE/RETURN. **EXCHANGE refund 항상 0 실측**.
- 타임존: `hibernate.jdbc.time_zone=UTC` + TIMESTAMPTZ, 앱 KST 설정 없음 → KST 명시 산출 필수.
- 인덱스: `dat_order(user_seq, order_date)`·`dat_inquiry(user_seq)`만 — 기간·상태 집계 축 인덱스 부재(D-T3 대상).
- 기존 다중주문 매출 집계 코드 **없음**(이번이 최초 정본).
