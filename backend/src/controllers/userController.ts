import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase, supabaseAdmin } from '../services/supabaseService';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Get user profile
 * GET /api/users/:id
 */
export const getUserProfile = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (userError || !user) {
            throw new ApiError(404, 'User not found');
        }

        // Get role-specific profile
        let profile = null;
        if (user.role === 'candidate') {
            const { data: candidateProfile } = await supabase
                .from('candidate_profiles')
                .select('*')
                .eq('user_id', id)
                .single();
            profile = candidateProfile;

            // Get skills and certifications
            const { data: certifications } = await supabase
                .from('certifications')
                .select('*, skills(name)')
                .eq('user_id', id);

            profile.certifications = certifications || [];
        } else {
            const { data: employerProfile } = await supabase
                .from('employer_profiles')
                .select('*')
                .eq('user_id', id)
                .single();
            profile = employerProfile;
        }

        res.json({
            user: {
                ...user,
                profile
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * PUT /api/users/:id
 */
export const updateUserProfile = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        // Verify user can only update their own profile
        if (req.user!.id !== id) {
            throw new ApiError(403, 'Cannot update another user\'s profile');
        }

        const updates = req.body;

        // Update base user info
        if (updates.name) {
            await supabase
                .from('users')
                .update({ name: updates.name })
                .eq('id', id);
        }

        // Update role-specific profile
        if (req.user!.role === 'candidate') {
            const candidateUpdates: any = {};
            if (updates.title) candidateUpdates.title = updates.title;
            if (updates.location) candidateUpdates.location = updates.location;
            if (updates.bio) candidateUpdates.bio = updates.bio;
            if (updates.experience) candidateUpdates.experience = updates.experience;
            if (updates.years_of_experience) candidateUpdates.years_of_experience = updates.years_of_experience;
            if (updates.preferred_work_mode) candidateUpdates.preferred_work_mode = updates.preferred_work_mode;

            if (Object.keys(candidateUpdates).length > 0) {
                await supabase
                    .from('candidate_profiles')
                    .update(candidateUpdates)
                    .eq('user_id', id);
            }
        } else {
            const employerUpdates: any = {};
            if (updates.company_name) employerUpdates.company_name = updates.company_name;
            if (updates.company_website) employerUpdates.company_website = updates.company_website;
            if (updates.company_size) employerUpdates.company_size = updates.company_size;
            if (updates.industry) employerUpdates.industry = updates.industry;

            if (Object.keys(employerUpdates).length > 0) {
                await supabase
                    .from('employer_profiles')
                    .update(employerUpdates)
                    .eq('user_id', id);
            }
        }

        logger.info('User profile updated', { userId: id });

        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        next(error);
    }
};

/**
 * Upload video introduction
 * POST /api/users/:id/video
 */
export const uploadVideoIntro = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        if (req.user!.id !== id) {
            throw new ApiError(403, 'Cannot upload video for another user');
        }

        if (req.user!.role !== 'candidate') {
            throw new ApiError(400, 'Only candidates can upload video introductions');
        }

        const { videoUrl } = req.body;

        if (!videoUrl) {
            throw new ApiError(400, 'Video URL is required');
        }

        // Update candidate profile with video URL
        await supabase
            .from('candidate_profiles')
            .update({ video_intro_url: videoUrl })
            .eq('user_id', id);

        logger.info('Video introduction uploaded', { userId: id });

        res.json({ message: 'Video uploaded successfully', videoUrl });

    } catch (error) {
        next(error);
    }
};

/**
 * Get user's certifications
 * GET /api/users/:id/certifications
 */
export const getUserCertifications = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const { data: certifications, error } = await supabase
            .from('certifications')
            .select(`
        *,
        skills (name, category)
      `)
            .eq('user_id', id)
            .order('issued_at', { ascending: false });

        if (error) {
            throw new ApiError(500, 'Failed to fetch certifications');
        }

        res.json({ certifications });

    } catch (error) {
        next(error);
    }
};

export default {
    getUserProfile,
    updateUserProfile,
    uploadVideoIntro,
    getUserCertifications
};
