import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { SearchBar, SearchFilters, SearchResults } from '../components/Search';
import { searchService, SearchFilters as ISearchFilters, SearchResult } from '../services/searchService';
import { Product } from '../types';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const SearchHeader = styled.div`
  background: white;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.spacing[6]} 0;
`;

const SearchHeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 240px 1fr;
    gap: ${({ theme }) => theme.spacing[6]};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
    gap: ${({ theme }) => theme.spacing[6]};
  }
`;

const FiltersColumn = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    order: 2;
  }
`;

const ResultsColumn = styled.div`
  min-width: 0; // Prevent grid overflow
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    order: 1;
  }
`;

const MobileFiltersToggle = styled.button`
  display: none;
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing[2]};
  }
`;

const MobileFiltersOverlay = styled.div<{ show: boolean }>`
  display: none;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: ${({ show }) => show ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    padding: ${({ theme }) => theme.spacing[4]};
    overflow-y: auto;
  }
`;

const MobileFiltersContent = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[6]};
  margin-top: ${({ theme }) => theme.spacing[16]};
  position: relative;
`;

const MobileFiltersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  padding-bottom: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const MobileFiltersTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin: 0;
`;

const MobileFiltersClose = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.gray[500]};
  padding: ${({ theme }) => theme.spacing[1]};
  
  &:hover {
    color: ${({ theme }) => theme.colors.gray[700]};
  }
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.red[50]};
  border: 1px solid ${({ theme }) => theme.colors.red[200]};
  color: ${({ theme }) => theme.colors.red[700]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [filters, setFilters] = useState<ISearchFilters>({});
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse URL parameters on mount and when they change
  useEffect(() => {
    const searchOptions = searchService.parseSearchUrl(searchParams);
    setFilters(searchOptions.filters || {});
    setSortBy(searchOptions.sortBy || 'relevance');
    setCurrentPage(searchOptions.page || 1);
    
    // Perform search
    performSearch(searchOptions);
  }, [searchParams]);

  const performSearch = async (options: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await searchService.searchProducts(options);
      setSearchResult(result);
    } catch (err) {
      console.error('Search failed:', err);
      setError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUrl = (newOptions: any) => {
    const url = searchService.buildSearchUrl(newOptions);
    navigate(url, { replace: true });
  };

  const handleSearch = (query: string) => {
    const newOptions = {
      query,
      filters,
      sortBy,
      page: 1, // Reset to first page on new search
      limit: 20
    };
    
    setCurrentPage(1);
    updateUrl(newOptions);
  };

  const handleFiltersChange = (newFilters: ISearchFilters) => {
    const newOptions = {
      query: searchParams.get('q') || '',
      filters: newFilters,
      sortBy,
      page: 1, // Reset to first page when filters change
      limit: 20
    };
    
    setCurrentPage(1);
    updateUrl(newOptions);
  };

  const handleSortChange = (newSortBy: string) => {
    const newOptions = {
      query: searchParams.get('q') || '',
      filters,
      sortBy: newSortBy,
      page: 1, // Reset to first page when sort changes
      limit: 20
    };
    
    setCurrentPage(1);
    setSortBy(newSortBy);
    updateUrl(newOptions);
  };

  const handlePageChange = (newPage: number) => {
    const newOptions = {
      query: searchParams.get('q') || '',
      filters,
      sortBy,
      page: newPage,
      limit: 20
    };
    
    setCurrentPage(newPage);
    updateUrl(newOptions);
    
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const currentQuery = searchParams.get('q') || '';

  return (
    <PageContainer>
      <SearchHeader>
        <SearchHeaderContent>
          <SearchBar
            value={currentQuery}
            onSearch={handleSearch}
            showSuggestions={true}
          />
        </SearchHeaderContent>
      </SearchHeader>

      <MainContent>
        <FiltersColumn>
          <SearchFilters
            filters={filters}
            onChange={handleFiltersChange}
            availableFilters={searchResult?.filters}
          />
        </FiltersColumn>

        <ResultsColumn>
          <MobileFiltersToggle onClick={() => setShowMobileFilters(true)}>
            🔧 필터 및 정렬
          </MobileFiltersToggle>

          {error && (
            <ErrorMessage>
              {error}
            </ErrorMessage>
          )}

          <SearchResults
            products={searchResult?.products || []}
            totalCount={searchResult?.pagination.totalCount || 0}
            currentPage={currentPage}
            totalPages={searchResult?.pagination.totalPages || 0}
            searchQuery={currentQuery}
            suggestions={searchResult?.suggestions}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            onPageChange={handlePageChange}
            onSuggestionClick={handleSuggestionClick}
            isLoading={isLoading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </ResultsColumn>
      </MainContent>

      {/* Mobile Filters Overlay */}
      <MobileFiltersOverlay show={showMobileFilters}>
        <MobileFiltersContent>
          <MobileFiltersHeader>
            <MobileFiltersTitle>필터 및 정렬</MobileFiltersTitle>
            <MobileFiltersClose onClick={() => setShowMobileFilters(false)}>
              ×
            </MobileFiltersClose>
          </MobileFiltersHeader>
          
          <SearchFilters
            filters={filters}
            onChange={(newFilters) => {
              handleFiltersChange(newFilters);
              setShowMobileFilters(false);
            }}
            availableFilters={searchResult?.filters}
          />
        </MobileFiltersContent>
      </MobileFiltersOverlay>
    </PageContainer>
  );
};