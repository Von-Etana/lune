import type { VercelRequest } from '@vercel/node';
import { supabase } from './supabase';
import { ApiError } from './errors';

export interface AuthUser {
    id: string;
    email: string;
    role: 'candidate' | 'employer';
}

/**
 * Extract and validate auth token from request
 */
export const getAuthToken = (req: VercelRequest): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
};

/**
 * Authenticate user from request
 */
export const authenticate = async (req: VercelRequest): Promise<AuthUser> => {
    const token = getAuthToken(req);

    if (!token) {
        throw new ApiError(401, 'No token provided');
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        throw new ApiError(401, 'Invalid or expired token');
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        throw new ApiError(401, 'User profile not found');
    }

    return profile as AuthUser;
};

/**
 * Check if user has required role
 */
export const requireRole = (user: AuthUser, roles: string[]): void => {
    if (!roles.includes(user.role)) {
        throw new ApiError(403, 'Insufficient permissions');
    }
};

/**
 * Optional authentication - returns null if no valid token
 */
export const optionalAuth = async (req: VercelRequest): Promise<AuthUser | null> => {
    try {
        return await authenticate(req);
    } catch {
        return null;
    }
};
