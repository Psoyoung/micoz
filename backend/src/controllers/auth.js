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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getCurrentUser = exports.resetPassword = exports.forgotPassword = exports.refreshToken = exports.login = exports.verifyEmail = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../utils/jwt");
const email_1 = require("../utils/email");
const prisma = new client_1.PrismaClient();
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, firstName, lastName, password, phone, birthDate, gender, skinType, skinConcerns, newsletterSubscribed = false, marketingConsent = false } = req.body;
        // 필수 필드 검증
        if (!email || !firstName || !lastName || !password) {
            return res.status(400).json({
                error: 'Email, firstName, lastName, and password are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
                code: 'INVALID_EMAIL_FORMAT'
            });
        }
        // 비밀번호 강도 검증
        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long',
                code: 'WEAK_PASSWORD'
            });
        }
        // 이미 존재하는 사용자 확인
        const existingUser = yield prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (existingUser) {
            return res.status(409).json({
                error: 'User with this email already exists',
                code: 'EMAIL_ALREADY_EXISTS'
            });
        }
        // 비밀번호 해시화
        const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
        // 이메일 인증 토큰 생성
        const emailVerificationToken = (0, jwt_1.generateEmailVerificationToken)({
            id: 'temp',
            email: email.toLowerCase()
        });
        // 사용자 생성
        const user = yield prisma.user.create({
            data: {
                email: email.toLowerCase(),
                firstName,
                lastName,
                password: hashedPassword,
                phone,
                birthDate: birthDate ? new Date(birthDate) : null,
                gender,
                skinType,
                skinConcerns: skinConcerns || [],
                newsletterSubscribed,
                marketingConsent,
                emailVerificationToken,
                emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                verified: true,
                avatar: true,
                createdAt: true,
            },
        });
        // 인증 이메일 발송
        try {
            yield (0, email_1.sendVerificationEmail)(user.email, emailVerificationToken, user.firstName);
        }
        catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // 이메일 발송 실패해도 회원가입은 진행
        }
        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                verified: user.verified,
            },
            code: 'REGISTRATION_SUCCESS'
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.register = register;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                error: 'Verification token is required',
                code: 'MISSING_TOKEN'
            });
        }
        const decoded = (0, jwt_1.verifyEmailVerificationToken)(token);
        const user = yield prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            return res.status(400).json({
                error: 'Invalid or expired verification token',
                code: 'INVALID_TOKEN'
            });
        }
        // 사용자 인증 완료 처리
        yield prisma.user.update({
            where: { id: user.id },
            data: {
                verified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null,
            },
        });
        // 환영 이메일 발송
        try {
            yield (0, email_1.sendWelcomeEmail)(user.email, user.firstName);
        }
        catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }
        res.json({
            message: 'Email verification successful',
            code: 'EMAIL_VERIFIED'
        });
    }
    catch (error) {
        console.error('Email verification error:', error);
        res.status(400).json({
            error: 'Invalid verification token',
            code: 'INVALID_TOKEN'
        });
    }
});
exports.verifyEmail = verifyEmail;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }
        const user = yield prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user || !(yield bcryptjs_1.default.compare(password, user.password))) {
            return res.status(401).json({
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }
        if (!user.verified) {
            return res.status(403).json({
                error: 'Please verify your email before logging in',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }
        // 마지막 로그인 시간 업데이트
        yield prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const tokens = (0, jwt_1.generateTokens)({ id: user.id, email: user.email });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json(Object.assign(Object.assign({ message: 'Login successful', user: userWithoutPassword }, tokens), { code: 'LOGIN_SUCCESS' }));
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.login = login;
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                error: 'Refresh token is required',
                code: 'MISSING_REFRESH_TOKEN'
            });
        }
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const user = yield prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                verified: true,
            }
        });
        if (!user || !user.verified) {
            return res.status(403).json({
                error: 'User not found or not verified',
                code: 'USER_NOT_FOUND'
            });
        }
        const tokens = (0, jwt_1.generateTokens)({ id: user.id, email: user.email });
        res.json(Object.assign(Object.assign({ message: 'Token refreshed successfully' }, tokens), { code: 'TOKEN_REFRESHED' }));
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(403).json({
            error: 'Invalid refresh token',
            code: 'INVALID_REFRESH_TOKEN'
        });
    }
});
exports.refreshToken = refreshToken;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                error: 'Email is required',
                code: 'MISSING_EMAIL'
            });
        }
        const user = yield prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            // 보안상 사용자가 존재하지 않아도 성공 메시지 반환
            return res.json({
                message: 'If an account with this email exists, a password reset link has been sent.',
                code: 'RESET_EMAIL_SENT'
            });
        }
        const resetToken = (0, jwt_1.generatePasswordResetToken)({ id: user.id, email: user.email });
        yield prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1시간
            },
        });
        try {
            yield (0, email_1.sendPasswordResetEmail)(user.email, resetToken, user.firstName);
        }
        catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            return res.status(500).json({
                error: 'Failed to send password reset email',
                code: 'EMAIL_SEND_FAILED'
            });
        }
        res.json({
            message: 'Password reset link has been sent to your email.',
            code: 'RESET_EMAIL_SENT'
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({
                error: 'Token and new password are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long',
                code: 'WEAK_PASSWORD'
            });
        }
        const decoded = (0, jwt_1.verifyPasswordResetToken)(token);
        const user = yield prisma.user.findFirst({
            where: {
                id: decoded.userId,
                passwordResetToken: token,
                passwordResetExpires: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            return res.status(400).json({
                error: 'Invalid or expired password reset token',
                code: 'INVALID_TOKEN'
            });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 12);
        yield prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });
        res.json({
            message: 'Password has been reset successfully',
            code: 'PASSWORD_RESET_SUCCESS'
        });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(400).json({
            error: 'Invalid or expired password reset token',
            code: 'INVALID_TOKEN'
        });
    }
});
exports.resetPassword = resetPassword;
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'User not authenticated',
                code: 'UNAUTHORIZED'
            });
        }
        const user = yield prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                verified: true,
                avatar: true,
                birthDate: true,
                gender: true,
                skinType: true,
                skinConcerns: true,
                newsletterSubscribed: true,
                marketingConsent: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        res.json({
            user,
            code: 'USER_FETCHED'
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.getCurrentUser = getCurrentUser;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 실제 구현에서는 리프레시 토큰을 블랙리스트에 추가하거나 
        // 데이터베이스에서 삭제할 수 있습니다.
        // 현재는 클라이언트 측에서 토큰을 삭제하도록 안내합니다.
        res.json({
            message: 'Logged out successfully',
            code: 'LOGOUT_SUCCESS'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.logout = logout;
