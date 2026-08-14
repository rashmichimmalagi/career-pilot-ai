import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      console.error('[PDF extraction] Failure stage: Resume text received by server is empty or invalid.');
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
      console.error('[AI request] Failure stage: AI analysis service is not configured (missing GEMINI_API_KEY).');
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

    console.log(`[AI request] Starting resume analysis for role: "${role}". Resume text length: ${resumeText.length}`);

    // Stage 3: Send structured prompt to Gemini with resilient model fallback
    let responseText = '';
    let usedModel = '';
    let lastError: any = null;

    const systemInstruction = `You are a Senior Engineering Hiring Manager and ATS Placement Specialist.
Your task is to analyze the student resume strictly against their target role: "${role}".
Calculate realistic, differentiated scores (0 to 100):
- overall_score: Comprehensive placement readiness score (0-100)
- ats_score: ATS readability, standardized headers, formatting, keyword presence (0-100)
- role_match_score: Alignment of skills and projects with industry job expectations for "${role}" (0-100)

Return a valid JSON object matching the requested schema.`;

    const prompt = `TARGET ROLE: ${role}

RESUME TEXT CONTENT:
"""
${resumeText.slice(0, 20000)}
"""

Please evaluate this resume for the "${role}" role and provide full structured ATS analysis.`;

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
                  description: 'Actionable numbered suggestions to improve the resume (3-5 items)',
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

        if (response.text && response.text.trim().length > 0) {
          responseText = response.text;
          usedModel = modelName;
          console.log(`[AI response] Received response successfully using model "${usedModel}". Length: ${responseText.length}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI request] Model "${modelName}" failed, attempting next fallback model:`, err.message || err);
      }
    }

    if (!responseText || responseText.trim() === '') {
      console.error('[AI response] Failure stage: All Gemini models failed to generate content:', lastError);
      return res.status(500).json({
        success: false,
        error: 'AI analysis is temporarily unavailable. Please try again.',
        message: 'AI analysis is temporarily unavailable. Please try again.',
        stage: 'AI response',
      });
    }

    // Stage 4: Parse and Validate AI Response JSON
    try {
      const parsedData = JSON.parse(responseText);

      // Validate numeric score ranges (0 to 100)
      const overall = typeof parsedData.overall_score === 'number' ? parsedData.overall_score : 75;
      const ats = typeof parsedData.ats_score === 'number' ? parsedData.ats_score : 70;
      const roleMatch = typeof parsedData.role_match_score === 'number' ? parsedData.role_match_score : 72;

      parsedData.overall_score = Math.min(100, Math.max(0, Math.round(overall)));
      parsedData.ats_score = Math.min(100, Math.max(0, Math.round(ats)));
      parsedData.role_match_score = Math.min(100, Math.max(0, Math.round(roleMatch)));

      // Validate array fields
      if (!Array.isArray(parsedData.strengths)) parsedData.strengths = [];
      if (!Array.isArray(parsedData.missing_skills)) parsedData.missing_skills = [];
      if (!Array.isArray(parsedData.improvement_suggestions)) parsedData.improvement_suggestions = [];
      if (!Array.isArray(parsedData.keyword_analysis)) parsedData.keyword_analysis = [];
      if (!Array.isArray(parsedData.project_feedback)) parsedData.project_feedback = [];

      // Validate string fields
      if (typeof parsedData.experience_summary !== 'string') parsedData.experience_summary = '';
      if (typeof parsedData.education_feedback !== 'string') parsedData.education_feedback = '';
      if (typeof parsedData.final_recommendation !== 'string') parsedData.final_recommendation = '';

      console.log(`[JSON parsing] Successfully parsed and validated resume analysis. Overall: ${parsedData.overall_score}, ATS: ${parsedData.ats_score}, RoleMatch: ${parsedData.role_match_score}`);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (parseErr: any) {
      console.error('[JSON parsing] Failure stage: JSON parsing error:', parseErr);
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
