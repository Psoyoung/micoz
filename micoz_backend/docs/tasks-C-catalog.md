# MICOZ M7 — C. Catalog(카탈로그) task 분할

> **전제**: F. Foundation(관리자 로그인·RBAC 게이팅) + M. Member(Specification 패턴 표준 확립) 완료.
> 본 문서는 C 모듈을 독립적으로 테스트·커밋 가능한 단위로 분할한 것. **구현은 본 문서 리뷰 후 시작.**
> **기준**: `docs/admin-overview.md` §1(C 모듈)·§3(공통 패턴)·§3.4(삭제 정책).
> **대상 테이블**: `mst_category`, `mst_product`, `mst_product_option`, `mst_product_image`,
> `mst_product_label`, `map_product_label`.
>
> ## 진행 방식 (M과 동일)
> - **task별 승인 게이트를 푼다.** 각 task는 검증 결과 + 커밋 후보를 제시하되, **승인 없이 커밋(push 금지)해도 된다.**
> - **예외: `[수동리뷰 필수]` task(C-T1·C-T3·C-T5)는 커밋 전에 멈춰 승인받는다.**
>   (트리 삭제 무결성·다중 등록 트랜잭션 원자성·주문 참조 삭제 차단은 자동 테스트만으로 회귀를 못 잡는다.)
> - **C 전체가 끝나면 통합 검토용 요약을 만들고 멈춘다.**
>
> **공통 검증 절차 (모든 task)**: ① 단위/통합 테스트 작성·통과 → ② `./gradlew build`(또는 Docker 빌드)
> → ③ 실제 HTTP 요청(curl) E2E → ④ 회귀 스모크(기존 사용자 측 카탈로그 조회 1~2개).

---

## 0. 신규 엔드포인트 계약 (모듈 상단 설계)

모든 경로는 `/api/v1/admin/categories`·`/api/v1/admin/products` 하위. **전부 ADMIN 권한**
(URL 게이팅 `/api/v1/admin/**` + 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")` 2차 방어 = F-T4 표준).
응답은 `ApiResponse<T>` 봉투, 목록은 `PageResponse<T>`. 감사: 모든 변경은 `AuditorAwareImpl`로
`u_user`=실행 관리자 user_id 자동 기록(`i_user`는 신규 등록 시).

> **사용자 측과의 경계**: 기존 `/api/v1/categories`(노출 트리)·`/api/v1/products`(노출 상품)는
> `use_yn='Y' AND display_yn='Y'`만 본다. 관리자 엔드포인트는 **비노출·소프트삭제 포함 운영 뷰**를
> 별도로 제공한다(사용자 측 코드·DTO는 건드리지 않음 — 회귀 0이 목표).

### 0.1 카테고리 엔드포인트 (C-T1)

| # | Method | Path | 설명 | 성공 | 주요 에러 |
|---|--------|------|------|------|----------|
| ①-1 | GET | `/api/v1/admin/categories` | 2단계 트리 조회(운영 뷰, `includeDeleted` 옵션) | 200 `List<AdminCategoryNode>` | — |
| ①-2 | POST | `/api/v1/admin/categories` | 카테고리 생성(레벨은 parentSeq로 결정) | 200 `CategoryCreatedResponse` | 404 `CATEGORY_NOT_FOUND`(parent), 409 `CATEGORY_DUPLICATED_SLUG`, 400 `CATEGORY_INVALID_PARENT` |
| ①-3 | PATCH | `/api/v1/admin/categories/{categorySeq}` | 수정(이름·슬러그·노출·정렬) | 200 `Void` | 404 `CATEGORY_NOT_FOUND`, 409 `CATEGORY_DUPLICATED_SLUG` |
| ①-4 | DELETE | `/api/v1/admin/categories/{categorySeq}` | 소프트삭제(`use_yn='N'`+`display_yn='N'`) | 200 `Void` | 404 `CATEGORY_NOT_FOUND`, 409 `CATEGORY_HAS_CHILDREN` |

### 0.2 상품 엔드포인트 (C-T2~T5)

| # | Method | Path | 설명 | 성공 | 주요 에러 |
|---|--------|------|------|------|----------|
| ②-1 | GET | `/api/v1/admin/products` | 목록·다축 검색 | 200 `PageResponse<AdminProductListItem>` | — |
| ②-2 | GET | `/api/v1/admin/products/{productSeq}` | 상세(옵션·이미지·라벨 포함, 운영 뷰) | 200 `AdminProductDetailResponse` | 404 `PRODUCT_NOT_FOUND` |
| ③-1 | POST | `/api/v1/admin/products` | 등록(옵션·이미지·라벨 일괄) | 200 `ProductCreatedResponse` | 409 `PRODUCT_DUPLICATED_CODE`, 404 `CATEGORY_NOT_FOUND`/`LABEL_NOT_FOUND`, 400 `COMMON_VALIDATION_ERROR` |
| ③-2 | PUT | `/api/v1/admin/products/{productSeq}` | 수정(자식 일괄 동기화) | 200 `Void` | 404 `PRODUCT_NOT_FOUND`/`CATEGORY_NOT_FOUND`/`LABEL_NOT_FOUND`/`PRODUCT_OPTION_NOT_FOUND`, 409 `PRODUCT_DUPLICATED_CODE` |
| ④-1 | PATCH | `/api/v1/admin/products/{productSeq}/status` | 판매상태 변경 | 200 `Void` | 404 `PRODUCT_NOT_FOUND`, 400 `PRODUCT_INVALID_STATUS` |
| ④-2 | PATCH | `/api/v1/admin/products/{productSeq}/options/{optionSeq}/stock` | 옵션 재고 설정 | 200 `Void` | 404 `PRODUCT_NOT_FOUND`/`PRODUCT_OPTION_NOT_FOUND`, 400 `COMMON_VALIDATION_ERROR` |
| ⑤ | DELETE | `/api/v1/admin/products/{productSeq}` | 소프트삭제(주문 이력 시 하드삭제 금지) | 200 `Void` | 404 `PRODUCT_NOT_FOUND` |

> ⑤는 항상 소프트삭제(`use_yn='N'`+`display_yn='N'`, 옵션·이미지 동반)다. 주문 이력 유무는 **하드삭제 시도를
> 막는 불변식**으로 코드 경로에 박되, 정상 동작은 동일하게 200(소프트삭제). `PRODUCT_HAS_ORDERS`는 "주문 이력
> 있는 상품에 하드삭제 경로가 호출되면" 던지는 방어 코드로 둔다(**하드삭제 API 미노출 = C-Q5 확정**, 런타임
> 도달은 향후 일괄정리/배치 경로 신설 시 — F의 마지막ADMIN 가드처럼 주석 남기고 방어적으로 유지).

