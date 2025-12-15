import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../../lib/cors';
import { authenticate, requireRole } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../../lib/errors';
import * as geminiService from '../../../lib/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await authenticate(req);
        requireRole(user, ['employer']);

        const { id: jobId } = req.query;

        if (typeof jobId !== 'string') {
            throw new ApiError(400, 'Invalid job ID');
        }

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

        sendSuccess(res, { candidates: matchedCandidates });

    } catch (error) {
        handleError(error, res);
    }
}
