import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  getCategories,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from '../controllers/product';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Rate limiting for wishlist operations
const wishlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    error: 'Too many wishlist requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.get('/products', optionalAuth, getProducts);
router.get('/products/categories', getCategories);
router.get('/products/id/:id', optionalAuth, getProductById);
router.get('/products/:slug', optionalAuth, getProductBySlug);

// Protected routes - Wishlist
router.get('/wishlist', authenticateToken, getWishlist);
router.post('/wishlist', authenticateToken, wishlistLimiter, addToWishlist);
router.delete('/wishlist/:productId', authenticateToken, wishlistLimiter, removeFromWishlist);

export default router;