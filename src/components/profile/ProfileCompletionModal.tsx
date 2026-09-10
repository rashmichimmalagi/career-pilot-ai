import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Compass,
  Map,
  FileCheck2,
  TrendingUp,
  Bot,
  ArrowRight,
} from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  completionPercentage?: number;
  onComplete: () => void;
  onDismiss: () => void;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  completionPercentage,
  onComplete,
  onDismiss,
}) => {
  const completeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap & keyboard accessibility (Escape key closes)
  useEffect(() => {
    if (!isOpen) return;

    // Focus primary CTA on open
    const timer = setTimeout(() => {
      completeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-completion-title"
      aria-describedby="profile-completion-desc"
      onClick={(e) => {
        // Dismiss if user clicks on the backdrop outside the modal dialog
        if (e.target === e.currentTarget) {
          onDismiss();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/15 via-sky-500/10 to-transparent blur-3xl pointer-events-none" />

        {/* Top Header with Close Button */}
        <div className="relative z-10 px-6 pt-6 pb-2 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2
                id="profile-completion-title"
                className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5"
              >
                <span>👋 Complete Your Profile</span>
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                Personalized Onboarding
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="relative z-10 px-6 py-4 space-y-4">
          <p
            id="profile-completion-desc"
            className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed"
          >
            Complete your profile to get the most personalized experience from CareerPilot AI.
          </p>

          {typeof completionPercentage === 'number' && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Current Profile Completion</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{completionPercentage}% Complete</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
                />
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 space-y-2.5">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Completing your profile personalizes:
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Career guidance</span>
              </li>
              <li className="flex items-center gap-2">
                <Map className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Career roadmap</span>
              </li>
              <li className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Resume matching</span>
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Career readiness insights</span>
              </li>
              <li className="flex items-center gap-2 sm:col-span-2">
                <Bot className="w-4 h-4 text-amber-500 shrink-0" />
                <span>AI recommendations tailored to your goals</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Footer */}
        <div className="relative z-10 px-6 py-4 bg-slate-50/80 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            id="profile-modal-maybe-later-btn"
            type="button"
            onClick={onDismiss}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            Maybe Later
          </button>
          <button
            id="profile-modal-complete-btn"
            ref={completeButtonRef}
            type="button"
            onClick={onComplete}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <span>Complete Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
