import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Circle,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Search,
  Sparkles,
  Layers,
  Code2,
  Sliders,
  Play,
  ArrowRight,
  Filter,
  Check,
  Zap,
  Target,
  BarChart2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import {
  CodingSubject,
  CodingDifficulty,
  CodingLanguage,
  CodingProblem,
  QuestionSeriesItem,
  QuestionStatus,
  TopicProgressSummary,
} from '../../types/coding';
import {
  SUBJECTS,
  SUBJECT_TOPICS,
  DIFFICULTIES,
  LANGUAGES,
  getAvailableLanguagesForSubject,
  getSubjectDefaultLanguage,
} from '../../services/codingService';
import { getAvailableTopicsWithCounts } from '../../data/codingQuestionBank';

interface TopicQuestionSeriesViewProps {
  currentSubject: CodingSubject;
  currentTopic: string;
  currentDifficulty: CodingDifficulty;
  currentLanguage: CodingLanguage;
  onSubjectChange: (subject: CodingSubject) => void;
  onTopicChange: (topic: string) => void;
  onDifficultyChange: (diff: CodingDifficulty) => void;
  onLanguageChange: (lang: CodingLanguage) => void;
  seriesItems: QuestionSeriesItem[];
  topicProgress: TopicProgressSummary | null;
  isLoadingSeries: boolean;
  onSelectProblem: (problem: CodingProblem, preferredLanguage?: CodingLanguage) => void;
  onToggleSaveBookmark: (problem: CodingProblem) => void;
  onGenerateCustomProblem: () => void;
  isGeneratingAI: boolean;
  onOpenSavedModal: () => void;
  savedCount: number;
}

