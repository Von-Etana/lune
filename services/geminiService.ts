
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentContent, Job, RecommendedCertification, InterviewFeedback, DifficultyLevel } from "../types";

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const modelId = 'gemini-2.5-flash';

export const generateAssessment = async (skill: string, difficulty: DifficultyLevel): Promise<AssessmentContent> => {
  
  const prompt = `
    Generate a technical skill assessment for a candidate applying for a ${skill} role.
    Difficulty Level: ${difficulty}.
    
    Difficulty Context:
    - Beginner: Focus on syntax, basic concepts, and simple logic.
    - Mid-Level: Focus on best practices, optimization, and common patterns.
    - Advanced: Focus on system architecture, edge cases, performance tuning, and complex algorithms.

    Include:
    1. A coding challenge (title, description, starter code).
    2. Two theoretical multiple choice questions appropriate for the ${difficulty} level.
    
    Output JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
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
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback
    return {
      title: `${skill} Implementation (${difficulty})`,
      description: "Create a function that handles data processing efficiently.",
      difficulty: difficulty,
      starterCode: "// Write your code here",
      theoryQuestions: [
        {
          id: 1,
          question: "What is the time complexity of QuickSort in the worst case?",
          options: ["O(n)", "O(n log n)", "O(n^2)", "O(1)"]
        },
        {
          id: 2,
          question: "Which principle is NOT part of SOLID?",
          options: ["Single Responsibility", "Open/Closed", "Loose Coupling", "Interface Segregation"]
        }
      ]
    };
  }
};

export const evaluateCodeSubmission = async (
  code: string,
  language: string,
  taskDescription: string,
  theoryAnswers: Record<number, number> // questionId -> optionIndex
): Promise<{ score: number; feedback: string }> => {
  
  const prompt = `
    You are a senior technical interviewer.
    Task: ${taskDescription}
    Language: ${language}
    
    Candidate Code Submission:
    ${code}

    Theory Answers Provided (Question ID: Answer Index):
    ${JSON.stringify(theoryAnswers)}
    
    Evaluate the code based on correctness, quality, and efficiency.
    Also consider if the theory answers seem reasonable (you don't have the questions, but assume standard knowledge for now or if provided in context).
    
    Return a JSON object with a weighted total score (0-100) and concise feedback.
  `;

  try {
    const response = await ai.models.generateContent({
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
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    return {
      score: 0,
      feedback: "Evaluation failed due to API error.",
    };
  }
};

export interface CheatingMetrics {
  tabSwitches: number;
  pasteEvents: number;
  suspiciousEyemovements: number;
  typingBursts: number;
  pasteContentWarnings: number;
}

export const generateCheatingAnalysis = async (
  events: string[],
  metrics: CheatingMetrics,
  codeSnapshot: string
): Promise<{ isCheating: boolean; reason: string }> => {
  
  const prompt = `
    Act as a strict AI Proctor for a technical certification exam.
    Analyze the following session telemetry and code snapshot to detect academic dishonesty.

    Telemetry Metrics:
    - Tab Switches (Focus Lost): ${metrics.tabSwitches}
    - Paste Events: ${metrics.pasteEvents}
    - Suspicious Content in Pastes (LLM markers): ${metrics.pasteContentWarnings}
    - Implausible Typing Bursts (Non-paste bulk insertions): ${metrics.typingBursts}
    - Suspicious Gaze Alerts: ${metrics.suspiciousEyemovements}

    Event Log Timeline:
    ${JSON.stringify(events)}

    Code Snapshot (First 500 chars):
    "${codeSnapshot.substring(0, 500)}..."

    Evaluation Rules:
    1. **Tab Switching**: Frequent short switches or extended absence > 5s is suspicious.
    2. **Paste Events**: Pasting large blocks is suspicious.
    3. **LLM Markers**: If paste content had markers like "Here is the code", "generated by AI", or "Solution:", FLAG IMMEDIATELY.
    4. **Typing Bursts**: Large chunks appearing without paste events indicates script injection or drag-drop.
    5. **Gaze**: Frequent looking away combined with pauses often indicates a secondary device.

    Output a JSON object determining if the candidate should be flagged for cheating.
    "reason" should be a professional, evidence-based statement suitable for a report.
  `;

  try {
    const response = await ai.models.generateContent({
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
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No analysis generated");
  } catch (error) {
    console.error("Proctoring AI Error:", error);
    // Fallback Heuristics
    if (metrics.pasteContentWarnings > 0 || metrics.typingBursts > 2) {
         return { isCheating: true, reason: "Automated Flag: Anomalous code insertion patterns detected (AI markers or scripting)." };
    }
    if (metrics.tabSwitches > 3 || metrics.pasteEvents > 2) {
      return { isCheating: true, reason: `Automated Flag: Excessive environment violations detected (Tabs: ${metrics.tabSwitches}, Pastes: ${metrics.pasteEvents}).` };
    }
    return { isCheating: false, reason: "Session Verified Secure" };
  }
};

export const getCareerRecommendations = async (
  skills: Record<string, number>
): Promise<{ certifications: RecommendedCertification[], jobs: Job[] }> => {
  const prompt = `
    Based on the following technical skills profile: ${JSON.stringify(skills)},
    1. Recommend 3 specific professional certifications (name, provider, reason) that would boost this profile.
    2. Suggest 3 hypothetical job opportunities (title, company, location, salary, type (Remote/On-site), matchScore (0-100), matchReason (detailed explanation of fit)).

    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
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
    });
    
    if (response.text) {
       return JSON.parse(response.text);
    }
    return { certifications: [], jobs: [] };
  } catch (e) {
    console.error(e);
    return { certifications: [], jobs: [] };
  }
};

