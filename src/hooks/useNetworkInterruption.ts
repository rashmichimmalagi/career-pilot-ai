import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { persistenceManager } from '../services/persistenceManager';
import { cloudSyncService } from '../services/cloudSyncService';
import { getRandomOfflineQuote, OfflineQuote } from '../data/offlineQuotes';
import { classifySyncError } from '../services/syncAuditService';
import { SyncErrorCategory } from '../types/sync';

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

export function useNetworkInterruption({ user, currentPage, showToast }: UseNetworkInterruptionOptions) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [syncState, setSyncState] = useState<SyncState>(() => {
    return typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'idle';
  });

  // Single tip initialized on open and displayed indefinitely
  const [currentQuote, setCurrentQuote] = useState<OfflineQuote>(() => getRandomOfflineQuote(undefined, currentPage));
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);
  const [errorCategory, setErrorCategory] = useState<SyncErrorCategory | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasOfflineRef = useRef<boolean>(false);
  const currentPageRef = useRef<string | undefined>(currentPage);
  currentPageRef.current = currentPage;

  // Update pending queue count
  const refreshQueueCount = useCallback(() => {
    if (user?.id) {
      const queue = persistenceManager.getOfflineQueue(user.id);
      setPendingQueueCount(queue.length);
    } else {
      setPendingQueueCount(0);
    }
  }, [user?.id]);

  // Execute full cloud sync with honest classification and exact queue accounting
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncState('offline');
      return;
    }

    setIsSyncing(true);
    setSyncState('syncing');
    setSyncError(null);
    setSyncSummary(null);
    setErrorCategory(null);

    try {
      if (user?.id) {
        // 1. Process offline queue with atomic confirmation
        const queueResult = await persistenceManager.processOfflineQueue(user.id);
        
        // 2. Perform local-to-cloud bidirectional sweep
        const syncResult = await cloudSyncService.syncLocalDataToCloud(user.id);
        
        refreshQueueCount();

        const allErrors = [...queueResult.errors, ...(syncResult.structuredErrors || [])];
        const totalPending = queueResult.remainingQueueCount;

        if (allErrors.length === 0 && syncResult.success && totalPending === 0) {
          setSyncState('synced');
          setSyncSummary('All changes synced successfully.');
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = setTimeout(() => {
            setSyncState('idle');
          }, 4000);
        } else if (allErrors.length > 0 || totalPending > 0) {
          const primaryErr = allErrors[0] || classifySyncError(syncResult.errors[0] || 'Sync incomplete');
          setErrorCategory(primaryErr.category);
          setSyncError(primaryErr.userMessage);

          if (queueResult.syncedCount > 0 && queueResult.failedCount > 0) {
            setSyncState('sync_partial');
            setSyncSummary(
              `${queueResult.syncedCount} change${queueResult.syncedCount > 1 ? 's' : ''} synced. ${queueResult.failedCount} change${queueResult.failedCount > 1 ? 's' : ''} waiting to retry.`
            );
          } else if (queueResult.failedCount > 0 || syncResult.errors.length > 0) {
            setSyncState('sync_failed');
            setSyncSummary('Connection restored, but some changes could not be synchronized.');
          } else {
            setSyncState('sync_partial');
            setSyncSummary('Some changes are still synchronizing with the cloud.');
          }
        } else {
          setSyncState('synced');
          setSyncSummary('All changes synced successfully.');
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = setTimeout(() => {
            setSyncState('idle');
          }, 4000);
        }
      } else {
        // Guest mode / Unauthenticated
        setSyncState('synced');
        setSyncSummary('Local changes preserved on this device.');
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
          setSyncState('idle');
        }, 3000);
      }
    } catch (err: any) {
      console.warn('Network reconnection sync error:', err);
      const classified = classifySyncError(err);
      setSyncState('sync_failed');
      setErrorCategory(classified.category);
      setSyncError(classified.userMessage);
      setSyncSummary('Connection restored, but changes could not be synchronized.');
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, refreshQueueCount]);

  // Manually rotate to next tip on explicit user button click (guaranteed non-repeating)
  const nextQuote = useCallback(() => {
    setCurrentQuote((prev) => getRandomOfflineQuote(prev?.id, currentPageRef.current));
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

        // Reconnection transition, then actual sync
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
      // Show fresh tip when panel opens on offline transition
      setCurrentQuote((prev) => getRandomOfflineQuote(prev?.id, currentPageRef.current));
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
    };
  }, [triggerSync, refreshQueueCount, showToast]);

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
    syncSummary,
    errorCategory,
    isDismissed,
    setIsDismissed,
    triggerSync,
    nextQuote,
  };
}