export const TopicQuestionSeriesView: React.FC<TopicQuestionSeriesViewProps> = ({
  currentSubject,
  currentTopic,
  currentDifficulty,
  currentLanguage,
  onSubjectChange,
  onTopicChange,
  onDifficultyChange,
  onLanguageChange,
  seriesItems,
  topicProgress,
  isLoadingSeries,
  onSelectProblem,
  onToggleSaveBookmark,
  onGenerateCustomProblem,
  isGeneratingAI,
  onOpenSavedModal,
  savedCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved' | 'saved'>('all');
  const [topicFilterQuery, setTopicFilterQuery] = useState('');

  // Available topics for current subject with question counts
  const topicCounts = useMemo(() => {
    return getAvailableTopicsWithCounts(currentSubject);
  }, [currentSubject]);

  const availableLanguages = useMemo(() => {
    return getAvailableLanguagesForSubject(currentSubject);
  }, [currentSubject]);

  // Filtered series items
  const filteredSeries = useMemo(() => {
    return seriesItems.filter((item) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesTopic = item.topic.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTopic) return false;
      }

      // Status filter
      if (statusFilter === 'solved' && item.status !== 'solved') return false;
      if (statusFilter === 'unsolved' && item.status === 'solved') return false;
      if (statusFilter === 'saved' && !item.isSaved) return false;

      return true;
    });
  }, [seriesItems, searchQuery, statusFilter]);

  const solvedInSeries = useMemo(() => {
    return seriesItems.filter((i) => i.status === 'solved').length;
  }, [seriesItems]);

  const firstUnsolvedItem = useMemo(() => {
    return seriesItems.find((i) => i.status !== 'solved');
  }, [seriesItems]);

  const totalInSeries = seriesItems.length;
  const seriesPercentage = totalInSeries > 0 ? Math.round((solvedInSeries / totalInSeries) * 100) : 0;

  return (
    <div className="space-y-6" id="topic-question-series-root">
      {/* 1. SELECTION BAR: Subject -> Topic -> Difficulty -> Language */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Question Discovery Flow</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Topic-Based Question Series
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal border border-indigo-500/30">
                Curated Practice
              </span>
            </h2>
          </div>

          {/* Quick Access to Saved Questions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSavedModal}
              id="view-saved-questions-btn"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 border border-amber-500/30 transition-all shadow-sm group"
            >
              <BookmarkCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Saved Questions</span>
              {savedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                  {savedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 4-Step Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* Step 1: Subject */}
          <div className="space-y-1.5" id="subject-selector-block">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              Subject
            </label>
            <select
              value={currentSubject}
              onChange={(e) => {
                const nextSub = e.target.value as CodingSubject;
                onSubjectChange(nextSub);
                const availableForSub = SUBJECT_TOPICS[nextSub] || SUBJECT_TOPICS.DSA;
                onTopicChange(availableForSub[0]);
                onLanguageChange(getSubjectDefaultLanguage(nextSub));
              }}
              id="select-subject-dropdown"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
            >
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub} className="bg-slate-900 text-white">
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Topic */}
          <div className="space-y-1.5" id="topic-selector-block">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              Topic
            </label>
            <select
              value={currentTopic}
              onChange={(e) => onTopicChange(e.target.value)}
              id="select-topic-dropdown"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
            >
              {topicCounts.map((t) => (
                <option key={t.topic} value={t.topic} className="bg-slate-900 text-white">
                  {t.topic} {t.totalQuestions > 0 ? `(${t.totalQuestions} problems)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Difficulty */}
          <div className="space-y-1.5" id="difficulty-selector-block">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                3
              </span>
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-700/80">
              {DIFFICULTIES.map((diff) => {
                const isSelected = currentDifficulty === diff;
                const activeClasses =
                  diff === 'Easy'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : diff === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => onDifficultyChange(diff)}
                    id={`diff-btn-${diff.toLowerCase()}`}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all text-center border ${
                      isSelected
                        ? `${activeClasses} shadow-sm`
                        : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Language */}
          <div className="space-y-1.5" id="language-selector-block">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                4
              </span>
              Language
            </label>
            <select
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value as CodingLanguage)}
              id="select-language-dropdown"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
            >
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang} className="bg-slate-900 text-white">
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Breadcrumb Path */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-medium">Active Track:</span>
            <span className="font-semibold text-slate-200">{currentSubject}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-indigo-300">{currentTopic}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span
              className={`font-semibold ${
                currentDifficulty === 'Easy'
                  ? 'text-emerald-400'
                  : currentDifficulty === 'Medium'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {currentDifficulty}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-cyan-300">{currentLanguage}</span>
          </div>

          {topicProgress && (
            <div className="flex items-center gap-2 text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
              <span className="text-slate-400">Topic Solved:</span>
              <span className="font-bold text-emerald-400">
                {topicProgress.solvedQuestions} / {topicProgress.totalQuestions}
              </span>
              <span className="text-[11px] text-slate-400">({topicProgress.percentage}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. QUESTION SERIES LIST CONTAINER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Series Header & Search / Filters */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {currentTopic} — {currentDifficulty}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {filteredSeries.length} {filteredSeries.length === 1 ? 'Question' : 'Questions'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Progress through this curated series to build pattern recognition and interview fluency in {currentLanguage}.
              </p>
            </div>

            {/* Actions and Progress indicator */}
            <div className="flex items-center gap-3 flex-wrap">
              {firstUnsolvedItem && (
                <button
                  type="button"
                  onClick={() => onSelectProblem(firstUnsolvedItem.problem, currentLanguage)}
                  id="start-next-unsolved-btn"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Solve Next ({firstUnsolvedItem.title})</span>
                </button>
              )}

              <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-200">
                    {solvedInSeries} of {totalInSeries} Solved
                  </div>
                  <div className="text-[10px] text-slate-400">{seriesPercentage}% completion</div>
                </div>
                <div className="w-12 h-12 relative flex items-center justify-center">
                  <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 transition-all duration-700"
                      strokeDasharray={`${seriesPercentage}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-slate-200">
                    {seriesPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search questions in this series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="search-series-questions-input"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'unsolved', label: 'Unsolved' },
                  { id: 'solved', label: 'Solved' },
                  { id: 'saved', label: 'Saved' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  id={`filter-series-${f.id}-btn`}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === f.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question Series List Items */}
        {isLoadingSeries ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
            <p className="text-sm font-medium text-slate-300">Loading Question Series...</p>
            <p className="text-xs text-slate-500 mt-1">Retrieving authentic problem bank & status</p>
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No questions found matching your filter</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Try adjusting your search query or generate an original AI problem tailored for {currentTopic} ({currentDifficulty}).
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition-all"
              >
                Clear Filters
              </button>
              <button
                onClick={onGenerateCustomProblem}
                disabled={isGeneratingAI}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all font-medium disabled:opacity-50 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Custom AI Problem</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60" id="question-series-items-list">
            {filteredSeries.map((item, index) => {
              const isSolved = item.status === 'solved';
              const isInProgress = item.status === 'in_progress';

              const diffBadgeClass =
                item.difficulty === 'Easy'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : item.difficulty === 'Medium'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

              return (
                <div
                  key={item.id}
                  id={`series-item-${item.id}`}
                  className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  {/* Left: Number + Title + Metadata */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      {isSolved ? (
                        <div
                          className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30"
                          title="Solved"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                      ) : isInProgress ? (
                        <div
                          className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30"
                          title="Attempted / In Progress"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center border border-slate-700"
                          title="Not Attempted"
                        >
                          <span className="text-xs font-semibold">{index + 1}</span>
                        </div>
                      )}
                    </div>

                    {/* Question details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onSelectProblem(item.problem, currentLanguage)}
                          className="text-sm font-semibold text-slate-100 hover:text-indigo-300 transition-colors text-left group-hover:text-indigo-300"
                        >
                          {index + 1}. {item.title}
                        </button>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${diffBadgeClass}`}
                        >
                          {item.difficulty}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {item.topic}
                        </span>
                      </div>

                      {/* Brief description excerpt */}
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {item.problem.description || item.problem.problem_statement}
                      </p>

                      {/* Status indicator note */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                        {isSolved && (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Solved
                          </span>
                        )}
                        {isInProgress && (
                          <span className="text-amber-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> In Progress ({item.attemptsCount} {item.attemptsCount === 1 ? 'attempt' : 'attempts'})
                          </span>
                        )}
                        {!isSolved && !isInProgress && (
                          <span className="text-slate-500">Not Attempted</span>
                        )}
                        {item.problem.expectedComplexity && (
                          <span className="text-slate-500">
                            Time: {item.problem.expectedComplexity.time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Bookmark + Action Button */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Bookmark toggle button */}
                    <button
                      onClick={() => onToggleSaveBookmark(item.problem)}
                      title={item.isSaved ? 'Remove Bookmark' : 'Save for Later'}
                      id={`bookmark-btn-${item.id}`}
                      className={`p-2 rounded-xl border transition-all ${
                        item.isSaved
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-amber-300 hover:border-amber-500/30'
                      }`}
                    >
                      {item.isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>

                    {/* Solve Challenge CTA button */}
                    <button
                      onClick={() => onSelectProblem(item.problem, currentLanguage)}
                      id={`solve-btn-${item.id}`}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                        isSolved
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isSolved ? 'Re-attempt' : 'Solve Challenge'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Series Footer: AI Custom Problem Generator Bar */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Need more practice on this topic? Generate a brand-new AI challenge with strict test cases.</span>
          </div>
          <button
            onClick={onGenerateCustomProblem}
            disabled={isGeneratingAI}
            id="generate-more-ai-series-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-medium transition-all shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            {isGeneratingAI ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Authoring AI Problem...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Generate New Problem with AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
