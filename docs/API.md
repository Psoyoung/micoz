# MICOZ 관리자 백오피스 API

> **범위**: 이 문서는 **M7 관리자 백오피스(`/api/v1/admin/*`) API 전용**이다. 사용자 측 쇼핑몰 API(`/api/v1/*` — 회원가입·장바구니·주문·마이페이지 등)는 **별도 범위**로 이 문서에 포함하지 않는다.
>
> 모든 내용은 실제 컨트롤러·DTO·`ErrorCode`·enum에서 실측했다. 불확실한 항목은 "확인 필요"로 표시한다.
> 대상: 50개 엔드포인트 / 12개 컨트롤러 (F 인증·M 회원·C 카탈로그·S 설정·O 주문·R 반품·CS 문의·D 대시보드).

---

## 1. 공통 규약 (먼저 읽어주세요)

### 1.1 인증 (JWT Bearer)

관리자 API는 **로그인 1개를 제외한 전부 ADMIN 권한 토큰이 필수**다(`SecurityConfig`: `/api/v1/admin/**` → `hasRole('ADMIN')`, 단 `POST /api/v1/admin/auth/login`만 `permitAll`).

**흐름**:
1. `POST /api/v1/admin/auth/login` 에 `{ userId, userPw }` 전송 → 성공 시 `data`로 토큰 세트 수신.
   ```json
   {
     "code": "SUCCESS",
     "message": "요청 처리 완료",
     "data": {
       "accessToken": "eyJhbGciOi...",
       "refreshToken": "eyJhbGciOi...",
       "tokenType": "Bearer",
       "accessTokenExpiresIn": 1800
     }
   }
   ```
   - `accessTokenExpiresIn` = access token 유효기간(**초**). 설정 기본 30분(=1800). refresh token 기본 14일.
   - `role != ADMIN` 계정으로 로그인 시도 → 사용자 로그인과 **동일 응답으로 거부**(계정 존재 노출 방지).
2. 이후 모든 관리자 요청 헤더에 넣는다: `Authorization: Bearer {accessToken}`

**토큰 만료/누락/위조 시 동작**:
- 보호된 엔드포인트에 **토큰이 없거나 만료·위조**된 경우 → **HTTP 401** + 아래 봉투(코드는 항상 `AUTH_UNAUTHORIZED`로 통일. 만료여도 `AUTH_TOKEN_EXPIRED`가 클라이언트로 나가지 않음 — 내부 코드).
  ```json
  { "code": "AUTH_UNAUTHORIZED", "message": "인증이 필요합니다.", "data": null }
  ```
- 유효한 토큰이지만 **ADMIN이 아닌** 경우(예: CUSTOMER 토큰) → **HTTP 403**
  ```json
  { "code": "AUTH_FORBIDDEN", "message": "접근 권한이 없습니다.", "data": null }
  ```
- **클라이언트 처리 권장**: 401 수신 시 아래 refresh로 조용히 재발급 시도 → refresh도 실패면 로그인 화면으로.

