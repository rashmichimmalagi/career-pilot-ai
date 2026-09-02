/**
 * Weekly Career Report Types
 * Database schema and delivery types for CareerPilot AI's automated weekly career reports.
 */

export interface WeeklyCareerReportRecord {
  id: string;
  user_id: string;
  period_start: string; // ISO date string
  period_end: string; // ISO date string
  coding_summary: {
    total_submissions: number;
    unique_attempted: number;
    unique_solved: number;
    pass_rate: number;
    topics_practiced: string[];
  };
  aptitude_summary: {
    attempts_count: number;
    average_score: number;
    average_accuracy: number;
  };
  interview_summary: {
    completed_count: number;
    average_score: number;
    technical_score?: number;
    communication_score?: number;
  };
  roadmap_summary: {
    tasks_completed_this_week: number;
    overall_progress_percentage: number;
  };
  resume_summary: {
    latest_score: number;
    score_delta: number;
    versions_count: number;
  };
  readiness_score: number | null;
  readiness_delta: number;
  strengths: Array<{
    area: string;
    metric: string;
    evidence: string;
  }>;
  weaknesses: Array<{
    area: string;
    description: string;
    recommended_action: string;
  }>;
  recommended_focus: Array<{
    title: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    action_route: string;
  }>;
  report_data?: Record<string, any>;
  status: 'sent' | 'generated' | 'failed' | 'skipped';
  created_at: string;
  updated_at: string;
}
