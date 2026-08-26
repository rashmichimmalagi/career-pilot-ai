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
   * Save AI Mentor Chat Messages
   */
  public async saveMentorChatHistory(
    userId: string,
    messages: MentorMessage[]
  ): Promise<void> {
    if (!userId || userId === 'guest') return;

    const trimmed = messages.slice(-50);
    localStorage.setItem(`careerpilot_mentor_chat_${userId}`, JSON.stringify(trimmed));

    await this.writeProfileMetadata(userId, {
      mentor_chat_history: trimmed,
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const userId = await this.getEffectiveUserId(targetUserId);
    if (!userId) return;

    this.isProcessingQueue = true;
    try {
      const queue = this.getOfflineQueue(userId);
      if (queue.length === 0) {
        this.isProcessingQueue = false;
        return;
      }

      const remaining: OfflineMutation[] = [];
      for (const item of queue) {
        try {
          if (item.type === 'save_profile_field') {
            const ok = await this.writeProfileMetadata(item.userId, item.payload);
            if (!ok && item.attempts < 5) {
              remaining.push({ ...item, attempts: item.attempts + 1 });
            }
          }
        } catch (e) {
          if (item.attempts < 5) {
            remaining.push({ ...item, attempts: item.attempts + 1 });
          }
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