> **📎 참고 — 토큰 갱신(refresh)**: 이 엔드포인트는 **사용자 측 공용 인증(`/api/v1/auth/*`) 소관이며 관리자도 동일하게 사용**한다(관리자 전용 refresh 없음). access token은 30분마다 만료되므로, 매번 로그인 튕기지 않으려면 프론트가 refresh로 조용히 재발급받아야 한다(실무상 필수).
> - **요청**: `POST /api/v1/auth/refresh`, 바디 `{ "refreshToken": "..." }` (`@NotBlank`)
> - **응답(성공)**: 새 `TokenResponse`(§1.1과 동일 구조 — access·refresh **둘 다 새로 발급**, rotation). 기존 refresh는 폐기된다.
> - **실패 시 동작**(전부 HTTP 401 → **재로그인 필요**):
>   - refresh 만료 → `AUTH_TOKEN_EXPIRED`
>   - refresh 위조/DB 미존재/**이미 폐기된 토큰 재사용** → `AUTH_TOKEN_INVALID` (재사용 탐지 시 해당 계정의 활성 refresh 전부 무효화)
>   - **계정이 비활성화됨(`use_yn='N'`)** → `AUTH_TOKEN_INVALID`. 즉 관리자 계정이 `PATCH /admins/{userSeq}/status`로 비활성되면 **다음 refresh부터 거부** → "비활성 관리자 세션 만료"로 이어진다.
> - refresh 흐름 자체의 요청/응답 상세는 사용자 측 인증 문서 소관(이 문서 범위 밖) — 여기서는 관리자 세션 유지에 필요한 만큼만 참고로 기술.

### 1.2 응답 봉투

모든 응답은 `ApiResponse<T>` 봉투로 감싼다. `data`가 `null`이면 **필드가 생략**된다(`@JsonInclude(NON_NULL)`).

| 필드 | 타입 | 설명 |
|---|---|---|
| `code` | string | 성공은 `"SUCCESS"`, 실패는 `ErrorCode` enum 이름(예: `"ORDER_NOT_FOUND"`) |
| `message` | string | 성공은 `"요청 처리 완료"`, 실패는 에러별 메시지(검증 실패는 `"{필드}: {사유}"`) |
| `data` | T \| null | 성공 페이로드. 없으면 생략(생성/변경 액션은 보통 `data` 없음) |

**성공 예시**(데이터 없는 액션 — 대부분의 PATCH/POST/DELETE):
```json
{ "code": "SUCCESS", "message": "요청 처리 완료" }
```

**페이지 응답** — 목록 엔드포인트의 `data`는 `PageResponse<T>`:

| 필드 | 타입 | 설명 |
|---|---|---|
| `content` | T[] | 현재 페이지 항목 배열 |
| `page` | int | 현재 페이지 번호(**0-based**) |
| `size` | int | 페이지 크기 |
| `totalElements` | long | 전체 항목 수 |
| `totalPages` | int | 전체 페이지 수 |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "content": [ /* ... */ ],
    "page": 0, "size": 20, "totalElements": 137, "totalPages": 7
  }
}
```

### 1.3 페이징 · 정렬

목록 엔드포인트 공통 쿼리 파라미터(Spring `Pageable`):

| 파라미터 | 기본값 | 설명 |
|---|---|---|
| `page` | `0` | 페이지 번호(0-based) |
| `size` | `20` | 페이지 크기 |
| `sort` | 도메인별 기본값 | `sort={field},{asc\|desc}` 형식. 다중 허용(예: `sort=orderDate,desc&sort=orderSeq,desc`) |

- **정렬 화이트리스트**: 각 도메인은 정렬 허용 필드가 정해져 있다. **화이트리스트에 없는 필드로 정렬 요청 시 → HTTP 400 `COMMON_INVALID_REQUEST`**. (허용 필드·기본 정렬은 각 도메인 섹션에 표기.)
- 페이지 기본 정렬(`@PageableDefault`)은 도메인마다 다르다: 회원/관리자=`userSeq desc`, 상품=`productSeq desc`, 배너=`sortOrder,bannerSeq asc`, 주문=`orderDate desc`, 반품=`requestedDate desc`, 문의=`inquirySeq desc`.

### 1.4 공통 에러

에러 응답도 `ApiResponse` 봉투이며 `code`는 `ErrorCode` 이름, `data`는 `null`. 아래는 **모든 엔드포인트에서 공통**으로 날 수 있는 에러(각 도메인 섹션에서는 생략하고 여기를 참조).

| HTTP | code | 발생 조건 |
|---|---|---|
| 401 | `AUTH_UNAUTHORIZED` | 토큰 없음/만료/위조 (로그인 제외 전 엔드포인트) |
| 403 | `AUTH_FORBIDDEN` | 인증됐으나 ADMIN 아님 |
| 400 | `COMMON_VALIDATION_ERROR` | 바디 Bean Validation 실패. `message`=`"{필드}: {사유}"`(첫 위반 필드) |
| 400 | `COMMON_INVALID_REQUEST` | 잘못된 파라미터(예: 정렬 화이트리스트 외 필드, 대시보드 잘못된 기간) |
| 404 | `COMMON_RESOURCE_NOT_FOUND` | 매칭되는 라우트 없음 |
| 405 | `COMMON_METHOD_NOT_ALLOWED` | 지원하지 않는 HTTP 메서드 |
| 500 | `COMMON_INTERNAL_ERROR` | 서버 내부 오류 |

> 도메인 고유 에러(예: `ORDER_NOT_FOUND`, `CATEGORY_HAS_CHILDREN`, `ORDER_TRANSITION_INVALID` 등)는 각 엔드포인트 섹션(§4)에 표기.

---

## 2. Enum 값 목록 (상태 뱃지·필터용)

프론트가 상태 표시/필터에 쓰는 값의 전체 목록. **API는 문자열로 이 값들을 주고받는다.**

### 2.1 주문 상태 `OrderStatus` (`dat_order.order_status`)
| 값 | 의미 |
|---|---|
| `PENDING` | 결제 대기(미결제) |
| `PAID` | 결제 완료 |
| `PREPARING` | 상품 준비중 |
| `SHIPPING` | 배송중(출고됨) |
| `DELIVERED` | 배송 완료 |
| `CANCELED` | 취소(종결) |
| `RETURNED` | 반품(주문 전체 반품 종결) |

> **매출 집계 주의(D 대시보드)**: 총매출 = `PAID·PREPARING·SHIPPING·DELIVERED·RETURNED`(CANCELED만 제외). 부분반품은 `order_status`를 바꾸지 않는다(주문은 DELIVERED로 남고 `dat_return`에만 기록).

### 2.2 배송 상태 `ShippingStatus` (`dat_order_shipping.shipping_status`)
주문 상태와 **별도 컬럼**(2컬럼 분리). 세부 배송 단계.
| 값 | 의미 |
|---|---|
| `READY` | 출고 준비(운송장 입력 전) |
| `SHIPPED` | 출고됨(운송장 입력됨) |
| `IN_TRANSIT` | 배송중 |
| `DELIVERED` | 배송 완료(종결) |

### 2.3 반품 상태 `ReturnStatus` (`dat_return.return_status`)
| 값 | 의미 |
|---|---|
| `REQUESTED` | 신청 |
| `APPROVED` | 승인 |
| `COLLECTED` | 회수 완료 |
| `INSPECTED` | 검수 완료 |
| `COMPLETED` | 완료(환불 확정·종결) |
| `REJECTED` | 반려(종결) |

> 스키마 주석의 `PICKUP`/`INSPECTING`은 **구값(미사용)** — 실제 코드는 `COLLECTED`/`INSPECTED`.

### 2.4 반품 유형 `return_type` (`dat_return.return_type`)
| 값 | 의미 |
|---|---|
| `CANCEL` | 취소(주문 취소 경로) |
| `EXCHANGE` | 교환 |
| `RETURN` | 반품(환불) |

### 2.5 문의 상태 `InquiryStatus` (`dat_inquiry.inquiry_status`)
| 값 | 의미 |
|---|---|
| `WAITING` | 답변 대기 |
| `ANSWERED` | 답변 완료 |

> **2상태만 사용.** 스키마 주석의 `CLOSED`는 **유령상태(미사용)**. 되돌리기 없음.

### 2.6 문의 유형 `inquiry_type` (`dat_inquiry.inquiry_type`)
`PRODUCT`, `ORDER`, `DELIVERY`, `RETURN`, `ETC` — (M6 사용자 등록 시 검증. 관리자 검색은 이 값으로 eq 필터.)

### 2.7 결제 상태 `payment_status` (`dat_order_payment.payment_status`)
`PENDING`, `PAID`, `CANCELED`, `REFUNDED` — 주문 상세의 `payment.paymentStatus`로 노출.
> 출처 = 스키마 주석. 값 집합은 결제(M4)/환불(R) 소관. **확인 필요 시 결제 도메인 별도 확인**(이 문서 범위 밖).

### 2.8 회원 등급 `grade_code` (`mst_user_grade`, 시드 V2)
| 값 | 이름 | 적립률 |
|---|---|---|
| `MEMBER` | 회원 | 0% |
| `SELLER` | 셀러 | 1% |
| `MASTER` | 마스터 | 3% |
| `SENIOR` | 상무 | 5% |
| `EXECUTIVE` | 전무 | 10% |

### 2.9 회원 운영 상태 `user_status` (`mst_user.user_status`)
| 값 | 의미 |
|---|---|
| `ACTIVE` | 정상 |
| `DORMANT` | 휴면 |
| `SUSPENDED` | 정지 |

> **탈퇴는 상태값이 아니라 `use_yn='N'`로 별도 표현**(`WITHDRAWN` 미사용). 상태 변경 API는 이 3값만 허용(외 값 → `MEMBER_INVALID_STATUS` 400).

### 2.10 회원 역할 `user_role` (`mst_user.user_role`)
`CUSTOMER`(일반 회원) · `ADMIN`(관리자). 2단계.

### 2.11 상품 판매 상태 (`mst_product`, 판매상태)
`ON_SALE`, `LOW_STOCK`, `SOLD_OUT`, `STOPPED` — 상태 변경 API는 이 4값만 허용(외 값 → `PRODUCT_INVALID_STATUS` 400).

---

## 3. 상태 전이표 (액션 버튼 노출 근거)

각 상태에서 **허용된 전이(from → 가능한 to)**만 나열. 프론트는 "현재 상태에서 어떤 액션 버튼을 보여줄지"를 이 표로 결정하면 된다. 표에 없는 전이를 시도하면 **409 `*_TRANSITION_INVALID`**.

### 3.1 주문 `OrderStatus`
| from | → 가능한 to | 유발 액션(관리자 API) |
|---|---|---|
| `PENDING` | `PAID` | (사용자 결제 — 관리자 API 아님) |
| `PAID` | `PREPARING`, `CANCELED` | `prepare` / `cancel` |
| `PREPARING` | `SHIPPING`, `CANCELED` | `ship` / `cancel` |
| `SHIPPING` | `DELIVERED` | `deliver` |
| `DELIVERED` | `RETURNED` | (반품 완료가 유발 — R `complete`) |
| `CANCELED` | (종결) | — |
| `RETURNED` | (종결) | — |

> 위반 시 `ORDER_TRANSITION_INVALID` (409). 관리자 취소는 `PAID`/`PREPARING`에서만 가능.

### 3.2 배송 `ShippingStatus`
| from | → 가능한 to | 유발 액션 |
|---|---|---|
| `READY` | `SHIPPED` | `ship`(운송장 입력) |
| `SHIPPED` | `IN_TRANSIT`, `DELIVERED` | `in-transit` / `deliver`(IN_TRANSIT 생략 허용) |
| `IN_TRANSIT` | `DELIVERED` | `deliver` |
| `DELIVERED` | (종결) | — |

> **주문·배송 2컬럼 동시 전이**: `ship`은 주문 `PREPARING→SHIPPING` + 배송 `READY→SHIPPED`를 원자적으로 함께 이동. `deliver`는 주문 `SHIPPING→DELIVERED` + 배송 `{SHIPPED|IN_TRANSIT}→DELIVERED`를 함께. 위반 시 `ORDER_TRANSITION_INVALID` (409).

### 3.3 반품 `ReturnStatus`
| from | → 가능한 to | 유발 액션(관리자 API) |
|---|---|---|
| `REQUESTED` | `APPROVED`, `REJECTED` | `approve` / `reject` |
| `APPROVED` | `COLLECTED`, `REJECTED` | `collect` / `reject` |
| `COLLECTED` | `INSPECTED` | `inspect` |
| `INSPECTED` | `COMPLETED`, `REJECTED` | `complete` / `reject` |
| `COMPLETED` | (종결) | — |
| `REJECTED` | (종결) | — |

> 위반 시 `RETURN_TRANSITION_INVALID` (409). **완료(`complete`)의 부수효과**: `CANCEL`/`RETURN` 유형은 환불 확정 + 결제 REFUNDED + 주문 종결(CANCELED/RETURNED) + 재고 복원을 원자적으로 트리거. `EXCHANGE`는 **상태만** 변경(환불·재고 없음).

### 3.4 문의 `InquiryStatus`
| from | → 가능한 to | 유발 액션 |
|---|---|---|
| `WAITING` | `ANSWERED` | `replies`(최초 답변 등록) |
| `ANSWERED` | (종결) | — |

> 위반 시 `INQUIRY_TRANSITION_INVALID` (409). **재답변 시 주의**: 이미 `ANSWERED`인 문의에 답변을 추가해도 상태는 그대로이고 **`answeredDate`(최초 답변 시각)는 불변**(재답변으로 갱신되지 않음). 프론트가 "최초 응답 시각"으로 표시해도 안전.

---

## 4. 도메인별 엔드포인트 상세

> 표기 규칙: 인증은 별도 표시 없으면 **🔒 ADMIN**(§1.1). 공통 에러(401/403/400 검증/404 라우트/405/500)는 §1.4 참조 — 아래 "에러"에는 **도메인 고유 코드만** 기입. 요청 필드의 "필수"는 `@NotNull`/`@NotBlank` 기준. 금액은 `BigDecimal`(문자열/숫자 JSON), 일시는 ISO-8601 문자열.

---

### F. Foundation — 인증·관리자 계정

#### F-1. `POST /api/v1/admin/auth/login` — 관리자 로그인 · 🔓 인증 불요
- **요청 바디** `LoginRequest`: `userId`(string, 필수) · `userPw`(string, 필수)
- **응답 200** `TokenResponse`: `accessToken`(string) · `refreshToken`(string) · `tokenType`(string="Bearer") · `accessTokenExpiresIn`(long, 초)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "tokenType": "Bearer", "accessTokenExpiresIn": 1800 } }
  ```