### 0.3 요청/응답 DTO 초안

```
// ── ① 카테고리 ───────────────────────────────────────────────
AdminCategoryNode (트리 응답)
  Long categorySeq, Long parentSeq, String categoryName, String urlSlug,
  Integer categoryLevel, Integer sortOrder, String displayYn, String useYn,
  int childCategoryCount, int productCount,     // 삭제 차단 판단 근거 노출(C-Q2)
  List<AdminCategoryNode> children              // level1 노드에만 채움

CreateCategoryRequest
  Long parentSeq,                  // null=대분류(level1), 값 있으면 중분류(level2)
  @NotBlank categoryName, @NotBlank urlSlug,
  Integer sortOrder, String displayYn          // displayYn 미지정 시 'Y'
  // categoryLevel은 서버가 parentSeq 유무로 1/2 결정(요청에서 받지 않음)
CategoryCreatedResponse { Long categorySeq }

UpdateCategoryRequest
  String categoryName, String urlSlug, Integer sortOrder, String displayYn
  // 부모 이동/레벨 변경은 범위 밖(2단계 고정, C-Q3)

// ── ② 상품 목록·검색 ─────────────────────────────────────────
ProductSearchCondition (쿼리 바인딩, M-T1 MemberSearchCondition와 동일 형태)
  String  q             // productCode 또는 productName 부분일치(선택)
  String  productCode   // 부분일치(선택)
  Long    categorySeq   // 정확 일치(선택)
  String  displayYn     // Y/N(선택)
  String  status        // product_status(선택)
  boolean includeDeleted = false   // true면 use_yn='N' 포함(결정6, mst_*만)
  // 페이징/정렬은 Pageable(@PageableDefault size=20, sort=productSeq,desc)

AdminProductListItem
  Long productSeq, String productCode, String productName, String productStatus,
  Long categorySeq, String categoryName, BigDecimal basePrice,
  String displayYn, String useYn,
  Integer totalStock,              // 활성 옵션 stock_qty 합(일괄 로드, N+1 금지)
  OffsetDateTime createdDate(i_date)

// ── ② 상세 ───────────────────────────────────────────────────
AdminProductDetailResponse
  Long productSeq, String productCode, String productName, String productStatus,
  Long categorySeq, String categoryName, BigDecimal basePrice,
  String shortDesc, detailDesc, ingredientInfo, usageInfo,
  String displayYn, String useYn,
  List<AdminOptionDto> options,    // optionSeq/optionName/finalPrice/stockQty/sortOrder/useYn
  List<AdminImageDto>  images,     // imageSeq/imageType/imageUrl/imageAlt/sortOrder/useYn
  List<AdminLabelDto>  labels,     // labelSeq/labelName
  OffsetDateTime createdDate, lastModifiedDate

// ── ③ 등록·수정 (옵션·이미지·라벨 일괄) ─────────────────────────
CreateProductRequest
  @NotBlank productCode, @NotBlank productName, Long categorySeq,
  @NotNull @PositiveOrZero basePrice, String productStatus(기본 ON_SALE),
  String shortDesc, detailDesc, ingredientInfo, usageInfo, String displayYn(기본 Y),
  @Valid List<OptionInput> options,    // C-Q4 확정: 0개 허용(옵션 없는 단일상품). null/빈배열 가능
  @Valid List<ImageInput>  images,
  List<Long> labelSeqs                 // mst_product_label.label_seq 참조
    OptionInput { @NotBlank optionName, @NotNull @PositiveOrZero finalPrice, Integer stockQty, Integer sortOrder }
    ImageInput  { @NotBlank imageType(MAIN/SUB/DETAIL), @NotBlank imageUrl, String imageAlt, Integer sortOrder }
ProductCreatedResponse { Long productSeq, String productCode }

UpdateProductRequest    // 본문 = Create와 동일 + 자식에 seq 포함(upsert 판단용)
  (상품 본문 필드) +
  List<OptionUpsert> options,   // optionSeq 있으면 수정, 없으면 신규, 빠진 기존은 소프트삭제(C-Q4)
  List<ImageUpsert>  images,    // 동일 규칙
  List<Long> labelSeqs          // 차집합 교체(빠진 매핑만 삭제·새 매핑만 삽입, C-Q4)

// ── ④ 재고·판매상태 ──────────────────────────────────────────
UpdateProductStatusRequest { @NotBlank String status }   // ON_SALE/LOW_STOCK/SOLD_OUT/STOPPED
UpdateStockRequest         { @NotNull @PositiveOrZero Integer stockQty }   // 절대값 설정(C-Q6)
```

