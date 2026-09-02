import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  Code2,
  Brain,
  Cpu,
  FileText,
  Map,
  Calendar,
  Award,
  RefreshCw,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { careerIntelligenceService } from '../services/careerIntelligenceService';
import { UnifiedCareerIntelligence, AnalyticsTimeRange } from '../types/intelligence';
import { AnalyticsTopCards } from '../components/analytics/AnalyticsTopCards';
import { ReadinessTrendChart } from '../components/analytics/ReadinessTrendChart';
import { WeeklyProgressSection } from '../components/analytics/WeeklyProgressSection';
import { StrengthsWeaknessesSection } from '../components/analytics/StrengthsWeaknessesSection';
import { CodingAnalyticsSection } from '../components/analytics/CodingAnalyticsSection';
import { AptitudeAnalyticsSection } from '../components/analytics/AptitudeAnalyticsSection';
import { InterviewAnalyticsSection } from '../components/analytics/InterviewAnalyticsSection';
import { ResumeAnalyticsSection } from '../components/analytics/ResumeAnalyticsSection';
import { RoadmapAnalyticsSection } from '../components/analytics/RoadmapAnalyticsSection';
import { ActivityTimelineSection } from '../components/analytics/ActivityTimelineSection';
import { TimeRangeFilterBar } from '../components/analytics/TimeRangeFilterBar';
import { ReadinessDetailedModal } from '../components/readiness/ReadinessDetailedModal';
import { WeeklyReportModal } from '../components/intelligence/WeeklyReportModal';

interface ProgressAnalyticsPageProps {
  onNavigate: (route: string) => void;
}

type PillarTab = 'all' | 'coding' | 'placement' | 'interview' | 'resume' | 'roadmap' | 'timeline';

