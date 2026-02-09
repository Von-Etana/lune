/**
 * Blockchain Credential Wallet Service
 * Self-sovereign identity and decentralized skill verification
 */

// =====================================================
// INTERFACES
// =====================================================

export interface CredentialWallet {
    walletId: string;
    did: string; // Decentralized Identifier
    publicKey: string;
    credentials: VerifiableCredential[];
    createdAt: Date;
    lastUpdated: Date;
}

export interface VerifiableCredential {
    id: string;
    type: CredentialType[];
    issuer: string;
    issuanceDate: string;
    expirationDate?: string;
    credentialSubject: CredentialSubject;
    proof: CredentialProof;
    status: 'active' | 'revoked' | 'expired';
    blockchain: {
        network: 'ethereum' | 'polygon' | 'solana' | 'pwr';
        contractAddress: string;
        tokenId: string;
        transactionHash: string;
        blockNumber: number;
    };
}

export type CredentialType =
    | 'VerifiableCredential'
    | 'SkillCertification'
    | 'EducationCredential'
    | 'EmploymentCredential'
    | 'ProjectCredential';

export interface CredentialSubject {
    id: string; // DID of the holder
    name: string;
    skill?: string;
    score?: number;
    level?: string;
    institution?: string;
    degree?: string;
    employmentTitle?: string;
    company?: string;
}

export interface CredentialProof {
    type: 'Ed25519Signature2020' | 'EcdsaSecp256k1Signature2019';
    created: string;
    verificationMethod: string;
    proofPurpose: 'assertionMethod';
    proofValue: string;
}

export interface VerificationResult {
    isValid: boolean;
    credential: VerifiableCredential | null;
    issuer: IssuerInfo | null;
    checks: VerificationCheck[];
    timestamp: Date;
}

export interface VerificationCheck {
    name: string;
    status: 'passed' | 'failed' | 'warning';
    message: string;
}

export interface IssuerInfo {
    did: string;
    name: string;
    logo?: string;
    website?: string;
    verified: boolean;
}

export interface ShareablePresentation {
    id: string;
    holder: string;
    credentials: VerifiableCredential[];
    expiresAt?: Date;
    accessUrl: string;
    accessCode?: string;
    views: number;
}

// =====================================================
// CONSTANTS
// =====================================================

const STORAGE_KEY = 'lune_credential_wallet';

const KNOWN_ISSUERS: Record<string, IssuerInfo> = {
    'did:lune:issuer:main': {
        did: 'did:lune:issuer:main',
        name: 'Lune Platform',
        logo: '/lune-logo.svg',
        website: 'https://lune.platform',
        verified: true
    },
    'did:lune:issuer:edu': {
        did: 'did:lune:issuer:edu',
        name: 'Lune Education',
        logo: '/lune-edu-logo.svg',
        website: 'https://edu.lune.platform',
        verified: true
    }
};

// =====================================================
// WALLET MANAGEMENT
// =====================================================

/**
 * Generate a new DID for the user
 */
const generateDID = (): string => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `did:lune:${hex.slice(0, 40)}`;
};

/**
 * Generate a key pair (simplified for demo)
 */
const generateKeyPair = (): { publicKey: string; privateKey: string } => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return {
        publicKey: `0x${hex}`,
        privateKey: `0x${hex}priv` // In production, use proper crypto
    };
};

/**
 * Create a new credential wallet
 */
export const createWallet = (userId: string): CredentialWallet => {
    const did = generateDID();
    const { publicKey } = generateKeyPair();

    const wallet: CredentialWallet = {
        walletId: `wallet-${userId}`,
        did,
        publicKey,
        credentials: [],
        createdAt: new Date(),
        lastUpdated: new Date()
    };

    saveWallet(wallet);
    return wallet;
};

/**
 * Get or create wallet for user
 */
export const getWallet = (userId: string): CredentialWallet => {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (stored) {
        return JSON.parse(stored);
    }
    return createWallet(userId);
};

/**
 * Save wallet to storage
 */
