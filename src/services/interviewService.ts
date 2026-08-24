import {
  InterviewQuestion,
  InterviewSubject,
  InterviewDifficulty,
  InterviewQuestionCount,
  MockInterviewReport,
  AnswerEvaluation,
} from '../types/interview';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export interface GenerateQuestionParams {
  subject: InterviewSubject;
  isCustomSubject?: boolean;
  customSubjectText?: string;
  topic: string;
  isCustomTopic?: boolean;
  customTopicText?: string;
  difficulty: InterviewDifficulty;
  language?: string;
  questionCount: InterviewQuestionCount;
  questionNumber?: number;
}

export interface GenerateQuestionsParams {
  subject: InterviewSubject;
  isCustomSubject?: boolean;
  customSubjectText?: string;
  topic: string;
  isCustomTopic?: boolean;
  customTopicText?: string;
  difficulty: InterviewDifficulty;
  language?: string;
  questionCount: number;
}

export interface GenerateQuestionApiResponse {
  success: boolean;
  data?: InterviewQuestion;
  questions?: InterviewQuestion[];
  error?: string;
  message?: string;
}

export interface GenerateQuestionsApiResponse {
  success: boolean;
  data?: {
    questions: InterviewQuestion[];
  } | InterviewQuestion[];
  questions?: InterviewQuestion[];
  error?: string;
  message?: string;
}

export interface EvaluateAnswerParams {
  question: string;
  codeSnippet?: string;
  subject: string;
  topic: string;
  difficulty: string;
  language: string;
  answer: string;
  questionNumber?: number;
}

export interface EvaluateAnswerApiResponse {
  success: boolean;
  data?: AnswerEvaluation;
  error?: string;
  message?: string;
}

export interface EvaluateInterviewParams {
  subject: string;
  isCustomSubject?: boolean;
  customSubjectText?: string;
  topic: string;
  isCustomTopic?: boolean;
  customTopicText?: string;
  difficulty: string;
  language: string;
  questions: InterviewQuestion[];
  answers: Array<{
    questionNumber: number;
    questionText: string;
    answerText: string;
    isSkipped: boolean;
  }>;
  studentId?: string;
  studentEmail?: string;
}

export interface EvaluateInterviewApiResponse {
  success: boolean;
  data?: MockInterviewReport;
  error?: string;
  message?: string;
}

export const interviewService = {
  /**
   * Request AI to evaluate a candidate's single technical interview answer (Phase 3)
   */
  async evaluateAnswer(params: EvaluateAnswerParams, signal?: AbortSignal): Promise<AnswerEvaluation> {
    const trimmed = params.answer?.trim() || '';
    if (!trimmed) {
      throw new Error('Please enter your answer before submitting.');
    }

    try {
      const response = await fetchWithTimeout('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
        timeoutMs: 12000,
        body: JSON.stringify(params),
      });

      const result: EvaluateAnswerApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        const errorMessage =
          result.error || result.message || 'Unable to evaluate your answer right now. Please try again.';
        throw new Error(errorMessage);
      }

      return result.data;
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      console.error('[Interview Service] Answer evaluation failed:', err?.message || err);
      throw new Error(
        err?.name === 'TimeoutError'
          ? 'Answer evaluation timed out. Please try again.'
          : err?.message && !err.message.includes('fetch')
          ? err.message
          : 'Unable to evaluate your answer right now. Please try again.'
      );
    }
  },

  /**
   * Request AI to generate all technical interview questions in a single structured request
   */
  async generateQuestions(params: GenerateQuestionsParams, signal?: AbortSignal): Promise<InterviewQuestion[]> {
    try {
      const response = await fetchWithTimeout('/api/interview/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
        timeoutMs: 15000,
        body: JSON.stringify({
          subject: params.subject,
          isCustomSubject: params.isCustomSubject,
          customSubjectText: params.customSubjectText,
          topic: params.topic,
          isCustomTopic: params.isCustomTopic,
          customTopicText: params.customTopicText,
          difficulty: params.difficulty,
          language: params.language || '',
          questionCount: Number(params.questionCount) || 5,
        }),
      });

      const result: any = await response.json();

      let questions: InterviewQuestion[] = [];
      if (result.data?.questions && Array.isArray(result.data.questions)) {
        questions = result.data.questions;
      } else if (Array.isArray(result.data)) {
        questions = result.data;
      } else if (Array.isArray(result.questions)) {
        questions = result.questions;
      }

      if (!response.ok || !result.success || questions.length === 0) {
        const errorMessage =
          result.error || result.message || 'Your interview is taking longer than expected. Please try again.';
        throw new Error(errorMessage);
      }

      return questions;
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      console.error('[Interview Service] Batch questions generation failed:', err?.message || err);
      throw new Error(
        err?.name === 'TimeoutError'
          ? 'Question generation timed out. Please try again.'
          : err?.message && !err.message.includes('fetch')
          ? err.message
          : 'Your interview is taking longer than expected. Please try again.'
      );
    }
  },

  /**
   * Request AI to generate an original technical interview question (single-question compatibility)
   */
  async generateQuestion(params: GenerateQuestionParams, signal?: AbortSignal): Promise<InterviewQuestion> {
    try {
      const questions = await this.generateQuestions({
        subject: params.subject,
        isCustomSubject: params.isCustomSubject,
        customSubjectText: params.customSubjectText,
        topic: params.topic,
        isCustomTopic: params.isCustomTopic,
        customTopicText: params.customTopicText,
        difficulty: params.difficulty,
        language: params.language || '',
        questionCount: Number(params.questionCount) || 1,
      }, signal);

      const targetIdx = (params.questionNumber || 1) - 1;
      return questions[targetIdx] || questions[0];
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      console.error('[Interview Service] Question generation failed:', err?.message || err);
      throw new Error(
        err?.name === 'TimeoutError'
          ? 'Question generation timed out. Please try again.'
          : err?.message && !err.message.includes('fetch')
          ? err.message
          : 'Unable to generate the interview question. Please try again.'
      );
    }
  },

  /**
   * Request AI evaluation of the full completed mock interview round
   */
  async evaluateInterview(params: EvaluateInterviewParams, signal?: AbortSignal): Promise<MockInterviewReport> {
    try {
      const response = await fetchWithTimeout('/api/interview/evaluate-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
        timeoutMs: 15000,
        body: JSON.stringify(params),
      });

      const result: EvaluateInterviewApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        const errorMessage =
          result.error || result.message || 'Unable to evaluate the interview. Generating preliminary assessment...';
        throw new Error(errorMessage);
      }

      return result.data;
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      console.error('[Interview Service] Interview evaluation call failed:', err?.message || err);
      throw new Error(
        err?.name === 'TimeoutError'
          ? 'Interview evaluation timed out. Please check your connection and retry.'
          : err?.message && !err.message.includes('fetch')
          ? err.message
          : 'Unable to evaluate the interview. Please check your connection.'
      );
    }
  },
};
