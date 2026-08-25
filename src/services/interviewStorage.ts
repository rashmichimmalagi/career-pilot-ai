import { MockInterviewReport } from '../types/interview';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY_PREFIX = 'careerpilot_mock_interviews_';

export const interviewStorage = {
  /**
   * Normalize report object ensuring complete field consistency
   */
  normalizeReport(report: Partial<MockInterviewReport>, studentId?: string): MockInterviewReport {
    const effectiveStudentId = studentId || report.studentId || report.student_id || 'guest';
    const id = report.id || report.interview_id || `interview_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const overallScore = report.overall_score !== undefined ? report.overall_score : (report.overallScore || 0);
    const techScore = report.technical_score !== undefined ? report.technical_score : (report.technicalKnowledgeScore || 0);
    const probScore = report.problem_solving_score !== undefined ? report.problem_solving_score : (report.problemSolvingScore || 0);
    const commScore = report.communication_score !== undefined ? report.communication_score : (report.communicationScore || 0);
    const qCount = report.question_count || report.questionCount || 5;
    const ansCount = report.answered_count !== undefined ? report.answered_count : (report.questionsAnswered || 0);
    const skipCount = report.skipped_count !== undefined ? report.skipped_count : (report.questionsSkipped || 0);
    const completedAt = report.completed_at || report.completedAt || new Date().toISOString();
    const strengths = Array.isArray(report.strengths) ? report.strengths : [];
    const areasForImprovement = report.areas_to_improve || report.areasForImprovement || [];
    const aiRecommendations = report.ai_recommendations || report.aiRecommendations || [];
    const questionEvaluations = Array.isArray(report.question_evaluations) ? report.question_evaluations : (report.questionEvaluations || []);

    return {
      id,
      interview_id: id,
      student_id: effectiveStudentId,
      studentId: effectiveStudentId,
      subject: report.subject || 'Technical Interview',
      topic: report.topic || 'General',
      custom_topic: report.custom_topic || (report.isCustomTopic ? report.customTopicText : report.topic),
      difficulty: report.difficulty || 'Medium',
      language: report.language || 'General',
      questionCount: qCount,
      question_count: qCount,
      questionsAnswered: ansCount,
      answered_count: ansCount,
      questionsSkipped: skipCount,
      skipped_count: skipCount,
      overallScore,
      overall_score: overallScore,
      technicalKnowledgeScore: techScore,
      technical_score: techScore,
      problemSolvingScore: probScore,
      problem_solving_score: probScore,
      communicationScore: commScore,
      communication_score: commScore,
      verdict: report.verdict || (overallScore >= 70 ? 'PASS' : 'NEEDS_WORK'),
      strengths,
      areasForImprovement,
      areas_to_improve: areasForImprovement,
      recommendation: report.recommendation || (aiRecommendations && aiRecommendations[0]) || '',
      aiRecommendations,
      ai_recommendations: aiRecommendations,
      questions: Array.isArray(report.questions) ? report.questions : [],
      answers: report.answers || {},
      questionEvaluations,
      question_evaluations: questionEvaluations,
      completedAt,
      completed_at: completedAt,
      formattedDate: report.formattedDate || new Date(completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  },

  /**
   * Save a completed mock interview report to storage (LocalStorage + Supabase in parallel)
   */
  saveReport(report: MockInterviewReport): void {
    try {
      const normalized = this.normalizeReport(report);
      const effectiveStudentId = normalized.student_id;
      const studentKey = `${STORAGE_KEY_PREFIX}${effectiveStudentId}`;
      const existingReports = this.getReports(effectiveStudentId);
      
      // Filter out duplicate if updating same session id
      const updated = [normalized, ...existingReports.filter((r) => r.id !== normalized.id)];
      localStorage.setItem(studentKey, JSON.stringify(updated));

      // Asynchronous remote persistence to Supabase
      if (isSupabaseConfigured() && effectiveStudentId && effectiveStudentId !== 'guest') {
        (async () => {
          try {
            const rawType = (normalized.subject || 'technical').toLowerCase();
            const normalizedType = rawType.includes('hr') || rawType.includes('behavioral') ? 'hr' : 'technical';
            const overallScore = normalized.overall_score || 0;
            const techScore = normalized.technical_score || 0;
            const commScore = normalized.communication_score || 0;
            const probScore = normalized.problem_solving_score || 0;

            const dbPayload = {
              id: normalized.id,
              user_id: effectiveStudentId,
              interview_type: normalizedType,
              topic: normalized.topic || 'General',
              subject: normalized.subject || 'Technical Interview',
              overall_score: overallScore,
              technical_score: techScore,
              technical_accuracy_score: techScore,
              communication_score: commScore,
              problem_solving_score: probScore,
              confidence_score: 80,
              verdict: normalized.verdict || (overallScore >= 70 ? 'PASS' : 'NEEDS_WORK'),
              strengths: normalized.strengths || [],
              improvements: normalized.areas_to_improve || [],
              areas_to_improve: normalized.areas_to_improve || [],
              ai_recommendations: normalized.ai_recommendations || [],
              detailed_feedback: normalized.recommendation || '',
              answers_evaluated: normalized.answered_count || 0,
              question_count: normalized.question_count || 0,
              answered_count: normalized.answered_count || 0,
              skipped_count: normalized.skipped_count || 0,
              questions: normalized.questions || [],
              answers: Array.isArray(normalized.answers)
                ? normalized.answers
                : normalized.answers && typeof normalized.answers === 'object'
                ? Object.values(normalized.answers)
                : [],
              question_evaluations: normalized.question_evaluations || [],
              full_report: normalized,
              created_at: normalized.completed_at || new Date().toISOString(),
              completed_at: normalized.completed_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            await supabase.from('mock_interviews').upsert(dbPayload, { onConflict: 'id' });
          } catch (err) {
            console.warn('[InterviewStorage] Error persisting to Supabase:', err);
          }
        })();
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('careerpilot_activity_updated', { detail: { studentId: effectiveStudentId } }));
      }
    } catch (err) {
      console.error('[Interview Storage] Failed to save mock interview report:', err);
    }
  },

  /**
   * Get all reports for a specific student (loads from local storage immediately, triggers background cloud sync)
   */
  getReports(studentId?: string): MockInterviewReport[] {
    try {
      const effectiveId = studentId || 'guest';
      const studentKey = `${STORAGE_KEY_PREFIX}${effectiveId}`;
      const raw = localStorage.getItem(studentKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((p) => this.normalizeReport(p, effectiveId));
        }
      }
      return [];
    } catch (err) {
      console.error('[Interview Storage] Failed to read reports:', err);
      return [];
    }
  },

  /**
   * Fetch and sync reports from Supabase (Full bidirectional sync for remote/Vercel environments)
   */
  async fetchReports(studentId: string): Promise<MockInterviewReport[]> {
    const local = this.getReports(studentId);
    if (!isSupabaseConfigured() || !studentId || studentId === 'guest') {
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('user_id', studentId)
        .order('completed_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const remoteReports: MockInterviewReport[] = data.map((row: any) => {
          if (row.full_report && typeof row.full_report === 'object') {
            return this.normalizeReport(row.full_report, studentId);
          }
          return this.normalizeReport({
            id: row.id,
            interview_id: row.id,
            student_id: studentId,
            studentId,
            subject: row.subject || row.target_role || 'Technical Interview',
            topic: row.topic || 'General',
            custom_topic: row.custom_topic,
            difficulty: row.difficulty || 'Medium',
            language: row.language || 'General',
            overall_score: row.overall_score || 0,
            technical_score: row.technical_score || row.technical_accuracy_score || 0,
            communication_score: row.communication_score || 0,
            problem_solving_score: row.problem_solving_score || 0,
            verdict: row.verdict || (row.overall_score >= 70 ? 'PASS' : 'NEEDS_WORK'),
            strengths: Array.isArray(row.strengths) ? row.strengths : [],
            areas_to_improve: Array.isArray(row.areas_to_improve) ? row.areas_to_improve : (Array.isArray(row.improvements) ? row.improvements : []),
            recommendation: row.detailed_feedback || '',
            question_count: row.question_count || 5,
            answered_count: row.answered_count || row.answers_evaluated || 0,
            skipped_count: row.skipped_count || 0,
            questions: Array.isArray(row.questions) ? row.questions : [],
            answers: Array.isArray(row.answers) ? row.answers : [],
            question_evaluations: Array.isArray(row.question_evaluations) ? row.question_evaluations : [],
            completed_at: row.completed_at || row.created_at || new Date().toISOString(),
          }, studentId);
        });

        // Merge remote with local
        const mergedMap = new Map<string, MockInterviewReport>();
        for (const r of remoteReports) {
          mergedMap.set(r.id, r);
        }
        for (const l of local) {
          if (!mergedMap.has(l.id)) {
            mergedMap.set(l.id, l);
            // Upload local item to Supabase if missing
            (async () => {
              try {
                this.saveReport(l);
              } catch (_) {}
            })();
          }
        }

        const merged = Array.from(mergedMap.values());
        merged.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

        // Cache back to local storage
        const studentKey = `${STORAGE_KEY_PREFIX}${studentId}`;
        localStorage.setItem(studentKey, JSON.stringify(merged));

        return merged;
      }
    } catch (err) {
      console.warn('[InterviewStorage] Error fetching remote reports:', err);
    }

    return local;
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
      const results: MockInterviewReport[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                results.push(...parsed);
              }
            } catch (_) {}
          }
        }
      }
      return results;
    } catch (err) {
      return [];
    }
  },
};

