import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  addReviewComment,
  updateReviewComment,
  deleteReviewComment,
  getReviewComments,
  getPopularDiscussions,
  getDiscussionStats
} from '../controllers/comments';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Rate limiting for comment operations
const commentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 15 comments per window
  message: {
    error: 'Too many comment requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.get('/reviews/:reviewId/comments', optionalAuth, getReviewComments);
router.get('/discussions/popular', optionalAuth, getPopularDiscussions);
router.get('/discussions/stats', optionalAuth, getDiscussionStats);

// Protected routes - Review Comments
router.post('/reviews/:reviewId/comments', authenticateToken, commentLimiter, addReviewComment);
router.put('/review-comments/:commentId', authenticateToken, commentLimiter, updateReviewComment);
router.delete('/review-comments/:commentId', authenticateToken, deleteReviewComment);

export default router;