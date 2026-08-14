import { ResumeAnalysisPayload, ResumeAnalysisResult } from '../types/resume';

export const resumeService = {
  async analyzeResume(payload: ResumeAnalysisPayload): Promise<ResumeAnalysisResult> {
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
      console.error('[AI request] Failure stage: Network connection failure during analyzeResume:', networkError);
      throw new Error('Unable to connect to the analysis service. Please check your connection and try again.');
    }

    let json: any;
    try {
      json = await response.json();
    } catch (jsonErr: any) {
      console.error('[AI response] Failure stage: Non-JSON response received from server:', jsonErr);
      throw new Error('Unable to generate a valid resume analysis. Please try again.');
    }

    if (!response.ok || !json.success || !json.data) {
      const stage = json?.stage || 'AI request';
      const devError = json?.error || 'Server error';
      const userMessage = json?.message || 'AI analysis is temporarily unavailable. Please try again.';

      console.error(`[${stage}] Server returned an error:`, devError);
      throw new Error(userMessage);
    }

    const data = json.data as ResumeAnalysisResult;

    // Validate structured fields
    if (
      typeof data.overall_score !== 'number' ||
      typeof data.ats_score !== 'number' ||
      typeof data.role_match_score !== 'number'
    ) {
      console.error('[JSON parsing] Failure stage: Missing or non-numeric score fields in received data:', data);
      throw new Error('Unable to generate a valid resume analysis. Please try again.');
    }

    return data;
  },
};
