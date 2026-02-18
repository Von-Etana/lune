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

// Simple in-memory cache for generated assessments
const assessmentCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
            
            STRICT OUTPUT REQUIREMENT: Generate EXACTLY 12 questions in this order:
            1. ONE (1) multiple choice question (id: 1) - to test foundational knowledge.
            2. TEN (10) situational written tasks (ids: 2-11) - each using a different assigned theme. These must be challenging and relevant to the ${difficulty} level.
            3. ONE (1) oral response task (id: 12) - a complex scenario requiring a verbal explanation.
            
            IMPORTANT: Keep scenarios brief (1-2 sentences max). Keep questions concise.
            
            For each situational/MC question, provide:
            - id, scenario (1-2 sentences), question (1 sentence)
            - options (4 choices for MC) or isOpenEnded: true for written
            - taskType describing the theme
            
            Output JSON with: title, description, difficulty, roleContext, situationalQuestions array (length 11), oralResponseTask object
        `;

        logger.info('Generating scenario assessment', { skill, difficulty, uniqueId });

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                temperature: 0.95,
                maxOutputTokens: 65536,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    required: ['title', 'description', 'difficulty', 'roleContext', 'situationalQuestions', 'oralResponseTask'],
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        difficulty: { type: Type.STRING },
                        roleContext: { type: Type.STRING },
                        situationalQuestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                required: ['id', 'scenario', 'question', 'taskType'],
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
                            required: ['prompt', 'evaluationCriteria', 'maxDurationSeconds'],
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
            logger.info('Scenario assessment generated successfully', {
                uniqueId,
                questionCount: result.situationalQuestions?.length,
                hasOralTask: !!result.oralResponseTask,
                responseLength: response.text.length
            });
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

        // Check cache first
        const cacheKey = `assessment-${skillName}-${difficulty}`;
        const cached = assessmentCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            logger.info('Serving cached assessment', { skillName, difficulty });
            return res.json(cached.data);
        }

        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const industries = ['Fintech', 'E-commerce', 'Healthcare', 'Social Media', 'IoT', 'Logistics', 'EdTech', 'Travel', 'Real Estate', 'Gaming'];
        const industry = industries[Math.floor(Math.random() * industries.length)];

        const prompt = `
            Generate a UNIQUE technical skill assessment for ${skillName}.
            Session ID: ${uniqueId}
            Industry: ${industry}
            Difficulty: ${difficulty}
            
            Return JSON with exactly this structure:
            {
              "title": "assessment title",
              "description": "brief description",
              "difficulty": "${difficulty}",
              "starterCode": "// starter code here",
              "theoryQuestions": [
                {"id": 1, "question": "...", "options": ["A", "B", "C", "D"]},
                {"id": 2, "question": "...", "options": ["A", "B", "C", "D"]},
                {"id": 3, "question": "...", "options": ["A", "B", "C", "D"]}
              ]
            }
        `;

        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        }));

        if (response.text) {
            const data = JSON.parse(response.text);
            // Cache the result
            assessmentCache.set(cacheKey, { data, timestamp: Date.now() });
            return res.json(data);
        }
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
            
            1. written/MC Questions and Answers:
            ${assessmentContent.situationalQuestions.map((q: any) => `
                Task ${q.id}: ${q.scenario}
                Question: ${q.question}
                Answer: ${responses.situationalAnswers[q.id] || 'No answer'}
            `).join('\n')}

            2. Oral Response Analysis:
            Context: ${assessmentContent.oralResponseTask?.prompt || 'Oral Task'}
            Transcript: "${responses.oralResponseTranscript || 'No oral response provided'}"
            
            Evaluate on: Problem Solving, Communication (especially based on oral transcript), Role Knowledge, Customer Focus, Professionalism (0-100).
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

/**
 * Analyze Video Introduction
 * POST /api/ai/analyze-video
 */
router.post('/analyze-video', async (req: Request, res: Response) => {
    try {
        const { videoBase64, mimeType, type = 'introduction', roleContext, assessmentType } = req.body;
        if (!apiKey) return res.status(500).json({ error: 'AI service not configured' });

        let prompt = '';

        if (type === 'verification') {
            const rolePrompts: Record<string, string> = {
                customer_service: `Focus on empathy, patience, problem-solving approach, and ability to handle difficult situations professionally. Assess if they would make customers feel heard and valued.`,
                sales: `Focus on persuasiveness, enthusiasm, ability to build rapport, handling objections, and closing potential. Assess their ability to influence and inspire action.`,
                general: `Focus on overall communication effectiveness, professionalism, and clarity of expression.`
            };

            const specificContext = rolePrompts[assessmentType as string] || rolePrompts['general'];

            prompt = `
            You are an expert communication skills assessor evaluating a candidate for a ${assessmentType} role.
            ${specificContext}

            Analyze this video response and provide detailed scoring:

            1. **Transcription**: Complete text of what they said
            2. **Summary**: 2-3 sentence overview of their response
            
            **Communication Scores (0-100 each):**
            3. Communication Style Score: Overall effectiveness of communication
            4. Accent Clarity Score: How clear is their speech (not judging accent type, but intelligibility)
            5. Pronunciation Score: Accuracy of word pronunciation
            6. Grammar Score: Correct grammar usage in spoken language
            7. Intonation Score: Voice modulation, tone variation, and expressiveness
            8. Confidence Score: How confident do they appear and sound
            9. Clarity Score: How clear and articulate is the message
            10. Professionalism Score: Professional demeanor and presentation
            
            **Role-Specific Scores (0-100):**
            11. Persuasion Score: Ability to convince and influence (important for sales)
            12. Empathy Score: Ability to understand and relate to others (important for customer service)
            
            **Detailed Feedback:**
            13. Pace assessment: Too slow, good, optimal, or too fast
            14. Tone assessment: Description of their tone
            15. Vocabulary assessment: Appropriate word choice
            16. Engagement assessment: How engaging is their communication
            
            **Final Assessment:**
            17. Strengths: 3 specific strengths
            18. Improvements: 3 areas to improve
            19. Keywords: Key skills/topics mentioned
            20. Recommended Pass: true/false based on overall performance (70+ average = pass)

            Respond in this exact JSON format:
            {
                "transcription": "...",
                "summary": "...",
                "communicationStyleScore": 85,
                "accentScore": 90,
                "pronunciationScore": 85,
                "grammarScore": 80,
                "intonationScore": 75,
                "confidenceScore": 85,
                "clarityScore": 90,
                "professionalismScore": 80,
                "persuasionScore": 75,
                "empathyScore": 85,
                "communicationFeedback": {
                    "pace": "Optimal - engaging rhythm",
                    "tone": "Warm and professional",
                    "vocabulary": "Appropriate for professional context",
                    "engagement": "Maintains interest throughout"
                },
                "strengths": ["strength1", "strength2", "strength3"],
                "improvements": ["improvement1", "improvement2", "improvement3"],
                "keywords": ["keyword1", "keyword2"],
                "recommendedPass": true
            }
            `;
        } else {
            // Default: Introduction analysis
            prompt = `
            Analyze this video introduction from a job candidate. Provide:
            
            1. A complete transcription of what they said
            2. A brief summary (2-3 sentences)
            3. Confidence score (0-100): How confident do they appear?
            4. Clarity score (0-100): How clear and articulate is their speech?
            5. Professionalism score (0-100): How professional is their presentation?
            6. Key skills/keywords mentioned
            7. 3 strengths of this introduction
            8. 3 areas for improvement
            
            Respond in this exact JSON format:
            {
                "transcription": "full text of what they said",
                "summary": "brief 2-3 sentence summary",
                "confidenceScore": 85,
                "clarityScore": 90,
                "professionalismScore": 80,
                "keywords": ["skill1", "skill2"],
                "strengths": ["strength1", "strength2", "strength3"],
                "improvements": ["improvement1", "improvement2", "improvement3"]
            }
            `;
        }

        const response = await withTimeout(ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                { role: 'user', parts: [{ text: prompt }] },
                { role: 'user', parts: [{ inlineData: { mimeType, data: videoBase64 } }] }
            ]
        }));

        const text = response.text;
        if (text) {
            // Parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Failed to parse AI response');
            return res.json(JSON.parse(jsonMatch[0]));
        }
        throw new Error('No response from AI');

    } catch (error: any) {
        logger.error('Video analysis error', { error: error.message });
        res.status(500).json({ error: 'Failed to analyze video' });
    }
});

/**
 * Execute Code (Judge0)
 * POST /api/ai/execute-code
 */
router.post('/execute-code', async (req: Request, res: Response) => {
    try {
        const { sourceCode, languageId, stdin } = req.body;
        const rapidApiKey = process.env.RAPIDAPI_KEY;

        if (!rapidApiKey) {
            return res.status(500).json({ error: 'Code execution service not configured' });
        }

        // 1. Submit Code
        const submitResponse = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            },
            body: JSON.stringify({
                source_code: Buffer.from(sourceCode).toString('base64'),
                language_id: languageId,
                stdin: Buffer.from(stdin || '').toString('base64'),
            }),
        });

        if (!submitResponse.ok) {
            throw new Error(`Judge0 submission failed: ${submitResponse.statusText}`);
        }

        const { token } = await submitResponse.json() as any;

        // 2. Poll for results
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s

            const resultResponse = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true`, {
                headers: {
                    'X-RapidAPI-Key': rapidApiKey,
                    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                }
            });

            if (!resultResponse.ok) continue;

            const result: any = await resultResponse.json();

            // Status ID >= 3 means finished (Accepted, Wrong Answer, Error, etc.)
            if (result.status.id >= 3) {
                return res.json({
                    stdout: result.stdout ? Buffer.from(result.stdout, 'base64').toString() : null,
                    stderr: result.stderr ? Buffer.from(result.stderr, 'base64').toString() : null,
                    compile_output: result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : null,
                    status: result.status,
                    time: result.time,
                    memory: result.memory,
                    exit_code: result.exit_code
                });
            }
            attempts++;
        }

        throw new Error('Execution timed out');

    } catch (error: any) {
        logger.error('Code execution error', { error: error.message });
        res.status(500).json({ error: 'Failed to execute code' });
    }
});

