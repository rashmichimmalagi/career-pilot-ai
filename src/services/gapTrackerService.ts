/**
 * Skill Gap Action Tracker & Lifecycle Status Service
 * Tracks student interactions with the "Address Gap" workflow and computes
 * deterministic lifecycle statuses: OPEN -> IN PROGRESS -> IMPROVING -> RESOLVED.
 */

export type GapLifecycleStatus = 'OPEN' | 'IN PROGRESS' | 'IMPROVING' | 'RESOLVED';

export interface GapActionRecord {
  id: string;
  studentId: string;
  gapId: string;
  topic: string;
  destination: string;
  gapType: 'mcq' | 'coding' | 'aptitude' | 'interview' | 'hr-interview' | 'resume' | 'roadmap' | string;
  company?: string;
  role?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const GAP_STORAGE_KEY_PREFIX = 'careerpilot_gap_actions_';

/**
 * Record an "Address Gap" click event
 */
export function recordGapAction(
  studentId: string,
  gapId: string,
  topic: string,
  destination: string,
  gapType: string,
  meta?: { company?: string; role?: string; metadata?: Record<string, any> }
): GapActionRecord {
  try {
    const key = `${GAP_STORAGE_KEY_PREFIX}${studentId || 'guest'}`;
    const existingRaw = localStorage.getItem(key);
    const records: GapActionRecord[] = existingRaw ? JSON.parse(existingRaw) : [];

    const newRecord: GapActionRecord = {
      id: `gap_act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: studentId || 'guest',
      gapId,
      topic,
      destination,
      gapType,
      company: meta?.company,
      role: meta?.role,
      timestamp: new Date().toISOString(),
      metadata: meta?.metadata,
    };

    records.unshift(newRecord);
    // Keep last 100 gap action records
    localStorage.setItem(key, JSON.stringify(records.slice(0, 100)));
    return newRecord;
  } catch (err) {
    console.warn('[GapTrackerService] Failed to record gap action:', err);
    return {
      id: `gap_act_${Date.now()}`,
      studentId,
      gapId,
      topic,
      destination,
      gapType,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get all gap action records for a student
 */
export function getGapActionHistory(studentId: string): GapActionRecord[] {
  try {
    const key = `${GAP_STORAGE_KEY_PREFIX}${studentId || 'guest'}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[GapTrackerService] Failed to load gap action history:', err);
    return [];
  }
}

/**
 * Check if a student has interacted with a specific gap or topic
 */
export function hasInteractedWithGap(studentId: string, gapId: string, topic?: string): boolean {
  const history = getGapActionHistory(studentId);
  return history.some(
    (h) =>
      h.gapId === gapId ||
      (topic && h.topic && h.topic.toLowerCase() === topic.toLowerCase())
  );
}

/**
 * Deterministically compute the Gap Lifecycle Status based on actual student performance
 * and gap interaction history.
 *
 * Status Flow:
 * - RESOLVED: Performance meets or exceeds the required target benchmark (>= 75% or solved target volume).
 * - IMPROVING: Performance has demonstrated tangible improvement (>= 50% but < 75%).
 * - IN PROGRESS: Student has clicked "Address Gap" and started practicing, but has not yet reached improving threshold.
 * - OPEN: Gap identified, no active practice or interaction initiated yet.
 */
export function computeGapStatus(
  studentId: string,
  gapId: string,
  options: {
    currentScore?: number;
    hasData?: boolean;
    topic?: string;
    targetThreshold?: number; // default 75
    improvingThreshold?: number; // default 50
  } = {}
): GapLifecycleStatus {
  const targetThreshold = options.targetThreshold ?? 75;
  const improvingThreshold = options.improvingThreshold ?? 50;
  const score = options.currentScore;
  const hasData = options.hasData ?? (score !== undefined && score > 0);

  // 1. Check if performance reaches the required benchmark -> RESOLVED
  if (score !== undefined && score >= targetThreshold) {
    return 'RESOLVED';
  }

  // 2. Check if performance is intermediate / progressing -> IMPROVING
  if (score !== undefined && score >= improvingThreshold) {
    return 'IMPROVING';
  }

  // 3. Check if student clicked "Address Gap" -> IN PROGRESS
  const interacted = hasInteractedWithGap(studentId, gapId, options.topic);
  if (interacted || (hasData && score !== undefined && score > 0)) {
    return 'IN PROGRESS';
  }

  // 4. Default -> OPEN
  return 'OPEN';
}
