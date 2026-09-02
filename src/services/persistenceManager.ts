import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { cloudSyncService } from './cloudSyncService';
import { ResumeVersionItem } from '../types/resume';
import { MockInterviewReport } from '../types/interview';
import { PlacementTestSession } from '../types/placement';
import { StudentTargetCompany } from '../types/companyPrep';
import { DailyRoadmapTask } from '../types/roadmap';
import { OfflineMutation, QueueProcessResult, SyncAuditLog } from '../types/sync';
import { classifySyncError, recordSyncAuditLog } from './syncAuditService';

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
  syncStatus: 'synced' | 'pending_sync' | 'error' | 'unauthenticated' | 'offline';
  lastError: string | null;
}

class PersistenceManagerClass {
  private isProcessingQueue = false;
  private lastHydratedTimestamp: string | null = null;
  private lastWriteTimestamp: string | null = null;
  private lastError: string | null = null;
  private offlineQueueKeyPrefix = 'careerpilot_offline_queue_';

  /**
   * Authoritative Hydration: Pulls all cloud records from Supabase and populates local caches
   */
  public async hydrateAll(userId: string): Promise<boolean> {
    if (!userId || userId === 'guest') return false;
    try {
      const success = await cloudSyncService.hydrateCloudDataToLocal(userId);
      this.lastHydratedTimestamp = new Date().toISOString();
      return success;
    } catch (err: any) {
      console.warn('[PersistenceManager] hydrateAll warning:', err);
      return false;
    }
  }

  // ============================================================================
  // 1. DUAL-STORE WRITE STRATEGY (Supabase First -> Fallback Local Cache Envelope)
  // ============================================================================

