// Supabase Edge Function: analyze-resume
// Deploy command: supabase functions deploy analyze-resume

import { GoogleGenAI, Type } from 'npm:@google/genai@^2.4.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.49.1';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

const SUPPORTED_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

Deno.serve(async (req: Request) => {
  console.log('[analyze-resume Edge Function] Request method:', req.method);

  // 1. CRITICAL: Handle CORS Preflight FIRST before authentication, body parsing, or AI
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  // 2. Reject non-POST HTTP methods with 405 and CORS headers
  if (req.method !== 'POST') {
    console.error(`[analyze-resume] Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({
        error: `Method Not Allowed: ${req.method}. Resume analysis endpoint requires HTTP POST.`,
        code: 'METHOD_NOT_ALLOWED',
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
    // 3. Authenticate User via Supabase JWT (if Supabase configuration is present)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    let authenticatedUserId: string | null = null;

    if (supabaseUrl && supabaseAnonKey && authHeader) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false },
        });

        const token = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
          console.warn('[analyze-resume] JWT verification failed:', authError?.message || 'No user found');
          return new Response(
            JSON.stringify({
              error: 'Unauthorized: Invalid or expired authentication session. Please sign in again.',
              code: 'UNAUTHORIZED',
            }),
            {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        authenticatedUserId = user.id;
        console.log('[analyze-resume] Verified authenticated user:', authenticatedUserId);
      } catch (authEx: any) {
        console.warn('[analyze-resume] Auth validation error:', authEx?.message || authEx);
      }
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON request payload.',
          code: 'BAD_REQUEST',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { resumeText, targetRole, userId, storagePath } = body || {};

    // 4. Multi-User Isolation Check: If frontend provided a userId, verify against JWT
    if (authenticatedUserId && userId && userId !== authenticatedUserId) {
      console.warn('[analyze-resume] User ID mismatch detected. Frontend:', userId, 'JWT:', authenticatedUserId);
      return new Response(
        JSON.stringify({
          error: 'Forbidden: You cannot perform resume operations on behalf of another user.',
          code: 'FORBIDDEN_USER_MISMATCH',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Storage Path Ownership Check
    if (authenticatedUserId && storagePath && typeof storagePath === 'string') {
      const pathPrefix = `${authenticatedUserId}/`;
      if (!storagePath.startsWith(pathPrefix)) {
        console.warn('[analyze-resume] Storage path ownership violation:', storagePath, 'expected prefix:', pathPrefix);
        return new Response(
          JSON.stringify({
            error: 'Forbidden: You can only access resume files stored in your own user directory.',
            code: 'FORBIDDEN_STORAGE_ACCESS',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 6. Validate Inputs
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 15) {
      return new Response(
        JSON.stringify({
          error: 'Resume text is required and must contain readable content (at least 15 characters).',
          code: 'INVALID_RESUME_TEXT',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[analyze-resume] Resume text length:', resumeText.length);

    const role = targetRole && typeof targetRole === 'string' && targetRole.trim().length > 0
      ? targetRole.trim()
      : 'Software Developer';

    // 7. Initialize Gemini AI Client from Server Environment
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[analyze-resume] GEMINI_API_KEY secret is missing.');
      return new Response(
        JSON.stringify({
          error: 'Resume analysis service is temporarily unavailable (Missing AI configuration).',
          code: 'MISSING_AI_CONFIG',
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
      console.error('[analyze-resume] AI generation failed across all models:', lastError?.message || lastError);
      return new Response(
        JSON.stringify({
          error: 'AI analysis service is temporarily busy. Please try again in a few moments.',
          code: 'AI_GENERATION_FAILED',
        }),
        {
          status: 503,
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
        data: parsedData,
        userId: authenticatedUserId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[analyze-resume] Unexpected error:', err?.message || err);
    return new Response(
      JSON.stringify({
        error: 'Unable to generate a valid resume analysis. Please try again.',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
