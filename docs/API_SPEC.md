# MICOZ 사용자 REST API 명세서

> **버전**: v0.1 / M0~M6 완료 기준
> **베이스 URL**: `http://localhost:8080` (로컬)
> **인증 방식**: JWT Bearer
> **콘텐츠 타입**: `application/json; charset=utf-8`

---

## 0. 공통 사양

### 0.1 공통 응답 봉투 (`ApiResponse<T>`)

모든 응답은 다음 구조를 따른다. `data`가 `null`인 경우 직렬화 시 생략된다 (`@JsonInclude(NON_NULL)`).

```json
{
  "code": "SUCCESS",
  "message": "요청 처리 완료",
  "data": { /* 엔드포인트별 응답 본문 */ }
}
```

성공 시 항상 `code="SUCCESS"`, `message="요청 처리 완료"`.

### 0.2 페이징 응답 (`PageResponse<T>`)

```json
{
  "content": [ /* T 배열 */ ],
  "page": 0,
  "size": 20,
  "totalElements": 5,
  "totalPages": 1
}
```

페이징 쿼리 파라미터: `page` (0부터, default 0), `size` (default 20), `sort` (e.g. `productSeq,desc`)

### 0.3 공통 에러 응답

```json
{
  "code": "ORDER_AMOUNT_MISMATCH",
  "message": "주문 금액이 일치하지 않습니다."
}
```

`code`는 `ErrorCode` enum 이름. `message`는 기본 메시지. (응답 본문에는 `data` 필드 자체가 노출되지 않음 — null 제외)

### 0.4 ErrorCode 일람

| code | HTTP | 기본 메시지 |
|---|---|---|
| `COMMON_VALIDATION_ERROR` | 400 | 요청 값이 올바르지 않습니다. |
| `COMMON_INVALID_REQUEST` | 400 | 잘못된 요청입니다. |
| `COMMON_RESOURCE_NOT_FOUND` | 404 | 리소스를 찾을 수 없습니다. |
| `COMMON_METHOD_NOT_ALLOWED` | 405 | 지원하지 않는 HTTP 메서드입니다. |
| `COMMON_INTERNAL_ERROR` | 500 | 서버 내부 오류가 발생했습니다. |
| `AUTH_INVALID_CREDENTIALS` | 401 | 아이디 또는 비밀번호가 올바르지 않습니다. |
| `AUTH_TOKEN_EXPIRED` | 401 | 토큰이 만료되었습니다. |
| `AUTH_TOKEN_INVALID` | 401 | 유효하지 않은 토큰입니다. |
| `AUTH_UNAUTHORIZED` | 401 | 인증이 필요합니다. |
| `AUTH_FORBIDDEN` | 403 | 접근 권한이 없습니다. |
| `USER_NOT_FOUND` | 404 | 사용자를 찾을 수 없습니다. |
| `USER_DUPLICATED_ID` | 409 | 이미 사용 중인 아이디입니다. |
| `USER_AGREEMENT_REQUIRED` | 400 | 필수 약관에 동의해야 합니다. |
| `USER_REFERRER_NOT_FOUND` | 400 | 추천인을 찾을 수 없습니다. |
| `PRODUCT_NOT_FOUND` | 404 | 상품을 찾을 수 없습니다. |
| `PRODUCT_SOLD_OUT` | 409 | 품절된 상품입니다. |
| `CART_OPTION_REQUIRED` | 400 | 상품 옵션을 선택해주세요. |
| `CART_ITEM_NOT_FOUND` | 404 | 장바구니 항목을 찾을 수 없습니다. |
| `ORDER_NOT_FOUND` | 404 | 주문을 찾을 수 없습니다. |
| `ORDER_AMOUNT_MISMATCH` | 400 | 주문 금액이 일치하지 않습니다. |
| `ORDER_INVALID_STATUS` | 409 | 현재 주문 상태에서 처리할 수 없습니다. |
| `ORDER_EMPTY_ITEMS` | 400 | 주문 항목이 없습니다. |
| `ADDRESS_NOT_FOUND` | 404 | 배송지를 찾을 수 없습니다. |
| `ADDRESS_REQUIRED` | 400 | 배송지 정보가 필요합니다. |
| `PAY_APPROVAL_FAILED` | 502 | 결제 승인에 실패했습니다. |
| `RETURN_PERIOD_EXPIRED` | 409 | 반품 가능 기간이 만료되었습니다. |
| `RETURN_ITEM_INVALID` | 400 | 반품 대상 주문 상품이 올바르지 않습니다. |
| `RETURN_QUANTITY_EXCEEDED` | 400 | 반품 수량이 주문 수량을 초과했습니다. |
| `RETURN_NOT_FOUND` | 404 | 반품 신청을 찾을 수 없습니다. |
| `RETURN_EMPTY_ITEMS` | 400 | 반품 대상 상품이 없습니다. |
| `REVIEW_NOT_FOUND` | 404 | 리뷰를 찾을 수 없습니다. |
| `REVIEW_NOT_ALLOWED` | 403 | 리뷰를 작성할 수 없는 상품/주문입니다. |
| `REVIEW_ALREADY_WRITTEN` | 409 | 이미 리뷰가 작성된 주문 상품입니다. |
| `COUPON_NOT_APPLICABLE` | 400 | 사용할 수 없는 쿠폰입니다. |
| `POINT_INSUFFICIENT` | 400 | 보유 포인트가 부족합니다. |
| `INQUIRY_NOT_FOUND` | 404 | 문의를 찾을 수 없습니다. |

> 모든 응답 HTTP Status는 `ApiResponse.error(...)`가 반환되더라도 Spring MVC가 200을 반환할 수 있으며, 401/403만 Security 단에서 직접 상태를 설정한다. **클라이언트는 항상 응답 본문의 `code`를 기준으로 분기해야 한다.** (실제 검증 시 `200 + code != SUCCESS`로 비즈니스 오류가 전달되는 케이스 확인됨)

### 0.5 인증 헤더

인증 필요한 엔드포인트는 다음 헤더 필수:

```
Authorization: Bearer {accessToken}
```

미인증 시 응답:
```json
{ "code": "AUTH_UNAUTHORIZED", "message": "인증이 필요합니다." }
```
(HTTP 401, `JwtAuthenticationEntryPoint` 처리)

### 0.6 Security 정책 요약 (`SecurityConfig`)

| 경로 | 정책 |
|---|---|
| `POST /api/v1/auth/logout` | authenticated |
| `/api/v1/auth/**` (그 외) | permitAll |
| `GET /api/v1/categories/**` | permitAll |
| `GET /api/v1/products/**` | permitAll |
| `GET /api/v1/banners/**` | permitAll |
| `/v3/api-docs/**`, `/swagger-ui/**`, `/actuator/health,info,metrics/**,prometheus` | permitAll |
| 그 외 모두 | authenticated |

