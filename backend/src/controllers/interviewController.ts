import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../services/supabaseService';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import * as geminiService from '../services/geminiService';

/**
 * Start a mock interview
 * POST /api/interviews/start
 */
export const startInterview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { role, topic } = req.body;

        if (!role || !topic) {
            throw new ApiError(400, 'Role and topic are required');
        }

        if (!['behavioral', 'technical'].includes(topic)) {
            throw new ApiError(400, 'Topic must be either "behavioral" or "technical"');
        }

        // Generate interview question using Gemini AI
        const question = await geminiService.generateInterviewQuestion(role, topic);

        logger.info('Mock interview started', {
            userId: req.user!.id,
            role,
            topic
        });

        res.json({
            question,
            role,
            topic
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Submit interview answer and get feedback
 * POST /api/interviews/:id/answer
 */
export const submitAnswer = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { question, answer, role, topic } = req.body;

        if (!question || !answer || !role || !topic) {
            throw new ApiError(400, 'Question, answer, role, and topic are required');
        }

        // Get AI feedback on the answer
        const feedback = await geminiService.evaluateInterviewResponse(question, answer);

        // Store interview session
        const { data: interview, error } = await supabase
            .from('mock_interviews')
            .insert({
                user_id: req.user!.id,
                role,
                topic,
                question,
                answer,
                clarity_score: feedback.clarity,
                confidence_score: feedback.confidence,
                relevance_score: feedback.relevance,
                feedback: feedback.feedback,
                improved_answer: feedback.improvedAnswer
            })
            .select()
            .single();

        if (error || !interview) {
            throw new ApiError(500, 'Failed to save interview session');
        }

        logger.info('Interview answer submitted', {
            userId: req.user!.id,
            interviewId: interview.id
        });

        res.json({
            feedback: {
                clarity: feedback.clarity,
                confidence: feedback.confidence,
                relevance: feedback.relevance,
                feedback: feedback.feedback,
                improvedAnswer: feedback.improvedAnswer
            },
            interviewId: interview.id
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get interview feedback
 * GET /api/interviews/:id/feedback
 */
export const getFeedback = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const { data: interview, error } = await supabase
            .from('mock_interviews')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user!.id)
            .single();

        if (error || !interview) {
            throw new ApiError(404, 'Interview not found');
        }

        res.json({
            interview: {
                id: interview.id,
                role: interview.role,
                topic: interview.topic,
                question: interview.question,
                answer: interview.answer,
                scores: {
                    clarity: interview.clarity_score,
                    confidence: interview.confidence_score,
                    relevance: interview.relevance_score
                },
                feedback: interview.feedback,
                improvedAnswer: interview.improved_answer,
                createdAt: interview.created_at
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get user's interview history
 * GET /api/interviews/history
 */
export const getInterviewHistory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { data: interviews, error } = await supabase
            .from('mock_interviews')
            .select('*')
            .eq('user_id', req.user!.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw new ApiError(500, 'Failed to fetch interview history');
        }

        res.json({ interviews });

    } catch (error) {
        next(error);
    }
};

export default {
    startInterview,
    submitAnswer,
    getFeedback,
    getInterviewHistory
};
