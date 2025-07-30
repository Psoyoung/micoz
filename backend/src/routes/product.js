"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const product_1 = require("../controllers/product");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Rate limiting for wishlist operations
const wishlistLimiter = (0, express_rate_limit_1.default)({
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
router.get('/products', auth_1.optionalAuth, product_1.getProducts);
router.get('/products/categories', product_1.getCategories);
router.get('/products/id/:id', auth_1.optionalAuth, product_1.getProductById);
router.get('/products/:slug', auth_1.optionalAuth, product_1.getProductBySlug);
// Protected routes - Wishlist
router.get('/wishlist', auth_1.authenticateToken, product_1.getWishlist);
router.post('/wishlist', auth_1.authenticateToken, wishlistLimiter, product_1.addToWishlist);
router.delete('/wishlist/:productId', auth_1.authenticateToken, wishlistLimiter, product_1.removeFromWishlist);
exports.default = router;
