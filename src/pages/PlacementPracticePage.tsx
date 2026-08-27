import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlacementCategory,
  PlacementPracticeConfig,
  PlacementTestSession,
  PlacementMCQ,
  PlacementAnswerRecord,
  PlacementDifficulty,
  PlacementMode,
  TECHNICAL_SUBJECTS,
  TECHNICAL_TOPIC_MAP,
  APTITUDE_TOPIC_MAP,
  AptitudeSubject,
} from '../types/placement';
import {
  getPlacementHistory,
  fetchPlacementHistory,
  getPlacementStats,
  savePlacementSession,
  computeSessionBreakdown,
} from '../services/placementStorage';
import { markItemCompleted, markTaskCompleted } from '../services/roadmapStorage';
import { generatePlacementMCQs } from '../services/placementService';
import { PlacementSetupView, RoadmapContextInfo } from '../components/placement/PlacementSetupView';
import { PlacementQuestionView } from '../components/placement/PlacementQuestionView';
import { PlacementResultView } from '../components/placement/PlacementResultView';
import { PlacementHistoryView } from '../components/placement/PlacementHistoryView';
import { Brain, Sparkles, Loader2, ArrowLeft } from 'lucide-react';

interface PlacementPracticePageProps {
  onNavigate: (page: string) => void;
  initialTopic?: string;
  initialSubject?: string;
  initialCategory?: PlacementCategory;
}

type ViewMode = 'setup' | 'generating' | 'active' | 'result' | 'history';

