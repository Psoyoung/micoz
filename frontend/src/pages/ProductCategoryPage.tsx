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
      // 임시 스킨케어 제품 데이터
      const mockSkincareProducts: Product[] = [
        {
          id: '1',
          name: '젠틀 포밍 클렌저',
          description: '민감한 피부를 위한 부드러운 폼 클렌저입니다. 천연 성분으로 메이크업과 불순물을 깔끔하게 제거하면서도 피부 본연의 수분은 지켜줍니다.',
          price: 32000,
          category: '스킨케어',
          subCategory: '클렌저',
          brand: 'MICOZ',
          slug: 'gentle-foaming-cleanser',
          images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'],
          isNew: true,
          isBestseller: false,
          featured: false,
          inventory: 50,
          rating: { average: 4.8, count: 32 },
          wishlistCount: 15,
          createdAt: '2024-01-15T10:00:00Z',
          publishedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          name: '딥 클렌징 오일',
          description: '워터프루프 메이크업까지 깔끔하게 제거하는 클렌징 오일입니다. 식물성 오일로 만들어져 피부에 부담을 주지 않으면서도 깊숙한 노폐물까지 제거합니다.',
          price: 28000,
          category: '스킨케어',
          subCategory: '클렌저',
          brand: 'MICOZ',
          slug: 'deep-cleansing-oil',
          images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400'],
          isNew: false,
          isBestseller: true,
          featured: false,
          inventory: 35,
          rating: { average: 4.6, count: 28 },
          wishlistCount: 22,
          createdAt: '2024-01-10T10:00:00Z',
          publishedAt: '2024-01-10T10:00:00Z',
        },
        {
          id: '3',
          name: '하이드레이팅 토너',
          description: '깊은 수분 공급으로 건조한 피부에 생기를 불어넣는 하이드레이팅 토너입니다. 7가지 히알루론산이 피부 깊숙이 수분을 전달합니다.',
          price: 24000,
          category: '스킨케어',
          subCategory: '토너',
          brand: 'MICOZ',
          slug: 'hydrating-toner',
          images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600'],
          isNew: false,
          isBestseller: false,
          featured: true,
          inventory: 42,
          rating: { average: 4.7, count: 18 },
          wishlistCount: 9,
          createdAt: '2024-01-05T10:00:00Z',
          publishedAt: '2024-01-05T10:00:00Z',
        },
        {
          id: '4',
          name: '비타민 C 브라이트닝 세럼',
          description: '순수 비타민 C로 칙칙한 피부를 밝게 가꿔주는 브라이트닝 세럼입니다. 멜라닌 생성을 억제하여 깨끗하고 투명한 피부로 만들어줍니다.',
          price: 45000,
          category: '스킨케어',
          subCategory: '세럼',
          brand: 'MICOZ',
          slug: 'vitamin-c-serum',
          images: ['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400'],
          isNew: true,
          isBestseller: true,
          featured: true,
          inventory: 25,
          rating: { average: 4.9, count: 45 },
          wishlistCount: 38,
          createdAt: '2024-01-20T10:00:00Z',
          publishedAt: '2024-01-20T10:00:00Z',
        },
        {
          id: '5',
          name: '레티놀 안티에이징 세럼',
          description: '순순한 레티놀로 주름과 탄력 개선에 도움을 주는 안티에이징 세럼입니다. 야간에 사용하여 피부 재생을 촉진시킵니다.',
          price: 52000,
          category: '스킨케어',
          subCategory: '세럼',
          brand: 'MICOZ',
          slug: 'retinol-serum',
          images: ['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600'],
          isNew: false,
          isBestseller: false,
          featured: false,
          inventory: 18,
          rating: { average: 4.5, count: 22 },
          wishlistCount: 16,
          createdAt: '2024-01-08T10:00:00Z',
          publishedAt: '2024-01-08T10:00:00Z',
        },
        {
          id: '6',
          name: '올-인-원 모이스처라이저',
          description: '하나로 끝내는 올인원 모이스처라이저입니다. 세럼, 크림, 앰플의 기능을 모두 담아 간편하고 효과적인 스킨케어를 완성합니다.',
          price: 38000,
          category: '스킨케어',
          subCategory: '크림',
          brand: 'MICOZ',
          slug: 'all-in-one-moisturizer',
          images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600'],
          isNew: false,
          isBestseller: true,
          featured: false,
          inventory: 33,
          rating: { average: 4.4, count: 35 },
          wishlistCount: 20,
          createdAt: '2024-01-12T10:00:00Z',
          publishedAt: '2024-01-12T10:00:00Z',
        }
      ];

      // 카테고리별 필터링
      let filteredProducts = mockSkincareProducts;
      if (category === '스킨케어') {
        filteredProducts = mockSkincareProducts;
      } else {
        filteredProducts = []; // 다른 카테고리는 빈 배열
      }

      // 서브카테고리 필터링
      if (filters.subCategory) {
        filteredProducts = filteredProducts.filter(product => 
          product.subCategory === filters.subCategory
        );
      }

      // 가격 필터링
      if (filters.minPrice > 0) {
        filteredProducts = filteredProducts.filter(product => 
          product.price >= filters.minPrice
        );
      }
      if (filters.maxPrice < 1000000) {
        filteredProducts = filteredProducts.filter(product => 
          product.price <= filters.maxPrice
        );
      }

      // 검색 필터링
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
        );
      }

      // 정렬
      filteredProducts.sort((a, b) => {
        switch (filters.sortBy) {
          case 'name':
            return filters.sortOrder === 'asc' ? 
              a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
          case 'price':
            return filters.sortOrder === 'asc' ? 
              a.price - b.price : b.price - a.price;
          case 'createdAt':
          default:
            return filters.sortOrder === 'asc' ? 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() :
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });

      // 페이지네이션
      const limit = 12;
      const totalCount = filteredProducts.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const paginatedProducts = filteredProducts.slice(startIndex, startIndex + limit);

      setProducts(paginatedProducts);
      setPagination({
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      });

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