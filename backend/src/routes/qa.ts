import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  voteQuestion,
  voteAnswer,
  getQuestionsByProduct,
  getMyQuestions
} from '../controllers/qa';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Rate limiting for Q&A operations
const qaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 questions/answers per window
  message: {
    error: 'Too many Q&A requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const voteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 votes per minute
  message: {
    error: 'Too many vote requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.get('/products/:productId/questions', optionalAuth, getQuestionsByProduct);

// Protected routes - Questions
router.get('/my-questions', authenticateToken, getMyQuestions);
router.post('/questions', authenticateToken, qaLimiter, createQuestion);
router.put('/questions/:questionId', authenticateToken, qaLimiter, updateQuestion);
router.delete('/questions/:questionId', authenticateToken, deleteQuestion);
router.post('/questions/:questionId/vote', authenticateToken, voteLimiter, voteQuestion);

// Protected routes - Answers
router.post('/questions/:questionId/answers', authenticateToken, qaLimiter, createAnswer);
router.put('/answers/:answerId', authenticateToken, qaLimiter, updateAnswer);
router.delete('/answers/:answerId', authenticateToken, deleteAnswer);
router.post('/answers/:answerId/vote', authenticateToken, voteLimiter, voteAnswer);

export default router;