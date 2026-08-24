import React, { useState, useEffect } from 'react';
import {
  Brain,
  Code2,
  Sparkles,
  Clock,
  CheckCircle2,
  Layers,
  HelpCircle,
  BarChart2,
  Sliders,
  Plus,
  ArrowRight,
  History,
  Zap,
  Target,
  X,
} from 'lucide-react';
import {
  PlacementCategory,
  PlacementDifficulty,
  PlacementMode,
  PlacementPracticeConfig,
  PlacementStudentStats,
  APTITUDE_TOPIC_MAP,
  TECHNICAL_SUBJECTS,
  TECHNICAL_TOPIC_MAP,
  AptitudeSubject,
} from '../../types/placement';

export interface RoadmapContextInfo {
  source?: string;
  category: PlacementCategory;
  subject: string;
  topic: string;
  topics?: string[];
  difficulty: PlacementDifficulty;
  questionCount: number;
  company?: string;
  role?: string;
  roadmapItemId?: string;
  taskId?: string;
}

interface PlacementSetupViewProps {
  onStartSession: (config: PlacementPracticeConfig) => void;
  onViewHistory: () => void;
  stats: PlacementStudentStats;
  initialTopic?: string;
  initialSubject?: string;
  initialCategory?: PlacementCategory;
  initialDifficulty?: PlacementDifficulty;
  initialQuestionCount?: number;
  roadmapContext?: RoadmapContextInfo | null;
  onClearRoadmapContext?: () => void;
}

