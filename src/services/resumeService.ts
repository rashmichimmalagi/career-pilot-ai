import { ResumeAnalysisPayload, ResumeAnalysisResult } from '../types/resume';

export const resumeService = {
  async analyzeResume(payload: ResumeAnalysisPayload): Promise<ResumeAnalysisResult> {
    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok || !json.success || !json.data) {
        const errorMsg = json?.message || 'Resume analysis is temporarily unavailable. Please try again.';
        throw new Error(errorMsg);
      }

      const data = json.data as ResumeAnalysisResult;

      // Validate structured fields
      if (
        typeof data.overall_score !== 'number' ||
        typeof data.ats_score !== 'number' ||
        typeof data.role_match_score !== 'number'
      ) {
        throw new Error('Unable to generate a valid analysis. Please try again.');
      }

      return data;
    } catch (err: any) {
      console.error('resumeService.analyzeResume error:', err);
      if (err.message && (err.message.includes('Unable to read') || err.message.includes('valid analysis'))) {
        throw err;
      }
      throw new Error('Resume analysis is temporarily unavailable. Please try again.');
    }
  },
};
