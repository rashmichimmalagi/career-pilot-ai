// Supabase Edge Function: analyze-resume
// Deploy with: supabase functions deploy analyze-resume --no-verify-jwt

import { GoogleGenAI, Type } from 'npm:@google/genai@^2.4.0';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPPORTED_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-flash-latest',
];

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  // 2. Enforce HTTP POST
  if (req.method !== 'POST') {
    console.error(`[Resume Analyzer] Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({
        success: false,
        stage: 'HTTP Method',
        error: `Method Not Allowed: ${req.method}. Resume analysis endpoint requires HTTP POST.`,
        message: 'Method Not Allowed. Please send a POST request.',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          stage: 'Payload Parsing',
          error: 'Invalid JSON request payload.',
          message: 'Malformed JSON payload.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { resumeText, targetRole } = body || {};

    // 3. Validate Inputs
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 15) {
      return new Response(
        JSON.stringify({
          success: false,
          stage: 'PDF extraction',
          error: 'PDF extraction failed: Text length is too short or empty.',
          message: 'Unable to read this PDF. Please upload a text-readable PDF.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const role = targetRole && typeof targetRole === 'string' && targetRole.trim().length > 0
      ? targetRole.trim()
      : 'Software Developer';

    // 4. Initialize Gemini AI Client
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[Resume Analyzer] GEMINI_API_KEY secret is missing in Edge Function environment.');
      return new Response(
        JSON.stringify({
          success: false,
          stage: 'AI configuration',
          error: 'AI provider API key is not configured in Edge Function secrets.',
          message: 'Resume analysis service is temporarily unavailable.',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

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

    const schemaConfig = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overall_score: { type: Type.NUMBER },
          ats_score: { type: Type.NUMBER },
          role_match_score: { type: Type.NUMBER },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvement_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
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
          },
          experience_summary: { type: Type.STRING },
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
          },
          education_feedback: { type: Type.STRING },
          final_recommendation: { type: Type.STRING },
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
    };

    let rawResponse: any = null;
    let lastError: any = null;

    for (const modelName of SUPPORTED_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: schemaConfig,
        });
        if (response) {
          rawResponse = response;
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!rawResponse) {
      return new Response(
        JSON.stringify({
          success: false,
          stage: 'AI request',
          error: `AI request failed: ${lastError?.message || 'Upstream provider error'}`,
          message: 'AI analysis is temporarily unavailable. Please try again.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract text and parse JSON
    let text = rawResponse.text || '';
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsedData = JSON.parse(text);

    return new Response(
      JSON.stringify({
        success: true,
        stage: 'Validation',
        data: parsedData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        stage: 'Execution',
        error: err?.message || 'Internal server error',
        message: 'Unable to generate a valid resume analysis. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
