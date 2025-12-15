import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../../lib/cors';
import { authenticate } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../../lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await authenticate(req);
        const { id } = req.query;

        if (typeof id !== 'string') {
            throw new ApiError(400, 'Invalid assessment ID');
        }

        const { data: assessment, error } = await supabase
            .from('assessments')
            .select('*, skills(*)')
            .eq('id', id)
            .single();

        if (error || !assessment) {
            throw new ApiError(404, 'Assessment not found');
        }

        // Remove correct answers from theory questions
        const sanitizedQuestions = assessment.theory_questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: q.options
        }));

        sendSuccess(res, {
            assessment: {
                id: assessment.id,
                skill: assessment.skills.name,
                difficulty: assessment.difficulty,
                title: assessment.title,
                description: assessment.description,
                starterCode: assessment.starter_code,
                theoryQuestions: sanitizedQuestions
            }
        });

    } catch (error) {
        handleError(error, res);
    }
}
