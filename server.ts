import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;

function getGemini(): { client: GoogleGenAI | null; error: string | null } {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return {
      client: null,
      error: 'AI analysis service is not configured.',
    };
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return { client: geminiClient, error: null };
}

const SUPPORTED_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

export interface KeywordAnalysisItem {
  keyword: string;
  matched: boolean;
  category?: string;
}

export interface ProjectFeedbackItem {
  name: string;
  strength: string;
  suggestion: string;
}

export interface ResumeAnalysisResponse {
  overall_score: number;
  ats_score: number;
  role_match_score: number;
  strengths: string[];
  missing_skills: string[];
  improvement_suggestions: string[];
  keyword_analysis: KeywordAnalysisItem[];
  experience_summary: string;
  project_feedback: ProjectFeedbackItem[];
  education_feedback: string;
  final_recommendation: string;
}

/**
 * Robust JSON parser and validator for Resume Analysis AI responses
 */
export function parseResumeAnalysisResponse(rawResponse: any): ResumeAnalysisResponse {
  // Step 1: Extract model text safely from raw response
  let rawText = '';
  if (typeof rawResponse === 'string') {
    rawText = rawResponse;
  } else if (rawResponse && typeof rawResponse.text === 'string') {
    rawText = rawResponse.text;
  } else if (rawResponse?.candidates?.[0]?.content?.parts) {
    rawText = rawResponse.candidates[0].content.parts
      .map((p: any) => (typeof p.text === 'string' ? p.text : ''))
      .join('');
  } else if (typeof rawResponse === 'object' && rawResponse !== null) {
    // If it was already parsed into an object
    if (
      'overall_score' in rawResponse &&
      'ats_score' in rawResponse &&
      'role_match_score' in rawResponse
    ) {
      return normalizeAnalysisObject(rawResponse);
    }
    rawText = JSON.stringify(rawResponse);
  }

  // Step 2: Trim whitespace
  let cleanText = (rawText || '').trim();

  if (!cleanText) {
    console.error('Resume analysis parsing failed: Empty response text received.', {
      responseType: typeof rawResponse,
      rawResponse,
    });
    throw new Error('AI returned an empty response.');
  }

  // Step 3: Remove ```json and ``` code fences if present
  cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Step 4: Locate the JSON object if there is surrounding conversational text
  const firstOpen = cleanText.indexOf('{');
  const lastClose = cleanText.lastIndexOf('}');

  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    cleanText = cleanText.substring(firstOpen, lastClose + 1).trim();
  }

  // Step 5: Parse JSON safely
  let parsed: any;
  try {
    parsed = JSON.parse(cleanText);
  } catch (parseError: any) {
    console.error('Resume analysis parsing failed:', {
      responseType: typeof rawResponse,
      rawResponse: cleanText,
      error: parseError?.message,
    });
    throw new Error('Failed to parse AI response as JSON.');
  }

  // Step 6 & 7: Validate & normalize the resulting object
  return normalizeAnalysisObject(parsed);
}

