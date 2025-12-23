# Demo Accounts

Use these credentials to test the Lune platform:

## Candidate Accounts

### Account 1: Jordan Lee
- **Email:** `candidate@demo.lune.com`
- **Password:** `Demo123!`
- **Role:** Candidate
- **Profile:** Full Stack Developer, San Francisco, CA

### Account 2: Alex Chen
- **Email:** `developer@demo.lune.com`
- **Password:** `Demo123!`
- **Role:** Candidate
- **Profile:** Frontend Engineer, New York, NY

---

## Employer Accounts

### Account 1: Sarah Miller
- **Email:** `employer@demo.lune.com`
- **Password:** `Demo123!`
- **Role:** Employer
- **Company:** TechCorp Inc

### Account 2: Michael Brown
- **Email:** `recruiter@demo.lune.com`
- **Password:** `Demo123!`
- **Role:** Employer
- **Company:** StartupXYZ

---

## Creating Demo Accounts

To create these demo accounts in your Supabase instance, run:

```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_KEY="your-service-key"

# Run the seed script
npx ts-node scripts/seed-demo-accounts.ts
```

Alternatively, you can manually create accounts through the signup flow at `/` or via the Supabase dashboard.
