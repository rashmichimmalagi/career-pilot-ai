import { ResumeAnalysisPayload, ResumeAnalysisResult } from '../types/resume';
import { supabase } from '../lib/supabase';

export const resumeService = {
  async analyzeResume(payload: ResumeAnalysisPayload): Promise<ResumeAnalysisResult> {
    console.log('[Resume Analyzer] 5. AI request started');
    console.log('[Resume Analyzer] 6. Supabase Edge Function: analyze-resume');

    // Validate payload before invocation
    if (!payload.resumeText || payload.resumeText.trim().length < 15) {
      throw new Error('Unable to read this PDF. Please upload a readable text resume.');
    }

    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resumeText: payload.resumeText,
          targetRole: payload.targetRole || 'Software Developer',
        },
      });

      if (error) {
        console.error('[Resume Analyzer] Edge Function error encountered:', error);

        // Check if there is details in error
        let errorMessage = error.message || '';
        if (errorMessage.includes('Failed to send a request') || errorMessage.includes('CORS') || errorMessage.includes('fetch')) {
          errorMessage = 'Resume analysis service connection issue. Please ensure the analyze-resume Edge Function is deployed with CORS enabled.';
        } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('JWT')) {
          errorMessage = 'Please sign in again.';
        } else if (errorMessage.includes('503') || errorMessage.includes('temporarily unavailable')) {
          errorMessage = 'Resume analysis service is temporarily unavailable.';
        }

        throw new Error(errorMessage || 'Resume analysis service is temporarily unavailable. Please try again.');
      }

      console.log('[Resume Analyzer] 7. AI response received');

      if (!data) {
        console.error('[Resume Analyzer] Edge Function returned empty data');
        throw new Error('Unable to generate a valid resume analysis.');
      }

      const result: ResumeAnalysisResult = data.data || data;

      // Validate required score fields
      if (
        typeof result.overall_score !== 'number' ||
        typeof result.ats_score !== 'number' ||
        typeof result.role_match_score !== 'number'
      ) {
        console.error('[Resume Analyzer] 10. Validation failed: Missing or invalid score fields:', result);
        throw new Error('Unable to generate a valid resume analysis.');
      }

      console.log('[Resume Analyzer] 8. Response text extracted');
      console.log('[Resume Analyzer] 9. JSON parsing successful.');
      console.log('[Resume Analyzer] 10. Validation successful.');

      return result;
    } catch (err: any) {
      console.error('[Resume Analyzer] Analysis invocation error:', err?.message || err);
      throw err instanceof Error ? err : new Error(err?.message || 'Resume analysis service is temporarily unavailable.');
    }
  },

  async testAI(): Promise<{ success: boolean; model?: string; latencyMs?: number; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resumeText: 'Test Resume text with skills and experience for validation.',
          targetRole: 'Software Engineer',
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, model: 'gemini-flash' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during test' };
    }
  },
};


