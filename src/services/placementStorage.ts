import {
  PlacementTestSession,
  PlacementStudentStats,
  PlacementAnswerRecord,
  TopicPerformance,
} from '../types/placement';

const STORAGE_PREFIX = 'careerpilot_placement_sessions_';

/**
 * Multi-Student Isolated Storage for Placement Practice
 */
export function getPlacementHistory(studentId: string = 'guest'): PlacementTestSession[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${studentId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[PlacementStorage] Error loading history:', err);
    return [];
  }
}

export function savePlacementSession(
  session: PlacementTestSession,
  studentId: string = 'guest'
): void {
  try {
    const current = getPlacementHistory(studentId);
    // Remove if duplicate id exists
    const filtered = current.filter((s) => s.id !== session.id);
    const updated = [session, ...filtered];
    // Keep up to 100 recent sessions
    const trimmed = updated.slice(0, 100);
    localStorage.setItem(`${STORAGE_PREFIX}${studentId}`, JSON.stringify(trimmed));
  } catch (err) {
    console.error('[PlacementStorage] Error saving session:', err);
  }
}

export function getPlacementSessionById(
  sessionId: string,
  studentId: string = 'guest'
): PlacementTestSession | null {
  const history = getPlacementHistory(studentId);
  return history.find((s) => s.id === sessionId) || null;
}

export function deletePlacementSession(
  sessionId: string,
  studentId: string = 'guest'
): void {
  try {
    const current = getPlacementHistory(studentId);
    const updated = current.filter((s) => s.id !== sessionId);
    localStorage.setItem(`${STORAGE_PREFIX}${studentId}`, JSON.stringify(updated));
  } catch (err) {
    console.error('[PlacementStorage] Error deleting session:', err);
  }
}

/**
 * Aggregate real student statistics from their authentic placement test sessions
 */
export function getPlacementStats(studentId: string = 'guest'): PlacementStudentStats {
  const sessions = getPlacementHistory(studentId);

  if (!sessions.length) {
    return {
      totalTests: 0,
      totalQuestionsSolved: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalSkipped: 0,
      overallAccuracy: 0,
      aptitudeSolved: 0,
      aptitudeAccuracy: 0,
      technicalSolved: 0,
      technicalAccuracy: 0,
      perfectScoresCount: 0,
      recentSessions: [],
    };
  }

  let totalQuestionsSolved = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalSkipped = 0;
  let perfectScoresCount = 0;

  let aptitudeQuestions = 0;
  let aptitudeCorrect = 0;

  let technicalQuestions = 0;
  let technicalCorrect = 0;

  sessions.forEach((s) => {
    totalQuestionsSolved += s.totalQuestions;
    totalCorrect += s.correctCount;
    totalIncorrect += s.incorrectCount;
    totalSkipped += s.skippedCount;

    if (s.totalQuestions >= 5 && s.score === 100) {
      perfectScoresCount++;
    }

    if (s.category === 'Aptitude') {
      aptitudeQuestions += s.totalQuestions;
      aptitudeCorrect += s.correctCount;
    } else {
      technicalQuestions += s.totalQuestions;
      technicalCorrect += s.correctCount;
    }
  });

  const answeredTotal = totalCorrect + totalIncorrect;
  const overallAccuracy =
    answeredTotal > 0 ? Math.round((totalCorrect / answeredTotal) * 100) : 0;

  const aptAnswered = sessions
    .filter((s) => s.category === 'Aptitude')
    .reduce((acc, cur) => acc + cur.correctCount + cur.incorrectCount, 0);
  const aptitudeAccuracy =
    aptAnswered > 0 ? Math.round((aptitudeCorrect / aptAnswered) * 100) : 0;

  const techAnswered = sessions
    .filter((s) => s.category === 'Technical')
    .reduce((acc, cur) => acc + cur.correctCount + cur.incorrectCount, 0);
  const technicalAccuracy =
    techAnswered > 0 ? Math.round((technicalCorrect / techAnswered) * 100) : 0;

  return {
    totalTests: sessions.length,
    totalQuestionsSolved,
    totalCorrect,
    totalIncorrect,
    totalSkipped,
    overallAccuracy,
    aptitudeSolved: aptitudeQuestions,
    aptitudeAccuracy,
    technicalSolved: technicalQuestions,
    technicalAccuracy,
    perfectScoresCount,
    recentSessions: sessions.slice(0, 10),
  };
}

/**
 * Analyze completed questions and determine topic breakdown & weak areas
 */
export function computeSessionBreakdown(
  session: Partial<PlacementTestSession>
): {
  topicBreakdown: Record<string, TopicPerformance>;
  weakestTopic?: { topic: string; accuracy: number; total: number; incorrect: number };
} {
  const breakdown: Record<string, TopicPerformance> = {};
  const questions = session.questions || [];
  const answers = session.answers || {};

  questions.forEach((q) => {
    const topicKey = q.topic || session.topic || 'General';
    if (!breakdown[topicKey]) {
      breakdown[topicKey] = {
        topic: topicKey,
        total: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        percentage: 0,
      };
    }

    breakdown[topicKey].total++;
    const ans = answers[q.questionNumber];
    if (!ans || ans.isSkipped || !ans.selectedOption) {
      breakdown[topicKey].skipped++;
    } else if (ans.isCorrect) {
      breakdown[topicKey].correct++;
    } else {
      breakdown[topicKey].incorrect++;
    }
  });

  // Calculate percentages
  Object.values(breakdown).forEach((tb) => {
    const evaluated = tb.correct + tb.incorrect;
    tb.percentage = evaluated > 0 ? Math.round((tb.correct / tb.total) * 100) : 0;
  });

  // Find weakest topic (lowest accuracy, or highest incorrect)
  let weakest: { topic: string; accuracy: number; total: number; incorrect: number } | undefined;
  const topicsList = Object.values(breakdown);

  if (topicsList.length > 0) {
    // Sort primarily by percentage ascending, secondarily by incorrect count descending
    const sorted = [...topicsList].sort((a, b) => {
      if (a.percentage !== b.percentage) return a.percentage - b.percentage;
      return b.incorrect - a.incorrect;
    });

    const candidate = sorted[0];
    if (candidate && (candidate.incorrect > 0 || candidate.skipped > 0 || candidate.percentage < 80)) {
      weakest = {
        topic: candidate.topic,
        accuracy: candidate.percentage,
        total: candidate.total,
        incorrect: candidate.incorrect + candidate.skipped,
      };
    }
  }

  return {
    topicBreakdown: breakdown,
    weakestTopic: weakest,
  };
}
