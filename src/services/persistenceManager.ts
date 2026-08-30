import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { cloudSyncService, CloudSyncResult, LocalHarvestSummary } from './cloudSyncService';
import { ResumeVersionItem } from '../types/resume';
import { CodingSubmission } from '../types/coding';
import { MockInterviewReport } from '../types/interview';
import { PlacementTestSession } from '../types/placement';
import { StudentTargetCompany } from '../types/companyPrep';
import { DailyRoadmapTask } from '../types/roadmap';
import { MentorMessage } from '../types/mentor';

export interface OfflineMutation {
  id: string;
  userId: string;
  type:
    | 'save_resume'
    | 'save_coding_submission'
    | 'save_saved_question'
    | 'remove_saved_question'
    | 'save_mock_interview'
    | 'save_placement_session'
    | 'save_company_target'
    | 'delete_company_target'
    | 'save_roadmap_tasks'
    | 'save_completed_roadmap_items'
    | 'save_study_plan'
    | 'save_study_time'
    | 'save_mentor_messages'
    | 'save_badges'
    | 'save_streak'
    | 'save_profile_field';
  payload: any;
  timestamp: string;
  attempts: number;
}

export interface PersistenceDiagnosticSummary {
  userId: string | null;
  isAuthenticated: boolean;
  isSupabaseConfigured: boolean;
  offlineQueueLength: number;
  lastHydratedAt: string | null;
  lastWriteAt: string | null;
  cloudRecordCounts: {
    resumes: number;
    codingSubmissions: number;
    savedQuestions: number;
    mockInterviews: number;
    placementSessions: number;
    hasProfile: boolean;
  };
  localRecordCounts: {
    resumes: number;
    codingSubmissions: number;
    savedQuestions: number;
    mockInterviews: number;
    placementSessions: number;
    companyTargets: number;
    roadmapTasks: number;
    completedRoadmapItems: number;
    badges: number;
    mentorMessages: number;
  };
  syncStatus: 'synced' | 'pending_sync' | 'offline' | 'unauthenticated' | 'error';
  lastError: string | null;
}

class PersistenceManagerClass {
  private offlineQueueKeyPrefix = 'careerpilot_offline_queue_';
  private lastHydratedTimestamp: string | null = null;
  private lastWriteTimestamp: string | null = null;
  private isProcessingQueue = false;
  private lastError: string | null = null;

