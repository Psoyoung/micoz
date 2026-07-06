# M7 CS. Customer Support (문의 응대) — Task 분할

> **기준 문서**: `docs/admin-overview.md` §1(CS)·§3(공통) / `docs/HANDOFF.md` §2(표준)·§7(확인사항)
> **대상 테이블**: `dat_inquiry`(문의·상태·답변완료일), `dat_inquiry_reply`(답변, append-only 정책) / 참조: `mst_user`(작성자·답변관리자)·`mst_product`·`dat_order`(문의가 참조 가능, nullable)
> **관련 FR**: FR-ADM-07(문의 목록·답변 등록, WAITING→ANSWERED) · FR-MY-04(사용자 측 답변 노출 — **이미 배선됨**, §4-④ 참조)
> **재사용 기반**: F(RBAC 게이팅·`@PreAuthorize`) · M/C(ApiResponse·PageResponse·Specification·정렬 화이트리스트·LIKE 이스케이프) · O/R(엔티티 전이 가드 표준 `changeStatus`+EnumMap) · **M6(사용자 측 문의 — `com.micoz.inquiry.*` 엔티티·리포지토리·서비스 이미 존재)**
> **상태**: **CS-Q 전 항목 확정(2026-07-06, §4)** → CS-T1 착수. (통합 테스트 러너 정합 확인 후 통합 검증 진행 — §6.)
>
> **경량 모듈**: 문의 목록·상세 + 답변 등록 + WAITING→ANSWERED 전이. 금액·재고·payment 없음. 상태머신 1전이 + append-only 답변이 유일한 위험면.

---

## 0. 엔드포인트 계약 (신규 — admin 응대)

모든 엔드포인트: `/api/v1/admin/**` URL 게이팅 + 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")` 2차 방어(F-T4 표준). 응답 봉투 `ApiResponse<T>`/`PageResponse<T>`. 감사 `u_user` 자동. **관리자는 전 회원 문의 대상**(사용자 측 `MyInquiryController` 본인-행 제약과 분리).

> **기존(M6, user)**: `POST /api/v1/me/inquiries`(등록), `GET /api/v1/me/inquiries`·`/{seq}`(본인 목록/상세 — 상세는 답변 `replies[]` 이미 노출). **admin 응대 = 없음(greenfield)** — 아래가 신규.

| # | 메서드·경로 | 액션 | 전이 | task |
|---|---|---|---|---|
| CA1 | `GET /api/v1/admin/inquiries` | 목록(검색·페이징) | — | CS-T2 |
| CA2 | `GET /api/v1/admin/inquiries/{inquirySeq}` | 상세(+답변 이력) | — | CS-T2 |
| CA3 | `POST /api/v1/admin/inquiries/{inquirySeq}/replies` | 답변 등록(다중 허용) | WAITING→ANSWERED (**최초 답변만**; 재답변은 상태·`answeredDate` 불변) | CS-T3 |

> **CLOSED 종료·재문의(되돌리기) 엔드포인트 없음(CS-Q③=(a) 2상태 확정)** — `CLOSED`는 스키마 잔재(§4·§5), enum 미포함.

**검색축(CA1)** — §3.1 도메인 권장(문의: `inquiryType`/`inquiryStatus`) + 확장:

| 파라미터 | 대상 | 규칙 |
|---|---|---|
| `q` | `title` | LIKE(이스케이프). 본문(`content`)까지 확대 여부는 CS-Q⑤ 비고 |
| `inquiryType` | `inquiry_type` | eq (PRODUCT/ORDER/DELIVERY/RETURN/ETC — M6 `ALLOWED_TYPES` 실측) |
| `inquiryStatus` | `inquiry_status` | eq (WAITING/ANSWERED[/CLOSED — CS-Q③]) |
| `userSeq` | `user_seq` | eq |
| `privateYn` | `private_yn` | eq (선택) |
| `dateFrom`/`dateTo` | `i_date`(문의 등록일 — 전용 일자컬럼 없음, 실측) | 범위(ISO-8601) |
| 정렬 | 화이트리스트 | `inquirySeq`(기본 desc)·`iDate`. 미허용 → 400 `COMMON_INVALID_REQUEST` |

> **소프트삭제 필터**: `use_yn='Y'`만 노출(M6 read 관례 답습). `dat_inquiry`는 `mst_*`가 아니지만 `use_yn` 실재(실측) → 기존 필터 유지.