---

# 1. 인증 / 계정 (Auth)

## 1.1 회원가입

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/auth/signup` |
| 인증 | 불필요 (permitAll) |
| 설명 | 약관 동의·BCrypt 해시·추천인(선택) 검증 후 가입 |

### Request Body — `SignupRequest`

| 필드 | 타입 | 필수 | 제약 | 설명 |
|---|---|---|---|---|
| userId | string | ✅ | NotBlank, Size 4~50 | 로그인 아이디 |
| userPw | string | ✅ | NotBlank, Size 8~64 | 평문 비밀번호 |
| userName | string | ✅ | NotBlank, Size ≤100 | 이름 |
| email | string | ❌ | @Email, Size ≤100 | 이메일 |
| phone | string | ❌ | Size ≤20 | 연락처 |
| serviceYn | string | ✅ | "Y"여야 (`@AssertTrue`) | 이용약관 동의 |
| privacyYn | string | ✅ | "Y"여야 (`@AssertTrue`) | 개인정보 동의 |
| marketingYn | string | ❌ | "Y"/"N" | 마케팅 동의 |
| referrerUserId | string | ❌ | Size ≤50 | 추천인 아이디 (입력 시 실존 검증) |

**예시:**
```json
{
  "userId": "alice",
  "userPw": "pass1234",
  "userName": "앨리스",
  "email": "alice@example.com",
  "phone": "010-1234-5678",
  "serviceYn": "Y",
  "privacyYn": "Y",
  "marketingYn": "N",
  "referrerUserId": "ROOT"
}
```

### Response — `SignupResponse`

| 필드 | 타입 | 설명 |
|---|---|---|
| userSeq | long | 생성된 사용자 PK |
| userId | string | 가입된 아이디 |
| referrerUserId | string | 추천인 아이디(있을 때만 직렬화) |

**예시:**
```json
{
  "code": "SUCCESS",
  "message": "요청 처리 완료",
  "data": { "userSeq": 3, "userId": "alice", "referrerUserId": "ROOT" }
}
```

### 상태 코드/에러
| code | HTTP | 발생 조건 |
|---|---|---|
| SUCCESS | 200 | 정상 |
| COMMON_VALIDATION_ERROR | 400 | 필드 검증 실패(약관 미동의 포함) |
| USER_REFERRER_NOT_FOUND | 400 | 입력한 추천인이 미존재 |
| USER_DUPLICATED_ID | 409 | userId 중복 |

---

## 1.2 로그인 / 토큰 발급

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/auth/login` |
| 인증 | 불필요 |
| 설명 | access(30분) + refresh(14일) 발급. refresh는 SHA-256 해시로 DB 저장, raw 값만 응답 |

### Request — `LoginRequest`

| 필드 | 타입 | 필수 | 제약 | 설명 |
|---|---|---|---|---|
| userId | string | ✅ | NotBlank | 아이디 |
| userPw | string | ✅ | NotBlank | 비밀번호 |

```json
{ "userId": "alice", "userPw": "pass1234" }
```

### Response — `TokenResponse`

| 필드 | 타입 | 설명 |
|---|---|---|
| accessToken | string | JWT HS256 |
| refreshToken | string | Base64URL 32바이트 (raw) |
| tokenType | string | 항상 "Bearer" |
| accessTokenExpiresIn | long | access 만료 초 (`1800`) |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "4KyuJV3eYj5Hu7Pp...",
    "tokenType": "Bearer",
    "accessTokenExpiresIn": 1800
  }
}
```

### 상태 코드/에러
| code | HTTP | 발생 |
|---|---|---|
| SUCCESS | 200 | 정상 |
| AUTH_INVALID_CREDENTIALS | 401 | 아이디 없음/비밀번호 불일치 (열거방지로 동일 응답) |
| COMMON_VALIDATION_ERROR | 400 | 필드 누락 |

---

## 1.3 토큰 갱신 (Rotation)

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/auth/refresh` |
| 인증 | 불필요 |
| 설명 | 유효 refresh → 새 access+refresh 발급, 이전 refresh revoke. 재사용 탐지 시 해당 사용자 전체 토큰 무효화 |

### Request — `RefreshRequest`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| refreshToken | string | ✅ | 직전 발급 raw refresh |

### Response — `TokenResponse` (1.2와 동일)

### 상태 코드/에러
| code | HTTP | 발생 |
|---|---|---|
| SUCCESS | 200 | 정상 rotation |
| AUTH_TOKEN_INVALID | 401 | 위조/이미 revoked (재사용 시 전체 무효화) |
| AUTH_TOKEN_EXPIRED | 401 | 만료 |

---

## 1.4 로그아웃

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/auth/logout` |
| 인증 | **필요** (Bearer) |
| 설명 | 본인의 refresh 1건을 revoke. 없거나 이미 revoked → 멱등 SUCCESS |

### Request — `LogoutRequest`
| 필드 | 타입 | 필수 |
|---|---|---|
| refreshToken | string | ✅ |

### Response
```json
{ "code": "SUCCESS", "message": "요청 처리 완료" }
```

### 상태 코드/에러
| code | HTTP | 발생 |
|---|---|---|
| SUCCESS | 200 | 정상 / 멱등 |
| AUTH_UNAUTHORIZED | 401 | 미인증 |
| AUTH_FORBIDDEN | 403 | 다른 사용자 refresh 시도 (추정 — 서비스에서 `BusinessException(AUTH_FORBIDDEN)` 발생 가능) |

---

## 1.5 아이디 찾기

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/auth/find-id` |
| 인증 | 불필요 |
| 설명 | 이름+이메일 일치 시 userId 반환, 미일치도 200 응답 (NFR-07 열거방지) |

### Request — `FindIdRequest`
| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| userName | string | ✅ | NotBlank |
| email | string | ✅ | NotBlank, @Email |

### Response — `FindIdResponse`
| 필드 | 타입 | 설명 |
|---|---|---|
| userId | string | 본인확인 통과 시 노출, 미통과 시 null (직렬화 생략) |

```json
{ "code": "SUCCESS", "message": "요청 처리 완료", "data": { "userId": "alice" } }
```

---

## 1.6 비밀번호 재설정

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/auth/reset-password` |
| 인증 | 불필요 |
| 설명 | userId+userName+email 모두 일치 시 새 비밀번호로 변경 + 전체 refresh revoke. 미일치도 동일 SUCCESS 응답 (비노출) |

### Request — `ResetPasswordRequest`
| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| userId | string | ✅ | NotBlank |
| userName | string | ✅ | NotBlank |
| email | string | ✅ | NotBlank, @Email |
| newPassword | string | ✅ | NotBlank, Size 8~64 |

### Response
```json
{ "code": "SUCCESS", "message": "요청 처리 완료" }
```

---

# 2. 마이페이지 — 회원정보 (Me)

## 2.1 내 정보 조회

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me` |
| 인증 | **필요** |

