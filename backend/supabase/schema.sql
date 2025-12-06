-- Lune Platform Database Schema
-- This schema supports blockchain skill verification with Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('candidate', 'employer')),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CANDIDATE PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    bio TEXT,
    experience TEXT,
    years_of_experience INTEGER,
    preferred_work_mode TEXT CHECK (preferred_work_mode IN ('Remote', 'Hybrid', 'On-site')),
    video_intro_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EMPLOYER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_website TEXT,
    company_size TEXT,
    industry TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SKILLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('frontend', 'backend', 'cloud', 'devops', 'architect')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ASSESSMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Mid-Level', 'Advanced')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    starter_code TEXT NOT NULL,
    theory_questions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ASSESSMENT SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    code_submission TEXT NOT NULL,
    theory_answers JSONB NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    feedback TEXT NOT NULL,
    passed BOOLEAN NOT NULL,
    cheating_detected BOOLEAN DEFAULT FALSE,
    cheating_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CERTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    blockchain_hash TEXT UNIQUE NOT NULL,
    score INTEGER NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Mid-Level', 'Advanced')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- JOBS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    salary TEXT NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MOCK INTERVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mock_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    topic TEXT NOT NULL CHECK (topic IN ('behavioral', 'technical')),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 100),
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
    feedback TEXT NOT NULL,
    improved_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROCTORING EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS proctoring_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_candidate_profiles_user_id ON candidate_profiles(user_id);
CREATE INDEX idx_employer_profiles_user_id ON employer_profiles(user_id);
CREATE INDEX idx_assessments_skill_id ON assessments(skill_id);
CREATE INDEX idx_assessments_difficulty ON assessments(difficulty);
CREATE INDEX idx_submissions_user_id ON assessment_submissions(user_id);
CREATE INDEX idx_submissions_assessment_id ON assessment_submissions(assessment_id);
CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_certifications_blockchain_hash ON certifications(blockchain_hash);
CREATE INDEX idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX idx_mock_interviews_user_id ON mock_interviews(user_id);
CREATE INDEX idx_proctoring_events_submission_id ON proctoring_events(submission_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_events ENABLE ROW LEVEL SECURITY;

-- Users: Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Candidate Profiles: Candidates can manage their own profile, employers can view
CREATE POLICY "Candidates can manage own profile" ON candidate_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Employers can view candidate profiles" ON candidate_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'employer'
        )
    );

-- Employer Profiles: Employers can manage their own profile
CREATE POLICY "Employers can manage own profile" ON employer_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Skills: Everyone can read skills
CREATE POLICY "Anyone can view skills" ON skills
    FOR SELECT TO authenticated USING (true);

-- Assessments: Everyone can read assessments
CREATE POLICY "Anyone can view assessments" ON assessments
    FOR SELECT TO authenticated USING (true);

-- Assessment Submissions: Users can view and create their own submissions
CREATE POLICY "Users can view own submissions" ON assessment_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions" ON assessment_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Certifications: Users can view their own, employers can view all
CREATE POLICY "Users can view own certifications" ON certifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Employers can view all certifications" ON certifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'employer'
        )
    );

-- Jobs: Employers can manage their jobs, candidates can view all
CREATE POLICY "Employers can manage own jobs" ON jobs
    FOR ALL USING (auth.uid() = employer_id);

CREATE POLICY "Candidates can view all jobs" ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'candidate'
        )
    );

-- Mock Interviews: Users can manage their own interviews
CREATE POLICY "Users can manage own interviews" ON mock_interviews
    FOR ALL USING (auth.uid() = user_id);

-- Proctoring Events: Users can view events for their submissions
CREATE POLICY "Users can view own proctoring events" ON proctoring_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assessment_submissions 
            WHERE id = proctoring_events.submission_id 
            AND user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_profiles_updated_at BEFORE UPDATE ON candidate_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employer_profiles_updated_at BEFORE UPDATE ON employer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default skills
INSERT INTO skills (name, category) VALUES
    ('React', 'frontend'),
    ('Vue', 'frontend'),
    ('Angular', 'frontend'),
    ('CSS', 'frontend'),
    ('JavaScript', 'frontend'),
    ('TypeScript', 'frontend'),
    ('Node.js', 'backend'),
    ('Python', 'backend'),
    ('Java', 'backend'),
    ('Go', 'backend'),
    ('PostgreSQL', 'backend'),
    ('MongoDB', 'backend'),
    ('AWS', 'cloud'),
    ('Azure', 'cloud'),
    ('GCP', 'cloud'),
    ('Docker', 'devops'),
    ('Kubernetes', 'devops'),
    ('CI/CD', 'devops'),
    ('System Design', 'architect'),
    ('Microservices', 'architect')
ON CONFLICT (name) DO NOTHING;