- **에러**: `AUTH_INVALID_CREDENTIALS`(401 — 아이디/비번 불일치, **또는 role≠ADMIN, 또는 SUSPENDED 계정** = 전부 동일 응답으로 열거 방지)
- **특이사항**: 이 엔드포인트만 토큰 없이 호출. 탈퇴(`use_yn='N'`) 계정은 조회 단계에서 이미 거부.

#### F-2. `GET /api/v1/admin/me` — 본인 정보
- **응답 200** `AdminMeResponse`: `userSeq`(Long) · `userId`(string) · `role`(string)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료", "data": { "userSeq": 3, "userId": "admin01", "role": "ADMIN" } }
  ```
- **에러**: 없음(공통만).

#### F-3. `POST /api/v1/admin/admins` — 관리자 계정 생성
- **요청 바디** `CreateAdminRequest`: `userId`(string, 필수) · `userPw`(string, 필수) · `userName`(string, 필수) · `email`(string, 선택, `@Email` 형식)
- **응답 200** `AdminCreatedResponse`: `userSeq`(Long) · `userId`(string)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료", "data": { "userSeq": 8, "userId": "admin02" } }
  ```
- **에러**: `USER_DUPLICATED_ID`(409 — userId 중복)

#### F-4. `GET /api/v1/admin/admins` — 관리자 목록(페이징)
- **쿼리**: 페이징 공통(§1.3). **기본 정렬 `userSeq desc`**.
  - **정렬(실측)**: 이 엔드포인트는 **정렬 화이트리스트가 없다**(다른 목록 M~D와 다른 유일한 예외). `list(Pageable)`가 `Pageable`을 리포지토리로 그대로 전달하므로, `sort={field},{dir}`의 `field`는 **`User` 엔티티 속성명에 직접 매핑**된다. 유효 속성 예: `userSeq`·`userId`·`userName`·`email`·`userStatus`·`useYn`·`lastLoginDate`·`pointBalance`.
  - ⚠️ **존재하지 않는 속성명으로 정렬하면 400이 아니라 500**(`COMMON_INTERNAL_ERROR` — 정렬 필드 미검증, 다른 도메인의 `COMMON_INVALID_REQUEST` 400과 대비). 프론트는 위 유효 속성명만 사용할 것.
- **응답 200** `PageResponse<AdminListItem>`. `AdminListItem`: `userSeq`(Long) · `userId`(string) · `userName`(string) · `email`(string) · `userStatus`(string) · `useYn`(string Y/N) · `lastLoginDate`(OffsetDateTime|null)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "content": [ { "userSeq": 3, "userId": "admin01", "userName": "운영자", "email": "a@x.com", "userStatus": "ACTIVE", "useYn": "Y", "lastLoginDate": "2026-07-06T10:00:00+09:00" } ],
      "page": 0, "size": 20, "totalElements": 2, "totalPages": 1 } }
  ```
- **에러**: 없음(공통만).

#### F-5. `PATCH /api/v1/admin/admins/{userSeq}/status` — 관리자 활성/비활성
- **path**: `userSeq`(Long) · **바디** `UpdateAdminStatusRequest`: `active`(Boolean, 필수. `true`=활성 useYn=Y, `false`=비활성 useYn=N)
- **응답 200**: data 없음 → `{ "code": "SUCCESS", "message": "요청 처리 완료" }`
- **에러**: `USER_NOT_FOUND`(404 — 대상 없음/관리자 아님) · `ADMIN_SELF_LOCKOUT`(409 — 본인 계정) · `ADMIN_LAST_ADMIN_PROTECTED`(409 — 마지막 운영 관리자 비활성 시도, ROOT 제외 카운트)
- **특이사항**: 비활성화된 관리자는 이후 refresh가 거부됨(§1.1 참고 박스 — "비활성 관리자 세션 만료").

---

### M. Member — 회원관리 (FR-ADM-02)

정렬 화이트리스트: `userSeq · userId · userName · pointBalance · lastLoginDate · joinedDate · userStatus`. 외 필드 → 400 `COMMON_INVALID_REQUEST`. 기본 정렬 `userSeq desc`.

#### M-1. `GET /api/v1/admin/members` — 회원 목록·검색
- **쿼리**(전부 선택) `MemberSearchCondition`: `q`(userId 또는 userName 부분일치) · `userId` · `userName` · `gradeCode` · `status`(ACTIVE/DORMANT/SUSPENDED) · `joinedFrom`(date `YYYY-MM-DD`) · `joinedTo`(date) · `includeDeleted`(bool, 기본 false — true면 `use_yn='N'` 포함) + 페이징.
- **응답 200** `PageResponse<MemberListItem>`. `MemberListItem`: `userSeq`(Long) · `userId` · `userName` · `gradeCode`(string) · `pointBalance`(Integer) · `userStatus` · `useYn` · `joinedDate`(OffsetDateTime) · `lastLoginDate`(OffsetDateTime|null)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "content": [ { "userSeq": 12, "userId": "buyer01", "userName": "김구매", "gradeCode": "MEMBER", "pointBalance": 3000, "userStatus": "ACTIVE", "useYn": "Y", "joinedDate": "2026-05-01T09:00:00+09:00", "lastLoginDate": "2026-07-05T20:00:00+09:00" } ],
      "page": 0, "size": 20, "totalElements": 137, "totalPages": 7 } }
  ```

