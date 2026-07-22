# 관리자(Admin) 프론트엔드 API 연동 계획

> **역할**: 백엔드가 `tasks-*.md`로 계획을 남긴 것과 같은, 관리자 프론트 연동의 **살아있는 계획 문서**.
> Phase가 끝날 때마다 갱신한다(체크박스 진행 + 새로 생긴 빚).
>
> **계약 출처**: `docs/admin_api.md`(관리자 50개, M7 실측). 사용자 측 `docs/micoz_api.md`(41개)와는 **별개**.
> **원칙**: 명세 우선. 쇼핑몰의 검증된 인프라(axios code 분기·refresh·매퍼·React Query)를 **그대로 확장**하고 새 아키텍처를 만들지 않는다.
>
> **상태 범례**: `[ ]` 미착수 · `[~]` 진행중 · `[x]` 완료(tsc+build+동작 확인)

---

## 1. 확정 결정 (4개) + 근거

### D1. OrderStatus 충돌 → **각 도메인 매퍼로 격리** (shop enum 불변)
- **충돌**: 공유 `src/lib/data/enums.ts`의 `OrderStatus`는 '배송중'을 `SHIPPED`로 씀(micoz_api.md 기준). 그러나 `admin_api.md`(실측 §2.1/§2.2)는 주문상태 `SHIPPING` **+ 별도 `ShippingStatus`(READY/SHIPPED/IN_TRANSIT/DELIVERED)** 2컬럼 분리.
- **결정**: 공유 `enums.ts`의 shop 값(`SHIPPED` 등)은 **건드리지 않는다**. 관리자 DTO/enum은 `src/api/admin/types.ts`에 `admin_api.md` 값 그대로(`SHIPPING`, `ShippingStatus`) 정의하고, admin 전용 라벨맵/매퍼로 변환한다.
- **근거**: CLAUDE.md의 어댑터(매퍼) 격리 원칙 + "enum 공유 → 값 변경 시 shop 렌더 깨짐 0". API 형태를 매퍼 한 곳에 가두면 shop 영향 0. 두 명세가 같은 컬럼을 다르게 기술하는 문제를 shop에 전파하지 않는다.

### D2. 관리자 토큰 → **별도 키 + 별도 adminClient**
- **결정**: `localStorage` 키를 `micoz.admin.accessToken` / `micoz.admin.refreshToken`로 분리. `/api/v1/admin/*` 전용 axios 인스턴스(`adminClient`)를 두고 `client.ts` 구조(봉투 언랩·code 분기·refresh 로테이션·강제 로그아웃)를 복제하되, 강제 로그아웃은 `/admin/login`으로 보낸다.
- **근거**: 한 브라우저에 CUSTOMER + ADMIN이 동시에 로그인될 수 있음. 기존 `client`의 요청 인터셉터는 **모든** `/api/v1/*`에 사용자 토큰을 주입하므로, 같은 인스턴스로 `/admin/*`를 호출하면 토큰이 섞인다. 인스턴스 분리로 완전 격리한다.
- **참고**: refresh 엔드포인트는 공용 `POST /api/v1/auth/refresh`(관리자 전용 없음). `adminClient`는 이 엔드포인트를 **관리자 refresh 토큰**으로 호출한다. 비활성(`use_yn='N'`) 관리자는 다음 refresh부터 거부 → "비활성 관리자 세션 만료".

### D3. Dashboard 인기상품 → **숨김 (빚으로 남김)**
- **결정**: `DashboardView`의 `TOP_PRODUCTS_30D`(인기상품) 카드/섹션을 **제거**한다. 대시보드는 `summary` + `sales-trend` 2개만 연동. mock으로 남기지 않는다.
- **근거**: 백엔드 확인 결과 인기상품/베스트셀러 집계는 **D(대시보드) 모듈 범위에 없음**(문서 누락 아님 — 실제로 미구현). 실 데이터 대시보드에 가짜 카드가 섞이면 관리자가 진짜 숫자로 오해한다. "향후 백엔드에 베스트셀러 API 추가 시 연동"을 빚으로 남긴다.
- **주의**: `netSales`(순매출)는 **음수 가능**(발생주의 — 총매출 order_date 귀속, 환불 completed_date 귀속). summary·일별 trend 모두 음수 축 대비.

