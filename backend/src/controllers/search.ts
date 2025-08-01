import { Request, Response } from 'express';
import { searchService, SearchFilters } from '../services/searchService';
import { AuthenticatedRequest } from '../middleware/auth';

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const {
      q: query = '',
      category,
      subCategory,
      brand,
      minPrice,
      maxPrice,
      skinType,
      isBestseller,
      isNew,
      featured,
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = req.query;

    // Parse and validate parameters
    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));

    const filters: SearchFilters = {
      ...(category && { category: category as string }),
      ...(subCategory && { subCategory: subCategory as string }),
      ...(brand && { brand: brand as string }),
      ...(minPrice && { minPrice: parseInt(minPrice as string) }),
      ...(maxPrice && { maxPrice: parseInt(maxPrice as string) }),
      ...(skinType && { skinType: skinType as string }),
      ...(isBestseller === 'true' && { isBestseller: true }),
      ...(isNew === 'true' && { isNew: true }),
      ...(featured === 'true' && { featured: true })
    };

    const searchOptions = {
      query: query as string,
      filters,
      sortBy: sortBy as any,
      page: pageNumber,
      limit: limitNumber
    };

    const result = await searchService.searchProducts(searchOptions);

    // Track search analytics
    const userId = (req as AuthenticatedRequest).user?.userId;
    await searchService.trackSearch(query as string, userId, result.totalCount);

    const totalPages = Math.ceil(result.totalCount / limitNumber);

    res.json({
      products: result.products,
      suggestions: result.suggestions,
      filters: result.filters,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount: result.totalCount,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      },
      searchQuery: query
    });

  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      error: 'Failed to search products',
      code: 'SEARCH_ERROR'
    });
  }
};

export const getAutocompleteSuggestions = async (req: Request, res: Response) => {
  try {
    const { q: query = '', limit = 10 } = req.query;

    if (!query || (query as string).trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const limitNumber = Math.min(20, Math.max(1, parseInt(limit as string)));
    const suggestions = await searchService.getAutocompleteSuggestions(
      query as string, 
      limitNumber
    );

    res.json({ suggestions });

  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      code: 'AUTOCOMPLETE_ERROR'
    });
  }
};

export const getPopularSearches = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const limitNumber = Math.min(20, Math.max(1, parseInt(limit as string)));
    
    const popularSearches = await searchService.getPopularSearches(limitNumber);

    res.json({ 
      popularSearches,
      title: '인기 검색어'
    });

  } catch (error) {
    console.error('Popular searches error:', error);
    res.status(500).json({
      error: 'Failed to get popular searches',
      code: 'POPULAR_SEARCHES_ERROR'
    });
  }
};

export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const { q: query = '' } = req.query;

    if (!query || (query as string).trim().length < 2) {
      // Return popular searches if no query
      const popularSearches = await searchService.getPopularSearches(5);
      return res.json({
        suggestions: popularSearches,
        type: 'popular'
      });
    }

    const suggestions = await searchService.getAutocompleteSuggestions(query as string, 8);

    res.json({
      suggestions,
      type: 'autocomplete',
      query
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      error: 'Failed to get search suggestions',
      code: 'SUGGESTIONS_ERROR'
    });
  }
};

export const getRecentSearches = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { limit = 10 } = req.query;
    const limitNumber = Math.min(20, Math.max(1, parseInt(limit as string)));
    
    const userId = req.user.userId;
    const recentSearches = await searchService.getRecentSearches(userId, limitNumber);

    res.json({
      recentSearches,
      title: '최근 검색어'
    });

  } catch (error) {
    console.error('Recent searches error:', error);
    res.status(500).json({
      error: 'Failed to get recent searches',
      code: 'RECENT_SEARCHES_ERROR'
    });
  }
};

export const getSearchFilters = async (req: Request, res: Response) => {
  try {
    // This returns available filter options
    const result = await searchService.searchProducts({ 
      query: '', 
      page: 1, 
      limit: 1 
    });

    res.json({
      filters: result.filters,
      message: 'Available search filters'
    });

  } catch (error) {
    console.error('Search filters error:', error);
    res.status(500).json({
      error: 'Failed to get search filters',
      code: 'FILTERS_ERROR'
    });
  }
};