#### M-2. `POST /api/v1/admin/members` — 회원 등록
- **바디** `CreateMemberRequest`: `userId`(필수) · `userPw`(필수, 즉시 BCrypt 해시) · `userName`(필수) · `gradeCode`(선택, 미지정 시 `MEMBER`) · `email`(선택) · `phone`(선택)
- **응답 200** `MemberCreatedResponse`: `userSeq`(Long) · `userId`(string)
- **에러**: `USER_DUPLICATED_ID`(409) · `GRADE_NOT_FOUND`(404 — gradeCode 유효하지 않음)

#### M-3. `GET /api/v1/admin/members/{userSeq}` — 회원 상세
- **응답 200** `MemberDetailResponse`(비밀번호/해시 절대 미포함): `userSeq` · `userId` · `userName` · `userRole` · `gradeCode` · `gradeName` · `userStatus` · `useYn` · `email` · `phone` · `birthDate`(date|null) · `zipCode` · `address` · `addressDetail` · `memo` · `pointBalance`(Integer) · `serviceYn` · `privacyYn` · `marketingYn` · `referrerUserId`(string|null) · `lastLoginDate` · `joinedDate`. (null 필드는 생략.)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "userSeq": 12, "userId": "buyer01", "userName": "김구매", "userRole": "CUSTOMER", "gradeCode": "MEMBER", "gradeName": "회원", "userStatus": "ACTIVE", "useYn": "Y", "email": "b@x.com", "phone": "010-0000-0000", "pointBalance": 3000, "serviceYn": "Y", "privacyYn": "Y", "marketingYn": "N", "joinedDate": "2026-05-01T09:00:00+09:00" } }
  ```
- **에러**: `USER_NOT_FOUND`(404)

#### M-4. `PATCH /api/v1/admin/members/{userSeq}/grade` — 등급 변경
- **바디** `UpdateMemberGradeRequest`: `gradeCode`(string, 필수) · **응답 200**: data 없음
- **에러**: `USER_NOT_FOUND`(404) · `GRADE_NOT_FOUND`(404 — gradeCode 유효하지 않음)

#### M-5. `PATCH /api/v1/admin/members/{userSeq}/status` — 운영 상태 변경
- **바디** `UpdateMemberStatusRequest`: `status`(string, 필수, 허용 `ACTIVE`/`DORMANT`/`SUSPENDED`) · **응답 200**: data 없음
- **에러**: `USER_NOT_FOUND`(404) · `MEMBER_INVALID_STATUS`(400 — 허용값 외)
- **특이사항**: 탈퇴(`use_yn`)는 건드리지 않음. `SUSPENDED`로 바꾸면 해당 회원 로그인 차단.

#### M-6. `POST /api/v1/admin/members/{userSeq}/points` — 포인트 수동 조정
- **바디** `PointAdjustRequest`: `amount`(Integer, 필수. **양수=적립, 음수=차감, 0 불허**) · `reason`(string, 필수)
- **응답 200** `PointAdjustResponse`: `userSeq`(Long) · `pointBalance`(Integer, 조정 후 잔액) · `pointSeq`(Long, 생성된 이력 seq)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료", "data": { "userSeq": 12, "pointBalance": 5000, "pointSeq": 88 } }
  ```
- **에러**: `USER_NOT_FOUND`(404) · `COMMON_VALIDATION_ERROR`(400 — amount=0) · `POINT_INSUFFICIENT`(400 — 차감 후 잔액 음수)

#### M-7. `PATCH /api/v1/admin/members/{userSeq}/role` — 역할 변경(승강)
- **바디** `UpdateMemberRoleRequest`: `role`(string, 필수, 허용 `ADMIN`/`CUSTOMER`) · **응답 200**: data 없음
- **에러**: `USER_NOT_FOUND`(404) · `COMMON_VALIDATION_ERROR`(400 — role 허용값 외) · `ADMIN_ROOT_PROTECTED`(409 — ROOT 대상) · `ADMIN_SELF_LOCKOUT`(409 — 본인) · `ADMIN_LAST_ADMIN_PROTECTED`(409 — 마지막 ADMIN 강등) · `GRADE_NOT_FOUND`(404 — 강등 시 기본 MEMBER 등급 부재)
- **특이사항**: 승격(→ADMIN)은 등급 제거(관리자는 등급 없음), 강등(→CUSTOMER)은 `MEMBER` 등급 부여.

---

### C. Catalog — 카테고리 (FR-ADM-03)

#### C-1. `GET /api/v1/admin/categories` — 2단계 트리
- **쿼리**: `includeDeleted`(bool, 기본 false)
- **응답 200** `List<AdminCategoryNode>`(**중첩 트리**, 페이징 아님). `AdminCategoryNode`: `categorySeq`(Long) · `parentSeq`(Long|null) · `categoryName` · `urlSlug` · `categoryLevel`(Integer) · `sortOrder`(Integer) · `displayYn` · `useYn` · `childCategoryCount`(int) · `productCount`(int) · `children`(AdminCategoryNode[] — 하위 노드 재귀)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": [ { "categorySeq": 1, "parentSeq": null, "categoryName": "스킨케어", "urlSlug": "skincare", "categoryLevel": 1, "sortOrder": 1, "displayYn": "Y", "useYn": "Y", "childCategoryCount": 2, "productCount": 0,
      "children": [ { "categorySeq": 5, "parentSeq": 1, "categoryName": "토너", "urlSlug": "toner", "categoryLevel": 2, "sortOrder": 1, "displayYn": "Y", "useYn": "Y", "childCategoryCount": 0, "productCount": 12, "children": [] } ] } ] }
  ```
- **특이사항**: `childCategoryCount`/`productCount`는 삭제 차단 판단 근거.

#### C-2. `POST /api/v1/admin/categories` — 생성
- **바디** `CreateCategoryRequest`: `parentSeq`(Long, 선택 — null=대분류 level1, 값=중분류 level2) · `categoryName`(필수) · `urlSlug`(필수) · `sortOrder`(Integer, 선택) · `displayYn`(선택, 미지정 Y)
- **응답 200** `CategoryCreatedResponse`: `categorySeq`(Long)
- **에러**: `CATEGORY_NOT_FOUND`(404 — parentSeq 대상 없음) · `CATEGORY_INVALID_PARENT`(400 — 부모가 level1 아님 = 3단계 금지) · `CATEGORY_DUPLICATED_SLUG`(409)

#### C-3. `PATCH /api/v1/admin/categories/{categorySeq}` — 수정(부분)
- **바디** `UpdateCategoryRequest`(전부 선택): `categoryName` · `urlSlug` · `sortOrder` · `displayYn`. (부모/레벨 이동 불가.)
- **응답 200**: data 없음
- **에러**: `CATEGORY_NOT_FOUND`(404) · `CATEGORY_DUPLICATED_SLUG`(409)

#### C-4. `DELETE /api/v1/admin/categories/{categorySeq}` — 소프트삭제
- **응답 200**: data 없음
- **에러**: `CATEGORY_NOT_FOUND`(404) · `CATEGORY_HAS_CHILDREN`(409 — 하위 카테고리/소속 상품 존재)

---

### C. Catalog — 상품 (FR-ADM-04)

정렬 화이트리스트: `productSeq · productCode · productName · basePrice · productStatus · displayYn · createdDate`. 기본 정렬 `productSeq desc`.

#### C-5. `GET /api/v1/admin/products` — 목록·검색
- **쿼리**(선택) `ProductSearchCondition`: `q`(productCode 또는 productName 부분일치) · `productCode` · `categorySeq`(Long) · `displayYn`(Y/N) · `status`(ON_SALE/LOW_STOCK/SOLD_OUT/STOPPED) · `includeDeleted`(bool 기본 false) + 페이징.
- **응답 200** `PageResponse<AdminProductListItem>`. `AdminProductListItem`: `productSeq`(Long) · `productCode` · `productName` · `productStatus` · `categorySeq`(Long|null) · `categoryName`(string|null) · `basePrice`(BigDecimal) · `displayYn` · `useYn` · `totalStock`(Integer, 활성 옵션 재고합) · `createdDate`(OffsetDateTime)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "content": [ { "productSeq": 20, "productCode": "MZ-001", "productName": "수분 토너", "productStatus": "ON_SALE", "categorySeq": 5, "categoryName": "토너", "basePrice": 25000, "displayYn": "Y", "useYn": "Y", "totalStock": 120, "createdDate": "2026-04-10T09:00:00+09:00" } ],
      "page": 0, "size": 20, "totalElements": 44, "totalPages": 3 } }
  ```

