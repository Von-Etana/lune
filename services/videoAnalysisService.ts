/**
 * Video Analysis Service
 * Provides AI-powered video introduction analysis with transcription and scoring
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface VideoAnalysisResult {
    transcription: string;
    summary: string;
    confidenceScore: number;      // 0-100
    clarityScore: number;         // 0-100
    professionalismScore: number; // 0-100
    overallScore: number;         // 0-100
    keywords: string[];
    strengths: string[];
    improvements: string[];
    duration: number;             // seconds
}

// Extended interface for Video Verification Assessment
export interface VideoVerificationResult extends VideoAnalysisResult {
    // Communication Style Assessment
    communicationStyleScore: number;  // 0-100: Overall communication effectiveness
    accentScore: number;              // 0-100: Accent clarity (not judging accent type, but clarity)
    pronunciationScore: number;       // 0-100: Word pronunciation accuracy
    grammarScore: number;             // 0-100: Grammar usage in speech
    intonationScore: number;          // 0-100: Voice modulation and tone variation

    // Role-Specific Scores
    persuasionScore: number;          // 0-100: For sales roles
    empathyScore: number;             // 0-100: For customer service roles

    // Detailed Feedback
    communicationFeedback: {
        pace: string;
        tone: string;
        vocabulary: string;
        engagement: string;
    };

    // Pass/Fail Recommendation
    recommendedPass: boolean;
    assessmentType: 'customer_service' | 'sales' | 'general';
}

export interface TranscriptionSegment {
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
}

/**
 * Extract audio from video and convert to base64
 */
const extractAudioFromVideo = async (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const audioContext = new AudioContext();

        video.src = URL.createObjectURL(videoFile);
        video.muted = true;

        video.onloadedmetadata = async () => {
            try {
                // Create audio buffer source
                const response = await fetch(video.src);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // Convert to base64
                const offlineContext = new OfflineAudioContext(
                    audioBuffer.numberOfChannels,
                    audioBuffer.length,
                    audioBuffer.sampleRate
                );

                const source = offlineContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(offlineContext.destination);
                source.start();

                const renderedBuffer = await offlineContext.startRendering();

                // Convert to WAV format
                const wavBlob = audioBufferToWav(renderedBuffer);
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result as string);
                };
                reader.readAsDataURL(wavBlob);
            } catch (error) {
                reject(error);
            }
        };

        video.onerror = reject;
    });
};

/**
 * Convert AudioBuffer to WAV blob
 */
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const samples = buffer.length;
    const dataBytes = samples * blockAlign;
    const headerBytes = 44;
    const totalBytes = headerBytes + dataBytes;

    const arrayBuffer = new ArrayBuffer(totalBytes);
    const view = new DataView(arrayBuffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalBytes - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataBytes, true);

    // Write audio data
    const channelData = [];
    for (let i = 0; i < numChannels; i++) {
        channelData.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < samples; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
            view.setInt16(offset, sample * 0x7fff, true);
            offset += 2;
        }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

/**
 * Analyze video introduction using Gemini AI
 */
