import dotenv from 'dotenv';
import { AppConfig, JwtConfig, StripeConfig, EmailConfig } from '@/types';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Application configuration
export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  apiVersion: process.env.API_VERSION || 'v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  corsOrigins: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  uploadPath: process.env.UPLOAD_PATH || 'uploads/',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'logs/app.log',
};

// JWT configuration
export const jwtConfig: JwtConfig = {
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// Stripe configuration
export const stripeConfig: StripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  successUrl: process.env.STRIPE_SUCCESS_URL || `${config.frontendUrl}/payment/success`,
  cancelUrl: process.env.STRIPE_CANCEL_URL || `${config.frontendUrl}/payment/cancel`,
};

// Email configuration
export const emailConfig: EmailConfig = {
  provider: process.env.SENDGRID_API_KEY ? 'sendgrid' : 'smtp',
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Company information for invoices
export const companyConfig = {
  name: process.env.COMPANY_NAME || 'Your Company Name',
  address: process.env.COMPANY_ADDRESS || '123 Business St, City, State 12345',
  email: process.env.COMPANY_EMAIL || 'contact@yourcompany.com',
  phone: process.env.COMPANY_PHONE || '+1 (555) 123-4567',
  website: process.env.COMPANY_WEBSITE || 'https://yourcompany.com',
};

// Export all configurations
export * from './database';

export default {
  config,
  jwtConfig,
  stripeConfig,
  emailConfig,
  companyConfig,
};