#### C-6. `GET /api/v1/admin/products/{productSeq}` — 상세
- **응답 200** `AdminProductDetailResponse`: `productSeq` · `productCode` · `productName` · `productStatus` · `categorySeq` · `categoryName` · `basePrice`(BigDecimal) · `shortDesc` · `detailDesc` · `ingredientInfo` · `usageInfo` · `displayYn` · `useYn` · `options`(배열) · `images`(배열) · `labels`(배열) · `createdDate` · `lastModifiedDate`
  - `options[]` `AdminOptionDto`: `optionSeq`(Long) · `optionName` · `finalPrice`(BigDecimal) · `stockQty`(Integer) · `sortOrder`(Integer) · `useYn`
  - `images[]` `AdminImageDto`: `imageSeq`(Long) · `imageType`(MAIN/SUB/DETAIL) · `imageUrl` · `imageAlt` · `sortOrder` · `useYn`
  - `labels[]` `AdminLabelDto`: `labelSeq`(Long) · `labelName`(string)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "productSeq": 20, "productCode": "MZ-001", "productName": "수분 토너", "productStatus": "ON_SALE", "categorySeq": 5, "categoryName": "토너", "basePrice": 25000, "shortDesc": "촉촉함", "displayYn": "Y", "useYn": "Y",
      "options": [ { "optionSeq": 51, "optionName": "150ml", "finalPrice": 25000, "stockQty": 120, "sortOrder": 1, "useYn": "Y" } ],
      "images": [ { "imageSeq": 71, "imageType": "MAIN", "imageUrl": "https://.../m.jpg", "sortOrder": 1, "useYn": "Y" } ],
      "labels": [ { "labelSeq": 2, "labelName": "BEST" } ],
      "createdDate": "2026-04-10T09:00:00+09:00", "lastModifiedDate": "2026-06-01T09:00:00+09:00" } }
  ```
- **에러**: `PRODUCT_NOT_FOUND`(404)

#### C-7. `POST /api/v1/admin/products` — 생성(옵션·이미지·라벨 일괄, 단일 트랜잭션)
- **바디** `CreateProductRequest`: `productCode`(필수) · `productName`(필수) · `categorySeq`(Long, 선택 — 지정 시 활성 카테고리여야) · `basePrice`(BigDecimal, **필수, ≥0**) · `productStatus`(선택, 미지정 ON_SALE) · `shortDesc`·`detailDesc`·`ingredientInfo`·`usageInfo`(선택) · `displayYn`(선택 Y) · `options`(배열, 선택·0개 허용) · `images`(배열, 선택·0개 허용) · `labelSeqs`(Long[], 선택)
  - `options[]` `OptionInput`: `optionName`(필수) · `finalPrice`(BigDecimal, **필수, ≥0**) · `stockQty`(Integer, 선택) · `sortOrder`(선택)
  - `images[]` `ImageInput`: `imageType`(필수, MAIN/SUB/DETAIL) · `imageUrl`(필수) · `imageAlt`(선택) · `sortOrder`(선택)
- **응답 200** `ProductCreatedResponse`: `productSeq`(Long) · `productCode`(string)
- **에러**: `PRODUCT_DUPLICATED_CODE`(409) · `CATEGORY_NOT_FOUND`(404 — categorySeq 무효) · `LABEL_NOT_FOUND`(404 — labelSeqs 중 무효)

#### C-8. `PUT /api/v1/admin/products/{productSeq}` — 수정(전체 교체)
- **바디** `UpdateProductRequest`: 상품 필드(C-7과 동일 검증: `productCode`·`productName` 필수, `basePrice` 필수 ≥0) + `options`(OptionUpsert[]) + `images`(ImageUpsert[]) + `labelSeqs`(Long[]).
  - `OptionUpsert`/`ImageUpsert`: `optionSeq`/`imageSeq`(Long, **null=신규, 값=기존 수정**) + 나머지는 OptionInput/ImageInput과 동일.
- **응답 200**: data 없음
- **에러**: `PRODUCT_NOT_FOUND`(404) · `PRODUCT_DUPLICATED_CODE`(409) · `PRODUCT_OPTION_NOT_FOUND`(404 — optionSeq 무효) · `PRODUCT_IMAGE_NOT_FOUND`(404 — imageSeq 무효) · `CATEGORY_NOT_FOUND`(404) · `LABEL_NOT_FOUND`(404)
- **특이사항**: 자식 동기화 — seq 있으면 수정·없으면 신규·요청에서 빠진 기존 활성 행은 소프트삭제. 라벨은 차집합 교체.

#### C-9. `PATCH /api/v1/admin/products/{productSeq}/status` — 판매상태 변경
- **바디** `UpdateProductStatusRequest`: `status`(필수, `ON_SALE`/`LOW_STOCK`/`SOLD_OUT`/`STOPPED`) · **응답 200**: data 없음
- **에러**: `PRODUCT_NOT_FOUND`(404) · `PRODUCT_INVALID_STATUS`(400 — 허용값 외)

#### C-10. `PATCH /api/v1/admin/products/{productSeq}/options/{optionSeq}/stock` — 재고 설정
- **path**: `productSeq`·`optionSeq`(Long) · **바디** `UpdateStockRequest`: `stockQty`(Integer, **필수, ≥0, 절대값 설정**) · **응답 200**: data 없음
- **에러**: `PRODUCT_NOT_FOUND`(404) · `PRODUCT_OPTION_NOT_FOUND`(404)
- **특이사항**: 증감이 아니라 절대값 설정.

#### C-11. `DELETE /api/v1/admin/products/{productSeq}` — 소프트삭제
- **응답 200**: data 없음 · **에러**: `PRODUCT_NOT_FOUND`(404) · `PRODUCT_HAS_ORDERS`(409 — 주문 이력 있으면 하드삭제 금지, 소프트삭제로 처리됨)

---

### S. Settings — 배너 (FR-ADM-08)

정렬 화이트리스트: `sortOrder · bannerSeq · createdDate`. 기본 정렬 `sortOrder asc, bannerSeq asc`(사용자 노출 순서 일치).

#### S-1. `GET /api/v1/admin/banners` — 목록·검색
- **쿼리**(선택) `AdminBannerSearchCondition`: `q`(title 부분일치) · `bannerType`(HERO/CATEGORY/PROMO) · `displayYn`(Y/N) · `includeDeleted`(bool 기본 false) + 페이징.
- **응답 200** `PageResponse<AdminBannerListItem>`. `AdminBannerListItem`: `bannerSeq`(Long) · `bannerType` · `title` · `imageUrl` · `sortOrder`(Integer) · `displayYn` · `useYn`
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "content": [ { "bannerSeq": 1, "bannerType": "HERO", "title": "여름 세일", "imageUrl": "https://.../h.jpg", "sortOrder": 1, "displayYn": "Y", "useYn": "Y" } ],
      "page": 0, "size": 20, "totalElements": 4, "totalPages": 1 } }
  ```

#### S-2. `GET /api/v1/admin/banners/{bannerSeq}` — 상세(편집 폼)
- **응답 200** `AdminBannerDetailResponse`: `bannerSeq` · `bannerType` · `title` · `description` · `imageUrl` · `linkUrl` · `sortOrder` · `displayYn` · `useYn`. (소프트삭제된 배너도 조회 가능.)
- **에러**: `BANNER_NOT_FOUND`(404)

