import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, ApiResponse } from '@/types';
import { config } from '@/config';

// Global error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: any[] = [];

  // Handle operational errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    
    // Handle validation errors
    if ('errors' in error && Array.isArray(error.errors)) {
      errors = error.errors;
    }
  }
  
  // Handle Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this information already exists';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference to related record';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'The change you are trying to make would violate the required relation';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
    }
  }
  
  // Handle Prisma validation errors
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  }
  
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // Handle multer errors (file upload)
  else if (error.name === 'MulterError') {
    const multerError = error as any;
    statusCode = 400;
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = 'File upload error';
    }
  }
  
  // Handle Stripe errors
  else if ((error as any).type && (error as any).type.startsWith('Stripe')) {
    statusCode = 400;
    message = error.message || 'Payment processing error';
  }

  // Log error in development
  if (config.nodeEnv === 'development') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      statusCode,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  }

  // Create error response
  const errorResponse: ApiResponse = {
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(config.nodeEnv === 'development' && { 
      error: error.message,
      stack: error.stack 
    }),
  };

  res.status(statusCode).json(errorResponse);
};

// 404 handler for undefined routes
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};