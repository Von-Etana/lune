# Lune - Complete Setup Guide

This guide will walk you through setting up the complete Lune platform from scratch.

## Prerequisites

- Node.js 18+ installed
- Supabase account
- PWRCHAIN wallet with some PWR tokens
- Google Gemini API key

## Part 1: Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and keys:
   - Project URL
   - `anon` (public) key
   - `service_role` key

### 2. Run Database Schema

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy the entire contents of `backend/supabase/schema.sql`
4. Paste and execute in the SQL Editor
5. Verify all tables were created successfully

### 3. Configure Storage (Optional)

If you want to enable video uploads:
1. Go to Storage in Supabase dashboard
2. Create a new bucket called `videos`
3. Set it to public or configure RLS policies

## Part 2: Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cp env.example .env
```

Edit `.env` and fill in:

```env
PORT=3001
NODE_ENV=development

# Supabase (from Part 1)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# PWRCHAIN
PWR_CHAIN_RPC_URL=https://rpc.pwrlabs.io
PWR_PRIVATE_KEY=your_pwr_private_key_here
PWR_CHAIN_ID=10023

# JWT (generate a random string)
JWT_SECRET=your_random_secret_here

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Start Backend Server

```bash
npm run dev
```

The backend should now be running on `http://localhost:3001`

### 4. Test Backend

```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Part 3: Frontend Setup

### 1. Install Dependencies

```bash
cd ..  # Back to root directory
npm install
```

### 2. Configure Environment Variables

```bash
cp env.example .env.local
```

Edit `.env.local`:

```env
# Backend API
VITE_API_URL=http://localhost:3001/api

# Supabase (same as backend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Gemini (optional, for client-side features)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Frontend

```bash
npm run dev
```

The frontend should now be running on `http://localhost:5173`

## Part 4: Testing the Platform

### 1. Create a Candidate Account

1. Open `http://localhost:5173`
2. Click "Get Started"
3. Select "I am a Candidate"
4. Sign up with:
   - Email: `test@candidate.com`
   - Password: `password123`
   - Name: `Test Candidate`

### 2. Take an Assessment

1. Click "Start New Assessment"
2. Select a skill (e.g., "React")
3. Choose difficulty level
4. Complete the coding challenge
5. Answer theory questions
6. Submit assessment

### 3. Mint Certificate

If you pass (score >= 70):
1. Certificate will be automatically minted on PWRCHAIN
2. View your certificate in the dashboard
3. Share or verify the certificate

### 4. Create an Employer Account

1. Log out
2. Sign up as employer
3. Create a job posting
4. View AI-matched candidates

## Part 5: PWRCHAIN Integration

### Getting PWR Tokens

1. Visit [PWR Chain Faucet](https://faucet.pwrlabs.io/)
2. Enter your wallet address
3. Request test tokens

### Verifying Certificates

Certificates are stored on PWRCHAIN and can be verified:
- On-chain: `https://explorer.pwrlabs.io/tx/{hash}`
- Via API: `GET /api/certificates/verify/{hash}`

## Part 6: Deployment

### Backend Deployment (Railway/Render)

1. Push code to GitHub
2. Connect to Railway/Render
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel/Netlify)

1. Push code to GitHub
2. Connect to Vercel/Netlify
3. Set environment variables
4. Deploy

### Update Environment Variables

After deployment, update:
- `ALLOWED_ORIGINS` in backend to include production URL
- `VITE_API_URL` in frontend to point to production backend

## Troubleshooting

### Backend won't start
- Check all environment variables are set
- Verify Supabase credentials
- Check if port 3001 is available

### Frontend can't connect to backend
- Verify backend is running
- Check CORS settings
- Verify `VITE_API_URL` is correct

### Database errors
- Verify schema was executed successfully
- Check RLS policies are enabled
- Verify Supabase service key has admin access

### Certificate minting fails
- Check PWR_PRIVATE_KEY is valid
- Verify wallet has PWR tokens
- Check PWRCHAIN RPC is accessible

## Architecture Overview

```
┌─────────────┐
│   Frontend  │ (React + Vite)
│  Port 5173  │
└──────┬──────┘
       │
       │ HTTP/REST
       │
┌──────▼──────┐
│   Backend   │ (Node.js + Express)
│  Port 3001  │
└──────┬──────┘
       │
       ├──────────┐
       │          │
┌──────▼──────┐  │
│  Supabase   │  │
│  Database   │  │
│     +       │  │
│    Auth     │  │
└─────────────┘  │
                 │
       ┌─────────┴──────────┐
       │                    │
┌──────▼──────┐    ┌────────▼────────┐
│  PWRCHAIN   │    │   Gemini AI     │
│ Blockchain  │    │   (Assessments) │
└─────────────┘    └─────────────────┘
```

## Features Implemented

✅ User Authentication (Supabase Auth)
✅ Candidate & Employer Profiles
✅ AI-Powered Assessment Generation
✅ Code Evaluation with Proctoring
✅ Blockchain Certificate Minting (PWRCHAIN)
✅ Certificate Verification
✅ AI Job Matching
✅ Mock Interviews with AI Feedback
✅ Row-Level Security
✅ Real-time Updates

## Next Steps

1. **Add Payment Integration**: Monetize assessments
2. **Video Proctoring**: Integrate webcam monitoring
3. **Mobile App**: React Native version
4. **Analytics Dashboard**: Track platform metrics
5. **Email Notifications**: Assessment reminders
6. **Social Features**: Share certificates on LinkedIn

## Support

For issues or questions:
- Check the README files in `backend/` and root directory
- Review API documentation in `backend/README.md`
- Check Supabase logs for database errors
- Review browser console for frontend errors

## License

MIT
