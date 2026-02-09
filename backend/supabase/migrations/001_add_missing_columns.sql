-- =====================================================
-- MIGRATION: Add missing columns to candidate_profiles
-- Run this migration on existing databases
-- =====================================================

-- Add profile image column
ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add skills as JSONB (for storing skill scores)
ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '{}'::jsonb;

-- Add certifications as JSONB (for storing blockchain hashes)
ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Add verification status
ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Add blockchain passport fields
ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS passport_id TEXT;

ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS passport_tx_hash TEXT;

-- Set default values for required fields if they're NULL
UPDATE candidate_profiles 
SET title = '' WHERE title IS NULL;

UPDATE candidate_profiles 
SET location = '' WHERE location IS NULL;

UPDATE candidate_profiles 
SET years_of_experience = 0 WHERE years_of_experience IS NULL;

UPDATE candidate_profiles 
SET preferred_work_mode = 'Remote' WHERE preferred_work_mode IS NULL;

-- =====================================================
-- MIGRATION: Add assessment history table
-- For tracking all assessment attempts
-- =====================================================

CREATE TABLE IF NOT EXISTS assessment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    skill_category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Mid-Level', 'Advanced')),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    passed BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    integrity_score INTEGER CHECK (integrity_score >= 0 AND integrity_score <= 100),
    feedback TEXT,
    category_scores JSONB DEFAULT '{}'::jsonb,
    certification_hash TEXT,
    cheating_detected BOOLEAN DEFAULT FALSE,
    cheating_reason TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_assessment_history_user_id ON assessment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_history_skill ON assessment_history(skill_name);
CREATE INDEX IF NOT EXISTS idx_assessment_history_completed ON assessment_history(completed_at DESC);

-- RLS for assessment history
ALTER TABLE assessment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessment history" ON assessment_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment history" ON assessment_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- MIGRATION: Add skill passports table
-- For blockchain-verified skill credentials
-- =====================================================

CREATE TABLE IF NOT EXISTS skill_passports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    passport_id TEXT UNIQUE NOT NULL,
    tx_hash TEXT NOT NULL,
    skills_snapshot JSONB NOT NULL,  -- Snapshot of skills at time of minting
    certifications_snapshot JSONB NOT NULL,  -- Snapshot of certs at time of minting
    minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_skill_passports_user_id ON skill_passports(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_passports_passport_id ON skill_passports(passport_id);

-- RLS for skill passports
ALTER TABLE skill_passports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own passport" ON skill_passports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own passport" ON skill_passports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own passport" ON skill_passports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Employers can view all passports" ON skill_passports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'employer'
        )
    );

-- =====================================================
-- MIGRATION: Add gamification tables
-- For tracking user achievements and progress
-- =====================================================

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,  -- 'badge', 'milestone', 'streak'
    achievement_id TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can earn achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- MIGRATION: Add user statistics table
-- For tracking overall user progress
-- =====================================================

CREATE TABLE IF NOT EXISTS user_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_assessments INTEGER DEFAULT 0,
    passed_assessments INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON user_statistics(user_id);

ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own statistics" ON user_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics" ON user_statistics
    FOR ALL USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON user_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET FOR PROFILE IMAGES
-- Run this in Supabase Dashboard > Storage
-- =====================================================

-- Note: Storage buckets are created via Supabase Dashboard or API
-- Create a bucket named 'profile-images' with public access
-- 
-- Bucket settings:
-- - Name: profile-images
-- - Public: true
-- - File size limit: 5MB
-- - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- =====================================================
-- VERIFICATION: Print success message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'New columns added to candidate_profiles:';
    RAISE NOTICE '  - image_url (profile picture)';
    RAISE NOTICE '  - skills (JSONB)';
    RAISE NOTICE '  - certifications (JSONB)';
    RAISE NOTICE '  - verified (boolean)';
    RAISE NOTICE '  - passport_id (text)';
    RAISE NOTICE '  - passport_tx_hash (text)';
    RAISE NOTICE '';
    RAISE NOTICE 'New tables created:';
    RAISE NOTICE '  - assessment_history';
    RAISE NOTICE '  - skill_passports';
    RAISE NOTICE '  - user_achievements';
    RAISE NOTICE '  - user_statistics';
END $$;
