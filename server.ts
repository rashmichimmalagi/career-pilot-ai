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
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();

  // Middleware to parse JSON payloads up to 10MB
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Resume Analysis API Endpoint
  app.post('/api/analyze-resume', async (req, res) => {
    try {
      const { resumeText, targetRole, pdfBase64 } = req.body;

      if ((!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 20) && !pdfBase64) {
        return res.status(400).json({
          error: 'Resume content is required.',
          message: 'Unable to read this PDF. Please upload another PDF.',
        });
      }

      const role = targetRole && typeof targetRole === 'string' ? targetRole.trim() : 'Software Engineer';
      const ai = getGemini();

      const systemInstruction = `You are a Senior Engineering Hiring Manager and ATS (Applicant Tracking System) Technical Recruiter at top tech companies.
Your job is to thoroughly analyze an engineering student's resume against their target role: "${role}".
Provide actionable, highly specific, constructive feedback tailored to campus placements and tech hiring.

Calculate realistic, differentiated scores (0 to 100):
- overall_score: Comprehensive rating of the resume (0-100)
- ats_score: ATS readability, standard section headers, clean typography, absence of parsing blockers, keyword density (0-100)
- role_match_score: How closely the skills and projects align with the requirements of "${role}" (0-100)

Return your evaluation as a valid JSON object matching the required schema.`;

      let contents: any;
      if (resumeText && resumeText.trim().length >= 20) {
        contents = `Target Role: ${role}\n\nResume Content:\n${resumeText.slice(0, 15000)}`;
      } else if (pdfBase64) {
        contents = [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            text: `Please analyze this resume for the target role: "${role}".`,
          },
        ];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overall_score: {
                type: Type.NUMBER,
                description: 'Overall resume score between 0 and 100',
              },
              ats_score: {
                type: Type.NUMBER,
                description: 'ATS compatibility score between 0 and 100',
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
                description: 'List of key missing skills or technologies for the target role (3-6 items)',
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
                description: 'Crucial keywords for the target role indicating whether they are present in the resume',
              },
              experience_summary: {
                type: Type.STRING,
                description: 'Brief executive summary of the student background and experience quality',
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
                description: 'Detailed feedback on 1-3 key projects mentioned in the resume',
              },
              education_feedback: {
                type: Type.STRING,
                description: 'Feedback on academic background, relevant coursework, and degree details',
              },
              final_recommendation: {
                type: Type.STRING,
                description: 'Inspiring, clear, and actionable closing recommendation for placement readiness',
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

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      const parsedData = JSON.parse(responseText);

      // Clamp scores to valid 0-100 range
      parsedData.overall_score = Math.min(100, Math.max(0, Math.round(parsedData.overall_score || 75)));
      parsedData.ats_score = Math.min(100, Math.max(0, Math.round(parsedData.ats_score || 70)));
      parsedData.role_match_score = Math.min(100, Math.max(0, Math.round(parsedData.role_match_score || 72)));

      // Ensure array safety
      if (!Array.isArray(parsedData.strengths)) parsedData.strengths = [];
      if (!Array.isArray(parsedData.missing_skills)) parsedData.missing_skills = [];
      if (!Array.isArray(parsedData.improvement_suggestions)) parsedData.improvement_suggestions = [];
      if (!Array.isArray(parsedData.keyword_analysis)) parsedData.keyword_analysis = [];
      if (!Array.isArray(parsedData.project_feedback)) parsedData.project_feedback = [];

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Server Resume Analysis Error:', err);
      if (err.message && err.message.includes('GEMINI_API_KEY')) {
        return res.status(500).json({
          error: 'API Key Configuration Issue',
          message: 'Resume analysis is temporarily unavailable. Please try again.',
        });
      }
      return res.status(500).json({
        error: 'Analysis Error',
        message: 'Resume analysis is temporarily unavailable. Please try again.',
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