#### S-3. `POST /api/v1/admin/banners` — 생성
- **바디** `CreateBannerRequest`: `title`(필수) · `imageUrl`(필수) · `bannerType`(선택, 미지정 HERO) · `description`·`linkUrl`(선택) · `sortOrder`(Integer, 선택 미지정 0) · `displayYn`(선택 Y)
- **응답 200** `BannerCreatedResponse`: `bannerSeq`(Long) · **에러**: 없음(검증만)

#### S-4. `PUT /api/v1/admin/banners/{bannerSeq}` — 수정(전체)
- **바디** `UpdateBannerRequest`: `title`(필수) · `imageUrl`(필수) · `bannerType`·`description`·`linkUrl`·`sortOrder`·`displayYn`(선택 — 미지정 시 기본값으로 정규화: HERO/0/Y)
- **응답 200**: data 없음 · **에러**: `BANNER_NOT_FOUND`(404)

#### S-5. `PATCH /api/v1/admin/banners/{bannerSeq}/display` — 노출 토글
- **바디** `UpdateBannerDisplayRequest`: `displayYn`(string, **필수, 정규식 `[YNyn]`** — Y/N/y/n만) · **응답 200**: data 없음
- **에러**: `BANNER_NOT_FOUND`(404). (형식 위반 → 400 `COMMON_VALIDATION_ERROR`.)

#### S-6. `DELETE /api/v1/admin/banners/{bannerSeq}` — 소프트삭제
- **응답 200**: data 없음 · **에러**: `BANNER_NOT_FOUND`(404)

---

### S. Settings — 배송 설정 (FR-ADM-09) · 단일행

#### S-7. `GET /api/v1/admin/settings/shipping` — 조회
- **응답 200** `ShippingSettingResponse`: `shipSeq`(Long) · `shippingName`(string) · `shippingFee`(BigDecimal) · `freeShippingMin`(BigDecimal) · `remoteExtraFee`(BigDecimal) · `shippingNotice`(string) · `updatedAt`(OffsetDateTime) · `updatedBy`(string)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "shipSeq": 1, "shippingName": "기본배송", "shippingFee": 3000, "freeShippingMin": 50000, "remoteExtraFee": 3000, "shippingNotice": "2-3일 소요", "updatedAt": "2026-06-01T09:00:00+09:00", "updatedBy": "admin01" } }
  ```
- **에러**: `SHIPPING_SETTING_NOT_FOUND`(**500** — 단일행 부재는 인프라 이상)

#### S-8. `PATCH /api/v1/admin/settings/shipping` — 수정(부분)
- **바디** `UpdateShippingRequest`(전부 선택, 제공된 필드만 변경): `shippingFee`(BigDecimal, ≥0) · `freeShippingMin`(BigDecimal, ≥0 — 0=항상 무료) · `remoteExtraFee`(BigDecimal, ≥0) · `shippingName`(string) · `shippingNotice`(string)
- **응답 200**: data 없음 · **에러**: `SHIPPING_SETTING_NOT_FOUND`(500). (금액 음수 → 400 `COMMON_VALIDATION_ERROR`.)

---

### O. Order — 주문운영 (FR-ADM-05) ⚠️ 상태·금액·부수효과 주의

정렬 화이트리스트: `orderDate · orderSeq · finalAmount`. 기본 정렬 `orderDate desc`. **상태 전이 규칙은 §3.1(주문)·§3.2(배송) 참조** — 버튼 노출 근거.

> **상태 전이 액션 공통(O-3~O-7)**: 성공 시 **HTTP 200, `data` 없음**(`{code:"SUCCESS", message}`). 응답에 갱신된 상태가 담기지 않으므로, **바뀐 상태는 상세 재조회 `GET /api/v1/admin/orders/{orderSeq}`(O-2)로 확인**한다.

#### O-1. `GET /api/v1/admin/orders` — 목록·검색
- **쿼리**(선택) `AdminOrderSearchCondition`: `q`(orderNo 부분일치) · `orderStatus`(§2.1) · `userSeq`(Long) · `dateFrom`(ISO datetime) · `dateTo`(ISO datetime) + 페이징. 기간은 `order_date` 폐구간.
- **응답 200** `PageResponse<AdminOrderListItem>`. `AdminOrderListItem`: `orderSeq`(Long) · `orderNo` · `orderStatus` · `userSeq`(Long) · `orderDate`(OffsetDateTime) · `finalAmount`(BigDecimal) · `firstItemName`(string|null) · `totalItemCount`(int)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "content": [ { "orderSeq": 1001, "orderNo": "MZ-26050700428", "orderStatus": "PAID", "userSeq": 12, "orderDate": "2026-05-07T14:00:00+09:00", "finalAmount": 48000, "firstItemName": "수분 토너", "totalItemCount": 2 } ],
      "page": 0, "size": 20, "totalElements": 320, "totalPages": 16 } }
  ```

