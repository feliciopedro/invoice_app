import { PaginationQuery, PaginatedResponse } from '@/types';

// Pagination helper
export const paginate = <T>(
  data: T,
  total: number,
  page: number = 1,
  limit: number = 10
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    success: true,
    message: 'Data retrieved successfully',
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
};

// Parse pagination query parameters
export const parsePaginationQuery = (query: PaginationQuery) => {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10')));
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};


// Calculate individual item amount
export const calculateItemAmount = (quantity: number, rate: number): number => {
  return Number((quantity * rate).toFixed(2));
};

// Validate and calculate invoice items
export const processInvoiceItems = (items: Array<{ description: string; quantity: number; rate: number }>): Array<{ description: string; quantity: number; rate: number; amount: number }> => {
  return items.map(item => ({
    ...item,
    amount: calculateItemAmount(item.quantity, item.rate)
  }));
};

// Sanitize filename for file uploads
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

// Generate slug from string
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// Format date to string
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    default:
      return date.toISOString().split('T')[0] || date.toISOString();
  }
};

// Parse date from string
export const parseDate = (dateString: string): Date | null => {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Remove undefined values from object
export const removeUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key as keyof T] = value;
    }
  }
  
  return result;
};

// Capitalize first letter
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Generate random string
export const randomString = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Delay function for rate limiting or testing
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let attempt = 1;
  
  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      await delay(delayMs);
      attempt++;
    }
  }
  
  throw new Error('Max attempts reached');
};

// Check if object is empty
export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// Merge objects deeply
export const mergeDeep = (target: any, source: any): any => {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
};

// Generate unique invoice number
export const generateInvoiceNumber = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Get count of invoices for current month
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0);
  
  const count = await (await import('@/config/database')).default.invoice.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${year}-${month}-${sequence}`;
};

// Calculate invoice totals
export const calculateInvoiceTotals = (
  items: Array<{ quantity: number; rate: number; amount: number }>,
  taxRate: number = 0,
  discount: number = 0
): { subtotal: number; taxAmount: number; total: number } => {
  // Calculate subtotal from items
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.rate);
  }, 0);
  
  // Apply discount
  const discountedAmount = subtotal - discount;
  
  // Calculate tax on discounted amount
  const taxAmount = (discountedAmount * taxRate) / 100;
  
  // Calculate total
  const total = discountedAmount + taxAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};


// Validate invoice items
export const validateInvoiceItems = (items: any[]): boolean => {
  if (!Array.isArray(items) || items.length === 0) {
    return false;
  }
  
  return items.every(item => {
    return (
      item &&
      typeof item.description === 'string' &&
      item.description.trim().length > 0 &&
      typeof item.quantity === 'number' &&
      item.quantity > 0 &&
      typeof item.rate === 'number' &&
      item.rate >= 0 &&
      typeof item.amount === 'number' &&
      item.amount >= 0 &&
      Math.abs(item.amount - (item.quantity * item.rate)) < 0.01 // Allow small rounding differences
    );
  });
};

// Calculate due date based on payment terms
export const calculateDueDate = (issueDate: Date, paymentTerms: number = 30): Date => {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + paymentTerms);
  return dueDate;
};

// Check if invoice is overdue
export const isInvoiceOverdue = (dueDate: Date, status: string): boolean => {
  if (status === 'PAID' || status === 'CANCELLED') {
    return false;
  }
  
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0); // Start of due date
  
  return due < now;
};