### D4. 라이브 검증 방식 → **백엔드 실행 + 공유 관리자 계정**
- **결정**: 백엔드 `localhost:8080` 실행(Vite 프록시 `/api` → :8080). ADMIN 테스트 계정(userId/userPw)을 공유받아 A1부터 실 로그인/가드/refresh를 라이브 검증한다.
- **근거**: 쇼핑몰 때와 동일하게 각 Phase 후 실제 엔드포인트로 동작 확인(목업 변이 금지).

---

## 2. Phase A1~A5 (진행 추적)

각 Phase 완료기준(공통): **`tsc --noEmit` 통과 + `build` 통과 + 영향 라우트 동작 확인 보고**. 공유 enum/코드 변경 시 **쇼핑몰 렌더 깨짐 0** 확인.

### A1. 인증 인프라 — 위험도 🟠 中 · **[x]** (라이브 검증 완료)
관리자 로그인/가드/세션. **끝나면 멈추고 라이브 검증 보고.**
- [x] `src/api/adminToken.ts` — `micoz.admin.*` 키 저장소(get/set/clear)
- [x] `src/api/admin/client.ts` — `adminClient` 인스턴스(`client.ts` 복제: Bearer 주입·봉투 언랩·200 code≠SUCCESS 분기·refresh 1회 로테이션·재사용 탐지 강제 로그아웃). `adminGet/Post/Patch/Put/Delete` 래퍼. `ApiError`는 사용자 client 와 공유(React Query 재시도 일관)
- [x] `src/api/admin/auth.ts` — `adminLogin`(F-1 `POST /admin/auth/login`), `getAdminMe`(F-2 `GET /admin/me`)
- [x] `src/auth/AdminAuthContext.tsx` — admin user(userSeq/userId/role)·login/logout·`GET /admin/me` 세션복원·강제 로그아웃 콜백 등록
- [x] `src/auth/RequireAdmin.tsx` — 세션 없거나 role≠ADMIN → `/admin/login`
- [x] `src/routes/admin/auth/AdminLoginPage.tsx` + 라우트 `/admin/login` (.admin-scope)
- [x] `App.tsx` — `/admin` 트리를 `AdminAuthProvider` + `RequireAdmin`로 보호(현재 무방비였음). Topbar 로그아웃 배선(AdminLayout)
- [x] `src/api/admin/errors.ts` — admin ErrorCode 한글 매핑(auth-errors.ts 패턴)
- **완료기준**: 로그인 성공→`/admin` 진입, 미인증 시 `/admin/*`→`/admin/login`, access 만료 시 조용히 refresh, 비활성 계정 세션 만료. tsc+build.
- **검증 완료**: ✅ `tsc -b` + `vite build`. ✅ 라이브(계정 admin) — 실 로그인 `POST /admin/auth/login 200` + `GET /admin/me 200` → `/admin` 진입 · 세션 복원(전체 로드 시 /admin/me 재조회, 유지) · 로그아웃(토큰 clear + `/admin/login`) · 오입력 `401`→한글 메시지 · 미인증 `/admin`→`/admin/login` · 쇼핑몰 무회귀 · 콘솔 에러 0.
  - _코드 검증(라이브 미유발)_: refresh 로테이션·비활성 관리자 세션 만료 — 검증된 shop `client.ts` 구조 복제. access 30분 만료라 라이브 트리거는 후속 Phase 중 자연 발생 시 확인.

