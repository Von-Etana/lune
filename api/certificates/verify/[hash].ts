import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../../lib/cors';
import { authenticate } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { handleError, sendSuccess, ApiError } from '../../../lib/errors';
import * as pwrService from '../../../lib/pwr';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await authenticate(req);
        const { hash } = req.query;

        if (typeof hash !== 'string' || !hash) {
            throw new ApiError(400, 'Certificate hash is required');
        }

        // Check database first
        const { data: dbCertificate } = await supabase
            .from('certifications')
            .select(`
                *,
                users (name, email),
                skills (name)
            `)
            .eq('blockchain_hash', hash)
            .single();

        // Verify on blockchain
        const blockchainVerification = await pwrService.verifyCertificate(hash);

        if (!blockchainVerification.isValid) {
            return sendSuccess(res, {
                isValid: false,
                message: 'Certificate not found on blockchain'
            });
        }

        // Return combined data
        sendSuccess(res, {
            isValid: true,
            certificate: {
                hash,
                candidateName: dbCertificate?.users?.name || blockchainVerification.data?.candidateName,
                skill: dbCertificate?.skills?.name || blockchainVerification.data?.skill,
                score: dbCertificate?.score || blockchainVerification.data?.score,
                difficulty: dbCertificate?.difficulty || blockchainVerification.data?.difficulty,
                issuedAt: dbCertificate?.issued_at || blockchainVerification.timestamp,
                issuer: 'Lune Verification Platform',
                explorerUrl: pwrService.getExplorerUrl(hash)
            }
        });

    } catch (error) {
        handleError(error, res);
    }
}
