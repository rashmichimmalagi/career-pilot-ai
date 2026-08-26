import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ResumeVersionItem } from '../types/resume';
import { MockInterviewReport } from '../types/interview';
import { PlacementTestSession } from '../types/placement';
import { StudentTargetCompany } from '../types/companyPrep';
import { DailyRoadmapTask } from '../types/roadmap';

export interface LocalHarvestSummary {
  resumes: ResumeVersionItem[];
  codingSubmissions: any[];
  savedQuestions: any[];
  mockInterviews: MockInterviewReport[];
  placementSessions: PlacementTestSession[];
  companyTargets: StudentTargetCompany[];
  roadmapTasks: DailyRoadmapTask[];
  completedRoadmapItemIds: string[];
  studyPlan: any | null;
  badges: string[];
  longestStreak: number;
  extendedProfile: Record<string, any> | null;
  mentorChatCount: number;
  totalItems: number;
}

export interface CloudSyncResult {
  success: boolean;
  uploadedCounts: {
    resumes: number;
    codingSubmissions: number;
    savedQuestions: number;
    mockInterviews: number;
    placementSessions: number;
    profileMeta: boolean;
  };
  cloudRecordCounts: {
    resumes: number;
    codingSubmissions: number;
    savedQuestions: number;
    mockInterviews: number;
    placementSessions: number;
  };
  errors: string[];
  lastSyncedAt: string;
}

/**
 * CareerPilot Cloud Synchronization & Data Convergence Service
 * Connects AI Studio practice records and Vercel production environment to Supabase
 * as the authoritative, permanent cloud source of truth.
 */
