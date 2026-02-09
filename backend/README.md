# Lune Backend API

Backend API for the Lune Blockchain Skill Verification Platform.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: PWRCHAIN (@pwrjs/core)
- **AI**: Google Gemini AI
- **Authentication**: Supabase Auth

## Features

- ✅ User authentication (candidates & employers)
- ✅ AI-powered assessment generation
- ✅ Code evaluation with proctoring
- ✅ Blockchain certificate minting on PWRCHAIN
- ✅ Certificate verification
- ✅ AI-powered job matching
- ✅ Mock interview with AI feedback
- ✅ Row-level security (RLS)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `env.example` to `.env` and fill in your credentials:

```bash
cp env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `GEMINI_API_KEY` - Google Gemini API key
- `PWR_PRIVATE_KEY` - PWRCHAIN private key for minting

### 3. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy the contents of supabase/schema.sql
# Paste into Supabase SQL Editor and execute
```

This will create:
- All necessary tables
- Row Level Security policies
- Indexes
- Seed data for skills

### 4. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### 5. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/video` - Upload video introduction
- `GET /api/users/:id/certifications` - Get user certifications

### Assessments
- `POST /api/assessments/generate` - Generate new assessment
- `POST /api/assessments/submit` - Submit assessment
- `GET /api/assessments/:id` - Get assessment details
- `GET /api/assessments/history` - Get user's assessment history
- `POST /api/assessments/:id/proctor` - Submit proctoring events

### Certificates
- `POST /api/certificates/mint` - Mint certificate on blockchain
- `GET /api/certificates/verify/:hash` - Verify certificate
- `GET /api/certificates/:id` - Get certificate details
- `GET /api/certificates` - Get user's certificates

### Jobs
- `GET /api/jobs` - List jobs (with AI matching for candidates)
- `POST /api/jobs` - Create job posting (employers only)
- `GET /api/jobs/:id/candidates` - Get matched candidates (employers only)

### Interviews
- `POST /api/interviews/start` - Start mock interview
- `POST /api/interviews/answer` - Submit answer and get feedback
- `GET /api/interviews/:id/feedback` - Get interview feedback
- `GET /api/interviews/history` - Get interview history

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, error handling
│   ├── routes/          # API routes
│   ├── services/        # Business logic (Supabase, PWRCHAIN, Gemini)
│   ├── utils/           # Utilities (logger)
│   └── server.ts        # Express app entry point
├── supabase/
│   └── schema.sql       # Database schema
├── package.json
└── tsconfig.json
```

## Security

- All routes (except auth) require authentication
- Row Level Security (RLS) enforced at database level
- Role-based access control (candidate/employer)
- Proctoring events tracked for assessment integrity
- Environment variables for sensitive data

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run linter
npm run lint
```

## Deployment

1. Set environment variables in your hosting platform
2. Run database migrations
3. Build the project: `npm run build`
4. Start the server: `npm start`

Recommended platforms:
- Railway
- Render
- Heroku
- AWS/GCP/Azure

## License

MIT
