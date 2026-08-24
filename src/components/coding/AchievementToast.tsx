import React from 'react';
import { Sparkles, Trophy, X, ChevronRight } from 'lucide-react';
import { Achievement } from '../../types/coding';

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
  onViewAchievements: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onClose,
  onViewAchievements,
}) => {
  if (!achievement) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10 space-y-3 relative overflow-hidden backdrop-blur-md">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-2xl flex items-center justify-center shadow-inner shrink-0">
              <span>{achievement.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>🎉 Achievement Unlocked!</span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1.5">
                <span>{achievement.icon}</span>
                <span>{achievement.name}</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                "{achievement.unlockMessage || achievement.description}"
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onViewAchievements();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>View Achievements</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