### 0.4 신규 에러코드 (C에서 `ErrorCode`에 추가) — C-Q7 확정(9종 추가)

| 코드 | HTTP | 메시지 | 사용처 |
|------|------|--------|--------|
| `CATEGORY_NOT_FOUND` | 404 | 카테고리를 찾을 수 없습니다. | ①-2/3/4, ③(category_seq 검증) |
| `CATEGORY_HAS_CHILDREN` | 409 | 하위 카테고리 또는 소속 상품이 있어 삭제할 수 없습니다. | ①-4 (overview §3.3 후보 확정) |
| `CATEGORY_DUPLICATED_SLUG` | 409 | 이미 사용 중인 URL 슬러그입니다. | ①-2/3 |
| `CATEGORY_INVALID_PARENT` | 400 | 상위 카테고리가 올바르지 않습니다. | ①-2 (parent가 level1 아님/자기참조) |
| `PRODUCT_DUPLICATED_CODE` | 409 | 이미 사용 중인 상품 코드입니다. | ③-1/2 |
| `PRODUCT_INVALID_STATUS` | 400 | 허용되지 않는 판매 상태입니다. | ④-1 |
| `PRODUCT_OPTION_NOT_FOUND` | 404 | 상품 옵션을 찾을 수 없습니다. | ③-2(seq upsert), ④-2 |
| `PRODUCT_HAS_ORDERS` | 409 | 주문 이력이 있는 상품은 하드 삭제할 수 없습니다. | ⑤ (overview §3.3 후보 확정) |
| `LABEL_NOT_FOUND` | 404 | 라벨을 찾을 수 없습니다. | ③(labelSeqs 검증) |

> 재사용(추가 없음): `PRODUCT_NOT_FOUND`, `COMMON_VALIDATION_ERROR`.

---

## 0.5 M에서 확립된 것 재사용 (명시)

| 자산 | M에서 확립 | C에서 사용 |
|------|-----------|-----------|
| **동적 검색** | `UserSpecs` 정적 팩토리 + `SearchCondition` DTO + 정렬 화이트리스트 + LIKE 이스케이프 | `ProductSpecs`로 **그대로 답습**(C-T2). 신규 패턴 도입 금지 |
| **N+1 회피** | 등급 테이블 1회 일괄 로드 → Map | 카테고리명·옵션재고합·라벨을 목록 매핑 시 **일괄 로드**(기존 `ProductService.loadLabels/loadMainImageUrls`와 동형) |
| **응답 봉투** | `ApiResponse<T>` / `PageResponse<T>` | 동일 |
| **감사** | `AuditorAwareImpl` (u_user/i_user 자동) | 동일. 별도 세팅 불필요 |
| **소프트삭제 필터** | `includeDeleted`(기본 false, `mst_*`만) | ②·① 목록/트리에 동일 적용(결정6) |
| **권한 2차 방어** | 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")` | 동일 |

