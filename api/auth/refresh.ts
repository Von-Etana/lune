import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../lib/cors';
import { supabase } from '../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            throw new ApiError(400, 'Refresh token is required');
        }

        const { data, error } = await supabase.auth.refreshSession({
            refresh_token
        });

        if (error || !data.session) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        sendSuccess(res, {
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at
            }
        });

    } catch (error) {
        handleError(error, res);
    }
}