### Response — `UserInfoResponse` (추정 필드 — M1-T8 서비스 산출)

| 필드 | 타입 | 설명 |
|---|---|---|
| userSeq | long | PK |
| userId | string | 아이디 |
| userName | string | 이름 |
| userRole | string | CUSTOMER 등 |
| userStatus | string | ACTIVE/INACTIVE |
| email | string | 이메일 |
| phone | string | 연락처 |
| birthDate | string (YYYY-MM-DD) | 생일 (추정) |
| zipCode, address, addressDetail | string | 주소 (추정) |
| gradeCode | string | MEMBER/SELLER/MASTER/SENIOR/EXECUTIVE |
| gradeName | string | 회원/셀러/마스터/상무/전무 |
| referrerUserId | string | 추천인 (있을 때만) |
| pointBalance | int | 포인트 잔액 |
| lastLoginDate | string (ISO-8601) | 최근 로그인 |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "userSeq": 2, "userId": "alice", "userName": "앨리스",
    "userRole": "CUSTOMER", "userStatus": "ACTIVE",
    "email": "alice@example.com", "phone": "010-1234-5678",
    "gradeCode": "MEMBER", "gradeName": "회원",
    "pointBalance": 2500,
    "lastLoginDate": "2026-06-10T01:46:25Z"
  }
}
```

| code | HTTP | 발생 |
|---|---|---|
| SUCCESS | 200 | 정상 |
| AUTH_UNAUTHORIZED | 401 | 미인증 |
| USER_NOT_FOUND | 404 | 사용자 미존재(추정 — Service에서 발생 가능) |

---

## 2.2 내 정보 수정

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `PATCH /api/v1/me` |
| 인증 | **필요** |

### Request — `UpdateUserRequest` (추정 — 부분 업데이트, 모두 optional)
| 필드 | 타입 | 제약 |
|---|---|---|
| userName | string | Size ≤100 |
| email | string | @Email |
| phone | string | Size ≤20 |
| birthDate | string (YYYY-MM-DD) | — |
| zipCode, address, addressDetail | string | — |

### Response — `UserInfoResponse` (2.1과 동일)

---

## 2.3 비밀번호 변경

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `PUT /api/v1/me/password` |
| 인증 | **필요** |
| 설명 | 현재 비번 검증 → BCrypt 해시 → **사용자의 모든 활성 refresh revoke** |

### Request — `ChangePasswordRequest`
| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| currentPassword | string | ✅ | NotBlank |
| newPassword | string | ✅ | NotBlank, Size 8~64 |

### Response
```json
{ "code": "SUCCESS", "message": "요청 처리 완료" }
```

| code | HTTP | 발생 |
|---|---|---|
| SUCCESS | 200 | 정상 |
| AUTH_INVALID_CREDENTIALS | 401 | currentPassword 불일치 |
| AUTH_UNAUTHORIZED | 401 | 미인증 |

---

# 3. 배송지 (Addresses)

## 3.1 배송지 목록 조회

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me/addresses` |
| 인증 | **필요** |
| 정렬 | `default_yn DESC, address_seq DESC` (기본 배송지가 첫 행) |

### Response — `List<AddressResponse>`

| 필드 | 타입 | 설명 |
|---|---|---|
| addressSeq | long | PK |
| addressName | string | 별칭(집/회사 등) |
| recipientName | string | 수령인 |
| recipientPhone | string | 연락처 |
| zipCode | string | 우편번호 |
| address | string | 기본 주소 |
| addressDetail | string | 상세 주소 |
| defaultYn | string | "Y"/"N" |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": [
    { "addressSeq": 2, "addressName": "회사", "recipientName": "앨리스", "recipientPhone": "010-3333-4444", "zipCode": "06234", "address": "서울 강남구 역삼동", "addressDetail": "5층", "defaultYn": "Y" },
    { "addressSeq": 1, "addressName": "집", "recipientName": "앨리스", "recipientPhone": "010-1111-2222", "zipCode": "06000", "address": "서울 강남구 테헤란로 1", "addressDetail": "101호", "defaultYn": "N" }
  ]
}
```

---

## 3.2 배송지 등록

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/me/addresses` |
| 인증 | **필요** |
| 동작 | 첫 배송지는 자동 기본 승격. `isDefault=true`이면 기존 default 해제 |

### Request — `CreateAddressRequest`

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| addressName | string | ❌ | Size ≤100 |
| recipientName | string | ✅ | NotBlank, Size ≤100 |
| recipientPhone | string | ✅ | NotBlank, Size ≤20 |
| zipCode | string | ✅ | NotBlank, Size ≤10 |
| address | string | ✅ | NotBlank, Size ≤500 |
| addressDetail | string | ❌ | Size ≤500 |
| isDefault | boolean | ❌ | — |

### Response — `AddressResponse` (3.1과 동일)

| code | HTTP | 발생 |
|---|---|---|
| SUCCESS | 200 | 정상 |
| COMMON_VALIDATION_ERROR | 400 | 필수 누락 |

---

## 3.3 배송지 수정

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `PATCH /api/v1/me/addresses/{addressSeq}` |
| 인증 | **필요** |

### Path Variable
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| addressSeq | long | ✅ | 배송지 PK |

### Request — `UpdateAddressRequest` (모두 optional, 부분 업데이트)
| 필드 | 타입 | 제약 |
|---|---|---|
| addressName | string | Size ≤100 |
| recipientName | string | Size ≤100 |
| recipientPhone | string | Size ≤20 |
| zipCode | string | Size ≤10 |
| address | string | Size ≤500 |
| addressDetail | string | Size ≤500 |

### Response — `AddressResponse`

| code | HTTP | 발생 |
|---|---|---|
| SUCCESS | 200 | 정상 |
| ADDRESS_NOT_FOUND | 404 | 본인 행 아님 / 미존재 |

---

## 3.4 배송지 삭제 (Soft)

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `DELETE /api/v1/me/addresses/{addressSeq}` |
| 인증 | **필요** |
| 동작 | `use_yn='N'` 마킹 |

### Response
```json
{ "code": "SUCCESS", "message": "요청 처리 완료" }
```

| code | HTTP | 발생 |
|---|---|---|
| ADDRESS_NOT_FOUND | 404 | 본인 행 아님 |

---

## 3.5 기본 배송지 설정

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `PUT /api/v1/me/addresses/{addressSeq}/default` |
| 인증 | **필요** |
| 동작 | 기존 default 모두 N → 대상 행 Y |

### Response — `AddressResponse` (3.1과 동일 형식)

---

# 4. 카탈로그 (Catalog)