#### O-2. `GET /api/v1/admin/orders/{orderSeq}` — 상세(주문·상품·배송·결제)
- **응답 200** `AdminOrderDetailResponse`: `orderSeq` · `orderNo` · `userSeq` · `orderStatus` · `orderDate` · `itemsTotal`(BigDecimal) · `totalDiscount`(BigDecimal) · `couponDiscount`(BigDecimal) · `pointUsed`(Integer) · `shippingFee`(BigDecimal) · `finalAmount`(BigDecimal) · `pointToEarn`(Integer) · `items`(배열) · `shipping`(객체|null) · `payment`(객체|null)
  - `items[]` `OrderItemSnapshot`: `itemSeq`(Long) · `productSeq` · `optionSeq`(Long|null) · `productCode` · `productName` · `optionName` · `unitPrice`(BigDecimal) · `quantity`(Integer) · `itemAmount`(BigDecimal) · `mainImageUrl`(string|null — 라이브 조인, 소프트삭제 상품은 null)
  - `shipping` `OrderShippingInfo`: `recipientName` · `recipientPhone` · `zipCode` · `address` · `addressDetail` · `shippingMemo` · `trackingNo`(string|null) · `shippingStatus`(§2.2) · `shippedDate`(OffsetDateTime|null) · `deliveredDate`(OffsetDateTime|null)
  - `payment` `OrderPaymentInfo`: `paymentType` · `paymentStatus`(§2.7) · `paidAmount`(BigDecimal) · `cardCompany` · `cardNoMasked` · `installment`(Integer) · `approvalNo` · `paidDate`(OffsetDateTime|null)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "orderSeq": 1001, "orderNo": "MZ-26050700428", "userSeq": 12, "orderStatus": "PAID", "orderDate": "2026-05-07T14:00:00+09:00",
      "itemsTotal": 50000, "totalDiscount": 5000, "couponDiscount": 3000, "pointUsed": 2000, "shippingFee": 3000, "finalAmount": 48000, "pointToEarn": 480,
      "items": [ { "itemSeq": 5001, "productSeq": 20, "optionSeq": 51, "productCode": "MZ-001", "productName": "수분 토너", "optionName": "150ml", "unitPrice": 25000, "quantity": 2, "itemAmount": 50000, "mainImageUrl": "https://.../m.jpg" } ],
      "shipping": { "recipientName": "김구매", "recipientPhone": "010-0000-0000", "zipCode": "06000", "address": "서울…", "addressDetail": "101호", "trackingNo": null, "shippingStatus": "READY", "shippedDate": null, "deliveredDate": null },
      "payment": { "paymentType": "CARD", "paymentStatus": "PAID", "paidAmount": 48000, "cardCompany": "신한", "cardNoMasked": "1234-****-****-5421", "installment": 0, "approvalNo": "00012345", "paidDate": "2026-05-07T14:00:05+09:00" } } }
  ```
- **에러**: `ORDER_NOT_FOUND`(404)

#### O-3. `PATCH /api/v1/admin/orders/{orderSeq}/prepare` — 준비 시작
- **전이**: 주문 `PAID → PREPARING` · **응답 200**: data 없음 · **에러**: `ORDER_NOT_FOUND`(404) · `ORDER_TRANSITION_INVALID`(409 — PAID 아님)

#### O-4. `PATCH /api/v1/admin/orders/{orderSeq}/cancel` — 관리자 취소
- **전이**: 주문 `{PAID|PREPARING} → CANCELED` · **응답 200**: data 없음 · **에러**: `ORDER_NOT_FOUND`(404) · `ORDER_TRANSITION_INVALID`(409)
- **⚠️ 부수효과**: **재고 복원**(주문 아이템 전량). payment는 이 API에서 불변(환불 오케스트레이션은 반품 `complete` 경로).

#### O-5. `PATCH /api/v1/admin/orders/{orderSeq}/ship` — 출고·운송장
- **바디** `ShipOrderRequest`: `trackingNo`(string, **필수**) · **전이**: 주문 `PREPARING → SHIPPING` **+** 배송 `READY → SHIPPED`(2컬럼 원자 동시) · **응답 200**: data 없음
- **에러**: `ORDER_NOT_FOUND`(404) · `ORDER_TRANSITION_INVALID`(409). (운송장 누락 → 400 `COMMON_VALIDATION_ERROR`, 전이 전 차단.)
- **⚠️ 부수효과**: 주문·배송 두 상태가 함께 이동(부분 전이 없음).

#### O-6. `PATCH /api/v1/admin/orders/{orderSeq}/in-transit` — 배송중
- **전이**: 배송 `SHIPPED → IN_TRANSIT`(shipping_status 단독, 주문 상태 불변) · **응답 200**: data 없음 · **에러**: `ORDER_NOT_FOUND`(404) · `ORDER_TRANSITION_INVALID`(409)

#### O-7. `PATCH /api/v1/admin/orders/{orderSeq}/deliver` — 배송완료
- **전이**: 주문 `SHIPPING → DELIVERED` **+** 배송 `{SHIPPED|IN_TRANSIT} → DELIVERED`(2컬럼 원자) · **응답 200**: data 없음 · **에러**: `ORDER_NOT_FOUND`(404) · `ORDER_TRANSITION_INVALID`(409)

---

### R. Returns — 반품/교환 (FR-ADM-06) ⚠️ 환불·재고·종결 부수효과 주의

정렬 화이트리스트: `requestedDate · returnSeq`. 기본 정렬 `requestedDate desc`. **상태 전이 규칙은 §3.3 참조**.

> **상태 전이 액션 공통(R-3~R-7)**: 성공 시 **HTTP 200, `data` 없음**. 갱신된 상태·환불액은 응답에 없으므로 **상세 재조회 `GET /api/v1/admin/returns/{returnSeq}`(R-2)로 확인**한다(특히 R-7 complete 후 `returnStatus`·`refundAmount`·주문 상태 변화).

#### R-1. `GET /api/v1/admin/returns` — 목록·검색
- **쿼리**(선택) `AdminReturnSearchCondition`: `q`(returnNo 부분일치) · `returnStatus`(§2.3) · `returnType`(§2.4) · `userSeq`(Long) · `dateFrom` · `dateTo`(ISO datetime, `requested_date` 기준) + 페이징.
- **응답 200** `PageResponse<AdminReturnListItem>`. `AdminReturnListItem`: `returnSeq`(Long) · `returnNo` · `orderSeq`(Long) · `orderNo` · `userSeq`(Long) · `returnType` · `returnStatus` · `returnReasonType`(string|null) · `refundAmount`(BigDecimal) · `requestedDate`(OffsetDateTime) · `totalItemCount`(int)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "content": [ { "returnSeq": 300, "returnNo": "RT-2605001", "orderSeq": 1001, "orderNo": "MZ-26050700428", "userSeq": 12, "returnType": "RETURN", "returnStatus": "REQUESTED", "returnReasonType": "CHANGE_OF_MIND", "refundAmount": 0, "requestedDate": "2026-05-20T10:00:00+09:00", "totalItemCount": 1 } ],
      "page": 0, "size": 20, "totalElements": 15, "totalPages": 1 } }
  ```

#### R-2. `GET /api/v1/admin/returns/{returnSeq}` — 상세
- **응답 200** `AdminReturnDetailResponse`: `returnSeq` · `returnNo` · `orderSeq` · `orderNo` · `userSeq` · `returnType` · `returnStatus` · `returnReasonType` · `returnReason`(string|null) · `returnShippingFee`(BigDecimal) · `refundAmount`(BigDecimal) · `pickupZipCode` · `pickupAddress` · `pickupAddressDetail` · `pickupPhone` · `requestedDate` · `completedDate`(OffsetDateTime|null) · `items`(배열)
  - `items[]` `ReturnItemDto`: `returnItemSeq`(Long) · `itemSeq`(Long) · `productSeq` · `productName` · `optionName` · `unitPrice`(BigDecimal) · `quantity`(Integer) · `exchangeOptionSeq`(Long|null) · `exchangeOptionName`(string|null)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "returnSeq": 300, "returnNo": "RT-2605001", "orderSeq": 1001, "orderNo": "MZ-26050700428", "userSeq": 12, "returnType": "RETURN", "returnStatus": "REQUESTED", "returnReasonType": "CHANGE_OF_MIND", "returnReason": "단순 변심", "returnShippingFee": 3000, "refundAmount": 0, "pickupZipCode": "06000", "pickupAddress": "서울…", "pickupPhone": "010-0000-0000", "requestedDate": "2026-05-20T10:00:00+09:00", "completedDate": null,
      "items": [ { "returnItemSeq": 900, "itemSeq": 5001, "productSeq": 20, "productName": "수분 토너", "optionName": "150ml", "unitPrice": 25000, "quantity": 1, "exchangeOptionSeq": null, "exchangeOptionName": null } ] } }
  ```
- **에러**: `RETURN_NOT_FOUND`(404)

#### R-3. `PATCH /api/v1/admin/returns/{returnSeq}/approve` — 승인
- **전이**: `REQUESTED → APPROVED` · **응답 200**: data 없음 · **에러**: `RETURN_NOT_FOUND`(404) · `RETURN_TRANSITION_INVALID`(409) · **부수효과 없음**

#### R-4. `PATCH /api/v1/admin/returns/{returnSeq}/reject` — 반려
- **전이**: `{REQUESTED|APPROVED|INSPECTED} → REJECTED` · **응답 200**: data 없음 · **에러**: `RETURN_NOT_FOUND`(404) · `RETURN_TRANSITION_INVALID`(409) · **부수효과 없음**(환불·재고·주문 종결 0)

#### R-5. `PATCH /api/v1/admin/returns/{returnSeq}/collect` — 회수
- **전이**: `APPROVED → COLLECTED` · **응답 200**: data 없음 · **에러**: `RETURN_NOT_FOUND`(404) · `RETURN_TRANSITION_INVALID`(409)

#### R-6. `PATCH /api/v1/admin/returns/{returnSeq}/inspect` — 검수(+재입고 판정)
- **바디** `InspectReturnRequest`(**선택 — 바디 생략 가능**): `restockYn`(string, 정규식 `[YNyn]`. 미지정 시 기본 — DEFECT 사유=N, 그 외=Y)
- **전이**: `COLLECTED → INSPECTED` · **응답 200**: data 없음 · **에러**: `RETURN_NOT_FOUND`(404) · `RETURN_TRANSITION_INVALID`(409). (형식 위반 → 400.)
- **특이사항**: 재입고 판정을 `dat_return_item.restock_yn`에 기록(완료 시 재판매분 재고 복원 대상 결정).

#### R-7. `PATCH /api/v1/admin/returns/{returnSeq}/complete` — 완료 ⚠️
- **전이**: `INSPECTED → COMPLETED` · **응답 200**: data 없음 · **에러**: `RETURN_NOT_FOUND`(404) · `ORDER_NOT_FOUND`(404 — 원주문 부재) · `RETURN_TRANSITION_INVALID`(409)
- **⚠️ 부수효과(유형별)**:
  - `CANCEL`/`RETURN`: 환불 확정(`refund_amount` 산정) + 결제 `REFUNDED`(Mock PG) + 주문 종결(`CANCEL→CANCELED` / `RETURN→RETURNED`) + 재고 복원 — **단일 트랜잭션 원자**.
  - `EXCHANGE`: **상태만** `COMPLETED`로. 환불·결제·재고 변화 **없음**(refund_amount는 0 유지). 대체옵션 재출고는 미구현(빚).

---

### CS. Inquiry — 문의응대 (FR-ADM-07)

정렬 화이트리스트: `inquirySeq · iDate`. 기본 정렬 `inquirySeq desc`.

#### CS-1. `GET /api/v1/admin/inquiries` — 목록·검색
- **쿼리**(선택) `AdminInquirySearchCondition`: `q`(title 부분일치) · `inquiryType`(§2.6) · `inquiryStatus`(§2.5) · `userSeq`(Long) · `privateYn`(Y/N — 미지정 시 비공개 포함 전체) · `dateFrom` · `dateTo`(ISO datetime, `i_date` 기준) + 페이징.
- **응답 200** `PageResponse<AdminInquiryListItem>`. `AdminInquiryListItem`: `inquirySeq`(Long) · `inquiryNo` · `userSeq`(Long) · `inquiryType` · `title` · `inquiryStatus` · `privateYn` · `hasReply`(boolean) · `createdDate`(OffsetDateTime) · `answeredDate`(OffsetDateTime|null)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "content": [ { "inquirySeq": 400, "inquiryNo": "Q-2641", "userSeq": 12, "inquiryType": "PRODUCT", "title": "재입고 문의", "inquiryStatus": "WAITING", "privateYn": "N", "hasReply": false, "createdDate": "2026-06-10T09:00:00+09:00" } ],
      "page": 0, "size": 20, "totalElements": 23, "totalPages": 2 } }
  ```
