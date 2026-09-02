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
  syncSummary?: string | null;
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
  syncSummary,
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
                Your recent changes are safely queued and will sync when the connection returns. You can continue practicing problems and reviewing materials.
              </p>

              {pendingQueueCount > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                  <Database className="w-3.5 h-3.5 shrink-0" />
                  <span>{pendingQueueCount} change{pendingQueueCount > 1 ? 's' : ''} queued to sync automatically once connected.</span>
                </div>
              )}

              {/* Developer Tip Panel (Static display, manual next button, zero auto-rotation) */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    {renderCategoryIcon()}
                    <span className="truncate max-w-[190px]">{currentQuote.categoryLabel}</span>
                  </span>
                  
                  <button
                    onClick={onNextQuote}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/50"
                    title="Next developer tip"
                    aria-label="Next developer tip"
                  >
                    <span>Next Tip →</span>
                  </button>
                </div>

                {/* Tip Content - Stays indefinitely */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/20 text-xs text-slate-200 leading-relaxed">
                  "{currentQuote.quote}"
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
                  {syncState === 'reconnecting' ? 'Reconnecting to CareerPilot...' : 'Connection restored. Syncing your pending changes...'}
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
                <p className="text-[11px] text-slate-200 font-semibold">
                  {syncSummary || 'All changes synced successfully.'}
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
          <p className="text-[11px] text-slate-400 pl-10.5">
            Your submissions, notes, and practice progress are securely updated.
          </p>
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
                  {syncSummary || 'Connection restored, but some changes are still waiting to sync.'}
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
              {pendingQueueCount > 0 ? `${pendingQueueCount} change${pendingQueueCount > 1 ? 's' : ''} queued` : 'Data preserved locally'}
            </span>
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
