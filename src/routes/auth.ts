import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { requireAuth } from '@/middleware/auth';
import { 
  validateRequest, 
  registerSchema, 
  loginSchema, 
  updateProfileSchema,
  changePasswordSchema
} from '@/middleware/validation';
import { uploadLogo } from '@/middleware/upload';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  AuthController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  requireAuth,
  AuthController.getProfile
);

/**
 * @route   PATCH /api/auth/me
 * @desc    Update user profile (business name, address, logo)
 * @access  Private
 */
router.patch(
  '/me',
  requireAuth,
  uploadLogo.single('logo'),
  validateRequest({ body: updateProfileSchema }),
  AuthController.updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  requireAuth,
  validateRequest({ body: changePasswordSchema }),
  AuthController.changePassword
);

export default router;