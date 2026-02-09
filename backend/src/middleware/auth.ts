import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabaseService';
import { ApiError } from './errorHandler';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'candidate' | 'employer';
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'No token provided');
        }

        const token = authHeader.substring(7);

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

        req.user = profile;
        next();
    } catch (error) {
        next(error);
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new ApiError(401, 'Authentication required'));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, 'Insufficient permissions'));
        }

        next();
    };
};
