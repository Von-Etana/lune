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