export const matchCandidatesToJob = async (
  jobDescription: string,
  candidates: any[]
): Promise<{ candidateId: string, matchReason: string, score: number }[]> => {
  const prompt = `
     Job Description: "${jobDescription}"
     
     Candidates: ${JSON.stringify(candidates.map(c => ({
       id: c.id, 
       role: c.role, 
       skills: c.skills, 
       yearsOfExperience: c.yearsOfExperience,
       certifications: c.certifications
     })))}

     Rank the candidates based on the job description.
     Consider their skills match, years of experience, and whether they have relevant certifications (if mentioned).
     
     Return a list of objects with candidateId, matchReason (one sentence), and score (0-100).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              candidateId: { type: Type.STRING },
              matchReason: { type: Type.STRING },
              score: { type: Type.NUMBER }
            }
          }
        }
      }
    });

    if (response.text) return JSON.parse(response.text);
    return [];
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const generateInterviewQuestion = async (role: string, topic: 'behavioral' | 'technical'): Promise<string> => {
  const prompt = `
    Act as a senior interviewer.
    Generate a single, challenging ${topic} interview question for a ${role} candidate.
    The question should test their depth of knowledge or problem-solving ability.
    
    Output a JSON object with a "question" property.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING }
          }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text).question;
    }
    return "Tell me about a challenging project you worked on.";
  } catch (e) {
    return "Tell me about a challenging project you worked on.";
  }
};

export const evaluateInterviewResponse = async (question: string, answer: string): Promise<InterviewFeedback> => {
  const prompt = `
    Question: "${question}"
    Candidate Answer: "${answer}"

    Evaluate the answer for:
    1. Communication Clarity (0-100) - How clear and structured is the answer?
    2. Confidence Tone (0-100) - Does the language show conviction?
    3. Content Relevance (0-100) - Does it actually answer the question?

    Provide constructive feedback and a specific "improvedAnswer" that refines the candidate's thoughts into a star-performer response.
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
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
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Failed to generate feedback");
  } catch (e) {
    return {
      clarity: 0,
      confidence: 0,
      relevance: 0,
      feedback: "Unable to analyze response at this time.",
      improvedAnswer: ""
    };
  }
};