function normalizeAnalysisObject(parsed: any): ResumeAnalysisResponse {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid analysis result structure: not an object.');
  }

  // Required numeric scores
  const rawOverall = Number(parsed.overall_score);
  const rawAts = Number(parsed.ats_score);
  const rawRoleMatch = Number(parsed.role_match_score);

  if (isNaN(rawOverall) || isNaN(rawAts) || isNaN(rawRoleMatch)) {
    console.error('Validation failed: Required numeric scores missing or invalid in parsed object:', parsed);
    throw new Error('Required numeric scores (overall_score, ats_score, role_match_score) are invalid.');
  }

  const overall_score = Math.min(100, Math.max(0, Math.round(rawOverall)));
  const ats_score = Math.min(100, Math.max(0, Math.round(rawAts)));
  const role_match_score = Math.min(100, Math.max(0, Math.round(rawRoleMatch)));

  // Optional fields with robust defaults
  const strengths = Array.isArray(parsed.strengths)
    ? parsed.strengths
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => s.trim())
    : [];

  const missing_skills = Array.isArray(parsed.missing_skills)
    ? parsed.missing_skills
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => s.trim())
    : [];

  const improvement_suggestions = Array.isArray(parsed.improvement_suggestions)
    ? parsed.improvement_suggestions
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => s.trim())
    : [];

  const keyword_analysis: KeywordAnalysisItem[] = Array.isArray(parsed.keyword_analysis)
    ? parsed.keyword_analysis
        .filter((k: any) => k && typeof k === 'object' && typeof k.keyword === 'string')
        .map((k: any) => ({
          keyword: String(k.keyword).trim(),
          matched: Boolean(k.matched),
          category: typeof k.category === 'string' ? k.category.trim() : undefined,
        }))
    : [];

  const project_feedback: ProjectFeedbackItem[] = Array.isArray(parsed.project_feedback)
    ? parsed.project_feedback
        .filter((p: any) => p && typeof p === 'object')
        .map((p: any) => ({
          name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'Highlighted Project',
          strength: typeof p.strength === 'string' ? p.strength.trim() : '',
          suggestion: typeof p.suggestion === 'string' ? p.suggestion.trim() : '',
        }))
    : [];

  const experience_summary = typeof parsed.experience_summary === 'string' ? parsed.experience_summary.trim() : '';
  const education_feedback = typeof parsed.education_feedback === 'string' ? parsed.education_feedback.trim() : '';
  const final_recommendation = typeof parsed.final_recommendation === 'string' ? parsed.final_recommendation.trim() : '';

  return {
    overall_score,
    ats_score,
    role_match_score,
    strengths,
    missing_skills,
    improvement_suggestions,
    keyword_analysis,
    experience_summary,
    project_feedback,
    education_feedback,
    final_recommendation,
  };
}

