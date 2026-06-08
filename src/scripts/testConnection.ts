import prisma from '@/config/database';
import { config } from '@/config';

/**
 * Test PostgreSQL database connection
 * Run with: npx ts-node src/scripts/testConnection.ts
 */

async function testDatabaseConnection() {
  console.log('🔄 Testing PostgreSQL database connection...\n');

  try {
    // Display connection info (without password)
    console.log('📋 Connection Details:');
    console.log(`   Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || '5432'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'invoice_generator_db'}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}\n`);

    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Database connection established successfully\n');

    // Test 2: Query execution
    console.log('2️⃣ Testing query execution...');
    const result = await prisma.$queryRaw`SELECT version() as version, now() as current_time`;
    console.log('✅ Query executed successfully');
    console.log(`   PostgreSQL Version: ${(result as any)[0]?.version?.split(' ')[0] || 'Unknown'}`);
    console.log(`   Current Time: ${(result as any)[0]?.current_time || 'Unknown'}\n`);

    // Test 3: Check if tables exist
    console.log('3️⃣ Checking database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    if (Array.isArray(tables) && tables.length > 0) {
      console.log('✅ Database tables found:');
      tables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found in database (this is normal for a new database)');
      console.log('   You may need to run Prisma migrations to create tables.');
    }
    console.log();

    // Test 4: Check Prisma client
    console.log('4️⃣ Testing Prisma client...');
    const prismaVersion = require('@prisma/client/package.json').version;
    console.log('✅ Prisma client is working');
    console.log(`   Prisma Client Version: ${prismaVersion}\n`);

    // Test 5: Connection pool test
    console.log('5️⃣ Testing connection pool...');
    const promises = Array.from({ length: 5 }, async (_, i) => {
      const result = await prisma.$queryRaw`SELECT ${i + 1} as connection_test`;
      return result;
    });
    
    await Promise.all(promises);
    console.log('✅ Connection pool is working (5 concurrent connections tested)\n');

    console.log('🎉 All database tests passed! Your PostgreSQL connection is working perfectly.\n');

    // Display next steps
    console.log('📝 Next Steps:');
    console.log('   1. Run database migrations: npx prisma migrate dev');
    console.log('   2. Generate Prisma client: npx prisma generate');
    console.log('   3. Seed initial data: npm run seed:subscriptions');
    console.log('   4. Start the server: npm run dev\n');

  } catch (error) {
    console.error('❌ Database connection test failed:\n');
    
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}\n`);
      
      // Provide specific troubleshooting based on error type
      if (error.message.includes('ECONNREFUSED')) {
        console.log('🔧 Troubleshooting ECONNREFUSED:');
        console.log('   - Make sure PostgreSQL is running on your system');
        console.log('   - Check if the port 5432 is correct');
        console.log('   - Verify the host (localhost) is accessible\n');
      } else if (error.message.includes('authentication failed')) {
        console.log('🔧 Troubleshooting Authentication:');
        console.log('   - Check your username and password in .env file');
        console.log('   - Make sure the user has access to the database');
        console.log('   - Verify the database name exists\n');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.log('🔧 Troubleshooting Database Not Found:');
        console.log('   - Create the database: CREATE DATABASE invoice_generator_db;');
        console.log('   - Or update DB_NAME in .env to match existing database\n');
      } else if (error.message.includes('timeout')) {
        console.log('🔧 Troubleshooting Timeout:');
        console.log('   - Check network connectivity');
        console.log('   - Verify PostgreSQL is accepting connections');
        console.log('   - Check firewall settings\n');
      }
    } else {
      console.error('   Unknown error occurred');
    }

    console.log('💡 General Troubleshooting:');
    console.log('   1. Verify PostgreSQL is installed and running');
    console.log('   2. Check your .env file configuration');
    console.log('   3. Test connection with psql: psql -h localhost -p 5432 -U postgres -d invoice_generator_db');
    console.log('   4. Make sure the database exists');
    console.log('   5. Check PostgreSQL logs for more details\n');

  } finally {
    // Clean up connection
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Helper function to check PostgreSQL service status (Windows)
async function checkPostgreSQLService() {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    console.log('🔍 Checking PostgreSQL service status...');
    
    const { stdout } = await execAsync('sc query postgresql-x64-14 2>nul || sc query postgresql-x64-13 2>nul || sc query postgresql-x64-12 2>nul || echo "Service not found"');
    
    if (stdout.includes('RUNNING')) {
      console.log('✅ PostgreSQL service is running');
    } else if (stdout.includes('STOPPED')) {
      console.log('⚠️  PostgreSQL service is stopped');
      console.log('   Try: net start postgresql-x64-14 (or your version)');
    } else {
      console.log('❓ PostgreSQL service status unknown');
    }
  } catch (error) {
    console.log('❓ Could not check PostgreSQL service status');
  }
}

// Run the test
if (require.main === module) {
  // Check service status first (Windows only)
  if (process.platform === 'win32') {
    checkPostgreSQLService().then(() => {
      console.log();
      testDatabaseConnection();
    });
  } else {
    testDatabaseConnection();
  }
}