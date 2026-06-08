import { Response, NextFunction } from 'express';
import prisma from '@/config/database';
import { AuthenticatedRequest, ApiResponse, AuthorizationError } from '@/types';

export class DashboardController {
  /**
   * Get dashboard summary
   * GET /api/dashboard/summary
   */
  static async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const now = new Date();

      // Run database queries in parallel for efficiency
      const [
        totalInvoices,
        paidSumResult,
        outstandingSumResult,
        overdueCount
      ] = await Promise.all([
        // 1. Total invoices count
        prisma.invoice.count({
          where: { userId },
        }),

        // 2. Total paid amount
        prisma.invoice.aggregate({
          where: {
            userId,
            status: 'PAID',
          },
          _sum: {
            total: true,
          },
        }),

        // 3. Total outstanding amount (DRAFT, SENT, OVERDUE)
        prisma.invoice.aggregate({
          where: {
            userId,
            status: {
              in: ['DRAFT', 'SENT', 'OVERDUE'],
            },
          },
          _sum: {
            total: true,
          },
        }),

        // 4. Overdue count (status is not PAID and dueDate < now)
        prisma.invoice.count({
          where: {
            userId,
            status: {
              not: 'PAID',
            },
            dueDate: {
              lt: now,
            },
          },
        }),
      ]);

      const totalPaid = paidSumResult._sum.total ? paidSumResult._sum.total.toNumber() : 0;
      const totalOutstanding = outstandingSumResult._sum.total ? outstandingSumResult._sum.total.toNumber() : 0;

      const response: ApiResponse = {
        success: true,
        message: 'Dashboard summary retrieved successfully',
        data: {
          totalInvoices,
          totalPaid,
          totalOutstanding,
          overdueCount,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
