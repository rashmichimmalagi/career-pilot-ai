import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { persistenceManager } from './persistenceManager';
import {
  CareerReadinessScore,
  CareerReadinessTrendPoint,
} from '../types/intelligence';
import { CodingSubmission } from '../types/coding';
import { PlacementTestSession } from '../types/placement';
import { MockInterviewReport } from '../types/interview';
import { ResumeVersionItem } from '../types/resume';
import { DailyRoadmapTask } from '../types/roadmap';
import { calculateCareerReadinessScore } from './careerReadinessService';

function formatDateDisplay(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (_) {
    return isoString;
  }
}

function getDayString(isoString: string | Date): string {
  try {
    const d = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (_) {
    return '';
  }
}

export class CareerReadinessHistoryService {
  private localKeyPrefix = 'careerpilot_readiness_history_';

  // In-memory cache to prevent redundant writes on every render/recalculation
  private lastSavedCache = new Map<
    string,
    {
      date: string;
      score: number;
      codingScore: number;
      resumeScore: number;
      aptitudeScore: number;
      interviewScore: number;
      roadmapScore: number;
      timestamp: number;
    }
  >();

  /**
   * Save a snapshot of the current career readiness score ONLY when scores change
   * or a new day's snapshot is required, preventing duplicate insertions on renders.
   */
  public async recordReadinessSnapshot(
    userId: string,
    readiness: CareerReadinessScore
  ): Promise<void> {
    if (!userId || userId === 'guest' || !readiness || readiness.overallScore === null) {
      return;
    }

    const todayStr = getDayString(new Date());
    const overallScore = readiness.overallScore;
    const codingScore = readiness.dimensions.coding.score;
    const resumeScore = readiness.dimensions.resume.score;
    const aptitudeScore = readiness.dimensions.placement.score;
    const interviewScore = readiness.dimensions.interview.score;
    const roadmapScore = readiness.dimensions.roadmap.score;

    // 1. Fast in-memory check: if already recorded for today with identical scores, skip immediately
    const cached = this.lastSavedCache.get(userId);
    if (
      cached &&
      cached.date === todayStr &&
      cached.score === overallScore &&
      cached.codingScore === codingScore &&
      cached.resumeScore === resumeScore &&
      cached.aptitudeScore === aptitudeScore &&
      cached.interviewScore === interviewScore &&
      cached.roadmapScore === roadmapScore
    ) {
      return;
    }

    // 2. Check local storage cache to avoid re-writing on fresh component mounts if scores haven't changed
    try {
      const raw = localStorage.getItem(`${this.localKeyPrefix}${userId}`);
      const list: any[] = raw ? JSON.parse(raw) : [];
      const existingToday = list.find((item) => getDayString(item.created_at) === todayStr);

      if (
        existingToday &&
        Number(existingToday.score) === overallScore &&
        Number(existingToday.coding_score) === codingScore &&
        Number(existingToday.resume_score) === resumeScore &&
        Number(existingToday.aptitude_score) === aptitudeScore &&
        Number(existingToday.technical_interview_score) === interviewScore &&
        Number(existingToday.roadmap_score) === roadmapScore
      ) {
        // Cache matches current state; update in-memory record and skip insertion
        this.lastSavedCache.set(userId, {
          date: todayStr,
          score: overallScore,
          codingScore,
          resumeScore,
          aptitudeScore,
          interviewScore,
          roadmapScore,
          timestamp: Date.now(),
        });
        return;
      }
    } catch (_) {}

    // Deterministic snapshot ID per user and day
    const snapshotId = `readiness_${userId}_${todayStr}`;

    const payload = {
      id: snapshotId,
      user_id: userId,
      score: overallScore,
      coding_score: codingScore,
      resume_score: resumeScore,
      aptitude_score: aptitudeScore,
      technical_interview_score: interviewScore,
      roadmap_score: roadmapScore,
      status_category: readiness.statusCategory,
      breakdown: {
        dimensions: readiness.dimensions,
        availableCount: readiness.availableDimensionsCount,
      },
      created_at: new Date().toISOString(),
    };

    // Update in-memory cache
    this.lastSavedCache.set(userId, {
      date: todayStr,
      score: overallScore,
      codingScore,
      resumeScore,
      aptitudeScore,
      interviewScore,
      roadmapScore,
      timestamp: Date.now(),
    });

    // 3. Write to local cache (deduplicating by date)
    try {
      const raw = localStorage.getItem(`${this.localKeyPrefix}${userId}`);
      const list: any[] = raw ? JSON.parse(raw) : [];
      const existingIdx = list.findIndex((item) => getDayString(item.created_at) === todayStr);
      if (existingIdx >= 0) {
        list[existingIdx] = payload;
      } else {
        list.push(payload);
      }
      localStorage.setItem(`${this.localKeyPrefix}${userId}`, JSON.stringify(list.slice(-60)));
    } catch (_) {}

    // 4. Persist to Supabase if configured (idempotent upsert by deterministic ID)
    const mutationId = `mut_cr_${snapshotId}`;

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('career_readiness_history')
          .upsert(payload, { onConflict: 'id' });

        if (error) {
          persistenceManager.enqueueOfflineMutation({
            id: mutationId,
            userId,
            type: 'save_career_readiness',
            payload,
            timestamp: new Date().toISOString(),
            attempts: 0,
          });
        }
      } catch (err) {
        console.warn('[CareerReadinessHistory] Supabase write notice, enqueued:', err);
        persistenceManager.enqueueOfflineMutation({
          id: mutationId,
          userId,
          type: 'save_career_readiness',
          payload,
          timestamp: new Date().toISOString(),
          attempts: 0,
        });
      }
    } else {
      persistenceManager.enqueueOfflineMutation({
        id: mutationId,
        userId,
        type: 'save_career_readiness',
        payload,
        timestamp: new Date().toISOString(),
        attempts: 0,
      });
    }
  }

  /**
   * Fetch persisted historical snapshots from Supabase (with local cache fallback)
   * Deduplicates by calendar date so identical or multiple snapshots on the same day never duplicate.
   */
  public async getPersistedHistory(userId: string): Promise<CareerReadinessTrendPoint[]> {
    if (!userId || userId === 'guest') {
      return [];
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('career_readiness_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(180);

        if (!error && Array.isArray(data) && data.length > 0) {
          // Deduplicate by calendar day, keeping the most recent snapshot per day
          const dayMap = new Map<string, CareerReadinessTrendPoint>();
          for (const row of data) {
            const dateStr = getDayString(row.created_at);
            if (!dateStr) continue;

            dayMap.set(dateStr, {
              date: dateStr,
              displayDate: formatDateDisplay(row.created_at),
              score: Number(row.score) || 0,
              codingScore: Number(row.coding_score) || 0,
              resumeScore: Number(row.resume_score) || 0,
              aptitudeScore: Number(row.aptitude_score) || 0,
              interviewScore: Number(row.technical_interview_score) || 0,
              roadmapScore: Number(row.roadmap_score) || 0,
              statusCategory: row.status_category || 'Making Progress',
            });
          }

          return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        }
      } catch (err) {
        console.warn('[CareerReadinessHistory] Error reading from Supabase:', err);
      }
    }

    // Fallback to local cache
    try {
      const raw = localStorage.getItem(`${this.localKeyPrefix}${userId}`);
      if (raw) {
        const list: any[] = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          const dayMap = new Map<string, CareerReadinessTrendPoint>();
          for (const row of list) {
            const dateStr = getDayString(row.created_at);
            if (!dateStr) continue;

            dayMap.set(dateStr, {
              date: dateStr,
              displayDate: formatDateDisplay(row.created_at),
              score: Number(row.score) || 0,
              codingScore: Number(row.coding_score) || 0,
              resumeScore: Number(row.resume_score) || 0,
              aptitudeScore: Number(row.aptitude_score) || 0,
              interviewScore: Number(row.technical_interview_score) || 0,
              roadmapScore: Number(row.roadmap_score) || 0,
              statusCategory: row.status_category || 'Making Progress',
            });
          }

          return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        }
      }
    } catch (_) {}

    return [];
  }

  /**
   * Reconstruct historical trend points from dated domain data
   * Ensures authentic, zero-fabrication timeline points reflecting actual past progress
   */
  public reconstructHistoricalTrend(params: {
    submissions: CodingSubmission[];
    placementSessions: PlacementTestSession[];
    mockInterviews: MockInterviewReport[];
    resumes: ResumeVersionItem[];
    roadmapTasks: DailyRoadmapTask[];
    completedRoadmapIds: string[];
    persistedHistory?: CareerReadinessTrendPoint[];
  }): CareerReadinessTrendPoint[] {
    const {
      submissions = [],
      placementSessions = [],
      mockInterviews = [],
      resumes = [],
      roadmapTasks = [],
      completedRoadmapIds = [],
      persistedHistory = [],
    } = params;

    // If we have at least 2 distinct persisted snapshot days, use them
    if (persistedHistory.length >= 2) {
      return persistedHistory;
    }

    // Collect all timestamps from real user actions
    const timestamps: { dateStr: string; timestamp: number }[] = [];

    const addTimestamp = (iso?: string | null) => {
      if (!iso) return;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        const dateStr = getDayString(d);
        if (dateStr) {
          timestamps.push({ dateStr, timestamp: d.getTime() });
        }
      }
    };

    submissions.forEach((s) => addTimestamp(s.created_at));
    placementSessions.forEach((p) => addTimestamp(p.completedAt || p.createdAt));
    mockInterviews.forEach((m) => addTimestamp(m.completedAt || (m as any).completed_at));
    resumes.forEach((r) => addTimestamp(r.createdAt || (r as any).uploadedAt));

    if (timestamps.length === 0) {
      return persistedHistory;
    }

    // Group timestamps by unique date
    const uniqueDates = Array.from(new Set(timestamps.map((t) => t.dateStr))).sort();

    // If there is only 1 date, but we have some activity, we might have 1 data point
    if (uniqueDates.length === 0) {
      return [];
    }

    const trendPoints: CareerReadinessTrendPoint[] = [];

    // For each unique date, compute cumulative data up to end of that date
    for (const dateStr of uniqueDates) {
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`).getTime();

      const cumulativeSubmissions = submissions.filter((s) => {
        const t = new Date(s.created_at).getTime();
        return !isNaN(t) && t <= endOfDay;
      });

      const cumulativePlacement = placementSessions.filter((p) => {
        const t = new Date(p.completedAt || p.createdAt || '').getTime();
        return !isNaN(t) && t <= endOfDay;
      });

      const cumulativeInterviews = mockInterviews.filter((m) => {
        const t = new Date(m.completedAt || (m as any).completed_at || '').getTime();
        return !isNaN(t) && t <= endOfDay;
      });

      const cumulativeResumes = resumes.filter((r) => {
        const t = new Date(r.createdAt || (r as any).uploadedAt || '').getTime();
        return !isNaN(t) && t <= endOfDay;
      });

      const scoreResult = calculateCareerReadinessScore({
        codingSubmissions: cumulativeSubmissions,
        placementSessions: cumulativePlacement,
        mockInterviews: cumulativeInterviews,
        resumes: cumulativeResumes,
        roadmapTasks,
        completedRoadmapIds,
      });

      if (scoreResult.overallScore !== null) {
        trendPoints.push({
          date: dateStr,
          displayDate: formatDateDisplay(dateStr),
          score: scoreResult.overallScore,
          codingScore: scoreResult.dimensions.coding.score,
          resumeScore: scoreResult.dimensions.resume.score,
          aptitudeScore: scoreResult.dimensions.placement.score,
          interviewScore: scoreResult.dimensions.interview.score,
          roadmapScore: scoreResult.dimensions.roadmap.score,
          statusCategory: scoreResult.statusCategory,
        });
      }
    }

    // Merge with any persisted history
    const mergedMap = new Map<string, CareerReadinessTrendPoint>();
    for (const pt of trendPoints) {
      mergedMap.set(pt.date, pt);
    }
    for (const pt of persistedHistory) {
      mergedMap.set(pt.date, pt);
    }

    return Array.from(mergedMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const careerReadinessHistoryService = new CareerReadinessHistoryService();