### 0.1 신규 ErrorCode

| 코드 | HTTP | 용도 | task |
|---|---|---|---|
| `INQUIRY_TRANSITION_INVALID` | 409 | 문의 전이표 위반. `Inquiry.changeStatus` 단일 지점 throw. O/R의 `*_TRANSITION_INVALID`와 동형 | CS-T1 |

> 기존 `INQUIRY_NOT_FOUND`(404, M6) 재사용. 입력 검증은 Bean Validation → `COMMON_VALIDATION_ERROR`.
> **`INQUIRY_ALREADY_ANSWERED`(admin-overview §3.3 후보) 미채택** — CS-Q②=(a) 다중답변 허용 확정으로 재답변을 차단하지 않는다(append-only 정책과 정합). 오버뷰 후보 목록은 "후보"였을 뿐이라 신설하지 않음.

### 0.2 DTO (신규)

```
AdminInquirySearchCondition { q?, inquiryType?, inquiryStatus?, userSeq?, privateYn?, dateFrom?, dateTo? }   // CS-T2
AdminInquiryListItem        { inquirySeq, inquiryNo, userSeq, inquiryType, title, inquiryStatus,
                              privateYn, hasReply, createdDate, answeredDate }                               // CS-T2
AdminInquiryDetailResponse  { 문의 전체 + content + productSeq/orderSeq + replies[] + createdDate/answeredDate } // CS-T2
CreateReplyRequest          { content }   // @NotBlank (CS-Q⑤). admin_seq는 AdminPrincipal에서 주입(바디 아님) // CS-T3
```
- `@JsonInclude(NON_NULL)`. `replies[]`는 M6 `InquiryReplyDto`(replySeq/content/createdDate) 재사용 가능 — admin 상세엔 `adminSeq` 추가 여부 CS-T2에서 판단.

---

## 1. 의존성 그래프

```
M6(user 문의) [완료]
  ├─ Inquiry / InquiryReply 엔티티 · InquiryRepository / InquiryReplyRepository
  ├─ InquiryService.getDetail → replies[] 노출  ← ④ FR-MY-04 이미 배선(답변 생성만 하면 사용자에 노출)
  └─ Inquiry.markAnswered(when)  ← free-string setter (§2.1 위반, CS-T1에서 교체 대상)
        │
        ├── CS-T1  InquiryStatus 전이 골격         ← enum+EnumMap+Inquiry.changeStatus 가드.
        │            (markAnswered → changeStatus 교체)   markAnswered 제거·재배선. [수동리뷰: 상태머신+공유엔티티]
        │            │
        │            ▼
        └── CS-T2  admin 조회 (T1 독립, 병렬 가능)  ← InquirySpecs + AdminInquiryQueryService + Controller GET.
                     │                                 [저위험 — 패턴 답습, 자동커밋]
                     ▼
                 CS-T3  답변 등록 + 전이 트리거        ← InquiryReply factory 신설 + reply append +
                                                        Inquiry.changeStatus(ANSWERED) 원자. append-only 강제.
                                                        [수동리뷰: append-only 정책 + 상태 트리거]
```
- **CS-T1은 M6 코드 수정** — `markAnswered` 교체가 사용자 측 엔티티 표면 변경. 회귀(M6 문의 라이프사이클) 안전판 필요.
- CS-T2는 T1과 독립(조회만) → 병렬 가능하나, 문서 순서는 T1→T2→T3.
- CS-T3은 CS-T1(changeStatus)·CS-T2(상세 재사용) 전제. 이 task가 ④ 사용자 노출을 실제로 켜는 지점.

---

## 2. Task 분할

### CS-T1 — InquiryStatus 전이 골격 (O/R 답습) · **[수동리뷰 필수]**

> **[수동리뷰 필수]** 근거: 상태머신 + **사용자 측(M6) 공유 엔티티 수정**(`Inquiry.markAnswered` 교체). 하류(CS-T3) 전이의 기반.

