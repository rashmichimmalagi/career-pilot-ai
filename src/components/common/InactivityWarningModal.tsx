import React from 'react';
import { Clock, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

interface InactivityWarningModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onStayLoggedIn: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  secondsRemaining,
  onStayLoggedIn,
}) => {
  if (!isOpen) return null;

  // Format seconds into MM:SS
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-dialog-title"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center transition-all animate-in zoom-in-95 duration-200">
        
        {/* Animated Icon & Ambient Glow */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/20 dark:bg-amber-500/30 rounded-2xl blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            <Clock className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Session Inactivity Notice</span>
          </div>

          <h2
            id="inactivity-dialog-title"
            className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight"
          >
            Session Timeout Warning
          </h2>

          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Your session will expire in 1 minute due to inactivity.
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click below to keep your session active and continue your preparation without interruption.
          </p>
        </div>

        {/* Live Countdown Display */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 font-mono">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Auto sign-out in:</span>
          <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono tracking-wider">
            {formattedTime}
          </span>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            onClick={onStayLoggedIn}
            autoFocus
            className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
          >
            <UserCheck className="w-4 h-4" />
            <span>Stay Logged In</span>
          </button>
        </div>

      </div>
    </div>
  );
};
