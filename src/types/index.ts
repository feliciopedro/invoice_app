import { Request } from 'express';
import { User } from '@prisma/client';

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'passwordHash'>;
  file?: Express.Multer.File;
}

// API Response type
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: ValidationIssue[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ValidationIssue {
  field: string;
  message: string;
  value?: any;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  businessName?: string;
  businessAddress?: string;
}

export interface UpdateProfileData {
  name?: string;
  businessName?: string;
  businessAddress?: string;
  logoUrl?: string;
}

// Client types
export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Invoice Item types
export interface CreateInvoiceItemData {
  description: string;
  quantity: number;
  unitPrice: number;
}

// Invoice types
export interface CreateInvoiceData {
  clientId: string;
  dueDate: string | Date;
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  taxRate?: number;
  discount?: number;
  currency?: string;
  notes?: string;
  items: CreateInvoiceItemData[];
}

export interface UpdateInvoiceData {
  clientId?: string;
  dueDate?: string | Date;
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  taxRate?: number;
  discount?: number;
  currency?: string;
  notes?: string;
  items?: CreateInvoiceItemData[];
}

// Query parameters
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InvoiceQuery extends PaginationQuery {
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ClientQuery extends PaginationQuery {
  search?: string;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public errors: ValidationIssue[];

  constructor(message: string, errors: ValidationIssue[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  successUrl: string;
  cancelUrl: string;
}

export interface EmailConfig {
  provider: 'sendgrid' | 'smtp';
  sendgrid?: {
    apiKey: string;
    fromEmail: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiVersion: string;
  frontendUrl: string;
  backendUrl: string;
  corsOrigins: string[];
  corsCredentials: boolean;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  maxFileSize: number;
  uploadPath: string;
  bcryptSaltRounds: number;
  sessionSecret: string;
  logLevel: string;
  logFile: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}