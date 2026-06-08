import { Router } from 'express';
import { InvoiceController } from '@/controllers/invoiceController';
import { requireAuth } from '@/middleware/auth';
import { 
  validateRequest, 
  createInvoiceSchema, 
  updateInvoiceSchema, 
  updateInvoiceStatusSchema,
  paramIdSchema,
  invoiceQuerySchema
} from '@/middleware/validation';

const router = Router();

// Protect all invoice routes
router.use(requireAuth);

/**
 * @route   GET /api/invoices
 * @desc    List all invoices for the logged-in user with filters
 * @access  Private
 */
router.get(
  '/',
  validateRequest({ query: invoiceQuerySchema }),
  InvoiceController.getInvoices
);

/**
 * @route   POST /api/invoices
 * @desc    Create a new invoice (with nested items)
 * @access  Private
 */
router.post(
  '/',
  validateRequest({ body: createInvoiceSchema }),
  InvoiceController.createInvoice
);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get a single invoice with items and client
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest({ params: paramIdSchema }),
  InvoiceController.getInvoiceById
);

/**
 * @route   PATCH /api/invoices/:id
 * @desc    Update invoice (including items)
 * @access  Private
 */
router.patch(
  '/:id',
  validateRequest({ params: paramIdSchema, body: updateInvoiceSchema }),
  InvoiceController.updateInvoice
);

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete invoice
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest({ params: paramIdSchema }),
  InvoiceController.deleteInvoice
);

/**
 * @route   PATCH /api/invoices/:id/status
 * @desc    Update status only
 * @access  Private
 */
router.patch(
  '/:id/status',
  validateRequest({ params: paramIdSchema, body: updateInvoiceStatusSchema }),
  InvoiceController.updateStatus
);

/**
 * @route   GET /api/invoices/:id/pdf
 * @desc    Generate and return a PDF of the invoice
 * @access  Private
 */
router.get(
  '/:id/pdf',
  validateRequest({ params: paramIdSchema }),
  InvoiceController.getInvoicePdf
);

export default router;