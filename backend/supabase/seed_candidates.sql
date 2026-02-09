-- Lune Platform: Seed Candidates for Testing
-- Run this in Supabase SQL Editor to add test candidates

-- TEMPORARY: Drop foreign key constraint to allow fake users for demo
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_id_fkey') THEN 
        ALTER TABLE users DROP CONSTRAINT users_id_fkey; 
    END IF; 
END $$;

-- First, create demo users (these are fake accounts for demo purposes)
INSERT INTO users (id, email, role, name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'sarah.chen@demo.com', 'candidate', 'Sarah Chen'),
    ('22222222-2222-2222-2222-222222222222', 'marcus.johnson@demo.com', 'candidate', 'Marcus Johnson'),
    ('33333333-3333-3333-3333-333333333333', 'emily.rodriguez@demo.com', 'candidate', 'Emily Rodriguez'),
    ('44444444-4444-4444-4444-444444444444', 'james.williams@demo.com', 'candidate', 'James Williams'),
    ('55555555-5555-5555-5555-555555555555', 'priya.patel@demo.com', 'candidate', 'Priya Patel'),
    ('66666666-6666-6666-6666-666666666666', 'david.kim@demo.com', 'candidate', 'David Kim'),
    ('77777777-7777-7777-7777-777777777777', 'lisa.thompson@demo.com', 'candidate', 'Lisa Thompson'),
    ('88888888-8888-8888-8888-888888888888', 'alex.martinez@demo.com', 'candidate', 'Alex Martinez')
ON CONFLICT (id) DO NOTHING;

-- Insert candidate profiles with skills and experience
INSERT INTO candidate_profiles (user_id, title, location, bio, experience, years_of_experience, preferred_work_mode, skills, certifications, verified) VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'Senior Virtual Assistant',
        'New York, NY',
        'Experienced virtual assistant with expertise in executive support, project management, and administrative operations. Skilled in managing complex calendars, coordinating travel, and handling confidential information.',
        '5+ years supporting C-level executives at Fortune 500 companies. Expert in Microsoft Office Suite, Google Workspace, and various project management tools.',
        6,
        'Remote',
        '{"Virtual Assistant": 92, "Microsoft Excel": 88, "Google Workspace": 90, "Project Manager": 85, "Data Entry Specialist": 94}'::jsonb,
        '["0x7a2b3c4d5e6f7890abcdef1234567890abcdef12"]'::jsonb,
        true
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Executive Assistant',
        'Los Angeles, CA',
        'Detail-oriented executive assistant with a passion for organization and efficiency. Specialized in calendar management, meeting coordination, and stakeholder communication.',
        '4 years as an executive assistant to startup founders. Proficient in Slack, Notion, Asana, and advanced scheduling tools.',
        4,
        'Hybrid',
        '{"Executive Assistant": 89, "Microsoft PowerPoint": 85, "Report Writing": 82, "Active Listening": 90, "Presentation Skills": 78}'::jsonb,
        '[]'::jsonb,
        true
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Customer Success Manager',
        'Chicago, IL',
        'Customer-focused professional dedicated to building lasting client relationships. Expert in onboarding, retention strategies, and cross-functional collaboration.',
        '3 years in customer success at SaaS companies. Track record of reducing churn by 25% through proactive engagement.',
        3,
        'Remote',
        '{"Client Success Manager": 87, "Customer Support Representative": 91, "Negotiation": 80, "Conflict Resolution": 85, "Public Speaking": 75}'::jsonb,
        '["0x1234567890abcdef1234567890abcdef12345678"]'::jsonb,
        true
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Data Entry Specialist',
        'Austin, TX',
        'Fast and accurate data entry specialist with strong attention to detail. Experienced in database management, data validation, and report generation.',
        '2 years of data entry experience with 99.9% accuracy rate. Proficient in Excel, Google Sheets, and CRM systems.',
        2,
        'Remote',
        '{"Data Entry Specialist": 96, "Microsoft Excel": 92, "Data Analysis": 78, "Quality Assurance": 84, "Report Writing": 80}'::jsonb,
        '[]'::jsonb,
        false
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'Social Media Manager',
        'Miami, FL',
        'Creative social media strategist with proven track record of growing brand presence. Expert in content creation, analytics, and community management.',
        '4 years managing social media for e-commerce brands. Grew follower bases by 300%+ across multiple platforms.',
        4,
        'Remote',
        '{"Social Media Manager": 94, "Content Creator": 90, "Digital Marketing": 86, "Influencer Marketing": 82, "Brand Ambassador": 88}'::jsonb,
        '["0xabcdef1234567890abcdef1234567890abcdef12"]'::jsonb,
        true
    ),
    (
        '66666666-6666-6666-6666-666666666666',
        'Sales Representative',
        'Seattle, WA',
        'Results-driven sales professional with expertise in B2B sales and relationship building. Consistently exceeds quotas through consultative selling approach.',
        '5 years in tech sales. Closed over $2M in deals last year. Expert in CRM tools and sales automation.',
        5,
        'Hybrid',
        '{"Sales Representative": 91, "Business Development": 87, "Lead Generation": 89, "Negotiation": 85, "Account Executive": 83}'::jsonb,
        '[]'::jsonb,
        true
    ),
    (
        '77777777-7777-7777-7777-777777777777',
        'Project Coordinator',
        'Denver, CO',
        'Organized project coordinator with strong multitasking abilities. Skilled in timeline management, resource allocation, and stakeholder communication.',
        '3 years coordinating digital transformation projects. PMP certification in progress.',
        3,
        'Remote',
        '{"Project Manager": 82, "Operations Manager": 78, "Microsoft Excel": 86, "Report Writing": 84, "Training Coordinator": 80}'::jsonb,
        '[]'::jsonb,
        false
    ),
    (
        '88888888-8888-8888-8888-888888888888',
        'Technical Support Specialist',
        'Boston, MA',
        'Patient and knowledgeable technical support specialist. Expert in troubleshooting, customer education, and ticket management.',
        '4 years providing tier 2 technical support. Reduced average resolution time by 40%.',
        4,
        'Remote',
        '{"Technical Support": 93, "Help Desk Support": 90, "Customer Support Representative": 88, "Active Listening": 92, "Conflict Resolution": 85}'::jsonb,
        '["0x9876543210fedcba9876543210fedcba98765432"]'::jsonb,
        true
    )
ON CONFLICT (user_id) DO UPDATE SET
    title = EXCLUDED.title,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    experience = EXCLUDED.experience,
    years_of_experience = EXCLUDED.years_of_experience,
    preferred_work_mode = EXCLUDED.preferred_work_mode,
    skills = EXCLUDED.skills,
    certifications = EXCLUDED.certifications,
    verified = EXCLUDED.verified,
    updated_at = NOW();

-- Verify the data was inserted
SELECT u.name, cp.title, cp.location, cp.verified, cp.skills
FROM candidate_profiles cp
JOIN users u ON u.id = cp.user_id
ORDER BY cp.verified DESC, u.name;
