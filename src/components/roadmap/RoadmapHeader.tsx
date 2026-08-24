import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Building2,
  Briefcase,
  Edit3,
  Check,
  X,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import { POPULAR_ROLES } from '../../data/companyProfiles';

interface RoadmapHeaderProps {
  targetRole: string;
  targetCompany?: string;
  onRoleChange: (newRole: string) => void;
  onNavigateToCompanyPrep: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
  sourceContext?: string | null;
  onBackToDashboard?: () => void;
  onBackToCompanyPrep?: () => void;
  isFromDashboard?: boolean;
}

export const RoadmapHeader: React.FC<RoadmapHeaderProps> = ({
  targetRole,
  targetCompany,
  onRoleChange,
  onNavigateToCompanyPrep,
  onRefresh,
  isRefreshing,
  lastUpdated,
  sourceContext,
  onBackToDashboard,
  onBackToCompanyPrep,
  isFromDashboard,
}) => {
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRoleOption, setSelectedRoleOption] = useState<string>(targetRole);
  const [customRoleText, setCustomRoleText] = useState<string>('');

  const handleSaveRole = () => {
    if (selectedRoleOption === '+ Custom Role') {
      if (customRoleText.trim()) {
        onRoleChange(customRoleText.trim());
      }
    } else {
      onRoleChange(selectedRoleOption);
    }
    setIsEditingRole(false);
  };

  const handleCancelRole = () => {
    setSelectedRoleOption(targetRole);
    setCustomRoleText('');
    setIsEditingRole(false);
  };

  const showDashboardBack = sourceContext === 'preparation-dashboard' || sourceContext === 'dashboard' || isFromDashboard;
  const showCompanyPrepBack = sourceContext === 'company-preparation' || sourceContext === 'company-prep';

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Title & Subtitle */}
        <div className="space-y-2">
          {showDashboardBack && onBackToDashboard && (
            <div className="mb-2">
              <button
                type="button"
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors shadow-2xs cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Preparation Dashboard</span>
              </button>
            </div>
          )}

          {showCompanyPrepBack && onBackToCompanyPrep && (
            <div className="mb-2">
              <button
                type="button"
                onClick={onBackToCompanyPrep}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors shadow-2xs cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Company Preparation</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>CareerPilot AI Guidance</span>
            </span>
            {targetCompany && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Targeting {targetCompany}</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <span>🗺️ Personalized Career Roadmap</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Real-time step-by-step preparation plan telling you exactly what to practice next to become placement-ready.
          </p>
        </div>

        {/* Right Actions (Refresh & Company Sync) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isRefreshing ? 'Recalculating...' : 'Refresh Roadmap'}</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToCompanyPrep}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{targetCompany ? `Edit ${targetCompany} Plan` : 'Target a Company'}</span>
          </button>
        </div>
      </div>

      {/* Target Role Selector & Company Badge */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>

          {!isEditingRole ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Target Career Role
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoleOption(POPULAR_ROLES.includes(targetRole) ? targetRole : '+ Custom Role');
                    if (!POPULAR_ROLES.includes(targetRole)) {
                      setCustomRoleText(targetRole);
                    }
                    setIsEditingRole(true);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Change Role</span>
                </button>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                {targetRole}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 w-full max-w-xl">
              <select
                value={selectedRoleOption}
                onChange={(e) => setSelectedRoleOption(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {POPULAR_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value="+ Custom Role">+ Custom Role</option>
              </select>

              {selectedRoleOption === '+ Custom Role' && (
                <input
                  type="text"
                  value={customRoleText}
                  onChange={(e) => setCustomRoleText(e.target.value)}
                  placeholder="Enter custom role title..."
                  className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 flex-1 min-w-[160px]"
                />
              )}

              <button
                type="button"
                onClick={handleSaveRole}
                className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCancelRole}
                className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {targetCompany ? (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-slate-400">Targeting:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              🏢 {targetCompany}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onNavigateToCompanyPrep}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>+ Link a Target Company for custom weightage</span>
          </button>
        )}
      </div>
    </div>
  );
};