## 4.1 카테고리 트리 조회

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/categories` |
| 인증 | 불필요 (permitAll) |

### Response — `List<CategoryNode>` (재귀)

| 필드 | 타입 | 설명 |
|---|---|---|
| categorySeq | long | PK |
| categoryName | string | 이름 |
| urlSlug | string | URL용 슬러그 |
| sortOrder | int | 정렬값 |
| children | array | 하위 노드 (없을 때 생략) |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": [
    {
      "categorySeq": 1, "categoryName": "스킨케어", "urlSlug": "skincare", "sortOrder": 1,
      "children": [
        { "categorySeq": 4, "categoryName": "토너", "urlSlug": "toner", "sortOrder": 1 },
        { "categorySeq": 5, "categoryName": "에센스/앰플", "urlSlug": "essence-ampoule", "sortOrder": 2 }
      ]
    }
  ]
}
```

---

## 4.2 상품 목록

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/products` |
| 인증 | 불필요 |

### Query Parameters
| 이름 | 타입 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| categorySeq | long | ❌ | — | 카테고리 PK 필터 |
| page | int | ❌ | 0 | 페이지 인덱스 |
| size | int | ❌ | 20 | 페이지 크기 |
| sort | string | ❌ | `productSeq,desc` | 정렬 (예: `basePrice,asc`) |

### Response — `PageResponse<ProductListItem>`

`ProductListItem`:
| 필드 | 타입 | 설명 |
|---|---|---|
| productSeq | long | PK |
| productCode | string | 상품 코드 |
| productName | string | 이름 |
| productStatus | string | ON_SALE/SOLD_OUT 등 |
| basePrice | decimal | 정가 |
| shortDesc | string | 짧은 설명 |
| mainImageUrl | string | 대표 이미지 URL |
| labels | array<string> | BEST/NEW/SALE/HIT 등 |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "content": [
      { "productSeq": 5, "productCode": "MZ-BD-001", "productName": "모이스처 바디로션", "productStatus": "ON_SALE",
        "basePrice": 19000.00, "shortDesc": "데일리 보습 바디로션",
        "mainImageUrl": "https://cdn.../MZ-BD-001-main.jpg", "labels": ["BEST","SALE"] }
    ],
    "page": 0, "size": 20, "totalElements": 5, "totalPages": 1
  }
}
```

---

## 4.3 상품 상세

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/products/{productSeq}` |
| 인증 | 불필요 |

### Path Variable
| 이름 | 타입 | 필수 |
|---|---|---|
| productSeq | long | ✅ |

### Response — `ProductDetailResponse`

| 필드 | 타입 | 설명 |
|---|---|---|
| productSeq, productCode, productName, productStatus | — | 기본 정보 |
| basePrice | decimal | 정가 |
| shortDesc, detailDesc, ingredientInfo, usageInfo | string | 본문/성분/사용법 (TEXT) |
| category | object | `{ categorySeq, categoryName, urlSlug }` |
| images | array | `{ imageSeq, imageType(MAIN/SUB/DETAIL), imageUrl, imageAlt, sortOrder }` |
| options | array | `{ optionSeq, optionName, finalPrice, stockQty, sortOrder }` |
| labels | array<string> | 라벨명 정렬순 |
| reviewSummary | object | `{ count, averageRating }` (BigDecimal scale=1) |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "productSeq": 2, "productCode": "MZ-ES-001", "productName": "비타 에센스", "productStatus": "ON_SALE",
    "basePrice": 45000.00, "shortDesc": "비타민 가득 광채 에센스",
    "detailDesc": "...", "ingredientInfo": "...", "usageInfo": "...",
    "category": { "categorySeq": 5, "categoryName": "에센스/앰플", "urlSlug": "essence-ampoule" },
    "images": [ { "imageSeq": 2, "imageType": "MAIN", "imageUrl": "https://...", "imageAlt": "비타 에센스", "sortOrder": 1 } ],
    "options": [
      { "optionSeq": 3, "optionName": "30ml", "finalPrice": 45000.00, "stockQty": 100, "sortOrder": 1 },
      { "optionSeq": 4, "optionName": "50ml", "finalPrice": 68000.00, "stockQty": 60, "sortOrder": 2 }
    ],
    "labels": ["BEST","NEW"],
    "reviewSummary": { "count": 1, "averageRating": 5.0 }
  }
}
```

| code | HTTP | 발생 |
|---|---|---|
| SUCCESS | 200 | 정상 |
| PRODUCT_NOT_FOUND | 404 | 미존재 / 비활성 |

---

## 4.4 추천/베스트 상품

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/products/featured` |
| 인증 | 불필요 |

### Query Parameters
| 이름 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| label | string | `BEST` | 라벨명 (BEST/NEW/HIT/SALE) |
| limit | int | 4 | 최대 개수 |

### Response — `List<ProductListItem>` (4.2 형식 동일)

라벨 미존재 시 빈 배열 반환 (에러 아님).

---

## 4.5 히어로 배너

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/banners` |
| 인증 | 불필요 |
| 동작 | `banner_type='HERO'` & `display_yn='Y'` & `use_yn='Y'` 정렬순 |

### Response — `List<BannerResponse>`

| 필드 | 타입 | 설명 |
|---|---|---|
| bannerSeq | long | PK |
| bannerType | string | "HERO" |
| title | string | 제목 |
| description | string | 설명 |
| imageUrl | string | 이미지 |
| linkUrl | string | 링크 |
| sortOrder | int | 정렬 |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": [
    { "bannerSeq": 1, "bannerType": "HERO", "title": "봄 컬렉션", "description": "봄의 광채를 담은 새 시즌 컬렉션",
      "imageUrl": "https://cdn.../spring-collection.jpg", "linkUrl": "/collections/spring", "sortOrder": 1 }
  ]
}
```

---

# 5. 장바구니 (Cart)

## 5.1 담기

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/cart` |
| 인증 | **필요** |
| 동작 | 동일 (product+option) 재담기 시 **수량 합산** |

### Request — `AddCartRequest`

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| productSeq | long | ✅ | NotNull |
| optionSeq | long | ❌ (옵션 있는 상품은 필수) | — |
| quantity | int | ✅ | NotNull, Min 1 |

### Response — `CartItemResponse`

| 필드 | 타입 |
|---|---|
| cartSeq, productSeq, productCode, productName | — |
| optionSeq, optionName | — |
| unitPrice | decimal |
| quantity | int |
| itemTotal | decimal (unit × qty) |
| mainImageUrl | string |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "cartSeq": 1, "productSeq": 1, "productCode": "MZ-TN-001", "productName": "글로우 토너",
    "optionSeq": 1, "optionName": "150ml",
    "unitPrice": 28000.00, "quantity": 2, "itemTotal": 56000.00,
    "mainImageUrl": "https://cdn.../MZ-TN-001-main.jpg"
  }
}
```

### 에러
| code | HTTP | 발생 |
|---|---|---|
| AUTH_UNAUTHORIZED | 401 | 미인증 |
| PRODUCT_NOT_FOUND | 404 | 비활성 상품 |
| CART_OPTION_REQUIRED | 400 | 옵션 있는 상품에 optionSeq 미입력 / 잘못된 옵션 |
| PRODUCT_SOLD_OUT | 409 | 합산 수량이 재고 초과 |

---

## 5.2 장바구니 조회

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/cart` |
| 인증 | **필요** |

