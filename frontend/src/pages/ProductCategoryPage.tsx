import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ProductCard, Product } from '../components/ProductCard';

interface ProductCategoryPageProps {
  category: string;
  title: string;
  description?: string;
}

interface FilterState {
  subCategory: string;
  minPrice: number;
  maxPrice: number;
  sortBy: 'createdAt' | 'price' | 'name' | 'publishedAt';
  sortOrder: 'asc' | 'desc';
  search: string;
}

interface ProductResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    category?: string;
    subCategory?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy: string;
    sortOrder: string;
  };
}

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.secondary.ivory};
`;

const HeroSection = styled.section`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary.sage}, ${({ theme }) => theme.colors.primary.deepForest});
  color: ${({ theme }) => theme.colors.secondary.ivory};
  padding: ${({ theme }) => theme.spacing[20]} 0 ${({ theme }) => theme.spacing[12]} 0;
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[16]} 0 ${({ theme }) => theme.spacing[8]} 0;
  }
`;

const Container = styled.div`
  max-width: ${({ theme }) => theme.grid.container};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const HeroTitle = styled(motion.h1)`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
`;

const HeroDescription = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  max-width: 600px;
  margin: 0 auto ${({ theme }) => theme.spacing[8]} auto;
  opacity: 0.9;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize.base};
  }
`;

const ContentSection = styled.section`
  padding: ${({ theme }) => theme.spacing[12]} 0;
`;

const FilterBar = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.base};
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  min-width: 150px;
`;

const FilterLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
`;

const FilterSelect = styled.select`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: white;
  cursor: pointer;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
    outline-offset: -2px;
  }
`;

const FilterInput = styled.input`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  width: 100px;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
    outline-offset: -2px;
  }
`;

const SearchInput = styled.input`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  min-width: 200px;
  flex: 1;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
    outline-offset: -2px;
  }
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[4]};
    align-items: stretch;
  }
`;

const ResultsCount = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: ${({ theme }) => theme.spacing[4]};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[8]};
`;

const PaginationButton = styled.button<{ active?: boolean }>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: ${({ active, theme }) => active ? theme.colors.primary.sage : 'white'};
  color: ${({ active, theme }) => active ? theme.colors.secondary.ivory : theme.colors.secondary.charcoal};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  &:hover:not(:disabled) {
    background: ${({ active, theme }) => active ? theme.colors.primary.sage : theme.colors.gray[100]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 서브카테고리 옵션들
const subCategoryOptions = {
  '스킨케어': [
    { value: '', label: '전체' },
    { value: '클렌저', label: '클렌저' },
    { value: '토너', label: '토너' },
    { value: '세럼', label: '세럼' },
    { value: '모이스처라이저', label: '모이스처라이저' },
    { value: '선케어', label: '선케어' }
  ],
  '메이크업': [
    { value: '', label: '전체' },
    { value: '베이스', label: '베이스' },
    { value: '립', label: '립' },
    { value: '아이', label: '아이' },
    { value: '체크', label: '체크' }
  ],
  '바디케어': [
    { value: '', label: '전체' },
    { value: '로션', label: '로션' },
    { value: '크림', label: '크림' },
    { value: '오일', label: '오일' }
  ],
  '향수': [
    { value: '', label: '전체' },
    { value: '오드 뚜왈렛', label: '오드 뚜왈렛' },
    { value: '오드 퍼퓸', label: '오드 퍼퓸' }
  ]
};

export const ProductCategoryPage: React.FC<ProductCategoryPageProps> = ({
  category,
  title,
  description
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<ProductResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [filters, setFilters] = useState<FilterState>({
    subCategory: '',
    minPrice: 0,
    maxPrice: 1000000,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: ''
  });

  // API에서 제품 데이터 가져오기
  const fetchProducts = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: encodeURIComponent(category),
        page: page.toString(),
        limit: '12',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (filters.subCategory) {
        params.append('subCategory', encodeURIComponent(filters.subCategory));
      }
      if (filters.minPrice > 0) {
        params.append('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice < 1000000) {
        params.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters.search) {
        params.append('search', encodeURIComponent(filters.search));
      }

      const response = await fetch(`http://localhost:5000/api/products?${params}`);
      const data: ProductResponse = await response.json();
      
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('제품 데이터를 가져오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터나 페이지가 변경될 때마다 데이터 다시 가져오기
  useEffect(() => {
    fetchProducts(currentPage);
  }, [category, filters, currentPage]);

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductClick = (product: Product) => {
    // 제품 상세 페이지로 이동
    console.log('제품 클릭:', product.slug);
    // 실제로는 라우터를 사용해서 이동
  };

  const handleAddToCart = (product: Product) => {
    // 장바구니에 추가
    console.log('장바구니에 추가:', product.name);
    // 실제로는 Redux 액션이나 Context를 사용
  };

  const currentSubCategoryOptions = subCategoryOptions[category as keyof typeof subCategoryOptions] || [{ value: '', label: '전체' }];

  return (
    <PageContainer>
      <HeroSection>
        <Container>
          <HeroTitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {title}
          </HeroTitle>
          {description && (
            <HeroDescription
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {description}
            </HeroDescription>
          )}
        </Container>
      </HeroSection>

      <ContentSection>
        <Container>
          <FilterBar>
            <FilterGroup>
              <FilterLabel>카테고리</FilterLabel>
              <FilterSelect 
                value={filters.subCategory} 
                onChange={(e) => handleFilterChange('subCategory', e.target.value)}
              >
                {currentSubCategoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>정렬</FilterLabel>
              <FilterSelect 
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [FilterState['sortBy'], FilterState['sortOrder']];
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
              >
                <option value="createdAt-desc">최신순</option>
                <option value="price-asc">가격낮은순</option>
                <option value="price-desc">가격높은순</option>
                <option value="name-asc">이름순</option>
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>가격 범위</FilterLabel>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FilterInput 
                  type="number" 
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', parseInt(e.target.value) || 0)}
                  placeholder="최소"
                />
                <span>~</span>
                <FilterInput 
                  type="number" 
                  value={filters.maxPrice === 1000000 ? '' : filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value) || 1000000)}
                  placeholder="최대"
                />
              </div>
            </FilterGroup>

            <FilterGroup style={{ flex: 1 }}>
              <FilterLabel>제품 검색</FilterLabel>
              <SearchInput 
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="제품명 또는 설명으로 검색"
              />
            </FilterGroup>
          </FilterBar>

          <ResultsHeader>
            <ResultsCount>
              {pagination ? `총 ${pagination.totalCount}개 제품` : ''}
            </ResultsCount>
          </ResultsHeader>

          {loading ? (
            <LoadingSpinner>제품을 불러오는 중...</LoadingSpinner>
          ) : (
            <>
              <ProductGrid>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                    showWishlistButton={true}
                  />
                ))}
              </ProductGrid>

              {pagination && pagination.totalPages > 1 && (
                <PaginationContainer>
                  <PaginationButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    이전
                  </PaginationButton>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationButton
                      key={page}
                      active={page === currentPage}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </PaginationButton>
                  ))}

                  <PaginationButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    다음
                  </PaginationButton>
                </PaginationContainer>
              )}
            </>
          )}

          {!loading && products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: '18px', color: '#666' }}>
                검색 조건에 맞는 제품이 없습니다.
              </p>
            </div>
          )}
        </Container>
      </ContentSection>
    </PageContainer>
  );
};