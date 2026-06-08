export interface User {
  id: string;
  name: string;
  email: string;
  businessName: string | null;
  businessAddress: string | null;
  logoUrl: string | null;
  timezone: string;
  createdAt: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  items?: InvoiceItem[];
  user?: User;
}

export interface DashboardSummary {
  totalInvoices: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueCount: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceData {
  clientId: string;
  dueDate: string;
  status: InvoiceStatus;
  taxRate: number;
  discount: number;
  currency: string;
  notes?: string;
  items: CreateInvoiceItem[];
}
