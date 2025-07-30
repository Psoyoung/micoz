import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { userData?: any };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'UNAUTHORIZED' 
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    
    // 사용자 정보 확인
    const user = await prisma.user.findUnique({
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

    req.user = { ...decoded, userData: user };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN' 
    });
  }
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
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
      req.user = { ...decoded, userData: user };
    }
  } catch (error) {
    // 토큰이 잘못되어도 계속 진행
    console.log('Optional auth failed:', (error as Error).message);
  }

  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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