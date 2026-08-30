import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Building2,
  History,
  Trash2,
  Layers,
  ChevronRight,
  ExternalLink,
  Code2,
  CloudCheck,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { JobMatchAnalysis, JobMatchRequest } from '../../types/intelligence';
import {
  analyzeJobMatch,
  fetchJobMatchHistory,
  fetchJobMatchHistoryResult,
  getJobMatchHistory,
  deleteJobMatchHistoryItem,
  saveJobMatchResult,
} from '../../services/jobMatchService';
import { ResumeVersionItem } from '../../types/resume';
import { JOB_MATCH_PRESETS, JobMatchPreset } from '../../data/jobMatchPresets';

interface JobMatchSectionProps {
  studentId?: string;
  resumes?: ResumeVersionItem[];
  onNavigate?: (route: string) => void;
}

export const JobMatchSection: React.FC<JobMatchSectionProps> = ({
  studentId = 'guest',
  resumes = [],
  onNavigate,
}) => {
  const safeResumes = resumes || [];
  const [selectedPresetId, setSelectedPresetId] = useState<string>(JOB_MATCH_PRESETS[0].id);
  const [jobTitle, setJobTitle] = useState(JOB_MATCH_PRESETS[0].role);
  const [companyName, setCompanyName] = useState(JOB_MATCH_PRESETS[0].company);
  const [jobDescriptionText, setJobDescriptionText] = useState(JOB_MATCH_PRESETS[0].description);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(safeResumes[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<JobMatchAnalysis | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [history, setHistory] = useState<JobMatchAnalysis[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyzer' | 'history'>('analyzer');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Load history from Supabase (Source of Truth)
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const res = await fetchJobMatchHistoryResult(studentId);
      setHistory(res.data);
      setHistoryError(res.error);
      setIsCloudSynced(res.isCloud);
      if (res.data.length > 0 && !analysisResult) {
        setAnalysisResult(res.data[0]);
      }
    } catch (err: any) {
      console.warn('[JobMatchSection] History fetch error:', err);
      setHistoryError(err?.message || 'Unable to connect to Supabase database.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [studentId]);

  // Handle Preset selection
  const handleSelectPreset = (preset: JobMatchPreset) => {
    setSelectedPresetId(preset.id);
    setJobTitle(preset.role);
    setCompanyName(preset.company);
    setJobDescriptionText(preset.description);
  };

  const handleRunAnalysis = async () => {
    if (!jobDescriptionText.trim()) return;
    setIsAnalyzing(true);
    setSaveStatus('saving');
    setSaveErrorMessage(null);

    try {
      const selectedResume = resumes.find((r) => r.id === selectedResumeId) || safeResumes[0];
      const req: JobMatchRequest = {
        jobDescriptionText,
        jobTitle,
        companyName,
        resumeId: selectedResume?.id,
        customResumeText: selectedResume?.resumeText || (selectedResume as any)?.raw_text || selectedResume?.targetRole,
      };

      const result = await analyzeJobMatch(req, studentId);
      setAnalysisResult(result);

      // Verify cloud persistence
      const saveRes = await saveJobMatchResult(studentId, result, jobDescriptionText);
      if (saveRes.success) {
        setSaveStatus('saved');
        setSaveErrorMessage(null);
        await loadHistory();
      } else {
        setSaveStatus('error');
        setSaveErrorMessage(saveRes.error || 'Analysis completed, but could not be saved to cloud.');
      }
      setActiveTab('analyzer');
    } catch (err: any) {
      console.error('[JobMatchSection] Analysis error:', err);
      setSaveStatus('error');
      setSaveErrorMessage(err?.message || 'Failed to complete analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetrySave = async () => {
    if (!analysisResult) return;
    setIsAnalyzing(true);
    setSaveStatus('saving');
    setSaveErrorMessage(null);

    try {
      const res = await saveJobMatchResult(studentId, analysisResult, jobDescriptionText);
      if (res.success) {
        setSaveStatus('saved');
        setSaveErrorMessage(null);
        await loadHistory();
      } else {
        setSaveStatus('error');
        setSaveErrorMessage(res.error || 'Failed to save to cloud database.');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setSaveErrorMessage(err?.message || 'Failed to save to cloud database.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await deleteJobMatchHistoryItem(studentId, id);
    setHistory(res.updatedHistory);
    if (analysisResult?.id === id) {
      setAnalysisResult(res.updatedHistory[0] || null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKeyword(text);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  return (
    <div
      id="job-match-analyzer-container"
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Briefcase className="w-5 h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Job Description ↔ Resume Match Analyzer
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare any job description against your actual resume to calculate match score, missing skills, and keyword gaps.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          <button
            id="job-match-tab-analyzer"
            onClick={() => setActiveTab('analyzer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'analyzer'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Match Analyzer
          </button>
          <button
            id="job-match-tab-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({isLoadingHistory ? '...' : history.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* History View */
        <div className="space-y-4">
          {isLoadingHistory ? (
            <div className="text-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading saved analyses from cloud...</p>
            </div>
          ) : historyError ? (
            <div className="text-center py-10 px-4 border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                Unable to Load Cloud History
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
                {historyError}
              </p>
              <button
                onClick={loadHistory}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                No past job match analyses found in cloud database.
              </p>
              <button
                onClick={() => setActiveTab('analyzer')}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700"
              >
                Run Your First Analysis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  id={`job-match-history-${item.id}`}
                  onClick={() => {
                    setAnalysisResult(item);
                    setActiveTab('analyzer');
                  }}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.jobTitle}
                      </h4>
                      <p className="text-xs text-slate-500">{item.companyName || 'Target Company'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                          item.matchScore >= 75
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : item.matchScore >= 55
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        }`}
                      >
                        {item.matchScore}% Match
                      </span>
                      <button
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete from cloud history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Skills: {item.matchingSkills?.length || 0} matched</span>
                    <span>•</span>
                    <span className="text-rose-500">{item.missingSkills?.length || 0} missing</span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <span>{new Date(item.analyzedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                      View Report <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Match Analyzer Form & Results */
        <>
          {/* Preset Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Choose from 18+ Job Role Presets or Enter Custom
              </label>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {JOB_MATCH_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    selectedPresetId === preset.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.role}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Target Job Title
                </label>
                <input
                  id="target-job-title-input"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    setSelectedPresetId('custom');
                  }}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Company Name (Optional)
                </label>
                <input
                  id="target-company-name-input"
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    setSelectedPresetId('custom');
                  }}
                  placeholder="e.g. Google, Amazon, Microsoft"
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {safeResumes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Compare Against Resume
                  </label>
                  <select
                    id="select-resume-for-match"
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {safeResumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.versionLabel || r.fileName || `Resume v${r.version || 1}`} (ATS: {r.analysisResult?.ats_score || r.analysisResult?.overall_score || 0})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                id="run-job-match-analysis-btn"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !jobDescriptionText.trim()}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Alignment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Job Match</span>
                  </>
                )}
              </button>

              {/* Cloud Save Feedback */}
              {saveStatus === 'error' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-amber-800 dark:text-amber-300 font-medium">
                      Analysis completed, but cloud save failed.
                    </p>
                    <button
                      onClick={handleRetrySave}
                      className="mt-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Retry Save to Cloud
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Job Description Textarea */}
            <div className="lg:col-span-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Job Description / Requirements Text
              </label>
              <textarea
                id="job-description-textarea"
                value={jobDescriptionText}
                onChange={(e) => {
                  setJobDescriptionText(e.target.value);
                  setSelectedPresetId('custom');
                }}
                rows={8}
                placeholder="Paste complete job description requirements here..."
                className="w-full p-4 rounded-2xl text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Analysis Results View */}
          {analysisResult && (
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6 animate-fadeIn">
              {/* Match Score Hero */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Job Description Match Score
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold">
                      Cloud Synced
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {analysisResult.jobTitle} {analysisResult.companyName ? `at ${analysisResult.companyName}` : ''}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Evaluated against {analysisResult.resumeName} • {new Date(analysisResult.analyzedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span
                      className={`text-4xl sm:text-5xl font-extrabold ${
                        analysisResult.matchScore >= 75
                          ? 'text-emerald-500'
                          : analysisResult.matchScore >= 55
                          ? 'text-indigo-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {analysisResult.matchScore}%
                    </span>
                    <div className="text-[11px] font-semibold text-slate-400">Match Level</div>
                  </div>
                </div>
              </div>

              {/* Matching vs Missing Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matching Skills */}
                <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Matching Skills ({(analysisResult.matchingSkills || []).length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(analysisResult.matchingSkills || []).length > 0 ? (
                      (analysisResult.matchingSkills || []).map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300/50"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No direct skill matches detected.</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-800 dark:text-rose-300">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Missing Key Skills ({(analysisResult.missingSkills || []).length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(analysisResult.missingSkills || []).length > 0 ? (
                      (analysisResult.missingSkills || []).map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-300/50 flex items-center gap-1"
                        >
                          <span>{s}</span>
                          <button
                            onClick={() => handleCopy(s)}
                            title="Copy keyword"
                            className="text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            {copiedKeyword === s ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">All key skills matched!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Experience Alignment & Keyword Gaps */}
              {analysisResult.relevantExperience && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Experience Alignment</h5>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${analysisResult.relevantExperience.alignmentScore || analysisResult.matchScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {analysisResult.relevantExperience.alignmentScore || analysisResult.matchScore}%
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 mt-2">
                      {(analysisResult.relevantExperience.matchingPoints || []).slice(0, 2).map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Keywords */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">High Priority Keyword Gaps</h5>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(analysisResult.missingKeywords || []).length > 0 ? (
                        (analysisResult.missingKeywords || []).slice(0, 6).map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          >
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No critical keyword gaps identified.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested Projects */}
              {analysisResult.projectAlignment?.suggestedProjectIdeas && analysisResult.projectAlignment.suggestedProjectIdeas.length > 0 && (
                <div className="p-5 rounded-2xl bg-sky-50/40 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-900/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-sky-900 dark:text-sky-200">
                    <Code2 className="w-4 h-4 text-sky-600" />
                    <span>Suggested Projects to Bridge Skill Gaps</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {analysisResult.projectAlignment.suggestedProjectIdeas.map((idea, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-sky-500 font-bold">•</span>
                        <span>{idea}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Improvements */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-900 dark:text-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Recommended Resume Improvements</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {(analysisResult.recommendedImprovements || []).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

