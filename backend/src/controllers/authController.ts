import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../services/supabaseService';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Sign up a new user
 * POST /api/auth/signup
 */
export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name, role } = req.body;

        // Validate input
        if (!email || !password || !name || !role) {
            throw new ApiError(400, 'Email, password, name, and role are required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError(400, 'Invalid email format');
        }

        if (!['candidate', 'employer'].includes(role)) {
            throw new ApiError(400, 'Role must be either "candidate" or "employer"');
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto-confirm for development
        });

        if (authError || !authData.user) {
            throw new ApiError(400, authError?.message || 'Failed to create user');
        }

        // Create user profile
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                name,
                role
            });

        if (profileError) {
            // Rollback auth user creation
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw new ApiError(500, 'Failed to create user profile');
        }

        // Create role-specific profile
        if (role === 'candidate') {
            await supabaseAdmin
                .from('candidate_profiles')
                .insert({
                    user_id: authData.user.id,
                    title: 'Software Developer',
                    location: 'Remote'
                });
        } else {
            await supabaseAdmin
                .from('employer_profiles')
                .insert({
                    user_id: authData.user.id,
                    company_name: 'Company Name'
                });
        }

        logger.info('User created successfully', { userId: authData.user.id, role });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: authData.user.id,
                email,
                name,
                role
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Sign in a user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError(400, 'Email and password are required');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error || !data.user) {
            throw new ApiError(401, 'Invalid credentials');
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            throw new ApiError(500, 'Failed to fetch user profile');
        }

        logger.info('User logged in', { userId: data.user.id });

        res.json({
            message: 'Login successful',
            user: profile,
            session: {
                access_token: data.session?.access_token,
                refresh_token: data.session?.refresh_token,
                expires_at: data.session?.expires_at
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Sign out a user
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            await supabase.auth.signOut();
        }

        res.json({ message: 'Logout successful' });

    } catch (error) {
        next(error);
    }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            throw new ApiError(400, 'Refresh token is required');
        }

        const { data, error } = await supabase.auth.refreshSession({
            refresh_token
        });

        if (error || !data.session) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        res.json({
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'No token provided');
        }

        const token = authHeader.substring(7);

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw new ApiError(401, 'Invalid token');
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            throw new ApiError(404, 'User profile not found');
        }

        res.json({ user: profile });

    } catch (error) {
        next(error);
    }
};

export default {
    signup,
    login,
    logout,
    refreshToken,
    getCurrentUser
};
