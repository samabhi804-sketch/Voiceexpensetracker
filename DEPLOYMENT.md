# VoiceTracker Deployment Guide

This comprehensive guide covers deploying the VoiceTracker expense tracking application with multiple OAuth providers, database setup, and production configuration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [OAuth Provider Setup](#oauth-provider-setup)
5. [Deployment Steps](#deployment-steps)
6. [Production Configuration](#production-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database (we recommend Neon for serverless hosting)
- Domain name with SSL certificate
- OAuth provider accounts (Google, Apple, Microsoft, Replit)

## Environment Setup

### Required Environment Variables

Create a `.env` file with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=voicetracker

# Session Security
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters

# Application Configuration
NODE_ENV=production
PORT=5000

# Replit Auth (if using Replit hosting)
REPLIT_DOMAINS=your-domain.replit.app
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple OAuth (Optional)
APPLE_CLIENT_ID=your-apple-service-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Apple private key\n-----END PRIVATE KEY-----"

# Microsoft OAuth (Optional)
MICROSOFT_CLIENT_ID=your-microsoft-application-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

### Session Secret Generation

Generate a secure session secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Database Configuration

### 1. PostgreSQL Setup

#### Using Neon (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Set `DATABASE_URL` in your environment

#### Using Local PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE voicetracker;
CREATE USER voicetracker_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE voicetracker TO voicetracker_user;
\q
```

### 2. Database Schema Setup

Run the following commands to set up your database schema:

```bash
# Install dependencies
npm install

# Push schema to database
npm run db:push

# If the above fails, use force push
npm run db:push --force
```

### 3. Database Initialization Script

Create `scripts/init-db.sql` for manual setup if needed:

```sql
-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- Add index for performance
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
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  period VARCHAR NOT NULL CHECK (period IN ('monthly', 'yearly')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
```

## OAuth Provider Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/google/callback`
   - `http://localhost:5000/api/auth/google/callback` (for development)
7. Copy Client ID and Client Secret to your environment

### Apple OAuth Setup

1. Sign in to [Apple Developer Console](https://developer.apple.com)
2. Go to "Certificates, Identifiers & Profiles"
3. Create a new Service ID:
   - Enter description and identifier
   - Enable "Sign In with Apple"
   - Configure domains and redirect URLs:
     - Domain: `yourdomain.com`
     - Redirect URL: `https://yourdomain.com/api/auth/apple/callback`
4. Create a new Key:
   - Enable "Sign In with Apple"
   - Download the key file (.p8)
5. Set environment variables with your Team ID, Key ID, and Private Key

### Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Set name and redirect URI: `https://yourdomain.com/api/auth/microsoft/callback`
5. Go to "Certificates & secrets" → "New client secret"
6. Copy Application ID and Client Secret to your environment

### Replit OAuth Setup

1. Your app automatically gets Replit OAuth when deployed on Replit
2. Set `REPLIT_DOMAINS` to your Replit app domain
3. `REPL_ID` is automatically provided by Replit

## Deployment Steps

### 1. Prepare Application

```bash
# Clone repository
git clone <your-repo-url>
cd voicetracker

# Install dependencies
npm install

# Build application
npm run build
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:push

# Verify database connection
npm run db:status
```

### 4. Deploy to Replit

1. Import your repository to Replit
2. Configure environment variables in Replit Secrets
3. Set up custom domain (if needed)
4. Deploy using Replit Deployments

### 5. Deploy to Other Platforms

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
# ... add other variables
```

#### Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway link
railway up

# Add environment variables through Railway dashboard
```

#### DigitalOcean App Platform

1. Connect your GitHub repository
2. Set environment variables in App settings
3. Configure build and run commands:
   - Build: `npm run build`
   - Run: `npm start`

## Production Configuration

### 1. Security Headers

Add to your Express app:

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### 2. Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);
```

### 3. CORS Configuration

```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
}));
```

### 4. Logging

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

## Monitoring & Maintenance

### 1. Health Checks

Create `/api/health` endpoint:

```javascript
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await db.select().from(users).limit(1);
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});
```

### 2. Database Backup

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="voicetracker_backup_$DATE.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to cloud storage (optional)
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/
```

### 3. Monitoring Scripts

```bash
#!/bin/bash
# monitor.sh

# Check if app is running
if ! curl -f http://localhost:5000/api/health; then
  echo "App is down, restarting..."
  pm2 restart voicetracker
fi

# Check database connections
if ! psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1; then
  echo "Database connection failed"
  # Send alert
fi
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT version();"

# Verify environment variables
echo $DATABASE_URL

# Check firewall/network issues
telnet your-db-host 5432
```

#### 2. OAuth Provider Errors

- **Google**: Verify redirect URIs match exactly
- **Apple**: Ensure private key format is correct
- **Microsoft**: Check Azure AD tenant configuration
- **Replit**: Verify REPLIT_DOMAINS matches your deployment

#### 3. Session Issues

```bash
# Clear Redis/session store
redis-cli FLUSHALL

# Regenerate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. Build Errors

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18 or higher

# Clear build cache
rm -rf dist .next
npm run build
```

### Debug Mode

Enable debug logging:

```bash
DEBUG=* npm run dev
NODE_ENV=development npm run dev
```

### Database Reset

To reset database (⚠️ **WARNING: This deletes all data**):

```bash
# Drop and recreate tables
npm run db:push --force

# Or manually reset
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:push
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX CONCURRENTLY idx_budgets_user_category ON budgets(user_id, category);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM expenses WHERE user_id = 'user123' ORDER BY date DESC;
```

### 2. Caching

```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache expensive queries
app.get('/api/expenses/stats', isAuthenticated, async (req, res) => {
  const cacheKey = `stats:${req.user.claims.sub}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const stats = await storage.getExpenseStats(req.user.claims.sub);
  await redis.setex(cacheKey, 300, JSON.stringify(stats)); // Cache for 5 minutes
  
  res.json(stats);
});
```

### 3. Frontend Optimization

```javascript
// Enable gzip compression
import compression from 'compression';
app.use(compression());

// Serve static files with cache headers
app.use(express.static('dist', {
  maxAge: '1y',
  etag: true,
}));
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure session configuration
- [ ] Implement rate limiting
- [ ] Validate all user inputs
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Backup database regularly
- [ ] Use strong session secrets
- [ ] Implement CSRF protection

## Support & Maintenance

### Regular Tasks

1. **Weekly**: Check application logs and performance metrics
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Review and rotate API keys and secrets
4. **Annually**: Review OAuth provider configurations

### Update Procedure

```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Test application
npm test

# Deploy updates
npm run deploy
```

For additional support, refer to the application documentation or contact the development team.