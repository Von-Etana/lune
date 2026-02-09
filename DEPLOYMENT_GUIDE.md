# Lune Platform Deployment Guide

This guide covers deploying the Lune platform to production environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Supabase project created
- ✅ PWRCHAIN wallet with sufficient balance
- ✅ Google Gemini API key
- ✅ GitHub repository (for CI/CD)
- ✅ Domain name (optional but recommended)

---

## Environment Setup

### 1. Supabase Configuration

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**
   - Navigate to SQL Editor in Supabase dashboard
   - Copy contents of `backend/supabase/schema.sql`
   - Execute the SQL script

3. **Configure Storage Buckets**
   ```sql
   -- Create storage buckets
   INSERT INTO storage.buckets (id, name, public)
   VALUES 
     ('video-introductions', 'video-introductions', true),
     ('certificates', 'certificates', true);

   -- Set up storage policies
   CREATE POLICY "Users can upload their own videos"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'video-introductions' AND auth.uid()::text = (storage.foldername(name))[1]);

   CREATE POLICY "Anyone can view videos"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'video-introductions');

   CREATE POLICY "Anyone can view certificates"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'certificates');
   ```

4. **Enable Realtime** (Optional)
   - Go to Database → Replication
   - Enable replication for tables: `jobs`, `certifications`, `assessment_submissions`

### 2. PWRCHAIN Setup

1. **Create Wallet**
   ```bash
   # Install PWRJS CLI (if available)
   npm install -g @pwrjs/cli
   
   # Generate new wallet
   pwr wallet create
   ```

2. **Fund Wallet**
   - Get testnet tokens from [PWR Labs Faucet](https://faucet.pwrlabs.io)
   - For mainnet, purchase PWR tokens

3. **Save Private Key Securely**
   - Store in environment variables (never commit to git)
   - Use secrets management service in production

### 3. Google Gemini API

1. **Get API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create new API key
   - Note the key for environment variables

---

## Database Setup

### Production Database Checklist

- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] Indexes created
- [ ] Seed data inserted
- [ ] Backup policy configured

### Database Backup

Configure automated backups in Supabase:
1. Go to Settings → Database
2. Enable Point-in-Time Recovery (PITR)
3. Set backup retention period (7-30 days recommended)

---

## Backend Deployment

### Option 1: Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub account

2. **Deploy Backend**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   cd backend
   railway init
   
   # Add environment variables
   railway variables set SUPABASE_URL=your_supabase_url
   railway variables set SUPABASE_SERVICE_KEY=your_service_key
   railway variables set GEMINI_API_KEY=your_gemini_key
   railway variables set SEED_PHRASE="word1 word2 word3 ..."
   railway variables set NODE_ENV=production
   railway variables set PORT=3001
   
   # Deploy
   railway up
   ```

3. **Configure Domain** (Optional)
   - Go to Railway dashboard
   - Settings → Domains
   - Add custom domain or use Railway subdomain

### Option 2: Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Connect GitHub account

2. **Create Web Service**
   - New → Web Service
   - Connect repository
   - Configure:
     - **Name:** lune-backend
     - **Environment:** Node
     - **Build Command:** `cd backend && npm install && npm run build`
     - **Start Command:** `cd backend && npm start`
     - **Plan:** Starter or higher

3. **Add Environment Variables**
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   GEMINI_API_KEY=your_gemini_key
   SEED_PHRASE="word1 word2 word3 ..."
   PWR_CHAIN_RPC_URL=https://rpc.pwrlabs.io
   NODE_ENV=production
   PORT=3001
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy

### Option 3: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku App**
   ```bash
   cd backend
   heroku create lune-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set SUPABASE_URL=your_supabase_url
   heroku config:set SUPABASE_SERVICE_KEY=your_service_key
   heroku config:set GEMINI_API_KEY=your_gemini_key
   heroku config:set SEED_PHRASE="word1 word2 word3 ..."
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### Verify Backend Deployment

