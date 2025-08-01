import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  searchProducts,
  getAutocompleteSuggestions,
  getPopularSearches,
  getSearchSuggestions,
  getRecentSearches,
  getSearchFilters
} from '../controllers/search';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Rate limiting for search operations
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 searches per minute
  message: {
    error: 'Too many search requests, please try again later.',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const autocompleteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 autocomplete requests per minute
  message: {
    error: 'Too many autocomplete requests, please try again later.',
    code: 'AUTOCOMPLETE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public search routes
router.get('/search', optionalAuth, searchLimiter, searchProducts);
router.get('/search/autocomplete', autocompleteLimiter, getAutocompleteSuggestions);
router.get('/search/suggestions', autocompleteLimiter, getSearchSuggestions);
router.get('/search/popular', getPopularSearches);
router.get('/search/filters', getSearchFilters);

// Protected search routes
router.get('/search/recent', authenticateToken, getRecentSearches);

export default router;