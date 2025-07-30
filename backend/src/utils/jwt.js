"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailVerificationToken = exports.generateEmailVerificationToken = exports.verifyPasswordResetToken = exports.generatePasswordResetToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const generateTokens = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
    };
    const accessToken = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payload), { type: 'access' }), JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payload), { type: 'refresh' }), JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
    return {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN,
    };
};
exports.generateTokens = generateTokens;
const verifyAccessToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.type !== 'access') {
            throw new Error('Invalid token type');
        }
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid or expired access token');
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const generatePasswordResetToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        type: 'password_reset',
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};
exports.generatePasswordResetToken = generatePasswordResetToken;
const verifyPasswordResetToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.type !== 'password_reset') {
            throw new Error('Invalid token type');
        }
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid or expired password reset token');
    }
};
exports.verifyPasswordResetToken = verifyPasswordResetToken;
const generateEmailVerificationToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        type: 'email_verification',
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};
exports.generateEmailVerificationToken = generateEmailVerificationToken;
const verifyEmailVerificationToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.type !== 'email_verification') {
            throw new Error('Invalid token type');
        }
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid or expired email verification token');
    }
};
exports.verifyEmailVerificationToken = verifyEmailVerificationToken;
