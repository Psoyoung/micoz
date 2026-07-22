// 관리자 카테고리 도메인 — 출처: docs/admin_api.md §C (C-1 트리조회 · C-2 생성 · C-3 수정 · C-4 삭제).
// members.ts 구조를 따름: DTO(명세 그대로) → 매퍼 → 뷰모델 → React Query 훅.
// C-1 은 페이징 없는 중첩 트리(2단계) — PageResponse 미사용.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminGet, adminPost, adminPatch, adminDelete } from './client'

/* ─── DTO (명세 그대로) ─── */
// C-1 AdminCategoryNode — 중첩 트리, 재귀
export interface AdminCategoryNodeDto {
  categorySeq: number
  parentSeq: number | null
  categoryName: string
  urlSlug: string
  categoryLevel: number
  sortOrder: number
  displayYn: string // Y/N
  useYn: string // Y/N
  childCategoryCount: number
  productCount: number
  children: AdminCategoryNodeDto[]
}

// C-2 CreateCategoryRequest
export interface CreateCategoryRequest {
  parentSeq?: number | null // 미지정/null=대분류(level1), 값=중분류(level2)
  categoryName: string
  urlSlug: string
  sortOrder?: number
  displayYn?: string // 미지정 시 서버 기본 Y
}

// C-3 UpdateCategoryRequest — 전부 선택, 부모/레벨 이동 불가
export interface UpdateCategoryRequest {
  categoryName?: string
  urlSlug?: string
  sortOrder?: number
  displayYn?: string
}

/* ─── 뷰모델 (트리 구조 유지) ─── */
export interface AdminCategoryVM {
  categorySeq: number
  name: string
  slug: string
  level: number
  sortOrder: number
  displayYn: string // Y/N
  useYn: string // Y/N
  childCount: number
  productCount: number
  children: AdminCategoryVM[]
}

/* ─── 매퍼 ─── */
export function toCategoryVM(d: AdminCategoryNodeDto): AdminCategoryVM {
  return {
    categorySeq: d.categorySeq,
    name: d.categoryName,
    slug: d.urlSlug,
    level: d.categoryLevel,
    sortOrder: d.sortOrder,
    displayYn: d.displayYn,
    useYn: d.useYn,
    childCount: d.childCategoryCount ?? 0,
    productCount: d.productCount ?? 0,
    children: (d.children ?? []).map(toCategoryVM),
  }
}

/* ─── API ─── */
export function listCategories(includeDeleted?: boolean): Promise<AdminCategoryNodeDto[]> {
  return adminGet<AdminCategoryNodeDto[]>('/admin/categories', { params: { includeDeleted } })
}
// C-2 생성 — 응답 CategoryCreatedResponse { categorySeq }
export function createCategory(req: CreateCategoryRequest): Promise<{ categorySeq: number }> {
  return adminPost<{ categorySeq: number }>('/admin/categories', req)
}
// C-3 수정(부분) — data 없음
export function updateCategory(categorySeq: number, req: UpdateCategoryRequest): Promise<void> {
  return adminPatch<void>(`/admin/categories/${categorySeq}`, req)
}
// C-4 삭제(소프트) — data 없음. CATEGORY_HAS_CHILDREN(409) 하위/소속상품 존재 시 차단.
export function deleteCategory(categorySeq: number): Promise<void> {
  return adminDelete<void>(`/admin/categories/${categorySeq}`)
}

/* ─── 훅 ─── */
export const categoryKeys = {
  list: (includeDeleted?: boolean) => ['admin', 'categories', 'list', includeDeleted ?? false] as const,
  all: ['admin', 'categories'] as const, // invalidate 시 includeDeleted 무관 전체 매칭용 prefix
}

export function useCategories(includeDeleted?: boolean) {
  return useQuery({
    queryKey: categoryKeys.list(includeDeleted),
    queryFn: () => listCategories(includeDeleted),
    select: (nodes): AdminCategoryVM[] => nodes.map(toCategoryVM),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateCategoryRequest) => createCategory(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ categorySeq, req }: { categorySeq: number; req: UpdateCategoryRequest }) => updateCategory(categorySeq, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (categorySeq: number) => deleteCategory(categorySeq),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}

// Products 화면 카테고리 드롭다운용 평면 옵션. useCategories 와 동일 queryKey 재사용(캐시 공유).
export function useCategoryOptions(): { k: string; l: string }[] {
  const { data } = useQuery({
    queryKey: categoryKeys.list(false),
    queryFn: () => listCategories(false),
    select: (nodes): { k: string; l: string }[] => {
      const opts: { k: string; l: string }[] = [{ k: 'all', l: '전체 카테고리' }]
      for (const parent of nodes) {
        opts.push({ k: String(parent.categorySeq), l: parent.categoryName })
        for (const child of parent.children ?? []) {
          opts.push({ k: String(child.categorySeq), l: '— ' + child.categoryName })
        }
      }
      return opts
    },
  })
  return data ?? [{ k: 'all', l: '전체 카테고리' }]
}
