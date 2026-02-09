-- =====================================================
-- DEMO ACCOUNTS SEED DATA
-- Run this after the main schema.sql
-- =====================================================

-- Note: These demo accounts are created using Supabase Auth Admin API
-- The passwords are hashed by Supabase Auth, so we cannot insert them directly.
-- Use the seed script (scripts/seed-demo-accounts.ts) to create these accounts.

-- Demo Account Credentials:
-- 
-- CANDIDATE ACCOUNTS:
-- 1. Email: candidate@demo.lune.com
--    Password: Demo123!
--    Name: Jordan Lee
--
-- 2. Email: developer@demo.lune.com
--    Password: Demo123!
--    Name: Alex Chen
--
-- EMPLOYER ACCOUNTS:
-- 1. Email: employer@demo.lune.com
--    Password: Demo123!
--    Name: Sarah Miller
--    Company: TechCorp Inc
--
-- 2. Email: recruiter@demo.lune.com
--    Password: Demo123!
--    Name: Michael Brown
--    Company: StartupXYZ

-- After creating users via the API, you can run this to add profile data:

-- Demo candidate profiles (run after users are created via API)
-- INSERT INTO candidate_profiles (user_id, title, location, bio, years_of_experience, preferred_work_mode)
-- SELECT id, 'Full Stack Developer', 'San Francisco, CA', 'Passionate developer with expertise in React and Node.js', 3, 'Hybrid'
-- FROM users WHERE email = 'candidate@demo.lune.com';

-- INSERT INTO candidate_profiles (user_id, title, location, bio, years_of_experience, preferred_work_mode)
-- SELECT id, 'Frontend Engineer', 'New York, NY', 'React specialist with a keen eye for UI/UX', 5, 'Remote'
-- FROM users WHERE email = 'developer@demo.lune.com';

-- Demo employer profiles (run after users are created via API)
-- INSERT INTO employer_profiles (user_id, company_name, company_website, company_size, industry)
-- SELECT id, 'TechCorp Inc', 'https://techcorp.demo', '500-1000', 'Technology'
-- FROM users WHERE email = 'employer@demo.lune.com';

-- INSERT INTO employer_profiles (user_id, company_name, company_website, company_size, industry)
-- SELECT id, 'StartupXYZ', 'https://startupxyz.demo', '10-50', 'SaaS'
-- FROM users WHERE email = 'recruiter@demo.lune.com';