export const cloudSyncService = {
  /**
   * 1. Safely harvest all student practice records from browser localStorage
   * across current and legacy key namespaces.
   */
  harvestAllLocalData(targetUserId?: string): LocalHarvestSummary {
    const summary: LocalHarvestSummary = {
      resumes: [],
      codingSubmissions: [],
      savedQuestions: [],
      mockInterviews: [],
      placementSessions: [],
      companyTargets: [],
      roadmapTasks: [],
      completedRoadmapItemIds: [],
      studyPlan: null,
      badges: [],
      longestStreak: 0,
      extendedProfile: null,
      mentorChatCount: 0,
      totalItems: 0,
    };

    if (typeof window === 'undefined' || !window.localStorage) {
      return summary;
    }

    try {
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('careerpilot_')) {
          allKeys.push(key);
        }
      }

      // 1. Coding Submissions (Merge all keys)
      const submissionMap = new Map<string, any>();
      allKeys
        .filter((k) => k === 'careerpilot_all_submissions' || k.startsWith('careerpilot_subs_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                list.forEach((sub) => {
                  if (sub && (sub.id || sub.problem_id || sub.problem_title)) {
                    const id = sub.id || `${sub.problem_id || 'prob'}_${sub.submitted_at || Date.now()}`;
                    submissionMap.set(id, { ...sub, id });
                  }
                });
              }
            }
          } catch (_) {}
        });
      summary.codingSubmissions = Array.from(submissionMap.values());

      // 2. Mock Interviews
      const interviewMap = new Map<string, MockInterviewReport>();
      allKeys
        .filter((k) => k === 'careerpilot_mock_interviews_all' || k.startsWith('careerpilot_mock_interviews_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                list.forEach((intv) => {
                  if (intv && (intv.id || intv.created_at || (intv as any).completedAt)) {
                    const id = intv.id || `intv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                    interviewMap.set(id, { ...intv, id });
                  }
                });
              }
            }
          } catch (_) {}
        });
      summary.mockInterviews = Array.from(interviewMap.values());

      // 3. Resumes
      const resumeMap = new Map<string, ResumeVersionItem>();
      allKeys
        .filter((k) => k.startsWith('careerpilot_resumes_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                list.forEach((res) => {
                  if (res && res.id) {
                    resumeMap.set(res.id, res);
                  }
                });
              }
            }
          } catch (_) {}
        });
      summary.resumes = Array.from(resumeMap.values());

      // Check for standalone latest resume analysis if no resume record
      allKeys
        .filter((k) => k.startsWith('careerpilot_latest_resume_analysis_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.result && typeof parsed.result.overall_score === 'number') {
                if (summary.resumes.length === 0) {
                  const fallbackResume: ResumeVersionItem = {
                    id: parsed.resumeId || `resume_${Date.now()}`,
                    userId: targetUserId || 'guest',
                    fileName: 'Resume_Analysis.pdf',
                    targetRole: parsed.targetRole || 'Software Developer',
                    resumeText: parsed.resumeText || '',
                    analysisResult: parsed.result,
                    isCurrent: true,
                    version: 1,
                    versionLabel: 'Version 1.0 (Analyzed)',
                    createdAt: parsed.analyzedAt || new Date().toISOString(),
                    updatedAt: parsed.analyzedAt || new Date().toISOString(),
                  };
                  summary.resumes.push(fallbackResume);
                }
              }
            }
          } catch (_) {}
        });

      // 4. Placement Sessions
      const placementMap = new Map<string, PlacementTestSession>();
      allKeys
        .filter((k) => k.startsWith('careerpilot_placement_sessions_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                list.forEach((sess) => {
                  if (sess && (sess.id || sess.created_at || (sess as any).completedAt)) {
                    const id = sess.id || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                    placementMap.set(id, { ...sess, id });
                  }
                });
              }
            }
          } catch (_) {}
        });
      summary.placementSessions = Array.from(placementMap.values());

      // 5. Saved Questions
      const savedMap = new Map<string, any>();
      allKeys
        .filter((k) => k === 'careerpilot_saved_problems' || k.startsWith('careerpilot_saved_questions_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                list.forEach((q) => {
                  const qId = q.problem_id || q.id || q.problem_title;
                  if (qId) savedMap.set(String(qId), q);
                });
              }
            }
          } catch (_) {}
        });
      summary.savedQuestions = Array.from(savedMap.values());

      // 6. Company Targets
      const targetMap = new Map<string, StudentTargetCompany>();
      allKeys
        .filter((k) => k.startsWith('careerpilot_company_targets_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                list.forEach((t) => {
                  if (t && (t.id || t.companyName)) {
                    const id = t.id || t.companyName;
                    targetMap.set(id, t);
                  }
                });
              }
            }
          } catch (_) {}
        });
      summary.companyTargets = Array.from(targetMap.values());

      // 7. Roadmap Tasks
      allKeys
        .filter((k) => k.startsWith('careerpilot_roadmap_tasks_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list) && list.length > summary.roadmapTasks.length) {
                summary.roadmapTasks = list;
              }
            }
          } catch (_) {}
        });

      // 8. Roadmap Completed Items
      const completedSet = new Set<string>();
      allKeys
        .filter((k) => k.startsWith('careerpilot_roadmap_completed_items_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                list.forEach((item) => completedSet.add(String(item)));
              }
            }
          } catch (_) {}
        });
      summary.completedRoadmapItemIds = Array.from(completedSet);

      // 9. Badges & Streaks
      allKeys
        .filter((k) => k.startsWith('careerpilot_unlocked_badges_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                list.forEach((b) => {
                  if (typeof b === 'string' && !summary.badges.includes(b)) summary.badges.push(b);
                });
              }
            }
          } catch (_) {}
        });

      allKeys
        .filter((k) => k.startsWith('careerpilot_longest_streak_') || k.startsWith('careerpilot_current_streak_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const val = parseInt(raw, 10);
              if (!isNaN(val) && val > summary.longestStreak) {
                summary.longestStreak = val;
              }
            }
          } catch (_) {}
        });

      // 10. Extended Profile
      allKeys
        .filter((k) => k.startsWith('careerpilot_extended_profile_'))
        .forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === 'object') {
                summary.extendedProfile = { ...(summary.extendedProfile || {}), ...parsed };
              }
            }
          } catch (_) {}
        });

      summary.totalItems =
        summary.resumes.length +
        summary.codingSubmissions.length +
        summary.savedQuestions.length +
        summary.mockInterviews.length +
        summary.placementSessions.length +
        summary.companyTargets.length +
        summary.roadmapTasks.length;
    } catch (err) {
      console.warn('[CloudSync] Error harvesting local data:', err);
    }

    return summary;
  },

  /**
   * 2. Non-destructively upload local practice data to Supabase
   */
  async syncLocalDataToCloud(userId: string): Promise<CloudSyncResult> {
    const result: CloudSyncResult = {
      success: true,
      uploadedCounts: {
        resumes: 0,
        codingSubmissions: 0,
        savedQuestions: 0,
        mockInterviews: 0,
        placementSessions: 0,
        profileMeta: false,
      },
      cloudRecordCounts: {
        resumes: 0,
        codingSubmissions: 0,
        savedQuestions: 0,
        mockInterviews: 0,
        placementSessions: 0,
      },
      errors: [],
      lastSyncedAt: new Date().toISOString(),
    };

    if (!isSupabaseConfigured() || !userId || userId === 'guest') {
      result.success = false;
      result.errors.push('Supabase is not configured or user is not authenticated.');
      return result;
    }

    const localData = this.harvestAllLocalData(userId);

    // A. Sync Resumes
    try {
      if (localData.resumes.length > 0) {
        for (const item of localData.resumes) {
          const analysisObj = item.analysisResult as any;
          const atsScore = Number(
            analysisObj?.overall_score ??
            analysisObj?.overallScore ??
            analysisObj?.ats_score ??
            analysisObj?.atsScore ??
            0
          ) || 0;

          const analysisBundle = {
            ...(item.analysisResult || {}),
            _fileSize: item.fileSize,
            _fileUrl: item.fileUrl,
            _storagePath: item.storagePath,
            _resumeType: item.resumeType,
            _isAiImproved: item.isAiImproved,
            _parentResumeId: item.parentResumeId,
            _improvedData: item.improvedData,
            _comparisonData: item.comparisonData,
            _studentAnswers: item.studentAnswers,
            _structuredData: item.structuredData,
          };

          const payload = {
            id: item.id,
            user_id: userId,
            file_name: item.fileName || item.versionLabel || 'Resume.pdf',
            target_role: item.targetRole || 'Software Developer',
            resume_text: item.resumeText || '',
            analysis_result: analysisBundle,
            ats_score: atsScore,
            is_current: item.isCurrent !== undefined ? item.isCurrent : true,
            version: Number(item.version) || 1,
            version_label: item.versionLabel || `Resume_v${item.version || 1}.pdf`,
            storage_path: item.storagePath || '',
            created_at: item.createdAt || new Date().toISOString(),
            updated_at: item.updatedAt || new Date().toISOString(),
          };

          const { error } = await supabase.from('resumes').upsert(payload, { onConflict: 'id' });
          if (error) {
            console.warn('[CloudSync] Resume upsert warning:', error);
          } else {
            result.uploadedCounts.resumes++;
          }
        }
      }
    } catch (e: any) {
      result.errors.push(`Resumes sync error: ${e.message}`);
    }

    // B. Sync Coding Submissions
    try {
      if (localData.codingSubmissions.length > 0) {
        for (const sub of localData.codingSubmissions) {
          const submissionId = sub.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const totalTC = typeof sub.total_test_cases === 'number' && sub.total_test_cases > 0
            ? sub.total_test_cases
            : 5;
          let passedTC = typeof sub.test_cases_passed === 'number'
            ? Math.max(0, Math.min(sub.test_cases_passed, totalTC))
            : (sub.status?.toLowerCase() === 'accepted' ? totalTC : 0);

          let status = (sub.status || '').toLowerCase().trim();
          if (passedTC === totalTC && totalTC > 0) {
            status = 'accepted';
          } else {
            if (status === 'accepted' || !status) {
              status = 'wrong_answer';
            }
          }
          const statusText = status === 'accepted' ? 'Accepted' : (sub.status_text || sub.statusText || 'Wrong Answer');

          const payload = {
            id: submissionId,
            user_id: userId,
            problem_id: String(sub.problem_id || sub.problemId || submissionId),
            problem_title: sub.problem_title || sub.problemTitle || 'Coding Problem',
            language: sub.language || 'javascript',
            code: sub.code || sub.submitted_code || '',
            status: status,
            status_text: statusText,
            test_cases_passed: passedTC,
            total_test_cases: totalTC,
            execution_time_ms: typeof sub.execution_time_ms === 'number' ? sub.execution_time_ms : (typeof sub.runtime_ms === 'number' ? sub.runtime_ms : 45),
            runtime_ms: typeof sub.runtime_ms === 'number' ? sub.runtime_ms : (typeof sub.execution_time_ms === 'number' ? sub.execution_time_ms : 45),
            memory_kb: typeof sub.memory_kb === 'number' ? sub.memory_kb : 14200,
            memory_used_kb: typeof sub.memory_used_kb === 'number' ? sub.memory_used_kb : 14200,
            time_complexity: sub.time_complexity || '',
            space_complexity: sub.space_complexity || '',
            topic: sub.topic || sub.subject || 'DSA',
            difficulty: sub.difficulty || 'Medium',
            ai_feedback: sub.ai_feedback || {},
            submitted_at: sub.submitted_at || sub.submittedAt || sub.created_at || new Date().toISOString(),
            created_at: sub.created_at || sub.submitted_at || new Date().toISOString(),
          };

          const { error } = await supabase.from('coding_submissions').upsert(payload, { onConflict: 'id' });
          if (error) {
            console.warn('[CloudSync] Coding submission upsert warning:', error);
          } else {
            result.uploadedCounts.codingSubmissions++;
          }
        }
      }
    } catch (e: any) {
      result.errors.push(`Coding submissions sync error: ${e.message}`);
    }

    // C. Sync Saved Questions
    try {
      if (localData.savedQuestions.length > 0) {
        for (const q of localData.savedQuestions) {
          const qId = q.problem_id || q.id || `saved_${Date.now()}`;
          const payload = {
            id: qId,
            user_id: userId,
            problem_id: String(q.problem_id || qId),
            problem_title: q.problem_title || q.title || 'Saved Problem',
            difficulty: q.difficulty || 'Medium',
            topic: q.topic || 'DSA',
            saved_at: q.saved_at || new Date().toISOString(),
          };

          const { error } = await supabase.from('saved_coding_questions').upsert(payload, { onConflict: 'id' });
          if (!error) {
            result.uploadedCounts.savedQuestions++;
          }
        }
      }
    } catch (e: any) {
      result.errors.push(`Saved questions sync error: ${e.message}`);
    }

    // D. Sync Mock Interviews
    try {
      if (localData.mockInterviews.length > 0) {
        for (const intv of localData.mockInterviews) {
          const intvId = intv.id || (intv as any).interview_id || `intv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          
          const rawType = (intv.interview_type || (intv as any).interviewType || intv.subject || 'technical').toLowerCase();
          const normalizedType = rawType.includes('hr') || rawType.includes('behavioral') ? 'hr' : 'technical';
          
          const overallScore = typeof intv.overall_score === 'number' ? intv.overall_score : (typeof (intv as any).overallScore === 'number' ? (intv as any).overallScore : 75);
          const techScore = typeof intv.technical_score === 'number' ? intv.technical_score : (typeof (intv as any).technicalKnowledgeScore === 'number' ? (intv as any).technicalKnowledgeScore : (typeof (intv as any).technical_accuracy_score === 'number' ? (intv as any).technical_accuracy_score : overallScore));
          const commScore = typeof intv.communication_score === 'number' ? intv.communication_score : (typeof (intv as any).communicationScore === 'number' ? (intv as any).communicationScore : overallScore);
          const probScore = typeof intv.problem_solving_score === 'number' ? intv.problem_solving_score : (typeof (intv as any).problemSolvingScore === 'number' ? (intv as any).problemSolvingScore : overallScore);
          
          const strengths = Array.isArray(intv.strengths) ? intv.strengths : [];
          const improvements = Array.isArray(intv.areas_to_improve) ? intv.areas_to_improve : (Array.isArray((intv as any).areasForImprovement) ? (intv as any).areasForImprovement : (Array.isArray((intv as any).improvements) ? (intv as any).improvements : []));
          const aiRecs = Array.isArray((intv as any).ai_recommendations) ? (intv as any).ai_recommendations : (Array.isArray((intv as any).aiRecommendations) ? (intv as any).aiRecommendations : []);
          const detailedFeedback = (intv as any).detailed_feedback || (intv as any).detailedFeedback || intv.recommendation || (intv as any).feedback || '';
          
          const qCount = intv.question_count || (intv as any).questionCount || (Array.isArray(intv.questions) ? intv.questions.length : 5);
          const ansCount = intv.answered_count !== undefined ? intv.answered_count : ((intv as any).questionsAnswered !== undefined ? (intv as any).questionsAnswered : qCount);
          const skipCount = intv.skipped_count !== undefined ? intv.skipped_count : ((intv as any).questionsSkipped !== undefined ? (intv as any).questionsSkipped : 0);

          const payload = {
            id: intvId,
            user_id: userId,
            interview_type: normalizedType,
            topic: intv.topic || 'General Technical',
            subject: intv.subject || intv.topic || 'Technical Interview',
            overall_score: overallScore,
            technical_score: techScore,
            technical_accuracy_score: techScore,
            communication_score: commScore,
            problem_solving_score: probScore,
            confidence_score: (intv as any).confidence_score || (intv as any).confidenceScore || 80,
            verdict: intv.verdict || (overallScore >= 70 ? 'PASS' : 'NEEDS_WORK'),
            strengths: strengths,
            improvements: improvements,
            areas_to_improve: improvements,
            ai_recommendations: aiRecs,
            detailed_feedback: detailedFeedback,
            answers_evaluated: ansCount,
            question_count: qCount,
            answered_count: ansCount,
            skipped_count: skipCount,
            questions: Array.isArray(intv.questions) ? intv.questions : [],
            answers: Array.isArray(intv.answers) ? intv.answers : (intv.answers && typeof intv.answers === 'object' ? Object.values(intv.answers) : []),
            question_evaluations: Array.isArray(intv.question_evaluations) ? intv.question_evaluations : (Array.isArray((intv as any).questionEvaluations) ? (intv as any).questionEvaluations : []),
            full_report: intv,
            created_at: intv.created_at || (intv as any).createdAt || (intv as any).completed_at || (intv as any).completedAt || new Date().toISOString(),
            completed_at: intv.completed_at || (intv as any).completedAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase.from('mock_interviews').upsert(payload, { onConflict: 'id' });
          if (error) {
            console.warn('[CloudSync] Mock interview upsert warning:', error);
            result.errors.push(`Mock interview ${intvId} upsert: ${error.message}`);
          } else {
            result.uploadedCounts.mockInterviews++;
          }
        }
      }
    } catch (e: any) {
      result.errors.push(`Mock interviews sync error: ${e.message}`);
    }

    // E. Sync Placement Sessions
    try {
      if (localData.placementSessions.length > 0) {
        for (const sess of localData.placementSessions) {
          const sessId = sess.id || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const payload = {
            id: sessId,
            user_id: userId,
            category: sess.category || 'aptitude',
            subject: sess.subject || 'Quantitative Aptitude',
            difficulty: sess.difficulty || 'Medium',
            score: typeof sess.score === 'number' ? sess.score : 0,
            accuracy: typeof sess.accuracy === 'number' ? sess.accuracy : 0,
            total_questions: typeof sess.total_questions === 'number' ? sess.total_questions : (sess as any).totalQuestions || 10,
            correct_answers: typeof sess.correct_answers === 'number' ? sess.correct_answers : (sess as any).correctAnswers || 0,
            time_taken_seconds: typeof sess.time_taken_seconds === 'number' ? sess.time_taken_seconds : (sess as any).timeTakenSeconds || 300,
            answers: sess.answers || {},
            created_at: sess.created_at || (sess as any).createdAt || new Date().toISOString(),
            completed_at: sess.completed_at || (sess as any).completedAt || new Date().toISOString(),
          };

          const { error } = await supabase.from('placement_sessions').upsert(payload, { onConflict: 'id' });
          if (error) {
            console.warn('[CloudSync] Placement session upsert warning:', error);
          } else {
            result.uploadedCounts.placementSessions++;
          }
        }
      }
    } catch (e: any) {
      result.errors.push(`Placement sessions sync error: ${e.message}`);
    }

    // F. Sync Extended Metadata & Profile
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const currentProfileData = (existingProfile?.profile_data as Record<string, any>) || {};
      const mergedProfileData = {
        ...currentProfileData,
        ...(localData.extendedProfile || {}),
        company_targets: localData.companyTargets.length > 0 ? localData.companyTargets : currentProfileData.company_targets || [],
        roadmap_tasks: localData.roadmapTasks.length > 0 ? localData.roadmapTasks : currentProfileData.roadmap_tasks || [],
        completed_roadmap_items: localData.completedRoadmapItemIds.length > 0 ? localData.completedRoadmapItemIds : currentProfileData.completed_roadmap_items || [],
        unlocked_badges: localData.badges.length > 0 ? localData.badges : currentProfileData.unlocked_badges || [],
        longest_streak: Math.max(localData.longestStreak, currentProfileData.longest_streak || 0),
        last_cloud_sync_at: new Date().toISOString(),
      };

      const envelopeString = `__CP_DATA__${JSON.stringify(mergedProfileData)}`;

      if (existingProfile) {
        // Try updating profile_data and career_goal together
        const { error: profUpErr } = await supabase
          .from('profiles')
          .update({
            profile_data: mergedProfileData,
            career_goal: envelopeString,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (profUpErr && (profUpErr.code === '42703' || profUpErr.message?.includes('profile_data'))) {
          // Fallback to updating career_goal envelope
          await supabase
            .from('profiles')
            .update({
              career_goal: envelopeString,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
        result.uploadedCounts.profileMeta = true;
      }
    } catch (e: any) {
      console.warn('[CloudSync] Profile metadata merge warning:', e);
    }

    // Query exact cloud totals
    try {
      const [resCount, subCount, qCount, intvCount, sessCount] = await Promise.all([
        supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('coding_submissions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('saved_coding_questions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('mock_interviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('placement_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      result.cloudRecordCounts.resumes = resCount.count || 0;
      result.cloudRecordCounts.codingSubmissions = subCount.count || 0;
      result.cloudRecordCounts.savedQuestions = qCount.count || 0;
      result.cloudRecordCounts.mockInterviews = intvCount.count || 0;
      result.cloudRecordCounts.placementSessions = sessCount.count || 0;
    } catch (_) {}

    return result;
  },

  /**
   * 3. Authoritative Hydration: Pull all records from Supabase for this user
   * and hydrate the local storage caches.
   */
  async hydrateCloudDataToLocal(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId || userId === 'guest') {
      return false;
    }

    try {
      // 1. Fetch Resumes
      const { data: resumes } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('version', { ascending: false });

      if (Array.isArray(resumes) && resumes.length > 0) {
        const formattedResumes: ResumeVersionItem[] = resumes.map((r) => ({
          id: r.id,
          userId: r.user_id,
          fileName: r.file_name || 'Resume.pdf',
          targetRole: r.target_role || 'Software Developer',
          resumeText: r.resume_text || '',
          analysisResult: r.analysis_result,
          isCurrent: r.is_current,
          version: r.version || 1,
          versionLabel: r.version_label || `Version ${(r.version || 1).toFixed(1)}`,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
        localStorage.setItem(`careerpilot_resumes_${userId}`, JSON.stringify(formattedResumes));

        const currentResume = formattedResumes.find((r) => r.isCurrent) || formattedResumes[0];
        if (currentResume && currentResume.analysisResult) {
          localStorage.setItem(
            `careerpilot_latest_resume_analysis_${userId}`,
            JSON.stringify({
              result: currentResume.analysisResult,
              targetRole: currentResume.targetRole,
              analyzedAt: currentResume.updatedAt || currentResume.createdAt,
              resumeText: currentResume.resumeText,
              resumeId: currentResume.id,
            })
          );
        }
      }

      // 2. Fetch Coding Submissions
      const { data: submissions } = await supabase
        .from('coding_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (Array.isArray(submissions) && submissions.length > 0) {
        localStorage.setItem(`careerpilot_subs_${userId}`, JSON.stringify(submissions));
      }

      // 3. Fetch Saved Questions
      const { data: savedQuestions } = await supabase
        .from('saved_coding_questions')
        .select('*')
        .eq('user_id', userId);

      if (Array.isArray(savedQuestions) && savedQuestions.length > 0) {
        localStorage.setItem(`careerpilot_saved_questions_${userId}`, JSON.stringify(savedQuestions));
      }

      // 4. Fetch Mock Interviews
      const { data: interviews } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (Array.isArray(interviews) && interviews.length > 0) {
        localStorage.setItem(`careerpilot_mock_interviews_${userId}`, JSON.stringify(interviews));
      }

      // 5. Fetch Placement Sessions
      const { data: placementSessions } = await supabase
        .from('placement_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (Array.isArray(placementSessions) && placementSessions.length > 0) {
        localStorage.setItem(`careerpilot_placement_sessions_${userId}`, JSON.stringify(placementSessions));
      }

      // 6. Fetch Profile Metadata & Embedded JSON
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        let metaObj = (profile.profile_data as Record<string, any>) || {};
        if (profile.career_goal && profile.career_goal.startsWith('__CP_DATA__')) {
          try {
            const rawJson = profile.career_goal.replace('__CP_DATA__', '');
            const parsed = JSON.parse(rawJson);
            metaObj = { ...metaObj, ...parsed };
          } catch (_) {}
        }

        if (metaObj.company_targets && Array.isArray(metaObj.company_targets)) {
          localStorage.setItem(`careerpilot_company_targets_${userId}`, JSON.stringify(metaObj.company_targets));
        }
        if (metaObj.roadmap_tasks && Array.isArray(metaObj.roadmap_tasks)) {
          localStorage.setItem(`careerpilot_roadmap_tasks_${userId}`, JSON.stringify(metaObj.roadmap_tasks));
        }
        if (metaObj.completed_roadmap_items && Array.isArray(metaObj.completed_roadmap_items)) {
          localStorage.setItem(`careerpilot_roadmap_completed_items_${userId}`, JSON.stringify(metaObj.completed_roadmap_items));
        }
        if (metaObj.unlocked_badges && Array.isArray(metaObj.unlocked_badges)) {
          localStorage.setItem(`careerpilot_unlocked_badges_${userId}`, JSON.stringify(metaObj.unlocked_badges));
        }
        if (typeof metaObj.longest_streak === 'number') {
          localStorage.setItem(`careerpilot_longest_streak_${userId}`, String(metaObj.longest_streak));
        }
      }

      // Dispatch global update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('careerpilot_activity_updated', { detail: { studentId: userId } }));
        window.dispatchEvent(new CustomEvent('careerpilot_profile_updated', { detail: { studentId: userId } }));
      }

      return true;
    } catch (err) {
      console.warn('[CloudSync] Error hydrating cloud data to local:', err);
      return false;
    }
  },

  /**
   * 4. Full Bidirectional Convergence (Sync Local -> Supabase then Hydrate Supabase -> Local)
   */
  async performFullCloudConvergence(userId: string): Promise<CloudSyncResult> {
    const syncRes = await this.syncLocalDataToCloud(userId);
    await this.hydrateCloudDataToLocal(userId);
    return syncRes;
  },
};
