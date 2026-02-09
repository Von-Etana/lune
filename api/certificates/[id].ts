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
        await authenticate(req);
        const { id } = req.query;

        if (typeof id !== 'string') {
            throw new ApiError(400, 'Invalid certificate ID');
        }

        const { data: certificate, error } = await supabase
            .from('certifications')
            .select(`
                *,
                users (name, email),
                skills (name),
                assessment_submissions (score, feedback)
            `)
            .eq('id', id)
            .single();

        if (error || !certificate) {
            throw new ApiError(404, 'Certificate not found');
        }

        sendSuccess(res, {
            certificate: {
                id: certificate.id,
                blockchainHash: certificate.blockchain_hash,
                candidateName: certificate.users.name,
                skill: certificate.skills.name,
                score: certificate.score,
                difficulty: certificate.difficulty,
                issuedAt: certificate.issued_at,
                explorerUrl: pwrService.getExplorerUrl(certificate.blockchain_hash)
            }
        });

    } catch (error) {
        handleError(error, res);
    }
}
