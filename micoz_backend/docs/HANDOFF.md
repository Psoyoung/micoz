# MICOZ M7 관리자 백오피스 — 세션 인계 문서

> 새 세션이 5분 안에 맥락을 복원하기 위한 문서. **기존 커밋·문서·코드에서 추린 사실만.** 새 기능 지시 아님.
> 스택: Spring Boot 3.3.5 / Java 17 / PostgreSQL 15. 빌드·테스트는 Docker 컨테이너(`gradle:8.8-jdk17-alpine` + Docker socket, Testcontainers).
> **러너(실측)**: 이 환경 Docker **24.0.7/MinAPI 1.12**라 통합 러너 정상, 별도 설정 불요. (v29+ 환경에선 min API 1.40+로 Testcontainers 1.19.8의 docker-java 1.32 ping이 막힐 수 있고, **그때만** `src/test/resources/docker-java.properties`에 `api.version=<데몬 min 실측값>` 조건부 A안. 상세 `docs/tasks-CS-support.md` §6.) → "러너 막혔다" 오해나 v29 당황 방지.

---

## 1. 진행 현황 (M7 = 관리자 백오피스, 8개 모듈)

**M7 8/8 모듈 완료** 🎉. CS는 origin push 완료(origin/main = `733bb12`), **D + docs는 로컬 선행(`92aca0c`~`a800601`, push는 승인 후)**. 최신 마이그레이션 = **V11**(대시보드 인덱스). **완료 8모듈 / 남은 0**.

| 모듈 | 상태 | 대표 커밋(범위) |
|---|---|---|
| **F** Foundation (관리자 인증·RBAC) | ✅ 완료 | `315aa1e`(F-T2)~`ccb1ecf`(F-T6) |
| **M** Member 회원관리 | ✅ 완료 | `153882c`(M-T1)~`e521048`(M-T6) |
| **C** Catalog 카탈로그 | ✅ 완료 | `829113d`(C-T1)~`c0bf8dc`(C-T5) |
| **S** Settings 운영설정(배너·배송비) | ✅ 완료 | `4a8384a`(S-T1)·`8a56f4a`(S-T2) |
| **O** Order Ops 주문운영 | ✅ 완료 | `747c46d`(O-T1)~`9d5e9bf`(O-T4) |
| **R** Returns 반품/교환 | ✅ 완료 | `67a1d4d`(R-T1)~`08abdd1`(R-T4) |
| **CS** Customer Support 문의응대 | ✅ 완료 | `4d52f5a`(CS-T1)~`b547b89`(CS-T3) |
| **D** Dashboard 대시보드 | ✅ 완료 | `dc1e4b0`(D-T1)~`a800601`(D-T3) |

