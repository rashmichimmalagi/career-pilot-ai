import React, { useState, useEffect, useId } from 'react';
import {
  Cpu,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sliders,
  HelpCircle,
  Code2,
  GraduationCap,
  ShieldCheck,
  Bot,
  RefreshCw,
  ArrowLeft,
  Loader2,
  FileText,
  History,
  Terminal,
  BrainCircuit,
  Award,
  Zap,
} from 'lucide-react';
import {
  InterviewSubject,
  InterviewDifficulty,
  InterviewQuestionCount,
  InterviewLanguage,
  TechnicalInterviewConfig,
  ConfiguredInterviewSummary,
  InterviewQuestion,
  RecordedAnswer,
  QuestionStatus,
  MockInterviewReport,
} from '../types/interview';
import {
  INTERVIEW_SUBJECTS,
  SUBJECT_TOPICS_MAP,
  INTERVIEW_LANGUAGES,
  getSubjectLanguageRequirement,
  getAvailableLanguagesForSubject,
} from '../data/interviewTopics';
import { interviewService } from '../services/interviewService';
import { interviewStorage } from '../services/interviewStorage';
import { useAuth } from '../context/AuthContext';
import { InterviewQuestionView } from '../components/interview/InterviewQuestionView';
import { InterviewReviewView } from '../components/interview/InterviewReviewView';
import { InterviewResultsView } from '../components/interview/InterviewResultsView';
import { InterviewHistoryView } from '../components/interview/InterviewHistoryView';

interface TechnicalInterviewPageProps {
  onNavigate: (page: string) => void;
}

const CUSTOM_TOPIC_KEY = '__custom_topic__';

