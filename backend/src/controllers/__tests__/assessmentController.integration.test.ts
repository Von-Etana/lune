import request from 'supertest';
import express from 'express';
import assessmentRoutes from '../../routes/assessmentRoutes';

// Mock services
jest.mock('../../services/geminiService', () => ({
    generateAssessment: jest.fn().mockResolvedValue({
        id: 'assessment-123',
        title: 'React Assessment',
        description: 'Test your React skills',
        starterCode: 'function App() { return <div>Hello</div>; }',
        theoryQuestions: [
            {
                question: 'What is JSX?',
                options: ['JavaScript XML', 'Java Syntax', 'JSON Extension', 'None'],
                correctAnswer: 0
            }
        ]
    }),
    evaluateAssessment: jest.fn().mockResolvedValue({
        score: 85,
        passed: true,
        feedback: 'Great work!',
        cheatingDetected: false
    })
}));

jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        req.user = { id: 'user-123', email: 'test@example.com' };
        next();
    }
}));

const app = express();
app.use(express.json());
app.use('/api/assessments', assessmentRoutes);

describe('Assessment API Integration Tests', () => {
    describe('POST /api/assessments/generate', () => {
        it('should generate a new assessment', async () => {
            const response = await request(app)
                .post('/api/assessments/generate')
                .set('Authorization', 'Bearer token123')
                .send({
                    skillName: 'React',
                    difficulty: 'Mid-Level'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('assessment');
            expect(response.body.assessment).toHaveProperty('id');
            expect(response.body.assessment).toHaveProperty('title');
            expect(response.body.assessment).toHaveProperty('starterCode');
            expect(response.body.assessment).toHaveProperty('theoryQuestions');
        });

        it('should reject invalid difficulty level', async () => {
            const response = await request(app)
                .post('/api/assessments/generate')
                .set('Authorization', 'Bearer token123')
                .send({
                    skillName: 'React',
                    difficulty: 'Invalid'
                });

            expect(response.status).toBe(400);
        });

        it('should reject missing skill name', async () => {
            const response = await request(app)
                .post('/api/assessments/generate')
                .set('Authorization', 'Bearer token123')
                .send({
                    difficulty: 'Mid-Level'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/assessments/submit', () => {
        it('should submit and evaluate an assessment', async () => {
            const response = await request(app)
                .post('/api/assessments/submit')
                .set('Authorization', 'Bearer token123')
                .send({
                    assessmentId: 'assessment-123',
                    codeSubmission: 'function App() { return <div>Hello World</div>; }',
                    theoryAnswers: { 0: 0 },
                    proctoringMetrics: {
                        tabSwitches: 0,
                        copyPasteEvents: 0
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('result');
            expect(response.body.result).toHaveProperty('score');
            expect(response.body.result).toHaveProperty('passed');
            expect(response.body.result).toHaveProperty('feedback');
        });

        it('should reject submission without assessment ID', async () => {
            const response = await request(app)
                .post('/api/assessments/submit')
                .set('Authorization', 'Bearer token123')
                .send({
                    codeSubmission: 'code here',
                    theoryAnswers: {}
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/assessments/history', () => {
        it('should get user assessment history', async () => {
            const response = await request(app)
                .get('/api/assessments/history')
                .set('Authorization', 'Bearer token123');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('assessments');
            expect(Array.isArray(response.body.assessments)).toBe(true);
        });
    });
});
