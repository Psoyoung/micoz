"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.optionalAuth = exports.authenticateToken = void 0;
const jwt_1 = require("../utils/jwt");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            error: 'Access token required',
            code: 'UNAUTHORIZED'
        });
    }
    try {
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        // 사용자 정보 확인
        const user = yield prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                verified: true,
                avatar: true,
                lastLoginAt: true,
            }
        });
        if (!user) {
            return res.status(403).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        if (!user.verified) {
            return res.status(403).json({
                error: 'Email not verified',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }
        req.user = Object.assign(Object.assign({}, decoded), { userData: user });
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
        });
    }
});
exports.authenticateToken = authenticateToken;
const optionalAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return next();
    }
    try {
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        const user = yield prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                verified: true,
                avatar: true,
            }
        });
        if (user && user.verified) {
            req.user = Object.assign(Object.assign({}, decoded), { userData: user });
        }
    }
    catch (error) {
        // 토큰이 잘못되어도 계속 진행
        console.log('Optional auth failed:', error.message);
    }
    next();
});
exports.optionalAuth = optionalAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        // 실제 구현에서는 사용자의 역할을 확인
        // 현재는 모든 인증된 사용자를 허용
        next();
    };
};
exports.requireRole = requireRole;
