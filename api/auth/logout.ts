import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../lib/cors';
import { supabase } from '../../lib/supabase';
import { handleError, sendSuccess } from '../../lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            await supabase.auth.signOut();
        }

        sendSuccess(res, { message: 'Logout successful' });

    } catch (error) {
        handleError(error, res);
    }
}