---

## 1. 의존성 그래프

```
C-T1 카테고리 2단계 트리 CRUD  ← [수동리뷰 필수] (트리 삭제 무결성)
   │   (category_seq 마스터 — 상품이 참조)
   ▼
C-T2 상품 목록·검색 + 상세 (ProductSpecs = UserSpecs 답습)
   │
   ▼
C-T3 상품 등록·수정 (옵션·이미지·라벨 일괄)  ← [수동리뷰 필수] (트랜잭션 원자성)
   │
   ├─▶ C-T4 재고·판매상태 관리
   └─▶ C-T5 상품 소프트삭제 (주문 참조 가드)  ← [수동리뷰 필수] (PRODUCT_HAS_ORDERS)
```

권장 순서: **C-T1 → C-T2 → C-T3 → C-T4 · C-T5**

> **`[수동리뷰 필수]` task: C-T1 · C-T3 · C-T5** (커밋 전 멈춰 승인). 그 외(C-T2·C-T4)는 승인 없이 커밋 가능(push 금지).

---

## C-T1. 카테고리 2단계 트리 CRUD `[수동리뷰 필수]`

**삭제 무결성(자식 검사)이 핵심 리뷰 포인트.**

### 범위
- `admin/category/controller/AdminCategoryController.java` — `/api/v1/admin/categories`(`@PreAuthorize`).
- `admin/category/service/AdminCategoryService.java`:
  - **트리 조회(①-1)**: 기존 `CategoryService.getVisibleTree`의 메모리 조립 패턴 답습하되 **운영 뷰**
    (display_yn 무관, `includeDeleted=false`면 use_yn='Y'만 / true면 전체). 각 노드에
    `childCategoryCount`·`productCount` 채움(일괄 카운트, N+1 금지).
  - **생성(①-2)**: parentSeq null → level1, 값 있으면 level2(부모가 존재·level1·use_yn='Y' 아니면
    `CATEGORY_INVALID_PARENT`). url_slug 활성 중복 시 `CATEGORY_DUPLICATED_SLUG`.
  - **수정(①-3)**: 이름·슬러그·정렬·노출(display_yn) 갱신. 슬러그 변경 시 본인 제외 활성 중복 검사.
  - **소프트삭제(①-4)**: **자식 검사 → 있으면 `CATEGORY_HAS_CHILDREN`**, 없으면 `use_yn='N'`+`display_yn='N'`.
- `Category` 엔티티에 도메인 메서드 추가: `updateInfo(...)`, `changeDisplay(boolean)`, `softDelete()`.
- 리포지토리 추가(파생 쿼리): `existsByUrlSlugAndUseYn`, `findAllByParentSeqAndUseYn`,
  `countByParentSeqAndUseYn`, `countByUseYn`(트리 로드용). 상품 카운트는
  `ProductRepository.countByCategorySeqAndUseYn`.

### 설계 결정 / 핵심 검증 포인트
- **"자식" 판정(C-Q2)**: 활성(use_yn='Y') **하위 카테고리** 또는 활성 **소속 상품**이 1건이라도 있으면 삭제 차단.
  소프트삭제된 자식은 차단하지 않음. → 통합 테스트로 두 경로(하위카테고리 차단·소속상품 차단) 모두 닫는다.
  > **빚(범위 외, 추후 재검토)**: **카테고리 복구 플로우는 본 모듈 범위 외**다. 활성 자식만 차단하므로
  > 소프트삭제된 부모를 복구할 때 소프트삭제된 자식과의 정합(자식 동반 복구 여부·고아 방지)은 정의되지 않았다.
  > 복구 API를 신설하는 시점에 자식 정합 규칙을 함께 재검토한다.
- **2단계 강제**: level1은 parent 없음, level2는 parent가 반드시 level1. 3단계 생성 시도 차단.
- 트리 조립은 메모리 1패스(부모-자식). 카운트는 `parent_seq`별·`category_seq`별 일괄 집계 후 매핑.

### 완료 기준
- **통합 테스트**(Testcontainers): 트리 조회(level1/level2 중첩 + 카운트 정확), 생성(level1·level2),
  잘못된 parent 400, 슬러그 중복 409, 수정(노출 토글 포함), **삭제 차단 2종**(하위카테고리 보유·소속상품 보유 →
  `CATEGORY_HAS_CHILDREN`), 자식 없는 카테고리 삭제 200 + DB `use_yn='N'`, `includeDeleted` on/off.