### Response — `CartListResponse`

| 필드 | 타입 | 설명 |
|---|---|---|
| items | array<CartItemResponse> | 5.1 형식 |
| itemCount | int | 항목 수 |
| totalAmount | decimal | 합계 |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "items": [ { "cartSeq": 1, "productName": "글로우 토너", "optionName": "150ml", "unitPrice": 28000.00, "quantity": 5, "itemTotal": 140000.00, "mainImageUrl": "..." } ],
    "itemCount": 1,
    "totalAmount": 140000.00
  }
}
```

---

## 5.3 수량 변경

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `PATCH /api/v1/cart/{cartSeq}` |
| 인증 | **필요** |

### Request — `UpdateCartQuantityRequest`
| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| quantity | int | ✅ | NotNull, Min 1 |

### Response — `CartItemResponse` (5.1과 동일)

| code | HTTP | 발생 |
|---|---|---|
| CART_ITEM_NOT_FOUND | 404 | 본인 행 아님 / 미존재 (비노출 정책) |
| PRODUCT_SOLD_OUT | 409 | 재고 초과 |

---

## 5.4 장바구니 단건 삭제

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `DELETE /api/v1/cart/{cartSeq}` |
| 인증 | **필요** |

### Response
```json
{ "code": "SUCCESS", "message": "요청 처리 완료" }
```

| code | HTTP | 발생 |
|---|---|---|
| CART_ITEM_NOT_FOUND | 404 | 본인 행 아님 |

---

# 6. 찜 (Favorites)

## 6.1 찜 토글

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/me/favorites/{productSeq}` |
| 인증 | **필요** |
| 동작 | 이미 찜이면 해제, 없으면 추가 |

### Path Variable
| 이름 | 타입 |
|---|---|
| productSeq | long |

### Response — `ToggleFavResponse`
| 필드 | 타입 | 설명 |
|---|---|---|
| productSeq | long | — |
| favorited | boolean | 결과 상태 |

```json
{ "code": "SUCCESS", "message": "요청 처리 완료", "data": { "productSeq": 1, "favorited": true } }
```

| code | HTTP | 발생 |
|---|---|---|
| PRODUCT_NOT_FOUND | 404 | 비활성/미존재 |

---

## 6.2 찜 명시 해제

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `DELETE /api/v1/me/favorites/{productSeq}` |
| 인증 | **필요** |
| 동작 | 없어도 멱등 SUCCESS |

```json
{ "code": "SUCCESS", "message": "요청 처리 완료" }
```

---

## 6.3 내 찜 목록

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me/favorites` |
| 인증 | **필요** |

### Query Parameters
- `page`, `size`, `sort` (기본 `productSeq,desc`)

### Response — `PageResponse<ProductListItem>` (4.2 형식)

---

# 7. 주문 / 결제 (Orders)

## 7.1 주문 생성 (체크아웃)

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/orders` |
| 인증 | **필요** |
| 동작 | 카트 → 서버 금액 재계산 → 스냅샷 저장 → PENDING 생성 |

### Request — `CreateOrderRequest`

| 필드 | 타입 | 필수 | 제약 | 설명 |
|---|---|---|---|---|
| cartSeqs | array<long> | ✅ | NotEmpty | 주문 대상 cart_seq 배열 |
| addressSeq | long | ❌ | — | 저장된 배송지 (없으면 아래 신규 필드 필수) |
| recipientName | string | △ | NotBlank when addressSeq 없음 | 수령인 |
| recipientPhone | string | △ | NotBlank when addressSeq 없음 | 연락처 |
| zipCode | string | △ | NotBlank when addressSeq 없음 | 우편번호 |
| address | string | △ | NotBlank when addressSeq 없음 | 주소 |
| addressDetail | string | ❌ | — | 상세 |
| shippingMemo | string | ❌ | — | 배송 메모 |
| isRemote | boolean | ❌ | — | 도서산간 |
| clientAmount | decimal | ✅ | NotNull | 클라이언트 합계 (서버 재계산값과 일치 필요) |

### Response — `OrderCreatedResponse`

| 필드 | 타입 | 설명 |
|---|---|---|
| orderSeq | long | PK |
| orderNo | string | `MZ-{yyMMdd}-{NNNNN}` |
| orderStatus | string | "PENDING" |
| itemsTotal | decimal | 상품 합계 |
| totalDiscount | decimal | 할인 합계 (M6 미적용 — 0) |
| shippingFee | decimal | 배송비 |
| finalAmount | decimal | 최종 결제 금액 |
| pointToEarn | int | 적립 예정 |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "orderSeq": 1, "orderNo": "MZ-260608-15652", "orderStatus": "PENDING",
    "itemsTotal": 56000.00, "totalDiscount": 0, "shippingFee": 0, "finalAmount": 56000.00, "pointToEarn": 0
  }
}
```

### 에러
| code | HTTP | 발생 |
|---|---|---|
| ORDER_EMPTY_ITEMS | 400 | cartSeqs 빈 배열 |
| CART_ITEM_NOT_FOUND | 404 | 본인 행 아닌 cartSeq |
| PRODUCT_NOT_FOUND | 404 | 비활성 상품 포함 |
| PRODUCT_SOLD_OUT | 409 | 재고 부족 |
| CART_OPTION_REQUIRED | 400 | 옵션 정합 오류 |
| ORDER_AMOUNT_MISMATCH | 400 | clientAmount ≠ 서버 재계산 |
| ADDRESS_NOT_FOUND | 404 | 잘못된 addressSeq |
| ADDRESS_REQUIRED | 400 | 배송지 미지정 |

---

## 7.2 결제 처리

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/orders/{orderSeq}/pay` |
| 인증 | **필요** |
| 동작 | PG 승인 → 재고 차감(PAID 시점) → PAID 전이 → 카트 자동 정리 |

### Path Variable
| 이름 | 타입 |
|---|---|
| orderSeq | long |

### Request — `PayOrderRequest`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| paymentType | string | ✅ | CARD / KAKAO / NAVER |
| cardNo | string | ❌ | 전체 카드번호 (서버 마스킹) |
| installment | int | ❌ | 할부 개월 |

> 모의 PG 규칙: `cardNo == "4000-0000-0000-0002"` → 거절 / amount ≤ 0 → 거절 / 그 외 승인.

### Response — `PayOrderResponse`

