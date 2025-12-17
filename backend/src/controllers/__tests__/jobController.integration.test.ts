import request from 'supertest';
import express from 'express';
import jobRoutes from '../../routes/jobRoutes';

// Mock services
jest.mock('../../services/geminiService', () => ({
    getCareerRecommendations: jest.fn().mockResolvedValue([
        { title: 'Frontend Developer', score: 95 }
    ]),
    matchCandidatesToJob: jest.fn().mockResolvedValue([
        { candidateId: 'user-1', score: 90, matchReason: 'Great fit' }
    ])
}));

jest.mock('../../middleware/auth', () => ({
    authenticate: (req: any, res: any, next: any) => {
        // Default mock user
        req.user = { id: 'user-123', email: 'test@example.com', role: 'candidate' };
        // Check for header override for testing different roles
        if (req.headers['x-test-role']) {
            req.user.role = req.headers['x-test-role'];
        }
        next();
    },
    requireRole: (roles: string[]) => (req: any, res: any, next: any) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    }
}));

jest.mock('../../services/supabaseService', () => {
    return {
        supabase: {
            from: jest.fn().mockImplementation((table) => {
                const mockChain = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn(),
                    insert: jest.fn().mockReturnThis(),
                    order: jest.fn().mockReturnThis()
                };

                // Specific responses
                if (table === 'jobs') {
                    // List
                    mockChain.order.mockResolvedValue({
                        data: [{ id: 'job-1', title: 'React Dev' }],
                        error: null
                    });
                    // Single
                    mockChain.single.mockResolvedValue({
                        data: { id: 'job-1', title: 'React Dev', description: 'React job' },
                        error: null
                    });
                }

                if (table === 'users') {
                    mockChain.eq.mockResolvedValue({
                        data: [{ id: 'user-1', name: 'Candidate 1' }],
                        error: null
                    });
                }

                // Mock for candidate_profiles (needed by getJobs for candidates)
                if (table === 'candidate_profiles') {
                    mockChain.single.mockResolvedValue({
                        data: { user_id: 'user-123', title: 'Developer', years_of_experience: 3 },
                        error: null
                    });
                }

                // Mock for certifications (needed by getJobs for candidates)
                if (table === 'certifications') {
                    mockChain.eq.mockResolvedValue({
                        data: [{ id: 'cert-1', skill_id: 'skill-1', score: 85, skills: { name: 'React' } }],
                        error: null
                    });
                }

                return mockChain;
            })
        }
    };
});

const app = express();
app.use(express.json());
app.use('/api/jobs', jobRoutes);

describe('Job API Integration Tests', () => {
    describe('GET /api/jobs', () => {
        it('should return list of jobs', async () => {
            const response = await request(app)
                .get('/api/jobs')
                .set('Authorization', 'Bearer token');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('jobs');
            expect(response.body.jobs[0].title).toBe('React Dev');
        });
    });

    describe('POST /api/jobs', () => {
        it('should allow employer to create job', async () => {
            const response = await request(app)
                .post('/api/jobs')
                .set('Authorization', 'Bearer token')
                .set('x-test-role', 'employer')
                .send({
                    title: 'Node Dev',
                    company: 'Tech Co',
                    location: 'Remote',
                    type: 'Full-time',
                    salary: '100k',
                    description: 'Node.js exp needed'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('job');
        });

        it('should forbid candidate from creating job', async () => {
            const response = await request(app)
                .post('/api/jobs')
                .set('Authorization', 'Bearer token')
                .set('x-test-role', 'candidate')
                .send({
                    title: 'Node Dev'
                });

            expect(response.status).toBe(403);
        });

        it('should validate missing fields', async () => {
            const response = await request(app)
                .post('/api/jobs')
                .set('Authorization', 'Bearer token')
                .set('x-test-role', 'employer')
                .send({
                    title: 'Node Dev'
                    // Missing company, etc
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/jobs/:id/candidates', () => {
        it('should return matched candidates for employer', async () => {
            const response = await request(app)
                .get('/api/jobs/job-1/candidates')
                .set('Authorization', 'Bearer token')
                .set('x-test-role', 'employer');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('candidates');
            expect(response.body.candidates[0]).toHaveProperty('matchScore');
        });

        it('should forbid candidate from viewing matches', async () => {
            const response = await request(app)
                .get('/api/jobs/job-1/candidates')
                .set('Authorization', 'Bearer token')
                .set('x-test-role', 'candidate');

            expect(response.status).toBe(403);
        });
    });
});