**범위**
- `InquiryStatus` enum + `EnumMap ALLOWED` 전이표 + `Inquiry.changeStatus(InquiryStatus)` 엔티티 가드(위반 시 `INQUIRY_TRANSITION_INVALID`). `ReturnStatus`(정본) 골격 복제.
- **기존 `Inquiry.markAnswered(OffsetDateTime)` 교체** — `changeStatus(ANSWERED)` + `answeredDate` 세팅을 가드 경유로. **free-string 상태 대입 제거**(§2.1).
- 전이표(**확정 — CS-Q②-a·③-a**): `WAITING→{ANSWERED}` · `ANSWERED→{}`(종결). **단일 전이·2상태**. 재답변은 상태 전이가 아니므로 전이표에 없음(CS-T3에서 `changeStatus` 미호출 분기). `CLOSED`·되돌리기 미포함(스키마 잔재).
- `String→enum` 파싱 방어(`from(raw)`, 미지값 → `INQUIRY_TRANSITION_INVALID`).

**완료 기준**
- 단위(**전수 테스트 — O/R 답습 표준**): 허용 전이 전부 통과 + 비허용 전부 `INQUIRY_TRANSITION_INVALID`(각 from×to) + 종결상태 무순환 + 파싱 방어.
- 통합(**회귀 — M6**): 기존 M6 문의 테스트(등록·조회·상세 replies) 그대로 green — `markAnswered` 교체가 사용자 동작을 1도 안 바꿈 증명.
- `./gradlew build`(Docker) green — inquiry/admin 전 스위트.
- (엔드포인트는 CS-T3 — 여기선 enum/엔티티 단위 중심.)

**의존성**: F(완료)·M6(완료). CS-Q②③ 확정. **위험도**: **중** — 상태머신+공유엔티티. 전수+M6 회귀가 안전판. **[수동리뷰 필수]**.

---

### CS-T2 — admin 조회 (목록·상세) · **저위험(자동커밋)**

> **저위험** 근거: 순수 read. 검색·조회 패턴(M/C/O/R) 답습. 상태·금액 변경 없음 → 검증 통과 시 승인 없이 단독 커밋.

**범위**
- `AdminInquiryController`(`GET /api/v1/admin/inquiries`, `/{inquirySeq}`) + `AdminInquiryQueryService`(목록·상세) + `InquirySpecs` + DTO(§0.2).
- `InquirySpecs`: `OrderSpecs`/`ReturnSpecs` 답습 — **전부 null-safe**(값 없으면 predicate null→`.and` 무시) + **LIKE 메타문자 이스케이프**(`\ % _`) + **정렬 화이트리스트**(`sanitizeSort`, API키→엔티티속성, 미허용 400 `COMMON_INVALID_REQUEST`). `InquiryRepository`에 `JpaSpecificationExecutor<Inquiry>` 추가.
- 상세: 문의 + `replies[]`(M6 `findActiveByInquirySeq` 재사용, `use_yn='Y'` 순). N+1 방지(페이지 조회 후 필요 시 답변 배치/상세 단건).
- **관리자 = 전 회원 대상**(user_seq 제약 없음). `private_yn='Y'`도 관리자에겐 노출(운영 응대 필요 — CS-Q 비고).

**완료 기준**
- 단위: `InquirySpecs`(null 무시·LIKE 이스케이프·정렬 화이트리스트 미허용 400).
- 통합(실 HTTP): 다축 검색(type/status/userSeq/기간)·정렬 화이트리스트(400)·부재 404(`INQUIRY_NOT_FOUND`)·상세 replies 노출·비공개 문의 관리자 노출·N+1 없음.
- `./gradlew build` green.

**의존성**: F·M6·(DTO는 §0.2). CS-T1 불요(독립). **위험도**: **저** — 조회 전용. **자동커밋**.

---

### CS-T3 — 답변 등록 + WAITING→ANSWERED 트리거 · **[수동리뷰 필수]**

> **[수동리뷰 필수]** 근거: **append-only 정책 강제** + **상태 트리거**. 금액은 없으나, 잘못된 mutator를 열면 §3.4 append-only가 무너지고 ④ 사용자 노출이 오염됨. 재답변·되돌리기(CS-Q②③) 정책이 이 task에 응축.

