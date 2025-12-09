import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/authRoutes';

// Mock Supabase
jest.mock('../../services/supabaseService', () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { access_token: 'token123', refresh_token: 'refresh123', expires_at: 1234567890 };

    return {
        supabaseAdmin: {
            auth: {
                admin: {
                    createUser: jest.fn().mockResolvedValue({
                        data: { user: mockUser },
                        error: null
                    }),
                    deleteUser: jest.fn().mockResolvedValue({ error: null })
                }
            },
            from: jest.fn().mockReturnValue({
                insert: jest.fn().mockResolvedValue({ error: null }),
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
                    })
                })
            })
        },
        supabase: {
            auth: {
                signInWithPassword: jest.fn().mockResolvedValue({
                    data: { user: mockUser, session: mockSession },
                    error: null
                }),
                signOut: jest.fn().mockResolvedValue({ error: null }),
                refreshSession: jest.fn().mockResolvedValue({
                    data: { session: mockSession },
                    error: null
                }),
                getUser: jest.fn().mockResolvedValue({
                    data: { user: mockUser },
                    error: null
                })
            },
            from: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { ...mockUser, role: 'candidate', name: 'Test User' },
                            error: null
                        })
                    })
                })
            })
        }
    };
});

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API Integration Tests', () => {
    describe('POST /api/auth/signup', () => {
        it('should create a new user account', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'newuser@example.com',
                    password: 'SecurePass123!',
                    name: 'New User',
                    role: 'candidate'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('newuser@example.com');
        });

        it('should reject signup with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'test@example.com'
                    // Missing password, name, role
                });

            expect(response.status).toBe(400);
        });

        it('should reject invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'invalid-email',
                    password: 'SecurePass123!',
                    name: 'Test User',
                    role: 'candidate'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('session');
            expect(response.body.session).toHaveProperty('access_token');
        });

        it('should reject login with missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com'
                    // Missing password
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer token123');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should refresh access token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({
                    refresh_token: 'refresh123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('session');
            expect(response.body.session).toHaveProperty('access_token');
        });

        it('should reject refresh without token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({});

            expect(response.status).toBe(400);
        });
    });
});
