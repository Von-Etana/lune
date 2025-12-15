import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../lib/cors';
import { supabase } from '../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../lib/errors';
import { getAuthToken } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const token = getAuthToken(req);

        if (!token) {
            throw new ApiError(401, 'No token provided');
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw new ApiError(401, 'Invalid token');
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            throw new ApiError(404, 'User profile not found');
        }

        sendSuccess(res, { user: profile });

    } catch (error) {
        handleError(error, res);
    }
}
