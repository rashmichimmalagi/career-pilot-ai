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
  currentPage?: string;
  showToast?: (title: string, subtitle?: string, type?: 'info' | 'warning' | 'error' | 'success') => void;
}

const QUOTE_INTERVAL_SECONDS = 5;

export function useNetworkInterruption({ user, currentPage, showToast }: UseNetworkInterruptionOptions) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [syncState, setSyncState] = useState<SyncState>(() => {
    return typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'idle';
  });

  const [currentQuote, setCurrentQuote] = useState<OfflineQuote>(() => getRandomOfflineQuote(undefined, currentPage));
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [quoteSecondsLeft, setQuoteSecondsLeft] = useState<number>(QUOTE_INTERVAL_SECONDS);

  const quoteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasOfflineRef = useRef<boolean>(false);
  const currentPageRef = useRef<string | undefined>(currentPage);
  currentPageRef.current = currentPage;

  // Sanitize technical/database errors for display
  const sanitizeSyncError = (err: any): string => {
    if (!err) return 'Sync could not be completed at this time.';
    const raw = typeof err === 'string' ? err : err.message || JSON.stringify(err);
    if (raw.toLowerCase().includes('violates row-level') || raw.toLowerCase().includes('jwt') || raw.toLowerCase().includes('auth')) {
      return 'Please ensure you are signed in so your changes can sync securely to your account.';
    }
    if (raw.toLowerCase().includes('network') || raw.toLowerCase().includes('fetch') || raw.toLowerCase().includes('failed to fetch')) {
      return 'Network connection was interrupted during sync. Your changes remain saved on this device.';
    }
    if (raw.toLowerCase().includes('schema') || raw.toLowerCase().includes('column')) {
      return 'Temporary sync service update in progress. Your data is safely preserved on this device.';
    }
    return 'Some changes are waiting for a stronger connection. They remain safe on this device.';
  };

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
          setSyncError(sanitizeSyncError(result.errors[0]));
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
      setSyncError(sanitizeSyncError(err));
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, refreshQueueCount]);

  // Rotate to next quote immediately and reset 5s timer
  const nextQuote = useCallback(() => {
    setCurrentQuote((prev) => getRandomOfflineQuote(prev.id, currentPageRef.current));
    setQuoteSecondsLeft(QUOTE_INTERVAL_SECONDS);
  }, []);

  // Continuous 5-second quote rotation timer while offline
  useEffect(() => {
    if (!isOnline && syncState === 'offline') {
      setQuoteSecondsLeft(QUOTE_INTERVAL_SECONDS);
      
      const interval = setInterval(() => {
        setQuoteSecondsLeft((prev) => {
          if (prev <= 1) {
            setCurrentQuote((current) => getRandomOfflineQuote(current.id, currentPageRef.current));
            return QUOTE_INTERVAL_SECONDS;
          }
          return prev - 1;
        });
      }, 1000);

      quoteTimerRef.current = interval;

      return () => {
        clearInterval(interval);
        quoteTimerRef.current = null;
      };
    } else {
      if (quoteTimerRef.current) {
        clearInterval(quoteTimerRef.current);
        quoteTimerRef.current = null;
      }
    }
  }, [isOnline, syncState]);

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
        showToast('Offline Mode Active', 'Your CareerPilot data is safe. Changes will be saved on this device.', 'warning');
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
      if (quoteTimerRef.current) clearInterval(quoteTimerRef.current);
    };
  }, [triggerSync, nextQuote, refreshQueueCount, showToast]);

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
    quoteSecondsLeft,
    totalQuoteIntervalSeconds: QUOTE_INTERVAL_SECONDS,
    setIsDismissed,
    triggerSync,
    nextQuote,
  };
}
