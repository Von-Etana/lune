import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../services/supabaseService';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import * as geminiService from '../services/geminiService';
import * as pwrService from '../services/pwrService';

/**
 * Generate a new assessment
 * POST /api/assessments/generate
 */
export const generateAssessment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { skillName, difficulty } = req.body;

        if (!skillName || !difficulty) {
            throw new ApiError(400, 'Skill name and difficulty are required');
        }

        const validDifficulties = ['Beginner', 'Mid-Level', 'Advanced'];
        if (!validDifficulties.includes(difficulty)) {
            throw new ApiError(400, 'Invalid difficulty level');
        }

        // Get skill from database
        const { data: skill, error: skillError } = await supabase
            .from('skills')
            .select('*')
            .eq('name', skillName)
            .single();

        if (skillError || !skill) {
            throw new ApiError(404, 'Skill not found');
        }

        // Generate assessment using Gemini AI
        const assessmentContent = await geminiService.generateAssessment(
            skillName,
            difficulty
        );

        // Store assessment in database (without correct answers for security)
        const { data: assessment, error: assessmentError } = await supabase
            .from('assessments')
            .insert({
                skill_id: skill.id,
                difficulty,
                title: assessmentContent.title,
                description: assessmentContent.description,
                starter_code: assessmentContent.starterCode,
                theory_questions: assessmentContent.theoryQuestions.map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options
                    // correctAnswer is NOT sent to client
                }))
            })
            .select()
            .single();

        if (assessmentError || !assessment) {
            throw new ApiError(500, 'Failed to create assessment');
        }

        logger.info('Assessment generated', {
            userId: req.user?.id,
            assessmentId: assessment.id,
            skill: skillName,
            difficulty
        });

        // Return assessment without correct answers
        res.json({
            assessment: {
                id: assessment.id,
                skill: skillName,
                difficulty,
                title: assessment.title,
                description: assessment.description,
                starterCode: assessment.starter_code,
                theoryQuestions: assessment.theory_questions
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Submit an assessment
 * POST /api/assessments/submit
 */
export const submitAssessment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            assessmentId,
            codeSubmission,
            theoryAnswers,
            proctoringMetrics
        } = req.body;

        if (!assessmentId || !codeSubmission || !theoryAnswers) {
            throw new ApiError(400, 'Assessment ID, code submission, and theory answers are required');
        }

        // Get assessment
        const { data: assessment, error: assessmentError } = await supabase
            .from('assessments')
            .select('*, skills(*)')
            .eq('id', assessmentId)
            .single();

        if (assessmentError || !assessment) {
            throw new ApiError(404, 'Assessment not found');
        }

        // Extract correct answers (server-side only)
        const correctAnswers: Record<number, number> = {};
        assessment.theory_questions.forEach((q: any) => {
            if (q.correctAnswer !== undefined) {
                correctAnswers[q.id] = q.correctAnswer;
            }
        });

        // Evaluate code submission
        const evaluation = await geminiService.evaluateCodeSubmission(
            codeSubmission,
            assessment.skills.name,
            assessment.description,
            theoryAnswers,
            correctAnswers
        );

        // Analyze proctoring data if provided
        let cheatingDetected = false;
        let cheatingReason = null;

        if (proctoringMetrics) {
            const cheatingAnalysis = await geminiService.generateCheatingAnalysis(
                proctoringMetrics.events || [],
                {
                    tabSwitches: proctoringMetrics.tabSwitches || 0,
                    pasteEvents: proctoringMetrics.pasteEvents || 0,
                    suspiciousEyemovements: proctoringMetrics.suspiciousEyemovements || 0,
                    typingBursts: proctoringMetrics.typingBursts || 0,
                    pasteContentWarnings: proctoringMetrics.pasteContentWarnings || 0
                },
                codeSubmission
            );

            cheatingDetected = cheatingAnalysis.isCheating;
            cheatingReason = cheatingAnalysis.reason;
        }

        // Determine if passed (score >= 70 and no cheating)
        const passed = evaluation.score >= 70 && !cheatingDetected;
        let txHash = '';

        // Mint certificate if passed
        if (passed) {
            // Get candidate name for certificate
            const { data: userProfile } = await supabase
                .from('users')
                .select('name')
                .eq('id', req.user!.id)
                .single();

            const candidateName = userProfile?.name || 'Candidate';

            txHash = await pwrService.mintCertificate({
                candidateName,
                skill: assessment.skills.name,
                score: evaluation.score,
                difficulty: assessment.difficulty as any,
                timestamp: new Date().toISOString()
            });

            // Update candidate profile with new certificate and verified status
            const { data: candidateProfile } = await supabase
                .from('candidate_profiles')
                .select('certifications, skills')
                .eq('user_id', req.user!.id)
                .single();

            const currentCerts = Array.isArray(candidateProfile?.certifications)
                ? candidateProfile.certifications
                : [];

            const currentSkills = candidateProfile?.skills || {};

            // Update skill score if it's new or higher
            const skillName = assessment.skills.name;
            const newScore = evaluation.score;

            if (!currentSkills[skillName] || currentSkills[skillName] < newScore) {
                currentSkills[skillName] = newScore;
            }

            // Add new cert hash if not already present
            const updates: any = {
                skills: currentSkills,
                verified: true
            };

            if (!currentCerts.includes(txHash)) {
                updates.certifications = [...currentCerts, txHash];
            }

            await supabase
                .from('candidate_profiles')
                .update(updates)
                .eq('user_id', req.user!.id);
        }

        // Store submission
        const { data: submission, error: submissionError } = await supabase
            .from('assessment_submissions')
            .insert({
                user_id: req.user!.id,
                assessment_id: assessmentId,
                code_submission: codeSubmission,
                theory_answers: theoryAnswers,
                score: evaluation.score,
                feedback: evaluation.feedback,
                passed,
                cheating_detected: cheatingDetected,
                cheating_reason: cheatingReason
            })
            .select()
            .single();

        if (submissionError || !submission) {
            throw new ApiError(500, 'Failed to save submission');
        }

        // If passed, record certificate in certifications table
        if (passed && txHash) {
            await supabase.from('certifications').insert({
                user_id: req.user!.id,
                skill_id: assessment.skill_id,
                submission_id: submission.id,
                blockchain_hash: txHash,
                score: evaluation.score,
                difficulty: assessment.difficulty
            });
        }

        logger.info('Assessment submitted', {
            userId: req.user?.id,
            submissionId: submission.id,
            score: evaluation.score,
            passed,
            cheatingDetected,
            certificateHash: txHash
        });

        res.json({
            submission: {
                id: submission.id,
                score: evaluation.score,
                feedback: evaluation.feedback,
                passed,
                cheatingDetected,
                cheatingReason,
                certificateHash: txHash
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get assessment details
 * GET /api/assessments/:id
 */
export const getAssessment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const { data: assessment, error } = await supabase
            .from('assessments')
            .select('*, skills(*)')
            .eq('id', id)
            .single();

        if (error || !assessment) {
            throw new ApiError(404, 'Assessment not found');
        }

        // Remove correct answers from theory questions
        const sanitizedQuestions = assessment.theory_questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: q.options
        }));

        res.json({
            assessment: {
                id: assessment.id,
                skill: assessment.skills.name,
                difficulty: assessment.difficulty,
                title: assessment.title,
                description: assessment.description,
                starterCode: assessment.starter_code,
                theoryQuestions: sanitizedQuestions
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get user's assessment history
 * GET /api/assessments/history
 */
export const getAssessmentHistory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { data: submissions, error } = await supabase
            .from('assessment_submissions')
            .select(`
        *,
        assessments (
          *,
          skills (*)
        )
      `)
            .eq('user_id', req.user!.id)
            .order('submitted_at', { ascending: false });

        if (error) {
            throw new ApiError(500, 'Failed to fetch assessment history');
        }

        res.json({ submissions });

    } catch (error) {
        next(error);
    }
};

/**
 * Submit proctoring events
 * POST /api/assessments/:id/proctor
 */
export const submitProctoringEvents = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id: submissionId } = req.params;
        const { events } = req.body;

        if (!events || !Array.isArray(events)) {
            throw new ApiError(400, 'Events array is required');
        }

        // Verify submission belongs to user
        const { data: submission, error: submissionError } = await supabase
            .from('assessment_submissions')
            .select('*')
            .eq('id', submissionId)
            .eq('user_id', req.user!.id)
            .single();

        if (submissionError || !submission) {
            throw new ApiError(404, 'Submission not found');
        }

        // Store proctoring events
        const proctoringData = events.map((event: any) => ({
            submission_id: submissionId,
            event_type: event.type,
            event_data: event.data,
            timestamp: event.timestamp || new Date().toISOString()
        }));

        const { error: insertError } = await supabase
            .from('proctoring_events')
            .insert(proctoringData);

        if (insertError) {
            throw new ApiError(500, 'Failed to store proctoring events');
        }

        res.json({ message: 'Proctoring events recorded' });

    } catch (error) {
        next(error);
    }
};

export default {
    generateAssessment,
    submitAssessment,
    getAssessment,
    getAssessmentHistory,
    submitProctoringEvents
};
