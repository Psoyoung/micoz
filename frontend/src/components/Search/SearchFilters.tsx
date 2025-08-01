import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchFilters as ISearchFilters, searchService } from '../../services/searchService';

const FiltersContainer = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.base};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[4]};
  }
`;

const FiltersHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  padding-bottom: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FiltersTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin: 0;
`;

const ClearFiltersButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.sage};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.sage}10;
    color: ${({ theme }) => theme.colors.primary.deepForest};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FilterSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  &:last-child {
    margin-bottom: 0;
  }
`;

const FilterLabel = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const FilterOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const FilterOption = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const FilterCheckbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: ${({ theme }) => theme.colors.primary.sage};
  cursor: pointer;
`;

const FilterOptionText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  flex: 1;
`;

const FilterOptionCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  background: ${({ theme }) => theme.colors.gray[100]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
`;

const PriceRangeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const PriceInputs = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const PriceInput = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[500]};
  }
`;

const PriceSeparator = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const PriceSlider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.gray[200]};
  outline: none;
  appearance: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary.sage};
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary.sage};
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const ActiveFiltersContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ActiveFiltersTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const ActiveFilterTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ActiveFilterTag = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.primary.sage}20;
  color: ${({ theme }) => theme.colors.primary.deepForest};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const RemoveFilterButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.deepForest};
  cursor: pointer;
  font-size: 14px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.deepForest}20;
  }
`;

interface SearchFiltersProps {
  filters: ISearchFilters;
  onChange: (filters: ISearchFilters) => void;
  availableFilters?: {
    categories: string[];
    brands: string[];
    priceRange: { min: number; max: number };
  };
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onChange,
  availableFilters,
  className
}) => {
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    brands: [] as string[],
    priceRange: { min: 0, max: 100000 }
  });

  useEffect(() => {
    if (availableFilters) {
      setFilterOptions(availableFilters);
    } else {
      loadFilterOptions();
    }
  }, [availableFilters]);

  const loadFilterOptions = async () => {
    try {
      const result = await searchService.getSearchFilters();
      setFilterOptions(result.filters);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const handleFilterChange = (key: keyof ISearchFilters, value: any) => {
    onChange({
      ...filters,
      [key]: value
    });
  };

  const handleClearFilters = () => {
    onChange({});
  };

  const removeFilter = (key: keyof ISearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onChange(newFilters);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const getActiveFilterTags = () => {
    const tags = [];

    if (filters.category) {
      tags.push({ key: 'category', label: `카테고리: ${filters.category}` });
    }
    if (filters.brand) {
      tags.push({ key: 'brand', label: `브랜드: ${filters.brand}` });
    }
    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice || filterOptions.priceRange.min;
      const max = filters.maxPrice || filterOptions.priceRange.max;
      tags.push({ 
        key: 'price', 
        label: `가격: ${formatPrice(min)}원 - ${formatPrice(max)}원` 
      });
    }
    if (filters.skinType) {
      tags.push({ key: 'skinType', label: `피부타입: ${filters.skinType}` });
    }
    if (filters.isBestseller) {
      tags.push({ key: 'isBestseller', label: '베스트셀러' });
    }
    if (filters.isNew) {
      tags.push({ key: 'isNew', label: '신상품' });
    }
    if (filters.featured) {
      tags.push({ key: 'featured', label: '추천상품' });
    }

    return tags;
  };

  const activeFilterTags = getActiveFilterTags();
  const hasActiveFilters = activeFilterTags.length > 0;

  return (
    <FiltersContainer className={className}>
      <FiltersHeader>
        <FiltersTitle>필터</FiltersTitle>
        <ClearFiltersButton 
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          전체 해제
        </ClearFiltersButton>
      </FiltersHeader>

      {/* Category Filter */}
      <FilterSection>
        <FilterLabel>카테고리</FilterLabel>
        <FilterOptions>
          {filterOptions.categories.map(category => (
            <FilterOption key={category}>
              <FilterCheckbox
                type="radio"
                name="category"
                checked={filters.category === category}
                onChange={() => 
                  handleFilterChange('category', 
                    filters.category === category ? undefined : category
                  )
                }
              />
              <FilterOptionText>{category}</FilterOptionText>
            </FilterOption>
          ))}
        </FilterOptions>
      </FilterSection>

      {/* Brand Filter */}
      <FilterSection>
        <FilterLabel>브랜드</FilterLabel>
        <FilterOptions>
          {filterOptions.brands.map(brand => (
            <FilterOption key={brand}>
              <FilterCheckbox
                type="radio"
                name="brand"
                checked={filters.brand === brand}
                onChange={() => 
                  handleFilterChange('brand', 
                    filters.brand === brand ? undefined : brand
                  )
                }
              />
              <FilterOptionText>{brand}</FilterOptionText>
            </FilterOption>
          ))}
        </FilterOptions>
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection>
        <FilterLabel>가격대</FilterLabel>
        <PriceRangeContainer>
          <PriceInputs>
            <PriceInput
              type="number"
              placeholder={formatPrice(filterOptions.priceRange.min)}
              value={filters.minPrice || ''}
              onChange={(e) => 
                handleFilterChange('minPrice', 
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
            />
            <PriceSeparator>~</PriceSeparator>
            <PriceInput
              type="number"
              placeholder={formatPrice(filterOptions.priceRange.max)}
              value={filters.maxPrice || ''}
              onChange={(e) => 
                handleFilterChange('maxPrice', 
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
            />
          </PriceInputs>
        </PriceRangeContainer>
      </FilterSection>

      {/* Product Type Filters */}
      <FilterSection>
        <FilterLabel>상품 유형</FilterLabel>
        <FilterOptions>
          <FilterOption>
            <FilterCheckbox
              type="checkbox"
              checked={filters.isBestseller || false}
              onChange={(e) => 
                handleFilterChange('isBestseller', e.target.checked || undefined)
              }
            />
            <FilterOptionText>베스트셀러</FilterOptionText>
          </FilterOption>
          
          <FilterOption>
            <FilterCheckbox
              type="checkbox"
              checked={filters.isNew || false}
              onChange={(e) => 
                handleFilterChange('isNew', e.target.checked || undefined)
              }
            />
            <FilterOptionText>신상품</FilterOptionText>
          </FilterOption>
          
          <FilterOption>
            <FilterCheckbox
              type="checkbox"
              checked={filters.featured || false}
              onChange={(e) => 
                handleFilterChange('featured', e.target.checked || undefined)
              }
            />
            <FilterOptionText>추천상품</FilterOptionText>
          </FilterOption>
        </FilterOptions>
      </FilterSection>

      {/* Active Filters */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ActiveFiltersContainer>
              <ActiveFiltersTitle>적용된 필터</ActiveFiltersTitle>
              <ActiveFilterTags>
                {activeFilterTags.map(tag => (
                  <ActiveFilterTag key={tag.key}>
                    {tag.label}
                    <RemoveFilterButton
                      onClick={() => {
                        if (tag.key === 'price') {
                          const newFilters = { ...filters };
                          delete newFilters.minPrice;
                          delete newFilters.maxPrice;
                          onChange(newFilters);
                        } else {
                          removeFilter(tag.key as keyof ISearchFilters);
                        }
                      }}
                    >
                      ×
                    </RemoveFilterButton>
                  </ActiveFilterTag>
                ))}
              </ActiveFilterTags>
            </ActiveFiltersContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </FiltersContainer>
  );
};