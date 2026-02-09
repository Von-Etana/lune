import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../lib/cors';
import { authenticate } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../lib/errors';
import * as pwrService from '../../lib/pwr';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await authenticate(req);

        const { data: certificates, error } = await supabase
            .from('certifications')
            .select(`
                *,
                skills (name, category)
            `)
            .eq('user_id', user.id)
            .order('issued_at', { ascending: false });

        if (error) {
            throw new ApiError(500, 'Failed to fetch certificates');
        }

        sendSuccess(res, {
            certificates: certificates.map(cert => ({
                id: cert.id,
                blockchainHash: cert.blockchain_hash,
                skill: cert.skills.name,
                category: cert.skills.category,
                score: cert.score,
                difficulty: cert.difficulty,
                issuedAt: cert.issued_at,
                explorerUrl: pwrService.getExplorerUrl(cert.blockchain_hash)
            }))
        });

    } catch (error) {
        handleError(error, res);
    }
}
