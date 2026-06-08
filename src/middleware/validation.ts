import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '@/types';

// Helper middleware to validate request using Zod schemas
export const validateRequest = (schema: {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query) as any;
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
          value: (req.body && err.path.length > 0) ? getNestedValue(req.body, err.path as (string | number)[]) : undefined,
        }));
        next(new ValidationError('Validation failed', validationErrors));
      } else {
        next(error);
      }
    }
  };
};

// Helper function to extract value from nested path
const getNestedValue = (obj: any, path: (string | number)[]): any => {
  return path.reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// UUID validation helper
const uuidSchema = z.string().uuid({ message: 'Must be a valid UUID' });

// 1. Auth Schemas
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  timezone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100).optional(),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  timezone: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

// 2. Client Schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Please provide a valid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100).optional(),
  email: z.string().email('Please provide a valid email address').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// 3. Invoice Item Schema
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  quantity: z.number().int().positive('Quantity must be an integer greater than 0'),
  unitPrice: z.number().nonnegative('Unit price must be 0 or greater'),
});

// 4. Invoice Schemas
export const createInvoiceSchema = z.object({
  clientId: uuidSchema,
  dueDate: z.string().transform((val) => {
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date;
  }),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).default('DRAFT'),
  taxRate: z.number().nonnegative('Tax rate must be 0 or greater').default(0),
  discount: z.number().nonnegative('Discount must be 0 or greater').default(0),
  currency: z.string().min(1, 'Currency is required').max(10).default('USD'),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must have at least one item'),
});

export const updateInvoiceSchema = z.object({
  clientId: uuidSchema.optional(),
  dueDate: z.string().transform((val) => {
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date;
  }).optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).optional(),
  taxRate: z.number().nonnegative('Tax rate must be 0 or greater').optional(),
  discount: z.number().nonnegative('Discount must be 0 or greater').optional(),
  currency: z.string().min(1).max(10).optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must have at least one item').optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']),
});

// Parameter ID Schema
export const paramIdSchema = z.object({
  id: uuidSchema,
});

// Query Schemas
export const clientQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
  search: z.string().optional(),
});

export const invoiceQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).optional(),
  clientId: z.string().uuid().optional(),
  dateFrom: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  dateTo: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});