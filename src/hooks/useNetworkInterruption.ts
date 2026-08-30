import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { persistenceManager } from '../services/persistenceManager';
import { cloudSyncService } from '../services/cloudSyncService';
import { getRandomOfflineQuote, OfflineQuote } from '../data/offlineQuotes';

export type SyncState =
  | 'idle'
  | 'offline'
  | 'reconnecting'
  | 'syncing'
  | 'synced'
  | 'sync_partial'
  | 'sync_failed';

interface UseNetworkInterruptionOptions {
  user: User | null;
  showToast?: (title: string, subtitle?: string, type?: 'info' | 'warning' | 'error' | 'success') => void;
}

export function useNetworkInterruption({ user, showToast }: UseNetworkInterruptionOptions) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [syncState, setSyncState] = useState<SyncState>(() => {
    return typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'idle';
  });

  const [currentQuote, setCurrentQuote] = useState<OfflineQuote>(() => getRandomOfflineQuote());
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const quoteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasOfflineRef = useRef<boolean>(false);

  // Update pending queue count
  const refreshQueueCount = useCallback(() => {
    if (user?.id) {
      const queue = persistenceManager.getOfflineQueue(user.id);
      setPendingQueueCount(queue.length);
    } else {
      setPendingQueueCount(0);
    }
  }, [user?.id]);

  // Execute full cloud sync with real status
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncState('offline');
      return;
    }

    setIsSyncing(true);
    setSyncState('syncing');
    setSyncError(null);

    try {
      if (user?.id) {
        // 1. Process offline queue
        await persistenceManager.processOfflineQueue(user.id);
        // 2. Perform local-to-cloud sync
        const result = await cloudSyncService.syncLocalDataToCloud(user.id);
        
        refreshQueueCount();

        if (result.success && result.errors.length === 0) {
          setSyncState('synced');
          // Auto-hide synced state after 4 seconds
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = setTimeout(() => {
            setSyncState('idle');
          }, 4000);
        } else if (result.errors.length > 0) {
          setSyncState('sync_partial');
          setSyncError(result.errors[0]);
        } else {
          setSyncState('synced');
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = setTimeout(() => {
            setSyncState('idle');
          }, 4000);
        }
      } else {
        // Unauthenticated - local only, no cloud sync needed
        setSyncState('synced');
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
          setSyncState('idle');
        }, 3000);
      }
    } catch (err: any) {
      console.warn('Network reconnection sync error:', err);
      setSyncState('sync_failed');
      setSyncError(err?.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, refreshQueueCount]);

  // Rotate to next quote
  const nextQuote = useCallback(() => {
    setCurrentQuote((prev) => getRandomOfflineQuote(prev.id));
  }, []);

  // Monitor network online / offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissed(false);

      if (wasOfflineRef.current) {
        setSyncState('reconnecting');
        if (showToast) {
          showToast('Connection Restored', 'Reconnecting to CareerPilot...', 'info');
        }

        // Brief reconnecting delay, then actual sync
        setTimeout(() => {
          triggerSync();
        }, 1200);
      } else {
        setSyncState('idle');
      }
      wasOfflineRef.current = false;
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false);
      wasOfflineRef.current = true;
      setSyncState('offline');
      nextQuote();
      refreshQueueCount();
      if (showToast) {
        showToast('Offline Mode Active', 'Your CareerPilot data is safe and saved locally.', 'warning');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [triggerSync, nextQuote, refreshQueueCount, showToast]);

  // Quote rotation timer while offline (every 25 seconds)
  useEffect(() => {
    if (!isOnline && syncState === 'offline') {
      quoteTimerRef.current = setInterval(() => {
        nextQuote();
      }, 25000);
    } else {
      if (quoteTimerRef.current) {
        clearInterval(quoteTimerRef.current);
        quoteTimerRef.current = null;
      }
    }

    return () => {
      if (quoteTimerRef.current) {
        clearInterval(quoteTimerRef.current);
        quoteTimerRef.current = null;
      }
    };
  }, [isOnline, syncState, nextQuote]);

  // Refresh pending queue periodically
  useEffect(() => {
    refreshQueueCount();
  }, [refreshQueueCount]);

  return {
    isOnline,
    syncState,
    currentQuote,
    pendingQueueCount,
    isSyncing,
    syncError,
    isDismissed,
    setIsDismissed,
    triggerSync,
    nextQuote,
  };
}
