import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  id?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Back',
  className = '',
  id,
}) => {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-4 py-2 h-10 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/30 cursor-pointer group select-none ${className}`}
    >
      <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:-translate-x-0.5 transition-transform shrink-0" />
      <span>{label}</span>
    </button>
  );
};
