import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Terminal,
  Code2,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  BarChart2,
  Calendar,
  Flame,
  Award,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Zap,
  BookOpen,
  ArrowRight,
  RefreshCw,
  X,
  Layers,
  Trophy,
  Lock,
  Cloud,
  CloudOff,
  Loader2
} from 'lucide-react';
import {
  CodingSubmission,
  CodingProblem,
  CodingProgress,
  CodingDifficulty,
  CodingSubject,
  CodingLanguage
} from '../../types/coding';
import { codingService } from '../../services/codingService';
import { calculateAchievements, formatEarnedDate } from '../../services/achievementService';
import { AchievementsSection } from './AchievementsSection';

interface MyPracticeViewProps {
  userId: string;
  onSelectProblemForPractice: (problem: CodingProblem, language?: CodingLanguage) => void;
  onSwitchToArena: () => void;
}

export const MyPracticeView: React.FC<MyPracticeViewProps> = ({
  userId,
  onSelectProblemForPractice,
  onSwitchToArena,
}) => {
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [progress, setProgress] = useState<CodingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('All');

  // Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<CodingSubmission | null>(null);
  const [selectedProblemData, setSelectedProblemData] = useState<CodingProblem | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadData = async () => {
    try {
      const subs = await codingService.getSubmissions(userId);
      setSubmissions(subs);
      const computedProg = codingService.calculateCodingProgress(subs, userId);
      setProgress(computedProg);
    } catch (err) {
      console.warn('Error loading submissions or progress:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Derive dynamic stats from submissions as single source of truth
  const activeStats = codingService.calculateCodingProgress(submissions, userId);
  const achievementsSummary = calculateAchievements(submissions, userId);

  const availableSubjectFilters = React.useMemo(() => {
    const baseSubjects = [
      'DSA',
      'DBMS',
      'SQL',
      'Operating Systems',
      'Computer Networks',
      'OOP',
      'Java',
      'Python',
      'C/C++',
      'Web Development',
      'System Design',
    ];
    const customSubjectsFromSubs = submissions
      .map((s) => s.subject)
      .filter((s): s is string => Boolean(s && s.trim() && s !== '+ Custom Subject' && !baseSubjects.includes(s)));

    const uniqueCustom = Array.from(new Set(customSubjectsFromSubs));
    return { baseSubjects, uniqueCustom };
  }, [submissions]);

  const successRateText = activeStats.problems_attempted > 0
    ? (activeStats.success_rate % 1 === 0 ? activeStats.success_rate.toFixed(0) : activeStats.success_rate.toFixed(1))
    : '0';

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleRetryCloudSync = async (sub: CodingSubmission, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await codingService.saveSubmission(sub);
      if (res.cloudSynced) {
        setSubmissions((prev) => prev.map((s) => (s.id === res.id ? res : s)));
      }
    } catch (_) {}
  };

  const handleViewSubmission = async (sub: CodingSubmission) => {
    setSelectedSubmission(sub);
    setIsLoadingProblem(true);
    try {
      if (sub.problem_id) {
        const prob = await codingService.getProblemById(sub.problem_id);
        setSelectedProblemData(prob);
      } else {
        setSelectedProblemData(null);
      }
    } catch (err) {
      console.warn('Error fetching problem details:', err);
      setSelectedProblemData(null);
    } finally {
      setIsLoadingProblem(false);
    }
  };

  const handleCopyModalCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRetryProblemFromSubmission = (sub: CodingSubmission) => {
    if (selectedProblemData) {
      onSelectProblemForPractice(selectedProblemData, sub.language);
    } else {
      // Create minimal problem structure from submission metadata
      const fallbackProb: CodingProblem = {
        id: sub.problem_id || `prob_${Date.now()}`,
        title: sub.problem_title || 'Practiced Problem',
        difficulty: sub.difficulty || 'Medium',
        subject: sub.subject || 'DSA',
        topic: sub.topic || 'General',
        tags: [sub.topic || 'General', sub.subject || 'DSA'],
        description: `Practice session for ${sub.problem_title || 'this problem'} in ${sub.topic || 'DSA'}.`,
        constraints: ['Standard algorithmic time and space constraints apply.'],
        examples: [],
        hiddenTestCases: [],
        expectedComplexity: { time: 'O(N)', space: 'O(1)' },
        starterCode: {},
        functionSignature: {},
        created_at: new Date().toISOString(),
      };
      onSelectProblemForPractice(fallbackProb, sub.language);
    }
  };

  // Filter Submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const titleMatch =
      !searchQuery ||
      (sub.problem_title && sub.problem_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub.topic && sub.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub.language && sub.language.toLowerCase().includes(searchQuery.toLowerCase()));

    const subjectMatch =
      selectedSubjectFilter === 'All' || sub.subject === selectedSubjectFilter;

    const statusMatch =
      selectedStatusFilter === 'All' ||
      (selectedStatusFilter === 'accepted' && sub.status === 'accepted') ||
      (selectedStatusFilter === 'wrong_answer' && sub.status !== 'accepted');

    const difficultyMatch =
      selectedDifficultyFilter === 'All' || sub.difficulty === selectedDifficultyFilter;

    return titleMatch && subjectMatch && statusMatch && difficultyMatch;
  });

  const getDifficultyBadge = (diff?: CodingDifficulty) => {
    switch (diff) {
      case 'Easy':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            Hard
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
            Medium
          </span>
        );
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* SECTION 1: PRACTICE ANALYTICS & PROGRESS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Solved Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Problems Solved
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {activeStats.problems_solved}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              / {activeStats.problems_attempted} attempted
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  activeStats.problems_attempted > 0
                    ? Math.min(100, Math.round((activeStats.problems_solved / activeStats.problems_attempted) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Success Rate
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {successRateText}%
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              acceptance
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, activeStats.success_rate))}%` }}
            />
          </div>
        </div>

        {/* Practice Streak Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Practice Streak
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                <span>🔥</span>
                <span>{achievementsSummary.currentStreak}</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {achievementsSummary.currentStreak === 1 ? 'Day Active' : 'Days Active'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Longest Streak:</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                🏆 {achievementsSummary.longestStreak} {achievementsSummary.longestStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              {achievementsSummary.streakMotivationalMessage}
            </p>
          </div>
        </div>

        {/* Difficulty Solved Breakdown Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Difficulty Mastery
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 text-center py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="block text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                {activeStats.easy_solved}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Easy
              </span>
            </div>
            <div className="flex-1 text-center py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="block text-xs font-extrabold text-amber-700 dark:text-amber-300">
                {activeStats.medium_solved}
              </span>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                Med
              </span>
            </div>
            <div className="flex-1 text-center py-1 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="block text-xs font-extrabold text-rose-700 dark:text-rose-300">
                {activeStats.hard_solved}
              </span>
              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                Hard
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 🏆 MY ACHIEVEMENTS DASHBOARD OVERVIEW */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-indigo-500/10 dark:from-amber-950/20 dark:via-purple-950/10 dark:to-indigo-950/20 border-2 border-amber-500/20 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  🏆 My Achievements
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 font-mono">
                  Earned: {achievementsSummary.unlockedCount} / {achievementsSummary.totalCount}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Permanent badge collection recognizing your problem-solving consistency, streak milestones, and difficulty mastery.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('coding-achievements-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>View All Achievements</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* Latest Unlocked Badge */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-300/60 dark:border-amber-700/40 shadow-xs flex items-center gap-3">
            {achievementsSummary.latestUnlocked ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <span>{achievementsSummary.latestUnlocked.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Latest Achievement</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    {achievementsSummary.latestUnlocked.name}
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Unlocked on {formatEarnedDate(achievementsSummary.latestUnlocked.unlockedAt)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    No badges earned yet
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Complete your first coding challenge to earn your first badge.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Progress toward Next Badge */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2">
            {achievementsSummary.nextMilestone ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    <Lock className="w-3 h-3" />
                    <span>Next Milestone</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {achievementsSummary.nextMilestone.progressLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg">{achievementsSummary.nextMilestone.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {achievementsSummary.nextMilestone.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {achievementsSummary.nextMilestone.description}
                    </div>
                  </div>
                </div>

                <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (achievementsSummary.nextMilestone.progress /
                            achievementsSummary.nextMilestone.maxProgress) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    All 16 Badges Unlocked!
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Legendary status achieved across all streak and mastery categories!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: FULL ACHIEVEMENTS & BADGES COLLECTION */}
      <AchievementsSection summary={achievementsSummary} />

      {/* SECTION 3: SUBMISSION HISTORY & FILTER BAR */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Submission History</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredSubmissions.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All saved code submissions, AI evaluations, and performance records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToArena}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Practice Arena</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problem title or topic..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Subjects</option>
            <optgroup label="Standard Subjects">
              {availableSubjectFilters.baseSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </optgroup>
            {availableSubjectFilters.uniqueCustom.length > 0 && (
              <optgroup label="Custom Subjects">
                {availableSubjectFilters.uniqueCustom.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="accepted">Accepted Only</option>
            <option value="wrong_answer">Wrong Answer / Needs Work</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficultyFilter}
            onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Submissions List */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading your practice history...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-16 text-center space-y-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {submissions.length === 0 ? 'No submissions yet' : 'No matching submissions found'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {submissions.length === 0
                  ? 'Start practicing interview problems in the Coding Arena to track your submissions here.'
                  : 'Try adjusting your search query or filters above.'}
              </p>
            </div>
            {submissions.length === 0 && (
              <button
                type="button"
                onClick={onSwitchToArena}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Go to Practice Arena</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredSubmissions.map((sub) => {
              const isAccepted = sub.status === 'accepted';
              const submittedCodeSnippet = sub.submitted_code || sub.code || '';
              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 hover:bg-white dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-all shadow-2xs hover:shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Status & Problem Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isAccepted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isAccepted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {sub.problem_title || 'Coding Practice Problem'}
                        </h4>
                        {getDifficultyBadge(sub.difficulty)}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                          {sub.language || 'Python'}
                        </span>
                        {sub.subject && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                            {sub.subject}
                          </span>
                        )}
                        {sub.topic && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            • {sub.topic}
                          </span>
                        )}
                      </div>

                      {/* Metrics row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {sub.test_cases_passed || 0}/{sub.total_test_cases || 5} Test Cases Passed
                          </span>
                        </span>

                        {sub.runtime_ms !== undefined && sub.runtime_ms > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sub.runtime_ms} ms</span>
                          </span>
                        )}

                        {sub.memory_kb !== undefined && sub.memory_kb > 0 && (
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-slate-400" />
                            <span>{(sub.memory_kb / 1024).toFixed(1)} MB</span>
                          </span>
                        )}

                        <span className="text-slate-400">•</span>
                        <span>{formatDate(sub.created_at)}</span>

                        <span className="text-slate-400">•</span>
                        {sub.cloudSynced || sub.persistenceStatus === 'synced' ? (
                          <span
                            title="Synced to Supabase Cloud"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"
                          >
                            <Cloud className="w-3.5 h-3.5" />
                            <span>Synced</span>
                          </span>
                        ) : sub.persistenceStatus === 'saving' ? (
                          <span
                            title="Syncing to Cloud..."
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium"
                          >
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Syncing...</span>
                          </span>
                        ) : (
                          <span
                            title={sub.cloudSyncError ? 'Cloud sync pending. Click to retry.' : 'Saved on this device. Will sync automatically.'}
                            className="inline-flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium"
                          >
                            <CloudOff className="w-3.5 h-3.5" />
                            <span>Saved on device</span>
                            <button
                              type="button"
                              onClick={(e) => handleRetryCloudSync(sub, e)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Retry</span>
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleViewSubmission(sub)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>View Submission</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleViewSubmission(sub);
                        handleRetryProblemFromSubmission(sub);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Practice Again</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SUBMISSION DETAIL MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedSubmission.status === 'accepted'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                    }`}
                  >
                    {selectedSubmission.status === 'accepted' ? 'Accepted' : (selectedSubmission.status_text || 'Wrong Answer')}
                  </span>
                  {getDifficultyBadge(selectedSubmission.difficulty)}
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300">
                    {selectedSubmission.language}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">
                  {selectedSubmission.problem_title || 'Submission Details'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Test Cases
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    {selectedSubmission.test_cases_passed || 0}/{selectedSubmission.total_test_cases || 5}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Runtime
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    {selectedSubmission.runtime_ms || 24} ms
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Memory
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    {selectedSubmission.memory_kb ? (selectedSubmission.memory_kb / 1024).toFixed(1) : '14.2'} MB
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Submitted
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {formatDate(selectedSubmission.created_at)}
                  </span>
                </div>
              </div>

              {/* Submitted Code View */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Your Submitted Code</span>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyModalCode(selectedSubmission.submitted_code || selectedSubmission.code || '')
                    }
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-64 border border-slate-800 shadow-inner">
                  <pre className="whitespace-pre">
                    {selectedSubmission.submitted_code || selectedSubmission.code || '// No code stored'}
                  </pre>
                </div>
              </div>

              {/* AI Feedback & Analysis */}
              {selectedSubmission.ai_feedback && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                      AI Code Evaluation & Insights
                    </h4>
                  </div>

                  {selectedSubmission.ai_feedback.summary && (
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {selectedSubmission.ai_feedback.summary}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {selectedSubmission.ai_feedback.timeComplexity && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/50 dark:border-indigo-800/40 text-xs">
                        <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase">
                          Time Complexity
                        </span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {selectedSubmission.ai_feedback.timeComplexity}
                        </span>
                      </div>
                    )}

                    {selectedSubmission.ai_feedback.spaceComplexity && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/50 dark:border-indigo-800/40 text-xs">
                        <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase">
                          Space Complexity
                        </span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {selectedSubmission.ai_feedback.spaceComplexity}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedSubmission.ai_feedback.optimalApproach && (
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-800 dark:text-slate-200">Optimal Approach: </strong>
                      {selectedSubmission.ai_feedback.optimalApproach}
                    </div>
                  )}

                  {Array.isArray(selectedSubmission.ai_feedback.suggestions) &&
                    selectedSubmission.ai_feedback.suggestions.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Suggestions:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                          {selectedSubmission.ai_feedback.suggestions.map((sug: string, i: number) => (
                            <li key={i}>{sug}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  handleRetryProblemFromSubmission(selectedSubmission);
                  setSelectedSubmission(null);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Practice in Coding Arena</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
