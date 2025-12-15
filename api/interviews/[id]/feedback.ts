import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../../lib/cors';
import { authenticate, requireRole } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../../lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await authenticate(req);
        requireRole(user, ['candidate']);

        const { id } = req.query;

        if (typeof id !== 'string') {
            throw new ApiError(400, 'Invalid interview ID');
        }

        const { data: interview, error } = await supabase
            .from('mock_interviews')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !interview) {
            throw new ApiError(404, 'Interview not found');
        }

        sendSuccess(res, {
            interview: {
                id: interview.id,
                role: interview.role,
                topic: interview.topic,
                question: interview.question,
                answer: interview.answer,
                scores: {
                    clarity: interview.clarity_score,
                    confidence: interview.confidence_score,
                    relevance: interview.relevance_score
                },
                feedback: interview.feedback,
                improvedAnswer: interview.improved_answer,
                createdAt: interview.created_at
            }
        });

    } catch (error) {
        handleError(error, res);
    }
}
