import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  WifiOff,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Minimize2,
  Maximize2,
  X,
  Code2,
} from 'lucide-react';
import { SyncState } from '../../hooks/useNetworkInterruption';
import { OfflineQuote, SOFTWARE_ENGINEERING_TIPS } from '../../data/offlineQuotes';

interface OfflineNetworkBannerProps {
  isOnline: boolean;
  syncState: SyncState;
  currentQuote?: OfflineQuote;
  pendingQueueCount?: number;
  isSyncing?: boolean;
  syncError?: string | null;
  syncSummary?: string | null;
  onRetrySync?: () => void;
  onNextQuote?: () => void;
}

export const OfflineNetworkBanner: React.FC<OfflineNetworkBannerProps> = ({
  isOnline,
  syncState,
  isSyncing = false,
  syncError,
  onRetrySync,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExplicitlyDismissed, setIsExplicitlyDismissed] = useState<boolean>(false);

  // Rotating Software Engineering Tips state (initializes with a random starting tip)
  const [currentTipIndex, setCurrentTipIndex] = useState<number>(() => {
    return Math.floor(Math.random() * SOFTWARE_ENGINEERING_TIPS.length);
  });
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasOnlineRef = useRef<boolean>(isOnline);

  const clearRotationTimer = useCallback(() => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
    }
  }, []);

  const startRotationTimer = useCallback(() => {
    clearRotationTimer();
    // Automatically rotate tips sequentially every 10 seconds (10,000ms)
    rotationTimerRef.current = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % SOFTWARE_ENGINEERING_TIPS.length);
    }, 10000);
  }, [clearRotationTimer]);

  // When offline mode starts or resumes, start the 10-second timer.
  // When connection restores or on unmount, clean up the timer.
  useEffect(() => {
    // When transitioning from online to offline, select a random starting tip
    if (wasOnlineRef.current && !isOnline) {
      setCurrentTipIndex(Math.floor(Math.random() * SOFTWARE_ENGINEERING_TIPS.length));
    }
    wasOnlineRef.current = isOnline;

    if (!isOnline) {
      startRotationTimer();
    } else {
      clearRotationTimer();
    }

    return () => {
      clearRotationTimer();
    };
  }, [isOnline, startRotationTimer, clearRotationTimer]);

  // Manual "Next Tip" advances sequentially immediately and cleanly restarts the 10-second timer
  const handleManualNextTip = useCallback(() => {
    setCurrentTipIndex((prev) => (prev + 1) % SOFTWARE_ENGINEERING_TIPS.length);
    if (!isOnline) {
      startRotationTimer();
    }
  }, [isOnline, startRotationTimer]);

  // If online and idle (no active sync notification), don't render anything
  if (isOnline && syncState === 'idle') {
    return null;
  }

  // If user explicitly closed the restored banner, don't show unless state changes
  if (isExplicitlyDismissed && isOnline) {
    return null;
  }

  const activeTip = SOFTWARE_ENGINEERING_TIPS[currentTipIndex] || SOFTWARE_ENGINEERING_TIPS[0];

  return (
    <div
      role="status"
      aria-live="polite"
      id="careerpilot-network-status-indicator"
      className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-96 transition-all duration-300 font-sans"
    >
      {/* ========================================================================= */}
      {/* 1. OFFLINE STATE BANNER (🔴) */}
      {/* ========================================================================= */}
      {!isOnline && (
        <div className="rounded-2xl border border-rose-500/40 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl p-4 sm:p-5 space-y-3.5 ring-1 ring-rose-500/20">
          
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <WifiOff className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping opacity-75" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-wider uppercase text-rose-400">
                    🔴 OFFLINE MODE ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Connection lost.
                </p>
              </div>
            </div>

            {/* Minimize / Maximize */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand offline details' : 'Minimize card'}
                aria-label={isMinimized ? 'Expand offline details' : 'Minimize card'}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Safety & Protected Indicator */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="text-[11px]">Your CareerPilot data is safe</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              Protected
            </span>
          </div>

          {!isMinimized && (
            <>
              {/* Context Explanation */}
              <p className="text-xs text-slate-300 leading-relaxed">
                Your CareerPilot data is safe. Changes will sync when your connection returns.
              </p>

              {/* Software Engineering Tip Panel with Automatic Rotation */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Software Engineering Tip</span>
                  </span>
                  
                  <button
                    onClick={handleManualNextTip}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/50"
                    title="Next software engineering tip"
                    aria-label="Next software engineering tip"
                  >
                    <span>Next Tip →</span>
                  </button>
                </div>

                {/* Tip Content - Automatically cycles every 10 seconds */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/20 text-xs text-slate-200 leading-relaxed transition-opacity duration-300">
                  "{activeTip.quote}"
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RECONNECTION & SYNCING STATE BANNER (🟡) */}
      {/* ========================================================================= */}
      {isOnline && (syncState === 'reconnecting' || syncState === 'syncing') && (
        <div className="rounded-2xl border border-amber-500/40 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl p-4 space-y-2.5 ring-1 ring-amber-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-amber-400 flex items-center gap-1">
                  <span>🟡 SYNCING DATA</span>
                </span>
                <p className="text-[11px] text-slate-300">
                  {syncState === 'reconnecting' ? 'Reconnecting to CareerPilot...' : 'Connection restored. Resuming cloud synchronization...'}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              Syncing
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-indigo-400 h-full w-3/4 animate-pulse" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SYNCED SUCCESS BANNER (🟢) */}
      {/* ========================================================================= */}
      {isOnline && syncState === 'synced' && (
        <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl p-4 space-y-2 ring-1 ring-emerald-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                  🟢 CONNECTION RESTORED
                </span>
                <p className="text-[11px] text-slate-200 font-medium">
                  Your CareerPilot data is safe.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Synced ✓
              </span>
              <button
                onClick={() => setIsExplicitlyDismissed(true)}
                className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Dismiss"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SYNC ATTENTION NEEDED / PARTIAL OR FAILED BANNER (🟠) */}
      {/* ========================================================================= */}
      {isOnline && (syncState === 'sync_failed' || syncState === 'sync_partial') && (
        <div className="rounded-2xl border border-orange-500/40 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl p-4 space-y-3 ring-1 ring-orange-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-orange-400">
                  🟠 SYNC ATTENTION NEEDED
                </span>
                <p className="text-[11px] text-slate-300">
                  Connection restored, but synchronization encountered an issue.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExplicitlyDismissed(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {syncError && (
            <p className="text-[11px] text-amber-200 bg-amber-950/40 p-2.5 rounded-lg border border-amber-900/40 leading-relaxed">
              {syncError}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[10px] text-slate-400">
              Your CareerPilot data is safe.
            </span>
            {onRetrySync && (
              <button
                onClick={onRetrySync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Retry Sync'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