| 필드 | 타입 | 설명 |
|---|---|---|
| orderNo | string | — |
| orderStatus | string | "PAID" |
| paymentStatus | string | "PAID" |
| paidAmount | decimal | — |
| approvalNo | string | `MZAPV...` |
| cardCompany | string | "모의카드" |
| cardNoMasked | string | `XXXX-XXXX-XXXX-1234` |
| pointToEarn | int | — |
| paidDate | string (ISO-8601) | — |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "orderNo": "MZ-260608-15652", "orderStatus": "PAID", "paymentStatus": "PAID",
    "paidAmount": 56000.00, "approvalNo": "MZAPV443119688784",
    "cardCompany": "모의카드", "cardNoMasked": "XXXX-XXXX-XXXX-3456",
    "pointToEarn": 0, "paidDate": "2026-06-09T06:40:13Z"
  }
}
```

### 에러
| code | HTTP | 발생 |
|---|---|---|
| ORDER_NOT_FOUND | 404 | 타인 주문 / 미존재 |
| ORDER_INVALID_STATUS | 409 | PAID 등 PENDING이 아님 |
| PAY_APPROVAL_FAILED | 502 | PG 거절. 주문 PENDING 유지 (재시도 가능) |
| PRODUCT_SOLD_OUT | 409 | 차감 시점 재고 부족 (PG 자동 취소) |

---

## 7.3 내 주문 목록

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me/orders` |
| 인증 | **필요** |

### Query Parameters — `page`, `size`, `sort` (기본 `orderSeq,desc`)

### Response — `PageResponse<OrderListItem>`

`OrderListItem`:
| 필드 | 타입 | 설명 |
|---|---|---|
| orderSeq | long | — |
| orderNo | string | — |
| orderStatus | string | PENDING/PAID/SHIPPED/DELIVERED/... |
| orderDate | string (ISO-8601) | 주문일시 |
| finalAmount | decimal | — |
| firstItemName | string | 첫 상품명 (대표) |
| totalItemCount | int | 항목 수 |
| mainImageUrl | string | 첫 상품 대표 이미지 |

---

## 7.4 내 주문 상세

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me/orders/{orderSeq}` |
| 인증 | **필요** |

### Response — `OrderDetailResponse`

| 필드 | 타입 | 설명 |
|---|---|---|
| orderSeq, orderNo, orderStatus, orderDate | — | 기본 |
| itemsTotal, totalDiscount, couponDiscount, pointUsed | decimal/int | 금액 |
| shippingFee, finalAmount, pointToEarn | — | 금액 |
| items | array | OrderItemSnapshot[] (스냅샷 + mainImageUrl) |
| shipping | object | OrderShippingInfo (수령인/주소/배송상태/운송장/배송완료일 등) |
| payment | object | OrderPaymentInfo (**PAID**인 것만 노출, 없으면 null) |

`OrderItemSnapshot`:
| 필드 | 타입 |
|---|---|
| itemSeq, productSeq, optionSeq | long |
| productCode, productName, optionName | string |
| unitPrice | decimal |
| quantity | int |
| itemAmount | decimal |
| mainImageUrl | string |

`OrderShippingInfo`:
| 필드 | 타입 |
|---|---|
| recipientName, recipientPhone | string |
| zipCode, address, addressDetail, shippingMemo | string |
| trackingNo | string |
| shippingStatus | string (READY/SHIPPED/IN_TRANSIT/DELIVERED) |
| shippedDate, deliveredDate | string (ISO-8601) |

`OrderPaymentInfo`:
| 필드 | 타입 |
|---|---|
| paymentType, paymentStatus | string |
| paidAmount | decimal |
| cardCompany, cardNoMasked | string |
| installment | int |
| approvalNo | string |
| paidDate | string (ISO-8601) |

| code | HTTP | 발생 |
|---|---|---|
| ORDER_NOT_FOUND | 404 | 타인/미존재 |

---

# 8. 반품 (Returns)

## 8.1 반품 신청

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/me/orders/{orderSeq}/returns` |
| 인증 | **필요** |
| 동작 | REQUESTED 생성. RETURN/EXCHANGE는 DELIVERED 후 7일 이내 |

### Request — `CreateReturnRequest`

| 필드 | 타입 | 필수 | 제약 | 설명 |
|---|---|---|---|---|
| returnType | string | ✅ | NotBlank, 값: CANCEL/EXCHANGE/RETURN | 유형 |
| returnReasonType | string | ✅ | NotBlank, 값: CHANGE_OF_MIND/DEFECT/WRONG_DELIVERY/ETC | 사유 |
| returnReason | string | ❌ | — | 상세 사유 |
| items | array | ✅ | NotEmpty, @Valid | 반품 라인 |
| items[].itemSeq | long | ✅ | NotNull | 주문 라인 PK |
| items[].quantity | int | ✅ | NotNull, Min 1 | 반품 수량 |
| items[].exchangeOptionSeq | long | △ | EXCHANGE 시 필수 | 교환 대체 옵션 |
| pickupZipCode, pickupAddress, pickupAddressDetail, pickupPhone | string | ❌ | — | 회수지 |

```json
{
  "returnType": "RETURN",
  "returnReasonType": "DEFECT",
  "returnReason": "표면에 흠집이 있음",
  "items": [ { "itemSeq": 1, "quantity": 1 } ],
  "pickupZipCode": "06000", "pickupAddress": "서울 강남구",
  "pickupAddressDetail": "101호", "pickupPhone": "010-1111-2222"
}
```

### Response — `ReturnCreatedResponse`

| 필드 | 타입 | 설명 |
|---|---|---|
| returnSeq | long | PK |
| returnNo | string | `RT-{yyMMdd}-{NNNNN}` |
| returnType | string | — |
| returnStatus | string | "REQUESTED" |
| requestedDate | string (ISO-8601) | — |

### 에러
| code | HTTP | 발생 |
|---|---|---|
| ORDER_NOT_FOUND | 404 | 타인/미존재 주문 |
| ORDER_INVALID_STATUS | 409 | CANCEL은 PAID/PREPARING만, RETURN/EXCHANGE는 DELIVERED만 |
| RETURN_PERIOD_EXPIRED | 409 | DELIVERED 후 7일 초과 |
| RETURN_ITEM_INVALID | 400 | 본 주문에 속하지 않는 itemSeq |
| RETURN_QUANTITY_EXCEEDED | 400 | 누적 신청 수량 + 신규 > 주문 수량 |
| RETURN_EMPTY_ITEMS | 400 | items 빈 |
| COMMON_VALIDATION_ERROR | 400 | 타입/사유 enum 외, EXCHANGE인데 exchangeOptionSeq null |

---

