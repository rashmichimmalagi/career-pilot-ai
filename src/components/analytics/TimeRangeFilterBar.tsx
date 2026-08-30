import React from 'react';
import { Filter, Calendar } from 'lucide-react';
import { AnalyticsTimeRange } from '../../types/intelligence';

interface TimeRangeFilterBarProps {
  selectedRange: AnalyticsTimeRange;
  onChangeRange: (range: AnalyticsTimeRange) => void;
}

export const TimeRangeFilterBar: React.FC<TimeRangeFilterBarProps> = ({
  selectedRange,
  onChangeRange,
}) => {
  const options: Array<{ id: AnalyticsTimeRange; label: string }> = [
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs self-start">
      <div className="flex items-center gap-1 px-2.5 py-1 text-slate-400 text-xs font-semibold">
        <Calendar className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Range:</span>
      </div>
      {options.map((opt) => {
        const isActive = selectedRange === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChangeRange(opt.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isActive
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
