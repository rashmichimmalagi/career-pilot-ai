import React, { useState } from 'react';
import { Building2, Briefcase, Plus, ChevronDown, Check, Sparkles, BookmarkPlus } from 'lucide-react';
import { POPULAR_COMPANY_PROFILES, TARGET_ROLE_OPTIONS } from '../../data/companyProfiles';

interface CompanySelectorProps {
  selectedCompany: string;
  isCustomCompany: boolean;
  customCompanyName: string;
  selectedRole: string;
  isCustomRole: boolean;
  customRoleName: string;
  onCompanyChange: (company: string, isCustom: boolean, customName?: string) => void;
  onRoleChange: (role: string, isCustom: boolean, customName?: string) => void;
  onSaveAsTarget?: () => void;
  isSaved?: boolean;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  selectedCompany,
  isCustomCompany,
  customCompanyName,
  selectedRole,
  isCustomRole,
  customRoleName,
  onCompanyChange,
  onRoleChange,
  onSaveAsTarget,
  isSaved = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const displayCompanyName = isCustomCompany ? (customCompanyName || 'Custom Company') : selectedCompany;
  const displayRoleName = isCustomRole ? (customRoleName || 'Custom Role') : selectedRole;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Select Target Company & Role
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                CareerPilot tailors your preparation roadmap to the exact hiring pattern of your target company.
              </p>
            </div>
          </div>
        </div>

        {onSaveAsTarget && (
          <button
            onClick={onSaveAsTarget}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto ${
              isSaved
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Target Saved</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save to My Target Companies</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* 1. Target Company Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Target Company
          </label>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                setRoleDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5 truncate">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{displayCompanyName}</span>
                {isCustomCompany && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    Custom
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Top Tech & Campus Recruiters
                </div>
                {POPULAR_COMPANY_PROFILES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onCompanyChange(c.name, false);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                      !isCustomCompany && selectedCompany.toLowerCase() === c.name.toLowerCase()
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{c.tier}</span>
                  </button>
                ))}

                <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1" />

                <button
                  type="button"
                  onClick={() => {
                    onCompanyChange('Custom Company', true, customCompanyName || '');
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                    isCustomCompany
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Company</span>
                </button>
              </div>
            )}
          </div>

            {isCustomCompany && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Company Name
              </label>
              <input
                type="text"
                value={customCompanyName}
                onChange={(e) => onCompanyChange('Custom Company', true, e.target.value)}
                placeholder="Enter company name (e.g. Adobe, Atlassian, Uber, Morgan Stanley)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-amber-500/40 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          )}
        </div>

        {/* 2. Target Role Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Target Role
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setRoleDropdownOpen(!roleDropdownOpen);
                setDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5 truncate">
                <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="truncate">{displayRoleName}</span>
                {isCustomRole && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    Custom
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Target Engineering Roles
                </div>
                {TARGET_ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      onRoleChange(role, false);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                      !isCustomRole && selectedRole === role
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{role}</span>
                  </button>
                ))}

                <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1" />

                <button
                  type="button"
                  onClick={() => {
                    onRoleChange('Custom Role', true, customRoleName || '');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                    isCustomRole
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Role</span>
                </button>
              </div>
            )}
          </div>

          {isCustomRole && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Role Title
              </label>
              <input
                type="text"
                value={customRoleName}
                onChange={(e) => onRoleChange('Custom Role', true, e.target.value)}
                placeholder="Enter role title (e.g. AI Engineer, Site Reliability Engineer, Embedded Dev)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-amber-500/40 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