async function startServer() {
  const app = express();

  // Middleware to parse JSON payloads up to 10MB
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
    res.json({
      status: 'ok',
      aiConfigured: hasApiKey,
      timestamp: new Date().toISOString(),
    });
  });

  // Resume Analysis API Endpoint
  app.post('/api/analyze-resume', async (req, res) => {
    const { resumeText, targetRole } = req.body;

    // Stage 1: Validate incoming extracted resume text
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 15) {
      console.error('Resume analysis failed: Extracted text is empty or too short (<15 characters).');
      return res.status(400).json({
        success: false,
        error: 'Unable to read this PDF. Please upload a text-readable PDF.',
        message: 'Unable to read this PDF. Please upload a text-readable PDF.',
        stage: 'PDF extraction',
      });
    }

    // Stage 2: Check AI service configuration
    const { client: ai, error: configError } = getGemini();
    if (!ai || configError) {
      console.error('AI request failed: GEMINI_API_KEY environment variable is not configured.');
      return res.status(503).json({
        success: false,
        error: 'AI analysis service is not configured.',
        message: 'Resume analysis is not configured yet. Please try again later.',
        stage: 'AI request',
      });
    }

    const role = targetRole && typeof targetRole === 'string' && targetRole.trim().length > 0
      ? targetRole.trim()
      : 'Software Developer';

    console.log(`[AI request] Starting resume analysis for target role: "${role}". Extracted text character count: ${resumeText.length}`);

    // Stage 3: Send structured prompt to Gemini with resilient model fallback
    let rawResponse: any = null;
    let usedModel = '';
    let lastError: any = null;

    const systemInstruction = `You are a Principal Engineering Recruiter and Senior ATS Placement Specialist.
Your task is to analyze the provided student resume strictly against their target role: "${role}".

CRITICAL INSTRUCTIONS:
- You must return ONLY a single valid raw JSON object adhering to the schema.
- Do NOT include markdown formatting, code fences (\`\`\`json), or conversational text before or after the JSON.
- Calculate realistic, differentiated scores (0 to 100):
  - overall_score: Comprehensive placement readiness score (0-100)
  - ats_score: ATS readability, standardized headers, formatting, keyword presence (0-100)
  - role_match_score: Alignment of skills and projects with industry job expectations for "${role}" (0-100)`;

    const prompt = `TARGET ROLE: ${role}

RESUME TEXT CONTENT:
"""
${resumeText.slice(0, 20000)}
"""

Provide the complete ATS and placement analysis for "${role}" strictly in the requested JSON structure.`;

    for (const modelName of SUPPORTED_MODELS) {
      try {
        console.log(`[AI request] Attempting generation with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overall_score: {
                  type: Type.NUMBER,
                  description: 'Overall placement readiness score between 0 and 100',
                },
                ats_score: {
                  type: Type.NUMBER,
                  description: 'ATS compatibility and parsability score between 0 and 100',
                },
                role_match_score: {
                  type: Type.NUMBER,
                  description: 'Target role match score between 0 and 100',
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of specific strengths identified in the resume (3-5 items)',
                },
                missing_skills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of key missing skills or technologies for this role (3-6 items)',
                },
                improvement_suggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Actionable suggestions to improve the resume (3-5 items)',
                },
                keyword_analysis: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      keyword: { type: Type.STRING },
                      matched: { type: Type.BOOLEAN },
                      category: { type: Type.STRING },
                    },
                    required: ['keyword', 'matched'],
                  },
                  description: 'Crucial keywords for this role indicating matched vs missing',
                },
                experience_summary: {
                  type: Type.STRING,
                  description: 'Brief executive summary of student profile and work/internship quality',
                },
                project_feedback: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      strength: { type: Type.STRING },
                      suggestion: { type: Type.STRING },
                    },
                    required: ['name', 'strength', 'suggestion'],
                  },
                  description: 'Detailed feedback on projects mentioned in the resume',
                },
                education_feedback: {
                  type: Type.STRING,
                  description: 'Feedback on academic background, relevant coursework, and degree presentation',
                },
                final_recommendation: {
                  type: Type.STRING,
                  description: 'Clear and inspiring closing recommendation for placement readiness',
                },
              },
              required: [
                'overall_score',
                'ats_score',
                'role_match_score',
                'strengths',
                'missing_skills',
                'improvement_suggestions',
                'keyword_analysis',
                'experience_summary',
                'project_feedback',
                'education_feedback',
                'final_recommendation',
              ],
            },
          },
        });

        if (response) {
          rawResponse = response;
          usedModel = modelName;
          console.log(`[AI response] Received response successfully using model "${usedModel}".`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI request] Model "${modelName}" attempt failed:`, err?.message || err);
      }
    }

    if (!rawResponse) {
      console.error('AI request failed: All Gemini models failed to generate content:', lastError);
      return res.status(500).json({
        success: false,
        error: 'AI analysis is temporarily unavailable. Please try again.',
        message: 'AI analysis is temporarily unavailable. Please try again.',
        stage: 'AI request',
      });
    }

    // Stage 4: Parse and Validate AI Response using robust parser
    try {
      const normalizedData = parseResumeAnalysisResponse(rawResponse);
      console.log(`[JSON parsing] Analysis validated successfully. Overall: ${normalizedData.overall_score}, ATS: ${normalizedData.ats_score}, RoleMatch: ${normalizedData.role_match_score}`);

      return res.json({
        success: true,
        data: normalizedData,
      });
    } catch (parseErr: any) {
      console.error('Resume analysis parsing failed:', {
        responseType: typeof rawResponse,
        error: parseErr?.message,
      });
      return res.status(502).json({
        success: false,
        error: 'Unable to generate a valid resume analysis. Please try again.',
        message: 'Unable to generate a valid resume analysis. Please try again.',
        stage: 'JSON parsing',
      });
    }
  });

  // Vite middleware in development vs Static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareerPilot AI Full-Stack Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