### A2. 조회 (read-only) — 위험도 🟢 低 · **[x]** (라이브 검증 완료)
목록/상세만(7화면). 각 화면: 매퍼 + 로딩·에러(재시도)·빈 상태 + **서버 위임 페이징·정렬·검색**(클라 필터/정렬 제거). 공유 인프라: `api/admin/{labels,format}.ts`·`components/admin/AsyncState.tsx`·Pagination 서버화·chips admin 라벨.
- [x] Members 목록(M-1)·상세(M-3) — 레퍼런스. 실 데이터 렌더 확인
- [x] Products 목록(C-5)·상세(C-6) — 카테고리 필터 C-1 트리 공용(`useCategoryOptions`, 런타임 확인)
- [x] Categories 트리(C-1) — 2단계 중첩 렌더 확인
- [x] Orders 목록(O-1)·상세(O-2) — 배송정보(shipping)·결제(payment) 상세 흡수. mock KPI 6칸 제거
- [x] Returns 목록(R-1)·상세(R-2) — 교환옵션 포함 상세
- [x] Banners 목록(S-1)·상세(S-2)
- [x] Inquiries 목록(CS-1)·상세(CS-2) — mock Stat 카드 제거, 답변 textarea는 A3b 대기(no-op)
- **검증 완료**: `tsc -b`+`vite build` 통과. 라이브 — 7화면 전부 실 API 200(`members·products·categories·orders·returns·banners·inquiries`), 서버 페이징/정렬 파라미터 정상, 콘솔 에러 0. (주문/반품/문의는 현재 백엔드 데이터 0건이라 빈 상태로 확인.)
- **범위 변경(확정)**: ~~Shipping 설정 조회(S-7)~~ → A2에서 제외. per-order 배송은 Orders 상세로 흡수, 배송 **정책 설정**(S-7/S-8 ShippingView)은 read+write 쌍이라 A3a(설정 변이)로 이동.
- **완료기준**: 각 목록 서버 페이징/검색/정렬 동작, 상세 진입, 로딩·에러·빈 상태. 화면별 tsc+build+라이브 렌더 확인.