export const PlacementPracticePage: React.FC<PlacementPracticePageProps> = ({
  onNavigate,
  initialTopic,
  initialSubject,
  initialCategory,
}) => {
  const { user, profile } = useAuth();
  const studentId = user?.id || profile?.id || 'guest';
  const studentEmail = user?.email || profile?.email || '';

  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [activeConfig, setActiveConfig] = useState<PlacementPracticeConfig | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<PlacementMCQ[]>([]);
  const [currentSession, setCurrentSession] = useState<PlacementTestSession | null>(null);

  // Initial setup prefilled values
  const [prefillTopic, setPrefillTopic] = useState<string | undefined>(initialTopic);
  const [prefillSubject, setPrefillSubject] = useState<string | undefined>(initialSubject);
  const [prefillCategory, setPrefillCategory] = useState<PlacementCategory | undefined>(initialCategory);
  const [prefillDifficulty, setPrefillDifficulty] = useState<PlacementDifficulty>('Medium');
  const [prefillQuestionCount, setPrefillQuestionCount] = useState<number>(10);
  const [roadmapContext, setRoadmapContext] = useState<RoadmapContextInfo | null>(null);

  const autoTriggeredRef = useRef<boolean>(false);

  // Statistics & History
  const [history, setHistory] = useState<PlacementTestSession[]>([]);
  const [stats, setStats] = useState(getPlacementStats(studentId));
  const [generationMessage, setGenerationMessage] = useState<string>('Curating questions...');

  const refreshData = useCallback(() => {
    const hist = getPlacementHistory(studentId);
    setHistory(hist);
    setStats(getPlacementStats(studentId));

    if (studentId && studentId !== 'guest') {
      fetchPlacementHistory(studentId).then((synced) => {
        if (synced) {
          setHistory(synced);
          setStats(getPlacementStats(studentId));
        }
      });
    }
  }, [studentId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Read URL query parameters and apply roadmap context
  useEffect(() => {
    if (autoTriggeredRef.current) return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const rawCat = searchParams.get('category') || searchParams.get('domain');
      const rawSub = searchParams.get('subject');
      const rawTop = searchParams.get('topic');
      const rawTopics = searchParams.get('topics');
      const rawDiff = searchParams.get('difficulty') as PlacementDifficulty;
      const rawCount = searchParams.get('questionCount') || searchParams.get('count');
      const rawMode = searchParams.get('mode') as PlacementMode;
      const rawCompany = searchParams.get('company');
      const rawRole = searchParams.get('role');
      const rawRoadmapItemId = searchParams.get('roadmapItemId');
      const rawTaskId = searchParams.get('taskId');
      const rawSource = searchParams.get('source');
      const rawAuto = searchParams.get('auto');

      if (rawCat || rawSub || rawTop || rawTopics || rawRoadmapItemId || rawTaskId) {
        // 1. Resolve Category
        let resolvedCategory: PlacementCategory = 'Aptitude';
        if (rawCat) {
          if (rawCat.toLowerCase().includes('tech') || rawCat.toLowerCase().includes('core')) {
            resolvedCategory = 'Technical';
          } else if (rawCat.toLowerCase().includes('apt')) {
            resolvedCategory = 'Aptitude';
          }
        } else if (rawSub) {
          const isTechSub = TECHNICAL_SUBJECTS.some(
            (ts) =>
              ts.toLowerCase() === rawSub.toLowerCase() ||
              rawSub.toLowerCase().includes(ts.toLowerCase()) ||
              (rawSub.toLowerCase().includes('os') && ts === 'Operating Systems') ||
              (rawSub.toLowerCase().includes('cn') && ts === 'Computer Networks') ||
              (rawSub.toLowerCase().includes('oops') && ts === 'OOP') ||
              rawSub.toLowerCase().includes('dbms') ||
              rawSub.toLowerCase().includes('sql') ||
              rawSub.toLowerCase().includes('core cs')
          );
          if (isTechSub) {
            resolvedCategory = 'Technical';
          }
        }

        // 2. Resolve Subject
        let resolvedSubject = '';
        let isCustomSubject = false;
        let customSubjectText = '';

        if (resolvedCategory === 'Technical') {
          if (rawSub) {
            const foundTech = TECHNICAL_SUBJECTS.find(
              (ts) =>
                ts.toLowerCase() === rawSub.toLowerCase() ||
                (rawSub.toLowerCase().includes('dbms') && ts === 'DBMS') ||
                (rawSub.toLowerCase().includes('sql') && (ts === 'SQL' || ts === 'DBMS')) ||
                (rawSub.toLowerCase().includes('os') && ts === 'Operating Systems') ||
                (rawSub.toLowerCase().includes('cn') && ts === 'Computer Networks') ||
                (rawSub.toLowerCase().includes('oops') && ts === 'OOP')
            );
            if (foundTech) {
              resolvedSubject = foundTech;
            } else if (rawSub.toLowerCase().includes('dbms') || rawSub.toLowerCase().includes('sql') || rawSub.toLowerCase().includes('core cs')) {
              resolvedSubject = 'DBMS';
            } else {
              resolvedSubject = rawSub;
              isCustomSubject = true;
              customSubjectText = rawSub;
            }
          } else {
            resolvedSubject = 'DBMS';
          }
        } else {
          // Aptitude
          if (rawSub) {
            const aptitudeSubjects = ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation'];
            const foundApt = aptitudeSubjects.find((as) => as.toLowerCase() === rawSub.toLowerCase());
            if (foundApt) {
              resolvedSubject = foundApt;
            } else {
              resolvedSubject = 'Quantitative Aptitude';
            }
          } else {
            resolvedSubject = 'Quantitative Aptitude';
          }
        }

        // 3. Resolve Topic
        let resolvedTopic = '';
        let isCustomTopic = false;
        let customTopicText = '';
        const availableTopics =
          resolvedCategory === 'Technical'
            ? TECHNICAL_TOPIC_MAP[resolvedSubject] || []
            : APTITUDE_TOPIC_MAP[resolvedSubject as AptitudeSubject] || [];

        if (rawTop) {
          const exactMatch = availableTopics.find((t) => t.toLowerCase() === rawTop.toLowerCase());
          if (exactMatch) {
            resolvedTopic = exactMatch;
          } else {
            const partialMatch = availableTopics.find(
              (t) => t.toLowerCase().includes(rawTop.toLowerCase()) || rawTop.toLowerCase().includes(t.toLowerCase())
            );
            if (partialMatch && !rawTop.includes(',')) {
              resolvedTopic = partialMatch;
            } else {
              resolvedTopic = rawTop;
              isCustomTopic = true;
              customTopicText = rawTop;
            }
          }
        } else if (rawTopics) {
          resolvedTopic = rawTopics;
          isCustomTopic = true;
          customTopicText = rawTopics;
        } else {
          resolvedTopic = availableTopics[0] || (resolvedSubject === 'DBMS' ? 'Transactions & ACID Properties' : 'Core Concepts');
        }

        // 4. Resolve Difficulty & Count & Mode
        const resolvedDifficulty: PlacementDifficulty = ['Easy', 'Medium', 'Hard'].includes(rawDiff)
          ? rawDiff
          : 'Medium';
        const resolvedCount = rawCount ? Math.max(1, Math.min(30, parseInt(rawCount, 10))) : 10;
        const resolvedMode: PlacementMode = rawMode === 'timed' ? 'timed' : 'practice';

        const parsedTopicsList = rawTopics ? rawTopics.split(',').map((t) => t.trim()).filter(Boolean) : undefined;

        const ctx: RoadmapContextInfo = {
          source: rawSource || 'roadmap',
          category: resolvedCategory,
          subject: resolvedSubject,
          topic: resolvedTopic,
          topics: parsedTopicsList,
          difficulty: resolvedDifficulty,
          questionCount: resolvedCount,
          company: rawCompany || undefined,
          role: rawRole || undefined,
          roadmapItemId: rawRoadmapItemId || undefined,
          taskId: rawTaskId || undefined,
        };

        setRoadmapContext(ctx);
        setPrefillCategory(resolvedCategory);
        setPrefillSubject(resolvedSubject);
        setPrefillTopic(resolvedTopic);
        setPrefillDifficulty(resolvedDifficulty);
        setPrefillQuestionCount(resolvedCount);

        // Auto-start if requested and not yet triggered
        if (rawAuto === 'true' && !autoTriggeredRef.current) {
          autoTriggeredRef.current = true;
          const targetConfig: PlacementPracticeConfig = {
            category: resolvedCategory,
            subject: resolvedSubject,
            isCustomSubject,
            customSubjectText,
            topic: resolvedTopic,
            isCustomTopic,
            customTopicText,
            difficulty: resolvedDifficulty,
            questionCount: resolvedCount,
            mode: resolvedMode,
            timeLimitMinutes: Math.max(1, Math.round(resolvedCount * 1.5)),
            company: rawCompany || undefined,
            role: rawRole || undefined,
            source: rawSource || 'roadmap',
            roadmapItemId: rawRoadmapItemId || undefined,
            taskId: rawTaskId || undefined,
            topics: parsedTopicsList,
          };

          handleStartSession(targetConfig);
        }
      }
    } catch (err) {
      console.warn('[PlacementPracticePage] Error parsing search params:', err);
    }
  }, []);

  // Start test generation
  const handleStartSession = async (config: PlacementPracticeConfig) => {
    setActiveConfig(config);
    setViewMode('generating');
    setGenerationMessage(
      `Creating ${config.questionCount} original ${config.difficulty} questions on ${config.subject} · ${config.topic}...`
    );

    try {
      const generated = await generatePlacementMCQs(config);
      if (generated && generated.length > 0) {
        setActiveQuestions(generated);
        setViewMode('active');
      } else {
        alert('Could not generate questions. Please try again.');
        setViewMode('setup');
      }
    } catch (err) {
      console.error('[PlacementPracticePage] Generation failed:', err);
      alert('Generation encountered an issue. Returning to setup.');
      setViewMode('setup');
    }
  };

  // Test finished
  const handleFinishTest = (
    answers: Record<number, PlacementAnswerRecord>,
    timeTakenSeconds: number
  ) => {
    if (!activeConfig) return;

    const totalQuestions = activeQuestions.length;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    Object.values(answers).forEach((ans) => {
      if (ans.isSkipped || ans.selectedOption === null) {
        skippedCount++;
      } else if (ans.isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const answeredTotal = correctCount + incorrectCount;
    const accuracy = answeredTotal > 0 ? Math.round((correctCount / answeredTotal) * 100) : 0;

    // Compute topic breakdown and weak area
    const partialSession = {
      questions: activeQuestions,
      answers,
      topic: activeConfig.topic,
    };
    const { topicBreakdown, weakestTopic } = computeSessionBreakdown(partialSession);

    const newSession: PlacementTestSession = {
      id: `pts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId,
      studentEmail,
      category: activeConfig.category,
      subject: activeConfig.subject,
      topic: activeConfig.topic,
      isCustomSubject: activeConfig.isCustomSubject,
      isCustomTopic: activeConfig.isCustomTopic,
      difficulty: activeConfig.difficulty,
      mode: activeConfig.mode,
      questions: activeQuestions,
      answers,
      totalQuestions,
      correctCount,
      incorrectCount,
      skippedCount,
      score,
      accuracy,
      timeTakenSeconds,
      topicBreakdown,
      weakestTopic,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      company: activeConfig.company,
      role: activeConfig.role,
      source: activeConfig.source,
      roadmapItemId: activeConfig.roadmapItemId,
      taskId: activeConfig.taskId,
      topics: activeConfig.topics,
    };

    savePlacementSession(newSession, studentId);

    // If session was triggered by a roadmap recommendation, update roadmap progress!
    if (activeConfig.roadmapItemId) {
      markItemCompleted(studentId, activeConfig.roadmapItemId);
    }
    if (activeConfig.taskId) {
      markTaskCompleted(studentId, activeConfig.taskId);
    }

    setCurrentSession(newSession);
    refreshData();
    setViewMode('result');
  };

  // Practice weak topic trigger
  const handlePracticeWeakTopic = (
    topic: string,
    subject: string,
    category: 'Aptitude' | 'Technical'
  ) => {
    setPrefillCategory(category);
    setPrefillSubject(subject);
    setPrefillTopic(topic);
    setRoadmapContext(null);
    setViewMode('setup');
  };

  // Retake same test config
  const handleRetakeTest = () => {
    if (activeConfig) {
      handleStartSession(activeConfig);
    } else if (currentSession) {
      const config: PlacementPracticeConfig = {
        category: currentSession.category,
        subject: currentSession.subject,
        topic: currentSession.topic,
        difficulty: currentSession.difficulty,
        questionCount: currentSession.totalQuestions,
        mode: currentSession.mode,
        company: currentSession.company,
        role: currentSession.role,
        source: currentSession.source,
        roadmapItemId: currentSession.roadmapItemId,
        taskId: currentSession.taskId,
        topics: currentSession.topics,
      };
      handleStartSession(config);
    }
  };

  // Replay past session
  const handleReplaySession = (session: PlacementTestSession) => {
    const config: PlacementPracticeConfig = {
      category: session.category,
      subject: session.subject,
      topic: session.topic,
      difficulty: session.difficulty,
      questionCount: session.totalQuestions,
      mode: session.mode,
      company: session.company,
      role: session.role,
      source: session.source,
      roadmapItemId: session.roadmapItemId,
      taskId: session.taskId,
      topics: session.topics,
    };
    handleStartSession(config);
  };

  const searchParamSource = new URLSearchParams(window.location.search).get('source');
  const currentSource = roadmapContext?.source || activeConfig?.source || searchParamSource;

  const isFromRoadmap = currentSource === 'roadmap';
  const isFromCompanyPrep = currentSource === 'company-preparation' || currentSource === 'company-prep';
  const isFromDashboard = currentSource === 'preparation-dashboard' || currentSource === 'dashboard' || currentSource === 'prep-dashboard';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
      
      {/* Top Banner for Roadmap Guided Mode */}
      {isFromRoadmap && (
        <div className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('roadmap')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-2xs border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Roadmap</span>
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Roadmap Focus: {roadmapContext?.topic || prefillTopic || 'Scheduled Target'}
              </span>
              {roadmapContext?.subject && (
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                  ({roadmapContext.category === 'Technical' ? `Technical MCQs • ${roadmapContext.subject}` : `Aptitude • ${roadmapContext.subject}`})
                </span>
              )}
            </div>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-lg bg-indigo-600 text-white shadow-2xs">
            Roadmap Guided
          </span>
        </div>
      )}

      {/* Top Banner for Company Prep Address Gap Mode */}
      {isFromCompanyPrep && (
        <div className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('company-prep')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-2xs border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Company Preparation</span>
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Targeted Gap Practice: {roadmapContext?.topic || prefillTopic || 'Core CS: DBMS & SQL'}
              </span>
              {roadmapContext?.company && (
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                  for {roadmapContext.company}
                </span>
              )}
            </div>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-lg bg-indigo-600 text-white shadow-2xs">
            Address Gap Mode
          </span>
        </div>
      )}

      {/* Top Banner for Dashboard Focus Mode */}
      {isFromDashboard && (
        <div className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-2xs border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Preparation Dashboard</span>
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Preparation Focus Practice
              </span>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-lg bg-indigo-600 text-white shadow-2xs">
            Dashboard Focus
          </span>
        </div>
      )}

      {/* 1. SETUP VIEW */}
      {viewMode === 'setup' && (
        <PlacementSetupView
          onStartSession={handleStartSession}
          onViewHistory={() => setViewMode('history')}
          stats={stats}
          initialTopic={prefillTopic}
          initialSubject={prefillSubject}
          initialCategory={prefillCategory}
          initialDifficulty={prefillDifficulty}
          initialQuestionCount={prefillQuestionCount}
          roadmapContext={roadmapContext}
          onClearRoadmapContext={() => setRoadmapContext(null)}
        />
      )}

      {/* 2. GENERATING VIEW */}
      {viewMode === 'generating' && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center max-w-md mx-auto p-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border-2 border-indigo-500/30 flex items-center justify-center animate-pulse">
              <Brain className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-indigo-600 text-white shadow-md">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Generating Placement MCQs
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {generationMessage}
            </p>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse w-3/4 rounded-full" />
          </div>
        </div>
      )}

      {/* 3. ACTIVE SOLVING VIEW */}
      {viewMode === 'active' && activeConfig && (
        <PlacementQuestionView
          questions={activeQuestions}
          config={activeConfig}
          onFinishTest={handleFinishTest}
          onExit={() => {
            if (isFromCompanyPrep) {
              onNavigate('company-prep');
            } else {
              setRoadmapContext(null);
              setViewMode('setup');
            }
          }}
        />
      )}

      {/* 4. RESULT VIEW */}
      {viewMode === 'result' && currentSession && (
        <PlacementResultView
          session={currentSession}
          onPracticeWeakTopic={handlePracticeWeakTopic}
          onRetakeTest={handleRetakeTest}
          onNewSession={() => {
            setRoadmapContext(null);
            setViewMode('setup');
          }}
          onViewHistory={() => setViewMode('history')}
          onBackToCompanyPrep={isFromCompanyPrep ? () => onNavigate('company-prep') : undefined}
        />
      )}

      {/* 5. HISTORY VIEW */}
      {viewMode === 'history' && (
        <PlacementHistoryView
          history={history}
          stats={stats}
          onBackToSetup={() => setViewMode('setup')}
          onSelectSession={(s) => {
            setCurrentSession(s);
            setViewMode('result');
          }}
          onReplaySession={handleReplaySession}
          onRefreshHistory={refreshData}
          studentId={studentId}
        />
      )}

    </div>
  );
};
