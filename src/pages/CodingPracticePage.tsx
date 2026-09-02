import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Code2,
  Sparkles,
  ArrowLeft,
  Sliders,
  Play,
  RotateCcw,
  BookOpen,
  Layers,
  CheckCircle2,
  Terminal,
  Cpu,
  Target,
  Clock,
  Zap,
  HelpCircle,
  BarChart2,
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Award,
  Edit3,
  FileCode,
  Laptop,
  History,
  TrendingUp,
  Trophy,
  Bookmark,
  BookmarkCheck,
  ListOrdered,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  CodingSubject,
  CodingDifficulty,
  CodingLanguage,
  CodingProblem,
  CodingSubmission,
  SubmissionEvaluationResult,
  PracticeConfig,
  Achievement,
  QuestionSeriesItem,
  SavedQuestion,
  TopicProgressSummary,
  SubmissionEvaluationStatus,
  SubmissionPersistenceStatus
} from '../types/coding';
import {
  SUBJECTS,
  SUBJECT_TOPICS,
  DIFFICULTIES,
  LANGUAGES,
  getAvailableLanguagesForSubject,
  getSubjectDefaultLanguage,
  getBoilerplateTemplate,
  sanitizeStarterCode,
  codingService
} from '../services/codingService';
import { codingHistoryService } from '../services/codingHistoryService';
import { checkNewlyUnlockedAchievements } from '../services/achievementService';
import {
  DEFAULT_CODING_QUESTION_BANK,
  isProblemCompatible,
  normalizeTopic,
  normalizeSubject,
  createTopicTailoredFallback,
  getQuestionsForTopic,
} from '../data/codingQuestionBank';
import { ProblemView } from '../components/coding/ProblemView';
import { CodeEditorWorkspace } from '../components/coding/CodeEditorWorkspace';
import { MyPracticeView } from '../components/coding/MyPracticeView';
import { FloatingDropdown } from '../components/coding/FloatingDropdown';
import { AchievementToast } from '../components/coding/AchievementToast';
import { TopicQuestionSeriesView } from '../components/coding/TopicQuestionSeriesView';
import { SavedQuestionsModal } from '../components/coding/SavedQuestionsModal';

interface CodingPracticePageProps {
  onNavigate: (page: string) => void;
}