**범위**
- `InquiryReply` **factory/builder 신설**(현재 read-only, 생성자 없음 — 실측) — `content`·`adminSeq`·`inquirySeq`·`useYn='Y'`. **update/soft-delete mutator는 열지 않음**(§3.4 append-only를 코드로 강제 — 스키마엔 `use_yn`·`u_user/u_date`가 있으나 정책상 미사용).
- `AdminInquiryService.reply(inquirySeq, adminSeq, CreateReplyRequest)` — **단일 `@Transactional`**:
  1. 문의 조회(없으면 `INQUIRY_NOT_FOUND`).
  2. **재답변: 다중답변 허용(CS-Q②-a 확정)** — 차단 없음. 이미 ANSWERED여도 append.
  3. `InquiryReplyRepository.save`(append).
  4. 상태·`answeredDate` 처리: **WAITING일 때만** `Inquiry.changeStatus(ANSWERED)`(CS-T1 가드) + `answeredDate`=현재시각(최초 답변). **이미 ANSWERED면 `changeStatus` 미호출·`answeredDate` 불변**(최초값 고정) — 답변만 append. 근거: `answeredDate`="답변 완료 시점"이라 최초가 정답이고, 재답변 시 갱신하면 **D 대시보드 응답시간/SLA 집계가 흔들림**(D가 다음 모듈이라 곧 소비).
- `CreateReplyRequest.content` `@NotBlank`(+ 길이 상한 CS-Q⑤).
- **④ 배선 확인**: 답변 저장(`use_yn='Y'`) 즉시 M6 `InquiryService.getDetail`의 `replies[]`·`hasReply`에 노출 — **사용자 측 신규 코드 0**(read 경로 이미 존재, 실측).

**완료 기준**
- 단위: reply factory(필드 정확·useYn 기본 Y), append-only(update/delete mutator 부재 컴파일 보장).
- 통합(실 HTTP, 라이프사이클): WAITING 문의 → 답변 등록 → **ANSWERED 전이 + answeredDate 기록 + reply append** → **사용자 상세(M6 `/me/inquiries/{seq}`)에서 답변 노출**(④ 왕복 증명) + 목록 `hasReply=true`.
  - **재답변(CS-Q②-a)**: 2번째 답변 append + 상태 ANSWERED 유지 + **`answeredDate` 불변**(최초 전이 시각 == 재답변 후 값) 단언. 차단 없음.
  - 부재: 없는 문의 답변 → 404 `INQUIRY_NOT_FOUND`.
  - 감사: `dat_inquiry.u_user`=관리자, `dat_inquiry_reply.i_user`=관리자(AuditorAware 자동, §3.5).
- `./gradlew build` green. 실제 요청: compose E2E로 등록→답변→사용자노출 왕복.

**의존성**: CS-T1(changeStatus)·CS-T2(상세 재사용). CS-Q 전 항목 확정. **위험도**: **중** — append-only·상태 트리거·사용자 노출. 라이프사이클+재답변(answeredDate 불변) 통합이 안전판. **[수동리뷰 필수]**.

---

## 3. 진행 방식 · 리뷰 제안

- **CS-Q(§4) 전 항목 확정(2026-07-06)** — 착수 가능. CS-T2(조회)는 CS-Q 무관하게 진행 가능.
- **통합 테스트 러너 선결(§6)**: CS-T1의 "M6 회귀"·CS-T3의 "사용자 노출 왕복"은 실 HTTP 통합이 필수 → 러너 정합 확인 후 진행. CS-T1 **단위/컴파일 부분까지 하고, 통합 필요 지점 전에 멈춰** 러너 상태 확인.
- **CS-T1·CS-T3 [수동리뷰 필수]** / **CS-T2 저위험 자동커밋**(검증 통과 시). 각 [수동리뷰] task는 검증 통과 후 커밋 전 멈춰 **검증결과+커밋 후보** 제시하고 승인 대기.
  - CS-T1: 전이표 전수 테스트 + **M6 회귀 green**(markAnswered 교체가 사용자 동작 불변).
  - CS-T3: 등록→답변→**사용자 노출 왕복**(④) + 재답변 정책(CS-Q②) 결과.
- 커밋: Conventional Commits, 제목 한국어, Co-Authored-By 트레일러. CS 완료 후 **통합 검토 요약**(빚·D 진입점: 문의 KPI 집계).
- push는 별도 명시 승인 전까지 금지.

---

## 4. 확정 결정 (CS-Q) — 2026-07-06

> HANDOFF §7 ①~⑤를 실측 근거로 확정. 각 항목 **서술 아님·실제 스키마/코드로 확인**(HANDOFF §3 실측 우선). 이 표가 CS의 결정 정본(별도 `cs-decisions.md` 미생성 — 경량 모듈, 본 표로 갈음).

