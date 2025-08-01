import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getPersonalizedRecommendations,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getRecentlyViewed,
  getPopularProducts,
  trackBehavior,
  refreshRecommendations
} from '../controllers/recommendation';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Rate limiting for recommendation operations
const recommendationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    error: 'Too many recommendation requests, please try again later.',
    code: 'RECOMMENDATION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const behaviorLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 behavior tracking requests per minute
  message: {
    error: 'Too many behavior tracking requests, please try again later.',
    code: 'BEHAVIOR_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public recommendation routes
router.get('/recommendations/popular', recommendationLimiter, getPopularProducts);
router.get('/recommendations/similar/:productId', recommendationLimiter, getSimilarProducts);
router.get('/recommendations/frequently-bought/:productId', recommendationLimiter, getFrequentlyBoughtTogether);

// Protected recommendation routes
router.get('/recommendations/personalized', authenticateToken, recommendationLimiter, getPersonalizedRecommendations);
router.get('/recommendations/recently-viewed', authenticateToken, recommendationLimiter, getRecentlyViewed);
router.post('/recommendations/refresh', authenticateToken, refreshRecommendations);

// Behavior tracking
router.post('/behavior/track', authenticateToken, behaviorLimiter, trackBehavior);

export default router;