  constructor() {
    // Setup automatic queue flush when device goes online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processOfflineQueue();
      });
      // Periodic check every 60 seconds
      setInterval(() => {
        if (navigator.onLine) {
          this.processOfflineQueue();
        }
      }, 60000);
    }
  }

  /**
   * Safe getter for current authenticated user ID
   */
  public async getEffectiveUserId(providedId?: string): Promise<string | null> {
    if (providedId && providedId !== 'guest') return providedId;
    if (!isSupabaseConfigured()) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) return session.user.id;
    } catch (_) {}
    return null;
  }

  // ============================================================================
  // 1. HYDRATION ENGINE (Cloud -> Local Cache)
  // Single Source of Truth: Supabase authoritatively populates local cache
  // ============================================================================

  public async hydrateAll(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId || userId === 'guest') {
      return false;
    }

    try {
      // 1. Flush any pending offline mutations first so nothing is lost
      await this.processOfflineQueue(userId);

      // 2. Perform authoritative cloud pull
      const success = await cloudSyncService.hydrateCloudDataToLocal(userId);
      if (success) {
        this.lastHydratedTimestamp = new Date().toISOString();
      }
      return success;
    } catch (err: any) {
      console.warn('[PersistenceManager] Hydration notice:', err?.message || err);
      this.lastError = err?.message || 'Hydration failed';
      return false;
    }
  }

  // ============================================================================
  // 2. WRITE-THROUGH ENGINES (User Action -> Cache -> Supabase -> Queue fallback)
  // ============================================================================

  /**
   * Helper: Write profile metadata (company targets, roadmap tasks, study plans, badges, mentor chats)
   */
  public async writeProfileMetadata(
    userId: string,
    metadataPartial: Record<string, any>
  ): Promise<boolean> {
    if (!userId || userId === 'guest') return false;

    // A. Local Cache Update
    try {
      const currentRaw = localStorage.getItem(`careerpilot_extended_profile_${userId}`);
      const currentObj = currentRaw ? JSON.parse(currentRaw) : {};
      const updatedObj = { ...currentObj, ...metadataPartial, updatedAt: new Date().toISOString() };
      localStorage.setItem(`careerpilot_extended_profile_${userId}`, JSON.stringify(updatedObj));
    } catch (_) {}

    // B. Supabase Cloud Write
    if (!isSupabaseConfigured()) return false;

    try {
      // Fetch existing profile metadata to merge safely
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('profile_data, career_goal')
        .eq('id', userId)
        .maybeSingle();

      let currentProfileData = (existingProfile?.profile_data as Record<string, any>) || {};
      if (existingProfile?.career_goal && existingProfile.career_goal.startsWith('__CP_DATA__')) {
        try {
          const raw = existingProfile.career_goal.replace('__CP_DATA__', '');
          currentProfileData = { ...currentProfileData, ...JSON.parse(raw) };
        } catch (_) {}
      }

      const mergedProfileData = {
        ...currentProfileData,
        ...metadataPartial,
        last_updated_at: new Date().toISOString(),
      };

      const envelopeString = `__CP_DATA__${JSON.stringify(mergedProfileData)}`;

      const { error } = await supabase
        .from('profiles')
        .update({
          profile_data: mergedProfileData,
          career_goal: envelopeString,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        if (error.code === '42703' || error.message?.includes('profile_data')) {
          await supabase
            .from('profiles')
            .update({
              career_goal: envelopeString,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        } else {
          throw error;
        }
      }

      this.lastWriteTimestamp = new Date().toISOString();
      return true;
    } catch (err: any) {
      console.warn('[PersistenceManager] Profile metadata write failed, enqueuing offline mutation:', err);
      this.enqueueOfflineMutation({
        id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        type: 'save_profile_field',
        payload: metadataPartial,
        timestamp: new Date().toISOString(),
        attempts: 0,
      });
      return false;
    }
  }

  /**
   * Save Study Planner daily time & task completion
   */
  public async saveStudyPlanState(
    userId: string,
    state: {
      dailyStudyTime?: number;
      studyPlans?: Record<string, any>;
      manualCompletions?: Record<string, string[]>;
    }
  ): Promise<void> {
    if (!userId || userId === 'guest') return;

    if (state.dailyStudyTime !== undefined) {
      localStorage.setItem(`careerpilot_daily_study_time_${userId}`, String(state.dailyStudyTime));
    }
    if (state.manualCompletions) {
      Object.entries(state.manualCompletions).forEach(([dateStr, items]) => {
        localStorage.setItem(`careerpilot_planner_manual_completions_${userId}_${dateStr}`, JSON.stringify(items));
      });
    }

    await this.writeProfileMetadata(userId, {
      ...(state.dailyStudyTime !== undefined ? { daily_study_time: state.dailyStudyTime } : {}),
      ...(state.studyPlans ? { study_plans: state.studyPlans } : {}),
      ...(state.manualCompletions ? { study_plan_completions: state.manualCompletions } : {}),
    });
  }

  /**
   * Save Roadmap task progression & item completions
   */
  public async saveRoadmapProgress(
    userId: string,
    tasks: DailyRoadmapTask[],
    completedItemIds: string[]
  ): Promise<void> {
    if (!userId || userId === 'guest') return;

    localStorage.setItem(`careerpilot_roadmap_tasks_${userId}`, JSON.stringify(tasks));
    localStorage.setItem(`careerpilot_roadmap_completed_items_${userId}`, JSON.stringify(completedItemIds));
    localStorage.setItem(`careerpilot_roadmap_initialized_${userId}`, 'true');

    await this.writeProfileMetadata(userId, {
      roadmap_tasks: tasks,
      completed_roadmap_items: completedItemIds,
      roadmap_initialized: true,
    });
  }

  /**
   * Save Company targets & active company
   */
  public async saveCompanyTargets(
    userId: string,
    targets: StudentTargetCompany[],
    activeTargetId?: string
  ): Promise<void> {
    if (!userId || userId === 'guest') return;

    localStorage.setItem(`careerpilot_company_targets_${userId}`, JSON.stringify(targets));
    if (activeTargetId) {
      localStorage.setItem(`careerpilot_active_company_target_${userId}`, activeTargetId);
    }

    await this.writeProfileMetadata(userId, {
      company_targets: targets,
      ...(activeTargetId ? { active_target_id: activeTargetId } : {}),
    });
  }

  /**
   * Save Unlocked Badges and Streak
   */
  public async saveAchievements(
    userId: string,
    badges: any,
    longestStreak?: number
  ): Promise<void> {
    if (!userId || userId === 'guest') return;

    if (badges) {
      localStorage.setItem(`careerpilot_unlocked_badges_${userId}`, JSON.stringify(badges));
    }
    if (typeof longestStreak === 'number') {
      localStorage.setItem(`careerpilot_longest_streak_${userId}`, String(longestStreak));
    }

    await this.writeProfileMetadata(userId, {
      ...(badges ? { unlocked_badges: badges } : {}),
      ...(typeof longestStreak === 'number' ? { longest_streak: longestStreak } : {}),
    });
  }

  // ============================================================================
  // 3. OFFLINE MUTATION QUEUE (Guaranteed Eventual Consistency)
  // ============================================================================

  private getQueueKey(userId: string): string {
    return `${this.offlineQueueKeyPrefix}${userId || 'guest'}`;
  }

  public getOfflineQueue(userId: string): OfflineMutation[] {
    try {
      const raw = localStorage.getItem(this.getQueueKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  public enqueueOfflineMutation(mutation: OfflineMutation): void {
    try {
      const current = this.getOfflineQueue(mutation.userId);
      current.push(mutation);
      localStorage.setItem(this.getQueueKey(mutation.userId), JSON.stringify(current));
    } catch (_) {}
  }

  public async processOfflineQueue(targetUserId?: string): Promise<void> {
    if (this.isProcessingQueue || !isSupabaseConfigured()) return;

    // Step 1: Verify current authenticated Supabase session
    let activeUserId: string | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      activeUserId = session?.user?.id || null;
    } catch {
      activeUserId = null;
    }

    const userId = activeUserId || (await this.getEffectiveUserId(targetUserId));
    if (!userId || userId === 'guest') return;

    this.isProcessingQueue = true;
    try {
      const queue = this.getOfflineQueue(userId);
      if (queue.length === 0) {
        this.isProcessingQueue = false;
        return;
      }

      const remaining: OfflineMutation[] = [];
      for (const item of queue) {
        // Enforce account isolation: only sync items that match the active authenticated user
        if (activeUserId && item.userId && item.userId !== activeUserId) {
          remaining.push(item);
          continue;
        }

        const effectiveItemUserId = activeUserId || item.userId || userId;
        let mutationSucceeded = false;

        try {
          if (item.type === 'save_profile_field') {
            mutationSucceeded = await this.writeProfileMetadata(effectiveItemUserId, item.payload);
          } else if (item.type === 'save_coding_submission') {
            const sub = item.payload;
            const payload = {
              id: sub.id,
              user_id: effectiveItemUserId,
              problem_id: String(sub.problem_id || sub.id),
              problem_title: String(sub.problem_title || 'Coding Problem'),
              difficulty: String(sub.difficulty || 'Medium'),
              language: String(sub.language || 'Python'),
              code: String(sub.submitted_code || sub.code || ''),
              status: sub.status,
              status_text: sub.status_text || sub.status,
              test_cases_passed: sub.test_cases_passed,
              total_test_cases: sub.total_test_cases,
              time_complexity: sub.ai_feedback?.timeComplexity || sub.time_complexity || '',
              space_complexity: sub.ai_feedback?.spaceComplexity || sub.space_complexity || '',
              execution_time_ms: Number(sub.runtime_ms || sub.execution_time || 0),
              runtime_ms: Number(sub.runtime_ms || sub.execution_time || 0),
              memory_used_kb: Number(sub.memory_kb || sub.memory_used || 0),
              memory_kb: Number(sub.memory_kb || sub.memory_used || 0),
              topic: String(sub.topic || sub.subject || 'DSA'),
              ai_feedback: sub.ai_feedback || {},
              submitted_at: sub.created_at || new Date().toISOString(),
              created_at: sub.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('coding_submissions').upsert(payload, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              this.lastError = error.message;
            }
          } else if (item.type === 'save_mock_interview') {
            const intv = item.payload;
            const intvId = intv.id || (intv as any).interview_id || `intv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const rawType = (intv.interview_type || (intv as any).interviewType || intv.subject || 'technical').toLowerCase();
            const normalizedType = rawType.includes('hr') || rawType.includes('behavioral') ? 'hr' : 'technical';
            const overallScore = typeof intv.overall_score === 'number' ? intv.overall_score : 75;
            const techScore = typeof intv.technical_score === 'number' ? intv.technical_score : overallScore;
            const commScore = typeof intv.communication_score === 'number' ? intv.communication_score : overallScore;
            const probScore = typeof intv.problem_solving_score === 'number' ? intv.problem_solving_score : overallScore;
            const nowIso = new Date().toISOString();

            const payload = {
              id: intvId,
              user_id: effectiveItemUserId,
              student_id: effectiveItemUserId,
              target_role: (intv as any).target_role || (intv as any).targetRole || intv.subject || 'Software Engineer',
              interview_type: normalizedType,
              difficulty: intv.difficulty || 'Medium',
              topic: intv.topic || 'General Technical',
              subject: intv.subject || intv.topic || 'Technical Interview',
              started_at: (intv as any).started_at || (intv as any).startedAt || intv.created_at || nowIso,
              completed_at: intv.completed_at || (intv as any).completedAt || nowIso,
              duration_seconds: (intv as any).duration_seconds || (intv as any).durationSeconds || 0,
              overall_score: overallScore,
              technical_score: techScore,
              technical_accuracy_score: techScore,
              communication_score: commScore,
              problem_solving_score: probScore,
              confidence_score: (intv as any).confidence_score || (intv as any).confidenceScore || 80,
              verdict: intv.verdict || (overallScore >= 70 ? 'PASS' : 'NEEDS_WORK'),
              strengths: Array.isArray(intv.strengths) ? intv.strengths : [],
              improvements: Array.isArray(intv.areas_to_improve) ? intv.areas_to_improve : [],
              areas_to_improve: Array.isArray(intv.areas_to_improve) ? intv.areas_to_improve : [],
              ai_recommendations: Array.isArray((intv as any).ai_recommendations) ? (intv as any).ai_recommendations : [],
              detailed_feedback: (intv as any).detailed_feedback || intv.recommendation || '',
              answers_evaluated: intv.answered_count !== undefined ? intv.answered_count : 5,
              question_count: intv.question_count || 5,
              answered_count: intv.answered_count !== undefined ? intv.answered_count : 5,
              skipped_count: intv.skipped_count !== undefined ? intv.skipped_count : 0,
              questions: Array.isArray(intv.questions) ? intv.questions : [],
              answers: Array.isArray(intv.answers) ? intv.answers : (intv.answers && typeof intv.answers === 'object' ? Object.values(intv.answers) : []),
              question_evaluations: Array.isArray(intv.question_evaluations) ? intv.question_evaluations : [],
              full_report: intv,
              created_at: intv.created_at || (intv as any).createdAt || nowIso,
              updated_at: nowIso,
            };

            const { error } = await supabase.from('mock_interviews').upsert(payload, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              this.lastError = error.message;
            }
          } else if (item.type === 'save_resume') {
            const resItem = item.payload;
            const payload = {
              id: resItem.id,
              user_id: effectiveItemUserId,
              file_name: resItem.fileName || resItem.versionLabel || 'Resume.pdf',
              target_role: resItem.targetRole || 'Software Developer',
              resume_text: resItem.resumeText || '',
              analysis_result: resItem.analysisResult || {},
              ats_score: Number(resItem.atsScore) || 0,
              is_current: resItem.isCurrent !== undefined ? resItem.isCurrent : true,
              version: Number(resItem.version) || 1,
              version_label: resItem.versionLabel || `Resume_v${resItem.version || 1}.pdf`,
              storage_path: resItem.storagePath || '',
              created_at: resItem.createdAt || new Date().toISOString(),
              updated_at: resItem.updatedAt || new Date().toISOString(),
            };
            const { error } = await supabase.from('resumes').upsert(payload, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              this.lastError = error.message;
            }
          } else if (item.type === 'save_placement_session') {
            const sess = item.payload;
            const payload = {
              id: sess.id,
              user_id: effectiveItemUserId,
              category: sess.category || 'aptitude',
              subject: sess.subject || 'Quantitative Aptitude',
              difficulty: sess.difficulty || 'Medium',
              score: typeof sess.score === 'number' ? sess.score : 0,
              accuracy: typeof sess.accuracy === 'number' ? sess.accuracy : 0,
              total_questions: typeof sess.total_questions === 'number' ? sess.total_questions : 10,
              correct_answers: typeof sess.correct_answers === 'number' ? sess.correct_answers : 0,
              time_taken_seconds: typeof sess.time_taken_seconds === 'number' ? sess.time_taken_seconds : 300,
              answers: sess.answers || {},
              created_at: sess.created_at || new Date().toISOString(),
              completed_at: sess.completed_at || new Date().toISOString(),
            };
            const { error } = await supabase.from('placement_sessions').upsert(payload, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              this.lastError = error.message;
            }
          } else if (item.type === 'save_saved_question') {
            const q = item.payload;
            const qProblemId = String(q.problem_id || q.question_id || q.id || `prob_${Date.now()}`);
            const recordId = `sq_${effectiveItemUserId}_${qProblemId}`;
            const nowIso = new Date().toISOString();
            const payload = {
              id: recordId,
              user_id: effectiveItemUserId,
              problem_id: qProblemId,
              problem_title: q.problem_title || q.title || 'Saved Problem',
              difficulty: q.difficulty || 'Medium',
              topic: q.topic || 'General',
              notes: typeof q.question_data === 'object' ? JSON.stringify(q.question_data) : (q.notes || ''),
              saved_at: q.saved_at || q.created_at || nowIso,
              created_at: q.created_at || q.saved_at || nowIso,
              updated_at: nowIso,
            };
            const { error } = await supabase.from('saved_coding_questions').upsert(payload, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              this.lastError = error.message;
            }
          } else {
            // Default success for local-only metadata types
            mutationSucceeded = true;
          }
        } catch (e: any) {
          this.lastError = e?.message || 'Mutation failed';
          mutationSucceeded = false;
        }

        if (!mutationSucceeded && item.attempts < 10) {
          remaining.push({ ...item, attempts: item.attempts + 1 });
        }
      }

      localStorage.setItem(this.getQueueKey(userId), JSON.stringify(remaining));
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // ============================================================================
  // 4. DIAGNOSTIC REPORTING & HEALTH CHECK
  // ============================================================================

  public async getConsistencyDiagnostic(userId: string | null): Promise<PersistenceDiagnosticSummary> {
    const isAuthed = Boolean(userId && userId !== 'guest');
    const effectiveId = userId || 'guest';
    const queue = isAuthed ? this.getOfflineQueue(userId!) : [];
    const localData = cloudSyncService.harvestAllLocalData(effectiveId);

    const summary: PersistenceDiagnosticSummary = {
      userId,
      isAuthenticated: isAuthed,
      isSupabaseConfigured: isSupabaseConfigured(),
      offlineQueueLength: queue.length,
      lastHydratedAt: this.lastHydratedTimestamp,
      lastWriteAt: this.lastWriteTimestamp,
      cloudRecordCounts: {
        resumes: 0,
        codingSubmissions: 0,
        savedQuestions: 0,
        mockInterviews: 0,
        placementSessions: 0,
        hasProfile: false,
      },
      localRecordCounts: {
        resumes: localData.resumes.length,
        codingSubmissions: localData.codingSubmissions.length,
        savedQuestions: localData.savedQuestions.length,
        mockInterviews: localData.mockInterviews.length,
        placementSessions: localData.placementSessions.length,
        companyTargets: localData.companyTargets.length,
        roadmapTasks: localData.roadmapTasks.length,
        completedRoadmapItems: localData.completedRoadmapItemIds.length,
        badges: localData.badges.length,
        mentorMessages: localData.mentorChatCount,
      },
      syncStatus: !isAuthed ? 'unauthenticated' : !isSupabaseConfigured() ? 'offline' : queue.length > 0 ? 'pending_sync' : 'synced',
      lastError: this.lastError,
    };

    if (isAuthed && isSupabaseConfigured()) {
      try {
        const [res, subs, savedQ, intv, sess, prof] = await Promise.allSettled([
          supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('coding_submissions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('saved_coding_questions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('mock_interviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('placement_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('profiles').select('id').eq('id', userId).maybeSingle(),
        ]);

        if (res.status === 'fulfilled') summary.cloudRecordCounts.resumes = res.value.count || 0;
        if (subs.status === 'fulfilled') summary.cloudRecordCounts.codingSubmissions = subs.value.count || 0;
        if (savedQ.status === 'fulfilled') summary.cloudRecordCounts.savedQuestions = savedQ.value.count || 0;
        if (intv.status === 'fulfilled') summary.cloudRecordCounts.mockInterviews = intv.value.count || 0;
        if (sess.status === 'fulfilled') summary.cloudRecordCounts.placementSessions = sess.value.count || 0;
        if (prof.status === 'fulfilled' && prof.value.data) summary.cloudRecordCounts.hasProfile = true;
      } catch (err: any) {
        summary.lastError = err?.message || 'Error querying cloud counts';
        summary.syncStatus = 'error';
      }
    }

    return summary;
  }
}

export const persistenceManager = new PersistenceManagerClass();
