import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createBeautyTip,
  updateBeautyTip,
  deleteBeautyTip,
  getBeautyTips,
  getBeautyTip,
  voteBeautyTip,
  followBeautyTip,
  addComment,
  getMyBeautyTips
} from '../controllers/beautyTips';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Rate limiting for beauty tip operations
const beautyTipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tips per window
  message: {
    error: 'Too many beauty tip requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const voteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 votes per minute
  message: {
    error: 'Too many vote requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const commentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 comments per window
  message: {
    error: 'Too many comment requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.get('/beauty-tips', optionalAuth, getBeautyTips);
router.get('/beauty-tips/:tipId', optionalAuth, getBeautyTip);

// Protected routes - Beauty Tips
router.get('/my-beauty-tips', authenticateToken, getMyBeautyTips);
router.post('/beauty-tips', authenticateToken, beautyTipLimiter, createBeautyTip);
router.put('/beauty-tips/:tipId', authenticateToken, beautyTipLimiter, updateBeautyTip);
router.delete('/beauty-tips/:tipId', authenticateToken, deleteBeautyTip);

// Protected routes - Interactions
router.post('/beauty-tips/:tipId/vote', authenticateToken, voteLimiter, voteBeautyTip);
router.post('/beauty-tips/:tipId/follow', authenticateToken, followBeautyTip);
router.post('/beauty-tips/:tipId/comments', authenticateToken, commentLimiter, addComment);

export default router;