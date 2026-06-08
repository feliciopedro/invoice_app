import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from '@/config';

// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs (optional)
  skip: (req: Request) => {
    // Skip rate limiting for localhost in development
    if (config.nodeEnv === 'development' && req.ip === '127.0.0.1') {
      return true;
    }
    return false;
  },
});

// Stricter rate limiting for authentication routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Password reset rate limiting
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helmet security configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.stripe.com'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Request size limiting middleware
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  
  if (contentLength > config.maxFileSize) {
    res.status(413).json({
      success: false,
      message: 'Request entity too large',
    });
    return;
  }
  
  next();
};

// IP whitelist middleware (optional)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (config.nodeEnv === 'production' && !allowedIPs.includes(clientIP || '')) {
      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
      });
      return;
    }
    
    next();
  };
};

// CORS preflight handler
export const handleCORSPreflight = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    next();
  }
};

// Security headers for API responses
export const apiSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    };
    
    // Log suspicious activity
    if (res.statusCode >= 400) {
      console.warn('Security Alert:', logData);
    }
  });
  
  next();
};