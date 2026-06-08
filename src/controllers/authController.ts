import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/config/database';
import { 
  AuthenticatedRequest, 
  ApiResponse, 
  RegisterData, 
  LoginCredentials,
  AuthenticationError,
  ConflictError,
} from '@/types';
import { jwtConfig, config } from '@/config';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, businessName, businessAddress, timezone } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          businessName,
          businessAddress,
          timezone: timezone || 'UTC',
        },
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

      // Generate JWT
      const token = jwt.sign({ userId: user.id, email: user.email }, jwtConfig.secret, {
        expiresIn: jwtConfig.refreshExpiresIn as any,
      });

      const response: ApiResponse = {
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: LoginCredentials = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id, email: user.email }, jwtConfig.secret, {
        expiresIn: jwtConfig.refreshExpiresIn as any,
      });

      // Remove passwordHash from response
      const { passwordHash, ...userProfile } = user;

      const response: ApiResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: userProfile,
          token,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const response: ApiResponse = {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: req.user,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PATCH /api/auth/me
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const { name, businessName, businessAddress, timezone } = req.body;
      let logoUrl = req.user.logoUrl;

      if (req.file) {
        // Store relative path to access statically
        logoUrl = `/uploads/${req.file.filename}`;
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: name ?? req.user.name,
          businessName: businessName !== undefined ? businessName : req.user.businessName,
          businessAddress: businessAddress !== undefined ? businessAddress : req.user.businessAddress,
          logoUrl,
          timezone: timezone !== undefined ? timezone : req.user.timezone,
        },
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

      const response: ApiResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   * POST /api/auth/change-password
   */
  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const { currentPassword, newPassword } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, config.bcryptSaltRounds);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}