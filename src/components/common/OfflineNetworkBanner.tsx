import React, { useState } from 'react';
import {
  WifiOff,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Minimize2,
  Maximize2,
  Sparkles,
  Database,
  X,
  Code2,
  FileText,
  Briefcase,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { SyncState } from '../../hooks/useNetworkInterruption';
import { OfflineQuote } from '../../data/offlineQuotes';

interface OfflineNetworkBannerProps {
  isOnline: boolean;
  syncState: SyncState;
  currentQuote: OfflineQuote;
  pendingQueueCount: number;
  isSyncing: boolean;
  syncError: string | null;
  quoteSecondsLeft?: number;
  totalQuoteIntervalSeconds?: number;
  onRetrySync: () => void;
  onNextQuote: () => void;
}

export const OfflineNetworkBanner: React.FC<OfflineNetworkBannerProps> = ({
  isOnline,
  syncState,
  currentQuote,
  pendingQueueCount,
  isSyncing,
  syncError,
  quoteSecondsLeft = 5,
  totalQuoteIntervalSeconds = 5,
  onRetrySync,
  onNextQuote,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExplicitlyDismissed, setIsExplicitlyDismissed] = useState<boolean>(false);

  // If online and idle (no active sync notification), don't render anything
  if (isOnline && syncState === 'idle') {
    return null;
  }

  // If user closed the restored banner, don't show unless state changes
  if (isExplicitlyDismissed && isOnline) {
    return null;
  }

  // Calculate percentage of remaining time for the 5-second countdown progress bar
  const progressPercent = Math.max(0, Math.min(100, (quoteSecondsLeft / totalQuoteIntervalSeconds) * 100));

  // Category Icon Resolver
  const renderCategoryIcon = () => {
    switch (currentQuote.iconType) {
      case 'coding':
      case 'debugging':
      case 'typescript':
      case 'javascript':
        return <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'resume':
      case 'resumeanalysis':
      case 'ats':
        return <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'techinterview':
      case 'hrinterview':
      case 'career':
        return <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'placement':
      case 'learning':
        return <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      id="careerpilot-network-status-indicator"
      className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-96 transition-all duration-300 font-sans"
    >
      {/* ========================================================================= */}
      {/* 1. OFFLINE STATE BANNER */}
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
                  Connection interrupted.
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

          {/* Status-Aware Safety & Persistence Indicator */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="text-[11px]">
                {pendingQueueCount > 0 ? 'Changes saved on this device' : 'Your CareerPilot data is safe'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              {pendingQueueCount > 0 ? 'Offline changes saved' : 'Protected'}
            </span>
          </div>

          {!isMinimized && (
            <>
              {/* Context Explanation */}
              <p className="text-xs text-slate-300 leading-relaxed">
                You can continue practicing problems and reviewing materials. Everything will automatically synchronize when your internet connection is restored.
              </p>

              {pendingQueueCount > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                  <Database className="w-3.5 h-3.5 shrink-0" />
                  <span>{pendingQueueCount} change{pendingQueueCount > 1 ? 's' : ''} queued to sync automatically once connected.</span>
                </div>
              )}

              {/* Motivational & Developer Tip Rotating Panel (5s Continuous Cycle) */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    {renderCategoryIcon()}
                    <span className="truncate max-w-[170px]">{currentQuote.categoryLabel}</span>
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {/* Subtle 5s Countdown Indicator */}
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {quoteSecondsLeft}s
                    </span>

                    <button
                      onClick={onNextQuote}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer bg-slate-800/60 hover:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/50"
                      title="Next developer tip"
                      aria-label="Next developer tip"
                    >
                      <span>Next Tip</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Progress bar across the 5-second tip interval */}
                <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-400 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Tip Content */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/20 text-xs text-slate-200 leading-relaxed">
                  "{currentQuote.quote}"
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RECONNECTION & SYNCING STATE BANNER */}
      {/* ========================================================================= */}
      {isOnline && (syncState === 'reconnecting' || syncState === 'syncing') && (
        <div className="rounded-2xl border border-indigo-500/40 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl p-4 space-y-2.5 ring-1 ring-indigo-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-indigo-400 flex items-center gap-1">
                  <span>🟢 CONNECTION RESTORED</span>
                </span>
                <p className="text-[11px] text-slate-300">
                  {syncState === 'reconnecting' ? 'Reconnecting to CareerPilot...' : 'Synchronizing your recent progress...'}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
              Syncing
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SYNCED SUCCESS BANNER */}
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
                <p className="text-[11px] text-slate-200 font-semibold">
                  All changes synced
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                All changes synced ✓
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
          <p className="text-[11px] text-slate-400 pl-10.5">
            Your submissions, notes, and practice progress are securely updated.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SYNC PARTIAL OR FAILED BANNER */}
      {/* ========================================================================= */}
      {isOnline && (syncState === 'sync_failed' || syncState === 'sync_partial') && (
        <div className="rounded-2xl border border-amber-500/40 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl p-4 space-y-3 ring-1 ring-amber-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-amber-400">
                  ⚠️ SYNC ATTENTION NEEDED
                </span>
                <p className="text-[11px] text-slate-300">
                  Connection restored, but some changes are still waiting to sync.
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

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onRetrySync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Retry Sync'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
