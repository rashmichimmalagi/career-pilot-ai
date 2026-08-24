import { MockInterviewReport } from '../types/interview';

const STORAGE_KEY_PREFIX = 'careerpilot_mock_interviews_';

export const interviewStorage = {
  /**
   * Save a completed mock interview report to storage
   */
  saveReport(report: MockInterviewReport): void {
    try {
      const effectiveStudentId = report.studentId || report.student_id || 'guest';
      // Normalize both camelCase and snake_case keys for complete compatibility
      const normalizedReport: MockInterviewReport = {
        ...report,
        interview_id: report.interview_id || report.id,
        student_id: effectiveStudentId,
        studentId: effectiveStudentId,
        custom_topic: report.custom_topic || (report.isCustomTopic ? report.customTopicText : report.topic),
        question_count: report.question_count || report.questionCount,
        answered_count: report.answered_count !== undefined ? report.answered_count : report.questionsAnswered,
        skipped_count: report.skipped_count !== undefined ? report.skipped_count : report.questionsSkipped,
        overall_score: report.overall_score !== undefined ? report.overall_score : report.overallScore,
        technical_score: report.technical_score !== undefined ? report.technical_score : report.technicalKnowledgeScore,
        problem_solving_score: report.problem_solving_score !== undefined ? report.problem_solving_score : report.problemSolvingScore,
        communication_score: report.communication_score !== undefined ? report.communication_score : report.communicationScore,
        areas_to_improve: report.areas_to_improve || report.areasForImprovement,
        recommendation: report.recommendation || (report.aiRecommendations && report.aiRecommendations[0]) || '',
        completed_at: report.completed_at || report.completedAt || new Date().toISOString(),
      };

      const studentKey = `${STORAGE_KEY_PREFIX}${effectiveStudentId}`;
      const existingReports = this.getReports(effectiveStudentId);
      
      // Filter out duplicate if updating same session id
      const updated = [normalizedReport, ...existingReports.filter((r) => r.id !== normalizedReport.id)];
      localStorage.setItem(studentKey, JSON.stringify(updated));
    } catch (err) {
      console.error('[Interview Storage] Failed to save mock interview report:', err);
    }
  },

  /**
   * Get all reports for a specific student (strictly student-isolated)
   */
  getReports(studentId?: string): MockInterviewReport[] {
    try {
      const effectiveId = studentId || 'guest';
      const studentKey = `${STORAGE_KEY_PREFIX}${effectiveId}`;
      const raw = localStorage.getItem(studentKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch (err) {
      console.error('[Interview Storage] Failed to read reports:', err);
      return [];
    }
  },

  /**
   * Get a single report by unique report ID
   */
  getReportById(id: string): MockInterviewReport | null {
    try {
      const all = this.getAllReports();
      const found = all.find((r) => r.id === id);
      return found || null;
    } catch (err) {
      console.error('[Interview Storage] Failed to find report by id:', err);
      return null;
    }
  },

  /**
   * Get all mock interview reports across local storage
   */
  getAllReports(): MockInterviewReport[] {
    try {
      const globalKey = `${STORAGE_KEY_PREFIX}all`;
      const raw = localStorage.getItem(globalKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch (err) {
      return [];
    }
  },
};
