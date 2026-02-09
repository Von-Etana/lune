import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../../lib/cors';
import { authenticate, requireRole } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../../lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await authenticate(req);
        requireRole(user, ['candidate']);

        const { id: submissionId } = req.query;
        const { events } = req.body;

        if (typeof submissionId !== 'string') {
            throw new ApiError(400, 'Invalid submission ID');
        }

        if (!events || !Array.isArray(events)) {
            throw new ApiError(400, 'Events array is required');
        }

        // Verify submission belongs to user
        const { data: submission, error: submissionError } = await supabase
            .from('assessment_submissions')
            .select('*')
            .eq('id', submissionId)
            .eq('user_id', user.id)
            .single();

        if (submissionError || !submission) {
            throw new ApiError(404, 'Submission not found');
        }

        // Store proctoring events
        const proctoringData = events.map((event: any) => ({
            submission_id: submissionId,
            event_type: event.type,
            event_data: event.data,
            timestamp: event.timestamp || new Date().toISOString()
        }));

        const { error: insertError } = await supabase
            .from('proctoring_events')
            .insert(proctoringData);

        if (insertError) {
            throw new ApiError(500, 'Failed to store proctoring events');
        }

        sendSuccess(res, { message: 'Proctoring events recorded' });

    } catch (error) {
        handleError(error, res);
    }
}
