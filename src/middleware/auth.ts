import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload, AuthenticationError } from '@/types';
import { jwtConfig } from '@/config';
import prisma from '@/config/database';

// Middleware to authenticate JWT tokens
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Verify the token
    const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        businessAddress: true,
        logoUrl: true,
        timezone: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

// Middleware to require authentication (alias for authenticateToken)
export const requireAuth = authenticateToken;