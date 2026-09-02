import { useState, useEffect, useCallback, useRef } from 'react';
import { AppNotification, NotificationPreferences } from '../types/notification';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { fetchCareerIntelligence } from '../services/careerIntelligenceService';

export function useNotifications() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id || null;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const lastEvalTimeRef = useRef<number>(0);

  // 1. Fetch notifications & preferences for authenticated user only
  const loadData = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setPreferences(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [notifs, prefs] = await Promise.all([
        notificationService.fetchNotifications(userId),
        notificationService.fetchPreferences(userId),
      ]);

      if (isMounted.current) {
        setNotifications(notifs);
        setPreferences(prefs);
        setLoading(false);
      }

      // Throttled background evaluation (max once per 3 minutes per session)
      const now = Date.now();
      if (now - lastEvalTimeRef.current > 180000) {
        lastEvalTimeRef.current = now;
        fetchCareerIntelligence(userId)
          .then(async (intel) => {
            if (intel && isMounted.current) {
              const missingSkills: string[] = [];
              if (intel.adaptive?.weakTopics) {
                missingSkills.push(...intel.adaptive.weakTopics.map((t) => t.topic));
              }
              const weakness = intel.interviewWeakness?.weakAreas?.[0]?.area || null;

              const created = await notificationService.evaluateAndGenerateSmartNotifications(userId, {
                studentId: userId,
                readinessScore: intel.readiness?.overallScore ?? null,
                mockInterviewsCount: intel.interviewWeakness?.totalInterviews ?? 0,
                interviewWeaknessArea: weakness,
                hasResume: intel.readiness?.dimensions?.resume?.isAvailable ?? false,
                resumeMissingSkills: missingSkills,
                unlockedAchievementsCount: intel.achievements?.unlockedCount ?? 0,
                recentlyUnlockedBadgeTitle: intel.achievements?.recentlyUnlocked?.[0]?.title ?? null,
              });

              // Refresh notifications only if new smart notifications were generated
              if (created && created.length > 0) {
                const updated = await notificationService.fetchNotifications(userId);
                if (isMounted.current) {
                  setNotifications(updated);
                }
              }
            }
          })
          .catch(() => {});
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err?.message || 'Unable to load notifications.');
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    isMounted.current = true;

    if (!userId || authLoading) {
      setNotifications([]);
      setPreferences(null);
      setLoading(false);
      setError(null);
      return () => {
        isMounted.current = false;
      };
    }

    // Reset current notifications immediately on user change to ensure zero cross-account leakage
    setNotifications([]);
    loadData();

    // Subscribe to realtime updates for this user only
    const unsubscribe = notificationService.subscribeToNotifications(userId, (fresh) => {
      if (isMounted.current) {
        setNotifications(fresh);
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [loadData, userId, authLoading]);

  // 2. Action handlers (strictly guarded to authenticated user)
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );

      await notificationService.markAsRead(userId, notificationId);
    },
    [userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    await notificationService.markAllAsRead(userId);
  }, [userId]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      await notificationService.deleteNotification(userId, notificationId);
    },
    [userId]
  );

  const clearAll = useCallback(async () => {
    if (!userId) return;
    setNotifications([]);
    await notificationService.clearAllNotifications(userId);
  }, [userId]);

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!userId) return;
      const updated = await notificationService.updatePreferences(userId, updates);
      setPreferences(updated);
    },
    [userId]
  );

  const unreadCount = userId ? notifications.filter((n) => !n.is_read).length : 0;

  return {
    notifications: userId ? notifications : [],
    unreadCount,
    loading: authLoading ? false : loading,
    error,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    refreshNotifications: loadData,
  };
}
