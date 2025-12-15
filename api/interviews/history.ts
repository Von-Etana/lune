import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../lib/cors';
import { authenticate, requireRole } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await authenticate(req);
        requireRole(user, ['candidate']);

        const { data: interviews, error } = await supabase
            .from('mock_interviews')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw new ApiError(500, 'Failed to fetch interview history');
        }

        sendSuccess(res, { interviews });

    } catch (error) {
        handleError(error, res);
    }
}