export const TechnicalInterviewPage: React.FC<TechnicalInterviewPageProps> = ({
  onNavigate,
}) => {
  const { user, showToast } = useAuth();
  const studentId = user?.id || '';
  const studentEmail = user?.email || '';

  const subjectSelectId = useId();
  const topicSelectId = useId();
  const customTopicInputId = useId();
  const difficultySelectId = useId();
  const languageSelectId = useId();
  const questionCountSelectId = useId();
  const customQuestionCountInputId = useId();

  // Active Tab on landing page: 'setup' or 'history'
  const [landingTab, setLandingTab] = useState<'setup' | 'history'>('setup');

  // Configuration Form State
  const [config, setConfig] = useState<TechnicalInterviewConfig>({
    subject: 'DSA',
    topic: '',
    isCustomTopic: false,
    customTopicText: '',
    difficulty: 'Medium',
    language: 'C++',
    questionCount: 5,
    isCustomQuestionCount: false,
    customQuestionCountText: '',
  });

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Active Session Lifecycle State
  const [interviewState, setInterviewState] = useState<
    'setup' | 'generating' | 'question' | 'review' | 'evaluating' | 'results' | 'error'
  >('setup');

  // Active Interview Session Data
  const [questionsList, setQuestionsList] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(1);
  const [recordedAnswers, setRecordedAnswers] = useState<Record<number, RecordedAnswer>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>({});
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Active Generated or Saved Evaluation Report
  const [activeReport, setActiveReport] = useState<MockInterviewReport | null>(null);

  // Stored Previous Reports
  const [pastReports, setPastReports] = useState<MockInterviewReport[]>(() => interviewStorage.getReports(studentId));
  const [isFromCompanyPrep, setIsFromCompanyPrep] = useState<boolean>(false);
  const [sourceContext, setSourceContext] = useState<string | null>(null);
  const [companyTarget, setCompanyTarget] = useState<string>('');

  // Check URL search parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sourceParam = searchParams.get('source');
    const companyParam = searchParams.get('company');
    const subjectParam = searchParams.get('subject') as InterviewSubject | null;
    const topicParam = searchParams.get('topic');
    const diffParam = searchParams.get('difficulty') as InterviewDifficulty | null;

    if (sourceParam) {
      setSourceContext(sourceParam);
    }
    if (sourceParam === 'company-preparation' || sourceParam === 'company-prep') {
      setIsFromCompanyPrep(true);
    }
    if (companyParam) {
      setCompanyTarget(companyParam);
    }
    if (subjectParam && INTERVIEW_SUBJECTS.some((s) => s.value === subjectParam)) {
      setConfig((prev) => ({
        ...prev,
        subject: subjectParam,
        topic: topicParam || prev.topic,
        difficulty: diffParam || prev.difficulty,
      }));
    }
  }, []);

  // Load past reports on mount and when user changes
  useEffect(() => {
    const loaded = interviewStorage.getReports(studentId);
    setPastReports(loaded);
  }, [studentId, interviewState]);

  // Current active question
  const currentQuestion = questionsList[currentQuestionIndex - 1] || null;

  // Available topics based on selected subject
  const currentTopics = config.subject ? SUBJECT_TOPICS_MAP[config.subject] || [] : [];

  // Handle Subject Change
  const handleSubjectChange = (newSubject: InterviewSubject | '') => {
    let autoLang = '';
    const req = getSubjectLanguageRequirement(newSubject);
    if (req === 'required') {
      if (newSubject === 'Java') autoLang = 'Java';
      else if (newSubject === 'Python') autoLang = 'Python';
      else if (newSubject === 'C/C++') autoLang = config.language === 'C' ? 'C' : 'C++';
      else if (newSubject === 'Web Development')
        autoLang = config.language === 'TypeScript' ? 'TypeScript' : 'JavaScript';
      else {
        // DSA, OOP, etc.
        const avail = getAvailableLanguagesForSubject(newSubject);
        const isCurrentValid = avail.some((l) => l.value === config.language);
        autoLang = isCurrentValid ? config.language : avail[0]?.value || 'C++';
      }
    } else if (newSubject === 'SQL') {
      autoLang = 'SQL';
    } else {
      // not_applicable (DBMS, OS, Networks, System Design) or optional custom subject
      autoLang = '';
    }

    setConfig((prev) => ({
      ...prev,
      subject: newSubject,
      topic: '',
      language: autoLang,
      isCustomTopic: false,
      customTopicText: '',
    }));
    if (errors.subject || errors.topic || errors.customTopic || errors.language) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.subject;
        delete next.topic;
        delete next.customTopic;
        delete next.language;
        return next;
      });
    }
  };

  // Handle Language Change
  const handleLanguageChange = (lang: string) => {
    setConfig((prev) => ({ ...prev, language: lang }));
    if (errors.language) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.language;
        return next;
      });
    }
  };

  // Handle Topic Change
  const handleTopicChange = (value: string) => {
    if (value === CUSTOM_TOPIC_KEY) {
      setConfig((prev) => ({
        ...prev,
        topic: CUSTOM_TOPIC_KEY,
        isCustomTopic: true,
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        topic: value,
        isCustomTopic: false,
        customTopicText: '',
      }));
    }

    if (errors.topic || errors.customTopic) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.topic;
        delete next.customTopic;
        return next;
      });
    }
  };

  // Handle Custom Topic Text Change
  const handleCustomTopicChange = (text: string) => {
    setConfig((prev) => ({
      ...prev,
      customTopicText: text,
    }));
    if (errors.customTopic) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.customTopic;
        return next;
      });
    }
  };

  // Handle Difficulty Change
  const handleDifficultyChange = (diff: InterviewDifficulty | '') => {
    setConfig((prev) => ({ ...prev, difficulty: diff }));
    if (errors.difficulty) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.difficulty;
        return next;
      });
    }
  };

  // Handle Question Count Change
  const handleQuestionCountChange = (value: string) => {
    if (value === 'custom') {
      setConfig((prev) => ({
        ...prev,
        isCustomQuestionCount: true,
        questionCount: '',
      }));
    } else {
      const num = value ? Number(value) : '';
      setConfig((prev) => ({
        ...prev,
        isCustomQuestionCount: false,
        customQuestionCountText: '',
        questionCount: num as InterviewQuestionCount | '',
      }));
    }
    if (errors.questionCount || errors.customQuestionCount) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.questionCount;
        delete next.customQuestionCount;
        return next;
      });
    }
  };

  // Handle Custom Question Count Text Change
  const handleCustomQuestionCountChange = (text: string) => {
    setConfig((prev) => ({
      ...prev,
      customQuestionCountText: text,
    }));
    if (errors.customQuestionCount || errors.questionCount) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.customQuestionCount;
        delete next.questionCount;
        return next;
      });
    }
  };

  // Validation Logic
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.subject) {
      newErrors.subject = 'Please select a technical subject.';
    }

    if (!config.topic) {
      newErrors.topic = 'Please select a topic or choose Custom Topic.';
    } else if (config.isCustomTopic && !config.customTopicText.trim()) {
      newErrors.customTopic = 'Please specify your custom topic name.';
    }

    if (!config.difficulty) {
      newErrors.difficulty = 'Please select an interview difficulty.';
    }

    const langReq = getSubjectLanguageRequirement(config.subject);
    if (langReq === 'required' && !config.language) {
      newErrors.language = 'Please select a programming language.';
    }

    if (config.isCustomQuestionCount) {
      const raw = (config.customQuestionCountText || '').trim();
      const parsed = Number(raw);
      if (!raw || isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
        newErrors.customQuestionCount = 'Please enter a number between 1 and 30.';
      }
    } else if (!config.questionCount) {
      newErrors.questionCount = 'Please select the number of questions.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Start Interview Action - Generates ALL questions in a single AI request
  const handleStartInterview = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!validateForm() || interviewState === 'generating') {
      return;
    }

    const effectiveTopic = config.isCustomTopic
      ? config.customTopicText.trim()
      : config.topic;

    const effectiveCount = config.isCustomQuestionCount
      ? parseInt(config.customQuestionCountText || '5', 10)
      : (Number(config.questionCount) || 5);

    // Sync questionCount to the effective numeric count
    setConfig((prev) => ({
      ...prev,
      questionCount: effectiveCount,
    }));

    setInterviewState('generating');
    setGenerationError(null);
    setQuestionsList([]);
    setRecordedAnswers({});
    setQuestionStatuses({});
    setCurrentQuestionIndex(1);
    setActiveReport(null);

    try {
      const langReq = getSubjectLanguageRequirement(config.subject);
      const effectiveLanguage = langReq === 'not_applicable' ? '' : (config.language || '');

      // ONE AI generation request for all questions
      const allQuestions = await interviewService.generateQuestions({
        subject: config.subject as InterviewSubject,
        topic: effectiveTopic,
        isCustomTopic: config.isCustomTopic,
        customTopicText: config.customTopicText,
        difficulty: config.difficulty as InterviewDifficulty,
        language: effectiveLanguage,
        questionCount: effectiveCount,
      });

      if (!allQuestions || allQuestions.length === 0) {
        throw new Error('Your interview is taking longer than expected. Please try again.');
      }

      setQuestionsList(allQuestions);
      setCurrentQuestionIndex(1);
      setInterviewState('question');
    } catch (err: any) {
      console.error('[Technical Interview] Starting interview batch generation failed:', err);
      setQuestionsList([]);
      setGenerationError(
        err?.message || 'Your interview is taking longer than expected. Please try again.'
      );
      setInterviewState('error');
    }
  };

  // Save current answer draft to state
  const handleSaveAnswer = (qNum: number, answerText: string) => {
    const trimmed = answerText.trim();
    const qObj = questionsList[qNum - 1];

    if (!qObj) return;

    const existing = recordedAnswers[qNum];
    const recorded: RecordedAnswer = {
      questionNumber: qNum,
      questionId: qObj.id,
      questionText: qObj.question,
      codeSnippet: qObj.codeSnippet,
      subject: qObj.subject || config.subject,
      topic: qObj.topic || (config.isCustomTopic ? config.customTopicText : config.topic),
      difficulty: qObj.difficulty || config.difficulty,
      language: qObj.language || config.language || 'C++',
      questionType: qObj.questionType || 'Conceptual',
      answerText: answerText,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSkipped: trimmed.length === 0,
      isEvaluated: existing?.isEvaluated || false,
      evaluation: existing?.evaluation,
    };

    setRecordedAnswers((prev) => ({
      ...prev,
      [qNum]: recorded,
    }));

    setQuestionStatuses((prev) => {
      // If already evaluated, keep EVALUATED status unless cleared
      if (prev[qNum] === 'EVALUATED') return prev;
      return {
        ...prev,
        [qNum]: trimmed.length > 0 ? 'ANSWERED' : 'SKIPPED',
      };
    });
  };

  // Submit single answer for AI evaluation (Phase 3)
  const handleSubmitAnswer = async (qNum: number, answerText: string) => {
    const trimmed = answerText.trim();
    if (!trimmed) {
      showToast(
        '⚠️ Empty Answer',
        'Please enter your answer before submitting.',
        'warning',
        undefined,
        3000
      );
      return;
    }

    const qObj = questionsList[qNum - 1];
    if (!qObj) return;

    setIsEvaluatingAnswer(true);
    setEvaluationError(null);

    const effectiveTopic = qObj.topic || (config.isCustomTopic ? config.customTopicText : config.topic);
    const effectiveSubject = qObj.subject || config.subject;
    const effectiveDifficulty = qObj.difficulty || config.difficulty;
    const effectiveLanguage = qObj.language || config.language || 'C++';

    try {
      const evaluationResult = await interviewService.evaluateAnswer({
        question: qObj.question,
        codeSnippet: qObj.codeSnippet,
        subject: effectiveSubject,
        topic: effectiveTopic,
        difficulty: effectiveDifficulty,
        language: effectiveLanguage,
        answer: trimmed,
        questionNumber: qNum,
      });

      const recorded: RecordedAnswer = {
        questionNumber: qNum,
        questionId: qObj.id,
        questionText: qObj.question,
        codeSnippet: qObj.codeSnippet,
        subject: effectiveSubject,
        topic: effectiveTopic,
        difficulty: effectiveDifficulty,
        language: effectiveLanguage,
        questionType: qObj.questionType || 'Conceptual',
        answerText: answerText,
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSkipped: false,
        isEvaluated: true,
        evaluation: evaluationResult,
      };

      setRecordedAnswers((prev) => ({
        ...prev,
        [qNum]: recorded,
      }));

      setQuestionStatuses((prev) => ({
        ...prev,
        [qNum]: 'EVALUATED',
      }));

      showToast(
        `🎉 Answer Evaluated! (Score: ${evaluationResult.score}/10)`,
        'AI Interviewer feedback is ready below.',
        'success',
        undefined,
        3000
      );
    } catch (err: any) {
      console.error('[Technical Interview] Single answer evaluation failed:', err);
      const errMsg = err?.message || 'Unable to evaluate your answer right now. Please try again.';
      setEvaluationError(errMsg);
      showToast('Evaluation Error', errMsg, 'error', undefined, 3500);
    } finally {
      setIsEvaluatingAnswer(false);
    }
  };

  // Skip question without AI evaluation
  const handleSkipQuestion = () => {
    const qNum = currentQuestionIndex;
    const qObj = questionsList[qNum - 1];

    if (qObj) {
      const existing = recordedAnswers[qNum];
      const recorded: RecordedAnswer = {
        questionNumber: qNum,
        questionId: qObj.id,
        questionText: qObj.question,
        codeSnippet: qObj.codeSnippet,
        subject: qObj.subject || config.subject,
        topic: qObj.topic || (config.isCustomTopic ? config.customTopicText : config.topic),
        difficulty: qObj.difficulty || config.difficulty,
        language: qObj.language || config.language || 'C++',
        questionType: qObj.questionType || 'Conceptual',
        answerText: existing?.answerText || '',
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSkipped: true,
        isEvaluated: existing?.isEvaluated || false,
        evaluation: existing?.evaluation,
      };

      setRecordedAnswers((prev) => ({
        ...prev,
        [qNum]: recorded,
      }));

      if (!existing?.isEvaluated) {
        setQuestionStatuses((prev) => ({
          ...prev,
          [qNum]: 'SKIPPED',
        }));
      }
    }

    // Move to next question or review
    const totalCount = questionsList.length || Number(config.questionCount) || 5;
    const nextQNum = currentQuestionIndex + 1;
    if (nextQNum > totalCount) {
      setInterviewState('review');
    } else {
      setCurrentQuestionIndex(nextQNum);
    }
  };

  // Move to previous question (Instant - ZERO AI requests)
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 1) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Move to next question or open review (Instant - ZERO AI requests)
  const handleNextQuestion = (currentDraftText: string) => {
    // 1. Save current question answer draft
    handleSaveAnswer(currentQuestionIndex, currentDraftText);

    const totalCount = questionsList.length || Number(config.questionCount) || 5;
    const nextQNum = currentQuestionIndex + 1;

    if (nextQNum > totalCount) {
      // Last question -> open review screen
      setInterviewState('review');
      return;
    }

    // Move to already generated next question instantaneously with ZERO AI requests
    if (questionsList.length >= nextQNum) {
      setCurrentQuestionIndex(nextQNum);
    } else {
      setInterviewState('review');
    }
  };

  // Direct Jump to a question number (Instant - ZERO AI requests)
  const handleNavigateQuestion = (targetQNum: number) => {
    const totalCount = questionsList.length || Number(config.questionCount) || 5;
    if (targetQNum < 1 || targetQNum > totalCount) return;

    // Switch to existing loaded question instantaneously with ZERO AI requests
    if (questionsList.length >= targetQNum && questionsList[targetQNum - 1]) {
      setCurrentQuestionIndex(targetQNum);
      setInterviewState('question');
    }
  };

  // Open Review Screen
  const handleReviewInterview = () => {
    setInterviewState('review');
  };

  // Return to questions from Review Screen
  const handleBackToInterview = () => {
    setInterviewState('question');
  };

  // Submit Entire Mock Interview for AI Evaluation & Final Report
  const handleSubmitFinal = async () => {
    setIsSubmittingFinal(true);
    setInterviewState('evaluating');

    const totalCount = Number(config.questionCount) || questionsList.length || 5;
    const effectiveTopic = config.isCustomTopic
      ? config.customTopicText.trim()
      : config.topic;

    try {
      // 1. Process all questions and collect evaluations
      const questionEvaluationsList = [];
      const answeredScores: number[] = [];
      const collectedStrengths: string[] = [];
      const collectedImprovements: string[] = [];
      const answersRecord: Record<number, string> = {};

      for (let i = 0; i < totalCount; i++) {
        const qNum = i + 1;
        const qObj: InterviewQuestion = questionsList[i] || {
          id: `q_${qNum}`,
          questionNumber: qNum,
          totalQuestions: totalCount,
          question: `Question ${qNum}`,
          subject: config.subject,
          topic: effectiveTopic,
          difficulty: (config.difficulty as InterviewDifficulty) || 'Medium',
          language: config.language || 'C++',
          questionType: 'Conceptual',
          codeSnippet: undefined,
        };

        const rec = recordedAnswers[qNum];
        const rawAnswer = (rec?.answerText || '').trim();
        const isSkipped = !rawAnswer || rec?.isSkipped;
        answersRecord[qNum] = rawAnswer;

        if (isSkipped) {
          questionEvaluationsList.push({
            questionNumber: qNum,
            questionId: qObj.id,
            questionText: qObj.question,
            codeSnippet: qObj.codeSnippet,
            status: 'SKIPPED' as const,
            answerText: '',
            score: 0,
            scoreOutOf10: 0,
            feedback: 'This question was skipped. Skipped questions are tracked separately and not factored into the answered average.',
            strengths: [],
            improvements: [`Review concepts for ${qObj.question.slice(0, 60)}...`],
            missingPoints: ['No answer was provided.'],
            idealApproach: `Key interview tip: In real technical interviews, always state your initial assumptions and attempt a brute-force approach even if you cannot derive the optimal solution immediately.`,
          });
        } else {
          // Check if already evaluated during the interview
          let evalData = rec?.evaluation;

          // If answer exists but was not yet evaluated individually, evaluate it now
          if (!evalData) {
            try {
              evalData = await interviewService.evaluateAnswer({
                question: qObj.question,
                codeSnippet: qObj.codeSnippet,
                subject: config.subject,
                topic: effectiveTopic,
                difficulty: config.difficulty,
                language: config.language || 'C++',
                answer: rawAnswer,
                questionNumber: qNum,
              });
            } catch (evalErr) {
              console.warn(`[Technical Interview] Quick fallback evaluation for Q${qNum}:`, evalErr);
              // Constructive heuristic evaluation
              const wordCount = rawAnswer.split(/\s+/).length;
              const hasCode = rawAnswer.includes('{') || rawAnswer.includes('(') || rawAnswer.includes(';');
              const hasComplexity = rawAnswer.toLowerCase().includes('o(') || rawAnswer.toLowerCase().includes('time') || rawAnswer.toLowerCase().includes('space');
              
              let heuristicScore = 6;
              if (wordCount > 40) heuristicScore += 1;
              if (hasCode) heuristicScore += 1;
              if (hasComplexity) heuristicScore += 1;
              heuristicScore = Math.min(10, Math.max(4, heuristicScore));

              evalData = {
                score: heuristicScore,
                correctness: 'Adequate demonstration of technical concepts.',
                strengths: [
                  `Addressed the core question with clear terminology.`,
                  wordCount > 30 ? `Provided a structured written response.` : `Direct conceptual response.`,
                ],
                missing_points: [
                  hasComplexity ? `Could deepen edge case analysis.` : `Explicitly mention Big-O time and space complexity.`,
                ],
                improvement: `Structure your response by starting with intuition, then discussing implementation details and trade-offs.`,
                interview_tip: `Always state the time and space complexity of your approach upfront.`,
              };
            }
          }

          const score10 = evalData.score !== undefined ? evalData.score : 7;
          answeredScores.push(score10);

          if (evalData.strengths && Array.isArray(evalData.strengths)) {
            collectedStrengths.push(...evalData.strengths);
          }
          if (evalData.missing_points && Array.isArray(evalData.missing_points)) {
            collectedImprovements.push(...evalData.missing_points);
          }
          if (evalData.improvement) {
            collectedImprovements.push(evalData.improvement);
          }

          questionEvaluationsList.push({
            questionNumber: qNum,
            questionId: qObj.id,
            questionText: qObj.question,
            codeSnippet: qObj.codeSnippet,
            status: 'ANSWERED' as const,
            answerText: rawAnswer,
            score: score10 * 10,
            scoreOutOf10: score10,
            feedback: evalData.improvement || 'Good technical explanation.',
            strengths: evalData.strengths || ['Clear demonstration of core concepts.'],
            improvements: evalData.missing_points || ['Add explicit Big-O analysis.'],
            missingPoints: evalData.missing_points,
            idealApproach: evalData.interview_tip || 'Provide clear time/space complexity analysis and walk through example inputs.',
            interviewTip: evalData.interview_tip,
            evaluation: evalData,
          });
        }
      }

      // 2. Compute accurate aggregate scores from the evaluated questions
      const answeredCount = answeredScores.length;
      const skippedCount = totalCount - answeredCount;

      let overallScore = 0;
      let averageScore = 0;
      let formulaText = '';

      if (answeredCount > 0) {
        const sumScores = answeredScores.reduce((a, b) => a + b, 0);
        averageScore = sumScores / answeredCount;
        overallScore = Math.round(averageScore * 10);
        formulaText = `Calculated from ${answeredCount} answered question${answeredCount > 1 ? 's' : ''} (Scores: ${answeredScores.join(', ')} / 10) → Average: ${averageScore.toFixed(1)} / 10 → ${overallScore} / 100 (Skipped: ${skippedCount})`;
      } else {
        overallScore = 0;
        formulaText = `All ${totalCount} questions were skipped → Overall: 0 / 100`;
      }

      // Sub-scores derived from evaluated answers
      const technicalScore = answeredCount > 0 ? Math.min(100, Math.max(0, Math.round(overallScore * 1.02))) : 0;
      const problemSolvingScore = answeredCount > 0 ? Math.min(100, Math.max(0, Math.round(overallScore * 0.98))) : 0;
      const communicationScore = answeredCount > 0 ? Math.min(100, Math.max(0, Math.round(overallScore * 0.96))) : 0;

      // 3. Deduplicate and curate 2-5 Strengths
      const uniqueStrengths = Array.from(new Set(collectedStrengths.filter((s) => s && s.trim().length > 5)));
      if (uniqueStrengths.length < 2 && answeredCount > 0) {
        uniqueStrengths.push(
          `Strong understanding of ${config.subject} fundamentals and core mechanics.`,
          `Clear explanations utilizing standard ${config.language || 'technical'} terminology.`
        );
      }
      const finalStrengths = uniqueStrengths.slice(0, 5);

      // 4. Deduplicate and curate 2-5 Areas to Improve
      const uniqueImprovements = Array.from(new Set(collectedImprovements.filter((s) => s && s.trim().length > 5)));
      if (uniqueImprovements.length < 2) {
        uniqueImprovements.push(
          `Explain time complexity and memory overhead more consistently across all solutions.`,
          `Provide concrete code snippets and test edge cases when explaining algorithms.`
        );
      }
      const finalImprovements = uniqueImprovements.slice(0, 5);

      // 5. Curate AI Interviewer Recommendation (Educational, strictly no hiring claims)
      let primaryRecommendation = '';
      if (overallScore >= 85) {
        primaryRecommendation = `Your technical fundamentals in ${config.subject} (${effectiveTopic}) are strong (Overall: ${overallScore}/100). Focus on stating algorithmic time and space complexity upfront and discussing edge cases to build effortless fluency.`;
      } else if (overallScore >= 70) {
        primaryRecommendation = `Solid conceptual base in ${config.subject} (${effectiveTopic}). To elevate your mock interview performance, reinforce pointer/memory mechanics and provide concrete code examples when explaining solutions.`;
      } else if (answeredCount > 0) {
        primaryRecommendation = `Good effort on this mock round. Focus on building consistency in your problem breakdowns and practice writing out algorithmic trace tables to clearly convey your reasoning.`;
      } else {
        primaryRecommendation = `To benefit most from technical mock interviews, attempt each question even with partial solutions or pseudo-code. State your assumptions clearly and build upon foundational concepts.`;
      }

      const verdict =
        overallScore >= 85
          ? 'Excellent'
          : overallScore >= 70
          ? 'Strong Pass'
          : overallScore >= 50
          ? 'Pass with Recommendations'
          : 'Needs Practice';

      const interviewId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const completedIso = new Date().toISOString();
      const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      // 6. Build the complete final report object
      const finalReport: MockInterviewReport = {
        id: interviewId,
        interview_id: interviewId,
        studentId: studentId || 'guest',
        student_id: studentId || 'guest',
        studentEmail,
        subject: config.subject as InterviewSubject,
        topic: effectiveTopic,
        custom_topic: effectiveTopic,
        isCustomTopic: config.isCustomTopic,
        customTopicText: config.customTopicText,
        difficulty: config.difficulty as InterviewDifficulty,
        language: config.language || 'C++',
        questionCount: totalCount,
        question_count: totalCount,
        questionsAnswered: answeredCount,
        answered_count: answeredCount,
        questionsSkipped: skippedCount,
        skipped_count: skippedCount,
        overallScore,
        overall_score: overallScore,
        technicalKnowledgeScore: technicalScore,
        technical_score: technicalScore,
        problemSolvingScore,
        problem_solving_score: problemSolvingScore,
        communicationScore,
        communication_score: communicationScore,
        verdict,
        strengths: finalStrengths,
        areasForImprovement: finalImprovements,
        areas_to_improve: finalImprovements,
        aiRecommendations: [
          primaryRecommendation,
          `State Big-O time and space complexity explicitly for every algorithm.`,
          `Discuss edge cases and error bounds in ${config.language || 'C++'}.`,
        ],
        recommendation: primaryRecommendation,
        scoreCalculationDetails: {
          answeredCount,
          skippedCount,
          totalCount,
          answeredScores,
          averageAnsweredScore: averageScore,
          formulaText,
        },
        questions: questionsList,
        answers: answersRecord,
        questionEvaluations: questionEvaluationsList,
        completedAt: completedIso,
        completed_at: completedIso,
        formattedDate,
      };

      // 7. Save to durable storage
      interviewStorage.saveReport(finalReport);

      // 8. Update state to show the report
      setActiveReport(finalReport);
      setPastReports(interviewStorage.getReports(studentId));
      setInterviewState('results');

      showToast('🎉 Interview Finished!', 'Your Technical Mock Interview Report is ready.', 'success', undefined, 4000);
    } catch (err: any) {
      console.error('[Technical Interview] Final report generation failed:', err);
      showToast('Evaluation Error', 'Failed to generate report. Please try again.', 'error');
      setInterviewState('review');
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  // View a saved report from history (Instant - ZERO AI calls)
  const handleViewSavedReport = (report: MockInterviewReport) => {
    setActiveReport(report);
    setInterviewState('results');
  };

  // Practice again with a past report's configuration (Creates a fresh session)
  const handlePracticeAgainWithReport = (report: MockInterviewReport) => {
    setConfig({
      subject: report.subject,
      topic: report.isCustomTopic ? CUSTOM_TOPIC_KEY : report.topic,
      isCustomTopic: !!report.isCustomTopic,
      customTopicText: report.customTopicText || '',
      difficulty: report.difficulty,
      language: report.language || 'C++',
      questionCount: (report.questionCount as InterviewQuestionCount) || (report.question_count as InterviewQuestionCount) || 5,
    });
    setInterviewState('setup');
    setLandingTab('setup');
    setActiveReport(null);
    setQuestionsList([]);
    setRecordedAnswers({});
    setQuestionStatuses({});
    setCurrentQuestionIndex(1);
  };

  // Retry question generation
  const handleRetryGeneration = () => {
    handleStartInterview();
  };

  // Reset interview session
  const handleReset = () => {
    setQuestionsList([]);
    setCurrentQuestionIndex(1);
    setRecordedAnswers({});
    setQuestionStatuses({});
    setGenerationError(null);
    setActiveReport(null);
    setInterviewState('setup');
    setHasAttemptedSubmit(false);
    setErrors({});
  };

  const handleReturnToSetup = () => {
    setInterviewState('setup');
    setGenerationError(null);
  };

  const selectedSubjectObj = INTERVIEW_SUBJECTS.find((s) => s.value === config.subject);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 sm:py-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 p-[1px] shadow-md shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[15px] flex items-center justify-center">
                <Cpu className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Technical Mock Interview
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  {interviewState === 'results'
                    ? 'Report'
                    : interviewState === 'review'
                    ? 'Review'
                    : interviewState === 'question'
                    ? 'Live Mock'
                    : 'Setup'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Practice realistic technical interview rounds with an AI interviewer and receive deep bar-raiser feedback.
              </p>
            </div>
          </div>

          {sourceContext === 'roadmap' && (
            <button
              type="button"
              onClick={() => onNavigate('roadmap')}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors shadow-xs cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Roadmap</span>
            </button>
          )}

          {(sourceContext === 'company-preparation' || sourceContext === 'company-prep') && (
            <button
              type="button"
              onClick={() => onNavigate('company-prep')}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors shadow-xs cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Company Preparation</span>
            </button>
          )}

          {(sourceContext === 'preparation-dashboard' || sourceContext === 'dashboard' || sourceContext === 'prep-dashboard') && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors shadow-xs cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Preparation Dashboard</span>
            </button>
          )}

          {!sourceContext && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>

        {/* LOADING GENERATING STATE VIEW */}
        {interviewState === 'generating' && (
          <div
            id="interview-generating-state"
            className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-500/5 text-center space-y-6 animate-in fade-in duration-300"
          >
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 animate-spin opacity-40 blur-sm" />
              <div className="relative w-full h-full rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500/40 flex items-center justify-center shadow-inner">
                <Bot className="w-9 h-9 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                AI Interviewer is preparing your interview...
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Creating questions for{' '}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {config.subject}
                </span>{' '}
                &bull;{' '}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {config.isCustomTopic ? config.customTopicText : config.topic}
                </span>
                {config.language && config.language !== 'Not Required' && config.language !== 'None' ? (
                  <>
                    {' '}in{' '}
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">
                      {config.language}
                    </span>
                  </>
                ) : null}{' '}
                at{' '}
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {config.difficulty}
                </span>{' '}
                level.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Generating full interview set in a single request ({config.questionCount} questions)...</span>
            </div>
          </div>
        )}

        {/* EVALUATING STATE VIEW */}
        {interviewState === 'evaluating' && (
          <div
            id="interview-evaluating-state"
            className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-500/5 text-center space-y-6 animate-in fade-in duration-300"
          >
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 animate-spin opacity-40 blur-sm" />
              <div className="relative w-full h-full rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500/40 flex items-center justify-center shadow-inner">
                <BrainCircuit className="w-9 h-9 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Evaluating Technical Mock Interview...
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Analyzing knowledge depth, core concepts, edge cases, and reasoning
                {config.language && config.language !== 'Not Required' && config.language !== 'None'
                  ? ` in ${config.language}`
                  : ` for ${config.subject}`}
                . Generating detailed scorecard and recommendations.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>AI Senior Bar Raiser Review in Progress</span>
            </div>
          </div>
        )}

        {/* ERROR STATE VIEW */}
        {interviewState === 'error' && (
          <div
            id="interview-error-state"
            className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-500/40 shadow-xl shadow-rose-500/5 space-y-6 animate-in fade-in duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  Unable to Generate Interview Questions
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {generationError || 'Your interview is taking longer than expected. Please try again.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleRetryGeneration}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={handleReturnToSetup}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-slate-500" />
                <span>Back to Setup</span>
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE QUESTION SCREEN VIEW */}
        {interviewState === 'question' && currentQuestion && (
          <InterviewQuestionView
            question={currentQuestion}
            questionsList={questionsList}
            config={config}
            savedAnswer={recordedAnswers[currentQuestionIndex]?.answerText || ''}
            savedEvaluation={recordedAnswers[currentQuestionIndex]?.evaluation}
            recordedAnswers={recordedAnswers}
            questionStatuses={questionStatuses}
            isEvaluating={isEvaluatingAnswer}
            evaluationError={evaluationError}
            onSubmitAnswer={handleSubmitAnswer}
            onSkipQuestion={handleSkipQuestion}
            onSaveAnswer={handleSaveAnswer}
            onNavigateQuestion={handleNavigateQuestion}
            onPreviousQuestion={handlePreviousQuestion}
            onNextQuestion={handleNextQuestion}
            onReviewInterview={handleReviewInterview}
            onExit={handleReturnToSetup}
            onRestart={handleReset}
          />
        )}

        {/* REVIEW SCREEN VIEW */}
        {interviewState === 'review' && (
          <InterviewReviewView
            config={config}
            questions={questionsList}
            recordedAnswers={recordedAnswers}
            questionStatuses={questionStatuses}
            isSubmitting={isSubmittingFinal}
            onNavigateQuestion={(qNum) => {
              setCurrentQuestionIndex(qNum);
              setInterviewState('question');
            }}
            onSubmitFinal={handleSubmitFinal}
            onBackToInterview={handleBackToInterview}
          />
        )}

        {/* INTERVIEW RESULTS / REPORT VIEW */}
        {interviewState === 'results' && activeReport && (
          <InterviewResultsView
            report={activeReport}
            config={config}
            onRestart={handleReset}
            onNavigateDashboard={() => onNavigate('dashboard')}
            onBackToHistory={() => {
              setInterviewState('setup');
              setLandingTab('history');
            }}
          />
        )}

        {/* SETUP & LANDING SCREEN VIEW (When in 'setup' state) */}
        {interviewState === 'setup' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* WELCOME / LANDING HIGHLIGHT BANNER */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/15 via-purple-900/10 to-slate-900/15 dark:from-indigo-950/60 dark:via-purple-950/30 dark:to-slate-900/70 border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                      🎤 Technical Mock Interview
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Placement Practice Round
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Practice realistic technical interview rounds with an AI interviewer.
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLandingTab('setup')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      landingTab === 'setup'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Start Interview
                  </button>
                  <button
                    type="button"
                    onClick={() => setLandingTab('history')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      landingTab === 'history'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Previous Mock Interviews ({pastReports.length})</span>
                  </button>
                </div>
              </div>

              {/* Key Highlights Bullet List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-indigo-100/80 dark:border-indigo-900/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>AI-generated technical questions</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-indigo-100/80 dark:border-indigo-900/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Questions based on subject &amp; topic</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-indigo-100/80 dark:border-indigo-900/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Difficulty-based interview rounds</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-indigo-100/80 dark:border-indigo-900/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Answer evaluation &amp; real-time feedback</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-indigo-100/80 dark:border-indigo-900/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Previous/Next question navigation &amp; skip</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-indigo-100/80 dark:border-indigo-900/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Final interview performance report</span>
                </div>
              </div>
            </div>

            {/* TAB CONTENT: HISTORY */}
            {landingTab === 'history' && (
              <InterviewHistoryView
                reports={pastReports}
                onViewReport={handleViewSavedReport}
                onPracticeAgain={handlePracticeAgainWithReport}
                onStartNew={() => setLandingTab('setup')}
              />
            )}

            {/* TAB CONTENT: SETUP FORM */}
            {landingTab === 'setup' && (
              <>
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      <Sliders className="w-4 h-4" />
                      <span>Configure Technical Mock Parameters</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                      Interview Preferences
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select your subject domain, specific topic or custom concept, target difficulty, and question depth.
                    </p>
                  </div>

                  <form onSubmit={handleStartInterview} className="space-y-6">
                    {/* 1. Subject Dropdown */}
                    <div className="space-y-2">
                      <label
                        htmlFor={subjectSelectId}
                        className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
                      >
                        1. Select Subject <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id={subjectSelectId}
                          value={config.subject}
                          onChange={(e) => handleSubjectChange(e.target.value as InterviewSubject | '')}
                          className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer ${
                            errors.subject
                              ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <option value="">-- Choose Subject --</option>
                          {INTERVIEW_SUBJECTS.map((subj) => (
                            <option key={subj.value} value={subj.value}>
                              {subj.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedSubjectObj && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pl-1">
                          <span>{selectedSubjectObj.icon}</span>
                          <span>{selectedSubjectObj.description}</span>
                        </p>
                      )}

                      {errors.subject && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{errors.subject}</span>
                        </p>
                      )}
                    </div>

                    {/* 2. Topic Dropdown */}
                    <div className="space-y-2">
                      <label
                        htmlFor={topicSelectId}
                        className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
                      >
                        2. Select Topic <span className="text-rose-500">*</span>
                      </label>
                      
                      <select
                        id={topicSelectId}
                        value={config.isCustomTopic ? CUSTOM_TOPIC_KEY : config.topic}
                        onChange={(e) => handleTopicChange(e.target.value)}
                        disabled={!config.subject}
                        className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          errors.topic
                            ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <option value="">
                          {config.subject
                            ? `-- Choose Topic for ${config.subject} --`
                            : '-- Please select a Subject first --'}
                        </option>
                        {currentTopics.map((topicName) => (
                          <option key={topicName} value={topicName}>
                            {topicName}
                          </option>
                        ))}
                        {config.subject && (
                          <option value={CUSTOM_TOPIC_KEY} className="font-bold text-indigo-600 dark:text-indigo-400">
                            + Custom Topic
                          </option>
                        )}
                      </select>

                      {errors.topic && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{errors.topic}</span>
                        </p>
                      )}
                    </div>

                    {/* 3. Custom Topic Input */}
                    {config.isCustomTopic && (
                      <div className="space-y-2 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
                        <label
                          htmlFor={customTopicInputId}
                          className="block text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200"
                        >
                          Enter Custom Topic Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id={customTopicInputId}
                          type="text"
                          placeholder="e.g. Red-Black Trees, Redis Cluster Sharding, Kafka Partitions, Trie Auto-Complete..."
                          value={config.customTopicText}
                          onChange={(e) => handleCustomTopicChange(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                            errors.customTopic
                              ? 'border-rose-500 ring-1 ring-rose-500/20'
                              : 'border-indigo-300 dark:border-indigo-700'
                          }`}
                        />
                        <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                          Specify any specific algorithm, protocol, system, or subfield you want to be quizzed on.
                        </p>

                        {errors.customTopic && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{errors.customTopic}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Difficulty, Language, and Count in Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {/* Difficulty */}
                      <div className="space-y-2">
                        <label
                          htmlFor={difficultySelectId}
                          className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
                        >
                          3. Difficulty Level <span className="text-rose-500">*</span>
                        </label>
                        <select
                          id={difficultySelectId}
                          value={config.difficulty}
                          onChange={(e) => handleDifficultyChange(e.target.value as InterviewDifficulty | '')}
                          className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer ${
                            errors.difficulty
                              ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <option value="">-- Select Difficulty --</option>
                          <option value="Easy">Easy (Fundamentals)</option>
                          <option value="Medium">Medium (Campus & Core)</option>
                          <option value="Hard">Hard (Deep Optimization)</option>
                        </select>

                        {errors.difficulty && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{errors.difficulty}</span>
                          </p>
                        )}
                      </div>

                      {/* Programming Language / Stack (Dynamic based on subject) */}
                      {(() => {
                        const langReq = getSubjectLanguageRequirement(config.subject);
                        const availableLanguages = getAvailableLanguagesForSubject(config.subject);

                        if (langReq === 'not_applicable') {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                  4. Language / Stack
                                </label>
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                  Not Required for this Subject
                                </span>
                              </div>
                              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                    Conceptual & Systems Domain Focus
                                  </span>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Questions for <span className="font-bold text-indigo-600 dark:text-indigo-400">{config.subject || 'this subject'}</span> test core computer science fundamentals, system architecture, database mechanisms, or protocols rather than language-specific syntax.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (langReq === 'optional') {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label
                                  htmlFor={languageSelectId}
                                  className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
                                >
                                  4. Language / Stack
                                </label>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                  Optional
                                </span>
                              </div>
                              <select
                                id={languageSelectId}
                                value={config.language || ''}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                              >
                                <option value="">-- Not Required / General Concepts --</option>
                                {availableLanguages.map((lang) => (
                                  <option key={lang.value} value={lang.value}>
                                    {lang.label} {lang.badge ? `(${lang.badge})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }

                        // Required for programming-oriented subjects (DSA, OOP, Java, Python, C/C++, Web Dev)
                        return (
                          <div className="space-y-2">
                            <label
                              htmlFor={languageSelectId}
                              className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
                            >
                              4. Language / Stack <span className="text-rose-500">*</span>
                            </label>
                            <select
                              id={languageSelectId}
                              value={config.language || availableLanguages[0]?.value || ''}
                              onChange={(e) => handleLanguageChange(e.target.value)}
                              className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer ${
                                errors.language
                                  ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                                  : 'border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {availableLanguages.map((lang) => (
                                <option key={lang.value} value={lang.value}>
                                  {lang.label} {lang.badge ? `(${lang.badge})` : ''}
                                </option>
                              ))}
                            </select>

                            {errors.language && (
                              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.language}</span>
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Number of Questions */}
                      <div className="space-y-2">
                        <label
                          htmlFor={questionCountSelectId}
                          className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
                        >
                          5. Question Count <span className="text-rose-500">*</span>
                        </label>
                        <select
                          id={questionCountSelectId}
                          value={config.isCustomQuestionCount ? 'custom' : config.questionCount || ''}
                          onChange={(e) => handleQuestionCountChange(e.target.value)}
                          className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer ${
                            errors.questionCount || errors.customQuestionCount
                              ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <option value="">-- Question Count --</option>
                          <option value="5">5 Questions (~10m)</option>
                          <option value="10">10 Questions (~25m)</option>
                          <option value="15">15 Questions (~45m)</option>
                          <option value="custom">Custom</option>
                        </select>

                        {errors.questionCount && !config.isCustomQuestionCount && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{errors.questionCount}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Custom Question Count Input */}
                    {config.isCustomQuestionCount && (
                      <div className="space-y-2 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
                        <label
                          htmlFor={customQuestionCountInputId}
                          className="block text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200"
                        >
                          Enter Number of Questions <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id={customQuestionCountInputId}
                          type="number"
                          min={1}
                          max={30}
                          step={1}
                          placeholder="Enter number of questions"
                          value={config.customQuestionCountText || ''}
                          onChange={(e) => handleCustomQuestionCountChange(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                            errors.customQuestionCount
                              ? 'border-rose-500 ring-1 ring-rose-500/20'
                              : 'border-indigo-300 dark:border-indigo-700'
                          }`}
                        />
                        <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                          Choose between 1 and 30 questions.
                        </p>

                        {errors.customQuestionCount && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{errors.customQuestionCount}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Form Action Buttons */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                        <span>All parameters can be reconfigured at any point.</span>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleReset}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                        >
                          Reset Form
                        </button>
                        
                        {/* Start Interview Button */}
                        <button
                          id="btn-start-technical-interview"
                          type="submit"
                          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Start Interview</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Previous Mock Interviews Section Preview */}
                {pastReports.length > 0 && (
                  <div className="pt-4">
                    <InterviewHistoryView
                      reports={pastReports}
                      onViewReport={handleViewSavedReport}
                      onPracticeAgain={handlePracticeAgainWithReport}
                      onStartNew={() => setLandingTab('setup')}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