테스트 총계(최근 빌드): **38 스위트 / 258 테스트 / 실패 0**. 사용자 측 M1~M6(회원가입·상품·카트·주문·반품신청 등)은 M7 이전에 완료됨(`46d1a76`·`83abeff`·`b3b3f8d` 등).

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
| 1 | **쿠폰·포인트 사용/적립 생애주기 미구현** (재기술 2026-07-21) — 기존 서술 "환불 시 원장 복원 누락"은 부정확했음(실측). 실제로는 주문이 쿠폰/포인트를 소비/적립하지 않음: `CreateOrderRequest`에 필드 없음, `couponDiscount`/`pointUsed`=0 하드코딩, 쿠폰 USED 표시·포인트 차감/적립 실현 코드 전무. 스키마는 대비됨(`map_user_coupon.coupon_status=USED`, `his_point.point_type=CANCEL` 자리 존재). 이건 빚 상환이 아니라 **신규 기능(사용-측 구현)**이며, 구현 시 환불 복원·회수까지 함께 설계해야 함. 사용 여부는 PRD/실운영 로드맵 결정 사항. 실측·결정 라운드: `docs/return-refund-ledger-decisions.md`(Q1=(c) 이연 확정) | 이연 | 쿠폰/포인트를 실제 오픈할 때 사용-측(주문·결제)부터 구현 + 환불 복원/회수 동반 설계 |
| 2 | ✅ **해결됨** — 반품 동시 처리 시 주문단위 직렬화 부재로 과다 환불. **실측 정정**: 대규모 초과의 진짜 관문은 완료(complete)가 아니라 **신청(create)의 수량검증 TOCTOU**(락 없이 `alreadyReturned` 읽어 동시 신청이 수량 초과 반품 생성 → 완료 시 Σ환불=2×finalAmount). 완료 단독은 ±센트(calculator 선형 안분). | ✅ | `OrderRepository.findByOrderSeqForUpdate`(@Lock PESSIMISTIC_WRITE) 신설 — **프로젝트 최초 락**. `ReturnService.create`(수량검증 전)·`ReturnRefundService.finalizeRefund`(prior 조회 전) 양쪽에서 주문 행 잠금 → 신청+완료 주문단위 직렬화. 단일 자원 최초잠금이라 데드락 없음. 검증: 재현테스트 red(Σ=26000=2×13000)→green(race 0/50)+전체 39/265 실패0 |
| 3 | **EXCHANGE 재출고** — 현재 EXCHANGE 완료는 상태만. 대체옵션(`exchange_option_seq`) 재배송 미생성 | — | `AdminReturnService.complete` EXCHANGE 분기 + O 배송 로직 |
| 4 | **회수비 설정화** — 현재 독립 상수 3000 | — | `ReturnRefundService.RETURN_SHIPPING_FEE` → `mst_shipping.return_shipping_fee` 컬럼(V11) |
| 5 | **취소사유 컬럼** — 관리자 취소 사유 미저장 | — | `dat_order.cancel_reason` V11 + `CancelOrderRequest` |
| 6 | **재고 차감 응집 미완** — 복원은 `OrderStockRestorer`로 응집(R-T1), **차감(`decreaseStock`)은 `PaymentService`에 잔존** | 낮 | 차감도 공유 컴포넌트로 이동 검토 |
| 7 | ✅ **해결됨** (보안점검 S-3) — malformed 바디·경로변수 타입불일치·필수파라미터 누락이 500이던 것을 400으로. `GlobalExceptionHandler`에 `HttpMessageNotReadableException`·`MethodArgumentTypeMismatchException`·`MissingServletRequestParameterException` 핸들러 추가 → 400 `COMMON_INVALID_REQUEST`(내부 비노출). `eac5e7c` | ✅ | — |
| 8 | ✅ **해결됨** (보안점검 S-2) — 배너 `imageUrl`/`linkUrl` URL 미검증 → 저장형 XSS 벡터였음. `@Pattern` http/https 화이트리스트(대소문자 무시, `javascript:`/`data:` 차단), linkUrl은 내부 상대경로 허용하되 `//evil.com`·`/\evil.com` 외부이동 차단. Create/UpdateBannerRequest. `9bfa0da` | ✅ | — |
| 9 | **AdminMemberSearch 격리 취약** — 활성 CUSTOMER 전수를 절대값(==3)으로 단언 → 선행 테스트가 CUSTOMER 남기면 red(잠복 격리 계열). CS·D 테스트는 자체 `@AfterEach`로 회피. **D-T2에서 또 도졌음**(rbac 테스트의 `signupAndLogin` 누출 → 즉시 정리 훅으로 수정). 반복 재발이라 **우선순위 낮→中 재평가 권장**(회피가 아니라 근본 견고화) | 낮→**中?** | `AdminMemberSearchIntegrationTest`를 seeded-only 필터로 견고화(절대값 단언 제거), 또는 공용 `signupAndLogin`에 정리 훅 |
| 10 | **EXCHANGE 차액 순매출 편입** — D 순매출은 `return_type='RETURN'` COMPLETED refund만 차감. EXCHANGE는 현재 `refund_amount` 항상 0(차액 교환·재출고 미구현, 빚 #3 연동)이라 대상 제외. 차액 교환 구현 시 순매출 차감 대상 편입 필요 | — | 빚 #3(EXCHANGE 재출고) 구현 시 `refund_amount` 산정 + D 순매출 산식에 EXCHANGE COMPLETED 포함 |
| 11 | **GA 유입 위젯** — D 대시보드 유입경로 위젯은 GA 연동 범위 미확정(PRD FR-ADM-01·§9, admin-overview §4.2)이라 D 범위 제외(Mock도 미제공) | — | GA 연동 범위 확정 후 유입 위젯 엔드포인트 신설 |
| 12 | ✅ **해결됨** — AdminUserService 목록 정렬 화이트리스트 부재(존재하지 않는 sort 필드 시 500·민감 컬럼 정렬 노출 가능). API.md 문서화 중 실측 발견 → 즉시 수정 | ✅ | `AdminUserService.list`에 `SORT_WHITELIST`+`sanitizeSort` 적용(M~D 표준 답습). userPw 등 민감 컬럼 제외, 미허용 키 → 400 `COMMON_INVALID_REQUEST`. 검증: userPw 400·없는 필드 400(≠500)·허용 200·기본 회귀 + 전체 38/262 green |
| 13 | **주문 상세 결제 조회 statuses에 CANCELED 미포함** — 환불 후 payment 누락 수정(아래 닫힌 빚)에서 조회 상태집합을 `{PAID, REFUNDED}`로 확정. 현재 `CANCELED` 행은 결제 재시도로 버려진 실패행뿐(`markCanceled` 호출부 없음)이라 결제정보로 부적합해 제외. **향후 전액취소를 `markCanceled`로 구현하면**(성공행을 PAID→CANCELED로 전이) 그 "성공 후 취소행"이 결제정보로 표시돼야 하므로 statuses에 `CANCELED` 추가 검토 필요 | — | `OrderPaymentRepository.findFirstByOrderSeqAndPaymentStatusInOrderByPaymentSeqDesc` 호출부(`AdminOrderQueryService`·`OrderQueryService`)의 상태집합에 `CANCELED` 추가. 단 재시도 실패 `CANCELED`와 구분 필요(실패행은 여전히 배제해야 함) |

**현황(2026-07-21)**: **9건 열림 + 5건(#2·#7·#8·#12·결제조회 버그) 해결**. **실운영 배포 전 보안 점검(S-1~S-6) 코드 레벨 전부 완료**(`docs/security-audit.md`, 2커밋 `9bfa0da`·`eac5e7c`) — 배포 절차 O-1/O-2만 잔여. 우선순위별:
- **재평가 대상**: #9 격리 취약 — D-T2에서 재발(3번째)이라 **낮→中 승격 검토**(회피 누적 중, 근본 견고화 필요). (M7 후속 최우선 후보 — 사실상 최상위 잔여 실코드 빚)
- **낮**: #6 재고차감 응집.
- **스코프 이연(구현 부채 아님)**: **#1 쿠폰·포인트 사용/적립 생애주기 미구현**(재기술 — 빚 상환 아닌 신규 기능, 실운영 오픈 시 사용-측부터. `docs/return-refund-ledger-decisions.md`) · #3 EXCHANGE 재출고 · #4 회수비 설정화 · #5 취소사유 컬럼 · #10 EXCHANGE 차액 순매출(#3 연동) · #11 GA 유입 위젯(외부 연동 확정 후).
CS/D 관련 추가 미구현(CLOSED 흐름·재문의 되돌리기·답변 알림·GA 실연동)은 FR 근거 없어 빚 아님(범위 밖).
닫힌 빚: 계산기 null-guard(O-T1, V9 NOT NULL + fail-fast) ✅ · #12 관리자 목록 정렬 화이트리스트(`AdminUserService.sanitizeSort`) ✅ · **환불 후 주문 상세 결제정보 누락**(관리자·사용자 양측 실기능 버그 — 조회가 `payment_status="PAID"` 하드코딩이라 `markRefunded`로 REFUNDED 전이 시 결제행 못 찾아 null. `OrderPaymentRepository`에 `{PAID,REFUNDED}` 최신 1건 IN-필터 파생 쿼리 추가 → 두 조회부 교체. 결제 재시도로 인한 다중 결제행에도 `LIMIT 1`로 500 없음. 후속 조건은 빚 #13) ✅ · #2 **반품 동시 처리 과다환불**(주문단위 직렬화 부재 — 진짜 관문은 신청 수량검증 TOCTOU. `OrderRepository.findByOrderSeqForUpdate` 최초 락 도입, `create`·`finalizeRefund` 양쪽 주문 행 잠금. 재현 red Σ=2×finalAmount→green race 0/50) ✅ · #7 **잘못된 요청 500→400**(보안 S-3: malformed 바디·타입불일치·필수파라미터 누락 핸들러) ✅ · #8 **배너 URL 저장형 XSS**(보안 S-2: http/https 화이트리스트 + 내부 상대경로 허용·프로토콜상대/백슬래시 차단) ✅.
**보안 점검(2026-07-21)**: 실운영 배포 전 코드 레벨 S-1~S-6 전부 해결(`docs/security-audit.md`) — S-1 actuator 게이팅·S-2 배너 XSS(#8)·S-3 잘못된요청 400(#7)·S-4 swagger 심층방어·S-5 XFF 명시·S-6 local JWT(코드무관). 배포 절차 O-1(prod env 주입)·O-2(관리자 초기비번 회수)만 잔여. 高위험 0.

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

**M7 관리자 백오피스 8/8 모듈 완료 — 신규 모듈 없음.** 후속은 열린 빚(§4)뿐.

- **후속 최우선 후보**: §4 **中** — #1 환불 원장 정합(쿠폰·포인트 원장 반영) · #2 prior 동시성(반품 동시완료 직렬화). 둘 다 R 모듈 잔여이며 D와 무관.
- **테스트 위생**: #9 격리 취약이 D-T2에서 3번째 재발 → 근본 견고화(절대값 단언 제거) 우선순위 재평가 검토.
- **외부 연동 확정 대기**: #3 EXCHANGE 재출고(+#10 EXCHANGE 순매출 편입 연동) · #11 GA 유입 위젯.

**D. Dashboard — ✅ 완료**(`dc1e4b0`~`a800601`, 3 task). 결정·구현 정본 `docs/dashboard-decisions.md` + `docs/tasks-D-dashboard.md`. **매출 정의 정본(이 시스템의 매출 정의가 됨 — 기존 코드에 정의 부재였음)**:
- **총매출** = `Σ final_amount WHERE order_status ∈ {PAID,PREPARING,SHIPPING,DELIVERED,RETURNED}`(**CANCELED만 제외**), `order_date` 귀속.
- **순매출** = 총매출 − `Σ refund_amount WHERE return_type='RETURN' AND status='COMPLETED'`, `completed_date` 귀속. EXCHANGE(refund 0 실측)·CANCEL(총매출 제외)은 미차감 = 이중차감 회피.
- **순매출 음수 가능**(발생주의, 귀속 컬럼 상이) — **클램프 금지**(코드·응답·프론트 축 음수). 부분반품은 order_status 미변경이라 refund로만 차감.
- 타임존 = KST(`Asia/Seoul`) 반개구간 `[start,nextStart)`(`KstPeriods`). 인덱스 = V11(EXPLAIN 실측 근거: Seq Scan→Index/Bitmap). GA 유입 위젯 범위 제외(#11).
- 엔드포인트: `GET /api/v1/admin/dashboard/{summary,sales-trend}`. 집계 로직 `admin.dashboard.*`(도메인 역의존 없음).

향후 새 모듈이 생기면 동일하게 **결정 라운드(`*-decisions.md`) → task 분할(`tasks-*.md`) → 게이트(검증→커밋후보→승인)** 방식으로 진행.
