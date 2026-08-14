import { ResumeAnalysisPayload, ResumeAnalysisResult } from '../types/resume';

export const resumeService = {
  async analyzeResume(payload: ResumeAnalysisPayload): Promise<ResumeAnalysisResult> {
    console.log('[Resume Analyzer] 5. AI request started');
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

    let rawText = '';
    try {
      rawText = await response.text();
    } catch (textErr: any) {
      console.error('[Resume Analyzer] 7/8. AI response extraction failed:', textErr?.message || textErr);
      throw new Error('AI response extraction failed: Unable to read server response.');
    }

    console.log('[Resume Analyzer] 7. AI response received');

    let json: any;
    try {
      json = JSON.parse(rawText);
      console.log('[Resume Analyzer] 9. JSON parsing successful.');
    } catch (jsonErr: any) {
      console.error('[Resume Analyzer] 9. AI response JSON parsing failed:', {
        rawSnippet: rawText.slice(0, 150),
        error: jsonErr?.message,
      });
      throw new Error(`AI response JSON parsing failed (HTTP ${response.status}): ${jsonErr?.message || 'Invalid JSON'}`);
    }

    if (!response.ok || !json.success || !json.data) {
      const stage = json?.stage || 'AI request';
      const devError = json?.error || `HTTP ${response.status} error`;
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
