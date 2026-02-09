import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    logger.error('CRITICAL: Missing Supabase environment variables! Database operations will fail.');
}

// Client for user-authenticated requests
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for service-level operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

logger.info('Supabase client initialized');

// Database Types
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    role: 'candidate' | 'employer';
                    name: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
            candidate_profiles: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    location: string;
                    bio: string | null;
                    experience: string | null;
                    years_of_experience: number | null;
                    preferred_work_mode: 'Remote' | 'Hybrid' | 'On-site' | null;
                    video_intro_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['candidate_profiles']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['candidate_profiles']['Insert']>;
            };
            skills: {
                Row: {
                    id: string;
                    name: string;
                    category: 'frontend' | 'backend' | 'cloud' | 'devops' | 'architect';
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['skills']['Row'], 'created_at'>;
                Update: Partial<Database['public']['Tables']['skills']['Insert']>;
            };
            assessments: {
                Row: {
                    id: string;
                    skill_id: string;
                    difficulty: 'Beginner' | 'Mid-Level' | 'Advanced';
                    title: string;
                    description: string;
                    starter_code: string;
                    theory_questions: any;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['assessments']['Row'], 'created_at'>;
                Update: Partial<Database['public']['Tables']['assessments']['Insert']>;
            };
            assessment_submissions: {
                Row: {
                    id: string;
                    user_id: string;
                    assessment_id: string;
                    code_submission: string;
                    theory_answers: any;
                    score: number;
                    feedback: string;
                    passed: boolean;
                    cheating_detected: boolean;
                    cheating_reason: string | null;
                    submitted_at: string;
                };
                Insert: Omit<Database['public']['Tables']['assessment_submissions']['Row'], 'submitted_at'>;
                Update: Partial<Database['public']['Tables']['assessment_submissions']['Insert']>;
            };
            certifications: {
                Row: {
                    id: string;
                    user_id: string;
                    skill_id: string;
                    submission_id: string;
                    blockchain_hash: string;
                    score: number;
                    difficulty: 'Beginner' | 'Mid-Level' | 'Advanced';
                    issued_at: string;
                };
                Insert: Omit<Database['public']['Tables']['certifications']['Row'], 'issued_at'>;
                Update: Partial<Database['public']['Tables']['certifications']['Insert']>;
            };
            jobs: {
                Row: {
                    id: string;
                    employer_id: string;
                    title: string;
                    company: string;
                    location: string;
                    type: string;
                    salary: string;
                    description: string;
                    required_skills: string[];
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
            };
            mock_interviews: {
                Row: {
                    id: string;
                    user_id: string;
                    role: string;
                    topic: 'behavioral' | 'technical';
                    question: string;
                    answer: string;
                    clarity_score: number;
                    confidence_score: number;
                    relevance_score: number;
                    feedback: string;
                    improved_answer: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['mock_interviews']['Row'], 'created_at'>;
                Update: Partial<Database['public']['Tables']['mock_interviews']['Insert']>;
            };
            proctoring_events: {
                Row: {
                    id: string;
                    submission_id: string;
                    event_type: string;
                    event_data: any;
                    timestamp: string;
                };
                Insert: Database['public']['Tables']['proctoring_events']['Row'];
                Update: Partial<Database['public']['Tables']['proctoring_events']['Insert']>;
            };
        };
    };
}