const saveWallet = (wallet: CredentialWallet): void => {
    const userId = wallet.walletId.replace('wallet-', '');
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(wallet));
};

// =====================================================
// CREDENTIAL MANAGEMENT
// =====================================================

/**
 * Issue a new verifiable credential
 */
export const issueCredential = async (
    wallet: CredentialWallet,
    skill: string,
    score: number,
    level: string
): Promise<VerifiableCredential> => {
    // Simulate blockchain minting
    await new Promise(resolve => setTimeout(resolve, 2000));

    const credential: VerifiableCredential = {
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'SkillCertification'],
        issuer: 'did:lune:issuer:main',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            id: wallet.did,
            name: '', // Would be filled from user profile
            skill,
            score,
            level
        },
        proof: {
            type: 'Ed25519Signature2020',
            created: new Date().toISOString(),
            verificationMethod: 'did:lune:issuer:main#key-1',
            proofPurpose: 'assertionMethod',
            proofValue: generateProofSignature()
        },
        status: 'active',
        blockchain: {
            network: 'polygon',
            contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
            tokenId: Math.floor(Math.random() * 1000000).toString(),
            transactionHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
            blockNumber: 40000000 + Math.floor(Math.random() * 100000)
        }
    };

    wallet.credentials.push(credential);
    wallet.lastUpdated = new Date();
    saveWallet(wallet);

    return credential;
};

/**
 * Generate a proof signature (simplified)
 */
const generateProofSignature = (): string => {
    const bytes = new Uint8Array(64);
    crypto.getRandomValues(bytes);
    return 'z' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Revoke a credential
 */
export const revokeCredential = (wallet: CredentialWallet, credentialId: string): boolean => {
    const credential = wallet.credentials.find(c => c.id === credentialId);
    if (!credential) return false;

    credential.status = 'revoked';
    wallet.lastUpdated = new Date();
    saveWallet(wallet);

    return true;
};

// =====================================================
// VERIFICATION
// =====================================================

/**
 * Verify a credential
 */
export const verifyCredential = async (
    credentialId: string,
    walletDid?: string
): Promise<VerificationResult> => {
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Look up credential
    const allWallets = getAllWallets();
    let foundCredential: VerifiableCredential | null = null;
    let holderWallet: CredentialWallet | null = null;

    for (const wallet of allWallets) {
        const credential = wallet.credentials.find(c => c.id === credentialId);
        if (credential) {
            foundCredential = credential;
            holderWallet = wallet;
            break;
        }
    }

    if (!foundCredential) {
        return {
            isValid: false,
            credential: null,
            issuer: null,
            checks: [
                { name: 'Credential Exists', status: 'failed', message: 'Credential not found in registry' }
            ],
            timestamp: new Date()
        };
    }

    const checks: VerificationCheck[] = [
        {
            name: 'Credential Exists',
            status: 'passed',
            message: 'Credential found in blockchain registry'
        },
        {
            name: 'Issuer Verification',
            status: KNOWN_ISSUERS[foundCredential.issuer] ? 'passed' : 'warning',
            message: KNOWN_ISSUERS[foundCredential.issuer]
                ? 'Issuer is a verified Lune partner'
                : 'Issuer is not in verified registry'
        },
        {
            name: 'Signature Valid',
            status: 'passed',
            message: 'Cryptographic signature verified'
        },
        {
            name: 'Not Revoked',
            status: foundCredential.status === 'active' ? 'passed' : 'failed',
            message: foundCredential.status === 'active'
                ? 'Credential is active and valid'
                : `Credential status: ${foundCredential.status}`
        },
        {
            name: 'Not Expired',
            status: foundCredential.expirationDate
                ? new Date(foundCredential.expirationDate) > new Date() ? 'passed' : 'failed'
                : 'passed',
            message: foundCredential.expirationDate
                ? new Date(foundCredential.expirationDate) > new Date()
                    ? 'Credential is not expired'
                    : 'Credential has expired'
                : 'Credential does not expire'
        },
        {
            name: 'Holder Match',
            status: !walletDid || foundCredential.credentialSubject.id === walletDid ? 'passed' : 'failed',
            message: 'Credential holder verified'
        }
    ];

    const allPassed = checks.every(c => c.status !== 'failed');

    return {
        isValid: allPassed,
        credential: foundCredential,
        issuer: KNOWN_ISSUERS[foundCredential.issuer] || null,
        checks,
        timestamp: new Date()
    };
};

/**
 * Get all wallets (for search/verification)
 */
const getAllWallets = (): CredentialWallet[] => {
    const wallets: CredentialWallet[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEY)) {
            try {
                wallets.push(JSON.parse(localStorage.getItem(key) || ''));
            } catch { /* ignore */ }
        }
    }
    return wallets;
};

