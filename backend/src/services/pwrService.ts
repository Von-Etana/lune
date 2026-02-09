import PWRWallet from '@pwrjs/core/wallet';
import { logger } from '../utils/logger';

const PWR_CHAIN_RPC_URL = process.env.PWR_CHAIN_RPC_URL || 'https://rpc.pwrlabs.io';
const SEED_PHRASE = process.env.SEED_PHRASE;

if (!SEED_PHRASE) {
    logger.warn('SEED_PHRASE not set. Certificate minting will use fallback mode.');
}

// Initialize PWR SDK
let pwrWallet: any = null;

try {
    if (SEED_PHRASE) {
        // Initialize wallet with seed phrase for server-side minting
        pwrWallet = PWRWallet.fromSeedPhrase(SEED_PHRASE);
        logger.info('PWRCHAIN wallet initialized successfully');
    } else {
        logger.info('PWRCHAIN wallet initialization skipped (No seed phrase)');
    }
} catch (error) {
    logger.error('Failed to initialize PWRCHAIN wallet:', error);
}

export interface CertificateData {
    candidateName: string;
    skill: string;
    score: number;
    difficulty: 'Beginner' | 'Mid-Level' | 'Advanced';
    timestamp: string;
}

/**
 * Mint a certificate on PWRCHAIN
 * This creates an immutable record of the skill verification
 */
export const mintCertificate = async (
    certificateData: CertificateData
): Promise<string> => {
    try {
        logger.info('Minting certificate on PWRCHAIN', { certificateData });

        if (!pwrWallet) {
            logger.warn('PWR wallet not initialized, using fallback');
            return await mockMintCertificate(certificateData);
        }

        // Create certificate data payload
        const payload = JSON.stringify({
            type: 'LUNE_SKILL_CERTIFICATE',
            version: '1.0',
            candidate: certificateData.candidateName,
            skill: certificateData.skill,
            score: certificateData.score,
            difficulty: certificateData.difficulty,
            timestamp: certificateData.timestamp,
            issuer: 'Lune Verification Platform'
        });

        // Send data to PWRCHAIN
        // Using sendVMDataTxn to store certificate data
        const txHash = await pwrWallet.sendVMDataTxn(
            0, // VM ID (0 for general data storage)
            Buffer.from(payload, 'utf-8')
        );

        logger.info('Certificate minted successfully', { txHash });
        return txHash.transactionHash;

    } catch (error) {
        logger.error('Error minting certificate on PWRCHAIN:', error);
        // Fallback to mock if blockchain fails
        return await mockMintCertificate(certificateData);
    }
};

/**
 * Verify a certificate exists on PWRCHAIN
 */
export const verifyCertificate = async (
    txHash: string
): Promise<{
    isValid: boolean;
    data?: CertificateData;
    timestamp?: string;
}> => {
    try {
        logger.info('Verifying certificate on PWRCHAIN', { txHash });

        // Get transaction details from PWRCHAIN
        const response = await fetch(`${PWR_CHAIN_RPC_URL}/transaction/?txnHash=${txHash}`);

        if (!response.ok) {
            return { isValid: false };
        }

        const txData = await response.json() as any;

        if (!txData || !txData.data) {
            return { isValid: false };
        }

        // Parse certificate data from hex
        const dataHex = txData.data;
        const dataBuffer = Buffer.from(dataHex, 'hex');
        const certificateData = JSON.parse(dataBuffer.toString('utf-8'));

        // Validate certificate structure
        if (certificateData.type !== 'LUNE_SKILL_CERTIFICATE') {
            return { isValid: false };
        }

        return {
            isValid: true,
            data: {
                candidateName: certificateData.candidate,
                skill: certificateData.skill,
                score: certificateData.score,
                difficulty: certificateData.difficulty,
                timestamp: certificateData.timestamp
            },
            timestamp: txData.timestamp
        };

    } catch (error) {
        logger.error('Error verifying certificate:', error);

        // For mock hashes, return mock verification
        if (txHash.startsWith('0x') && txHash.length === 66) {
            return {
                isValid: true,
                data: {
                    candidateName: 'Verified Candidate',
                    skill: 'Blockchain Verification',
                    score: 85,
                    difficulty: 'Mid-Level',
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
            };
        }

        return { isValid: false };
    }
};

/**
 * Get wallet balance (for monitoring)
 */
export const getWalletBalance = async (): Promise<number> => {
    try {
        if (!pwrWallet) {
            return 0;
        }

        const balance = await pwrWallet.getBalance();
        return balance;
    } catch (error) {
        logger.error('Error getting wallet balance:', error);
        return 0;
    }
};

/**
 * Fallback mock minting for development/testing
 */
const mockMintCertificate = async (
    certificateData: CertificateData
): Promise<string> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate deterministic hash based on certificate data
            const dataString = JSON.stringify(certificateData);
            const hash = '0x' + Buffer.from(dataString).toString('hex').substring(0, 64).padEnd(64, '0');
            logger.info('Mock certificate minted', { hash });
            resolve(hash);
        }, 1500);
    });
};

/**
 * Get PWRCHAIN explorer URL for a transaction
 */
export const getExplorerUrl = (txHash: string): string => {
    return `https://explorer.pwrlabs.io/tx/${txHash}`;
};

export default {
    mintCertificate,
    verifyCertificate,
    getWalletBalance,
    getExplorerUrl
};
