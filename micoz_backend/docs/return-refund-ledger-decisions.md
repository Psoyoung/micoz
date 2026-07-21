# 빚 #1 — 환불 원장 정합 (쿠폰·포인트) 결정 라운드

> **이 문서는 실측(§1) + 결정 넘길 항목(§2, 질문만)까지만.** 결정·구현은 리뷰 후.
> 원칙: **문서 서술과 코드가 다르면 코드가 정본**(실측 우선). 아래 §1은 전부 실제 코드/스키마에서 확인한 사실.
> 측정일 2026-07-21. 대상 커밋 `2ca3bc6`(빚 #2 해결 직후).

---

## ⚠️ 머리말 — 빚 #1의 전제가 코드와 다름 (실측으로 정정)

HANDOFF §4 #1의 서술은 **"쿠폰으로 할인받은 주문을 환불해도 쿠폰이 복원 안 됨 / 포인트로 결제한 부분이 환원 안 됨"** 이다. 이는 "주문이 쿠폰·포인트를 **소비**한다"를 전제로 한다.

**그러나 실측 결과, 현재 주문 흐름은 쿠폰·포인트를 소비하지도 적립하지도 않는다.**
- 주문 생성 시 `couponDiscount`·`pointUsed`가 **항상 0으로 하드코딩**된다(§1.3).
- 쿠폰을 `USED`로 표시하는 코드가 **어디에도 없다**(§1.2).
- 주문/결제 시 포인트 `USE` 이력이나 잔액 차감이 **없다**(§1.4).
- 적립 예정 포인트(`pointToEarn`)를 실제 적립(`EARN` 이력·잔액 증가)하는 코드가 **없다**(§1.5).
- 반품 완료가 `map_user_coupon`·`his_point`를 **전혀 건드리지 않는다**(§1.6).

**따라서 빚 #1의 실제 성격은 "환불 시 원장 복원 누락"이 아니라, "주문 측 쿠폰·포인트 사용/적립 생애주기 자체가 미구현"이다.** 쓴 적이 없으니 되돌릴 것도 없다. 환불-복원은 사용-측 구현의 하류(下流)이며, 사용-측이 없으면 성립하지 않는다. 이 사실이 결정 라운드의 성격을 근본적으로 바꾼다(§2 Q1이 관문).

---

## §1. 실측 — 현재 상태 (사실만)

### 1.1 스키마 (V1 baseline)

**`map_user_coupon`** (발급 쿠폰) — 컬럼:
| 컬럼 | 의미 |
|---|---|
| `coupon_status` | `AVAILABLE`(사용가능)/`USED`(사용완료)/`EXPIRED`(만료). default `AVAILABLE` |
| `used_date` | 사용 일시 (**nullable, 현재 아무도 안 씀**) |
| `order_seq` | 사용한 주문 (**nullable, 현재 아무도 안 씀**) |
| `use_yn` | `Y/N` 소프트삭제. default `Y` |
| `expire_date` | 만료 일시 |

→ **스키마는 "쿠폰이 주문에 사용됨"을 기록할 자리(`coupon_status=USED`, `used_date`, `order_seq`)를 이미 마련했으나, 그 자리를 채우는 코드가 없다.**

**`his_point`** (포인트 적립/사용 이력, append-only) — 컬럼:
| 컬럼 | 의미 |
|---|---|
| `point_type` | `EARN`(적립)/`USE`(사용)/`EXPIRE`(소멸)/**`CANCEL`(취소환원)** |
| `point_amount` | 변동량 (적립=양수, 사용=음수) |
| `balance_after` | 변동 후 잔액 (스냅샷) |
| `order_seq` | 연관 주문 (nullable) |
| `expire_date` | 소멸 예정 일시 (적립분) |
| `use_yn` | `Y/N` 소프트삭제 |

→ **스키마에 `CANCEL`(취소환원) 타입이 이미 정의**돼 있다 — 반품 시 포인트 환원을 염두에 둔 흔적. 하지만 현재 `CANCEL` 타입을 쓰는 코드는 없다.
→ 실제 포인트 **잔액**은 `mst_user.point_balance`(INTEGER, 비정규화)에 저장. `his_point`는 이력(원장). 둘의 정합은 `adjustPoint`가 한 트랜잭션에서 함께 갱신(§1.7).

### 1.2 쿠폰: 주문에서 사용되지 않음
- `UserCouponRepository`는 **조회 메서드 2개뿐**(`findAllByUserSeqAndUseYn`, `findAllByUserSeqAndCouponStatusAndUseYn`). **변경(save/status update) 메서드 없음.**
- `couponStatus`를 `USED`로 바꾸거나 `use_yn`을 내리는 코드가 **전 코드베이스에 없음**(grep 확인: `couponStatus` 쓰기 0건, 조회·DTO 매핑만).
- 쿠폰 사용 UI/서비스(`promotion.*`)는 **발급 쿠폰 조회 전용**(`CouponQueryService`, `MyCouponController`).

### 1.3 주문 생성: 쿠폰/포인트 입력 자체가 없음
- `CreateOrderRequest`에 **쿠폰/포인트 필드가 없다**(cartSeqs·주소·isRemote·clientAmount만). 주문 API가 쿠폰/포인트 입력을 **받지 않는다.**
- `OrderService.create`([L112-114](../src/main/java/com/micoz/order/service/OrderService.java#L112)): 계산기에 `couponDiscount=BigDecimal.ZERO, pointUsed=0`을 **하드코딩** 전달.
- 주문 저장([L131-132](../src/main/java/com/micoz/order/service/OrderService.java#L131)): `couponDiscount(BigDecimal.ZERO)`, `pointUsed(0)`으로 **항상 0 저장.**
- `OrderAmountCalculator`는 `couponDiscount`·`pointUsed` 파라미터를 **지원**(총할인=쿠폰+포인트, itemsAfterDis에서 차감)하지만, 주문 흐름이 항상 0을 넘겨 **실효 없음.**

### 1.4 결제(PaymentService): 포인트 사용/적립 없음
- `PaymentService.pay`(이미 실측): PG 승인 → 재고 차감 → payment 저장 → order PAID → 카트 정리. **포인트 차감/적립·쿠폰 처리 없음.** `his_point`/`map_user_coupon` 미접근.

### 1.5 적립 예정 포인트: 계산만 되고 실제 적립은 없음
- `pointToEarn = floor(itemsAfterDis × gradePointRate / 100)`([OrderAmountCalculator L60-63](../src/main/java/com/micoz/order/calculator/OrderAmountCalculator.java#L60))로 계산되어 `dat_order.point_to_earn`에 **저장(projection)**.
- 그러나 이 값을 실제로 **적립**(`his_point` EARN 기록 + `point_balance` 증가)하는 코드가 **없다.** 주문 시점도, 결제(PAID) 시점도, 배송완료(DELIVERED) 시점도 아님 — **아예 적립 실현 지점이 없음.**
- 즉 "언제 적립되는가"라는 질문(사용자 §질문3)의 실측 답: **현재 코드에선 적립되지 않는다.** `point_to_earn`은 "적립될 예정 금액"의 표시일 뿐 실현 안 됨.

### 1.6 반품 완료(finalizeRefund / complete): 원장 미접근
- `ReturnRefundService.finalizeRefund`가 하는 것: `dat_return.refund_amount` 확정 + `INSPECTED→COMPLETED` 전이. **끝.**
- `AdminReturnService.complete`가 추가로: payment `REFUNDED`, order 상태 종결(CANCELED/RETURNED), 재고 복원. **끝.**
- **`map_user_coupon`·`his_point`·`point_balance` 어디도 안 건드림.** `ReturnRefundCalculator` 주석([L18](../src/main/java/com/micoz/returns/calculator/ReturnRefundCalculator.java#L18))이 명시: *"포인트 원장 환원은 이번 범위 밖(빚)"*.
- **어디까지 하고 어디부터 안 하나**(사용자 §질문2): refund_amount 산정·payment·order·재고까지 원자 처리 O / 쿠폰·포인트 원장은 **손도 안 댐** X.

### 1.7 유일한 원장 작성자 = 관리자 수동 조정 (참고 패턴)
- `his_point` 기록 + `point_balance` 갱신을 하는 **유일한** 코드: `AdminMemberService.adjustPoint`([L224-252](../src/main/java/com/micoz/admin/member/service/AdminMemberService.java#L224), M-T5 "참고용").
- 패턴: 단일 `@Transactional` read-modify-write — 현재 잔액 read → `projected = current + amount` → 음수면 `POINT_INSUFFICIENT` 롤백 → INT 상한 체크 → `his_point`(append-only) 기록 + `member.changePointBalance(balanceAfter)` 원자 갱신.
- `point_type`은 `amount>0?"EARN":"USE"`. **`CANCEL` 타입은 미사용**(스키마엔 정의됨).
- → **원장 반영이 필요하면 이 패턴이 유일한 선례**(주문/반품 경로엔 원장 코드 자체가 없음).

### 1.8 부분 반품 안분 (사용자 §질문4)
- `refund_amount`(현금)는 부분 반품 시 **비례 안분**됨(`ReturnRefundCalculator`의 누적 안분 불변식, 빚 #2 진단서 참조).
- 그러나 쿠폰·포인트는 **주문에서 소비되지 않으므로**(§1.2~1.4) 반품 시 안분할 대상 자체가 없다. → **부분 안분 질문은 사용-측이 구현된 뒤에야 의미를 가진다**(현재는 공집합).

---

## §2. 결정 넘길 항목 (질문만 — 아직 결정 X)

> Q1이 **관문**이다. Q1 답에 따라 Q2~Q6의 존재 여부·범위가 달라진다.

### Q1. (관문) 빚 #1의 범위 재정의 — 무엇을 닫는가?
현재 쿠폰·포인트는 주문에서 **소비·적립되지 않는다**(§1). 그렇다면 빚 #1은:
- **(a) 전체 생애주기 구현** — 주문 시 쿠폰 사용(USED 표시)·포인트 사용(USE+잔액차감)·적립 실현(EARN)까지 만들고, 그 위에 환불-복원을 얹는다. (범위 큼, M1~M6 주문 흐름 수정 포함)
- **(b) 환불-복원만 선구현** — 사용-측은 별도 빚으로 두고, "사용됐다면 복원한다"는 골격만(현재는 항상 0이라 실효 없음, 미래 대비). (반쪽 — 실효 없는 코드가 됨)
- **(c) 전면 이연** — 사용-측 미구현이 근본이므로, 쿠폰/포인트 사용 기능(주문 흐름)이 구현될 때 그 PR에서 환불-복원까지 함께 설계. 빚 #1은 "사용-측 미구현"으로 재기술하고 지금은 코드 변경 없음.
- **판단 근거 질문**: PRD/기획상 쿠폰·포인트 사용이 M7 이후 로드맵에 있는가? 실운영 오픈 시점에 쿠폰/포인트 사용을 켤 것인가? (이 답이 a/b/c를 가른다)

> **Q1이 (c)면 Q2~Q6는 그 시점으로 이연**된다. (a)/(b)면 아래를 결정.

### Q2. 쿠폰 복원
- 일회용 쿠폰을 반품 시 되살릴지(`USED→AVAILABLE`, `order_seq`/`used_date` 초기화)?
- 되살리면 재사용 방지·만료 처리는? (이미 `expire_date` 지난 쿠폰을 되살리면 즉시 만료 처리? 되살리지 않음?)
- **부분 반품 시**: 쿠폰은 보통 안 쪼개진다. 부분만 반품해도 쿠폰 전체를 복원? 아니면 전량 반품 시에만 복원? (부분이면 복원 안 함이 자연스러운가?)

### Q3. 포인트 사용분 환원
- 포인트로 낸 부분(`point_used`)을 환불 시 포인트로 돌려줄지?
- 돌려주는 방식: 원래 사용분을 **복원**(사용 취소) vs **신규 적립**(CANCEL 타입 +금액)? — 스키마의 `point_type='CANCEL'`(취소환원)이 이를 위한 자리로 보임.
- 반영 대상: `his_point` 기록 + `mst_user.point_balance` 증가 (§1.7 `adjustPoint` 패턴 재사용?).

### Q4. 적립 (예정/실현) 포인트 회수
- 전제: 현재 적립 실현 자체가 없음(§1.5). 적립을 구현한다면 **적립 시점**(결제 시 vs 배송완료 시)이 회수 정책을 좌우.
- 반품 시 그 주문으로 적립된(또는 적립 예정) 포인트를 회수할지?
- **이미 그 적립 포인트를 다른 주문에 써버렸으면?** 회수 시 잔액이 음수가 될 수 있음 — 음수 허용? `POINT_INSUFFICIENT`처럼 막음? (`adjustPoint`는 음수 잔액을 막는데, 회수는 막으면 안 될 수도 — 정책 충돌 지점)

### Q5. 부분 반품의 쿠폰/포인트 안분
- 쿠폰(불가분) vs 포인트(가분)를 부분 반품에서 어떻게? 포인트는 refund_amount처럼 비례 안분? 쿠폰은 전량 반품 시에만 복원(Q2 연동)?
- refund_amount의 누적 안분 불변식(빚 #2)과 정합되게 설계해야 하는가?

### Q6. 원장 반영의 기술적 패턴·동시성
- `adjustPoint`의 read-modify-write 패턴(§1.7)을 반품 완료 트랜잭션에 합류시킬지? (`his_point` append + `point_balance` 갱신 원자화)
- 쿠폰 복원도 같은 트랜잭션(`AdminReturnService.complete`)에 원자 포함? (환불·payment·재고·원장을 한 트랜잭션으로)
- **동시성**: 빚 #2에서 도입한 주문 행 비관적 락(`findByOrderSeqForUpdate`)이 이미 `finalizeRefund`에 걸려 있음 → 원장 반영을 같은 트랜잭션에 넣으면 주문 단위 직렬화가 자동 상속되나, 포인트 **잔액**은 사용자(`mst_user`) 단위라 다른 주문의 동시 반품이 같은 사용자 잔액을 경합할 수 있음 → 사용자 행 락 필요 여부 검토.

---

## §3. 다음 단계
1. 위 §1(실측)·§2(질문) 리뷰.
2. **Q1(관문) 먼저 확정** — 범위 (a)/(b)/(c).
3. Q1이 (a)/(b)면 Q2~Q6 결정 라운드 진행 후 task 분할. (c)면 빚 #1을 "쿠폰/포인트 사용-측 미구현"으로 HANDOFF 재기술하고 이연.
