import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import {
  inactivityService,
  INACTIVITY_TIMEOUT_MS,
  WARNING_THRESHOLD_MS,
} from '../services/inactivityService';

interface UseInactivityTimeoutOptions {
  user: User | null;
  loading: boolean;
  onSignOut: () => Promise<void>;
  onNavigate: (page: string) => void;
  showToast: (title: string, subtitle?: string, type?: 'info' | 'warning' | 'error' | 'success') => void;
}

export function useInactivityTimeout({
  user,
  loading,
  onSignOut,
  onNavigate,
  showToast,
}: UseInactivityTimeoutOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const isLoggingOutRef = useRef<boolean>(false);

  // Function to explicitly stay logged in
  const stayLoggedIn = useCallback(() => {
    inactivityService.resetTimer();
    setIsWarningOpen(false);
    setSecondsRemaining(60);
  }, []);

  // Handle automatic sign out
  const handleAutoLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setIsWarningOpen(false);
    inactivityService.clearTimer();

    try {
      await onSignOut();
    } catch (err) {
      console.warn('Inactivity auto sign-out error:', err);
    } finally {
      // Redirect to login with reason
      onNavigate('auth?mode=signin&reason=inactivity');
      showToast(
        'Session Expired',
        'Your session expired due to inactivity. Please sign in again.',
        'info'
      );
      isLoggingOutRef.current = false;
    }
  }, [onSignOut, onNavigate, showToast]);

  // Set up activity detection & listeners
  useEffect(() => {
    if (!user || loading) {
      setIsWarningOpen(false);
      isLoggingOutRef.current = false;
      return;
    }

    // Reset timer on initial login mount
    inactivityService.recordActivity(true);

    const handleUserActivity = () => {
      inactivityService.recordActivity(false);
    };

    // List of meaningful interaction events to monitor
    const activityEvents = [
      'mousemove',
      'mousedown',
      'pointerdown',
      'keydown',
      'keyup',
      'scroll',
      'wheel',
      'touchstart',
      'touchmove',
      'click',
      'focus',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true, capture: true });
    });

    // Custom internal activity event
    window.addEventListener('careerpilot_user_active', handleUserActivity);

    // Sync listener for cross-tab updates
    const unsubscribe = inactivityService.subscribe(() => {
      const inactive = inactivityService.getInactiveDuration();
      if (inactive < WARNING_THRESHOLD_MS) {
        setIsWarningOpen(false);
      }
    });

    // Check inactivity every 1 second
    const interval = setInterval(() => {
      if (isLoggingOutRef.current) return;

      const inactive = inactivityService.getInactiveDuration();

      if (inactive >= INACTIVITY_TIMEOUT_MS) {
        handleAutoLogout();
      } else if (inactive >= WARNING_THRESHOLD_MS) {
        const remaining = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - inactive) / 1000));
        setSecondsRemaining(remaining);
        setIsWarningOpen(true);
      } else {
        setIsWarningOpen(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity, { capture: true });
      });
      window.removeEventListener('careerpilot_user_active', handleUserActivity);
      clearInterval(interval);
      unsubscribe();
    };
  }, [user, loading, handleAutoLogout]);

  return {
    isWarningOpen,
    secondsRemaining,
    stayLoggedIn,
  };
}
