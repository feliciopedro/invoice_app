import { Response, NextFunction } from 'express';
import prisma from '@/config/database';
import { 
  AuthenticatedRequest, 
  ApiResponse, 
  CreateInvoiceData,
  UpdateInvoiceData,
  NotFoundError,
  AuthorizationError,
} from '@/types';
import { PdfService } from '@/services/pdfService';
import { Decimal } from '@prisma/client/runtime/library';

export class InvoiceController {
  /**
   * List all invoices for the logged-in user
   * GET /api/invoices
   */
  static async getInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const { status, clientId, dateFrom, dateTo } = req.query;

      const where: any = {
        userId,
      };

      if (status) {
        where.status = status;
      }

      if (clientId) {
        where.clientId = clientId;
      }

      if (dateFrom || dateTo) {
        where.issueDate = {};
        if (dateFrom) {
          where.issueDate.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.issueDate.lte = new Date(dateTo as string);
        }
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          client: true,
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Invoices retrieved successfully',
        data: invoices,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single invoice with items and client
   * GET /api/invoices/:id
   */
  static async getInvoiceById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const invoice = await prisma.invoice.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          client: true,
          items: true,
        },
      });

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      const response: ApiResponse = {
        success: true,
        message: 'Invoice retrieved successfully',
        data: invoice,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new invoice
   * POST /api/invoices
   */
  static async createInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const invoiceData: CreateInvoiceData = req.body;

      // Verify client exists and belongs to the user
      const client = await prisma.client.findFirst({
        where: { id: invoiceData.clientId, userId },
      });

      if (!client) {
        throw new NotFoundError('Client not found');
      }

      // Calculate totals
      let subtotal = 0;
      const itemsToCreate = invoiceData.items.map((item) => {
        const total = item.quantity * item.unitPrice;
        subtotal += total;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: new Decimal(item.unitPrice),
          total: new Decimal(total),
        };
      });

      const taxRate = invoiceData.taxRate ?? 0;
      const taxAmount = subtotal * taxRate;
      const discount = invoiceData.discount ?? 0;
      const total = subtotal + taxAmount - discount;

      // Auto-generate invoice number (sequential per user, e.g. INV-2026-001)
      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;
      
      const lastInvoice = await prisma.invoice.findFirst({
        where: {
          userId,
          invoiceNumber: {
            startsWith: prefix,
          },
        },
        orderBy: {
          invoiceNumber: 'desc',
        },
      });

      let nextSeq = 1;
      if (lastInvoice) {
        const parts = lastInvoice.invoiceNumber.split('-');
        const lastPart = parts[parts.length - 1];
        const lastSeq = lastPart ? parseInt(lastPart, 10) : NaN;
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }

      const invoiceNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;

      // Create invoice and items in a transaction
      const invoice = await prisma.invoice.create({
        data: {
          userId,
          clientId: invoiceData.clientId,
          invoiceNumber,
          dueDate: new Date(invoiceData.dueDate),
          status: invoiceData.status ?? 'DRAFT',
          subtotal: new Decimal(subtotal),
          taxRate: new Decimal(taxRate),
          taxAmount: new Decimal(taxAmount),
          discount: new Decimal(discount),
          total: new Decimal(total),
          currency: invoiceData.currency ?? 'USD',
          notes: invoiceData.notes,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: true,
          client: true,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update invoice (including items)
   * PATCH /api/invoices/:id
   */
  static async updateInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      // Check if invoice exists
      const existingInvoice = await prisma.invoice.findFirst({
        where: { id, userId },
        include: { items: true },
      });

      if (!existingInvoice) {
        throw new NotFoundError('Invoice not found');
      }

      const updateData: UpdateInvoiceData = req.body;

      if (updateData.clientId) {
        // Verify client exists and belongs to the user
        const client = await prisma.client.findFirst({
          where: { id: updateData.clientId, userId },
        });
        if (!client) {
          throw new NotFoundError('Client not found');
        }
      }

      let subtotal = 0;
      let hasItemsUpdate = false;
      let itemsToCreate: any[] = [];

      if (updateData.items) {
        hasItemsUpdate = true;
        itemsToCreate = updateData.items.map((item) => {
          const total = item.quantity * item.unitPrice;
          subtotal += total;
          return {
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            total: new Decimal(total),
          };
        });
      } else {
        // Use existing items subtotal
        subtotal = existingInvoice.items.reduce((sum, item) => sum + item.total.toNumber(), 0);
      }

      const taxRate = updateData.taxRate !== undefined ? updateData.taxRate : existingInvoice.taxRate.toNumber();
      const taxAmount = subtotal * taxRate;
      const discount = updateData.discount !== undefined ? updateData.discount : existingInvoice.discount.toNumber();
      const total = subtotal + taxAmount - discount;

      const invoice = await prisma.$transaction(async (tx) => {
        if (hasItemsUpdate) {
          // Delete old items
          await tx.invoiceItem.deleteMany({
            where: { invoiceId: id },
          });
        }

        return await tx.invoice.update({
          where: { id },
          data: {
            clientId: updateData.clientId ?? existingInvoice.clientId,
            dueDate: updateData.dueDate ? new Date(updateData.dueDate) : existingInvoice.dueDate,
            status: updateData.status ?? existingInvoice.status,
            subtotal: new Decimal(subtotal),
            taxRate: new Decimal(taxRate),
            taxAmount: new Decimal(taxAmount),
            discount: new Decimal(discount),
            total: new Decimal(total),
            currency: updateData.currency ?? existingInvoice.currency,
            notes: updateData.notes !== undefined ? updateData.notes : existingInvoice.notes,
            ...(hasItemsUpdate && {
              items: {
                create: itemsToCreate,
              },
            }),
          },
          include: {
            items: true,
            client: true,
          },
        });
      });

      const response: ApiResponse = {
        success: true,
        message: 'Invoice updated successfully',
        data: invoice,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete invoice
   * DELETE /api/invoices/:id
   */
  static async deleteInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const existingInvoice = await prisma.invoice.findFirst({
        where: { id, userId },
      });

      if (!existingInvoice) {
        throw new NotFoundError('Invoice not found');
      }

      // Cascade deletion is handled by Prisma onDelete: Cascade
      await prisma.invoice.delete({
        where: { id },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Invoice deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update status only
   * PATCH /api/invoices/:id/status
   */
  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const existingInvoice = await prisma.invoice.findFirst({
        where: { id, userId },
      });

      if (!existingInvoice) {
        throw new NotFoundError('Invoice not found');
      }

      const invoice = await prisma.invoice.update({
        where: { id },
        data: { status },
        include: {
          items: true,
          client: true,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Invoice status updated successfully',
        data: invoice,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate and return a PDF of the invoice
   * GET /api/invoices/:id/pdf
   */
  static async getInvoicePdf(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const invoice = await prisma.invoice.findFirst({
        where: { id, userId },
        include: {
          items: true,
          client: true,
          user: true,
        },
      });

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      const pdfBuffer = await PdfService.generateInvoicePdfBuffer(invoice);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}