export const ProgressAnalyticsPage: React.FC<ProgressAnalyticsPageProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const studentId = user?.id || profile?.id || 'guest';

  const [intelligence, setIntelligence] = useState<UnifiedCareerIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PillarTab>('all');
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('all');
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const loadData = useCallback(
    async (force = false, selectedRange: AnalyticsTimeRange = timeRange) => {
      setIsLoading(true);
      try {
        const data = await careerIntelligenceService.getUnifiedIntelligence(studentId, {
          forceRefresh: force,
          profile: profileRef.current,
          timeRange: selectedRange,
        });
        setIntelligence(data);
      } catch (err) {
        console.error('[ProgressAnalyticsPage] Load error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [studentId, timeRange]
  );

  useEffect(() => {
    loadData(false, timeRange);
  }, [loadData, timeRange]);

  const handleTimeRangeChange = (newRange: AnalyticsTimeRange) => {
    setTimeRange(newRange);
    loadData(true, newRange);
  };

  if (isLoading && !intelligence) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Synthesizing multi-pillar performance metrics...
        </p>
      </div>
    );
  }

  const analytics = intelligence?.analytics;
  const readiness = intelligence?.readiness;
  const achievements = intelligence?.achievements;
  const weeklyReport = intelligence?.weeklyReport;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans space-y-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Activity className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Career Progress Analytics
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Production-grade analytics across your 5 preparation pillars computed from genuine activity telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <TimeRangeFilterBar
              selectedRange={timeRange}
              onChangeRange={handleTimeRangeChange}
            />

            <button
              onClick={() => setIsWeeklyReportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Weekly Report</span>
            </button>

            <button
              onClick={() => loadData(true, timeRange)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 1. Top-Level Overview Cards */}
        {analytics && (
          <AnalyticsTopCards
            readiness={readiness}
            coding={analytics.coding}
            placement={analytics.placement}
            interview={analytics.interview}
            resume={analytics.resume}
            roadmap={analytics.roadmap}
            onOpenBreakdown={() => setIsBreakdownOpen(true)}
            onNavigate={onNavigate}
          />
        )}

        {/* 2. Career Readiness Over Time Chart */}
        {analytics && (
          <ReadinessTrendChart
            trendPoints={analytics.readinessTrend || []}
            currentScore={readiness?.overallScore ?? null}
          />
        )}

        {/* 3. Weekly Progress & Comparison ("This Week") */}
        {analytics?.weeklyProgress && (
          <WeeklyProgressSection
            weekly={analytics.weeklyProgress}
            onOpenReportModal={() => setIsWeeklyReportOpen(true)}
          />
        )}

        {/* 4. Strengths and Areas to Improve */}
        {analytics && (
          <StrengthsWeaknessesSection
            provenStrengths={analytics.provenStrengths || []}
            areasToImprove={analytics.areasToImprove || []}
            onNavigate={onNavigate}
          />
        )}

        {/* Pillar Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'All Pillars', icon: Activity },
            { id: 'coding', label: 'Coding DSA', icon: Code2 },
            { id: 'placement', label: 'Placement Aptitude', icon: Brain },
            { id: 'interview', label: 'Mock Interviews', icon: Cpu },
            { id: 'resume', label: 'Resume & ATS', icon: FileText },
            { id: 'roadmap', label: 'Roadmap Progress', icon: Map },
            { id: 'timeline', label: 'Activity Timeline', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PillarTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Pillar Detail Sections */}
        {analytics && (
          <div className="space-y-6">
            {/* 1. Coding Pillar */}
            {(activeTab === 'all' || activeTab === 'coding') && (
              <CodingAnalyticsSection
                coding={analytics.coding}
                onNavigate={onNavigate}
              />
            )}

            {/* 2. Placement Pillar */}
            {(activeTab === 'all' || activeTab === 'placement') && (
              <AptitudeAnalyticsSection
                placement={analytics.placement}
                onNavigate={onNavigate}
              />
            )}

            {/* 3. Mock Interviews Pillar */}
            {(activeTab === 'all' || activeTab === 'interview') && (
              <InterviewAnalyticsSection
                interview={analytics.interview}
                onNavigate={onNavigate}
              />
            )}

            {/* 4. Resume Pillar */}
            {(activeTab === 'all' || activeTab === 'resume') && (
              <ResumeAnalyticsSection
                resume={analytics.resume}
                onNavigate={onNavigate}
              />
            )}

            {/* 5. Roadmap Pillar */}
            {(activeTab === 'all' || activeTab === 'roadmap') && (
              <RoadmapAnalyticsSection
                roadmap={analytics.roadmap}
                onNavigate={onNavigate}
              />
            )}

            {/* 6. Activity & Preparation Timeline */}
            {(activeTab === 'all' || activeTab === 'timeline') && (
              <ActivityTimelineSection
                activities={analytics.activityTimeline || []}
                onNavigate={onNavigate}
              />
            )}

            {/* 7. Cross-Platform Achievements */}
            {achievements && activeTab === 'all' && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <Award className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Cross-Platform Achievements
                      </h3>
                      <p className="text-xs text-slate-500">
                        {achievements.unlockedCount} of {achievements.totalCount} Badges Unlocked based on authentic milestones.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.isUnlocked
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-amber-300/60 dark:border-amber-700/50'
                          : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl text-white font-bold shrink-0 ${
                            item.isUnlocked ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                        >
                          <Award className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {item.title}
                            </h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                              {item.badgeLevel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{item.description}</p>
                          <div className="pt-1.5">
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${item.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Score Breakdown Modal */}
      {readiness && (
        <ReadinessDetailedModal
          readiness={readiness}
          isOpen={isBreakdownOpen}
          onClose={() => setIsBreakdownOpen(false)}
          onNavigate={onNavigate}
        />
      )}

      {/* Weekly Report Modal */}
      {weeklyReport && (
        <WeeklyReportModal
          report={weeklyReport}
          isOpen={isWeeklyReportOpen}
          onClose={() => setIsWeeklyReportOpen(false)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