## 8.2 내 반품 목록

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me/returns` |
| 인증 | **필요** |

### Query Parameters — `page`, `size`, `sort` (기본 `returnSeq,desc`)

### Response — `PageResponse<ReturnListItem>`

| 필드 | 타입 | 설명 |
|---|---|---|
| returnSeq | long | — |
| returnNo | string | — |
| orderSeq | long | 연결 주문 |
| orderNo | string | 주문번호 |
| returnType | string | — |
| returnStatus | string | REQUESTED/APPROVED/COLLECTED/INSPECTED/COMPLETED/REJECTED |
| returnReasonType | string | — |
| requestedDate | string (ISO-8601) | — |
| totalItemCount | int | 라인 수 |

---

## 8.3 내 반품 상세

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me/returns/{returnSeq}` |
| 인증 | **필요** |

### Response — `ReturnDetailResponse`

| 필드 | 타입 |
|---|---|
| returnSeq, returnNo, orderSeq, orderNo | — |
| returnType, returnStatus, returnReasonType, returnReason | string |
| returnShippingFee, refundAmount | decimal |
| pickupZipCode, pickupAddress, pickupAddressDetail, pickupPhone | string |
| requestedDate, completedDate | string (ISO-8601) |
| items | array<ReturnItemDto> |

`ReturnItemDto`:
| 필드 | 타입 |
|---|---|
| returnItemSeq, itemSeq, productSeq | long |
| productName, optionName | string |
| unitPrice | decimal |
| quantity | int |
| exchangeOptionSeq, exchangeOptionName | long/string |

| code | HTTP | 발생 |
|---|---|---|
| RETURN_NOT_FOUND | 404 | 타인/미존재 |

---

# 9. 리뷰 (Reviews)

## 9.1 리뷰 작성

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/reviews` |
| 인증 | **필요** |
| 정책 | 본인 주문 + DELIVERED 상태 + item당 1회 |

### Request — `CreateReviewRequest`

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| itemSeq | long | ✅ | NotNull |
| rating | int | ✅ | NotNull, Min 1, Max 5 |
| title | string | ❌ | Size ≤100 |
| content | string | ✅ | NotBlank, Size ≤500 |
| imageUrls | array<string> | ❌ | — (JSON 직렬화하여 TEXT 저장) |

```json
{
  "itemSeq": 1, "rating": 5,
  "title": "만족스러운 토너",
  "content": "수분감이 좋고 자극이 없어요.",
  "imageUrls": ["https://cdn.example.com/r1-a.jpg"]
}
```

### Response — `ReviewResponse`

| 필드 | 타입 | 설명 |
|---|---|---|
| reviewSeq, productSeq, itemSeq | long | — |
| userIdMasked | string | `al***` 형태 |
| rating | int | — |
| title, content | string | — |
| imageUrls | array<string> | 디시리얼라이즈 결과 |
| createdDate | string (ISO-8601) | — |

| code | HTTP | 발생 |
|---|---|---|
| REVIEW_NOT_ALLOWED | 403 | 본인 주문 아님 / DELIVERED 아님 / 잘못된 itemSeq |
| REVIEW_ALREADY_WRITTEN | 409 | 이미 작성 |
| COMMON_VALIDATION_ERROR | 400 | rating 범위 초과 등 |

---

## 9.2 상품 리뷰 조회

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/products/{productSeq}/reviews` |
| 인증 | **불필요** (permitAll) |

### Query Parameters — `page`, `size`, `sort` (기본 `reviewSeq,desc`)

### Response — `PageResponse<ReviewResponse>` (9.1과 동일)

---

## 9.3 내 리뷰 조회

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me/reviews` |
| 인증 | **필요** |

### Response — `PageResponse<ReviewResponse>`

---

# 10. 포인트 (Points)

## 10.1 포인트 잔액·이력

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me/points` |
| 인증 | **필요** |

### Query Parameters — `page`, `size`, `sort` (기본 `pointSeq,desc`)

### Response — `MyPointResponse`

| 필드 | 타입 | 설명 |
|---|---|---|
| balance | int | 현재 보유 잔액 (`mst_user.point_balance`) |
| history | PageResponse<PointHistoryItem> | 페이지 |

`PointHistoryItem`:
| 필드 | 타입 | 설명 |
|---|---|---|
| pointSeq | long | PK |
| pointType | string | EARN/USE/EXPIRE/CANCEL |
| pointAmount | int | 적립 양수, 사용 음수 |
| balanceAfter | int | 변동 후 잔액 |
| reason | string | 사유 |
| orderSeq | long | 관련 주문 |
| expireDate | string (ISO-8601) | 소멸 예정 |
| createdDate | string (ISO-8601) | 등록일시 |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "balance": 2500,
    "history": {
      "content": [
        { "pointSeq": 3, "pointType": "EARN", "pointAmount": 1000, "balanceAfter": 2500, "reason": "리뷰 작성 적립", "expireDate": "2027-06-10T03:46:39Z", "createdDate": "2026-06-10T03:46:39Z" }
      ],
      "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
    }
  }
}
```

---

# 11. 쿠폰 (Coupons)

## 11.1 보유 쿠폰 조회

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me/coupons` |
| 인증 | **필요** |

### Query Parameters

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| status | string | ❌ | AVAILABLE / USED / EXPIRED. 미지정 시 전체 |
| page, size, sort | — | ❌ | 기본 `userCouponSeq,desc` |

### Response — `PageResponse<UserCouponItem>`

| 필드 | 타입 | 설명 |
|---|---|---|
| userCouponSeq | long | 발급 PK |
| couponSeq | long | 마스터 PK |
| couponCode | string | 쿠폰 코드 |
| couponName | string | 이름 |
| couponType | string | PERCENT / FIXED |
| discountValue | decimal | 할인 값 |
| minOrderAmount | decimal | 최소 주문 금액 |
| maxDiscount | decimal | 최대 할인 |
| description | string | 설명 |
| couponStatus | string | AVAILABLE/USED/EXPIRED |
| issuedDate | string (ISO-8601) | 발급일 |
| expireDate | string (ISO-8601) | 만료일 |
| usedDate | string (ISO-8601) | 사용일 (USED일 때) |
| orderSeq | long | 사용 주문 |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "content": [
      {
        "userCouponSeq": 1, "couponSeq": 1, "couponCode": "WELCOME10",
        "couponName": "신규 가입 10% 할인", "couponType": "PERCENT",
        "discountValue": 10.00, "minOrderAmount": 30000.00, "maxDiscount": 10000.00,
        "description": "회원가입 후 첫 구매 시 사용 가능한 10% 할인 쿠폰",
        "couponStatus": "AVAILABLE",
        "issuedDate": "2026-06-05T03:46:39Z", "expireDate": "2026-07-05T03:46:39Z"
      }
    ],
    "page": 0, "size": 20, "totalElements": 1, "totalPages": 1
  }
}
```

---

# 12. 1:1 문의 (Inquiries)

## 12.1 문의 작성

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `POST /api/v1/me/inquiries` |
| 인증 | **필요** |
| 동작 | WAITING으로 생성. 답변은 관리자(M7)가 작성 |

### Request — `CreateInquiryRequest`

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| inquiryType | string | ✅ | NotBlank, 값: PRODUCT/ORDER/DELIVERY/RETURN/ETC |
| title | string | ✅ | NotBlank, Size ≤100 |
| content | string | ✅ | NotBlank |
| privateYn | string | ❌ | Size 1, "Y"/"N" (default N) |
| productSeq | long | ❌ | — |
| orderSeq | long | ❌ | — |

### Response — `InquiryCreatedResponse`

| 필드 | 타입 |
|---|---|
| inquirySeq | long |
| inquiryNo | string (`IQ-{yyMMdd}-{NNNNN}`) |
| inquiryStatus | string ("WAITING") |
| createdDate | string (ISO-8601) |

| code | HTTP | 발생 |
|---|---|---|
| COMMON_VALIDATION_ERROR | 400 | inquiryType 미허용 / 필드 누락 |

---

## 12.2 내 문의 목록

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me/inquiries` |
| 인증 | **필요** |