Test your deployed backend:
```bash
# Health check
curl https://your-backend-url.com/health

# Test auth endpoint
curl -X POST https://your-backend-url.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User","role":"candidate"}'
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure Environment Variables**
   Create `.env.production`:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Deploy**
   ```bash
   # Login
   vercel login
   
   # Deploy
   vercel --prod
   ```

4. **Configure Domain**
   - Go to Vercel dashboard
   - Settings → Domains
   - Add custom domain

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build Project**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **Configure Environment Variables**
   - Go to Netlify dashboard
   - Site settings → Environment variables
   - Add:
     - `VITE_API_URL`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

### Option 3: GitHub Pages

1. **Update `vite.config.ts`**
   ```typescript
   export default defineConfig({
     base: '/lune/',
     // ... other config
   });
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   gh-pages -d dist
   ```

### Verify Frontend Deployment

1. Visit your deployed URL
2. Test user signup/login
3. Verify API connectivity
4. Test assessment flow
5. Check certificate minting

---

## Post-Deployment

### 1. Configure CORS

Update backend CORS settings for production:

```typescript
// backend/src/server.ts
app.use(cors({
  origin: [
    'https://your-frontend-domain.com',
    'https://www.your-frontend-domain.com'
  ],
  credentials: true
}));
```

### 2. Set Up SSL/HTTPS

- Railway/Render/Vercel: Automatic SSL
- Custom domain: Configure SSL certificate

### 3. Configure Rate Limiting

Ensure rate limiting is properly configured:

```typescript
// backend/src/middleware/rateLimiter.ts
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000
});
```

### 4. Database Optimization

```sql
-- Analyze tables for optimization
ANALYZE users;
ANALYZE assessments;
ANALYZE certifications;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### 5. Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (helmet middleware)
- [ ] Authentication tokens expire properly
- [ ] Sensitive data encrypted

---

## Monitoring & Maintenance

### 1. Error Tracking

**Option A: Sentry**
```bash
npm install @sentry/node @sentry/tracing
```

```typescript
// backend/src/server.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Option B: LogRocket**
```bash
npm install logrocket
```

### 2. Performance Monitoring

Monitor key metrics:
- API response times
- Database query performance
- Error rates
- User activity

### 3. Logging

Winston logs are configured. View logs:

**Railway:**
```bash
railway logs
```

**Render:**
- Dashboard → Logs

**Heroku:**
```bash
heroku logs --tail
```

### 4. Database Monitoring

Monitor in Supabase dashboard:
- Database size
- Active connections
- Query performance
- Slow queries

### 5. Backup Strategy

**Automated Backups:**
- Supabase: PITR enabled
- Database exports: Weekly
- Code: GitHub (version controlled)

**Manual Backup:**
```bash
# Export database
pg_dump -h db.supabase.co -U postgres -d postgres > backup.sql

# Backup environment variables
railway variables > env-backup.txt
```

### 6. Update Strategy

**Backend Updates:**
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run tests
npm test

# Deploy
railway up  # or render deploy
```

**Frontend Updates:**
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Deploy
vercel --prod
```

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run tests
        run: cd backend && npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Build
        run: npm install && npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Check backend CORS configuration
- Verify frontend URL is whitelisted

**2. Database Connection Failed**
- Verify Supabase URL and keys
- Check IP whitelist in Supabase

**3. Certificate Minting Failed**
- Check PWR wallet balance
- Verify SEED_PHRASE is set (must be valid 12-24 words)
- Check PWRCHAIN network status

**4. High Response Times**
- Enable database connection pooling
- Add caching layer (Redis)
- Optimize database queries

**5. Authentication Issues**
- Verify JWT secret is consistent
- Check token expiration settings
- Ensure Supabase auth is configured

---

## Support

For deployment support:
- Email: support@lune.platform
- Discord: [Join our community]
- GitHub Issues: [Report bugs]

---

## Checklist

Before going live:

- [ ] All environment variables set
- [ ] Database schema deployed
- [ ] Storage buckets configured
- [ ] Backend deployed and tested
- [ ] Frontend deployed and tested
- [ ] SSL/HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Error tracking configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team trained on deployment process

---

**Congratulations! Your Lune platform is now live! 🚀**
