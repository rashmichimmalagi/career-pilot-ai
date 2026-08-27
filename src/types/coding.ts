export type PredefinedCodingSubject =
  | 'DSA'
  | 'DBMS'
  | 'SQL'
  | 'Operating Systems'
  | 'Computer Networks'
  | 'OOP'
  | 'Java'
  | 'Python'
  | 'C/C++'
  | 'Web Development'
  | 'System Design'
  | 'JavaScript';

export type CodingSubject = PredefinedCodingSubject | '+ Custom Subject' | string;

export type CodingDifficulty = 'Easy' | 'Medium' | 'Hard';

export type CodingLanguage = 'C' | 'C++' | 'Java' | 'Python' | 'JavaScript' | 'SQL';

export interface CodingExample {
  input: string;
  output: string;
  explanation?: string;
}

export type TestCaseCategory =
  | 'normal'
  | 'edge'
  | 'min'
  | 'max'
  | 'duplicate'
  | 'negative'
  | 'empty_single';

export interface CodingTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  category?: TestCaseCategory;
  isHidden?: boolean;
}

export interface ExpectedComplexity {
  time: string;
  space: string;
}

export interface ProblemEditorial {
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  keyInsights?: string[];
  codeSamples?: Partial<Record<CodingLanguage, string>>;
}

export interface CodingProblem {
  id: string;
  user_id?: string;
  title: string;
  difficulty: CodingDifficulty;
  subject: CodingSubject;
  topic: string;
  tags: string[];
  description: string;
  problem_statement?: string; // alias for description
  input_format?: string;
  output_format?: string;
  constraints: string[];
  examples: CodingExample[];
  expectedComplexity: ExpectedComplexity;
  functionSignature: Partial<Record<CodingLanguage, string>>;
  starterCode: Partial<Record<CodingLanguage, string>>;
  starter_templates?: Partial<Record<CodingLanguage, string>>; // alias for starterCode
  hiddenTestCases: CodingTestCase[];
  test_cases?: CodingTestCase[]; // alias for hiddenTestCases
  hints?: string[];
  editorial?: ProblemEditorial;
  explanation?: string;
  created_at?: string;
}

export type SubmissionStatus =
  | 'pending'
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'runtime_error'
  | 'compilation_error';

export interface TestCaseResult {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed: boolean;
  isHidden?: boolean;
  category?: TestCaseCategory;
  executionTimeMs?: number;
  errorMessage?: string;
}

export interface AIEvaluationFeedback {
  correctness: string;
  timeComplexity: string;
  spaceComplexity: string;
  optimalApproach: string;
  suggestions: string[];
  summary: string;
  complexity?: string;
  bestPractices?: string[];
}

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'failed';
export type AIEvaluationStatus = 'not_started' | 'evaluating' | 'completed' | 'error';

export interface SubmissionEvaluationResult {
  executionId?: string;
  status: SubmissionStatus;
  statusText: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  passedTestCases: number;
  totalTestCases: number;
  runtimeMs: number;
  memoryKb: number;
  stdout?: string;
  testCaseResults: TestCaseResult[];
  aiFeedback: AIEvaluationFeedback;
  editorial?: ProblemEditorial;
}

export interface CodingSubmission {
  id: string;
  user_id: string;
  problem_id: string;
  problem_title?: string;
  subject?: CodingSubject;
  topic?: string;
  difficulty?: CodingDifficulty;
  language: CodingLanguage;
  code: string;
  submitted_code?: string;
  status: SubmissionStatus;
  status_text?: string;
  result?: string;
  score?: number;
  pass_rate?: number;
  test_cases_passed?: number;
  test_cases_failed?: number;
  total_test_cases?: number;
  runtime_ms?: number;
  execution_time?: number;
  memory_kb?: number;
  memory_used?: number;
  time_complexity?: string;
  space_complexity?: string;
  ai_feedback?: AIEvaluationFeedback;
  problem_data?: CodingProblem;
  cloudSynced?: boolean;
  cloudSyncError?: string;
  created_at?: string;
}

export interface CodingProgress {
  id: string;
  user_id: string;
  problems_attempted: number;
  problems_solved: number;
  success_rate?: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  subject_breakdown: Record<string, number>;
  streak_days: number;
  current_streak?: number;
  last_practiced_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface PracticeConfig {
  subject: CodingSubject;
  topic: string;
  difficulty: CodingDifficulty;
  language: CodingLanguage;
  userId?: string;
  targetCompany?: string;
  targetRole?: string;
}

export interface ComplexityAnalysis {
  currentTime: string;
  currentSpace: string;
  expectedTime?: string;
  expectedSpace?: string;
  isAppropriate: boolean;
  explanation: string;
}

export interface CodeReviewData {
  codeQuality: string;
  readabilityNotes: string;
  optimizationSuggestions: string[];
  interviewTips: string[];
}

export interface AICodingMentorFeedback {
  executionId?: string;
  status: SubmissionStatus | 'empty_code';
  statusText?: string;
  whatWentWrong?: string;
  whyItHappened?: string;
  currentHint: string;
  hintLevel: number;
  maxHintLevel: number;
  hasMoreHints: boolean;
  whatToReconsider?: string;
  complexity?: ComplexityAnalysis;
  edgeCases?: string[];
  nextStep?: string;
  codeReview?: CodeReviewData;
  isEmptyCode?: boolean;
  emptyCodeMessage?: string;
}

export interface MentorRequestParams {
  executionId?: string;
  problem: CodingProblem;
  language: CodingLanguage;
  code: string;
  executionResult?: {
    status?: SubmissionStatus;
    statusText?: string;
    stdout?: string;
    compilerError?: string;
    runtimeError?: string;
    error?: string;
    testCaseResults?: TestCaseResult[];
    passedTestCases?: number;
    totalTestCases?: number;
  } | null;
  hintLevel?: number;
  reviewMode?: boolean;
  userId?: string;
}

export type AchievementCategory = 'streak' | 'problem_solving' | 'difficulty' | 'placement';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  progressLabel: string;
  unlockedAt?: string;
  unlockMessage?: string;
}

export interface UserAchievementsSummary {
  unlockedCount: number;
  totalCount: number;
  achievements: Achievement[];
  currentStreak: number;
  longestStreak: number;
  latestUnlocked: Achievement | null;
  currentStreakMilestone: Achievement | null;
  nextStreakMilestone: Achievement | null;
  nextMilestone: Achievement | null;
  streakMotivationalMessage: string;
}

// Question Series & Discovery Types
export type QuestionStatus = 'not_attempted' | 'in_progress' | 'solved';

export interface QuestionSeriesItem {
  id: string;
  title: string;
  topic: string;
  subject: CodingSubject;
  difficulty: CodingDifficulty;
  status: QuestionStatus;
  isSaved: boolean;
  problem: CodingProblem;
  attemptsCount?: number;
  lastAttemptedAt?: string;
  acceptedAt?: string;
}

export interface SavedQuestion {
  id: string;
  user_id: string;
  question_id: string;
  title: string;
  subject: CodingSubject;
  topic: string;
  difficulty: CodingDifficulty;
  status?: QuestionStatus;
  question_data: CodingProblem;
  created_at: string;
}

export interface TopicProgressSummary {
  subject: CodingSubject;
  topic: string;
  totalQuestions: number;
  solvedQuestions: number;
  percentage: number;
  easy: { solved: number; total: number };
  medium: { solved: number; total: number };
  hard: { solved: number; total: number };
}


