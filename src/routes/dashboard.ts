import { Router } from 'express';
import { DashboardController } from '@/controllers/dashboardController';
import { requireAuth } from '@/middleware/auth';

const router = Router();

// Protect all dashboard routes
router.use(requireAuth);

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get dashboard summary statistics
 * @access  Private
 */
router.get('/summary', DashboardController.getSummary);

export default router;
