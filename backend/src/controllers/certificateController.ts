import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../services/supabaseService';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import * as pwrService from '../services/pwrService';

/**
 * Mint a certificate on blockchain
 * POST /api/certificates/mint
 */
export const mintCertificate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { submissionId } = req.body;

        if (!submissionId) {
            throw new ApiError(400, 'Submission ID is required');
        }

        // Get submission details
        const { data: submission, error: submissionError } = await supabase
            .from('assessment_submissions')
            .select(`
        *,
        assessments (
          *,
          skills (*)
        )
      `)
            .eq('id', submissionId)
            .eq('user_id', req.user!.id)
            .single();

        if (submissionError || !submission) {
            throw new ApiError(404, 'Submission not found');
        }

        // Verify submission passed
        if (!submission.passed) {
            throw new ApiError(400, 'Cannot mint certificate for failed assessment');
        }

        // Check if certificate already exists
        const { data: existingCert } = await supabase
            .from('certifications')
            .select('*')
            .eq('submission_id', submissionId)
            .single();

        if (existingCert) {
            return res.json({
                message: 'Certificate already exists',
                certificate: existingCert
            });
        }

        // Get user profile
        const { data: user } = await supabase
            .from('users')
            .select('name')
            .eq('id', req.user!.id)
            .single();

        // Mint certificate on PWRCHAIN
        const blockchainHash = await pwrService.mintCertificate({
            candidateName: user?.name || 'Candidate',
            skill: submission.assessments.skills.name,
            score: submission.score,
            difficulty: submission.assessments.difficulty,
            timestamp: new Date().toISOString()
        });

        // Store certificate in database
        const { data: certificate, error: certError } = await supabase
            .from('certifications')
            .insert({
                user_id: req.user!.id,
                skill_id: submission.assessments.skill_id,
                submission_id: submissionId,
                blockchain_hash: blockchainHash,
                score: submission.score,
                difficulty: submission.assessments.difficulty
            })
            .select()
            .single();

        if (certError || !certificate) {
            throw new ApiError(500, 'Failed to store certificate');
        }

        logger.info('Certificate minted', {
            userId: req.user?.id,
            certificateId: certificate.id,
            blockchainHash
        });

        res.json({
            message: 'Certificate minted successfully',
            certificate: {
                id: certificate.id,
                blockchainHash: certificate.blockchain_hash,
                skill: submission.assessments.skills.name,
                score: certificate.score,
                difficulty: certificate.difficulty,
                issuedAt: certificate.issued_at,
                explorerUrl: pwrService.getExplorerUrl(blockchainHash)
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Verify a certificate
 * GET /api/certificates/verify/:hash
 */
export const verifyCertificate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { hash } = req.params;

        if (!hash) {
            throw new ApiError(400, 'Certificate hash is required');
        }

        // Check database first
        const { data: dbCertificate, error: dbError } = await supabase
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
            return res.json({
                isValid: false,
                message: 'Certificate not found on blockchain'
            });
        }

        // Return combined data
        res.json({
            isValid: true,
            certificate: {
                hash,
                candidateName: dbCertificate?.users.name || blockchainVerification.data?.candidateName,
                skill: dbCertificate?.skills.name || blockchainVerification.data?.skill,
                score: dbCertificate?.score || blockchainVerification.data?.score,
                difficulty: dbCertificate?.difficulty || blockchainVerification.data?.difficulty,
                issuedAt: dbCertificate?.issued_at || blockchainVerification.timestamp,
                issuer: 'Lune Verification Platform',
                explorerUrl: pwrService.getExplorerUrl(hash)
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get certificate details
 * GET /api/certificates/:id
 */
export const getCertificate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

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

        res.json({
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
        next(error);
    }
};

/**
 * Get user's certificates
 * GET /api/certificates
 */
export const getUserCertificates = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { data: certificates, error } = await supabase
            .from('certifications')
            .select(`
        *,
        skills (name, category)
      `)
            .eq('user_id', req.user!.id)
            .order('issued_at', { ascending: false });

        if (error) {
            throw new ApiError(500, 'Failed to fetch certificates');
        }

        res.json({
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
        next(error);
    }
};

export default {
    mintCertificate,
    verifyCertificate,
    getCertificate,
    getUserCertificates
};
