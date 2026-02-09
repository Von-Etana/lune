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
            throw new ApiError(400, 'Invalid user ID');
        }

        const { data: certifications, error } = await supabase
            .from('certifications')
            .select(`
                *,
                skills (name, category)
            `)
            .eq('user_id', id)
            .order('issued_at', { ascending: false });

        if (error) {
            throw new ApiError(500, 'Failed to fetch certifications');
        }

        sendSuccess(res, { certifications });

    } catch (error) {
        handleError(error, res);
    }
}