| # | 항목 | **확정** | 실측 근거 · 반영 위치 |
|---|---|---|---|
| **CS-Q①** | 답변 append-only 구조 | **(a) 정책으로 append-only 강제** — 생성 factory만 열고 update/soft-delete mutator 미개방(정정=새 답변) | **스키마 실측**: `dat_inquiry_reply`에 `use_yn`·`u_user`/`u_date` 실재(엔티티 `extends BaseEntity`). 즉 스키마·엔티티는 append-only가 **아니며**, append-only는 **정책**(§3.4). use_yn/u_*는 미사용(BaseEntity 상속 부작용). → **CS-T3**(factory 신설, mutator 미개방) |
| **CS-Q②** | 재답변 허용 / `answeredDate` | **(a) 다중답변 허용**(차단 없음). **단, `answeredDate`는 최초값 고정** — 재답변해도 갱신 안 함 | `Inquiry.markAnswered`가 상태·answeredDate 세팅(실측). `INQUIRY_ALREADY_ANSWERED`(§3.3 후보)는 append-only와 상충 → 미채택. **불변 근거**: `answeredDate`="답변 완료 시점"이라 최초가 정답, 갱신 시 **D 대시보드 응답시간/SLA 집계 흔들림**. → **CS-T3** step4 + 완료기준 "재답변 시 answeredDate 불변" 단언 |
| **CS-Q③** | CLOSED / 되돌리기 | **(a) 2상태만**(WAITING↔ANSWERED만; `CLOSED` enum 미포함, 되돌리기 미지원) | **스키마 실측 발견**: `inquiry_status` 주석=`WAITING/ANSWERED/CLOSED` 3상태(HANDOFF·overview는 2상태만 — **문서-스키마 불일치**). CLOSED는 **정의만·미사용, FR 근거 없음 → 스키마 잔재**로 명시. §0 CA4(PATCH /close) **제거**. → **CS-T1** 전이표 2상태 |
| **CS-Q④** | 사용자 답변 노출 | **(a) 기존 read 경로 그대로**(사용자 측 신규 코드 0). `adminSeq`는 사용자에 미노출 | **실측: 이미 배선됨** — `InquiryService.getDetail`이 `replies[]`(content/createdDate) 반환, 목록 `hasReply=ANSWERED`. 관리자가 답변 생성(use_yn='Y')+ANSWERED 전이만 하면 자동 노출. 운영자 정보 비노출(§3.5) 유지. → **CS-T3** 통합테스트 왕복 증명 |
| **CS-Q⑤** | 답변 필수 필드 | **(a) `content` `@NotBlank` + 길이 상한**. `adminSeq`는 AdminPrincipal 주입(바디 아님) | NOT NULL 실측: `inquiry_seq`·`admin_seq`·`content`. TEXT지만 과도입력 방지 상한. → **CS-T3** `CreateReplyRequest` |

> **부가 실측 발견(확정 반영)**:
> - `Inquiry.markAnswered`는 **free-string 상태 대입**(§2.1 `transitTo(String)` 금지 위반) → CS-T1에서 `changeStatus`로 교체(공유 엔티티 수정 = [수동리뷰], M6 회귀가 안전판).
> - `inquiry_no` unique index는 `WHERE use_yn='Y'`(부분 유니크, 실측) — 조회/생성 영향 없음.
> - `private_yn`: 관리자 응대는 전 회원·비공개 포함 열람 → **CS-T2에서 필터 제외(노출)**로 확정.

---

## 5. 실측 요약 (정본 경로 — 서술 아닌 실제 코드/스키마)

| 항목 | 정본 | 실측 사실 |
|---|---|---|
| 문의 스키마 | `db/migration/V1__baseline_schema.sql:735` | `dat_inquiry`: status DEFAULT WAITING, `answered_date`, `use_yn`, 전체 audit. **status 주석 3상태(WAITING/ANSWERED/CLOSED)** |
| 답변 스키마 | `V1:773` | `dat_inquiry_reply`: `admin_seq`·`content` NOT NULL, **`use_yn`+`u_user`/`u_date` 실재**(append-only는 정책) |
| 문의 엔티티 | `inquiry/entity/Inquiry.java` | `extends BaseEntity`, `markAnswered()` free-string setter(교체 대상) |
| 답변 엔티티 | `inquiry/entity/InquiryReply.java` | `extends BaseEntity`, **factory 없음**(read-only) — CS-T3에서 생성 factory 신설 |
| 사용자 서비스 | `inquiry/service/InquiryService.java` | `getDetail`이 `replies[]` 노출(④ 배선), `ALLOWED_TYPES`=PRODUCT/ORDER/DELIVERY/RETURN/ETC |
| 리포지토리 | `inquiry/repository/*` | `findActiveByInquirySeq`(use_yn='Y'), `JpaSpecificationExecutor` 미도입(CS-T2에서 추가) |
| ErrorCode | `common/response/ErrorCode.java:65` | `INQUIRY_NOT_FOUND`(404)만 존재 — 전이/중복답변 코드 신규 |
| 전이 가드 정본 | `returns/entity/ReturnStatus.java` | enum+EnumMap+`from(raw)`+`canTransitionTo` — CS-T1 복제 골격 |
| 검색 정본 | `admin/returns/spec/ReturnSpecs.java`·`AdminReturnQueryService`(sanitizeSort) | CS-T2 `InquirySpecs` 답습 |

