import React from 'react';
import { CheckCircle2, LogOut, AlertCircle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  subtitle?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl dark:shadow-indigo-950/50 flex items-start gap-3.5 text-slate-900 dark:text-slate-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div
        className={`p-2 rounded-xl shrink-0 ${
          toast.type === 'info'
            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
            : toast.type === 'error'
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
        }`}
      >
        {toast.type === 'info' ? (
          <LogOut className="w-5 h-5" />
        ) : toast.type === 'error' ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          <CheckCircle2 className="w-5 h-5" />
        )}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug">
          {toast.title}
        </h4>
        {toast.subtitle && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            {toast.subtitle}
          </p>
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