### Query Parameters — `page`, `size`, `sort` (기본 `inquirySeq,desc`)

### Response — `PageResponse<InquiryListItem>`

| 필드 | 타입 | 설명 |
|---|---|---|
| inquirySeq, inquiryNo | — | — |
| inquiryType | string | — |
| title | string | — |
| inquiryStatus | string | WAITING / ANSWERED |
| privateYn | string | Y/N |
| createdDate | string (ISO-8601) | — |
| hasReply | boolean | ANSWERED 여부 |

---

## 12.3 내 문의 상세

| 항목 | 내용 |
|---|---|
| 메서드 + URL | `GET /api/v1/me/inquiries/{inquirySeq}` |
| 인증 | **필요** |

### Response — `InquiryDetailResponse`

| 필드 | 타입 |
|---|---|
| inquirySeq, inquiryNo | — |
| inquiryType, title, content | string |
| productSeq, orderSeq | long |
| inquiryStatus, privateYn | string |
| createdDate, answeredDate | string (ISO-8601) |
| replies | array<InquiryReplyDto> |

`InquiryReplyDto`:
| 필드 | 타입 |
|---|---|
| replySeq | long |
| content | string |
| createdDate | string (ISO-8601) |

```json
{
  "code": "SUCCESS", "message": "요청 처리 완료",
  "data": {
    "inquirySeq": 1, "inquiryNo": "IQ-260610-84990",
    "inquiryType": "PRODUCT", "title": "성분 관련 문의",
    "content": "비타민 에센스의 성분 중 알러지 유발 가능한 것이 있나요?",
    "productSeq": 2, "inquiryStatus": "WAITING", "privateYn": "N",
    "createdDate": "2026-06-10T06:16:04Z",
    "replies": []
  }
}
```

| code | HTTP | 발생 |
|---|---|---|
| INQUIRY_NOT_FOUND | 404 | 타인/미존재 |

---

# 부록 A. 엔드포인트 요약 (사용자 측 41개)

| 도메인 | Method | URL | 인증 |
|---|---|---|---|
| Auth | POST | /api/v1/auth/signup | ❌ |
| Auth | POST | /api/v1/auth/login | ❌ |
| Auth | POST | /api/v1/auth/refresh | ❌ |
| Auth | POST | /api/v1/auth/logout | ✅ |
| Auth | POST | /api/v1/auth/find-id | ❌ |
| Auth | POST | /api/v1/auth/reset-password | ❌ |
| User | GET | /api/v1/me | ✅ |
| User | PATCH | /api/v1/me | ✅ |
| User | PUT | /api/v1/me/password | ✅ |
| Address | GET | /api/v1/me/addresses | ✅ |
| Address | POST | /api/v1/me/addresses | ✅ |
| Address | PATCH | /api/v1/me/addresses/{seq} | ✅ |
| Address | DELETE | /api/v1/me/addresses/{seq} | ✅ |
| Address | PUT | /api/v1/me/addresses/{seq}/default | ✅ |
| Category | GET | /api/v1/categories | ❌ |
| Product | GET | /api/v1/products | ❌ |
| Product | GET | /api/v1/products/{seq} | ❌ |
| Product | GET | /api/v1/products/featured | ❌ |
| Banner | GET | /api/v1/banners | ❌ |
| Cart | POST | /api/v1/cart | ✅ |
| Cart | GET | /api/v1/cart | ✅ |
| Cart | PATCH | /api/v1/cart/{seq} | ✅ |
| Cart | DELETE | /api/v1/cart/{seq} | ✅ |
| Favorite | POST | /api/v1/me/favorites/{productSeq} | ✅ |
| Favorite | DELETE | /api/v1/me/favorites/{productSeq} | ✅ |
| Favorite | GET | /api/v1/me/favorites | ✅ |
| Order | POST | /api/v1/orders | ✅ |
| Order | POST | /api/v1/orders/{seq}/pay | ✅ |
| Order | GET | /api/v1/me/orders | ✅ |
| Order | GET | /api/v1/me/orders/{seq} | ✅ |
| Return | POST | /api/v1/me/orders/{seq}/returns | ✅ |
| Return | GET | /api/v1/me/returns | ✅ |
| Return | GET | /api/v1/me/returns/{seq} | ✅ |
| Review | POST | /api/v1/reviews | ✅ |
| Review | GET | /api/v1/products/{seq}/reviews | ❌ |
| Review | GET | /api/v1/me/reviews | ✅ |
| Point | GET | /api/v1/me/points | ✅ |
| Coupon | GET | /api/v1/me/coupons | ✅ |
| Inquiry | POST | /api/v1/me/inquiries | ✅ |
| Inquiry | GET | /api/v1/me/inquiries | ✅ |
| Inquiry | GET | /api/v1/me/inquiries/{seq} | ✅ |

---

## 추정 표기 일람

본 문서 내 "(추정)" 표기는 다음 항목에 적용된다:

- **§2.1 `UserInfoResponse`의 birthDate/zipCode/address/addressDetail 필드**: 코드 직접 확인 시 컨트롤러/서비스 호출만 확인, DTO 필드 전체 단순 매핑은 `User` 엔티티 기반으로 추정.
- **§1.4 로그아웃의 `AUTH_FORBIDDEN`**: 서비스 코드의 본인 토큰 검증 경로에서 발생 가능성 — 실제 케이스는 보지 못함.
- **§2.2 `UpdateUserRequest`의 부분 업데이트 필드 목록**: M1-T8 plan 기준 합리적 추정.

추정 영역의 정확한 필드 확인이 필요하면 해당 DTO 파일 조회를 추천한다.
