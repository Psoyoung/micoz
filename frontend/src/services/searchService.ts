import { Product } from '../types';

export interface SearchFilters {
  category?: string;
  subCategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  skinType?: string;
  isBestseller?: boolean;
  isNew?: boolean;
  featured?: boolean;
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'bestseller';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: Product[];
  suggestions?: string[];
  filters: {
    categories: string[];
    brands: string[];
    priceRange: { min: number; max: number };
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  searchQuery?: string;
}

export interface AutocompleteResult {
  suggestions: string[];
}

export interface PopularSearchesResult {
  popularSearches: string[];
  title: string;
}

export interface SearchSuggestionsResult {
  suggestions: string[];
  type: 'popular' | 'autocomplete';
  query?: string;
}

export interface RecentSearchesResult {
  recentSearches: string[];
  title: string;
}

class SearchService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  async searchProducts(options: SearchOptions): Promise<SearchResult> {
    try {
      const params = new URLSearchParams();
      
      if (options.query) params.append('q', options.query);
      if (options.filters?.category) params.append('category', options.filters.category);
      if (options.filters?.subCategory) params.append('subCategory', options.filters.subCategory);
      if (options.filters?.brand) params.append('brand', options.filters.brand);
      if (options.filters?.minPrice) params.append('minPrice', options.filters.minPrice.toString());
      if (options.filters?.maxPrice) params.append('maxPrice', options.filters.maxPrice.toString());
      if (options.filters?.skinType) params.append('skinType', options.filters.skinType);
      if (options.filters?.isBestseller) params.append('isBestseller', 'true');
      if (options.filters?.isNew) params.append('isNew', 'true');
      if (options.filters?.featured) params.append('featured', 'true');
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search products error:', error);
      throw error;
    }
  }

  async getAutocompleteSuggestions(query: string, limit: number = 10): Promise<AutocompleteResult> {
    try {
      if (!query.trim() || query.length < 2) {
        return { suggestions: [] };
      }

      const params = new URLSearchParams({
        q: query,
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}/search/autocomplete?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Autocomplete failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Autocomplete error:', error);
      return { suggestions: [] };
    }
  }

  async getPopularSearches(limit: number = 10): Promise<PopularSearchesResult> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}/search/popular?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Popular searches failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Popular searches error:', error);
      return { popularSearches: [], title: '인기 검색어' };
    }
  }

  async getSearchSuggestions(query?: string): Promise<SearchSuggestionsResult> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);

      const response = await fetch(`${this.baseUrl}/search/suggestions?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Search suggestions failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search suggestions error:', error);
      return { suggestions: [], type: 'popular' };
    }
  }

  async getRecentSearches(limit: number = 10): Promise<RecentSearchesResult> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}/search/recent?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Recent searches failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Recent searches error:', error);
      return { recentSearches: [], title: '최근 검색어' };
    }
  }

  async getSearchFilters(): Promise<{ filters: SearchResult['filters'] }> {
    try {
      const response = await fetch(`${this.baseUrl}/search/filters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Search filters failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search filters error:', error);
      return {
        filters: {
          categories: [],
          brands: [],
          priceRange: { min: 0, max: 100000 }
        }
      };
    }
  }

  // Helper methods for query building
  buildSearchUrl(options: SearchOptions): string {
    const params = new URLSearchParams();
    
    if (options.query) params.append('q', options.query);
    if (options.filters?.category) params.append('category', options.filters.category);
    if (options.filters?.subCategory) params.append('subCategory', options.filters.subCategory);
    if (options.filters?.brand) params.append('brand', options.filters.brand);
    if (options.filters?.minPrice) params.append('minPrice', options.filters.minPrice.toString());
    if (options.filters?.maxPrice) params.append('maxPrice', options.filters.maxPrice.toString());
    if (options.filters?.skinType) params.append('skinType', options.filters.skinType);
    if (options.filters?.isBestseller) params.append('isBestseller', 'true');
    if (options.filters?.isNew) params.append('isNew', 'true');
    if (options.filters?.featured) params.append('featured', 'true');
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    return `/search?${params.toString()}`;
  }

  parseSearchUrl(searchParams: URLSearchParams): SearchOptions {
    return {
      query: searchParams.get('q') || '',
      filters: {
        category: searchParams.get('category') || undefined,
        subCategory: searchParams.get('subCategory') || undefined,
        brand: searchParams.get('brand') || undefined,
        minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
        maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
        skinType: searchParams.get('skinType') || undefined,
        isBestseller: searchParams.get('isBestseller') === 'true',
        isNew: searchParams.get('isNew') === 'true',
        featured: searchParams.get('featured') === 'true',
      },
      sortBy: (searchParams.get('sortBy') as any) || 'relevance',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };
  }
}

export const searchService = new SearchService();