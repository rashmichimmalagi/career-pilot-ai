export type InterviewSubject =
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
  | 'Custom Subject'
  | string;

export type InterviewDifficulty = 'Easy' | 'Medium' | 'Hard';

export type InterviewQuestionCount = number;

export type InterviewLanguage =
  | 'C'
  | 'C++'
  | 'Java'
  | 'Python'
  | 'JavaScript'
  | 'TypeScript'
  | 'SQL'
  | 'Go'
  | 'Rust';

export interface TechnicalInterviewConfig {
  subject: InterviewSubject | '';
  isCustomSubject?: boolean;
  customSubjectText?: string;
  topic: string;
  isCustomTopic: boolean;
  customTopicText: string;
  difficulty: InterviewDifficulty | '';
  language: InterviewLanguage | string;
  questionCount: InterviewQuestionCount | '';
  isCustomQuestionCount?: boolean;
  customQuestionCountText?: string;
}

export interface ConfiguredInterviewSummary {
  subject: InterviewSubject;
  topic: string;
  difficulty: InterviewDifficulty;
  language: string;
  questionCount: InterviewQuestionCount;
  configuredAt: string;
}

export type InterviewQuestionType =
  | 'Conceptual'
  | 'Explain the Concept'
  | 'Problem-Solving'
  | 'Code Tracing'
  | 'Complexity Analysis'
  | 'Practical Scenario'
  | 'System Architecture';

export interface InterviewQuestion {
  id: string;
  questionNumber: number;
  totalQuestions: number;
  question: string;
  subject: InterviewSubject;
  topic: string;
  difficulty: InterviewDifficulty;
  language?: string;
  questionType: InterviewQuestionType | string;
  interviewerGreeting?: string;
  codeSnippet?: string;
  hints?: string[];
}

export type QuestionStatus = 'NOT_ANSWERED' | 'SKIPPED' | 'ANSWERED' | 'EVALUATED';

export interface AnswerEvaluation {
  score: number; // 0 to 10 scale
  correctness: string;
  strengths: string[];
  missing_points: string[];
  improvement: string;
  interview_tip: string;
  evaluatedAt?: string;
}

export interface ScoreCalculationDetails {
  answeredCount: number;
  skippedCount: number;
  totalCount: number;
  answeredScores: number[];
  averageAnsweredScore: number;
  formulaText: string;
}

export interface QuestionEvaluationResult {
  questionNumber: number;
  questionId?: string;
  questionText: string;
  codeSnippet?: string;
  status: 'ANSWERED' | 'SKIPPED';
  answerText: string;
  score: number; // 0 to 10 scale (or 0-100)
  scoreOutOf10?: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  missingPoints?: string[];
  idealApproach?: string;
  interviewTip?: string;
  evaluation?: AnswerEvaluation;
}

export interface MockInterviewReport {
  id: string;
  interview_id?: string;
  studentId: string;
  student_id?: string;
  studentEmail?: string;
  subject: InterviewSubject;
  isCustomSubject?: boolean;
  customSubjectText?: string;
  topic: string;
  custom_topic?: string;
  isCustomTopic?: boolean;
  customTopicText?: string;
  difficulty: InterviewDifficulty;
  language: string;
  questionCount: number;
  question_count?: number;
  questionsAnswered: number;
  answered_count?: number;
  questionsSkipped: number;
  skipped_count?: number;
  overallScore: number; // 0 - 100
  overall_score?: number;
  technicalKnowledgeScore: number; // 0 - 100
  technical_score?: number;
  problemSolvingScore: number; // 0 - 100
  problem_solving_score?: number;
  communicationScore: number; // 0 - 100
  communication_score?: number;
  verdict?: 'Excellent' | 'Strong Pass' | 'Pass with Recommendations' | 'Needs Practice' | 'PASS' | 'NEEDS_WORK' | string;
  strengths: string[];
  areasForImprovement: string[];
  areas_to_improve?: string[];
  aiRecommendations: string[];
  ai_recommendations?: string[];
  recommendation?: string;
  scoreCalculationDetails?: ScoreCalculationDetails;
  questions: InterviewQuestion[];
  answers: Record<number, string> | any[];
  questionEvaluations: QuestionEvaluationResult[];
  question_evaluations?: QuestionEvaluationResult[] | any[];
  completedAt: string;
  completed_at?: string;
  formattedDate: string;
}

export interface RecordedAnswer {
  questionNumber: number;
  questionId: string;
  questionText: string;
  codeSnippet?: string;
  subject: string;
  topic: string;
  difficulty: string;
  language?: string;
  questionType: string;
  answerText: string;
  submittedAt: string;
  isSkipped?: boolean;
  isEvaluated?: boolean;
  evaluation?: AnswerEvaluation;
}

export interface InterviewSession {
  config: TechnicalInterviewConfig;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: InterviewQuestion | null;
  questionsList: InterviewQuestion[];
  recordedAnswers: Record<number, RecordedAnswer>;
  questionStatuses: Record<number, QuestionStatus>;
  evaluations?: Record<number, AnswerEvaluation>;
  status: 'setup' | 'in_progress' | 'review' | 'evaluating' | 'completed';
}
