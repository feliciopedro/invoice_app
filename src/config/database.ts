import { PrismaClient } from '@prisma/client';
import { DatabaseConfig } from '@/types';

// Create Prisma client instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Database configuration
export const databaseConfig: DatabaseConfig = {
  url: process.env.DATABASE_URL || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  name: process.env.DB_NAME || 'invoice_generator_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

// Database connection handler
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Database disconnection handler
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};

// Graceful shutdown handler
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default prisma;