/**
 * CareerPilot AI - Smart Notification Service
 * Authoritative Supabase-backed notification engine with deduplication,
 * preferences enforcement, real-time subscription support, and local namespaced caching.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  AppNotification,
  NotificationCategory,
  NotificationPreferences,
  NotificationPriority,
  SmartNotificationTriggerContext,
} from '../types/notification';

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'user_id' | 'updated_at'> = {
  enabled: true,
  career_updates: true,
  coding_reminders: true,
  study_reminders: true,
  interview_feedback: true,
  resume_updates: true,
  company_prep: true,
  achievement_notifications: true,
  progress_updates: true,
};

const NOTIFICATION_CACHE_PREFIX = 'careerpilot_notifications_';
const NOTIFICATION_PREFS_PREFIX = 'careerpilot_notif_prefs_';
const NOTIFICATION_DEDUP_PREFIX = 'careerpilot_notif_dedup_';

export const notificationService = {
  /**
   * Helper to get effective authenticated user ID
   */
  async getEffectiveUserId(providedId?: string): Promise<string> {
    if (providedId && providedId !== 'guest') {
      return providedId;
    }
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) return user.id;
      } catch (_) {}
    }
    return 'guest';
  },

  /**
   * 1. Fetch user notifications from Supabase (Source of Truth)
   * Falls back to local namespaced cache if offline/error.
   */
  async fetchNotifications(userId: string): Promise<AppNotification[]> {
    if (!userId || userId === 'guest') {
      return [];
    }

    const effectiveUserId = await this.getEffectiveUserId(userId);
    if (!effectiveUserId || effectiveUserId === 'guest') {
      return [];
    }

    const localCacheKey = `${NOTIFICATION_CACHE_PREFIX}${effectiveUserId}`;

    if (isSupabaseConfigured() && effectiveUserId !== 'guest') {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', effectiveUserId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && Array.isArray(data)) {
          const formatted: AppNotification[] = data.map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            type: row.type || 'general',
            title: row.title || 'Notification',
            message: row.message || '',
            category: (row.category as NotificationCategory) || 'SYSTEM',
            priority: (row.priority as NotificationPriority) || 'info',
            is_read: Boolean(row.is_read),
            action_url: row.action_url || undefined,
            action_label: row.action_label || undefined,
            created_at: row.created_at || new Date().toISOString(),
            read_at: row.read_at || null,
            dedup_key: row.dedup_key || undefined,
            metadata: row.metadata || undefined,
            cloudSynced: true,
          }));

          // Cache in local storage for fast initial render & offline
          try {
            localStorage.setItem(localCacheKey, JSON.stringify(formatted));
          } catch (_) {}

          return formatted;
        } else if (error) {
          console.warn('[NotificationService] Supabase fetch notice:', error.message);
        }
      } catch (err) {
        console.warn('[NotificationService] Supabase fetch exception:', err);
      }
    }

    // Fallback to local cache
    try {
      const cached = localStorage.getItem(localCacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_) {}

    return [];
  },

  /**
   * 2. Mark single notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const nowIso = new Date().toISOString();
    let success = false;

    if (isSupabaseConfigured() && effectiveUserId !== 'guest') {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: nowIso,
          })
          .eq('id', notificationId)
          .eq('user_id', effectiveUserId);

        if (!error) success = true;
      } catch (err) {
        console.warn('[NotificationService] Error marking as read in Supabase:', err);
      }
    }

    // Always update local cache
    try {
      const localCacheKey = `${NOTIFICATION_CACHE_PREFIX}${effectiveUserId}`;
      const cached: AppNotification[] = JSON.parse(localStorage.getItem(localCacheKey) || '[]');
      const updated = cached.map((n) =>
        n.id === notificationId ? { ...n, is_read: true, read_at: nowIso } : n
      );
      localStorage.setItem(localCacheKey, JSON.stringify(updated));
    } catch (_) {}

    return success;
  },

  /**
   * 3. Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const nowIso = new Date().toISOString();
    let success = false;

    if (isSupabaseConfigured() && effectiveUserId !== 'guest') {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: nowIso,
          })
          .eq('user_id', effectiveUserId)
          .eq('is_read', false);

        if (!error) success = true;
      } catch (err) {
        console.warn('[NotificationService] Error marking all read in Supabase:', err);
      }
    }

    // Update local cache
    try {
      const localCacheKey = `${NOTIFICATION_CACHE_PREFIX}${effectiveUserId}`;
      const cached: AppNotification[] = JSON.parse(localStorage.getItem(localCacheKey) || '[]');
      const updated = cached.map((n) => ({ ...n, is_read: true, read_at: nowIso }));
      localStorage.setItem(localCacheKey, JSON.stringify(updated));
    } catch (_) {}

    return success;
  },

  /**
   * 4. Delete single notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    let success = false;

    if (isSupabaseConfigured() && effectiveUserId !== 'guest') {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId)
          .eq('user_id', effectiveUserId);

        if (!error) success = true;
      } catch (err) {
        console.warn('[NotificationService] Error deleting notification from Supabase:', err);
      }
    }

    // Update local cache
    try {
      const localCacheKey = `${NOTIFICATION_CACHE_PREFIX}${effectiveUserId}`;
      const cached: AppNotification[] = JSON.parse(localStorage.getItem(localCacheKey) || '[]');
      const updated = cached.filter((n) => n.id !== notificationId);
      localStorage.setItem(localCacheKey, JSON.stringify(updated));
    } catch (_) {}

    return success;
  },

  /**
   * 5. Clear all notifications for user
   */
  async clearAllNotifications(userId: string): Promise<boolean> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    let success = false;

    if (isSupabaseConfigured() && effectiveUserId !== 'guest') {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', effectiveUserId);

        if (!error) success = true;
      } catch (err) {
        console.warn('[NotificationService] Error clearing all notifications from Supabase:', err);
      }
    }

    // Clear local cache
    try {
      const localCacheKey = `${NOTIFICATION_CACHE_PREFIX}${effectiveUserId}`;
      localStorage.setItem(localCacheKey, JSON.stringify([]));
    } catch (_) {}

    return success;
  },

  /**
   * 6. Fetch notification preferences
   */
  async fetchPreferences(userId: string): Promise<NotificationPreferences> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const localKey = `${NOTIFICATION_PREFS_PREFIX}${effectiveUserId}`;

    if (isSupabaseConfigured() && effectiveUserId !== 'guest') {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', effectiveUserId)
          .maybeSingle();

        if (!error && data) {
          const prefs: NotificationPreferences = {
            user_id: effectiveUserId,
            enabled: data.enabled ?? true,
            career_updates: data.career_updates ?? true,
            coding_reminders: data.coding_reminders ?? true,
            study_reminders: data.study_reminders ?? true,
            interview_feedback: data.interview_feedback ?? true,
            resume_updates: data.resume_updates ?? true,
            company_prep: data.company_prep ?? true,
            achievement_notifications: data.achievement_notifications ?? true,
            progress_updates: data.progress_updates ?? true,
            updated_at: data.updated_at || new Date().toISOString(),
          };

          try {
            localStorage.setItem(localKey, JSON.stringify(prefs));
          } catch (_) {}

          return prefs;
        }
      } catch (err) {
        console.warn('[NotificationService] Error fetching prefs from Supabase:', err);
      }
    }

    // Fallback to local cache
    try {
      const cached = localStorage.getItem(localKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}

    return {
      user_id: effectiveUserId,
      ...DEFAULT_PREFERENCES,
      updated_at: new Date().toISOString(),
    };
  },

  /**
   * 7. Update notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const current = await this.fetchPreferences(effectiveUserId);
    const updated: NotificationPreferences = {
      ...current,
      ...updates,
      user_id: effectiveUserId,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && effectiveUserId !== 'guest') {
      try {
        await supabase
          .from('notification_preferences')
          .upsert(
            {
              user_id: effectiveUserId,
              enabled: updated.enabled,
              career_updates: updated.career_updates,
              coding_reminders: updated.coding_reminders,
              study_reminders: updated.study_reminders,
              interview_feedback: updated.interview_feedback,
              resume_updates: updated.resume_updates,
              company_prep: updated.company_prep,
              achievement_notifications: updated.achievement_notifications,
              progress_updates: updated.progress_updates,
              updated_at: updated.updated_at,
            },
            { onConflict: 'user_id' }
          );
      } catch (err) {
        console.warn('[NotificationService] Error saving preferences to Supabase:', err);
      }
    }

    try {
      const localKey = `${NOTIFICATION_PREFS_PREFIX}${effectiveUserId}`;
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (_) {}

    return updated;
  },

  /**
   * 8. Create a single notification with deduplication & preference enforcement
   */
  async createNotification(
    userId: string,
    item: {
      type: string;
      title: string;
      message: string;
      category: NotificationCategory;
      priority?: NotificationPriority;
      action_url?: string;
      action_label?: string;
      dedup_key?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<AppNotification | null> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const prefs = await this.fetchPreferences(effectiveUserId);

    // 1. Check if notifications or specific category are disabled
    if (!prefs.enabled) return null;
    if (item.category === 'CAREER' && !prefs.career_updates) return null;
    if (item.category === 'CODING' && !prefs.coding_reminders) return null;
    if (item.category === 'STUDY' && !prefs.study_reminders) return null;
    if (item.category === 'INTERVIEW' && !prefs.interview_feedback) return null;
    if (item.category === 'RESUME' && !prefs.resume_updates) return null;
    if (item.category === 'COMPANY' && !prefs.company_prep) return null;
    if (item.category === 'ACHIEVEMENT' && !prefs.achievement_notifications) return null;
    if (item.category === 'PROGRESS' && !prefs.progress_updates) return null;

    // 2. Deduplication check via key
    if (item.dedup_key) {
      const dedupStorageKey = `${NOTIFICATION_DEDUP_PREFIX}${effectiveUserId}_${item.dedup_key}`;
      try {
        const lastCreated = localStorage.getItem(dedupStorageKey);
        if (lastCreated) {
          // Prevent duplicate if already created
          return null;
        }
      } catch (_) {}
    }

    const newId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const notification: AppNotification = {
      id: newId,
      user_id: effectiveUserId,
      type: item.type,
      title: item.title,
      message: item.message,
      category: item.category,
      priority: item.priority || 'info',
      is_read: false,
      action_url: item.action_url,
      action_label: item.action_label,
      created_at: nowIso,
      read_at: null,
      dedup_key: item.dedup_key,
      metadata: item.metadata,
      cloudSynced: false,
    };

    // 3. Save to Supabase (Source of Truth)
    if (isSupabaseConfigured() && effectiveUserId !== 'guest') {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            id: newId,
            user_id: effectiveUserId,
            type: item.type,
            title: item.title,
            message: item.message,
            category: item.category,
            priority: item.priority || 'info',
            is_read: false,
            action_url: item.action_url || null,
            action_label: item.action_label || null,
            dedup_key: item.dedup_key || null,
            metadata: item.metadata || null,
            created_at: nowIso,
          })
          .select()
          .maybeSingle();

        if (!error && data) {
          notification.cloudSynced = true;
        }
      } catch (err) {
        console.warn('[NotificationService] Supabase insert notification notice:', err);
      }
    }

    // 4. Update local cache
    try {
      const localCacheKey = `${NOTIFICATION_CACHE_PREFIX}${effectiveUserId}`;
      const cached: AppNotification[] = JSON.parse(localStorage.getItem(localCacheKey) || '[]');
      const updated = [notification, ...cached.filter((n) => n.id !== newId)].slice(0, 50);
      localStorage.setItem(localCacheKey, JSON.stringify(updated));

      if (item.dedup_key) {
        localStorage.setItem(`${NOTIFICATION_DEDUP_PREFIX}${effectiveUserId}_${item.dedup_key}`, nowIso);
      }
    } catch (_) {}

    return notification;
  },

  /**
   * 9. Evaluate real persisted student data and generate smart, non-spam notifications
   */
  async evaluateAndGenerateSmartNotifications(
    userId: string,
    ctx: SmartNotificationTriggerContext
  ): Promise<AppNotification[]> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const existing = await this.fetchNotifications(effectiveUserId);
    const createdList: AppNotification[] = [];

    // Trigger 1: Welcome Onboarding for new accounts (created once)
    if (existing.length === 0 && effectiveUserId !== 'guest') {
      const welcome = await this.createNotification(effectiveUserId, {
        type: 'onboarding',
        category: 'SYSTEM',
        priority: 'info',
        title: 'Welcome to CareerPilot AI 🚀',
        message: 'Start by setting your target company and uploading your resume to begin your personalized placement roadmap.',
        action_url: '/profile',
        action_label: 'Complete Profile',
        dedup_key: 'welcome_onboarding',
      });
      if (welcome) createdList.push(welcome);
    }

    // Trigger 2: Career Readiness Milestone / Improvement
    if (ctx.readinessScore && ctx.readinessScore >= 70) {
      const scoreTier = Math.floor(ctx.readinessScore / 10) * 10;
      const milestone = await this.createNotification(effectiveUserId, {
        type: 'readiness_milestone',
        category: 'CAREER',
        priority: 'high',
        title: '🎯 Placement Ready Benchmark Reached',
        message: `Your verified Career Readiness Score reached ${ctx.readinessScore}%. Your technical and interview preparation is strong for placement drives.`,
        action_url: '/dashboard',
        action_label: 'View Breakdown',
        dedup_key: `readiness_milestone_${scoreTier}`,
      });
      if (milestone) createdList.push(milestone);
    }

    // Trigger 3: Coding Practice & Streak Reminders
    if (typeof ctx.currentStreak === 'number' && ctx.currentStreak >= 3) {
      const streakNotif = await this.createNotification(effectiveUserId, {
        type: 'coding_streak',
        category: 'CODING',
        priority: 'medium',
        title: `🔥 ${ctx.currentStreak}-Day Coding Streak!`,
        message: `Outstanding consistency! You have maintained a ${ctx.currentStreak}-day coding practice streak.`,
        action_url: '/coding',
        action_label: 'Continue Streak',
        dedup_key: `coding_streak_${ctx.currentStreak}`,
      });
      if (streakNotif) createdList.push(streakNotif);
    }

    // Trigger 4: Resume Optimization Opportunity (only with real resume analysis)
    if (ctx.hasResume && ctx.resumeMissingSkills && ctx.resumeMissingSkills.length > 0) {
      const missingSample = ctx.resumeMissingSkills.slice(0, 2).join(', ');
      const resumeNotif = await this.createNotification(effectiveUserId, {
        type: 'resume_skill_opportunity',
        category: 'RESUME',
        priority: 'medium',
        title: '📄 Resume Skill Optimization',
        message: `Target engineering roles frequently look for ${missingSample}. Consider highlighting projects demonstrating these skills.`,
        action_url: '/resume-analyzer',
        action_label: 'Optimize Resume',
        dedup_key: `resume_skills_${missingSample.replace(/\s+/g, '_')}`,
      });
      if (resumeNotif) createdList.push(resumeNotif);
    }

    // Trigger 5: Interview Weakness Improvement (only with verified interview history)
    if (ctx.mockInterviewsCount && ctx.mockInterviewsCount >= 2 && ctx.interviewWeaknessArea) {
      const interviewNotif = await this.createNotification(effectiveUserId, {
        type: 'interview_weakness',
        category: 'INTERVIEW',
        priority: 'medium',
        title: '🎤 Interview Performance Insight',
        message: `Your recent mock rounds highlight ${ctx.interviewWeaknessArea} as an area for improvement. Practice another session with STAR structure.`,
        action_url: '/interview',
        action_label: 'Practice Interview',
        dedup_key: `interview_weakness_${ctx.interviewWeaknessArea.replace(/\s+/g, '_')}`,
      });
      if (interviewNotif) createdList.push(interviewNotif);
    }

    // Trigger 6: Study Planner High-Priority Tasks
    if (ctx.highPriorityStudyTasksCount && ctx.highPriorityStudyTasksCount > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const studyNotif = await this.createNotification(effectiveUserId, {
        type: 'study_tasks_pending',
        category: 'STUDY',
        priority: 'medium',
        title: '📚 High-Priority Study Tasks Pending',
        message: `You have ${ctx.highPriorityStudyTasksCount} high-priority study tasks scheduled for today.`,
        action_url: '/study-planner',
        action_label: 'Open Planner',
        dedup_key: `study_tasks_${todayStr}`,
      });
      if (studyNotif) createdList.push(studyNotif);
    }

    // Trigger 7: Target Company Preparation Gaps
    if (ctx.targetCompaniesCount && ctx.targetCompaniesCount > 0 && ctx.targetCompanyPrepGapsCount && ctx.targetCompanyPrepGapsCount > 0) {
      const companyNotif = await this.createNotification(effectiveUserId, {
        type: 'company_prep_gap',
        category: 'COMPANY',
        priority: 'medium',
        title: '🏢 Target Company Preparation Tasks',
        message: `You have ${ctx.targetCompanyPrepGapsCount} recommended prep tasks for your target companies.`,
        action_url: '/company-prep',
        action_label: 'View Target Plan',
        dedup_key: `company_prep_tasks_${ctx.targetCompaniesCount}`,
      });
      if (companyNotif) createdList.push(companyNotif);
    }

    // Note: Achievement notifications are handled exclusively via checkNewlyUnlockedAchievements on real status transitions (LOCKED/IN_PROGRESS -> UNLOCKED), avoiding false/duplicate alerts during polling or intelligence evaluation.

    return createdList;
  },

  /**
   * 10. Subscribe to Supabase Realtime changes on notifications table
   */
  subscribeToNotifications(
    userId: string,
    onUpdate: (notifications: AppNotification[]) => void
  ): () => void {
    if (!isSupabaseConfigured() || userId === 'guest') {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`public:notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            const fresh = await notificationService.fetchNotifications(userId);
            onUpdate(fresh);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[NotificationService] Realtime subscription error:', err);
      return () => {};
    }
  },
};
