import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  register, 
  login, 
  verifyEmail,
  refreshToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  logout
} from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per window for sensitive operations
  message: {
    error: 'Too many attempts, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/verify-email', verifyEmail);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', strictAuthLimiter, forgotPassword);
router.post('/reset-password', strictAuthLimiter, resetPassword);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);

export default router;