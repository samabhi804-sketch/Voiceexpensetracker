#!/usr/bin/env node

/**
 * Database Setup Script for VoiceTracker
 * 
 * This script initializes the database schema and sets up required tables
 * for the VoiceTracker expense tracking application.
 */

import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// SQL schema setup
const setupSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- Add index for session expiration
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions ("expire");

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description VARCHAR NOT NULL CHECK (length(description) > 0),
  category VARCHAR NOT NULL CHECK (length(category) > 0),
  date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR NOT NULL CHECK (length(category) > 0),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  period VARCHAR NOT NULL CHECK (period IN ('monthly', 'yearly')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets(user_id, category);

-- Create audit function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON expenses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at 
  BEFORE UPDATE ON budgets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
`;

// Verification queries
const verificationQueries = [
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
  "SELECT indexname FROM pg_indexes WHERE tablename = 'expenses'",
  "SELECT COUNT(*) as session_table_exists FROM information_schema.tables WHERE table_name = 'sessions'"
];

async function setupDatabase() {
  console.log('🚀 Starting VoiceTracker database setup...\n');

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Database connected successfully');
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[1]}\n`);
    
    // Execute setup SQL
    console.log('🔧 Creating database schema...');
    await client.query(setupSQL);
    console.log('✅ Database schema created successfully\n');

    // Verify setup
    console.log('🔍 Verifying database setup...');
    
    // Check tables
    const tablesResult = await client.query(verificationQueries[0]);
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`✅ Created tables: ${tables.join(', ')}`);

    // Check indexes
    const indexesResult = await client.query(verificationQueries[1]);
    const indexes = indexesResult.rows.map(row => row.indexname);
    console.log(`✅ Created indexes: ${indexes.length} indexes for expenses table`);

    // Check sessions table
    const sessionsResult = await client.query(verificationQueries[2]);
    const hasSessionsTable = sessionsResult.rows[0].session_table_exists > 0;
    console.log(`✅ Sessions table: ${hasSessionsTable ? 'Ready' : 'Not found'}`);

    client.release();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up your OAuth providers (Google, Apple, Microsoft, Replit)');
    console.log('2. Configure environment variables');
    console.log('3. Start the application with: npm run dev');
    console.log('\nFor detailed setup instructions, see DEPLOYMENT.md');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.message.includes('connect ECONNREFUSED')) {
      console.error('\n🔧 Connection troubleshooting:');
      console.error('   • Check if PostgreSQL is running');
      console.error('   • Verify DATABASE_URL environment variable');
      console.error('   • Check firewall and network connectivity');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n🔧 Authentication troubleshooting:');
      console.error('   • Verify username and password in DATABASE_URL');
      console.error('   • Check database user permissions');
    } else if (error.message.includes('does not exist')) {
      console.error('\n🔧 Database troubleshooting:');
      console.error('   • Ensure the database exists');
      console.error('   • Check database name in DATABASE_URL');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Utility function to check environment
function checkEnvironment() {
  console.log('🔍 Checking environment configuration...\n');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET'
  ];

  const optionalEnvVars = [
    'GOOGLE_CLIENT_ID',
    'APPLE_CLIENT_ID', 
    'MICROSOFT_CLIENT_ID',
    'REPLIT_DOMAINS'
  ];

  let hasErrors = false;

  // Check required variables
  console.log('Required environment variables:');
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      hasErrors = true;
    }
  });

  // Check optional variables
  console.log('\nOptional OAuth provider variables:');
  optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`⚠️  ${varName}: Not set`);
    }
  });

  if (hasErrors) {
    console.error('\n❌ Missing required environment variables!');
    console.error('Please set up your .env file before running setup.');
    console.error('See DEPLOYMENT.md for detailed configuration instructions.');
    process.exit(1);
  }

  console.log('\n✅ Environment configuration looks good!\n');
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkEnvironment();
  setupDatabase();
}

export { setupDatabase, checkEnvironment };