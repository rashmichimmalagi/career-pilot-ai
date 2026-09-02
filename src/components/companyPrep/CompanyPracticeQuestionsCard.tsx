import React from 'react';
import {
  Terminal,
  Code2,
  BrainCircuit,
  MessageSquare,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { CompanyProfile } from '../../types/companyPrep';

interface CompanyPracticeQuestionsCardProps {
  company: CompanyProfile;
  targetRole: string;
  onNavigateToModule: (route: string, params?: any) => void;
}

export const CompanyPracticeQuestionsCard: React.FC<CompanyPracticeQuestionsCardProps> = ({
  company,
  targetRole,
  onNavigateToModule,
}) => {
  const hiringRounds = company.hiringProcess || [
    { roundNumber: 1, title: 'Online Assessment (DSA & MCQs)', duration: '60 mins', roundType: 'Online Assessment', description: 'Screening round', focusAreas: ['DSA', 'Aptitude'] },
    { roundNumber: 2, title: 'Technical Round 1 (DSA & Problem Solving)', duration: '45 mins', roundType: 'Technical Round 1', description: 'Core DSA', focusAreas: ['Arrays', 'Trees'] },
    { roundNumber: 3, title: 'Technical Round 2 (System Design & Core CS)', duration: '45 mins', roundType: 'Technical Round 2', description: 'Architecture & CS', focusAreas: ['System Design', 'DBMS'] },
    { roundNumber: 4, title: 'HR & Behavioral Fit Round', duration: '30 mins', roundType: 'HR / Behavioral', description: 'Culture and values', focusAreas: ['STAR Method', 'Leadership'] },
  ];

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Terminal className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              {company.name} Practice Launchpad
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Practice high-frequency interview patterns and assessment rounds tailored for {company.name}.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Coding Challenge */}
        <div
          onClick={() =>
            onNavigateToModule('coding', {
              company: company.name,
              role: targetRole,
              subject: 'DSA',
              auto: true,
            })
          }
          className="p-4 rounded-2xl bg-slate-50 hover:bg-cyan-50/50 dark:bg-slate-800/40 dark:hover:bg-cyan-950/20 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer space-y-2 group"
          role="button"
          tabIndex={0}
        >
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 w-fit">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              Coding Arena
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Practice {company.name} high-frequency DSA questions.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 pt-1">
            <span>Solve DSA</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Technical Mock Interview */}
        <div
          onClick={() =>
            onNavigateToModule('interview', {
              company: company.name,
              role: targetRole,
              interviewType: 'technical',
            })
          }
          className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-800/40 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer space-y-2 group"
          role="button"
          tabIndex={0}
        >
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 w-fit">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Technical Mock Interview
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live AI mock interview with {company.name} rubric.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 pt-1">
            <span>Start Technical Round</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Behavioral HR Round */}
        <div
          onClick={() =>
            onNavigateToModule('interview', {
              company: company.name,
              role: targetRole,
              interviewType: 'hr',
            })
          }
          className="p-4 rounded-2xl bg-slate-50 hover:bg-purple-50/50 dark:bg-slate-800/40 dark:hover:bg-purple-950/20 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer space-y-2 group"
          role="button"
          tabIndex={0}
        >
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              HR & Culture Fit
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              STAR behavioral & leadership scenario questions.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 pt-1">
            <span>Practice HR Round</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Placement Screening Practice */}
        <div
          onClick={() =>
            onNavigateToModule('placement', {
              company: company.name,
              category: 'Technical',
            })
          }
          className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 dark:bg-slate-800/40 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group"
          role="button"
          tabIndex={0}
        >
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Screening Tests
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Timed Aptitude & Core CS screening assessments.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
            <span>Take Test</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

      </div>

      {/* Hiring Process Rounds Breakdown */}
      <div className="pt-2">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          {company.name} Hiring Process Rounds
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {hiringRounds.map((round, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                  Round {round.roundNumber || idx + 1}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {round.duration || '45-60 mins'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium line-clamp-2">
                {round.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
