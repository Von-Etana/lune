import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { logger } from '../utils/logger';

const router = Router();

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const modelId = 'gemini-2.0-flash';

// Log API key status on load
logger.info(`Gemini AI initialized: key=${apiKey ? 'SET' : 'MISSING'}, model=${modelId}`);

// Timeout wrapper for Gemini calls (25 seconds)
const withTimeout = <T>(promise: Promise<T>, ms = 55000): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Gemini API timed out after ${ms / 1000}s`)), ms)
        ),
    ]);
};

/**
 * Quick diagnostic: test Gemini API key
 * GET /api/ai/test-key
 */
router.get('/test-key', async (req: Request, res: Response) => {
    try {
        if (!apiKey) return res.json({ status: 'error', message: 'GEMINI_API_KEY not set' });
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: 'Say "hello" in one word. Output JSON: {"reply":"hello"}',
            config: { responseMimeType: "application/json" }
        }));
        res.json({ status: 'ok', model: modelId, keyPrefix: apiKey.substring(0, 8) + '...', response: response.text });
    } catch (error: any) {
        res.json({ status: 'error', model: modelId, keyPrefix: apiKey.substring(0, 8) + '...', error: error.message });
    }
});

/**
 * Generate Scenario-Based Assessment (Public endpoint for frontend)
 * POST /api/ai/generate-scenario
 * This proxies the Gemini API call to avoid CORS issues in the browser
 */
router.post('/generate-scenario', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { skill, difficulty } = req.body;

        if (!skill || !difficulty) {
            return res.status(400).json({ error: 'Skill and difficulty are required' });
        }

        if (!apiKey) {
            logger.error('GEMINI_API_KEY not configured');
            return res.status(500).json({ error: 'AI service not configured' });
        }

        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        // Experience level mapping
        const experienceExpectations: Record<string, { yearsRange: string; expectations: string; complexity: string; responsibilities: string }> = {
            'Beginner': {
                yearsRange: '0-2 years',
                expectations: 'Entry-level tasks, following established procedures, basic problem-solving',
                complexity: 'Straightforward scenarios with clear solutions and single stakeholders',
                responsibilities: 'Task execution, learning processes, seeking guidance when needed'
            },
            'Mid-Level': {
                yearsRange: '3-5 years',
                expectations: 'Independent work, handling ambiguity, mentoring juniors, process improvement',
                complexity: 'Multi-faceted scenarios with competing priorities and multiple stakeholders',
                responsibilities: 'Project ownership, client communication, quality assurance, training others'
            },
            'Advanced': {
                yearsRange: '6+ years',
                expectations: 'Strategic thinking, crisis management, leadership, high-stakes decisions',
                complexity: 'Complex scenarios with ambiguity, politics, budget constraints, and executive stakeholders',
                responsibilities: 'Team leadership, vendor management, strategic planning, executive communication'
            }
        };

        const expLevel = experienceExpectations[difficulty] || experienceExpectations['Mid-Level'];

        // Shuffle themes for variety
        const potentialThemes = [
            'Conflict Resolution', 'Prioritization under Pressure', 'Ethical Integrity',
            'Resource Allocation', 'Client Negotiation', 'Data Privacy/Security',
            'Process Improvement', 'Cross-functional Collaboration', 'Remote Communication',
            'Crisis Management', 'Mentorship/Coaching', 'Stakeholder Management'
        ];

        for (let i = potentialThemes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [potentialThemes[i], potentialThemes[j]] = [potentialThemes[j], potentialThemes[i]];
        }
        const selectedThemes = potentialThemes.slice(0, 10);

        const prompt = `
            Generate a UNIQUE scenario-based assessment for a ${skill} role.
            
            EXPERIENCE LEVEL: ${difficulty} (${expLevel.yearsRange} experience)
            Expected competencies: ${expLevel.expectations}
            Scenario complexity: ${expLevel.complexity}
            
            Unique Session ID: ${uniqueId}
            Assigned themes (one per question): ${selectedThemes.join(', ')}
            
            Generate EXACTLY 12 questions:
            1. ONE optional multiple choice question (id: 1)
            2. TEN situational written tasks (ids: 2-11) - each using a different assigned theme
            3. ONE oral response task (id: 12)
            
            For each situational question, provide:
            - id, scenario (detailed context), question (what they need to do)
            - options (4 choices for MC) or isOpenEnded: true for written
            - taskType describing the theme
            
            Output JSON with: title, description, difficulty, roleContext, situationalQuestions array, oralResponseTask object
        `;

        logger.info('Generating scenario assessment', { skill, difficulty, uniqueId });

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                temperature: 0.95,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        difficulty: { type: Type.STRING },
                        roleContext: { type: Type.STRING },
                        situationalQuestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.INTEGER },
                                    scenario: { type: Type.STRING },
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    isOpenEnded: { type: Type.BOOLEAN },
                                    requiresOralResponse: { type: Type.BOOLEAN },
                                    taskType: { type: Type.STRING }
                                }
                            }
                        },
                        oralResponseTask: {
                            type: Type.OBJECT,
                            properties: {
                                prompt: { type: Type.STRING },
                                evaluationCriteria: { type: Type.ARRAY, items: { type: Type.STRING } },
                                maxDurationSeconds: { type: Type.INTEGER }
                            }
                        }
                    }
                }
            }
        }));

        if (response.text) {
            const result = JSON.parse(response.text);
            result.uniqueId = uniqueId;
            logger.info('Scenario assessment generated successfully', { uniqueId });
            return res.json(result);
        }

        throw new Error('No response from AI');

    } catch (error: any) {
        logger.error('Gemini scenario generation error', { error: error.message });

        // Return fallback assessment
        return res.status(200).json({
            title: `${req.body.skill || 'Professional'} Assessment (${req.body.difficulty || 'Mid-Level'})`,
            description: 'Evaluate your competencies through realistic workplace scenarios.',
            difficulty: req.body.difficulty || 'Mid-Level',
            uniqueId: `fallback-${Date.now()}`,
            roleContext: `You are a ${req.body.skill || 'professional'} supporting operations at a growing company.`,
            situationalQuestions: [
                {
                    id: 1,
                    scenario: 'Your manager asks you to prioritize three urgent tasks that all have the same deadline.',
                    question: 'Which approach would you take first?',
                    options: ['Complete the easiest task first', 'Ask for deadline extensions', 'Prioritize by business impact', 'Work on all simultaneously'],
                    isOpenEnded: false,
                    taskType: 'Prioritization'
                },
                {
                    id: 2,
                    scenario: 'A colleague repeatedly misses deadlines affecting your work.',
                    question: 'Describe how you would address this situation professionally.',
                    isOpenEnded: true,
                    taskType: 'Conflict Resolution'
                }
            ],
            oralResponseTask: {
                prompt: 'Describe a challenging situation you handled and what you learned.',
                evaluationCriteria: ['Clarity', 'Structure', 'Self-awareness'],
                maxDurationSeconds: 120
            },
            _isFallback: true
        });
    }
});

/**
 * Generate Skill Passport Analysis (Public endpoint)
 * POST /api/ai/generate-passport
 */
router.post('/generate-passport', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { assessmentHistory, certifications, candidateName } = req.body;

        if (!apiKey) {
            return res.status(500).json({ error: 'AI service not configured' });
        }

        const prompt = `
            Analyze this candidate's skill profile and generate a comprehensive Skill Passport:
            
            Candidate: ${candidateName || 'Anonymous'}
            Assessment History: ${JSON.stringify(assessmentHistory || [])}
            Certifications: ${JSON.stringify(certifications || [])}
            
            Generate a JSON response with:
            - overallScore (0-100)
            - strengthAreas (array of { skill, score, description })
            - improvementAreas (array of { skill, currentScore, targetScore, recommendations })
            - careerTrajectory (text description)
            - opportunities (array of job matches with title, company, matchScore, reason)
        `;

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                temperature: 0.7,
                responseMimeType: "application/json"
            }
        }));

        if (response.text) {
            const result = JSON.parse(response.text);
            return res.json(result);
        }

        throw new Error('No response from AI');

    } catch (error: any) {
        logger.error('Passport generation error', { error: error.message });
        return res.status(500).json({ error: 'Failed to generate passport' });
    }
});

// ... existing passport endpoint ...

/**
 * Generate Technical Assessment
 * POST /api/ai/generate-assessment
 */
router.post('/generate-assessment', async (req: Request, res: Response) => {
    try {
        const { skillName, difficulty } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI service not configured' });

        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const industries = ['Fintech', 'E-commerce', 'Healthcare', 'Social Media', 'IoT', 'Logistics', 'EdTech', 'Travel', 'Real Estate', 'Gaming'];
        const industry = industries[Math.floor(Math.random() * industries.length)];

        const prompt = `
            Generate a UNIQUE and ORIGINAL technical skill assessment for a ${skillName} role.
            Session ID: ${uniqueId}
            Industry Context: ${industry}
            Difficulty: ${difficulty}
            
            Include:
            1. A coding challenge (title, description, starter code) relevant to ${industry}.
            2. Two deep theoretical multiple choice questions.
            
            Output JSON format with title, description, difficulty, starterCode, theoryQuestions array.
        `;

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        difficulty: { type: Type.STRING },
                        starterCode: { type: Type.STRING },
                        theoryQuestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.INTEGER },
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                }
                            }
                        }
                    }
                }
            }
        }));

        if (response.text) return res.json(JSON.parse(response.text));
        throw new Error('No response');

    } catch (error: any) {
        logger.error('Technical assessment generation error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to generate assessment', details: error.message });
    }
});

/**
 * Evaluate Code Submission
 * POST /api/ai/evaluate-submission
 */
router.post('/evaluate-submission', async (req: Request, res: Response) => {
    try {
        const { code, language, taskDescription, theoryAnswers } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI service not configured' });

        const prompt = `
            Evaluate technical interview submission.
            Task: ${taskDescription}
            Language: ${language}
            Code: ${code}
            Theory Answers: ${JSON.stringify(theoryAnswers)}
            
            Return JSON with weighted total score (0-100) and concise feedback.
        `;

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        feedback: { type: Type.STRING },
                    },
                    required: ["score", "feedback"]
                }
            }
        }));

        if (response.text) return res.json(JSON.parse(response.text));
        throw new Error('No response');

    } catch (error: any) {
        logger.error('Evaluation error', { error: error.message });
        res.status(500).json({ error: 'Failed to evaluate submission' });
    }
});

/**
 * Analyze Cheating Metrics
 * POST /api/ai/analyze-cheating
 */
router.post('/analyze-cheating', async (req: Request, res: Response) => {
    try {
        const { events, metrics, codeSnapshot } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI service not configured' });

        const prompt = `
            Analyze exam session for academic dishonesty.
            Metrics: ${JSON.stringify(metrics)}
            Events: ${JSON.stringify(events)}
            Code Snapshot: "${codeSnapshot?.substring(0, 500)}..."
            
            Output JSON: isCheating (boolean), reason (string).
        `;

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isCheating: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    }
                }
            }
        }));

        if (response.text) return res.json(JSON.parse(response.text));
        throw new Error('No response');

    } catch (error: any) {
        logger.error('Cheating analysis error', { error: error.message });
        res.status(500).json({ error: 'Failed to analyze cheating' });
    }
});

/**
 * Evaluate Scenario Response
 * POST /api/ai/evaluate-scenario
 */
router.post('/evaluate-scenario', async (req: Request, res: Response) => {
    try {
        const { skill, responses, assessmentContent } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI service not configured' });

        const prompt = `
            Evaluate ${skill} role assessment (Scenario Context: ${assessmentContent.roleContext}).
            
            Questions and Answers:
            ${assessmentContent.situationalQuestions.map((q: any) => `
                Task ${q.id}: ${q.scenario}
                Question: ${q.question}
                Answer: ${responses.situationalAnswers[q.id] || 'No answer'}
            `).join('\n')}
            
            Evaluate on: Problem Solving, Communication, Role Knowledge, Customer Focus, Professionalism (0-100).
            Provide weighted score (0-100) and feedback.
        `;

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        feedback: { type: Type.STRING },
                        categoryScores: {
                            type: Type.OBJECT,
                            properties: {
                                problemSolving: { type: Type.NUMBER },
                                communication: { type: Type.NUMBER },
                                roleKnowledge: { type: Type.NUMBER },
                                customerFocus: { type: Type.NUMBER },
                                professionalism: { type: Type.NUMBER },
                                verbalCommunication: { type: Type.NUMBER }
                            }
                        }
                    }
                }
            }
        }));

        if (response.text) return res.json(JSON.parse(response.text));
        throw new Error('No response');

    } catch (error: any) {
        logger.error('Scenario evaluation error', { error: error.message });
        res.status(500).json({ error: 'Failed to evaluate scenario' });
    }
});

/**
 * Get Career Recommendations
 * POST /api/ai/career-recommendations
 */
router.post('/career-recommendations', async (req: Request, res: Response) => {
    try {
        const { skills } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI service not configured' });

        const prompt = `
            Based on skills: ${JSON.stringify(skills)},
            Recommend 3 certifications and 3 hypothetical job opportunities.
            Output JSON: { certifications: [], jobs: [] }
        `;

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        certifications: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    provider: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                }
                            }
                        },
                        jobs: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    company: { type: Type.STRING },
                                    location: { type: Type.STRING },
                                    salary: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    matchScore: { type: Type.NUMBER },
                                    matchReason: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        }));

        if (response.text) return res.json(JSON.parse(response.text));
        throw new Error('No response');

    } catch (error: any) {
        logger.error('Career recommendations error', { error: error.message });
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

/**
 * Match Candidates to Job
 * POST /api/ai/match-candidates
 */
router.post('/match-candidates', async (req: Request, res: Response) => {
    try {
        const { jobDescription, candidates } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI service not configured' });

        const prompt = `
            Job: "${jobDescription}"
            Candidates: ${JSON.stringify(candidates)}
            Rank candidates by fit. Return list of { candidateId, matchReason, score }.
        `;

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt, // Output schema implied as array
            config: { responseMimeType: "application/json" }
        }));

        if (response.text) return res.json(JSON.parse(response.text));
        throw new Error('No response');

    } catch (error: any) {
        logger.error('Candidate matching error', { error: error.message });
        res.status(500).json({ error: 'Failed to match candidates' });
    }
});

/**
 * Generate Interview Question
 * POST /api/ai/interview-question
 */
router.post('/interview-question', async (req: Request, res: Response) => {
    try {
        const { role, topic } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI service not configured' });

        const prompt = `Generate a challenging ${topic} interview question for a ${role}. Output JSON { question: string }`;

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }));

        if (response.text) return res.json(JSON.parse(response.text));
        throw new Error('No response');

    } catch (error: any) {
        logger.error('Interview question error', { error: error.message });
        res.status(500).json({ error: 'Failed to generate question' });
    }
});

/**
 * Evaluate Interview Response
 * POST /api/ai/evaluate-interview
 */
router.post('/evaluate-interview', async (req: Request, res: Response) => {
    try {
        const { question, answer } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI service not configured' });

        const prompt = `
            Question: "${question}"
            Answer: "${answer}"
            Evaluate on Clarity, Confidence, Relevance (0-100). Provide feedback and improvedAnswer.
        `;

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        clarity: { type: Type.NUMBER },
                        confidence: { type: Type.NUMBER },
                        relevance: { type: Type.NUMBER },
                        feedback: { type: Type.STRING },
                        improvedAnswer: { type: Type.STRING }
                    }
                }
            }
        }));

        if (response.text) return res.json(JSON.parse(response.text));
        throw new Error('No response');

    } catch (error: any) {
        logger.error('Interview evaluation error', { error: error.message });
        res.status(500).json({ error: 'Failed to evaluate interview' });
    }
});

export default router;
