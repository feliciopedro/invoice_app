import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config, connectDatabase } from '@/config';
import {
  errorHandler,
  notFoundHandler,
  rateLimiter,
  securityHeaders,
  apiSecurityHeaders,
  handleCORSPreflight,
} from '@/middleware';
import { logger } from '@/utils';


import path from 'path';

// Import routes
import authRoutes from '@/routes/auth';
import clientRoutes from '@/routes/clients';
import invoiceRoutes from '@/routes/invoices';
import dashboardRoutes from '@/routes/dashboard';

const app = express();

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(apiSecurityHeaders);

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Restrict to configured frontend origins only.
    // In development, allow no-origin requests for local tooling.
    if (!origin) {
      if (config.nodeEnv === 'development') return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    }
    
    if (config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: config.corsCredentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle CORS preflight requests
app.use(handleCORSPreflight);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  }));
}

// Rate limiting
app.use('/api', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});

// API routes
const apiRouter = express.Router();

// Mount routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/clients', clientRoutes);
apiRouter.use('/invoices', invoiceRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

// API info endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Invoice Generator API',
    data: {
      version: config.apiVersion,
      environment: config.nodeEnv,
      endpoints: [
        'GET /api/health - Health check',
        'POST /api/auth/register - User registration',
        'POST /api/auth/login - User login',
        'POST /api/auth/refresh - Refresh token',
        'GET /api/users/profile - Get user profile',
        'GET /api/clients - Get clients',
        'POST /api/clients - Create client',
        'GET /api/invoices - Get invoices',
        'POST /api/invoices - Create invoice',
        'GET /api/payments - Get payments',
        'POST /api/payments - Create payment',
      ],
    },
  });
});

// Mount API router
app.use(`/api/${config.apiVersion}`, apiRouter);
app.use('/api', apiRouter); // Also mount without version for backward compatibility

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();



    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API URL: ${config.backendUrl}/api/${config.apiVersion}`);
      logger.info(`💻 Health check: ${config.backendUrl}/health`);
      
      if (config.nodeEnv === 'development') {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🧾 Invoice Generator API                   ║
║                                                              ║
║  🌐 Server: http://localhost:${config.port}                           ║
║  📋 API: http://localhost:${config.port}/api/${config.apiVersion}                    ║
║  💚 Health: http://localhost:${config.port}/health                    ║
║  📚 Environment: ${config.nodeEnv.toUpperCase()}                              ║
║                                                              ║
║  Ready to accept requests! 🎉                               ║
╚══════════════════════════════════════════════════════════════╝
        `);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connection
        try {
          const { disconnectDatabase } = await import('@/config/database');
          await disconnectDatabase();
        } catch (error) {
          logger.error('Error closing database connection:', error);
        }
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { promise, reason });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;