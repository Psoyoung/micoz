import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard/ProductCard';

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing[3]};
  }
`;

const ResultsInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const SearchQuery = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin: 0;
`;

const ResultsCount = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
`;

const SortControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100%;
    justify-content: space-between;
  }
`;

const SortLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const SortSelect = styled.select`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: white;
  cursor: pointer;
  min-width: 120px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const ViewToggle = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  overflow: hidden;
`;

const ViewButton = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: none;
  background: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : 'white'
  };
  color: ${({ active, theme }) => 
    active ? 'white' : theme.colors.gray[600]
  };
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ active, theme }) => 
      active ? theme.colors.primary.deepForest : theme.colors.gray[50]
    };
  }
`;

const ResultsGrid = styled.div<{ viewMode: 'grid' | 'list' }>`
  display: grid;
  gap: ${({ theme }) => theme.spacing[6]};
  
  ${({ viewMode, theme }) => viewMode === 'grid' ? `
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    
    @media (max-width: ${theme.breakpoints.sm}) {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
  ` : `
    grid-template-columns: 1fr;
  `}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[6]};
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const EmptyStateTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const EmptyStateText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

const SuggestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[6]};
`;

const SuggestionsTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin: 0;
`;

const SuggestionsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const SuggestionItem = styled.button`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.sage}20;
    border-color: ${({ theme }) => theme.colors.primary.sage};
    color: ${({ theme }) => theme.colors.primary.deepForest};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[12]};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${({ theme }) => theme.colors.gray[200]};
  border-top: 4px solid ${({ theme }) => theme.colors.primary.sage};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[8]};
`;

const PaginationButton = styled.button<{ active?: boolean; disabled?: boolean }>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : 'white'
  };
  color: ${({ active, theme }) => 
    active ? 'white' : theme.colors.secondary.charcoal
  };
  border-radius: ${({ theme }) => theme.borderRadius.base};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: all ${({ theme }) => theme.transitions.fast};
  min-width: 40px;

  &:hover:not(:disabled) {
    background: ${({ active, theme }) => 
      active ? theme.colors.primary.deepForest : theme.colors.gray[50]
    };
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface SearchResultsProps {
  products: Product[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  searchQuery?: string;
  suggestions?: string[];
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onPageChange: (page: number) => void;
  onSuggestionClick: (suggestion: string) => void;
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  products,
  totalCount,
  currentPage,
  totalPages,
  searchQuery,
  suggestions = [],
  sortBy,
  onSortChange,
  onPageChange,
  onSuggestionClick,
  isLoading = false,
  viewMode = 'grid',
  onViewModeChange,
  className
}) => {
  const formatCount = (count: number): string => {
    return new Intl.NumberFormat('ko-KR').format(count);
  };

  const generatePageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (isLoading) {
    return (
      <ResultsContainer className={className}>
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      </ResultsContainer>
    );
  }

  if (products.length === 0) {
    return (
      <ResultsContainer className={className}>
        <EmptyState>
          <EmptyStateIcon>🔍</EmptyStateIcon>
          <EmptyStateTitle>
            {searchQuery ? `"${searchQuery}"에 대한 검색 결과가 없습니다` : '검색 결과가 없습니다'}
          </EmptyStateTitle>
          <EmptyStateText>
            다른 검색어를 시도해보거나 필터를 조정해보세요.
          </EmptyStateText>
          
          {suggestions.length > 0 && (
            <SuggestionsContainer>
              <SuggestionsTitle>이런 검색어는 어떠세요?</SuggestionsTitle>
              <SuggestionsList>
                {suggestions.map((suggestion, index) => (
                  <SuggestionItem
                    key={index}
                    onClick={() => onSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </SuggestionItem>
                ))}
              </SuggestionsList>
            </SuggestionsContainer>
          )}
        </EmptyState>
      </ResultsContainer>
    );
  }

  return (
    <ResultsContainer className={className}>
      <ResultsHeader>
        <ResultsInfo>
          {searchQuery && (
            <SearchQuery>"{searchQuery}"</SearchQuery>
          )}
          <ResultsCount>
            총 {formatCount(totalCount)}개의 상품
          </ResultsCount>
        </ResultsInfo>
        
        <SortControls>
          <SortLabel>정렬:</SortLabel>
          <SortSelect
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="relevance">관련도순</option>
            <option value="newest">최신순</option>
            <option value="price_asc">가격 낮은순</option>
            <option value="price_desc">가격 높은순</option>
            <option value="rating">평점순</option>
            <option value="bestseller">베스트셀러순</option>
          </SortSelect>
          
          {onViewModeChange && (
            <ViewToggle>
              <ViewButton
                active={viewMode === 'grid'}
                onClick={() => onViewModeChange('grid')}
              >
                ⊞ 격자
              </ViewButton>
              <ViewButton
                active={viewMode === 'list'}
                onClick={() => onViewModeChange('list')}
              >
                ☰ 목록
              </ViewButton>
            </ViewToggle>
          )}
        </SortControls>
      </ResultsHeader>

      <ResultsGrid viewMode={viewMode}>
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <ProductCard
              product={product}
              layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
            />
          </motion.div>
        ))}
      </ResultsGrid>

      {totalPages > 1 && (
        <Pagination>
          <PaginationButton
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            ‹
          </PaginationButton>
          
          {generatePageNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <PaginationButton
                key={page}
                active={page === currentPage}
                onClick={() => onPageChange(page)}
              >
                {page}
              </PaginationButton>
            ) : (
              <span key={index} style={{ padding: '8px' }}>
                {page}
              </span>
            )
          ))}
          
          <PaginationButton
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            ›
          </PaginationButton>
        </Pagination>
      )}
    </ResultsContainer>
  );
};