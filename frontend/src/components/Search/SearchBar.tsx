import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { searchService } from '../../services/searchService';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary.sage};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary.sage}20;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  background: transparent;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[500]};
  }
`;

const SearchIcon = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 20px;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  margin-left: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.sage};
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: 18px;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[1]};
  margin-right: ${({ theme }) => theme.spacing[2]};
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const SuggestionsDropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const SuggestionSection = styled.div`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[2]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};

  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const SuggestionItem = styled.button<{ active?: boolean }>`
  width: 100%;
  text-align: left;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border: none;
  background: ${({ active, theme }) => active ? theme.colors.gray[50] : 'transparent'};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const SuggestionIcon = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 16px;
`;

const SuggestionText = styled.span`
  flex: 1;
`;

const SuggestionType = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  background: ${({ theme }) => theme.colors.gray[100]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
`;

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  showSuggestions?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "제품을 검색해보세요...",
  value: controlledValue,
  onChange,
  onSearch,
  showSuggestions = true,
  className
}) => {
  const [value, setValue] = useState(controlledValue || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Load popular searches when component mounts
    loadPopularSearches();
  }, []);

  const loadPopularSearches = async () => {
    try {
      const result = await searchService.getPopularSearches(8);
      setPopularSearches(result.popularSearches);
    } catch (error) {
      console.error('Failed to load popular searches:', error);
    }
  };

  const loadSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchService.getAutocompleteSuggestions(query, 8);
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (showSuggestions) {
      timeoutRef.current = setTimeout(() => {
        loadSuggestions(newValue);
      }, 300);
    }

    setActiveSuggestionIndex(-1);
  };

  const handleInputFocus = () => {
    if (showSuggestions) {
      setShowDropdown(true);
      if (!value.trim()) {
        loadPopularSearches();
      } else {
        loadSuggestions(value);
      }
    }
  };

  const handleSearch = (query: string = value) => {
    if (!query.trim()) return;

    setShowDropdown(false);
    setActiveSuggestionIndex(-1);

    if (onSearch) {
      onSearch(query.trim());
    } else {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    handleSearch(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const allSuggestions = value.trim() && suggestions.length > 0 ? suggestions : popularSearches;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < allSuggestions.length) {
          handleSuggestionClick(allSuggestions[activeSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      
      case 'Escape':
        setShowDropdown(false);
        setActiveSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    setValue('');
    onChange?.('');
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  const allSuggestions = value.trim() && suggestions.length > 0 ? suggestions : popularSearches;
  const showPopular = !value.trim() && popularSearches.length > 0;
  const showAutocomplete = value.trim() && suggestions.length > 0;

  return (
    <SearchContainer ref={containerRef} className={className}>
      <SearchInputWrapper>
        <SearchInput
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        
        {value && (
          <ClearButton onClick={handleClear} type="button">
            ×
          </ClearButton>
        )}
        
        <SearchIcon onClick={() => handleSearch()} type="button">
          🔍
        </SearchIcon>
      </SearchInputWrapper>

      <AnimatePresence>
        {showDropdown && showSuggestions && allSuggestions.length > 0 && (
          <SuggestionsDropdown
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <SuggestionSection>
              <SectionTitle>
                {showPopular ? '인기 검색어' : '검색 제안'}
              </SectionTitle>
              
              {allSuggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={suggestion}
                  active={index === activeSuggestionIndex}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <SuggestionIcon>
                    {showPopular ? '🔥' : '🔍'}
                  </SuggestionIcon>
                  <SuggestionText>{suggestion}</SuggestionText>
                  {showPopular && (
                    <SuggestionType>인기</SuggestionType>
                  )}
                </SuggestionItem>
              ))}
            </SuggestionSection>
          </SuggestionsDropdown>
        )}
      </AnimatePresence>
    </SearchContainer>
  );
};