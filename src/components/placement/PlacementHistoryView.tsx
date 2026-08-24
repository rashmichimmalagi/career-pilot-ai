import React, { useState } from 'react';
import {
  History,
  ArrowLeft,
  Search,
  Filter,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Eye,
  Trash2,
  Brain,
  Code2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  PlacementCategory,
  PlacementDifficulty,
  PlacementStudentStats,
  PlacementTestSession,
} from '../../types/placement';
import { deletePlacementSession } from '../../services/placementStorage';

interface PlacementHistoryViewProps {
  history: PlacementTestSession[];
  stats: PlacementStudentStats;
  onBackToSetup: () => void;
  onSelectSession: (session: PlacementTestSession) => void;
  onReplaySession: (session: PlacementTestSession) => void;
  onRefreshHistory: () => void;
  studentId: string;
}

export const PlacementHistoryView: React.FC<PlacementHistoryViewProps> = ({
  history,
  stats,
  onBackToSetup,
  onSelectSession,
  onReplaySession,
  onRefreshHistory,
  studentId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredHistory = history.filter((s) => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && s.difficulty !== selectedDifficulty) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = s.subject?.toLowerCase().includes(q);
      const matchTopic = s.topic?.toLowerCase().includes(q);
      if (!matchSubject && !matchTopic) return false;
    }
    return true;
  });

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this placement practice test record?')) {
      deletePlacementSession(sessionId, studentId);
      onRefreshHistory();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSetup}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Placement Practice History</span>
            </h1>
            <p className="text-xs text-slate-500">
              Track your test scores, accuracy trends, and topic milestones over time.
            </p>
          </div>
        </div>

        <button
          onClick={onBackToSetup}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Practice Session</span>
        </button>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tests Completed</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stats.totalTests}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total MCQs Solved</span>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.totalQuestionsSolved}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Accuracy</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.overallAccuracy}%</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Perfect Scores (100%)</span>
          <p className="text-2xl font-extrabold text-amber-500">{stats.perfectScoresCount}</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject or topic..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category & Difficulty Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            {['all', 'Aptitude', 'Technical'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Domains' : cat}
              </button>
            ))}
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            {['all', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedDifficulty === diff
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {diff === 'all' ? 'All Tiers' : diff}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* History Cards / List */}
      {filteredHistory.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No practice tests found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {history.length === 0
                ? 'You haven\'t completed any placement practice tests yet. Start your first session to track your growth!'
                : 'No tests match your active search and filter criteria.'}
            </p>
          </div>
          <button
            onClick={onBackToSetup}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch First Test</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectSession(s)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  s.category === 'Aptitude'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                }`}>
                  {s.category === 'Aptitude' ? <Brain className="w-5 h-5" /> : <Code2 className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {s.subject} · {s.topic}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.difficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : s.difficulty === 'Hard'
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    }`}>
                      {s.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono">
                      {s.mode === 'timed' ? 'Timed' : 'Practice'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{s.formattedDate || 'Recent'}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(s.timeTakenSeconds)}</span>
                    </span>
                    <span>·</span>
                    <span>{s.correctCount}/{s.totalQuestions} Correct</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Score Pill & Actions */}
              <div className="flex items-center gap-4 shrink-0 sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                    {s.score}%
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {s.accuracy}% Accuracy
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReplaySession(s);
                    }}
                    title="Practice Again with this configuration"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, s.id)}
                    title="Delete Record"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 text-slate-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