- **build** 통과. **실제 요청**: 생성→트리조회→삭제차단→삭제 curl. 
- **회귀**: 기존 `/api/v1/categories`(노출 트리) 정상.

### 의존성 / 위험도
- 의존: 없음(C 시작점). · **위험도: 중~높음** — 삭제 무결성·2단계 제약. 자식 검사 누락 = 데이터 고아화 위험.

---

## C-T2. 상품 목록·검색 + 상세 (ProductSpecs = UserSpecs 답습)

### 범위
- `ProductRepository extends JpaSpecificationExecutor<Product>` 추가(기존 파생 쿼리 유지).
- `admin/product/spec/ProductSpecs.java` — **M-T1 `UserSpecs`와 동일 규약**(전부 null-safe 정적 팩토리):
  - `productCodeLike`, `productNameLike`, `keyword(q)`(code OR name), `categorySeqEq`, `displayYnEq`,
    `statusEq`, `activeOnly()` / `includeDeleted` 분기.
  - **LIKE 이스케이프**(`\`, `%`, `_`)는 M-T1 helper 규약 그대로.
- `admin/product/dto/ProductSearchCondition.java`(0.3), `AdminProductListItem.java`.
- `admin/product/controller/AdminProductController.java` — `GET /api/v1/admin/products`(목록),
  `GET /api/v1/admin/products/{productSeq}`(상세).
- `admin/product/service/AdminProductService.java`:
  - 목록: `findAll(spec, pageable)` → `PageResponse<AdminProductListItem>`. **정렬 화이트리스트**
    (productSeq/productCode/productName/basePrice/createdDate → 엔티티 속성 매핑, 그 외 차단).
  - 카테고리명·옵션재고합을 **일괄 로드**(productSeq 목록으로 1회씩) → Map 매핑(N+1 금지).
  - 상세(②-2): 상품 + 활성 옵션/이미지/라벨 조회 → `AdminProductDetailResponse`. 미존재 `PRODUCT_NOT_FOUND`.
    (라벨/이미지 일괄 로드는 기존 `ProductService.loadLabels` 패턴 재사용 검토.)

### 완료 기준
- **통합 테스트**: 조건별 단독·조합 검색(code/name/category/displayYn/status), `includeDeleted` on/off,
  정렬 화이트리스트(임의 컬럼 차단), 페이징, 빈 결과, **옵션재고합/카테고리명 정확 + N+1 미발생**
  (Hibernate Statistics statement count가 page size와 무관하게 일정 — M-T1과 동일 증명),
  상세 200(자식 채워짐)·미존재 404.
- **build** 통과. **실제 요청**: 다축 조합 curl + 상세 curl.
- **회귀**: 기존 사용자 측 `/api/v1/products` 목록/상세 정상.

### 의존성 / 위험도
- 의존: C-T1(category_seq·카테고리명 조인). · **위험도: 저~중** — 순수 조회. M-T1 패턴 답습이라 신규 설계 위험 낮음.
  단 정렬 화이트리스트·N+1 일괄로드는 M 표준대로 반드시 적용.

---

## C-T3. 상품 등록·수정 (옵션·이미지·라벨 일괄) `[수동리뷰 필수]`

**부모-자식을 한 요청에 등록/수정 — 자식 일부 실패 시 전체 롤백(트랜잭션 원자성)이 핵심 리뷰 포인트.**

### 범위
- **등록(③-1)** — 단일 `@Transactional`:
  - product_code 활성 중복 → `PRODUCT_DUPLICATED_CODE`. category_seq 지정 시 존재·use_yn='Y' 검증
    (없으면 `CATEGORY_NOT_FOUND`). labelSeqs는 전부 활성 라벨 검증(없으면 `LABEL_NOT_FOUND`).
  - `mst_product` insert → 자식 `mst_product_option`/`mst_product_image` 일괄 insert →
    `map_product_label` insert(태그 매핑). **하나라도 실패하면 전체 롤백.**
  - **옵션 개수(C-Q4 확정)**: **0개 허용**(옵션 없는 단일상품 — 기존 사용자 측 `CartService.resolveOption`이
    0-옵션 상품을 정식 지원). 강제 최소 1개 없음. 이미지·라벨도 0개 허용.
- **수정(③-2)** — 단일 `@Transactional`:
  - 상품 본문 갱신(코드 변경 시 본인 제외 활성 중복 검사). category/label 동일 검증.
  - **자식 동기화(C-Q4)**: 옵션/이미지는 **seq 기준 upsert**(seq 있으면 수정, 없으면 신규,
    요청에서 빠진 기존 활성 행은 **소프트삭제** use_yn='N'). 잘못된 optionSeq → `PRODUCT_OPTION_NOT_FOUND`.
  - **라벨 차집합 교체(C-Q4 재구성)**: 들어온 `labelSeqs` vs 현재 매핑을 비교해 **빠진 매핑만 DELETE,
    새 매핑만 INSERT, 변경 없는 라벨은 미변경**(전량 DELETE+재INSERT 아님). 모두 단일 트랜잭션 안.
    → `map_product_label`은 **상태성 매핑**이므로 교체가 정식 허용된다(overview §3.4 범위 명확화 반영 완료).
- `Product`/`ProductOption`/`ProductImage` 엔티티에 도메인 메서드 추가(updateInfo/changeStock 등).
- 리포지토리: `ProductRepository.existsByProductCodeAndUseYn`, 옵션/이미지 `findAllByProductSeqAndUseYn`.

### 설계 결정 / 핵심 검증 포인트
- **원자성**: 등록/수정 전 과정을 단일 트랜잭션으로 묶고, **자식 insert 중 강제 예외 시 부모까지 롤백**됨을
  통합 테스트로 증명(중간 실패 케이스 주입 → DB에 부분 데이터 0건 확인).
- **라벨 차집합(C-Q4)**: `map_product_label`은 "현재 붙은 태그 집합"을 표현하는 **상태성 매핑**으로,
  과거 이력 보존 대상이 아니다(overview §3.4 수정 반영 — 이력성 `map_*`만 변경/삭제 금지, 상태성은 교체 허용).
  교체는 전량 삭제가 아니라 **차집합 적용**: `toAdd = 요청 − 현재`, `toRemove = 현재 − 요청`, 교집합은 미변경.

### 완료 기준
- **통합 테스트**: 등록 200(상품+옵션N+이미지N+라벨N 모두 생성 확인), **옵션 0개 등록도 200**, 코드 중복 409,
  미존재 카테고리 404, 미존재 라벨 404, **자식 insert 중간 실패 → 전체 롤백(상품·옵션·이미지·매핑 0건)**,
  수정 시 옵션 upsert(수정/신규/소프트삭제 동시), **라벨 차집합 교체**(추가/삭제만 발생·변경없는 라벨 매핑은
  i_date 등 미변경 확인), 잘못된 optionSeq 404.
- **build** 통과. **실제 요청**: 등록(옵션2+이미지2+라벨2) curl → 상세 조회로 확인 → 수정 curl.
- **회귀**: 기존 사용자 측 상품 상세에 신규 등록 상품 정상 노출(display_yn='Y'일 때).

### 의존성 / 위험도
- 의존: C-T1(카테고리), C-T2(상세 조회로 검증). · **위험도: 높음** — 다중 자식 원자성·upsert 동기화·라벨 정책.

---

## C-T4. 재고·판매상태 관리

### 범위
- **판매상태(④-1)**: `PATCH /products/{productSeq}/status` — 화이트리스트
  (**ON_SALE/LOW_STOCK/SOLD_OUT/STOPPED**) 검증, 외면 `PRODUCT_INVALID_STATUS`, 통과 시 `product_status` 갱신.
- **재고(④-2)**: `PATCH /products/{productSeq}/options/{optionSeq}/stock` — 해당 옵션이 그 상품 소속·활성인지
  검증(아니면 `PRODUCT_OPTION_NOT_FOUND`), `stock_qty` **절대값 설정**(음수 거부 = `COMMON_VALIDATION_ERROR`).
- `Product.changeStatus(String)`, `ProductOption.changeStock(int)` 도메인 메서드(없으면 추가).

### 완료 기준
- **통합 테스트**: 상태 변경 200 + DB 반영 + `u_user` 기록, 잘못된 상태 400, 재고 설정 200 + 반영,
  타 상품 옵션 지정 404, 음수 재고 400.
- **build** 통과. **실제 요청**: 상태 1 + 재고 1 curl. **회귀**: 영향 없음.

### 의존성 / 위험도
- 의존: C-T3(상품·옵션 존재). · **위험도: 저** — 단순 단일행 수정. 화이트리스트·소속 검증만 확인.

---

## C-T5. 상품 소프트삭제 (주문 참조 가드) `[수동리뷰 필수]`

**주문 이력이 있는 상품의 하드삭제 금지(`PRODUCT_HAS_ORDERS`)가 핵심 — 스냅샷/이력 보존 무결성.**

### 범위
- `DELETE /products/{productSeq}` — 항상 **소프트삭제**(`use_yn='N'`+`display_yn='N'`). 미존재 `PRODUCT_NOT_FOUND`.
- **주문 참조 불변식**: `dat_order_item.product_seq` 참조가 있으면 **하드삭제 경로를 금지**한다.
  - `OrderItemRepository.existsByProductSeq(Long)` 추가(현재 미존재 — 신규 파생 쿼리).
  - 정상 삭제는 항상 소프트삭제로 처리되므로 주문 유무와 무관히 200. **하드삭제 API는 노출하지 않는다(C-Q5 확정).**
    `PRODUCT_HAS_ORDERS`는 **하드삭제를 시도하는 코드 경로**(향후 일괄정리/관리 배치)에서 주문 참조 시 던지는
    방어 코드로만 심는다. **현재 노출 API에선 런타임 도달 불가** — M-T6의 `assertNotLastAdmin` 선례대로
    가드 위에 다음 취지의 주석을 남긴다(미사용 오인 삭제 방지):
    > 현재 소프트삭제 경로만 노출되어 이 하드삭제 가드는 런타임 도달 불가다. 배치/일괄정리 경로가 생기면
    > 활성화되므로 방어적으로 유지한다(미사용 오인 삭제 금지). 단위검증으로 가드 자체는 커버.
- 자식(옵션·이미지) 동반 소프트삭제(C-Q5 확정): 상품 소프트삭제 시 **옵션·이미지도 use_yn='N' 동반**.

### 완료 기준
- **통합 테스트**: 주문 이력 없는 상품 삭제 200 + DB `use_yn='N'`+`display_yn='N'` + 자식 동반 처리,
  주문 이력 있는 상품 삭제 200(소프트) + **상품·주문 스냅샷 보존 확인**, (하드삭제 경로 제공 시)
  주문 이력 상품 하드삭제 → `PRODUCT_HAS_ORDERS`, 미존재 404.
- **build** 통과. **실제 요청**: 주문있는 상품/없는 상품 삭제 curl + 사용자 측 비노출 확인.
- **회귀**: 삭제된 상품이 사용자 측 목록/상세에서 사라지고, 기존 주문 상세의 스냅샷은 그대로.

### 의존성 / 위험도
- 의존: C-T2(조회), `dat_order_item`(M4 주문). · **위험도: 중~높음** — 이력 보존·하드삭제 금지 불변식.

---

## 신규/수정 파일 (대표 경로)

```
src/main/java/com/micoz/admin/category/controller/AdminCategoryController.java   (신규, C-T1)
src/main/java/com/micoz/admin/category/service/AdminCategoryService.java         (신규, C-T1)
src/main/java/com/micoz/admin/category/dto/AdminCategoryNode.java                (신규, C-T1)
src/main/java/com/micoz/admin/category/dto/CreateCategoryRequest.java            (신규, C-T1)
src/main/java/com/micoz/admin/category/dto/UpdateCategoryRequest.java            (신규, C-T1)
src/main/java/com/micoz/admin/category/dto/CategoryCreatedResponse.java          (신규, C-T1)
src/main/java/com/micoz/admin/product/controller/AdminProductController.java     (신규, C-T2~T5)
src/main/java/com/micoz/admin/product/service/AdminProductService.java           (신규, C-T2~T5)
src/main/java/com/micoz/admin/product/spec/ProductSpecs.java                     (신규, C-T2)
src/main/java/com/micoz/admin/product/dto/ProductSearchCondition.java            (신규, C-T2)
src/main/java/com/micoz/admin/product/dto/AdminProductListItem.java              (신규, C-T2)
src/main/java/com/micoz/admin/product/dto/AdminProductDetailResponse.java        (신규, C-T2)
src/main/java/com/micoz/admin/product/dto/CreateProductRequest.java              (신규, C-T3)
src/main/java/com/micoz/admin/product/dto/UpdateProductRequest.java              (신규, C-T3)
src/main/java/com/micoz/admin/product/dto/ProductCreatedResponse.java            (신규, C-T3)
src/main/java/com/micoz/admin/product/dto/UpdateProductStatusRequest.java        (신규, C-T4)
src/main/java/com/micoz/admin/product/dto/UpdateStockRequest.java                (신규, C-T4)
src/main/java/com/micoz/category/entity/Category.java                            (수정, C-T1: updateInfo/changeDisplay/softDelete)
src/main/java/com/micoz/category/repository/CategoryRepository.java              (수정, C-T1: 활성중복/자식 카운트 파생쿼리)
src/main/java/com/micoz/product/entity/Product.java                              (수정, C-T3/T4/T5: updateInfo/changeStatus/softDelete)
src/main/java/com/micoz/product/entity/ProductOption.java                        (수정, C-T3/T4: updateInfo/changeStock/softDelete)
src/main/java/com/micoz/product/entity/ProductImage.java                         (수정, C-T3: updateInfo/softDelete)
src/main/java/com/micoz/product/repository/ProductRepository.java                (수정, C-T2: JpaSpecificationExecutor / C-T3: existsByProductCodeAndUseYn / C-T1: countByCategorySeqAndUseYn)
src/main/java/com/micoz/order/repository/OrderItemRepository.java                (수정, C-T5: existsByProductSeq)
src/main/java/com/micoz/common/response/ErrorCode.java                           (수정, C-T1/T3/T4/T5: 0.4 신규 코드)
src/test/java/com/micoz/admin/category/AdminCategoryIntegrationTest.java         (신규, C-T1)
src/test/java/com/micoz/admin/product/AdminProductSearchIntegrationTest.java     (신규, C-T2)
src/test/java/com/micoz/admin/product/AdminProductCommandIntegrationTest.java    (신규, C-T3~T5)
```

> DB 마이그레이션(V9+): **불필요** 전제. 단 `map_product_label` 물리삭제 허용(C-Q4) 또는
> 상태/레벨 CHECK 제약 도입을 결정하면 그때 재검토(현재는 애플리케이션 레벨 화이트리스트 검증).

---

## 확정 결과 (C-Q) — 2026-06-26 리뷰 반영

| # | 항목 | 확정 |
|---|------|------|
| **C-Q1** | 관리자 트리 응답 DTO | **`AdminCategoryNode` 분리**(운영 필드 + childCategoryCount/productCount). 사용자 `CategoryNode` 미오염 |
| **C-Q2** | 카테고리 삭제 차단 "자식" 판정 | **활성(use_yn='Y') 하위카테고리 또는 활성 소속상품 1건↑이면 차단**. 소프트삭제된 자식은 차단 안 함. *복구 플로우는 범위 외 — 빚으로 명시(C-T1)* |
| **C-Q3** | 카테고리 부모 이동/레벨 변경 | **불가(2단계 고정)**. 이름·슬러그·노출·정렬만 수정 |
| **C-Q4** | 자식 동기화 + 라벨 매핑 | 옵션/이미지=**seq upsert + 미포함분 소프트삭제**. 라벨=**차집합 교체**(빠진 매핑만 삭제·새 매핑만 삽입·변경없는 건 미변경). **`map_product_label`은 상태성 매핑 → overview §3.4 범위 명확화로 교체 정식 허용**(§3.4 위반 아님). **옵션 개수 = 0개 허용**(옵션 없는 단일상품, 기존 `CartService` 0-옵션 지원) |
| **C-Q5** | ⑤ 하드삭제 노출 | **소프트삭제 API만 노출**(옵션·이미지 동반 use_yn='N'). `PRODUCT_HAS_ORDERS`는 방어 가드로만 심고 M-T6 선례대로 "런타임 도달 불가, 배치 경로 생기면 활성화" 주석 |
| **C-Q6** | ④ 재고 변경 방식 | **절대값 설정(PATCH stockQty)**, 음수 거부 |
| **C-Q7** | 신규 에러코드 9종(0.4) | **표대로 추가** |

**`[수동리뷰 필수]` task: C-T1 · C-T3 · C-T5** (커밋 전 멈춰 승인).
그 외(C-T2 · C-T4)는 승인 없이 커밋 가능(push 금지).

> **연계 문서 수정**: overview `§3.4`에 "**이력성 `map_*`만 변경/삭제 금지, 상태성 `map_*`(라벨 등)은 교체 허용**"
> 구분을 추가 완료(C-Q4 근거). → 확정 완료. C-T1부터 구현 시작.

---

## 진행 체크리스트

- [ ] 본 분할 문서 리뷰 → C-Q1~Q7 확정
- [ ] C-T1 카테고리 트리 CRUD `[수동리뷰 필수]` → 검증 + 커밋 후보 제시 → **승인 대기**
- [ ] C-T2 상품 목록·검색 + 상세 → 검증 통과 시 단독 커밋(push 금지)
- [ ] C-T3 상품 등록·수정 `[수동리뷰 필수]` → 검증 + 커밋 후보 제시 → **승인 대기**
- [ ] C-T4 재고·판매상태 → 검증 통과 시 단독 커밋(push 금지)
- [ ] C-T5 상품 소프트삭제 `[수동리뷰 필수]` → 검증 + 커밋 후보 제시 → **승인 대기**
- [ ] C 전체 통합 검토 요약 → 멈춤