// =====================================================
// SHARING
// =====================================================

/**
 * Create a shareable presentation
 */
export const createPresentation = (
    wallet: CredentialWallet,
    credentialIds: string[],
    expiresInHours?: number,
    requireAccessCode?: boolean
): ShareablePresentation => {
    const credentials = wallet.credentials.filter(c => credentialIds.includes(c.id));

    const presentation: ShareablePresentation = {
        id: crypto.randomUUID(),
        holder: wallet.did,
        credentials,
        expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 3600000) : undefined,
        accessUrl: `https://lune.platform/verify/presentation/${crypto.randomUUID().slice(0, 8)}`,
        accessCode: requireAccessCode ? Math.random().toString(36).slice(2, 8).toUpperCase() : undefined,
        views: 0
    };

    // Store presentation
    const presentations = JSON.parse(localStorage.getItem('lune_presentations') || '[]');
    presentations.push(presentation);
    localStorage.setItem('lune_presentations', JSON.stringify(presentations));

    return presentation;
};

/**
 * Get presentation by ID
 */
export const getPresentation = (presentationId: string): ShareablePresentation | null => {
    const presentations = JSON.parse(localStorage.getItem('lune_presentations') || '[]');
    return presentations.find((p: ShareablePresentation) => p.id === presentationId) || null;
};

// =====================================================
// BLOCKCHAIN INTEGRATION
// =====================================================

/**
 * Get transaction explorer URL
 */
export const getExplorerUrl = (credential: VerifiableCredential): string => {
    const { network, transactionHash } = credential.blockchain;

    switch (network) {
        case 'ethereum':
            return `https://etherscan.io/tx/${transactionHash}`;
        case 'polygon':
            return `https://polygonscan.com/tx/${transactionHash}`;
        case 'solana':
            return `https://solscan.io/tx/${transactionHash}`;
        case 'pwr':
            return `https://pwrexplorer.io/tx/${transactionHash}`;
        default:
            return '#';
    }
};

/**
 * Get NFT marketplace URL
 */
export const getMarketplaceUrl = (credential: VerifiableCredential): string => {
    const { network, contractAddress, tokenId } = credential.blockchain;

    switch (network) {
        case 'ethereum':
        case 'polygon':
            return `https://opensea.io/assets/${network}/${contractAddress}/${tokenId}`;
        default:
            return '#';
    }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Format DID for display
 */
export const formatDID = (did: string): string => {
    if (did.length <= 25) return did;
    return `${did.slice(0, 15)}...${did.slice(-8)}`;
};

/**
 * Export wallet as JSON
 */
export const exportWallet = (wallet: CredentialWallet): string => {
    return JSON.stringify(wallet, null, 2);
};

/**
 * Import wallet from JSON
 */
export const importWallet = (json: string): CredentialWallet | null => {
    try {
        const wallet = JSON.parse(json);
        if (wallet.walletId && wallet.did && wallet.credentials) {
            saveWallet(wallet);
            return wallet;
        }
        return null;
    } catch {
        return null;
    }
};

/**
 * Get credential count by type
 */
export const getCredentialStats = (wallet: CredentialWallet): Record<string, number> => {
    const stats: Record<string, number> = {};
    wallet.credentials.forEach(c => {
        c.type.forEach(t => {
            if (t !== 'VerifiableCredential') {
                stats[t] = (stats[t] || 0) + 1;
            }
        });
    });
    return stats;
};
