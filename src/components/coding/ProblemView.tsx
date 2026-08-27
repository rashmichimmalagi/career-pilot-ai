import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  HelpCircle,
  Layers,
  FileCode,
  Tag,
  BookOpen,
  Clock,
  Cpu,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { CodingProblem, CodingSubmission, CodingLanguage } from '../../types/coding';

interface ProblemViewProps {
  problem: CodingProblem;
  selectedLanguage?: CodingLanguage;
  submissions?: CodingSubmission[];
  hasSubmitted?: boolean;
  onRestoreCode?: (code: string) => void;
  onRetryCloudSave?: (submission: CodingSubmission) => void;
}

export const ProblemView: React.FC<ProblemViewProps> = React.memo(({
  problem,
  selectedLanguage = 'Python',
  submissions = [],
  hasSubmitted = false,
  onRestoreCode,
  onRetryCloudSave,
}) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[RENDER] ProblemView:', problem?.id, problem?.title);
  }
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'submissions'>('description');
  const [copiedInputIdx, setCopiedInputIdx] = useState<number | null>(null);
  const [expandedHints, setExpandedHints] = useState<Record<number, boolean>>({});
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});
  const [copiedSubId, setCopiedSubId] = useState<string | null>(null);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedInputIdx(idx);
    setTimeout(() => setCopiedInputIdx(null), 2000);
  };

  const copySubmissionCode = (subId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSubId(subId);
    setTimeout(() => setCopiedSubId(null), 2000);
  };

  const toggleSubmissionExpand = (subId: string) => {
    setExpandedSubmissions((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const toggleHint = (idx: number) => {
    setExpandedHints((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono">
            Hard
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 font-mono">
            {difficulty}
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
      {/* Top Nav Tabs */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 bg-slate-50/80 dark:bg-slate-900/80">
        <button
          type="button"
          onClick={() => setActiveTab('description')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'description'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Description</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('editorial')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'editorial'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Editorial & Approach</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('submissions')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'submissions'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Submissions {submissions.length > 0 && `(${submissions.length})`}</span>
        </button>
      </div>

      {/* Main Tab View Areas */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        
        {/* ======================================================== */}
        {/* TAB 1: DESCRIPTION */}
        {/* ======================================================== */}
        {activeTab === 'description' && (
          <div className="space-y-6">
            {/* Title & Metadata Badges */}
            <div className="space-y-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                {getDifficultyBadge(problem.difficulty)}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>{problem.subject}</span>
                </span>
                {problem.tags && problem.tags.length > 0 ? (
                  problem.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                      <span>{tag}</span>
                    </span>
                  ))
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5 text-slate-400" />
                    <span>{problem.topic}</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {problem.title}
              </h1>
            </div>

            {/* 1. Problem Description */}
            <div className="space-y-2">
              <div className="whitespace-pre-line text-slate-800 dark:text-slate-200 font-sans leading-relaxed text-sm">
                {problem.description || problem.problem_statement}
              </div>
            </div>

            {/* 2. Examples Section */}
            {problem.examples && problem.examples.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Examples
                </h2>

                <div className="space-y-4">
                  {problem.examples.map((example, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 overflow-hidden"
                    >
                      <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>Example {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(example.input, idx)}
                          className="text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy Input"
                        >
                          {copiedInputIdx === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Input</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-4 space-y-3 font-mono text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans mb-1">
                            Input:
                          </span>
                          <pre className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap overflow-x-auto font-mono">
                            {example.input}
                          </pre>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans mb-1">
                            Output:
                          </span>
                          <pre className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold whitespace-pre-wrap overflow-x-auto font-mono">
                            {example.output}
                          </pre>
                        </div>

                        {example.explanation && (
                          <div className="pt-1 font-sans">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Explanation:
                            </span>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                              {example.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Constraints Section */}
            {problem.constraints && problem.constraints.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Constraints
                </h2>
                <ul className="space-y-1.5 pl-4 list-disc marker:text-indigo-500 text-xs">
                  {problem.constraints.map((c, i) => (
                    <li key={i} className="text-slate-700 dark:text-slate-300 font-mono">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. Expected Complexity Section */}
            {problem.expectedComplexity && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Expected Complexity</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/10">
                    <span className="text-[10px] text-slate-500 block font-sans">Time Complexity:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {problem.expectedComplexity.time || 'O(N)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/10">
                    <span className="text-[10px] text-slate-500 block font-sans">Space Complexity:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {problem.expectedComplexity.space || 'O(1)'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans italic">
                  Note: The optimal algorithm breakdown is accessible in the Editorial & Approach tab.
                </p>
              </div>
            )}

            {/* 5. Function Signature Notice */}
            {problem.functionSignature?.[selectedLanguage] && (
              <div className="space-y-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Target Signature ({selectedLanguage})
                </h2>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-600 dark:text-indigo-300 overflow-x-auto">
                  <code>{problem.functionSignature[selectedLanguage]}</code>
                </div>
              </div>
            )}

            {/* 6. Progressive Hints */}
            {problem.hints && problem.hints.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Hints ({problem.hints.length})
                </h2>
                <div className="space-y-2">
                  {problem.hints.map((hint, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleHint(idx)}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>Hint {idx + 1}</span>
                        </div>
                        {expandedHints[idx] ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      {expandedHints[idx] && (
                        <div className="p-4 pt-1 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 leading-relaxed">
                          {hint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: EDITORIAL & APPROACH */}
        {/* ======================================================== */}
        {activeTab === 'editorial' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  Optimal Solution & Editorial
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mathematical proof and optimal algorithmic walkthrough.
              </p>
            </div>

            {problem.editorial ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Algorithmic Approach
                  </h3>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {problem.editorial.approach}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Time Complexity
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {problem.editorial.timeComplexity || problem.expectedComplexity?.time || 'O(N)'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      Space Complexity
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {problem.editorial.spaceComplexity || problem.expectedComplexity?.space || 'O(1)'}
                    </p>
                  </div>
                </div>

                {problem.explanation && problem.explanation !== problem.editorial.approach && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      Key Intuition
                    </h3>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                      {problem.explanation}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Standard algorithmic approach achieves {problem.expectedComplexity?.time || 'optimal time'}. Submit your code to see detailed AI evaluation.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: SUBMISSIONS */}
        {/* ======================================================== */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800 space-y-1">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Submission History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recent test suite runs and verdicts for this problem.
              </p>
            </div>

            {submissions.length === 0 ? (
              <div className="p-8 text-center space-y-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <History className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No submissions yet for this problem
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Write your solution in the code editor on the right and click <strong>Submit Solution</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub, i) => (
                  <div
                    key={sub.id || i}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sub.status === 'accepted' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accepted</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1 font-mono">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{sub.status_text || 'Wrong Answer'}</span>
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {sub.language}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {sub.cloudSynced ? (
                          <span
                            title="Synced to Supabase Cloud"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"
                          >
                            <Cloud className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Synced</span>
                          </span>
                        ) : (
                          <span
                            title={sub.cloudSyncError || 'Saved locally only. Click to retry syncing to cloud.'}
                            className="inline-flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium"
                          >
                            <CloudOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Local only</span>
                            {onRetryCloudSave && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRetryCloudSave(sub);
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Retry</span>
                              </button>
                            )}
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 font-mono">
                          {sub.created_at ? new Date(sub.created_at).toLocaleTimeString() : 'Just now'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-400 pt-1">
                      {sub.test_cases_passed !== undefined && sub.total_test_cases !== undefined && (
                        <span>
                          Test Cases: <strong className="text-slate-800 dark:text-slate-200">{sub.test_cases_passed}/{sub.total_test_cases}</strong>
                        </span>
                      )}
                      {sub.runtime_ms && (
                        <span>
                          Runtime: <strong className="text-slate-800 dark:text-slate-200">{sub.runtime_ms} ms</strong>
                        </span>
                      )}
                      {sub.memory_kb && (
                        <span>
                          Memory: <strong className="text-slate-800 dark:text-slate-200">{(sub.memory_kb / 1024).toFixed(1)} MB</strong>
                        </span>
                      )}
                    </div>

                    {/* View Submitted Code Trigger & Panel */}
                    {(sub.submitted_code || sub.code) && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => toggleSubmissionExpand(sub.id || `sub_${i}`)}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>{expandedSubmissions[sub.id || `sub_${i}`] ? 'Hide Submitted Code' : 'View Submitted Code'}</span>
                          {expandedSubmissions[sub.id || `sub_${i}`] ? (
                            <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </button>

                        {expandedSubmissions[sub.id || `sub_${i}`] && (
                          <div className="mt-2.5 space-y-2 rounded-xl bg-slate-900 text-slate-100 p-3 text-xs font-mono border border-slate-800 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                              <span className="text-[11px] text-slate-400 font-sans">
                                {sub.language} solution ({sub.created_at ? new Date(sub.created_at).toLocaleDateString() : 'Saved'})
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => copySubmissionCode(sub.id || `sub_${i}`, sub.submitted_code || sub.code || '')}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                                >
                                  {copiedSubId === (sub.id || `sub_${i}`) ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>

                                {onRestoreCode && (
                                  <button
                                    type="button"
                                    onClick={() => onRestoreCode(sub.submitted_code || sub.code || '')}
                                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-bold transition-all cursor-pointer text-[11px]"
                                  >
                                    Load into Editor
                                  </button>
                                )}
                              </div>
                            </div>

                            <pre className="overflow-x-auto max-h-60 p-1 text-[11px] leading-relaxed text-slate-200">
                              <code>{sub.submitted_code || sub.code}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

