"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Rate limiting for auth endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: 'Too many authentication attempts, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const strictAuthLimiter = (0, express_rate_limit_1.default)({
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
router.post('/register', authLimiter, auth_1.register);
router.post('/login', authLimiter, auth_1.login);
router.get('/verify-email', auth_1.verifyEmail);
router.post('/refresh-token', auth_1.refreshToken);
router.post('/forgot-password', strictAuthLimiter, auth_1.forgotPassword);
router.post('/reset-password', strictAuthLimiter, auth_1.resetPassword);
// Protected routes
router.get('/me', auth_2.authenticateToken, auth_1.getCurrentUser);
router.post('/logout', auth_2.authenticateToken, auth_1.logout);
exports.default = router;
