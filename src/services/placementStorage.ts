import {
  PlacementTestSession,
  PlacementStudentStats,
  PlacementAnswerRecord,
  TopicPerformance,
} from '../types/placement';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { persistenceManager } from './persistenceManager';

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

/**
 * Fetch and sync placement sessions from Supabase for cross-device consistency
 */
export async function fetchPlacementHistory(studentId: string = 'guest'): Promise<PlacementTestSession[]> {
  const local = getPlacementHistory(studentId);
  if (!isSupabaseConfigured() || !studentId || studentId === 'guest') {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from('placement_sessions')
      .select('*')
      .eq('user_id', studentId)
      .order('completed_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const remoteSessions: PlacementTestSession[] = data.map((row: any) => {
        if (row.session_data && typeof row.session_data === 'object') {
          return row.session_data as PlacementTestSession;
        }
        return {
          id: row.id,
          studentId: row.user_id || studentId,
          category: row.category || 'Technical',
          subject: row.subject || row.category || 'General',
          topic: row.topic || 'General',
          difficulty: row.difficulty || 'Medium',
          mode: row.mode || 'practice',
          totalQuestions: row.total_questions || 10,
          correctCount: row.correct_count || 0,
          incorrectCount: row.incorrect_count || 0,
          skippedCount: row.skipped_count || 0,
          score: row.score || 0,
          accuracy: row.accuracy || 0,
          timeTakenSeconds: row.time_spent_seconds || row.time_taken_seconds || 0,
          topicBreakdown: row.topic_breakdown || {},
          questions: Array.isArray(row.questions) ? row.questions : [],
          answers: row.answers && typeof row.answers === 'object' ? row.answers : {},
          createdAt: row.created_at || new Date().toISOString(),
          completedAt: row.completed_at || row.created_at || new Date().toISOString(),
        } as PlacementTestSession;
      });

      const mergedMap = new Map<string, PlacementTestSession>();
      for (const s of remoteSessions) {
        mergedMap.set(s.id, s);
      }
      for (const l of local) {
        if (!mergedMap.has(l.id)) {
          mergedMap.set(l.id, l);
          // Upload local session to cloud
          (async () => {
            try {
              savePlacementSession(l, studentId);
            } catch (_) {}
          })();
        }
      }

      const merged = Array.from(mergedMap.values());
      merged.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      localStorage.setItem(`${STORAGE_PREFIX}${studentId}`, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('[PlacementStorage] Error fetching remote sessions:', err);
  }

  return local;
}

export function savePlacementSession(
  session: PlacementTestSession,
  studentId: string = 'guest'
): void {
  try {
    const effectiveId = studentId || session.studentId || 'guest';
    const current = getPlacementHistory(effectiveId);
    // Remove if duplicate id exists
    const filtered = current.filter((s) => s.id !== session.id);
    const updated = [session, ...filtered];
    // Keep up to 100 recent sessions
    const trimmed = updated.slice(0, 100);
    localStorage.setItem(`${STORAGE_PREFIX}${effectiveId}`, JSON.stringify(trimmed));

    // Asynchronous remote persistence to Supabase
    if (isSupabaseConfigured() && effectiveId !== 'guest') {
      (async () => {
        try {
          const dbPayload = {
            id: session.id,
            user_id: effectiveId,
            category: session.category,
            topic: session.topic,
            difficulty: session.difficulty,
            total_questions: session.totalQuestions,
            correct_count: session.correctCount,
            incorrect_count: session.incorrectCount,
            skipped_count: session.skippedCount,
            score: session.score,
            accuracy: session.accuracy,
            time_spent_seconds: session.timeTakenSeconds || (session as any).timeSpentSeconds || 0,
            questions: session.questions,
            answers: session.answers,
            session_data: session,
            completed_at: session.completedAt || new Date().toISOString(),
            created_at: session.completedAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const { error } = await supabase.from('placement_sessions').upsert(dbPayload);
          if (error) {
            console.warn('[PlacementStorage] Remote save error, enqueuing offline mutation:', error);
            persistenceManager.enqueueOfflineMutation({
              id: `mut_placement_${session.id}_${Date.now()}`,
              userId: effectiveId,
              type: 'save_placement_session',
              payload: session,
              timestamp: new Date().toISOString(),
              attempts: 0,
            });
          }
        } catch (err) {
          console.warn('[PlacementStorage] Remote save notice, enqueuing offline mutation:', err);
          persistenceManager.enqueueOfflineMutation({
            id: `mut_placement_${session.id}_${Date.now()}`,
            userId: effectiveId,
            type: 'save_placement_session',
            payload: session,
            timestamp: new Date().toISOString(),
            attempts: 0,
          });
        }
      })();
    } else if (effectiveId !== 'guest') {
      persistenceManager.enqueueOfflineMutation({
        id: `mut_placement_${session.id}_${Date.now()}`,
        userId: effectiveId,
        type: 'save_placement_session',
        payload: session,
        timestamp: new Date().toISOString(),
        attempts: 0,
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('careerpilot_activity_updated', { detail: { studentId: effectiveId } }));
    }
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
