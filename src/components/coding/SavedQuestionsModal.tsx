import React, { useState, useMemo } from 'react';
import {
  BookmarkCheck,
  X,
  Search,
  Trash2,
  Play,
  Layers,
  FolderOpen,
  Filter,
  ExternalLink,
  Clock,
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { SavedQuestion, CodingLanguage, CodingProblem } from '../../types/coding';
import { getSubjectDefaultLanguage } from '../../services/codingService';

interface SavedQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedQuestions: SavedQuestion[];
  onSelectProblem: (problem: CodingProblem, language?: CodingLanguage) => void;
  onRemoveSaved: (questionId: string) => void;
  onRetrySync?: (problem: CodingProblem) => Promise<void>;
}

export const SavedQuestionsModal: React.FC<SavedQuestionsModalProps> = ({
  isOpen,
  onClose,
  savedQuestions,
  onSelectProblem,
  onRemoveSaved,
  onRetrySync,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    savedQuestions.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    return Array.from(set);
  }, [savedQuestions]);

  const filteredQuestions = useMemo(() => {
    return savedQuestions.filter((q) => {
      if (selectedSubject !== 'all' && q.subject !== selectedSubject) return false;
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (q.title || '').toLowerCase().includes(query);
        const matchesTopic = (q.topic || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesTopic) return false;
      }

      return true;
    });
  }, [savedQuestions, searchQuery, selectedSubject, selectedDifficulty]);

  const handleRetry = async (q: SavedQuestion) => {
    if (!onRetrySync || !q.question_data) return;
    try {
      setRetryingId(q.question_id || q.id);
      await onRetrySync(q.question_data);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      setDeletingId(questionId);
      await onRemoveSaved(questionId);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="saved-questions-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Saved & Bookmarked Questions
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">
                  {savedQuestions.length} Saved
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authoritative Supabase storage with offline backup. Access on any device.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="close-saved-modal-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search saved problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Subject filter */}
            {subjectsList.length > 0 && (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Subjects</option>
                {subjectsList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}

            {/* Difficulty filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Saved List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="py-16 text-center">
              <BookmarkCheck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">No bookmarked questions</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {savedQuestions.length === 0
                  ? 'Click the Save bookmark icon on any question in the Practice view to persist it authoritatively to Supabase cloud.'
                  : 'No saved questions match your current search or filter.'}
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const diffBadgeClass =
                q.difficulty === 'Easy'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : q.difficulty === 'Medium'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

              const isPending = q.cloudSynced === false || q.persistenceStatus === 'pending';
              const targetQId = q.question_id || q.id;

              return (
                <div
                  key={targetQId}
                  id={`saved-card-${targetQId}`}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                        {q.title}
                      </h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${diffBadgeClass}`}>
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {q.subject} • {q.topic}
                      </span>

                      {/* Cloud Sync Status Badge */}
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <CloudOff className="w-3 h-3 text-amber-400" />
                          <span>Sync Pending</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Cloud className="w-3 h-3 text-emerald-400" />
                          <span>Synced</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        Saved on {new Date(q.saved_at || q.created_at || Date.now()).toLocaleDateString()}
                      </span>
                      {isPending && onRetrySync && (
                        <button
                          type="button"
                          onClick={() => handleRetry(q)}
                          disabled={retryingId === targetQId}
                          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline text-[11px] cursor-pointer"
                        >
                          {retryingId === targetQId ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Syncing...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              <span>Retry Cloud Sync</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleDelete(targetQId)}
                      disabled={deletingId === targetQId}
                      title="Remove Bookmark"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                    >
                      {deletingId === targetQId ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (q.question_data) {
                          onSelectProblem(q.question_data, getSubjectDefaultLanguage(q.subject as any));
                          onClose();
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Solve</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>Persisted authoritatively to Supabase table <code className="text-amber-300">saved_coding_questions</code>.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
