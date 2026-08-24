import React from 'react';
import { Mail, BellRing, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SendTestEmailCardProps {
  variant?: 'card' | 'compact' | 'inline';
  className?: string;
}

export const SendTestEmailCard: React.FC<SendTestEmailCardProps> = ({
  variant = 'card',
  className = '',
}) => {
  const { user } = useAuth();
  const studentEmail = user?.email || '';

  if (variant === 'inline') {
    return (
      <div
        id="email-notifications-coming-soon-inline"
        className={`p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-white to-slate-50/80 dark:from-indigo-950/20 dark:via-slate-900/60 dark:to-slate-900/80 border border-indigo-500/20 ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Email Notifications
                </p>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Coming Soon
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                CareerPilot will soon send personalized preparation reminders, practice recommendations, interview reminders, and important placement updates directly to your registered email.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="email-notifications-coming-soon-card"
      className={`p-5 rounded-3xl bg-gradient-to-br from-indigo-500/5 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-900/80 dark:to-slate-900 border border-indigo-500/20 shadow-xs space-y-3 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Email Notifications</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider">
                Coming Soon
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated placement copilot alerts and weekly progress summaries
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          CareerPilot will soon send personalized preparation reminders, practice recommendations, interview reminders, and important placement updates directly to your registered email ({studentEmail || 'your account email'}).
        </p>
      </div>
    </div>
  );
};