export const PlacementSetupView: React.FC<PlacementSetupViewProps> = ({
  onStartSession,
  onViewHistory,
  stats,
  initialTopic,
  initialSubject,
  initialCategory = 'Aptitude',
  initialDifficulty = 'Medium',
  initialQuestionCount = 10,
  roadmapContext,
  onClearRoadmapContext,
}) => {
  const [category, setCategory] = useState<PlacementCategory>(initialCategory);

  // Aptitude state
  const [aptitudeSubject, setAptitudeSubject] = useState<AptitudeSubject>(
    (initialSubject as AptitudeSubject) || 'Quantitative Aptitude'
  );

  // Technical state
  const [technicalSubject, setTechnicalSubject] = useState<string>(
    initialSubject || 'DSA'
  );
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(
    initialSubject === 'Custom' || Boolean(initialSubject && !TECHNICAL_SUBJECTS.includes(initialSubject as any))
  );
  const [customSubjectText, setCustomSubjectText] = useState<string>(
    initialSubject && !TECHNICAL_SUBJECTS.includes(initialSubject as any) ? initialSubject : ''
  );

  // Topic state
  const currentTopics =
    category === 'Aptitude'
      ? APTITUDE_TOPIC_MAP[aptitudeSubject] || []
      : TECHNICAL_TOPIC_MAP[technicalSubject] || [];

  const [selectedTopic, setSelectedTopic] = useState<string>(
    initialTopic || (currentTopics.length > 0 ? currentTopics[0] : '')
  );
  const [isCustomTopic, setIsCustomTopic] = useState<boolean>(
    Boolean(initialTopic && !currentTopics.includes(initialTopic))
  );
  const [customTopicText, setCustomTopicText] = useState<string>(
    initialTopic && !currentTopics.includes(initialTopic) ? initialTopic : ''
  );

  // Difficulty & Question Count
  const [difficulty, setDifficulty] = useState<PlacementDifficulty>(initialDifficulty);
  const [questionCountChoice, setQuestionCountChoice] = useState<string>(
    [5, 10, 15, 20].includes(initialQuestionCount) ? String(initialQuestionCount) : 'custom'
  );
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(initialQuestionCount);

  // Mode
  const [mode, setMode] = useState<PlacementMode>('practice');

  // Synchronize state whenever props change
  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
    if (initialSubject) {
      if (initialCategory === 'Aptitude') {
        const aptSubs = ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation'];
        if (aptSubs.includes(initialSubject)) {
          setAptitudeSubject(initialSubject as AptitudeSubject);
        }
      } else {
        if (TECHNICAL_SUBJECTS.includes(initialSubject as any)) {
          setTechnicalSubject(initialSubject);
          setIsCustomSubject(false);
          setCustomSubjectText('');
        } else {
          setTechnicalSubject('+ Custom Subject');
          setIsCustomSubject(true);
          setCustomSubjectText(initialSubject);
        }
      }
    }
    if (initialTopic) {
      const activeSub = initialCategory === 'Technical'
        ? (initialSubject || technicalSubject)
        : (initialSubject || aptitudeSubject);
      const available = initialCategory === 'Technical'
        ? (TECHNICAL_TOPIC_MAP[activeSub] || [])
        : (APTITUDE_TOPIC_MAP[activeSub as AptitudeSubject] || []);

      if (available.includes(initialTopic)) {
        setSelectedTopic(initialTopic);
        setIsCustomTopic(false);
        setCustomTopicText('');
      } else {
        setSelectedTopic('Custom Topic');
        setIsCustomTopic(true);
        setCustomTopicText(initialTopic);
      }
    }
    if (initialDifficulty) {
      setDifficulty(initialDifficulty);
    }
    if (initialQuestionCount) {
      if ([5, 10, 15, 20].includes(initialQuestionCount)) {
        setQuestionCountChoice(String(initialQuestionCount));
      } else {
        setQuestionCountChoice('custom');
        setCustomQuestionCount(initialQuestionCount);
      }
    }
  }, [initialCategory, initialSubject, initialTopic, initialDifficulty, initialQuestionCount, roadmapContext]);

  const handleCategoryChange = (newCat: PlacementCategory) => {
    setCategory(newCat);
    if (newCat === 'Aptitude') {
      const defaultSub: AptitudeSubject = 'Quantitative Aptitude';
      setAptitudeSubject(defaultSub);
      setIsCustomSubject(false);
      const topics = APTITUDE_TOPIC_MAP[defaultSub] || [];
      setSelectedTopic(topics[0] || '');
      setIsCustomTopic(false);
    } else {
      setTechnicalSubject('DSA');
      setIsCustomSubject(false);
      const topics = TECHNICAL_TOPIC_MAP['DSA'] || [];
      setSelectedTopic(topics[0] || '');
      setIsCustomTopic(false);
    }
  };

  const handleAptitudeSubjectChange = (sub: AptitudeSubject) => {
    setAptitudeSubject(sub);
    const topics = APTITUDE_TOPIC_MAP[sub] || [];
    setSelectedTopic(topics[0] || '');
    setIsCustomTopic(false);
  };

  const handleTechnicalSubjectChange = (sub: string) => {
    if (sub === '+ Custom Subject') {
      setIsCustomSubject(true);
      setSelectedTopic('');
      setIsCustomTopic(true);
    } else {
      setIsCustomSubject(false);
      setTechnicalSubject(sub);
      const topics = TECHNICAL_TOPIC_MAP[sub] || [];
      setSelectedTopic(topics[0] || '');
      setIsCustomTopic(false);
    }
  };

  const handleStart = () => {
    let finalSubject = category === 'Aptitude' ? aptitudeSubject : technicalSubject;
    if (category === 'Technical' && isCustomSubject) {
      finalSubject = customSubjectText.trim() || 'Custom Subject';
    }

    let finalTopic = selectedTopic;
    if (isCustomTopic) {
      finalTopic = customTopicText.trim() || 'General Concept';
    }

    const count =
      questionCountChoice === 'custom'
        ? Math.max(1, Math.min(30, customQuestionCount || 5))
        : parseInt(questionCountChoice, 10) || 10;

    // Time limit: approx 1.5 min per question for timed test
    const timeLimitMinutes = Math.max(1, Math.round(count * 1.5));

    const config: PlacementPracticeConfig = {
      category,
      subject: finalSubject,
      isCustomSubject: category === 'Technical' && isCustomSubject,
      customSubjectText: customSubjectText.trim(),
      topic: finalTopic,
      isCustomTopic,
      customTopicText: customTopicText.trim(),
      difficulty,
      questionCount: count,
      mode,
      timeLimitMinutes,
      company: roadmapContext?.company,
      role: roadmapContext?.role,
      source: roadmapContext ? 'roadmap' : undefined,
      roadmapItemId: roadmapContext?.roadmapItemId,
      taskId: roadmapContext?.taskId,
      topics: roadmapContext?.topics,
    };

    onStartSession(config);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Targeted Roadmap Practice Banner */}
      {roadmapContext && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-indigo-800 to-purple-900 text-white shadow-lg border border-indigo-400/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[260px] h-[160px] bg-white/10 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-white/20 text-indigo-100 font-extrabold text-[11px] flex items-center gap-1.5 backdrop-blur-md">
                  <Target className="w-3.5 h-3.5 text-amber-300" />
                  <span>Targeted Career Roadmap Practice</span>
                </span>
                {roadmapContext.company && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-semibold text-[11px]">
                    {roadmapContext.company} {roadmapContext.role ? `· ${roadmapContext.role}` : ''}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Recommended Goal: {roadmapContext.subject}
              </h2>
              
              <p className="text-xs text-indigo-100/90 max-w-2xl leading-relaxed">
                Domain: <strong className="text-white">{roadmapContext.category === 'Technical' ? 'Technical MCQs' : 'Aptitude & Reasoning'}</strong> · Focus Topics: <strong className="text-white">{roadmapContext.topics ? roadmapContext.topics.join(', ') : roadmapContext.topic}</strong> · Difficulty: <strong className="text-amber-200">{roadmapContext.difficulty}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {onClearRoadmapContext && (
                <button
                  type="button"
                  onClick={onClearRoadmapContext}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white transition-colors cursor-pointer"
                  title="Dismiss recommendation context"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleStart}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Start Roadmap Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & Quick Metrics */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-slate-100 to-white dark:from-indigo-950/80 dark:via-slate-900 dark:to-slate-950 border border-indigo-500/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[350px] h-[250px] bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                <span>Placement Preparation Engine</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                MCQ & Aptitude Arena
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Placement Practice
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              Master quantitative aptitude, logical reasoning, verbal ability, and core computer science technical MCQs with AI-curated placement-grade questions and step-by-step solutions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onViewHistory}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Past Tests & Analysis ({stats.totalTests})</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Solved</span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {stats.totalQuestionsSolved} <span className="text-xs font-normal text-slate-400">MCQs</span>
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Overall Accuracy</span>
            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.overallAccuracy}%
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Aptitude Correct</span>
            <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {stats.aptitudeSolved} <span className="text-xs font-normal text-slate-400">({stats.aptitudeAccuracy}%)</span>
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Technical MCQs</span>
            <p className="text-lg font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
              {stats.technicalSolved} <span className="text-xs font-normal text-slate-400">({stats.technicalAccuracy}%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
        
        {/* 1. Category Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>1. Choose Domain</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleCategoryChange('Aptitude')}
              className={`p-5 rounded-2xl border-2 transition-all text-left flex items-start gap-4 cursor-pointer relative overflow-hidden ${
                category === 'Aptitude'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className={`p-3 rounded-xl ${category === 'Aptitude' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                <Brain className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Aptitude & Reasoning</h3>
                  {category === 'Aptitude' && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Data Interpretation.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange('Technical')}
              className={`p-5 rounded-2xl border-2 transition-all text-left flex items-start gap-4 cursor-pointer relative overflow-hidden ${
                category === 'Technical'
                  ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className={`p-3 rounded-xl ${category === 'Technical' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                <Code2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Technical MCQs</h3>
                  {category === 'Technical' && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  C, C++, Java, Python, DSA, DBMS, SQL, Operating Systems, Networks, OOP & SE.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Subject Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>2. Select Subject</span>
          </label>

          {category === 'Aptitude' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  'Quantitative Aptitude',
                  'Logical Reasoning',
                  'Verbal Ability',
                  'Data Interpretation',
                ] as AptitudeSubject[]
              ).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleAptitudeSubjectChange(sub)}
                  className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    aptitudeSubject === sub
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span>{sub}</span>
                  {aptitudeSubject === sub && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {TECHNICAL_SUBJECTS.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleTechnicalSubjectChange(sub)}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer truncate ${
                      !isCustomSubject && technicalSubject === sub
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {sub}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handleTechnicalSubjectChange('+ Custom Subject')}
                  className={`p-3 rounded-xl border border-dashed text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isCustomSubject
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-purple-400'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Subject</span>
                </button>
              </div>

              {isCustomSubject && (
                <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
                  <label className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                    Enter Custom Subject Name:
                  </label>
                  <input
                    type="text"
                    value={customSubjectText}
                    onChange={(e) => setCustomSubjectText(e.target.value)}
                    placeholder="e.g. Compiler Design, Microprocessors, Cloud Architecture..."
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Topic Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>3. Choose Topic</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setIsCustomTopic(!isCustomTopic);
                if (!isCustomTopic) setSelectedTopic('');
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{isCustomTopic ? 'Pick Standard Topic' : '+ Custom Topic'}</span>
            </button>
          </div>

          {isCustomTopic ? (
            <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-2">
              <label className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                Enter Custom Topic Name:
              </label>
              <input
                type="text"
                value={customTopicText}
                onChange={(e) => setCustomTopicText(e.target.value)}
                placeholder="e.g. Banker's Algorithm, Circular Queues, Bayes Theorem..."
                className="w-full px-4 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
              {currentTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedTopic === topic
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Difficulty & Question Count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Difficulty */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              4. Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { level: 'Easy', desc: 'Core fundamentals & direct single-step calculations' },
                  { level: 'Medium', desc: 'Standard placement test difficulty & 2-step analysis' },
                  { level: 'Hard', desc: 'Multi-step reasoning & tricky campus bar-raiser problems' },
                ] as const
              ).map(({ level, desc }) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                    difficulty === level
                      ? level === 'Easy'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 shadow-xs'
                        : level === 'Hard'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 shadow-xs'
                        : 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs">{level}</div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              5. Number of Questions
            </label>
            <div className="grid grid-cols-6 gap-2">
              {['5', '10', '15', '20', '25'].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCountChoice(cnt)}
                  className={`py-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                    questionCountChoice === cnt
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cnt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQuestionCountChoice('custom')}
                className={`py-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                  questionCountChoice === 'custom'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                Custom
              </button>
            </div>

            {questionCountChoice === 'custom' && (
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={customQuestionCount}
                  onChange={(e) => setCustomQuestionCount(parseInt(e.target.value, 10) || 5)}
                  className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-center"
                />
                <span className="text-xs text-slate-500">questions (1 to 30)</span>
              </div>
            )}
          </div>
        </div>

        {/* 5. Mode Selection */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>6. Practice Mode vs Timed Test</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('practice')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                mode === 'practice'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${mode === 'practice' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Practice Mode</h4>
                  {mode === 'practice' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant answer verification and step-by-step mathematical/conceptual explanations as you solve each question.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('timed')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                mode === 'timed'
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${mode === 'timed' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Timed Placement Test</h4>
                  {mode === 'timed' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Simulates real recruitment test conditions with countdown timer, silent answering, and auto-submission on timeout.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Generating <span className="font-bold text-slate-800 dark:text-slate-200">{questionCountChoice === 'custom' ? customQuestionCount : questionCountChoice}</span> {difficulty} questions on <span className="font-bold text-indigo-600 dark:text-indigo-400">{isCustomTopic ? customTopicText || 'Custom Topic' : selectedTopic}</span>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
          >
            <span>Start Practice Session</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};
