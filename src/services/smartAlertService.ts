/**
 * Smart Alerts & Notifications Service
 * Generates data-grounded, non-spamming smart alerts categorized into 4 tiers:
 * 1. 🔴 Action Needed (Critical gaps preventing placement progress)
 * 2. 🟡 Improvement Opportunity (Sub-optimal scores or lagging dimensions)
 * 3. 🟢 Milestone (Earned badges, solved thresholds, readiness level-ups)
 * 4. 🔵 Recommendation (High-impact next actions)
 */

import { SmartAlertItem, SmartAlertType } from '../types/intelligence';
import { CodingSubmission } from '../types/coding';
import { MockInterviewReport } from '../types/interview';
import { ResumeAnalysisResult, ResumeVersionItem } from '../types/resume';
import { PlacementTestSession } from '../types/placement';
import { DailyRoadmapTask } from '../types/roadmap';

const READ_ALERTS_KEY_PREFIX = 'careerpilot_alerts_read_';
const DISMISSED_ALERTS_KEY_PREFIX = 'careerpilot_alerts_dismissed_';

export function getReadAlertIds(studentId: string = 'guest'): string[] {
  try {
    const raw = localStorage.getItem(`${READ_ALERTS_KEY_PREFIX}${studentId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function getDismissedAlertIds(studentId: string = 'guest'): string[] {
  try {
    const raw = localStorage.getItem(`${DISMISSED_ALERTS_KEY_PREFIX}${studentId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function markAlertAsRead(studentId: string = 'guest', alertId: string): void {
  try {
    const current = getReadAlertIds(studentId);
    if (!current.includes(alertId)) {
      localStorage.setItem(`${READ_ALERTS_KEY_PREFIX}${studentId}`, JSON.stringify([...current, alertId]));
    }
  } catch (_) {}
}

export function dismissAlert(studentId: string = 'guest', alertId: string): void {
  try {
    const current = getDismissedAlertIds(studentId);
    if (!current.includes(alertId)) {
      localStorage.setItem(`${DISMISSED_ALERTS_KEY_PREFIX}${studentId}`, JSON.stringify([...current, alertId]));
    }
  } catch (_) {}
}

export function generateSmartAlerts(params: {
  studentId?: string;
  submissions?: CodingSubmission[];
  placementSessions?: PlacementTestSession[];
  mockInterviews?: MockInterviewReport[];
  resumes?: ResumeVersionItem[];
  latestResumeAnalysis?: { result: ResumeAnalysisResult; targetRole: string; analyzedAt: string } | null;
  roadmapTasks?: DailyRoadmapTask[];
  completedRoadmapIds?: string[];
  readinessScore?: number | null;
}): SmartAlertItem[] {
  const studentId = params.studentId || 'guest';
  const readIds = getReadAlertIds(studentId);
  const dismissedIds = getDismissedAlertIds(studentId);

  const rawAlerts: SmartAlertItem[] = [];

  const submissions = params.submissions || [];
  const placementSessions = params.placementSessions || [];
  const mockInterviews = params.mockInterviews || [];
  const resumes = params.resumes || [];
  const latestResume = params.latestResumeAnalysis?.result;
  const roadmapTasks = params.roadmapTasks || [];
  const completedRoadmapIds = params.completedRoadmapIds || [];
  const readiness = params.readinessScore;

  // 1. Critical Actions
  if (!latestResume && resumes.length === 0) {
    rawAlerts.push({
      id: 'alert_no_resume',
      type: 'action_needed',
      severity: 'high',
      title: 'Analyze Your Resume',
      message: 'Upload your resume to benchmark ATS compatibility against target software engineering roles.',
      actionRoute: 'resume-analyzer',
      actionText: 'Analyze Resume',
      sourceModule: 'resume',
      isRead: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (submissions.length === 0) {
    rawAlerts.push({
      id: 'alert_no_coding',
      type: 'action_needed',
      severity: 'high',
      title: 'Start Coding Practice',
      message: 'Solve your first problem in the Coding Arena to begin establishing your technical problem-solving benchmark.',
      actionRoute: 'coding',
      actionText: 'Solve Problem',
      sourceModule: 'coding',
      isRead: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  // 2. Improvement Opportunities
  if (mockInterviews.length > 0) {
    const latest = mockInterviews[0];
    const comm = latest.communication_score ?? latest.communicationScore ?? 75;
    const tech = latest.technical_score ?? latest.technicalKnowledgeScore ?? 75;
    if (comm < tech && comm < 70) {
      rawAlerts.push({
        id: 'alert_interview_comm_gap',
        type: 'improvement_opportunity',
        severity: 'medium',
        title: 'Communication Score Opportunity',
        message: `Your interview communication score (${comm}/100) is lagging behind your technical score (${tech}/100). Practice STAR verbal framing.`,
        actionRoute: 'interview',
        actionText: 'Practice Mock Round',
        sourceModule: 'interview',
        isRead: false,
        isDismissed: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 3. Milestones
  const acceptedCount = submissions.filter((s) => s.status === 'accepted').length;
  if (acceptedCount >= 10) {
    rawAlerts.push({
      id: 'alert_milestone_10_solved',
      type: 'milestone',
      severity: 'info',
      title: 'Coding Milestone Reached',
      message: `You have successfully solved ${acceptedCount} coding challenges! Keep up the daily practice momentum.`,
      actionRoute: 'coding',
      actionText: 'View Progress',
      sourceModule: 'coding',
      isRead: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (readiness && readiness >= 70) {
    rawAlerts.push({
      id: 'alert_milestone_placement_ready',
      type: 'milestone',
      severity: 'info',
      title: 'Placement Ready Tier Achieved',
      message: `Your overall career readiness has reached ${readiness}%! You are well-positioned for placement drives.`,
      actionRoute: 'dashboard',
      actionText: 'View Breakdown',
      sourceModule: 'general',
      isRead: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Filter out dismissed alerts and decorate read state
  return rawAlerts
    .filter((a) => !dismissedIds.includes(a.id))
    .map((a) => ({
      ...a,
      isRead: readIds.includes(a.id),
    }));
}
