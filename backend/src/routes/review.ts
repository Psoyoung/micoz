import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import {
  createReview,
  updateReview,
  deleteReview,
  voteReviewHelpful,
  getReviewsByProduct,
  getMyReviews
} from '../controllers/review';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Rate limiting for review operations
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 reviews per window
  message: {
    error: 'Too many review requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const voteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 votes per minute
  message: {
    error: 'Too many vote requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Multer configuration for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
  }
});

// Public routes
router.get('/products/:productId/reviews', optionalAuth, getReviewsByProduct);

// Protected routes
router.get('/my-reviews', authenticateToken, getMyReviews);
router.post('/reviews', authenticateToken, reviewLimiter, upload.array('images', 5), createReview);
router.put('/reviews/:reviewId', authenticateToken, reviewLimiter, upload.array('images', 5), updateReview);
router.delete('/reviews/:reviewId', authenticateToken, deleteReview);
router.post('/reviews/:reviewId/vote', authenticateToken, voteLimiter, voteReviewHelpful);

export default router;