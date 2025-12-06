
export enum ViewState {
  LANDING = 'LANDING',
  AUTH_SELECTION = 'AUTH_SELECTION',
  CANDIDATE_DASHBOARD = 'CANDIDATE_DASHBOARD',
  SKILL_SELECTION = 'SKILL_SELECTION',
  ASSESSMENT = 'ASSESSMENT',
  ASSESSMENT_RESULT = 'ASSESSMENT_RESULT',
  EMPLOYER_DASHBOARD = 'EMPLOYER_DASHBOARD',
}

export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  EMPLOYER = 'EMPLOYER',
}

export type DifficultyLevel = 'Beginner' | 'Mid-Level' | 'Advanced';

export interface Skill {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'cloud' | 'devops' | 'architect';
}

export interface CandidateProfile {
  id: string;
  name: string;
  title: string;
  location: string;
  image?: string;
  videoIntroUrl?: string;
  skills: Record<string, number>; // skillId -> percentage
  certifications: string[]; // PWR Chain Transaction Hashes
  bio?: string;
  experience?: string; // Text summary
  yearsOfExperience?: number; // Numeric
  preferredWorkMode?: 'Remote' | 'Hybrid' | 'On-site';
  verified?: boolean; // UI helper
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description?: string;
  matchScore?: number;
  matchReason?: string;
}

export interface RecommendedCertification {
  name: string;
  provider: string;
  reason: string;
}

export interface EvaluationResult {
  score: number; // 0-100
  feedback: string;
  passed: boolean;
  cheatingDetected: boolean;
  cheatingReason?: string;
  certificationHash?: string;
}

export interface AssessmentContent {
  title: string;
  description: string;
  difficulty: string;
  starterCode: string;
  theoryQuestions: {
    id: number;
    question: string;
    options: string[];
  }[];
}

export interface CertificateDetails {
  hash: string;
  candidateName: string;
  skill: string;
  level?: DifficultyLevel;
  score: number;
  timestamp: string;
  isValid: boolean;
  issuer: string;
}

export interface InterviewFeedback {
  clarity: number;
  confidence: number;
  relevance: number;
  feedback: string;
  improvedAnswer: string;
}