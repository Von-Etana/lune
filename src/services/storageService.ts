import { supabase } from './supabaseClient';

/**
 * Upload video file to Supabase Storage
 * @param file - Video file to upload
 * @param userId - User ID for organizing files
 * @returns Public URL of uploaded video
 */
export const uploadVideo = async (
    file: File,
    userId: string
): Promise<string> => {
    try {
        // Validate file type
        if (!file.type.startsWith('video/')) {
            throw new Error('File must be a video');
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('Video file must be less than 50MB');
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('video-introductions')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('video-introductions')
            .getPublicUrl(data.path);

        return publicUrl;
    } catch (error: any) {
        console.error('Error uploading video:', error);
        throw new Error(error.message || 'Failed to upload video');
    }
};

/**
 * Delete video from Supabase Storage
 * @param videoUrl - URL of video to delete
 * @param userId - User ID for verification
 */
export const deleteVideo = async (
    videoUrl: string,
    userId: string
): Promise<void> => {
    try {
        // Extract path from URL
        const urlParts = videoUrl.split('/');
        const path = urlParts.slice(-2).join('/'); // userId/filename.ext

        // Verify the path belongs to the user
        if (!path.startsWith(userId)) {
            throw new Error('Unauthorized to delete this video');
        }

        const { error } = await supabase.storage
            .from('video-introductions')
            .remove([path]);

        if (error) {
            throw error;
        }
    } catch (error: any) {
        console.error('Error deleting video:', error);
        throw new Error(error.message || 'Failed to delete video');
    }
};

/**
 * Upload certificate image/PDF to Supabase Storage
 * @param certificateData - Certificate data as blob
 * @param certificateId - Certificate ID
 * @returns Public URL of uploaded certificate
 */
export const uploadCertificate = async (
    certificateData: Blob,
    certificateId: string
): Promise<string> => {
    try {
        const fileName = `${certificateId}.png`;

        const { data, error } = await supabase.storage
            .from('certificates')
            .upload(fileName, certificateData, {
                cacheControl: '31536000', // 1 year
                upsert: true
            });

        if (error) {
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('certificates')
            .getPublicUrl(data.path);

        return publicUrl;
    } catch (error: any) {
        console.error('Error uploading certificate:', error);
        throw new Error(error.message || 'Failed to upload certificate');
    }
};

export default {
    uploadVideo,
    deleteVideo,
    uploadCertificate
};
