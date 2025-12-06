import { mintCertificate, verifyCertificate, getWalletBalance } from '../pwrService';

// Mock PWRJS
// Mock PWRJS Wallet
jest.mock('@pwrjs/core/wallet', () => {
    return {
        __esModule: true,
        default: {
            fromSeedPhrase: jest.fn().mockReturnValue({
                sendVMDataTxn: jest.fn().mockResolvedValue({ transactionHash: '0x123abc456def' }),
                getBalance: jest.fn().mockResolvedValue(100)
            })
        }
    };
});

// Mock fetch for verifyCertificate
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            data: Buffer.from(JSON.stringify({
                type: 'LUNE_SKILL_CERTIFICATE',
                version: '1.0',
                candidate: 'Test User',
                skill: 'React',
                score: 85,
                difficulty: 'Mid-Level',
                timestamp: '2024-01-01T00:00:00Z',
                issuer: 'Lune Verification Platform'
            })).toString('hex'),
            timestamp: '2024-01-01T00:00:00Z'
        }),
    })
) as jest.Mock;

describe('PWRCHAIN Service', () => {
    describe('mintCertificate', () => {
        it('should mint a certificate and return transaction hash', async () => {
            const certificateData = {
                candidateName: 'John Doe',
                skill: 'React',
                score: 90,
                difficulty: 'Advanced' as const,
                timestamp: new Date().toISOString()
            };

            const txHash = await mintCertificate(certificateData);

            expect(txHash).toBeDefined();
            expect(typeof txHash).toBe('string');
            expect(txHash.length).toBeGreaterThan(0);
        });

        it('should handle minting errors gracefully', async () => {
            const invalidData = {
                candidateName: '',
                skill: '',
                score: -1,
                difficulty: 'Invalid' as any,
                timestamp: ''
            };

            // Should still return a hash (fallback to mock)
            const txHash = await mintCertificate(invalidData);
            expect(txHash).toBeDefined();
        });
    });

    describe('verifyCertificate', () => {
        it('should verify a valid certificate', async () => {
            const txHash = '0x123abc456def';
            const result = await verifyCertificate(txHash);

            expect(result.isValid).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.skill).toBe('React');
            expect(result.data?.score).toBe(85);
        });

        it('should return invalid for non-existent certificate', async () => {
            (global.fetch as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    ok: false
                })
            );
            const invalidHash = 'invalid-hash';
            const result = await verifyCertificate(invalidHash);

            expect(result.isValid).toBe(false);
        });
    });

    describe('getWalletBalance', () => {
        it('should return wallet balance', async () => {
            const balance = await getWalletBalance();

            expect(typeof balance).toBe('number');
            expect(balance).toBeGreaterThanOrEqual(0);
        });
    });
});