---

## 6. 통합 테스트 러너 정합 (2026-07-06)

> **결론(데몬 기동 후 실측)**: 이번 세션에 뜬 데몬은 **Docker 24.0.7 / API 1.43 / MinAPIVersion 1.12**(`docker version` 실측). docker-java 3.3.6 기본 ping **1.32 ≥ 1.12**라 **버전 미스매치 블로커 미적용** → **`docker-java.properties` 불필요, 파일 미생성**. 전체 통합 스위트 **33 스위트/229 테스트/실패 0**으로 정상 기동·통과. 아래 6.1은 v29/min 1.40+ 데몬에서 재발 시의 조사 기록(조건부).

### 6.1 v29/min 1.40+ 데몬 재발 시 (조건부 — 현재 미적용)

**증상**: `client version 1.32 is too old. Minimum supported API version is 1.40, ...`.

**실측 사실**
| 항목 | 값 | 출처 |
|---|---|---|
| Testcontainers 핀 | `1.19.8` (`postgresql`·`junit-jupiter`) | `build.gradle:54-55` |
| 번들 docker-java | **3.3.6** (`api`·`transport`·`transport-zerodep`) | gradle 캐시 실측 |
| 테스트 연결 방식 | **Testcontainers JDBC-URL 모드** `jdbc:tc:postgresql:15-alpine:///micoz_test` + `ContainerDatabaseDriver` | `src/test/resources/application-test.yml:3-4` |
| API 버전 오버라이드 | **없음**(repo·CI·compose 어디에도 `DOCKER_API_VERSION`/`api.version` 부재) | 전역 grep |
| 로컬 Docker(실측) | **24.0.7 / API 1.43 / MinAPI 1.12** — 이 데몬은 1.32 ping 수용(블로커 미적용) | `docker version` |

**근본 원인**: docker-java 3.3.6의 **기본 ping API 버전이 1.32**로 고정 → Docker Engine 29(min API 1.40, 커뮤니티 이슈상 일부 환경 1.44/1.52)가 "client 1.32 too old"로 거절. 컨테이너 기동이 이 ping을 통과 못 해 **전 통합 스위트가 시작 자체를 못 함**. 단위/컴파일(Docker 불요)은 영향 없음.

**핵심 제약**: Testcontainers **major 업그레이드는 깨끗한 해법이 아님** — 이슈 #11210에서 **2.0.1도 여전히 docker-java 기본 1.32**로 동일 실패. 기본값 수정(PR #11216)은 그 이후 릴리스. 2.x는 major(호환성 리스크) + 확실치 않음.

**수정 후보**(승인 후 별도 진행 — 지금 미적용)
| # | 방법 | 변경 | 리스크 |
|---|---|---|---|
| **A (권장)** | `src/test/resources/docker-java.properties`에 `api.version=1.40`(서버 min 실측치로) | 파일 1개 추가, 의존성 불변 | **낮음** — docker-java-core가 읽는 표준 설정. TC 버전 무관 |
| B | 테스트 실행에 `DOCKER_API_VERSION=1.40` 환경변수(gradle test task / CI) | env only | 낮음 — 러너별 주입 필요(누락 취약) |
| C | Testcontainers 상향 핀 | build.gradle + 회귀 | **중~고** — 2.0.1도 미해결이라 검증 필요, major |

**해결(2026-07-06)**: 데몬 기동 후 `docker version` 실측 = **MinAPI 1.12** → 1.32 ping 수용, A안 불필요. 만약 이후 v29/min 1.40+ 데몬으로 바뀌어 재발하면 A안(`docker-java.properties`에 `api.version=<실측 min>`)을 적용한다(값은 그때 재실측).
