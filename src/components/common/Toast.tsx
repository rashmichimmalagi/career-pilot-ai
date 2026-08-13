import React from 'react';
import { CheckCircle2, LogOut, AlertCircle, AlertTriangle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  subtitle?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

const GithubIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const isGitHubToast =
    toast.title.toLowerCase().includes('github') ||
    (toast.action?.label || '').toLowerCase().includes('github');

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-5 right-5 sm:right-6 z-[9999] max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 shadow-2xl dark:shadow-indigo-950/50 backdrop-blur-xl flex items-start gap-3.5 text-slate-900 dark:text-slate-100 transition-all duration-300 animate-in fade-in slide-in-from-top-5"
    >
      <div
        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
          isGitHubToast
            ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-slate-700/50'
            : toast.type === 'info'
            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
            : toast.type === 'warning'
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            : toast.type === 'error'
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
        }`}
      >
        {isGitHubToast ? (
          <GithubIcon />
        ) : toast.type === 'info' ? (
          <LogOut className="w-5 h-5" />
        ) : toast.type === 'warning' ? (
          <AlertTriangle className="w-5 h-5" />
        ) : toast.type === 'error' ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          <CheckCircle2 className="w-5 h-5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug">
          {toast.title}
        </h4>
        {toast.subtitle && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {toast.subtitle}
          </p>
        )}
        {toast.action && (
          <div className="mt-3">
            <button
              onClick={() => {
                toast.action?.onClick();
                onClose();
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2 ${
                isGitHubToast
                  ? 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isGitHubToast && <GithubIcon />}
              <span>{toast.action.label}</span>
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};


