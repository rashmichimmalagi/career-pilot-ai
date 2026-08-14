import { ResumeAnalysisPayload, ResumeAnalysisResult } from '../types/resume';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const resumeService = {
  async analyzeResume(payload: ResumeAnalysisPayload): Promise<ResumeAnalysisResult> {
    console.log('[Resume Analyzer] 5. AI request started');

    // 1. If Supabase is configured, try Supabase Edge Function first
    if (isSupabaseConfigured()) {
      console.log('[Resume Analyzer] Attempting Supabase Edge Function: analyze-resume');
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('analyze-resume', {
          body: payload,
        });

        if (!edgeError && edgeData) {
          const resObj = edgeData.data || edgeData;
          if (
            typeof resObj.overall_score === 'number' &&
            typeof resObj.ats_score === 'number' &&
            typeof resObj.role_match_score === 'number'
          ) {
            console.log('[Resume Analyzer] 10. Validation successful via Supabase Edge Function.');
            return resObj as ResumeAnalysisResult;
          }
        } else if (edgeError) {
          console.warn('[Resume Analyzer] Supabase Edge Function invocation warning:', edgeError.message);
        }
      } catch (edgeInvokeErr: any) {
        console.warn('[Resume Analyzer] Supabase Edge Function failed, falling back to server API:', edgeInvokeErr?.message);
      }
    }

    // 2. Full-stack Server API route (POST /api/analyze-resume)
    console.log('[Resume Analyzer] Sending POST request to /api/analyze-resume');
    let response: Response;

    try {
      response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (networkError: any) {
      console.error('[Resume Analyzer] 5. AI request failed (Network error):', networkError?.message || networkError);
      throw new Error('AI request failed: Network connection issue. Please check your connection and try again.');
    }

    console.log(`[Resume Analyzer] 6. AI request completed (HTTP ${response.status} ${response.statusText})`);

    let responseText = '';
    try {
      responseText = await response.text();
    } catch (textErr: any) {
      console.error('[Resume Analyzer] 7/8. AI response extraction failed:', textErr?.message || textErr);
      throw new Error('AI response extraction failed: Unable to read server response.');
    }

    console.log('[Resume Analyzer] 7. AI response received');

    if (!response.ok) {
      if (response.status === 405) {
        console.error('[Resume Analyzer] API returned 405', {
          endpoint: '/api/analyze-resume',
          method: 'POST',
          status: response.status,
        });
      } else {
        console.error('[Resume Analyzer] Resume analysis API error:', {
          endpoint: '/api/analyze-resume',
          method: 'POST',
          status: response.status,
          statusText: response.statusText,
          response: responseText,
        });
      }

      let serverMessage = '';
      try {
        const errorJson = JSON.parse(responseText);
        serverMessage = errorJson.message || errorJson.error || '';
      } catch {
        serverMessage = responseText ? responseText.slice(0, 150) : '';
      }

      throw new Error(
        `Resume analysis API failed: HTTP ${response.status}${serverMessage ? ` - ${serverMessage}` : ''}`
      );
    }

    let json: any;
    try {
      json = JSON.parse(responseText);
      console.log('[Resume Analyzer] 8. Response text extracted');
      console.log('[Resume Analyzer] 9. JSON parsing successful.');
    } catch (parseError: any) {
      console.error('Invalid JSON from resume analysis API:', responseText);
      throw new Error(`Resume analysis API returned invalid JSON: ${parseError?.message || 'Parse error'}`);
    }

    if (!json || !json.success || !json.data) {
      const stage = json?.stage || 'AI response';
      const devError = json?.error || 'Invalid API response format';
      const userMessage = json?.message || `AI analysis failed at stage: ${stage}`;

      console.error(`[Resume Analyzer] Failure at stage "${stage}":`, devError);
      throw new Error(userMessage);
    }

    const data = json.data as ResumeAnalysisResult;

    // Stage 10: Client schema validation
    if (
      typeof data.overall_score !== 'number' ||
      typeof data.ats_score !== 'number' ||
      typeof data.role_match_score !== 'number'
    ) {
      console.error('[Resume Analyzer] 10. Validation failed: Missing or non-numeric score fields in received data:', data);
      throw new Error('AI response validation failed: Missing or non-numeric score fields.');
    }

    console.log('[Resume Analyzer] 10. Validation successful.');
    return data;
  },

  async testAI(): Promise<{ success: boolean; model?: string; latencyMs?: number; error?: string }> {
    try {
      const res = await fetch('/api/test-ai');
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during test' };
    }
  },
};