export const CodingPracticePage: React.FC<CodingPracticePageProps> = ({ onNavigate }) => {
  const { user, showToast } = useAuth();

  // Page View Mode (Arena vs My Practice History vs Achievements)
  const [pageTab, setPageTab] = useState<'arena' | 'history' | 'achievements'>('arena');
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState<Achievement | null>(null);

  // Practice Configuration State
  const [selectedSubject, setSelectedSubject] = useState<CodingSubject>('DSA');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>(SUBJECT_TOPICS['DSA'][0]);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<CodingDifficulty>('Medium');
  const [selectedLanguage, setSelectedLanguage] = useState<CodingLanguage>('Python');
  const [activeCompanyContext, setActiveCompanyContext] = useState<{ company?: string; role?: string } | null>(null);
  const [isFromCompanyPrep, setIsFromCompanyPrep] = useState<boolean>(false);
  const [sourceContext, setSourceContext] = useState<string | null>(null);

  // Generator & Workspace State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeProblem, setActiveProblem] = useState<CodingProblem | null>(() => {
    try {
      const saved = localStorage.getItem('careerpilot_active_coding_problem');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.title) {
          const compat = isProblemCompatible(parsed, {
            subject: 'DSA',
            topic: SUBJECT_TOPICS['DSA'][0],
            difficulty: 'Medium',
          });
          if (compat.compatible) return parsed;
        }
      }
    } catch (_) {}
    const initialPool = getQuestionsForTopic('DSA', SUBJECT_TOPICS['DSA'][0], 'Medium');
    return initialPool[0] || DEFAULT_CODING_QUESTION_BANK[0] || null;
  });
  const [currentCode, setCurrentCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('careerpilot_active_coding_problem');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.title) {
          const raw = parsed.starterCode?.['Python'] || parsed.starter_templates?.['Python'] || '';
          return sanitizeStarterCode(raw, 'Python', parsed.title, parsed.functionSignature?.['Python']);
        }
      }
    } catch (_) {}
    const defaultProb = DEFAULT_CODING_QUESTION_BANK[0];
    if (defaultProb) {
      const raw = defaultProb.starterCode?.['Python'] || defaultProb.starter_templates?.['Python'] || '';
      return sanitizeStarterCode(raw, 'Python', defaultProb.title, defaultProb.functionSignature?.['Python']);
    }
    return '';
  });
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<SubmissionEvaluationResult | null>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<SubmissionEvaluationStatus>('idle');
  const [persistenceStatus, setPersistenceStatus] = useState<SubmissionPersistenceStatus>('not_saved');
  const [currentExecutionId, setCurrentExecutionId] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState<boolean>(false);

  // Question Series & Bookmarks State
  const [seriesItems, setSeriesItems] = useState<QuestionSeriesItem[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState<boolean>(false);
  const [topicProgress, setTopicProgress] = useState<TopicProgressSummary | null>(null);
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [savingBookmarkId, setSavingBookmarkId] = useState<string | null>(null);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);

  // Mobile / Tablet Tab Switcher (Problem vs Code Editor)
  const [mobileActiveView, setMobileActiveView] = useState<'problem' | 'editor'>('problem');

  // Stable references for high-frequency callbacks without triggering remounts
  const activeProblemRef = useRef(activeProblem);
  activeProblemRef.current = activeProblem;

  const currentCodeRef = useRef(currentCode);
  currentCodeRef.current = currentCode;

  const selectedLanguageRef = useRef(selectedLanguage);
  selectedLanguageRef.current = selectedLanguage;

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const isGeneratingRef = useRef(false);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[RENDER] CodingArena: activeProblem=', activeProblem?.id, activeProblem?.title, 'pageTab=', pageTab);
  }

  // AbortController refs to cancel abandoned in-flight requests
  const generateAbortRef = useRef<AbortController | null>(null);
  const runAbortRef = useRef<AbortController | null>(null);
  const submitAbortRef = useRef<AbortController | null>(null);

  // Prevent multiple auto-generation triggers on mount
  const autoTriggeredRef = React.useRef(false);

  // Cleanup active requests on unmount
  useEffect(() => {
    return () => {
      generateAbortRef.current?.abort();
      runAbortRef.current?.abort();
      submitAbortRef.current?.abort();
    };
  }, []);

  // Core execution function for problem generation
  const executeGenerateProblem = async (config: {
    subject: CodingSubject;
    topic: string;
    difficulty: CodingDifficulty;
    language: CodingLanguage;
    targetCompany?: string;
    targetRole?: string;
  }) => {
    // Abort previous in-flight generation if any
    if (generateAbortRef.current) {
      generateAbortRef.current.abort();
    }
    const abortController = new AbortController();
    generateAbortRef.current = abortController;

    setIsGenerating(true);
    isGeneratingRef.current = true;

    try {
      const problem = await codingService.generateProblem(
        {
          subject: config.subject,
          topic: config.topic,
          difficulty: config.difficulty,
          language: config.language,
          targetCompany: config.targetCompany,
          targetRole: config.targetRole,
          userId: user?.id,
        },
        abortController.signal
      );

      // If aborted, do not update state
      if (abortController.signal.aborted) return;

      let finalProblem = problem;
      const compatCheck = isProblemCompatible(finalProblem, {
        subject: config.subject,
        topic: config.topic,
        difficulty: config.difficulty,
        language: config.language,
      });

      if (!compatCheck.compatible) {
        console.warn('[Coding Arena] Generated problem failed compatibility check:', compatCheck.reasons);
        finalProblem = createTopicTailoredFallback(config.subject, config.topic, config.difficulty, config.language);
      }

      console.log(
        `[Coding Arena Diagnostics]\n` +
        `Selected Configuration: Subject="${config.subject}", Topic="${config.topic}", Difficulty="${config.difficulty}", Language="${config.language}"\n` +
        `Opened Question: ID="${finalProblem.id}", Title="${finalProblem.title}", Subject="${finalProblem.subject}", Topic="${finalProblem.topic}", Difficulty="${finalProblem.difficulty}"\n` +
        `Compatibility Check: PASS`
      );

      // Atomic update of problem and editor state together
      setActiveProblem(finalProblem);
      setEvaluationResult(null);
      setSubmissions([]);
      setMobileActiveView('problem');
      setPageTab('arena');

      // Set guaranteed sanitized starter code
      const rawStarter =
        finalProblem.starterCode?.[config.language] ||
        finalProblem.starter_templates?.[config.language] ||
        '';
      const cleanStarter = sanitizeStarterCode(
        rawStarter,
        config.language,
        finalProblem.title,
        finalProblem.functionSignature?.[config.language]
      );
      setCurrentCode(cleanStarter);

      setIsConfigExpanded(false);
      showToast(
        'Problem Ready',
        config.targetCompany
          ? `Loaded "${finalProblem.title}" (${finalProblem.difficulty}) tailored for ${config.targetCompany}!`
          : `Loaded "${finalProblem.title}" (${finalProblem.difficulty}) for ${config.topic}!`,
        'success'
      );
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Error generating problem:', err);
      const errMsg =
        err?.message || "Unable to generate a problem right now. Please try again.";
      showToast('Generation Notice', errMsg, 'error');
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
      if (generateAbortRef.current === abortController) {
        generateAbortRef.current = null;
      }
    }
  };

  // Keep active problem persisted locally for instant restoration
  useEffect(() => {
    if (activeProblem) {
      try {
        localStorage.setItem('careerpilot_active_coding_problem', JSON.stringify(activeProblem));
      } catch (_) {}
    }
  }, [activeProblem]);

  // URL query parameter listener for tab switching
  useEffect(() => {
    const handleUrlTab = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'achievements' || tabParam === 'history' || tabParam === 'arena') {
        setPageTab(tabParam as any);
        if (tabParam === 'achievements') {
          setTimeout(() => {
            const el = document.getElementById('coding-achievements-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 200);
        }
      }
    };

    handleUrlTab();
    window.addEventListener('popstate', handleUrlTab);
    return () => window.removeEventListener('popstate', handleUrlTab);
  }, []);

  // URL query parameter listener for automatic context & auto-generation from Roadmap & Company Prep
  useEffect(() => {
    if (autoTriggeredRef.current) return;

    const searchParams = new URLSearchParams(window.location.search);
    const subjectParam = searchParams.get('subject');
    const topicParam = searchParams.get('topic');
    const diffParam = searchParams.get('difficulty') as CodingDifficulty;
    const langParam = searchParams.get('language') as CodingLanguage;
    const companyParam = searchParams.get('company');
    const roleParam = searchParams.get('role');
    const autoParam = searchParams.get('auto');

    const sourceParam = searchParams.get('source');
    if (sourceParam) {
      setSourceContext(sourceParam);
    }
    if (sourceParam === 'company-preparation' || sourceParam === 'company-prep') {
      setIsFromCompanyPrep(true);
    }

    if (subjectParam || topicParam || companyParam) {
      autoTriggeredRef.current = true;

      // 1. Resolve Subject
      let targetSubj: CodingSubject = 'DSA';
      let targetCustomSubj = '';
      if (subjectParam) {
        if (SUBJECTS.includes(subjectParam as any)) {
          targetSubj = subjectParam as CodingSubject;
        } else {
          targetSubj = '+ Custom Subject';
          targetCustomSubj = subjectParam;
        }
        setSelectedSubject(targetSubj);
        setCustomSubject(targetCustomSubj);
      }

      // 2. Resolve Topic
      let targetTop = topicParam || 'Arrays';
      let targetCustomTop = '';
      const availableForSubj = SUBJECT_TOPICS[targetSubj] || SUBJECT_TOPICS['DSA'] || [];
      if (topicParam) {
        if (availableForSubj.includes(topicParam)) {
          targetTop = topicParam;
        } else {
          targetTop = 'Custom Topic';
          targetCustomTop = topicParam;
        }
        setSelectedTopic(targetTop);
        setCustomTopic(targetCustomTop);
      }

      // 3. Resolve Difficulty
      let targetDiff: CodingDifficulty = 'Medium';
      if (diffParam && ['Easy', 'Medium', 'Hard'].includes(diffParam)) {
        targetDiff = diffParam;
        setSelectedDifficulty(targetDiff);
      }

      // 4. Resolve Language
      let targetLang: CodingLanguage = 'Python';
      if (langParam && ['Python', 'Java', 'C++', 'C', 'JavaScript', 'SQL'].includes(langParam)) {
        targetLang = langParam;
        setSelectedLanguage(targetLang);
      }

      // 5. Resolve Company Context
      if (companyParam) {
        setActiveCompanyContext({
          company: companyParam,
          role: roleParam || undefined,
        });
      }

      // 6. Only auto-generate if explicit autoParam flag is set (e.g. from direct action button)
      if (autoParam === 'true' || autoParam === '1') {
        const finalSubjVal = targetSubj === '+ Custom Subject' ? targetCustomSubj : targetSubj;
        const finalTopVal = targetTop === 'Custom Topic' ? targetCustomTop : targetTop;

        if (finalTopVal && finalTopVal.trim()) {
          executeGenerateProblem({
            subject: finalSubjVal,
            topic: finalTopVal,
            difficulty: targetDiff,
            language: targetLang,
            targetCompany: companyParam || undefined,
            targetRole: roleParam || undefined,
          });
        }
      }
    }
  }, [user?.id]);

  // Load count of user submissions for badge and general history
  useEffect(() => {
    let isMounted = true;
    const effectiveUserId = user?.id || 'guest';
    codingService.getSubmissions(effectiveUserId).then((subs) => {
      if (isMounted) {
        setSubmissionCount(subs.length);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Load submissions for active problem whenever problem or user changes
  useEffect(() => {
    let isMounted = true;
    const effectiveUserId = user?.id || 'guest';
    if (!activeProblem) {
      setSubmissions([]);
      return;
    }

    codingService.getSubmissions(effectiveUserId, activeProblem.id).then((allSubs) => {
      if (isMounted) {
        const probIdNorm = (activeProblem.id || '').trim().toLowerCase();
        const probTitleNorm = (activeProblem.title || '').trim().toLowerCase();
        const matching = allSubs.filter((s) => {
          if (!s) return false;
          const sId = (s.problem_id || (s as any).problemId || '').trim().toLowerCase();
          const sTitle = (s.problem_title || (s as any).problemTitle || '').trim().toLowerCase();
          return sId === probIdNorm || (probTitleNorm && sTitle === probTitleNorm);
        });
        setSubmissions(matching.length > 0 ? matching : allSubs.filter(s => s.problem_id === activeProblem.id));
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [activeProblem?.id, activeProblem?.title, user?.id]);

  // Compute final subject & topic according to user selection
  const isCustomSubjectSelected = selectedSubject === '+ Custom Subject';
  const finalSubject = isCustomSubjectSelected ? customSubject.trim() : selectedSubject;
  const displaySubject = isCustomSubjectSelected ? (customSubject.trim() || 'Custom Subject') : selectedSubject;

  const isCustomTopicSelected = selectedTopic === 'Custom Topic';
  const finalTopic = isCustomTopicSelected ? customTopic.trim() : selectedTopic.trim();
  const displayTopic = isCustomTopicSelected ? (customTopic.trim() || 'Custom Topic') : selectedTopic;

  // Stale Question Protection: Detect if active problem matches the currently configured options
  const isCurrentConfigStale = useMemo(() => {
    if (!activeProblem) return false;
    const targetSubjNorm = (finalSubject || '').trim().toLowerCase();
    const targetTopicNorm = (finalTopic || '').trim().toLowerCase();
    const probSubjNorm = (activeProblem.subject || '').trim().toLowerCase();
    const probTopicNorm = (activeProblem.topic || '').trim().toLowerCase();
    const probDiffNorm = (activeProblem.difficulty || '').trim().toLowerCase();
    const targetDiffNorm = (selectedDifficulty || '').trim().toLowerCase();

    // 1. Topic Stale Check
    if (isCustomTopicSelected) {
      if (customTopic.trim() && normalizeTopic(customTopic.trim()) !== normalizeTopic(probTopicNorm)) {
        return true;
      }
    } else if (targetTopicNorm && targetTopicNorm !== 'custom topic' && probTopicNorm) {
      if (normalizeTopic(targetTopicNorm) !== normalizeTopic(probTopicNorm)) {
        return true;
      }
    }

    // 2. Subject Stale Check
    if (isCustomSubjectSelected) {
      if (customSubject.trim() && normalizeSubject(customSubject.trim()) !== normalizeSubject(probSubjNorm)) {
        return true;
      }
    } else if (targetSubjNorm && targetSubjNorm !== '+ custom subject' && probSubjNorm) {
      if (normalizeSubject(targetSubjNorm) !== normalizeSubject(probSubjNorm)) {
        return true;
      }
    }

    // 3. Difficulty Stale Check
    if (targetDiffNorm && probDiffNorm && targetDiffNorm !== probDiffNorm) {
      return true;
    }

    return false;
  }, [
    activeProblem,
    isCustomTopicSelected,
    customTopic,
    selectedTopic,
    finalTopic,
    isCustomSubjectSelected,
    customSubject,
    selectedSubject,
    finalSubject,
    selectedDifficulty,
  ]);

  // Load Question Series, Topic Progress, and Saved Bookmarks WITHOUT altering active problem
  useEffect(() => {
    let isMounted = true;
    const effectiveUserId = user?.id || 'guest';

    const loadSeriesData = async () => {
      setIsLoadingSeries(true);
      try {
        const topicToQuery = isCustomTopicSelected ? (customTopic.trim() || '') : selectedTopic.trim();
        const subjectToQuery = (isCustomSubjectSelected ? (customSubject.trim() || 'DSA') : selectedSubject) as CodingSubject;

        if (topicToQuery && topicToQuery !== 'Custom Topic') {
          const [series, progress, saved] = await Promise.all([
            codingService.getQuestionSeries(
              subjectToQuery,
              topicToQuery,
              selectedDifficulty,
              selectedLanguageRef.current,
              effectiveUserId
            ),
            codingService.getTopicProgress(
              subjectToQuery,
              topicToQuery,
              effectiveUserId
            ),
            codingService.getSavedQuestions(effectiveUserId),
          ]);

          if (isMounted) {
            setSeriesItems(series);
            setTopicProgress(progress);
            setSavedQuestions(saved);
          }
        } else {
          // If custom topic is empty or not yet entered, load saved bookmarks and clear series
          const saved = await codingService.getSavedQuestions(effectiveUserId);
          if (isMounted) {
            setSeriesItems([]);
            setTopicProgress(null);
            setSavedQuestions(saved);
          }
        }
      } catch (err) {
        console.warn('Error loading series and bookmarks:', err);
      } finally {
        if (isMounted) {
          setIsLoadingSeries(false);
        }
      }
    };

    loadSeriesData();

    return () => {
      isMounted = false;
    };
  }, [selectedSubject, selectedTopic, customSubject, customTopic, selectedDifficulty, user?.id]);

  // Load submissions for active problem authoritatively from Supabase/cache
  useEffect(() => {
    let isMounted = true;
    const effectiveUserId = user?.id || 'guest';
    const currentProbId = activeProblem?.id;

    if (currentProbId) {
      codingService
        .getSubmissions(effectiveUserId, currentProbId)
        .then((subs) => {
          if (isMounted) {
            setSubmissions(subs);
          }
        })
        .catch(() => {});
    } else {
      setSubmissions([]);
    }

    return () => {
      isMounted = false;
    };
  }, [activeProblem?.id, user?.id]);

  // Retry Save / Sync Bookmark for a Question
  const handleRetrySaveBookmark = useCallback(async (problem: CodingProblem) => {
    const effectiveUserId = user?.id || 'guest';
    try {
      setSavingBookmarkId(problem.id);
      const newSaved = await codingService.saveQuestionBookmark(problem, effectiveUserId);
      setSavedQuestions((prev) => [newSaved, ...prev.filter((q) => q.question_id !== problem.id && q.id !== problem.id)]);
      setSeriesItems((prev) =>
        prev.map((item) => (item.id === problem.id ? { ...item, isSaved: true } : item))
      );
      if (newSaved.cloudSynced) {
        showToastRef.current('Question Synced', `"${problem.title}" saved and synced to Supabase cloud!`, 'success');
      } else {
        showToastRef.current(
          'Cloud Sync Pending',
          newSaved.cloudSyncError || 'Offline changes saved. Cloud sync pending.',
          'warning'
        );
      }
    } catch (err: any) {
      showToastRef.current('Sync Error', err?.message || 'Failed to sync to cloud.', 'error');
    } finally {
      setSavingBookmarkId(null);
    }
  }, [user?.id]);

  // Bookmark Toggle Handler
  const handleToggleBookmark = useCallback(async (problem: CodingProblem) => {
    if (savingBookmarkId === problem.id) return;
    const effectiveUserId = user?.id || 'guest';
    const isCurrentlySaved = savedQuestions.some(
      (q) => q.question_id === problem.id || q.id === problem.id || q.title.toLowerCase() === problem.title.toLowerCase()
    );

    try {
      setSavingBookmarkId(problem.id);
      if (isCurrentlySaved) {
        await codingService.unsaveQuestionBookmark(problem.id, effectiveUserId);
        setSavedQuestions((prev) => prev.filter((q) => q.question_id !== problem.id && q.id !== problem.id));
        setSeriesItems((prev) =>
          prev.map((item) => (item.id === problem.id ? { ...item, isSaved: false } : item))
        );
        showToastRef.current('Bookmark Removed', `"${problem.title}" removed from bookmarks.`, 'info');
      } else {
        const newSaved = await codingService.saveQuestionBookmark(problem, effectiveUserId);
        setSavedQuestions((prev) => [newSaved, ...prev.filter((q) => q.question_id !== problem.id && q.id !== problem.id)]);
        setSeriesItems((prev) =>
          prev.map((item) => (item.id === problem.id ? { ...item, isSaved: true } : item))
        );
        if (newSaved.cloudSynced) {
          showToastRef.current('Question Saved', `"${problem.title}" saved and synced to Supabase cloud.`, 'success');
        } else {
          showToastRef.current(
            'Changes saved on this device — cloud sync pending',
            'Changes saved on this device. You can retry syncing anytime.',
            'warning',
            {
              label: 'Retry Sync',
              onClick: () => handleRetrySaveBookmark(problem),
            }
          );
        }
      }
    } catch (err: any) {
      console.error('Error toggling bookmark:', err);
      showToastRef.current('Bookmark Error', err?.message || 'Could not update bookmark.', 'error');
    } finally {
      setSavingBookmarkId(null);
    }
  }, [savedQuestions, user?.id, savingBookmarkId, handleRetrySaveBookmark]);

  // Remove Saved Question from modal
  const handleRemoveSavedQuestion = useCallback(async (questionId: string) => {
    const effectiveUserId = user?.id || 'guest';
    try {
      await codingService.unsaveQuestionBookmark(questionId, effectiveUserId);
      setSavedQuestions((prev) => prev.filter((q) => q.question_id !== questionId && q.id !== questionId));
      setSeriesItems((prev) =>
        prev.map((item) => (item.id === questionId ? { ...item, isSaved: false } : item))
      );
      showToastRef.current('Bookmark Removed', 'Question removed from saved collection.', 'info');
    } catch (err: any) {
      console.error('Error removing bookmark:', err);
      showToastRef.current('Error', err?.message || 'Could not remove bookmark.', 'error');
    }
  }, [user?.id]);

  // Active Series Index & Navigation
  const currentSeriesIndex = useMemo(() => {
    if (!activeProblem || seriesItems.length === 0) return -1;
    return seriesItems.findIndex(
      (item) =>
        item.id === activeProblem.id ||
        item.title.trim().toLowerCase() === activeProblem.title.trim().toLowerCase()
    );
  }, [activeProblem, seriesItems]);

  const currentActiveSavedItem = useMemo(() => {
    if (!activeProblem) return null;
    return savedQuestions.find(
      (q) =>
        q.question_id === activeProblem.id ||
        q.id === activeProblem.id ||
        q.title.trim().toLowerCase() === activeProblem.title.trim().toLowerCase()
    ) || null;
  }, [activeProblem, savedQuestions]);

  const isCurrentActiveSaved = Boolean(currentActiveSavedItem);

  // Select problem from past history for fresh re-practice
  const handleSelectProblemForPractice = useCallback((problem: CodingProblem, preferredLanguage?: CodingLanguage) => {
    setActiveProblem(problem);
    if (problem.subject) {
      if (SUBJECTS.includes(problem.subject)) {
        setSelectedSubject(problem.subject);
        setCustomSubject('');
      } else {
        setSelectedSubject('+ Custom Subject');
        setCustomSubject(problem.subject);
      }
    }
    if (problem.topic) {
      const standardTopics = SUBJECT_TOPICS[problem.subject || 'DSA'] || SUBJECT_TOPICS['Default'] || [];
      if (standardTopics.includes(problem.topic)) {
        setSelectedTopic(problem.topic);
        setCustomTopic('');
      } else {
        setSelectedTopic('Custom Topic');
        setCustomTopic(problem.topic);
      }
    }
    if (problem.difficulty) setSelectedDifficulty(problem.difficulty);

    const langToUse = preferredLanguage || selectedLanguageRef.current;
    setSelectedLanguage(langToUse);

    const rawStarter =
      problem.starterCode?.[langToUse] ||
      problem.starter_templates?.[langToUse] ||
      '';
    const cleanStarter = sanitizeStarterCode(
      rawStarter,
      langToUse,
      problem.title,
      problem.functionSignature?.[langToUse]
    );

    const effectiveUserId = user?.id || 'guest';
    const draftCode = codingHistoryService.getDraftCode(effectiveUserId, problem.id, langToUse);
    const restorable = codingHistoryService.getRestorableCode(
      effectiveUserId,
      problem.id,
      langToUse,
      cleanStarter,
      undefined,
      problem.title
    );

    const codeToSet = draftCode || (restorable && restorable.source === 'submitted' ? restorable.code : cleanStarter);
    setCurrentCode(codeToSet);
    setEvaluationResult(null);
    setPageTab('arena');
    setMobileActiveView('problem');
    showToastRef.current('Loaded Problem', `"${problem.title}" is ready in the Coding Arena!`, 'success');
  }, [user?.id]);

  const handleNavigateSeries = useCallback((direction: 'prev' | 'next') => {
    if (currentSeriesIndex === -1) return;
    const targetIdx = direction === 'next' ? currentSeriesIndex + 1 : currentSeriesIndex - 1;
    if (targetIdx >= 0 && targetIdx < seriesItems.length) {
      const targetItem = seriesItems[targetIdx];
      handleSelectProblemForPractice(targetItem.problem, selectedLanguageRef.current);
    }
  }, [currentSeriesIndex, seriesItems, handleSelectProblemForPractice]);

  // Jump directly to the next unsolved problem in current track / bank
  const handleNextUnsolvedProblem = useCallback(async () => {
    const effectiveUserId = user?.id || 'guest';
    const currentProb = activeProblemRef.current;

    const nextUnsolved = await codingService.getNextUnsolvedProblem({
      subject: (isCustomSubjectSelected ? 'DSA' : selectedSubject) as CodingSubject,
      topic: finalTopic || 'Arrays',
      difficulty: selectedDifficulty,
      userId: effectiveUserId,
      currentProblemId: currentProb?.id,
      language: selectedLanguageRef.current,
    });

    if (nextUnsolved) {
      handleSelectProblemForPractice(nextUnsolved, selectedLanguageRef.current);
      showToastRef.current('Next Unsolved Problem', `Loaded: "${nextUnsolved.title}"`, 'success');
    } else {
      showToastRef.current(
        'All Available Questions Solved!',
        'You have completed all standard questions in this track! Click Generate Problem to create custom AI challenges.',
        'info'
      );
    }
  }, [user?.id, isCustomSubjectSelected, selectedSubject, finalTopic, selectedDifficulty, handleSelectProblemForPractice]);

  // Update available topics and default language when subject changes
  const handleSubjectChange = useCallback((subject: CodingSubject) => {
    setSelectedSubject(subject);
    if (subject === '+ Custom Subject') {
      const defaultTopics = SUBJECT_TOPICS['Default'] || [];
      if (defaultTopics.length > 0) {
        setSelectedTopic(defaultTopics[0]);
      }
    } else {
      const topics = SUBJECT_TOPICS[subject] || [];
      if (topics.length > 0) {
        setSelectedTopic(topics[0]);
      }
      const defaultLang = getSubjectDefaultLanguage(subject);
      setSelectedLanguage(defaultLang);
    }
  }, []);

  // Handle Topic Dropdown Change
  const handleTopicDropdownChange = useCallback((value: string) => {
    setSelectedTopic(value);
  }, []);

  // Update code boilerplate when language changes
  const handleLanguageChange = useCallback((newLanguage: CodingLanguage) => {
    setSelectedLanguage(newLanguage);
    const prob = activeProblemRef.current;
    if (prob) {
      const rawStarter =
        prob.starterCode?.[newLanguage] ||
        prob.starter_templates?.[newLanguage] ||
        '';
      const cleanStarter = sanitizeStarterCode(
        rawStarter,
        newLanguage,
        prob.title,
        prob.functionSignature?.[newLanguage]
      );
      const effectiveUserId = user?.id || 'guest';
      const draftCode = codingHistoryService.getDraftCode(effectiveUserId, prob.id, newLanguage);
      const restorable = codingHistoryService.getRestorableCode(
        effectiveUserId,
        prob.id,
        newLanguage,
        cleanStarter,
        submissions,
        prob.title
      );
      const codeToSet = draftCode || (restorable && restorable.source === 'submitted' ? restorable.code : cleanStarter);
      setCurrentCode(codeToSet);
    }
  }, [user?.id, submissions]);

  // Real AI Problem Generator Handler
  const handleGenerateProblem = async () => {
    if (isGenerating || isGeneratingRef.current) return;

    // Validation 1: Custom Subject validation
    if (isCustomSubjectSelected && (!customSubject || !customSubject.trim())) {
      showToastRef.current('Validation Error', 'Please enter a custom subject.', 'error');
      return;
    }

    if (!finalSubject || !finalSubject.trim()) {
      showToastRef.current('Validation Error', 'Please select a subject.', 'error');
      return;
    }

    // Validation 2: Custom Topic validation
    if (isCustomTopicSelected && (!customTopic || !customTopic.trim())) {
      showToastRef.current('Validation Error', 'Please enter a custom topic.', 'error');
      return;
    }

    if (!finalTopic || !finalTopic.trim()) {
      showToastRef.current('Validation Error', 'Please select or enter a topic.', 'error');
      return;
    }

    // Validation 3: Difficulty & Language validation
    if (!selectedDifficulty) {
      showToastRef.current('Validation Error', 'Please select a difficulty.', 'error');
      return;
    }

    if (!selectedLanguage) {
      showToastRef.current('Validation Error', 'Please select a language.', 'error');
      return;
    }

    isGeneratingRef.current = true;
    try {
      await executeGenerateProblem({
        subject: finalSubject as CodingSubject,
        topic: finalTopic,
        difficulty: selectedDifficulty,
        language: selectedLanguage,
        targetCompany: activeCompanyContext?.company,
        targetRole: activeCompanyContext?.role,
      });
    } finally {
      isGeneratingRef.current = false;
    }
  };

  // Run Code against custom input or chosen example testcase
  const handleRunCode = useCallback(async (customInput: string) => {
    const prob = activeProblemRef.current;
    const lang = selectedLanguageRef.current;
    const code = currentCodeRef.current;
    if (!prob) return null;

    if (runAbortRef.current) {
      runAbortRef.current.abort();
    }
    const abortController = new AbortController();
    runAbortRef.current = abortController;

    const execId = `exec_run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setCurrentExecutionId(execId);
    setIsRunning(true);

    const effectiveUserId = user?.id || 'guest';
    codingHistoryService.saveRunCode(effectiveUserId, prob.id, lang, code);

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[API] evaluateSubmission (run):', prob.title, lang);
      }
      const runResult = await codingService.evaluateSubmission(
        prob,
        lang,
        code,
        customInput,
        'run',
        abortController.signal,
        execId
      );
      if (!abortController.signal.aborted) {
        return runResult;
      }
      return null;
    } catch (error: any) {
      if (error?.name === 'AbortError') return null;
      return {
        executionId: execId,
        status: 'error',
        statusText: 'Execution Error',
        stdout: error?.name === 'TimeoutError' ? 'Code execution timed out. Please try again.' : 'Error during code execution.',
        runtimeMs: 0,
      };
    } finally {
      setIsRunning(false);
      if (runAbortRef.current === abortController) {
        runAbortRef.current = null;
      }
    }
  }, [user?.id]);

  // Real AI Submission Evaluation (Decoupled with instantaneous UI feedback & background persistence)
  const handleSubmitSolution = useCallback(async (): Promise<SubmissionEvaluationResult | null> => {
    const prob = activeProblemRef.current;
    const lang = selectedLanguageRef.current;
    const code = currentCodeRef.current;
    if (!prob) return null;

    if (submitAbortRef.current) {
      submitAbortRef.current.abort();
    }
    const abortController = new AbortController();
    submitAbortRef.current = abortController;

    const execId = `exec_sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setCurrentExecutionId(execId);
    setEvaluationResult(null); // Clear stale evaluation result immediately
    setIsSubmitting(true);
    setEvaluationStatus('evaluating');
    setPersistenceStatus('not_saved');

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[API] evaluateSubmission (submit):', prob.title, lang);
      }
      const evalResult = await codingService.evaluateSubmission(
        prob,
        lang,
        code,
        '',
        'submit',
        abortController.signal,
        execId
      );

      if (abortController.signal.aborted) {
        setEvaluationStatus('idle');
        return null;
      }

      // 1. Evaluation completed -> update state
      setEvaluationStatus('completed');
      setEvaluationResult(evalResult);

      const effectiveUserId = user?.id || 'guest';
      codingHistoryService.saveSubmittedCode(effectiveUserId, prob.id, lang, code);

      const newSubmission: CodingSubmission = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        problem_id: prob.id || `prob_${Date.now()}`,
        problem_title: prob.title,
        difficulty: prob.difficulty,
        subject: prob.subject,
        topic: prob.topic,
        user_id: effectiveUserId,
        code: code,
        submitted_code: code,
        language: lang,
        status: evalResult.status,
        status_text: evalResult.statusText,
        test_cases_passed: evalResult.passedTestCases,
        total_test_cases: evalResult.totalTestCases,
        runtime_ms: evalResult.runtimeMs,
        memory_kb: evalResult.memoryKb,
        ai_feedback: evalResult.aiFeedback,
        created_at: new Date().toISOString(),
        persistenceStatus: 'saving',
      };

      // 2. Start cloud persistence -> transition to saving state
      setPersistenceStatus('saving');

      // 3. Authoritative persistence via codingService (AWAITED)
      const savedSubmission = await codingService.saveSubmission(newSubmission);

      // 4. Update submissions state with canonical savedSubmission
      setSubmissions((prev) => [savedSubmission, ...prev.filter((s) => s.id !== savedSubmission.id)]);
      setSubmissionCount((prev) => prev + 1);

      // 5. Final Notification based on real Supabase response
      if (savedSubmission.cloudSynced) {
        setPersistenceStatus('synced');
        if (evalResult.status === 'accepted') {
          showToastRef.current('Accepted (Submission Synced)', `All ${evalResult.totalTestCases} test cases passed and saved to cloud!`, 'success');
        } else {
          showToastRef.current(
            'Submission Synced',
            `${evalResult.statusText} (${evalResult.passedTestCases}/${evalResult.totalTestCases} passed). Saved to cloud.`,
            'info'
          );
        }
      } else {
        setPersistenceStatus(effectiveUserId === 'guest' ? 'not_saved' : 'pending');
        if (effectiveUserId !== 'guest') {
          showToastRef.current(
            'Saved Locally — Cloud Sync Pending',
            'Submission completed, but cloud sync is pending. You can retry syncing anytime.',
            'warning',
            {
              label: 'Retry Sync',
              onClick: () => handleRetryCloudSave(savedSubmission),
            }
          );
        } else {
          if (evalResult.status === 'accepted') {
            showToastRef.current('Accepted (Guest Mode)', `All ${evalResult.totalTestCases} test cases passed! Sign in to sync across devices.`, 'success');
          } else {
            showToastRef.current(
              'Submission Evaluated (Guest)',
              `${evalResult.statusText} (${evalResult.passedTestCases}/${evalResult.totalTestCases} passed). Sign in to persist to cloud.`,
              'info'
            );
          }
        }
      }

      // Check for newly unlocked achievements
      try {
        const allSubs = await codingService.getSubmissions(effectiveUserId);
        const newlyUnlocked = checkNewlyUnlockedAchievements(allSubs, effectiveUserId);
        if (newlyUnlocked.length > 0) {
          setNewlyUnlockedAchievement(newlyUnlocked[0]);
        }
      } catch (bgErr) {
        console.warn('Achievement check notice:', bgErr);
      }

      return evalResult;
    } catch (error: any) {
      if (error?.name === 'AbortError') return null;
      console.error('Error submitting code:', error);
      setEvaluationStatus('failed');
      showToastRef.current('Evaluation Error', error?.name === 'TimeoutError' ? 'Evaluation timed out. Please try again.' : 'Failed to evaluate code. Please retry.', 'error');
      return null;
    } finally {
      setIsSubmitting(false);
      if (submitAbortRef.current === abortController) {
        submitAbortRef.current = null;
      }
    }
  }, [user?.id]);

  const handleRetryCloudSave = useCallback(async (sub: CodingSubmission) => {
    try {
      setPersistenceStatus('saving');
      const res = await codingService.saveSubmission(sub);
      if (res.cloudSynced) {
        setPersistenceStatus('synced');
        showToastRef.current('Submission Synced', 'Submission successfully synced to Supabase!', 'success');
        setSubmissions((prev) => prev.map((s) => (s.id === res.id ? res : s)));
      } else {
        setPersistenceStatus('pending');
        showToastRef.current('Cloud Sync Notice', res.cloudSyncError || 'Could not sync to cloud.', 'warning');
      }
    } catch (err: any) {
      setPersistenceStatus('failed');
      showToastRef.current('Cloud Sync Error', err.message || 'Retry failed.', 'error');
    }
  }, []);

  const handleViewAchievements = useCallback(() => {
    setPageTab('history');
    setTimeout(() => {
      const el = document.getElementById('coding-achievements-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  }, []);

  const handleResetWorkspace = useCallback(() => {
    setActiveProblem(null);
    setCurrentCode('');
    setEvaluationResult(null);
    setSubmissions([]);
    setMobileActiveView('problem');
    setIsConfigExpanded(false);
  }, []);

  const availableLanguages = useMemo(
    () => getAvailableLanguagesForSubject(isCustomSubjectSelected ? 'DSA' : selectedSubject),
    [isCustomSubjectSelected, selectedSubject]
  );

  const currentTopics = useMemo(
    () => (isCustomSubjectSelected
      ? (SUBJECT_TOPICS['Default'] || [])
      : (SUBJECT_TOPICS[selectedSubject] || SUBJECT_TOPICS['Default'] || [])),
    [isCustomSubjectSelected, selectedSubject]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1 flex flex-col">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {sourceContext === 'roadmap' && (
                <button
                  type="button"
                  onClick={() => onNavigate('roadmap')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-2xs border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Roadmap</span>
                </button>
              )}

              {(sourceContext === 'company-preparation' || sourceContext === 'company-prep') && (
                <button
                  type="button"
                  onClick={() => onNavigate('company-prep')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-2xs border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Company Preparation</span>
                </button>
              )}

              {(sourceContext === 'preparation-dashboard' || sourceContext === 'dashboard' || sourceContext === 'prep-dashboard') && (
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-2xs border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Preparation Dashboard</span>
                </button>
              )}

              {sourceContext && <span className="text-slate-300 dark:text-slate-700">•</span>}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                AI Arena Live
              </span>
              {isFromCompanyPrep && activeCompanyContext?.company && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  Target: {activeCompanyContext.company}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Code2 className="w-6 h-6" />
              </div>
              <span>Coding Practice Arena</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Practice interview-style problems with Monaco code editor and AI evaluation.
            </p>
          </div>

          {/* Navigation Tab Switcher (Arena vs My Practice vs Achievements) */}
          <div className="flex items-center gap-2">
            <div className="p-1 bg-slate-200/70 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center shadow-2xs">
              <button
                type="button"
                onClick={() => setPageTab('arena')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  pageTab === 'arena'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Coding Arena</span>
              </button>

              <button
                type="button"
                onClick={() => setPageTab('history')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  pageTab === 'history'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>My Practice</span>
                {submissionCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {submissionCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPageTab('achievements');
                  setTimeout(() => {
                    const el = document.getElementById('coding-achievements-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  pageTab === 'achievements'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Achievements</span>
              </button>
            </div>

            {pageTab === 'arena' && activeProblem && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGenerateProblem}
                  disabled={isGenerating}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetWorkspace}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Config</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {pageTab === 'history' || pageTab === 'achievements' ? (
          /* MY PRACTICE / SUBMISSIONS HISTORY / ACHIEVEMENTS VIEW */
          <MyPracticeView
            userId={user?.id || 'guest'}
            onSelectProblemForPractice={handleSelectProblemForPractice}
            onSwitchToArena={() => setPageTab('arena')}
          />
        ) : (
          /* ARENA VIEW */
          <>
            {/* Targeted Company Context Banner */}
            {activeCompanyContext?.company && (
              <div className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white font-bold shadow-xs">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                        Targeted Placement Practice
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                        {activeCompanyContext.company}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Problems are calibrated for <strong>{activeCompanyContext.company}</strong> interview benchmarks {activeCompanyContext.role ? `(${activeCompanyContext.role})` : ''}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCompanyContext(null);
                      // Clean URL query parameters smoothly
                      window.history.replaceState({}, '', '/coding');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Clear Filter
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('company-prep')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>View Company Plan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 1: PRACTICE CONFIGURATION BAR / SUMMARY */}
            {activeProblem && !isConfigExpanded ? (
              <div className="p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{displaySubject}</span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    {displayTopic}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      selectedDifficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : selectedDifficulty === 'Medium'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                    }`}
                  >
                    {selectedDifficulty}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    {selectedLanguage}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigExpanded(true)}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Change Parameters</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Practice Configuration</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                      LeetCode-style structured problem generator
                    </span>
                    {activeProblem && (
                      <button
                        type="button"
                        onClick={() => setIsConfigExpanded(false)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Hide Parameters
                      </button>
                    )}
                  </div>
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative z-20">
                {/* Subject Dropdown */}
                <FloatingDropdown
                  id="subject-dropdown"
                  label="Subject"
                  icon={<Layers className="w-3.5 h-3.5 text-indigo-500" />}
                  value={selectedSubject}
                  options={[
                    ...SUBJECTS.map((sub) => ({ value: sub, label: sub })),
                    { value: '+ Custom Subject', label: '+ Custom Subject', isCustom: true },
                  ]}
                  onChange={(val) => handleSubjectChange(val as CodingSubject)}
                  disabled={isGenerating}
                />

                {/* Topic Dropdown with Search and Custom Topic */}
                <FloatingDropdown
                  id="topic-dropdown"
                  label="Topic"
                  icon={<BookOpen className="w-3.5 h-3.5 text-indigo-500" />}
                  value={selectedTopic}
                  searchable={true}
                  options={[
                    ...currentTopics.map((top) => ({ value: top, label: top })),
                    { value: 'Custom Topic', label: '+ Custom Topic', isCustom: true },
                  ]}
                  onChange={(val) => handleTopicDropdownChange(val)}
                  disabled={isGenerating}
                />

                {/* Difficulty Dropdown */}
                <FloatingDropdown
                  id="difficulty-dropdown"
                  label="Difficulty"
                  icon={<Target className="w-3.5 h-3.5 text-indigo-500" />}
                  value={selectedDifficulty}
                  options={DIFFICULTIES.map((diff) => ({
                    value: diff,
                    label: diff,
                    badge: diff === 'Easy' ? '🟢' : diff === 'Medium' ? '🟡' : '🔴',
                  }))}
                  onChange={(val) => setSelectedDifficulty(val as CodingDifficulty)}
                  disabled={isGenerating}
                />

                {/* Language Dropdown */}
                <FloatingDropdown
                  id="language-dropdown"
                  label="Language"
                  icon={<Laptop className="w-3.5 h-3.5 text-indigo-500" />}
                  value={selectedLanguage}
                  options={availableLanguages.map((lang) => ({ value: lang, label: lang }))}
                  onChange={(val) => handleLanguageChange(val as CodingLanguage)}
                  disabled={isGenerating}
                />
              </div>

              {/* Conditional Custom Subject Input Field */}
              {isCustomSubjectSelected && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-500/20 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="custom-subject-input"
                      className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Custom Subject</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubject('DSA');
                        setCustomSubject('');
                      }}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Switch back to standard dropdown
                    </button>
                  </div>

                  <input
                    id="custom-subject-input"
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Enter the subject you want to practice"
                    disabled={isGenerating}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-xs"
                  />

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Examples:</span>
                    {[
                      'Cloud Computing',
                      'Cybersecurity',
                      'Blockchain',
                      'DevOps',
                      'Software Testing',
                      'Machine Learning',
                      'Aptitude',
                    ].map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCustomSubject(ex)}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditional Custom Topic Input Field */}
              {isCustomTopicSelected && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-500/20 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="custom-topic-input"
                      className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Custom Topic / Concept</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTopic(currentTopics[0] || 'Arrays');
                        setCustomTopic('');
                      }}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Switch back to standard dropdown
                    </button>
                  </div>

                  <input
                    id="custom-topic-input"
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter any topic or concept you want to practice"
                    disabled={isGenerating}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-xs"
                  />

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Examples:</span>
                    {[
                      'Monotonic Stack',
                      'Prefix Sum',
                      'Bit Manipulation',
                      'Sliding Window',
                      'Array frequency problems',
                      'Graph shortest path',
                    ].map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCustomTopic(ex)}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Row */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    Targeting:{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{selectedLanguage}</strong> •{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{displaySubject}</strong> •{' '}
                    {displayTopic || 'Select or enter topic'} (
                    {selectedDifficulty})
                  </span>
                </div>

                <button
                  type="button"
                  id="generate-problem-btn"
                  onClick={handleGenerateProblem}
                  disabled={isGenerating}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Generating your problem...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Generate Problem</span>
                    </>
                  )}
                </button>
              </div>

              {/* Stale Configuration Warning Banner */}
              {isCurrentConfigStale && activeProblem && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start sm:items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                    <span>
                      Configuration changed: Current workspace is showing <strong>{activeProblem.topic} ({activeProblem.difficulty})</strong>. Click <strong>Generate Problem</strong> to load a problem for <strong>{displayTopic} ({selectedDifficulty})</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateProblem}
                    disabled={isGenerating}
                    className="self-end sm:self-auto px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Generate Now</span>
                  </button>
                </div>
              )}
            </div>
          )}

            {/* WORKSPACE CONTENT */}
            {!activeProblem ? (
              /* TOPIC-BASED QUESTION SERIES EXPLORER & DISCOVERY VIEW */
              <TopicQuestionSeriesView
                currentSubject={isCustomSubjectSelected ? ('DSA' as CodingSubject) : selectedSubject}
                currentTopic={displayTopic}
                currentDifficulty={selectedDifficulty}
                currentLanguage={selectedLanguage}
                onSubjectChange={handleSubjectChange}
                onTopicChange={handleTopicDropdownChange}
                onDifficultyChange={setSelectedDifficulty}
                onLanguageChange={handleLanguageChange}
                seriesItems={seriesItems}
                topicProgress={topicProgress}
                isLoadingSeries={isLoadingSeries}
                onSelectProblem={handleSelectProblemForPractice}
                onToggleSaveBookmark={handleToggleBookmark}
                onGenerateCustomProblem={handleGenerateProblem}
                isGeneratingAI={isGenerating}
                onOpenSavedModal={() => setIsSavedModalOpen(true)}
                savedCount={savedQuestions.length}
                savingBookmarkId={savingBookmarkId}
              />
            ) : (
              <div className="flex-1 min-h-0 flex flex-col space-y-4">
                {/* Active Problem Series Context Navigation Bar */}
                <div className="p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  {/* Left: Back to series button + breadcrumbs */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProblem(null);
                        setEvaluationResult(null);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to {displayTopic} Series</span>
                    </button>

                    <div className="hidden md:flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-medium">
                      <span>{displaySubject}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{displayTopic}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          selectedDifficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : selectedDifficulty === 'Medium'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {selectedDifficulty}
                      </span>
                    </div>

                    {isCurrentConfigStale && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-500/20 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        <span>Viewing: {activeProblem.topic}</span>
                      </span>
                    )}

                    {currentSeriesIndex !== -1 && !isCurrentConfigStale && (
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200/50 dark:border-indigo-800/40">
                        Question {currentSeriesIndex + 1} of {seriesItems.length}
                      </span>
                    )}
                  </div>

                  {/* Right: Prev/Next Question Navigation & Bookmark Action */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleNavigateSeries('prev')}
                      disabled={currentSeriesIndex <= 0}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                      title="Previous Question in Series"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateSeries('next')}
                      disabled={currentSeriesIndex === -1 || currentSeriesIndex >= seriesItems.length - 1}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                      title="Next Question in Series"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextUnsolvedProblem}
                      id="next-unsolved-problem-btn"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Jump to Next Unsolved Problem"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="hidden sm:inline">Next Unsolved</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => activeProblem && handleToggleBookmark(activeProblem)}
                      disabled={savingBookmarkId === activeProblem?.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        savingBookmarkId === activeProblem?.id
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : isCurrentActiveSaved
                          ? currentActiveSavedItem?.cloudSynced === false || currentActiveSavedItem?.persistenceStatus === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      title={
                        savingBookmarkId === activeProblem?.id
                          ? 'Persisting to Supabase cloud...'
                          : isCurrentActiveSaved
                          ? currentActiveSavedItem?.cloudSynced === false || currentActiveSavedItem?.persistenceStatus === 'pending'
                            ? 'Changes saved on this device (Cloud sync pending) - Click to toggle'
                            : 'Question saved and synced to Supabase'
                          : 'Save question to cloud'
                      }
                    >
                      {savingBookmarkId === activeProblem?.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                          <span>Saving...</span>
                        </>
                      ) : isCurrentActiveSaved ? (
                        currentActiveSavedItem?.cloudSynced === false || currentActiveSavedItem?.persistenceStatus === 'pending' ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Sync Pending</span>
                          </>
                        ) : (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                            <span>Saved</span>
                          </>
                        )
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSavedModalOpen(true)}
                      className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer relative"
                      title="View all saved questions"
                    >
                      <ListOrdered className="w-4 h-4" />
                      {savedQuestions.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                          {savedQuestions.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile / Tablet View Switcher (<lg) */}
                <div className="flex lg:hidden items-center justify-center p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl max-w-sm mx-auto w-full">
                  <button
                    type="button"
                    onClick={() => setMobileActiveView('problem')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      mobileActiveView === 'problem'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Problem Statement</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileActiveView('editor')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      mobileActiveView === 'editor'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-4 h-4" />
                    <span>Monaco Code Editor</span>
                  </button>
                </div>

                {/* Split Grid (Desktop: Side by Side, Mobile: Conditional Display) */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px] lg:h-[calc(100vh-190px)]">
                  {/* Left Column: Problem Description, Editorial, Submissions */}
                  <div
                    className={`lg:col-span-5 h-full min-h-0 overflow-hidden ${
                      mobileActiveView === 'problem' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
                    }`}
                  >
                    <ProblemView
                      problem={activeProblem}
                      selectedLanguage={selectedLanguage}
                      submissions={submissions}
                      hasSubmitted={submissions.length > 0}
                      onRetryCloudSave={handleRetryCloudSave}
                      onRestoreCode={(restoredCode) => {
                        setCurrentCode(restoredCode);
                        setMobileActiveView('editor');
                        showToastRef.current('Code Restored', 'Loaded submitted solution into editor!', 'success');
                      }}
                    />
                  </div>

                  {/* Right Column: Code Editor Workspace */}
                  <div
                    className={`lg:col-span-7 h-full min-h-0 overflow-hidden ${
                      mobileActiveView === 'editor' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
                    }`}
                  >
                    <CodeEditorWorkspace
                      language={selectedLanguage}
                      availableLanguages={availableLanguages}
                      onLanguageChange={handleLanguageChange}
                      code={currentCode}
                      onCodeChange={setCurrentCode}
                      problem={activeProblem}
                      onRunCode={handleRunCode}
                      onSubmitSolution={handleSubmitSolution}
                      evaluationResult={evaluationResult}
                      evaluationStatus={evaluationStatus}
                      persistenceStatus={persistenceStatus}
                      executionId={currentExecutionId}
                      isRunning={isRunning}
                      isSubmitting={isSubmitting}
                      submissions={submissions}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Saved Questions Modal */}
      <SavedQuestionsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedQuestions={savedQuestions}
        onSelectProblem={(problem, lang) => {
          setIsSavedModalOpen(false);
          handleSelectProblemForPractice(problem, lang || selectedLanguage);
        }}
        onRemoveSaved={handleRemoveSavedQuestion}
        onRetrySync={handleRetrySaveBookmark}
      />

      {/* Achievement Unlocked Toast Notification */}
      <AchievementToast
        achievement={newlyUnlockedAchievement}
        onClose={() => setNewlyUnlockedAchievement(null)}
        onViewAchievements={handleViewAchievements}
      />
    </div>
  );
};