- **특이사항**: 관리자는 **비공개(private_yn='Y') 문의도 조회 가능**. `hasReply`는 상태 파생.

#### CS-2. `GET /api/v1/admin/inquiries/{inquirySeq}` — 상세(+답변)
- **응답 200** `AdminInquiryDetailResponse`: `inquirySeq` · `inquiryNo` · `userSeq` · `inquiryType` · `title` · `content` · `productSeq`(Long|null) · `orderSeq`(Long|null) · `inquiryStatus` · `privateYn` · `createdDate` · `answeredDate`(OffsetDateTime|null) · `replies`(배열)
  - `replies[]` `AdminInquiryReplyDto`(**관리자 전용 — `adminSeq` 노출**): `replySeq`(Long) · `adminSeq`(Long) · `content`(string) · `createdDate`(OffsetDateTime)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "inquirySeq": 400, "inquiryNo": "Q-2641", "userSeq": 12, "inquiryType": "PRODUCT", "title": "재입고 문의", "content": "언제 들어오나요?", "productSeq": 20, "inquiryStatus": "ANSWERED", "privateYn": "N", "createdDate": "2026-06-10T09:00:00+09:00", "answeredDate": "2026-06-11T10:00:00+09:00",
      "replies": [ { "replySeq": 700, "adminSeq": 3, "content": "다음 주 입고 예정입니다.", "createdDate": "2026-06-11T10:00:00+09:00" } ] } }
  ```
- **에러**: `INQUIRY_NOT_FOUND`(404)
- **특이사항**: `adminSeq`는 관리자 응답에만 노출(사용자 측 답변 DTO엔 없음 — 운영자 비노출).

#### CS-3. `POST /api/v1/admin/inquiries/{inquirySeq}/replies` — 답변 등록
- **바디** `CreateReplyRequest`: `content`(string, **필수, 최대 2000자** `@Size(max=2000)`). adminSeq는 인증 관리자에서 주입(바디 아님).
- **응답 200**: data 없음 · **에러**: `INQUIRY_NOT_FOUND`(404)
- **특이사항**: 최초 답변 시 `WAITING → ANSWERED` 전이 + `answeredDate` 기록. **재답변(다중 허용) 시 상태·`answeredDate` 불변**(최초 답변 시각 고정 — 프론트는 "최초 응답 시각"으로 표시). 답변은 append-only(수정/삭제 없음). 사용자 측에도 기존 read 경로로 자동 노출.

---

### D. Dashboard — 대시보드 (FR-ADM-01)

순수 read 집계. 상세 결정·정본은 `docs/dashboard-decisions.md`.

#### D-1. `GET /api/v1/admin/dashboard/summary` — KPI 요약
- **쿼리**(택1): `period`(프리셋, 기본 `TODAY` — `TODAY`/`THIS_WEEK`/`THIS_MONTH`/`LAST_7_DAYS`) **또는** `dateFrom`+`dateTo`(ISO datetime, 커스텀. 둘 다 필요). 프리셋 경계는 **KST 반개구간 `[from,to)`**. WAITING만 현시점 스냅샷(기간 무관).
- **응답 200** `DashboardSummaryResponse`: `period`{`from`(OffsetDateTime), `to`(OffsetDateTime)} · `grossSales`(BigDecimal, 총매출) · `netSales`(BigDecimal, **순매출 — 음수 가능**) · `orderCount`(long) · `newMemberCount`(long) · `waitingInquiryCount`(long) · `avgResponseSeconds`(Long|null, 평균 응답시간(초), 대상 0이면 필드 생략)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "period": { "from": "2026-07-06T00:00:00+09:00", "to": "2026-07-07T00:00:00+09:00" },
      "grossSales": 1250000, "netSales": 1180000, "orderCount": 18, "newMemberCount": 5, "waitingInquiryCount": 7, "avgResponseSeconds": 7200 } }
  ```
- **에러**: `COMMON_INVALID_REQUEST`(400 — 미지 프리셋, 역전 기간 from>to)
- **⚠️ 특이사항**: **`netSales`는 음수 가능**(총매출 order_date·환불 completed_date 귀속이 달라 발생주의상 정상 — 클램프 안 함). 프론트는 음수 표시 대비 필요.

#### D-2. `GET /api/v1/admin/dashboard/sales-trend` — 일별 매출 추이
- **쿼리**(택1): `days`(int, 기본 30, 1~90) **또는** `dateFrom`+`dateTo`(커스텀). 빈 날은 0으로 채워 연속 배열.
- **응답 200** `SalesTrendResponse`: `points`(배열). `points[]` `SalesTrendPoint`: `date`(LocalDate, KST 일자 `YYYY-MM-DD`) · `grossSales`(BigDecimal) · `netSales`(BigDecimal, **음수 가능**) · `orderCount`(long)
  ```json
  { "code": "SUCCESS", "message": "요청 처리 완료",
    "data": { "points": [
      { "date": "2026-07-05", "grossSales": 300000, "netSales": 300000, "orderCount": 4 },
      { "date": "2026-07-06", "grossSales": 0, "netSales": -50000, "orderCount": 0 } ] } }
  ```
- **에러**: `COMMON_INVALID_REQUEST`(400 — days 범위 초과, 역전 기간)
- **⚠️ 특이사항**: **일별 `netSales`는 summary보다 더 자주·크게 음수**가 될 수 있다(특정일 환불 완료 몰림). 차트 축을 음수까지 그려야 함.