/**
 * Generate Interview Tips
 * POST /api/ai/generate-tips
 */
router.post('/generate-tips', async (req: Request, res: Response) => {
    try {
        const { analysis } = req.body;
        if (!apiKey) return res.status(500).json({ error: 'AI service not configured' });

        const prompt = `
        Based on this video introduction analysis, provide 5 specific, actionable interview tips:
        
        Summary: ${analysis.summary}
        Confidence Score: ${analysis.confidenceScore}/100
        Clarity Score: ${analysis.clarityScore}/100
        Professionalism Score: ${analysis.professionalismScore}/100
        Improvements needed: ${(analysis.improvements || []).join(', ')}
        
        Provide exactly 5 tips as a JSON array of strings.
        `;

        const response = await withTimeout(ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        }));

        const text = response.text;
        if (text) {
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) return res.json(JSON.parse(jsonMatch[0]));
        }

        // Fallback tips
        return res.json([
            'Practice your introduction multiple times',
            'Maintain eye contact with the camera',
            'Speak clearly and at a moderate pace',
            'Highlight your key achievements',
            'End with enthusiasm about the opportunity'
        ]);

    } catch (error: any) {
        logger.error('Tips generation error', { error: error.message });
        res.status(500).json({ error: 'Failed to generate tips' });
    }
});

export default router;