  /**
   * Universal User ID Resolver
   */
  public async getEffectiveUserId(providedId?: string | null): Promise<string | null> {
    if (providedId && providedId !== 'guest') {
      return providedId;
    }
    if (!isSupabaseConfigured()) {
      return null;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        return session.user.id;
      }
    } catch (_) {}
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        return user.id;
      }
    } catch (_) {}
    return null;
  }

  /**
   * Unified Profile Metadata Writer
   */
  public async writeProfileMetadata(
    userId: string,
    metadataPartial: Record<string, any>
  ): Promise<boolean> {
    if (!userId || userId === 'guest') return false;

    // 1. Always update local storage extended cache for instant offline responsiveness
    try {
      const extKey = `careerpilot_extended_profile_${userId}`;
      const existingRaw = localStorage.getItem(extKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const merged = { ...existing, ...metadataPartial, last_updated_at: new Date().toISOString() };
      localStorage.setItem(extKey, JSON.stringify(merged));
    } catch (_) {}

    if (!isSupabaseConfigured()) {
      return true;
    }

    try {
      // 2. Fetch existing profile from Supabase
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const existingData = (currentProfile?.profile_data as Record<string, any>) || {};
      const mergedProfileData = {
        ...existingData,
        ...metadataPartial,
        last_updated_at: new Date().toISOString(),
      };

      const envelopeString = `__CP_DATA__${JSON.stringify(mergedProfileData)}`;

      if (currentProfile) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            profile_data: mergedProfileData,
            career_goal: envelopeString,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateErr) {
          if (updateErr.code === '42703' || updateErr.message?.includes('profile_data')) {
            const { error: envErr } = await supabase
              .from('profiles')
              .update({
                career_goal: envelopeString,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            if (envErr) throw envErr;
          } else {
            throw updateErr;
          }
        }
      } else {
        const { data: authUser } = await supabase.auth.getUser();
        const insertPayload: any = {
          id: userId,
          email: authUser?.user?.email || 'student@careerpilot.ai',
          full_name: authUser?.user?.user_metadata?.full_name || 'Student',
          usn: authUser?.user?.user_metadata?.usn || '1CP21CS001',
          college_name: authUser?.user?.user_metadata?.college_name || 'Engineering College',
          department: authUser?.user?.user_metadata?.department || 'Computer Science and Engineering',
          semester: authUser?.user?.user_metadata?.semester || '7th Semester',
          graduation_year: authUser?.user?.user_metadata?.graduation_year || '2026',
          career_goal: envelopeString,
          profile_data: mergedProfileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: insertErr } = await supabase.from('profiles').insert(insertPayload);
        if (insertErr) {
          if (insertErr.code === '42703' || insertErr.message?.includes('profile_data')) {
            delete insertPayload.profile_data;
            const { error: retryErr } = await supabase.from('profiles').insert(insertPayload);
            if (retryErr) throw retryErr;
          } else {
            throw insertErr;
          }
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
  // 2. OFFLINE MUTATION QUEUE (Guaranteed Eventual Consistency & Integrity)
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
      const existingIdx = current.findIndex((m) => m.id === mutation.id);
      if (existingIdx >= 0) {
        current[existingIdx] = mutation;
      } else {
        current.push(mutation);
      }
      localStorage.setItem(this.getQueueKey(mutation.userId), JSON.stringify(current));
    } catch (_) {}
  }

  /**
   * Process offline queue with strict atomic confirmation:
   * Items are removed ONLY when Supabase confirms success (no error returned).
   * Failed items are retained in the queue with incremented retry count and structured error categories.
   */
  public async processOfflineQueue(targetUserId?: string): Promise<QueueProcessResult> {
    const result: QueueProcessResult = {
      totalProcessed: 0,
      syncedCount: 0,
      failedCount: 0,
      remainingQueueCount: 0,
      errors: [],
      logs: [],
    };

    if (this.isProcessingQueue) {
      return result;
    }

    if (!isSupabaseConfigured()) {
      return result;
    }

    // Step 1: Verify current authenticated Supabase session
    let activeUserId: string | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      activeUserId = session?.user?.id || null;
      if (!activeUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        activeUserId = user?.id || null;
      }
    } catch {
      activeUserId = null;
    }

    const userId = activeUserId || (await this.getEffectiveUserId(targetUserId));
    if (!userId || userId === 'guest') {
      const authErr = classifySyncError('Active Supabase authentication session required for cloud sync.', {
        operation: 'processOfflineQueue',
      });
      result.errors.push(authErr);
      return result;
    }

    this.isProcessingQueue = true;
    try {
      // Collect queue from both active user key and guest/target key if migrating
      const queue = this.getOfflineQueue(userId);
      let guestQueue: OfflineMutation[] = [];
      if (userId !== 'guest') {
        guestQueue = this.getOfflineQueue('guest');
      }

      const combinedQueue = [...queue, ...guestQueue];
      if (combinedQueue.length === 0) {
        this.isProcessingQueue = false;
        return result;
      }

      result.totalProcessed = combinedQueue.length;
      const remaining: OfflineMutation[] = [];

      for (const item of combinedQueue) {
        // Enforce account identity: for all DB operations, ensure we use the authenticated user ID
        const effectiveItemUserId = activeUserId || userId;
        let mutationSucceeded = false;
        let lastErrorRaw: any = null;
        let targetTable = 'profiles';

        try {
          if (item.type === 'save_profile_field') {
            targetTable = 'profiles';
            mutationSucceeded = await this.writeProfileMetadata(effectiveItemUserId, item.payload);
            if (!mutationSucceeded) {
              lastErrorRaw = 'Profile metadata write failed';
            }
          } else if (item.type === 'save_coding_submission') {
            targetTable = 'coding_submissions';
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
              submitted_at: sub.created_at || sub.submitted_at || new Date().toISOString(),
              created_at: sub.created_at || sub.submitted_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('coding_submissions').upsert(payload, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              lastErrorRaw = error;
            }
          } else if (item.type === 'save_mock_interview') {
            targetTable = 'mock_interviews';
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
              interview_type: normalizedType,
              topic: intv.topic || 'General Technical',
              subject: intv.subject || intv.topic || 'Technical Interview',
              completed_at: intv.completed_at || (intv as any).completedAt || nowIso,
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
              lastErrorRaw = error;
            }
          } else if (item.type === 'save_resume') {
            targetTable = 'resumes';
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
              lastErrorRaw = error;
            }
          } else if (item.type === 'save_placement_session') {
            targetTable = 'placement_sessions';
            const sess = item.payload;
            const payload = {
              id: sess.id,
              user_id: effectiveItemUserId,
              category: sess.category || 'aptitude',
              subject: sess.subject || 'Quantitative Aptitude',
              topic: sess.topic || 'General',
              difficulty: sess.difficulty || 'Medium',
              score: typeof sess.score === 'number' ? sess.score : 0,
              accuracy: typeof sess.accuracy === 'number' ? sess.accuracy : 0,
              total_questions: typeof sess.total_questions === 'number' ? sess.total_questions : (sess.totalQuestions || 10),
              correct_count: typeof sess.correct_count === 'number' ? sess.correct_count : (sess.correctCount || sess.correctAnswers || 0),
              incorrect_count: typeof sess.incorrect_count === 'number' ? sess.incorrect_count : (sess.incorrectCount || sess.incorrectAnswers || 0),
              skipped_count: typeof sess.skipped_count === 'number' ? sess.skipped_count : (sess.skippedCount || 0),
              time_spent_seconds: typeof sess.time_spent_seconds === 'number' ? sess.time_spent_seconds : (sess.timeTakenSeconds || 300),
              questions: sess.questions || [],
              answers: sess.answers || {},
              session_data: sess.session_data || sess,
              created_at: sess.created_at || (sess as any).createdAt || new Date().toISOString(),
              completed_at: sess.completed_at || (sess as any).completedAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('placement_sessions').upsert(payload, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              lastErrorRaw = error;
            }
          } else if (item.type === 'save_career_readiness') {
            targetTable = 'career_readiness_history';
            const crPayload = {
              ...item.payload,
              user_id: effectiveItemUserId,
            };
            const { error } = await supabase.from('career_readiness_history').upsert(crPayload, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              lastErrorRaw = error;
            }
          } else if (item.type === 'save_job_resume_match') {
            targetTable = 'job_resume_matches';
            const jrm = {
              ...item.payload,
              user_id: effectiveItemUserId,
            };
            const { error } = await supabase.from('job_resume_matches').upsert(jrm, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              lastErrorRaw = error;
            }
          } else if (item.type === 'save_mentor_conversation') {
            targetTable = 'mentor_conversations';
            const conv = {
              ...item.payload,
              user_id: effectiveItemUserId,
            };
            const { error } = await supabase.from('mentor_conversations').upsert(conv, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              lastErrorRaw = error;
            }
          } else if (item.type === 'save_mentor_message') {
            targetTable = 'mentor_messages';
            const msg = {
              ...item.payload,
              user_id: effectiveItemUserId,
            };
            const { error } = await supabase.from('mentor_messages').upsert(msg, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              lastErrorRaw = error;
            }
          } else if (item.type === 'save_notification') {
            targetTable = 'notifications';
            const notif = {
              ...item.payload,
              user_id: effectiveItemUserId,
            };
            const { error } = await supabase.from('notifications').upsert(notif, { onConflict: 'id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              lastErrorRaw = error;
            }
          } else if (item.type === 'save_notification_preferences') {
            targetTable = 'notification_preferences';
            const prefs = {
              ...item.payload,
              user_id: effectiveItemUserId,
            };
            const { error } = await supabase.from('notification_preferences').upsert(prefs, { onConflict: 'user_id' });
            if (!error) {
              mutationSucceeded = true;
            } else {
              lastErrorRaw = error;
            }
          } else if (item.type === 'save_saved_question') {
            targetTable = 'saved_coding_questions';
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
              lastErrorRaw = error;
            }
          } else if (item.type === 'remove_saved_question') {
            targetTable = 'saved_coding_questions';
            const q = item.payload;
            const qProblemId = String(q.problem_id || q.question_id || q.id);
            const recordId = `sq_${effectiveItemUserId}_${qProblemId}`;
            const { error } = await supabase.from('saved_coding_questions').delete().eq('id', recordId).eq('user_id', effectiveItemUserId);
            if (!error) {
              mutationSucceeded = true;
            } else {
              lastErrorRaw = error;
            }
          } else {
            targetTable = 'profiles';
            mutationSucceeded = await this.writeProfileMetadata(effectiveItemUserId, item.payload);
            if (!mutationSucceeded) {
              lastErrorRaw = 'Profile metadata update failed';
            }
          }
        } catch (e: any) {
          lastErrorRaw = e;
          mutationSucceeded = false;
        }

        if (mutationSucceeded) {
          // Success: Confirmed by Supabase. Item is omitted from remaining queue.
          result.syncedCount++;
        } else {
          // Failure: Item MUST BE RETAINED in the queue.
          result.failedCount++;
          const classified = classifySyncError(lastErrorRaw, {
            table: targetTable,
            operation: item.type,
            recordId: item.id,
          });

          result.errors.push(classified);
          this.lastError = classified.userMessage;

          const auditLog: SyncAuditLog = {
            operation: item.type,
            table: targetTable,
            recordId: item.id,
            userId: effectiveItemUserId,
            errorCategory: classified.category,
            rawMessage: typeof lastErrorRaw === 'string' ? lastErrorRaw : lastErrorRaw?.message || JSON.stringify(lastErrorRaw),
            timestamp: new Date().toISOString(),
            retryCount: item.attempts + 1,
          };

          recordSyncAuditLog(auditLog);
          result.logs.push(auditLog);

          remaining.push({
            ...item,
            attempts: item.attempts + 1,
            lastErrorCategory: classified.category,
            lastErrorMessage: classified.userMessage,
          });
        }
      }

      result.remainingQueueCount = remaining.length;
      localStorage.setItem(this.getQueueKey(userId), JSON.stringify(remaining));
      if (userId !== 'guest') {
        localStorage.removeItem(this.getQueueKey('guest'));
      }
      return result;
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // ============================================================================
  // 3. DIAGNOSTIC REPORTING & HEALTH CHECK
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