export const analyzeVideoIntroduction = async (
    videoFile: File
): Promise<VideoAnalysisResult> => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Get video duration
        const duration = await getVideoDuration(videoFile);

        // Convert video to base64 for analysis
        const base64Video = await fileToBase64(videoFile);

        const prompt = `
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

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType: videoFile.type,
                    data: base64Video.split(',')[1]
                }
            }
        ]);

        const responseText = result.response.text();

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const analysis = JSON.parse(jsonMatch[0]);

        // Calculate overall score
        const overallScore = Math.round(
            (analysis.confidenceScore + analysis.clarityScore + analysis.professionalismScore) / 3
        );

        return {
            transcription: analysis.transcription,
            summary: analysis.summary,
            confidenceScore: analysis.confidenceScore,
            clarityScore: analysis.clarityScore,
            professionalismScore: analysis.professionalismScore,
            overallScore,
            keywords: analysis.keywords,
            strengths: analysis.strengths,
            improvements: analysis.improvements,
            duration,
        };
    } catch (error) {
        console.error('Video analysis error:', error);

        // Return fallback analysis
        return {
            transcription: 'Transcription unavailable',
            summary: 'Video analysis could not be completed.',
            confidenceScore: 0,
            clarityScore: 0,
            professionalismScore: 0,
            overallScore: 0,
            keywords: [],
            strengths: ['Video uploaded successfully'],
            improvements: ['Please ensure video has clear audio', 'Try uploading a shorter video'],
            duration: 0,
        };
    }
};

/**
 * Get video duration
 */
const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };
        video.onerror = () => resolve(0);
        video.src = URL.createObjectURL(file);
    });
};

/**
 * Convert file to base64
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Generate AI-powered interview tips based on video analysis
 */
export const generateInterviewTips = async (
    analysis: VideoAnalysisResult
): Promise<string[]> => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
        Based on this video introduction analysis, provide 5 specific, actionable interview tips:
        
        Summary: ${analysis.summary}
        Confidence Score: ${analysis.confidenceScore}/100
        Clarity Score: ${analysis.clarityScore}/100
        Professionalism Score: ${analysis.professionalismScore}/100
        Improvements needed: ${analysis.improvements.join(', ')}
        
        Provide exactly 5 tips as a JSON array of strings.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return [
            'Practice your introduction multiple times',
            'Maintain eye contact with the camera',
            'Speak clearly and at a moderate pace',
            'Highlight your key achievements',
            'End with enthusiasm about the opportunity'
        ];
    } catch (error) {
        console.error('Failed to generate tips:', error);
        return [
            'Practice your introduction multiple times',
            'Maintain eye contact with the camera',
            'Speak clearly and at a moderate pace',
            'Highlight your key achievements',
            'End with enthusiasm about the opportunity'
        ];
    }
};

/**
 * Analyze speaking pace from transcription
 */
export const analyzeSpeakingPace = (
    transcription: string,
    duration: number
): { wordsPerMinute: number; assessment: string } => {
    const wordCount = transcription.split(/\s+/).filter(w => w.length > 0).length;
    const minutes = duration / 60;
    const wpm = Math.round(wordCount / minutes);

    let assessment: string;
    if (wpm < 100) {
        assessment = 'Too slow - try to speak more naturally';
    } else if (wpm < 130) {
        assessment = 'Good pace - clear and easy to follow';
    } else if (wpm < 160) {
        assessment = 'Optimal pace - engaging and professional';
    } else if (wpm < 190) {
        assessment = 'Slightly fast - consider slowing down';
    } else {
        assessment = 'Too fast - slow down for clarity';
    }

    return { wordsPerMinute: wpm, assessment };
};

/**
 * Analyze video for communication skills verification assessment
 * Used for non-tech roles like Customer Service, Sales, etc.
 */
export const analyzeVideoVerification = async (
    videoFile: File,
    roleContext: string,
    assessmentType: 'customer_service' | 'sales' | 'general' = 'general'
): Promise<VideoVerificationResult> => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const duration = await getVideoDuration(videoFile);
        const base64Video = await fileToBase64(videoFile);

        const rolePrompts = {
            customer_service: `Focus on empathy, patience, problem-solving approach, and ability to handle difficult situations professionally. Assess if they would make customers feel heard and valued.`,
            sales: `Focus on persuasiveness, enthusiasm, ability to build rapport, handling objections, and closing potential. Assess their ability to influence and inspire action.`,
            general: `Focus on overall communication effectiveness, professionalism, and clarity of expression.`
        };

        const prompt = `
        You are an expert communication skills assessor evaluating a candidate for a ${assessmentType.replace('_', ' ')} role.
        
        ${rolePrompts[assessmentType]}

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

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType: videoFile.type,
                    data: base64Video.split(',')[1]
                }
            }
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const analysis = JSON.parse(jsonMatch[0]);

        // Calculate overall score
        const overallScore = Math.round(
            (analysis.communicationStyleScore +
                analysis.accentScore +
                analysis.pronunciationScore +
                analysis.grammarScore +
                analysis.intonationScore +
                analysis.confidenceScore +
                analysis.clarityScore +
                analysis.professionalismScore) / 8
        );

        return {
            transcription: analysis.transcription,
            summary: analysis.summary,
            confidenceScore: analysis.confidenceScore,
            clarityScore: analysis.clarityScore,
            professionalismScore: analysis.professionalismScore,
            overallScore,
            keywords: analysis.keywords || [],
            strengths: analysis.strengths || [],
            improvements: analysis.improvements || [],
            duration,
            communicationStyleScore: analysis.communicationStyleScore,
            accentScore: analysis.accentScore,
            pronunciationScore: analysis.pronunciationScore,
            grammarScore: analysis.grammarScore,
            intonationScore: analysis.intonationScore,
            persuasionScore: analysis.persuasionScore,
            empathyScore: analysis.empathyScore,
            communicationFeedback: analysis.communicationFeedback,
            recommendedPass: analysis.recommendedPass ?? overallScore >= 70,
            assessmentType,
        };
    } catch (error) {
        console.error('Video verification analysis error:', error);

        // Return fallback result
        return {
            transcription: 'Transcription unavailable',
            summary: 'Video verification analysis could not be completed.',
            confidenceScore: 0,
            clarityScore: 0,
            professionalismScore: 0,
            overallScore: 0,
            keywords: [],
            strengths: ['Video uploaded successfully'],
            improvements: ['Please ensure video has clear audio', 'Try recording in a quiet environment'],
            duration: 0,
            communicationStyleScore: 0,
            accentScore: 0,
            pronunciationScore: 0,
            grammarScore: 0,
            intonationScore: 0,
            persuasionScore: 0,
            empathyScore: 0,
            communicationFeedback: {
                pace: 'Unable to assess',
                tone: 'Unable to assess',
                vocabulary: 'Unable to assess',
                engagement: 'Unable to assess'
            },
            recommendedPass: false,
            assessmentType,
        };
    }
};