### A3a. CRUD 변이 — 위험도 🟠 中 · **[x]** (라이브 검증 완료)
실제 엔드포인트 변이(mock 변이 제거). 공용 `ConfirmDialog`(삭제·위험 액션)·`adminErrorMessage`(도메인 에러 한글)·성공 시 `invalidateQueries`.
- [x] Members: 등록(M-2)·등급(M-4)·상태(M-5)·포인트(M-6). **역할(M-7)은 A3c로 이관**(self-lockout·last-admin 보호가 관리자계정 관리와 묶임)
- [x] Products: 생성(C-7)·수정 PUT 전체교체(C-8)·상태(C-9)·재고 절대값(C-10)·삭제(C-11). 라벨은 카탈로그 API 부재로 수정 시 기존 유지·생성 시 빈배열(빚#11)
- [x] Categories: 생성(C-2, 2단계 강제)·수정(C-3)·삭제(C-4, `CATEGORY_HAS_CHILDREN` 차단)
- [x] Banners: 생성(S-3)·수정 PUT(S-4)·노출토글(S-5)·삭제(S-6)
- [x] **Shipping 설정(ShippingView)**: 조회(S-7)+수정 PATCH 부분(S-8) — A2에서 이관. 단일행 설정 폼
- **검증 완료**: `tsc -b`+`vite build` 통과. 라이브(위험 항목 중점) — ① **Category 삭제 409**: 상품 소속 카테고리 삭제 시 `DELETE→409`, ConfirmDialog에 "하위 카테고리 또는 소속 상품이 있어 삭제할 수 없습니다" 렌더, 미삭제 유지 ✅ ② **Product 다중등록 트랜잭션**: 옵션 2개 상품 `POST→200`, 목록에 재고합(42) 반영, 중복코드 `409 PRODUCT_DUPLICATED_CODE`, 삭제 `200` ✅ ③ Shipping `GET S-7→200` 폼 로드 ✅ ④ (보너스) 관리자 refresh 로테이션 `401→refresh→retry` 라이브 확인 ✅. Members 등급/상태/포인트·Banners CRUD는 동일 검증 패턴+빌드로 커버.
  - _주의_: 브라우저 자동화의 폼 텍스트 입력이 React 상태와 불안정 → 생성 계열 일부는 앱 fetch(프록시 경유) 직접 호출로 백엔드 왕복 검증. UI 폼 배선은 빌드+코드로 확인.

### A3b. 상태전이 액션 — 위험도 🔴 高 · **[x]** (Orders·Returns·Inquiries 라이브 검증 완료)
전이표(§3) 기반 버튼 노출. **단계마다 멈춤.** 성공 시 data 없음 → **상세 재조회로 갱신**.
- [x] Orders: prepare(O-3)·cancel(O-4, 재고복원)·ship(O-5, 운송장 필수·2컬럼 원자)·in-transit(O-6)·deliver(O-7)
  - `orders.ts` 전이 fn+`useOrderTransitions`+`orderActions`(§3.1/3.2 버튼 근거). 상세 모달 상태별 액션 바(운송장 입력·취소 ConfirmDialog "재고복원·환불 아님"). 성공 시 상세+목록 자동 재조회.
  - **라이브 검증 완료(실주문)**: PAID 주문 생성 후 — 409 `ORDER_TRANSITION_INVALID`(PAID에서 deliver 시도)·400 `COMMON_VALIDATION_ERROR`(운송장 누락 ship)·prepare→PREPARING·ship→SHIPPING+배송 SHIPPED+운송장(2컬럼)·deliver→DELIVERED+배송 DELIVERED(2컬럼)·cancel→CANCELED+**재고 복원(144→147)**+**payment PAID 불변**(환불 아님). **UI**: PAID 상세=[준비 시작][주문 취소], 준비 시작 클릭→목록·상세가 준비중으로 재조회→버튼 [출고+운송장][주문 취소]로 전환. `tsc`+`build` 통과.
- [x] Returns: approve(R-3)·reject(R-4)·collect(R-5)·inspect(R-6, restockYn)·**complete(R-7) ⚠️ 확인 다이얼로그**(환불·재고복원·주문종결 원자·되돌리기 없음)
  - `returns.ts` 전이 fn+`useReturnTransitions`+`returnActions`(§3.3). 상세 모달 액션 바: 반려 3진입점(REQUESTED/APPROVED/INSPECTED, COLLECTED 제외)·검수 재입고(restockYn) 토글(DEFECT 기본 N)·**complete ConfirmDialog 유형별 안내**(CANCEL/RETURN=환불·REFUNDED·주문종결·재고복원 / EXCHANGE=환불 0 상태만). 성공 시 상세 재조회로 refundAmount 표시.
  - **RETURN 흐름 라이브 검증 완료**: 실반품 2건 — ① RETURN·단순변심·restock Y: 409(REQUESTED에서 complete)→approve→collect→inspect(Y)→complete → COMPLETED·**refund 54,000**(57,000−반품비 3,000)·order **RETURNED**·**재고 141→144 복원**. ② RETURN·DEFECT·restock N: complete → refund **57,000**(전액)·RETURNED·**재고 미복원(144→144)**. restockYn Y/N 효과·사유별 환불 산정(백엔드값 그대로 표시) 확인. **UI**: 상태별 버튼 정확(REQUESTED[반려·승인]→APPROVED[반려·회수]→COLLECTED[검수만, **반려 없음**]→INSPECTED[반려·완료]), complete 다이얼로그 구체 부수효과 문구, 완료 후 상세 재조회. _관찰_: RETURN 완료 후 O-2 `payment` 객체가 null(환불은 실행됨) → 백엔드가 환불 후 주문상세 결제정보를 감춤(빚#12).
  - **EXCHANGE 검증 완료**: EXCHANGE complete → refund **0**·order **DELIVERED 불변**·payment **PAID 불변**(payment 객체 정상 — 빚#12는 REFUNDED 전이에만 국한)·재고 **불변**(R-T4 단언대로). UI: INSPECTED→[반려·**교환 완료**](라벨 구분), 다이얼로그 "환불이 발생하지 않으며 상태만 완료로 변경(환불액 0·결제·재고 변화 없음)".
  - **REJECTED 검증 완료**: REQUESTED/APPROVED/INSPECTED 3진입점 각각 reject→**REJECTED**·refund 0·order DELIVERED 불변·부수효과 0. **COLLECTED에서 reject→409**(전이표대로 불가, UI에서도 반려 버튼 미노출).
- [x] Inquiries: 답변 등록(CS-3, 최대 2000자). 재답변 시 `answeredDate` 불변("최초 응답 시각")
  - `inquiries.ts` `createInquiryReply`+`useCreateInquiryReply`(성공 시 invalidate). InquiryDetailModal: textarea(maxLength 2000·글자수 카운터)·재답변 안내("최초 응답일시 불변, 수정·삭제 불가")·성공 시 상세 재조회로 답변·상태 갱신. mock no-op 제거.
  - **라이브 검증 완료**: 문의 생성(WAITING) → 첫 답변 → **ANSWERED + answeredDate 세팅** → 재답변 → **ANSWERED 유지·answeredDate 불변**(동일 타임스탬프)·replies append-only. UI: 답변완료·등록된 답변(N)·재답변 안내·글자수 표시, UI 답변 등록 시 append+textarea 초기화 확인.
- **완료기준**: 현재 상태별 허용 버튼만 노출(§3.1~3.4), `*_TRANSITION_INVALID`(409) 처리, 액션 후 상세 재조회로 상태 반영. tsc+build. ✅ **A3b 전 도메인 라이브 검증 완료.**

### A3c. 관리자 계정 — 위험도 🟠 中 · **[x]** (라이브 검증 완료)
TeamView(F-3/4/5) + M-7 역할변경(A3a에서 이관).
- [x] 목록(F-4, 서버 페이징·정렬)·생성(F-3)·활성/비활성(F-5). `api/admin/admins.ts` + TeamView 재작성. 원본 가공 역할티어(슈퍼관리자/운영/MD…)는 API에 없어 제거.
- [x] **self-lockout 사전 차단**: 현재 관리자(AdminAuthContext userSeq)의 행은 "(나)" 배지 + 비활성화 버튼 미노출("본인 계정"). 나머지 보호는 `ConfirmDialog` error prop으로 409 한글 안내(`ADMIN_SELF_LOCKOUT`·`ADMIN_LAST_ADMIN_PROTECTED`·`ADMIN_ROOT_PROTECTED`·`USER_DUPLICATED_ID` errors.ts 등록).
- [x] **M-7 역할변경**(members 상세 모달): CUSTOMER↔ADMIN 승강, 본인 행은 변경 차단(self-lockout 방지), ConfirmDialog 강한 확인(승격/강등 안내).
- **라이브 검증 완료**: F-4 목록·**잘못된 정렬(userPw)→400 COMMON_INVALID_REQUEST**(화이트리스트). **F-3 생성 200 → 그 계정으로 실제 로그인 SUCCESS**(생성 실동작 증명). **F-5 비활성화 200 → 비활성 계정 로그인 AUTH_INVALID_CREDENTIALS 거부**. **self-lockout: 본인 비활성화/본인 강등 → 409 ADMIN_SELF_LOCKOUT**. **M-7: 승격 CUSTOMER→ADMIN(관리자 목록 등장)·강등 ADMIN→CUSTOMER 복귀**. UI: self "(나)"·"본인 계정"(버튼 미노출)·생성 모달·타 관리자 활성/비활성 버튼 확인. 본계정 `admin` 유지(잠금 없음), 테스트 계정 정리(비활성/강등).
  - _관찰(빚#13)_: 회원을 ADMIN으로 승격하면 members 상세(M-3)가 `USER_NOT_FOUND`(ADMIN은 회원 조회 범위 밖) → 승격 후 상세 모달이 에러 표시. 승격 시 모달 자동 닫기로 개선 여지(경미, 후속).
  - _한계_: `ADMIN_LAST_ADMIN_PROTECTED`는 단일 실관리자(admin=본인) 환경에서 self-lockout에 가려 라이브 단독 트리거 불가 — 에러 매핑·백엔드 가드는 존재. ROOT는 F-4 DTO에 플래그 없어 사전 표시 불가 → 409 안내 의존(빚#14).

### A4. 대시보드 — 위험도 🟢 低 · **[x]** (라이브 검증 완료)
- [x] summary(D-1, period 프리셋) 연동 — KPI: **총매출(취소 제외 결제분) vs 순매출(총매출−반품환불) 구분 표기**, 주문수·신규회원. 순매출 음수 시 발생주의 안내 배너. 지원 지표(답변 대기·평균 응답시간)는 별도 행 + **WAITING "현시점 스냅샷·기간 무관" 명시**. 평균 응답시간 초→시:분 포맷
- [x] sales-trend(D-2, days 7/30/90) 연동 — `NetGrossTrendChart`(SVG): **순매출 음수 축 지원**(yMin=min(0,…)·0 기준선·손실 구간 안내), 총매출 오버레이. 빈 날은 백엔드 0-fill 그대로
- [x] 인기상품(`TOP_PRODUCTS_30D`)·채널별 유입 mock 섹션 **제거**(대응 API 없음, 빚#1)
- **라이브 검증 완료**: `tsc`+`build`. summary TODAY/THIS_WEEK/THIS_MONTH 200(총매출 ₩570,000/순매출 ₩405,000 — 환불 차감 반영), **잘못된 프리셋→400**. sales-trend 30/7 배열·빈 날 0-fill·**days 0/91→400**·NaN/NPE 없음. UI: KPI 구분 표기·WAITING 스냅샷 안내·차트 렌더·**기간 전환 동작(오늘→이번 달 from 갱신)**·90일 전환·베스트셀러/채널 제거 확인. (실 데이터 적어 netSales 음수는 미발생 — 코드는 음수 지원.)

### A5. 마무리 — 위험도 🟢 低 · **[x]** (완료)
- [x] **obsolete admin mock 제거**: `lib/data`의 `CATEGORY_TREE`·`ADMIN_PRODUCTS`·`RETURNS`·`SALES_30D`·`TOP_PRODUCTS_30D`·`ADMIN_USER`·`GRADE_TIERS`·`ORDERS` 삭제(파일 4개 삭제 + orders/members 잔여 const 제거). 죽은 차트(`BarRow`·`SalesAreaChart`) 제거. Sidebar `ADMIN_USER`→실 관리자(`useAdminAuth`). **shop 사용분(`MEMBERS`·`generateOrderNo`·`PRODUCTS` 등)·스키마 스캐폴딩 타입(types.ts)은 보존.**
- [x] **`CLAUDE.md` admin 섹션 추가**: 인트로의 거짓 문장("관리자 API 연동은 이번 트랙 범위 아님") 수정 + §관리자(Admin) 트랙(계약 출처·별도 토큰/adminClient/가드·매퍼 격리·전이표 버튼 근거·위험 액션·정책). shop 섹션 보존.
- [x] **에러 UX 통일**: `errors.ts`에 상태전이(ORDER/RETURN/INQUIRY_TRANSITION_INVALID)·관리자 보호(ADMIN_SELF_LOCKOUT/LAST_ADMIN/ROOT) 코드 한글 매핑 추가 → 전 도메인 커버. 방식 일관(폼/모달=인라인, 삭제·위험=ConfirmDialog, 쿼리=AsyncState, 전부 `adminErrorMessage`).
- **검증 완료**: `tsc -b`+`vite build` 통과. 라이브 무회귀 — shop 홈/상품 렌더 정상·콘솔 에러 0, 관리자 대시보드·Sidebar(실 관리자 "admin/ADMIN") 정상.

---

## ✅ A1~A5 전체 완료 (관리자 프론트 연동)
| Phase | 상태 |
|---|---|
| A1 인증 인프라 | [x] 라이브 검증 |
| A2 조회 7화면 | [x] 라이브 검증 |
| A3a CRUD 변이 | [x] 라이브 검증 |
| A3b 상태전이(Orders·Returns·Inquiries) | [x] 라이브 검증 |
| A3c 관리자 계정 + M-7 | [x] 라이브 검증 |
| A4 대시보드 | [x] 라이브 검증 |
| A5 마무리(mock 정리·CLAUDE.md·에러 UX) | [x] |

**남은 빚**(프론트 수정 불가/후속): #1 인기상품 집계 API 부재 · #7~10 매퍼 갭(고객명 조인·집계 위젯·presentational) · #11 라벨 카탈로그 API · #12 RETURN 완료 후 O-2 payment null(백엔드) · #13 승격 후 회원상세 USER_NOT_FOUND(UX) · #14 ROOT 플래그 부재.

---

## 3. 화면 ↔ admin_api.md 엔드포인트 매핑

| 화면 (route) | 현재 mock | 조회 | 변이 | 비고 |
|---|---|---|---|---|
| **DashboardView** `/admin` | `SALES_30D`, `TOP_PRODUCTS_30D` | D-1 summary, D-2 sales-trend | — | 인기상품 엔드포인트 없음 → 섹션 제거. netSales 음수 |
| **MembersView** `/admin/members` | `MEMBERS` | M-1 목록, M-3 상세 | M-2 등록·M-4 등급·M-5 상태·M-6 포인트·M-7 역할 | mock 컬럼(주문수/누적구매액/최근주문) DTO에 없음 → 조정 |
| **ProductsView** `/admin/products` | `ADMIN_PRODUCTS`, `CATEGORY_TREE` | C-5 목록, C-6 상세, C-1 트리(필터) | C-7 생성·C-8 수정(PUT)·C-9 상태·C-10 재고·C-11 삭제 | 재고 = 절대값 설정 |
| **CategoriesView** `/admin/categories` | `CATEGORY_TREE` | C-1 트리(페이징 아님) | C-2 생성·C-3 수정·C-4 삭제 | 삭제 `CATEGORY_HAS_CHILDREN` 차단 |
| **OrdersView** `/admin/orders` | `ORDERS` | O-1 목록, O-2 상세 | O-3 prepare·O-4 cancel·O-5 ship·O-6 in-transit·O-7 deliver | §3.1/3.2 전이표. 액션 후 O-2 재조회 |
| **ReturnsView** `/admin/returns` | `RETURNS` | R-1 목록, R-2 상세 | R-3 approve·R-4 reject·R-5 collect·R-6 inspect·**R-7 complete⚠️** | complete 되돌리기 없음 → confirm |
| **InquiriesView** `/admin/inquiries` | (mock) | CS-1 목록, CS-2 상세 | CS-3 답변등록 | 비공개 문의도 조회. 재답변 answeredDate 불변 |
| **BannerView** `/admin/settings/banner` | (mock) | S-1 목록, S-2 상세 | S-3 생성·S-4 수정(PUT)·S-5 토글·S-6 삭제 | |
| **ShippingView** `/admin/settings/shipping` | (mock) | S-7 조회 | S-8 수정(PATCH 부분) | 단일행. NOT_FOUND=500(인프라 이상) |
| **TeamView** `/admin/settings/team` | (mock) | F-4 목록 | F-3 생성·F-5 활성/비활성 | self-lockout·last-admin 보호 |
| (공통) | — | F-2 `GET /admin/me` | F-1 로그인, `/auth/refresh`(공용) | 인증 인프라(A1) |

## 4. 진행 규율

- **위험한 것은 단계마다 멈춤**: A1(인증), A3b(상태전이 액션 — 특히 R-7 complete). 진행 지시 받고 다음 단계.
- **조회는 묶어서**: A2는 read-only라 한 번에 진행하고 끝에 일괄 검증.
- **매퍼 갭 발견 시 구분해서 보고**:
  - **화면 조정**: DTO에 없는 표시 필드는 화면에서 제거/축소(예: MembersView 주문수/누적구매액/최근주문). shop처럼 컴포넌트 뷰모델은 최대한 유지하되 없는 데이터는 채우지 않는다.
  - **백엔드 빚**: 화면에 꼭 필요한데 엔드포인트가 없으면(예: 인기상품) 숨기고 빚 목록에 등록.
- **명세 우선**: `admin_api.md`와 지시 충돌 시 명세 우선 + 보고. "(추정)"/불확실 필드는 라이브로 검증·보고.
- **변이는 실 엔드포인트로**: mock 변이 제거. enum/공유 코드 변경 시 shop 렌더 깨짐 0 확인.
- **문서 갱신**: Phase 끝날 때마다 체크박스 갱신 + 새 빚 등록.

## 5. 빚 / 확인필요 (living)

| # | 항목 | 유형 | 상태 |
|---|---|---|---|
| 1 | **인기상품/베스트셀러 집계 API 부재** — 대시보드는 summary·sales-trend만. `TOP_PRODUCTS_30D` 섹션 제거, 향후 백엔드 API 추가 시 연동 | 백엔드 빚 | 확정(숨김) |
| 2 | **MembersView 컬럼 갭** — mock의 `주문수/누적구매액/최근주문`이 `MemberListItem` DTO에 없음. A2에서 컬럼 제거(또는 상세로 이동). 상세 `MemberDetailResponse`에도 주문 이력 없음 | 화면 조정 | A2에서 반영 |
| 3 | **enum 정렬 잔여(격리 처리)** — `enums.ts` `InquiryStatus`(shop: WAITING/IN_PROGRESS/ANSWERED/CLOSED / admin: WAITING/ANSWERED 2값), `UserStatus`(shop: WITHDRAW_REQUESTED/WITHDRAWN / admin: ACTIVE/DORMANT/SUSPENDED + use_yn), `OrderStatus`(SHIPPED vs SHIPPING). admin 매퍼로 격리, shop 값 불변 | 화면 조정 | D1 결정대로 |
| 4 | **Shipping = 2개 개념 분리(확정)** — ① per-order 배송정보는 O-2 주문 상세 `shipping` 객체에만 존재(독립 조회 없음)→Orders 상세 흡수. ② 배송 **정책 설정**(S-7/S-8 단일행)은 ShippingView 화면=read+write 쌍→**A2에서 A3a로 이관** | 범위 조정 | 확정 |
| 5 | **Inquiries 화면 실재 확인** — `InquiriesView.tsx` 목록+상세모달 완성(mock). CS-1/2 연동 A2 포함, 답변 CS-3은 A3b | 확인됨 | A2 포함 |
| 7 | **Members 목록 컬럼 갭(M-1)** — mock 컬럼 중 `이메일·전화`는 M-1 미제공(M-3 상세엔 있음)→목록에서 제거, 상세에서 노출. `주문수·누적구매액·최근주문`은 집계 미제공 → **백엔드 집계 API 추가 빚**(관리자 실사용 정보) | ①표시조정 ②백엔드빚 | A2 반영 완료 |
| 8 | **목록 DTO에 고객명 비정규화 부재(공통)** — Orders(O-1)·Returns(R-1)·Inquiries(CS-1)·Members(M-1) 목록이 `userSeq`만 주고 고객명/이메일은 미제공 → 목록에 `#userSeq` 표시. 관리자 목록에서 고객명은 실사용 정보 → **백엔드 목록 DTO에 userName 조인 추가 빚**(또는 상세에서만 확인) | 백엔드 빚 | A2 반영(userSeq 표시) |
| 9 | **집계 위젯 제거(가짜 숫자 방지)** — Orders 상단 KPI 6칸·Inquiries Stat 3칸은 대응 집계 API 없음 → 제거(대시보드 인기상품 D3과 동일 원칙). Products `sales30`(30일 판매량)도 동일 → 컬럼 제외 | 백엔드 빚 | A2 반영(제거) |
| 10 | **Products `line`(브랜드 라인)** — 스키마 외 presentational 필드, C-5/C-6에 없음 → 목록/상세에서 제거 | 표시 조정 | A2 반영 |
| 11 | **라벨(BEST/NEW 등) 목록 조회 API 부재** — 상품 생성/수정 시 라벨 다중선택 UI를 채울 카탈로그 엔드포인트 없음 → A3a는 수정 시 기존 labelSeq 유지·생성 시 빈 배열. 자유로운 라벨 부여는 **백엔드 라벨 목록 API 추가 빚** | 백엔드 빚 | A3a 반영(제한) |
| 13 | **회원 ADMIN 승격 후 members 상세 USER_NOT_FOUND** — M-7로 CUSTOMER→ADMIN 승격 시 그 사용자는 회원 조회(M-3) 범위에서 빠짐 → 승격 직후 회원 상세 모달이 "불러오지 못했습니다" 표시. 승격 성공 시 모달 자동 닫기(TeamView에서 관리 안내)로 개선 여지. 경미 | 프론트 UX | 후속 |
| 14 | **F-4 AdminListItem에 ROOT 플래그 없음** — ROOT(비상 락드) 계정을 UI에서 사전 구분·표시 불가 → 대상 변경 시 `ADMIN_ROOT_PROTECTED`(409) 안내로만 대응. 사전 표시하려면 백엔드가 isRoot/role 상세 필요 | 백엔드/UX | 후속 |
| 12 | **RETURN 완료 후 주문상세(O-2)의 payment 객체가 null** — 환불 자체는 정상(refundAmount·order RETURNED·재고복원)이나 admin_api.md §2.7이 약속한 `payment.paymentStatus=REFUNDED`를 주문 상세에서 볼 수 없음. A2에서 payment 정상 표시됐으므로 REFUNDED 전이 후에만 사라지는 것 → 주문 상세 조회의 payment 조인이 특정 상태/조건을 배제할 가능성. 백엔드 확인 필요(프론트 수정 불가). 영향: 관리자가 주문 화면에서 환불 여부 확인 불가. **우선순위 中** | 백엔드 이슈 | 백엔드 세션에서 확인 |
| 6 | **payment_status 값집합** — 주문 상세 `payment.paymentStatus`는 결제(M4)/환불(R) 소관, admin_api.md는 스키마 주석 출처. 표시만 하므로 라이브 값 확인 | 확인필요 | A2 상세에서 검증 |

---

_최종 갱신: A0(계획 확정). 다음: A1 구현 → 라이브 검증 보고 후 문서 갱신._
