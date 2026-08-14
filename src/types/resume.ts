export interface ProjectFeedbackItem {
  name: string;
  strength: string;
  suggestion: string;
}

export interface KeywordAnalysisItem {
  keyword: string;
  matched: boolean;
  category?: string;
}

export interface ResumeAnalysisResult {
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

export interface ResumeAnalysisPayload {
  resumeText: string;
  targetRole: string;
  pdfBase64?: string;
}
