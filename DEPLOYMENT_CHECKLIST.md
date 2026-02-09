# 🚀 Pre-Flight Deployment Checklist

Use this checklist to ensure your Lune Platform deployment goes smoothly.

## 1. Backend (Render / Railway)

**Repository Root**: `backend/` (Important!)
**Build Command**: `npm install && npm run build`
**Start Command**: `npm start`

### Required Environment Variables
| Variable | Description | Example Value |
|----------|-------------|---------------|
| `NODE_ENV` | Environment mode | `production` |
| `GEMINI_API_KEY` | Google AI API Key | `AIzaSy...` |
| `SUPABASE_URL` | Check Supabase Settings | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_KEY` | The `service_role` key (NOT anon) | `eyJh...` |
| `SEED_PHRASE` | Wallet for minting certs | `word1 word2 ...` |
| `PWR_CHAIN_RPC_URL` | PWR Chain Endpoint | `https://rpc.pwrlabs.io` |

---

## 2. Frontend (Vercel / Netlify)

**Repository Root**: `./` (Project Root)
**Build Command**: `npm run build`
**Output Directory**: `dist`

### Required Environment Variables
| Variable | Description | Example Value |
|----------|-------------|---------------|
| `VITE_API_URL` | **URL of your deployed Backend** | `https://lune-backend.onrender.com/api` |
| `VITE_SUPABASE_URL` | Same as backend | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | The `anon` public key | `eyJh...` |

> **⚠️ CRITICAL**: Initially, deploy the Backend first. Once you have the Backend URL, add it as `VITE_API_URL` to your Frontend deployment settings and rebuild.

---

## 3. Post-Deployment Verification
- [ ] Log in with a test account.
- [ ] Check if `Generate Assessment` works (tests Backend proxy).
- [ ] Submit an assessment and check if Certificate minting works (tests PWR Chain).
