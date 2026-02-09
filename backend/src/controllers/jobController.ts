import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../services/supabaseService';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import * as geminiService from '../services/geminiService';

/**
 * Get all jobs with AI matching for candidates
 * GET /api/jobs
 */
export const getJobs = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new ApiError(500, 'Failed to fetch jobs');
        }

        // If candidate, add AI matching scores
        if (req.user!.role === 'candidate') {
            const { data: profile } = await supabase
                .from('candidate_profiles')
                .select('*')
                .eq('user_id', req.user!.id)
                .single();

            const { data: certifications } = await supabase
                .from('certifications')
                .select('*, skills(name)')
                .eq('user_id', req.user!.id);

            // Get AI recommendations
            const recommendations = await geminiService.getCareerRecommendations(
                certifications?.reduce((acc: any, cert: any) => {
                    acc[cert.skills.name] = cert.score;
                    return acc;
                }, {}) || {}
            );

            res.json({ jobs, recommendations });
        } else {
            res.json({ jobs });
        }

    } catch (error) {
        next(error);
    }
};

/**
 * Create a job posting (employers only)
 * POST /api/jobs
 */
export const createJob = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (req.user!.role !== 'employer') {
            throw new ApiError(403, 'Only employers can create job postings');
        }

        const {
            title,
            company,
            location,
            type,
            salary,
            description,
            required_skills
        } = req.body;

        if (!title || !company || !location || !type || !salary || !description) {
            throw new ApiError(400, 'All job fields are required');
        }

        const { data: job, error } = await supabase
            .from('jobs')
            .insert({
                employer_id: req.user!.id,
                title,
                company,
                location,
                type,
                salary,
                description,
                required_skills: required_skills || []
            })
            .select()
            .single();

        if (error || !job) {
            throw new ApiError(500, 'Failed to create job');
        }

        logger.info('Job created', { jobId: job.id, employerId: req.user!.id });

        res.status(201).json({ job });

    } catch (error) {
        next(error);
    }
};

/**
 * Get matched candidates for a job
 * GET /api/jobs/:id/candidates
 */
export const getMatchedCandidates = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (req.user!.role !== 'employer') {
            throw new ApiError(403, 'Only employers can view matched candidates');
        }

        const { id: jobId } = req.params;

        // Get job details
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            throw new ApiError(404, 'Job not found');
        }

        // Get all candidates with their profiles and certifications
        const { data: candidates, error: candidatesError } = await supabase
            .from('users')
            .select(`
        id,
        name,
        email,
        candidate_profiles (*),
        certifications (*, skills(*))
      `)
            .eq('role', 'candidate');

        if (candidatesError) {
            throw new ApiError(500, 'Failed to fetch candidates');
        }

        // Use AI to match candidates to job
        const matches = await geminiService.matchCandidatesToJob(
            job.description,
            candidates.map((c: any) => ({
                id: c.id,
                name: c.name,
                title: c.candidate_profiles?.title,
                skills: c.certifications?.reduce((acc: any, cert: any) => {
                    acc[cert.skills.name] = cert.score;
                    return acc;
                }, {}),
                years_of_experience: c.candidate_profiles?.years_of_experience,
                certifications: c.certifications || []
            }))
        );

        // Combine candidate data with match scores
        const matchedCandidates = matches.map((match: any) => {
            const candidate = candidates.find((c: any) => c.id === match.candidateId);
            return {
                ...candidate,
                matchScore: match.score,
                matchReason: match.matchReason
            };
        });

        res.json({ candidates: matchedCandidates });

    } catch (error) {
        next(error);
    }
};

export default {
    getJobs,
    createJob,
    getMatchedCandidates
};
