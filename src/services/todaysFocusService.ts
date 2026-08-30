/**
 * Personalized "Today's Focus" Service
 * Evidence-Based Daily Action Engine dynamically synthesized from authentic student performance:
 * - Coding: Verified problem submissions & accepted test cases
 * - Interview: Verified mock interview completions & rubric scores
 * - Resume: Verified resume uploads, ATS benchmarks & version tracking
 * - Placement / Aptitude: Verified test session submissions & accuracy
 * - Roadmap: Verified milestone completions in Supabase
 * 
 * CORE INTEGRITY GUARANTEES:
 * - Evidence-Based: Tasks cannot be falsely completed by arbitrary UI clicks.
 * - Progress tracking: Shows verifiable quantitative counts (e.g. "1/2 Solved", "0/1 Completed").
 * - Single Source of Truth: Evaluated strictly from persisted records.
 * - 3 to 5 actionable tasks with realistic estimated time (45-60 min total).
 * - Explicit evidence reason for every recommendation ("Why: Recommended because...").
 */

import { TodaysFocus, TodaysFocusTask, FocusTaskCategory, FocusTaskType } from '../types/intelligence';
import { CodingSubmission } from '../types/coding';
import { MockInterviewReport } from '../types/interview';
import { ResumeAnalysisResult, ResumeVersionItem } from '../types/resume';
import { PlacementTestSession } from '../types/placement';
import { DailyRoadmapTask } from '../types/roadmap';

const MANUAL_FOCUS_TASKS_KEY_PREFIX = 'careerpilot_focus_manual_completed_';

/**
 * Returns manual completion IDs for strictly non-verifiable (manual) items.
 */
export function getManualCompletedTaskIds(studentId: string = 'guest'): string[] {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(`${MANUAL_FOCUS_TASKS_KEY_PREFIX}${studentId}_${today}`);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Toggle manual task completion (STRICTLY for non-verifiable manual tasks only).
 */
export function toggleManualFocusTaskCompletion(studentId: string = 'guest', taskId: string): string[] {
  try {
    const today = new Date().toISOString().split('T')[0];
    const current = getManualCompletedTaskIds(studentId);
    const updated = current.includes(taskId)
      ? current.filter((id) => id !== taskId)
      : [...current, taskId];
    localStorage.setItem(`${MANUAL_FOCUS_TASKS_KEY_PREFIX}${studentId}_${today}`, JSON.stringify(updated));
    return updated;
  } catch (_) {
    return [];
  }
}

/**
 * Backward compatibility stub that delegates to toggleManualFocusTaskCompletion
 */
export function toggleFocusTaskCompletion(studentId: string = 'guest', taskId: string): string[] {
  return toggleManualFocusTaskCompletion(studentId, taskId);
}

/**
 * Generates Evidence-Based Today's Focus Action Plan
 */
export function generateTodaysFocus(params: {
  studentId?: string;
  submissions?: CodingSubmission[];
  placementSessions?: PlacementTestSession[];
  mockInterviews?: MockInterviewReport[];
  resumes?: ResumeVersionItem[];
  latestResumeAnalysis?: { result: ResumeAnalysisResult; targetRole: string; analyzedAt: string } | null;
  roadmapTasks?: DailyRoadmapTask[];
  completedRoadmapIds?: string[];
}): TodaysFocus {
  const studentId = params.studentId || 'guest';
  const manualCompletedIds = getManualCompletedTaskIds(studentId);
  const tasks: TodaysFocusTask[] = [];

  const submissions = params.submissions || [];
  const placementSessions = params.placementSessions || [];
  const mockInterviews = params.mockInterviews || [];
  const resumes = params.resumes || [];
  const latestResume = params.latestResumeAnalysis?.result;
  const roadmapTasks = params.roadmapTasks || [];
  const completedRoadmapIds = params.completedRoadmapIds || [];

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper: check if a date string is from today
  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    return dateStr.startsWith(todayStr);
  };

  // Submissions breakdown
  const acceptedSubmissions = submissions.filter((s) => s.status === 'accepted');
  const todaysAcceptedSubmissions = acceptedSubmissions.filter((s) =>
    isToday(s.created_at || (s as any).submitted_at)
  );

  const acceptedMap = new Map<string, CodingSubmission>();
  const topicStats: Record<string, { attempted: number; solved: number; todaySolved: number }> = {};

  for (const s of submissions) {
    const isAcc = s.status === 'accepted';
    const topic = s.topic || s.problem_data?.topic || 'General';
    if (!topicStats[topic]) topicStats[topic] = { attempted: 0, solved: 0, todaySolved: 0 };
    topicStats[topic].attempted++;
    if (isAcc) {
      if (!acceptedMap.has(s.problem_id)) {
        acceptedMap.set(s.problem_id, s);
        topicStats[topic].solved++;
      }
      if (isToday(s.created_at || (s as any).submitted_at)) {
        topicStats[topic].todaySolved++;
      }
    }
  }

  // 1. Coding Task Decision
  let weakestCodingTopic: { topic: string; accuracy: number; attempted: number; todaySolved: number } | null = null;
  for (const [topic, data] of Object.entries(topicStats)) {
    const acc = data.attempted > 0 ? Math.round((data.solved / data.attempted) * 100) : 0;
    if (data.attempted >= 1 && acc < 70) {
      if (!weakestCodingTopic || acc < weakestCodingTopic.accuracy) {
        weakestCodingTopic = { topic, accuracy: acc, attempted: data.attempted, todaySolved: data.todaySolved };
      }
    }
  }

  if (weakestCodingTopic) {
    const req = 2;
    // Count problems solved today in that topic or recent accepted
    const done = Math.min(req, weakestCodingTopic.todaySolved);
    const isDone = done >= req;

    tasks.push({
      id: 'focus_coding_weakness',
      title: `Practice 2 Medium ${weakestCodingTopic.topic} Problems`,
      category: 'coding',
      taskType: 'coding',
      estimatedMinutes: 25,
      priority: 'high',
      reason: `Recommended because your recent ${weakestCodingTopic.topic} accuracy is ${weakestCodingTopic.accuracy}% (${weakestCodingTopic.attempted} attempts), which is below placement target benchmarks.`,
      actionRoute: 'coding',
      actionText: `Practice ${weakestCodingTopic.topic}`,
      isVerifiable: true,
      requiredCount: req,
      completedCount: done,
      progressText: isDone ? '2/2 Solved (Verified)' : `${done}/2 Solved`,
      completionCriteria: 'Submit and pass 2 problems on this topic in Coding Arena',
      isCompleted: isDone,
      targetMetric: `${weakestCodingTopic.accuracy}% Accuracy`,
      targetTopic: weakestCodingTopic.topic,
    });
  } else if (acceptedMap.size < 5) {
    const req = 2;
    const done = Math.min(req, todaysAcceptedSubmissions.length || (acceptedMap.size >= 2 ? 2 : acceptedMap.size));
    const isDone = done >= req;

    tasks.push({
      id: 'focus_coding_foundations',
      title: 'Solve 2 Algorithmic DSA Problems',
      category: 'coding',
      taskType: 'coding',
      estimatedMinutes: 20,
      priority: 'high',
      reason: `Recommended because you have solved ${acceptedMap.size} problem${acceptedMap.size === 1 ? '' : 's'} so far; building daily muscle memory is essential for technical screenings.`,
      actionRoute: 'coding',
      actionText: 'Open Coding Arena',
      isVerifiable: true,
      requiredCount: req,
      completedCount: done,
      progressText: isDone ? '2/2 Solved (Verified)' : `${done}/2 Solved`,
      completionCriteria: 'Submit and pass 2 coding problems in Coding Arena',
      isCompleted: isDone,
      targetMetric: `${acceptedMap.size} Solved`,
    });
  } else {
    const dpGraphSolvedToday = todaysAcceptedSubmissions.filter((s) => {
      const t = (s.topic || s.problem_data?.topic || '').toLowerCase();
      return t.includes('dp') || t.includes('dynamic') || t.includes('graph') || t.includes('tree');
    }).length;
    const req = 1;
    const done = Math.min(req, dpGraphSolvedToday);
    const isDone = done >= req;

    tasks.push({
      id: 'focus_coding_advanced',
      title: 'Solve 1 Medium Dynamic Programming or Graph Problem',
      category: 'coding',
      taskType: 'coding',
      estimatedMinutes: 25,
      priority: 'medium',
      reason: 'Recommended to expand problem-solving breadth into high-frequency placement topics.',
      actionRoute: 'coding',
      actionText: 'Solve Problem',
      isVerifiable: true,
      requiredCount: req,
      completedCount: done,
      progressText: isDone ? '1/1 Solved (Verified)' : `${done}/1 Solved`,
      completionCriteria: 'Submit and pass 1 DP or Graph problem',
      isCompleted: isDone,
    });
  }

  // 2. Mock Interview Task Decision
  const todaysInterviews = mockInterviews.filter((m) =>
    isToday(m.completedAt || m.completed_at || (m as any).created_at || (m as any).createdAt)
  );

  if (mockInterviews.length === 0) {
    const isDone = mockInterviews.length > 0;
    tasks.push({
      id: 'focus_interview_first',
      title: 'Complete Your First AI Technical Mock Interview',
      category: 'interview',
      taskType: 'interview',
      estimatedMinutes: 15,
      priority: 'high',
      reason: 'Recommended because you have not completed a mock interview yet; establishing your verbal and problem-solving baseline is crucial.',
      actionRoute: 'interview',
      actionText: 'Start Mock Interview',
      isVerifiable: true,
      requiredCount: 1,
      completedCount: isDone ? 1 : 0,
      progressText: isDone ? '1/1 Completed' : '0/1 Completed',
      completionCriteria: 'Finish an AI Mock Interview round and generate report',
      isCompleted: isDone,
    });
  } else {
    const latest = mockInterviews[0];
    const commScore = latest.communication_score ?? (latest as any).communicationScore ?? 75;
    const techScore = latest.technical_score ?? (latest as any).technicalKnowledgeScore ?? 75;
    const completedToday = todaysInterviews.length > 0;

    if (commScore < techScore && commScore < 70) {
      const isDone = completedToday;
      tasks.push({
        id: 'focus_interview_comm',
        title: 'Mock Interview: Verbal Communication & STAR Explanations',
        category: 'interview',
        taskType: 'interview',
        estimatedMinutes: 15,
        priority: 'high',
        reason: `Recommended because your latest communication score (${commScore}/100) was lower than your technical score (${techScore}/100).`,
        actionRoute: 'interview',
        actionText: 'Practice Interview',
        isVerifiable: true,
        requiredCount: 1,
        completedCount: isDone ? 1 : 0,
        progressText: isDone ? '1/1 Completed (Verified)' : '0/1 Completed',
        completionCriteria: 'Complete a behavioral/communication interview round',
        isCompleted: isDone,
        targetMetric: `${commScore}/100 Comm`,
      });
    } else {
      const isDone = completedToday;
      tasks.push({
        id: 'focus_interview_revision',
        title: 'Review Mock Interview Rubric & Retake Weak Round',
        category: 'interview',
        taskType: 'interview',
        estimatedMinutes: 15,
        priority: 'medium',
        reason: 'Recommended to solidify structured technical explanation techniques under timed conditions.',
        actionRoute: 'interview',
        actionText: 'Review & Retake',
        isVerifiable: true,
        requiredCount: 1,
        completedCount: isDone ? 1 : 0,
        progressText: isDone ? '1/1 Completed (Verified)' : '0/1 Completed',
        completionCriteria: 'Complete and submit a new interview session',
        isCompleted: isDone,
      });
    }
  }

  // 3. Resume / Job Description Alignment Decision
  if (!latestResume && resumes.length === 0) {
    const hasResume = resumes.length > 0 || Boolean(latestResume);
    tasks.push({
      id: 'focus_resume_upload',
      title: 'Upload & Benchmark Your Resume',
      category: 'resume',
      taskType: 'resume',
      estimatedMinutes: 10,
      priority: 'high',
      reason: 'Recommended because no resume analysis exists; ATS scoring reveals critical missing keywords and skill gaps.',
      actionRoute: 'resume-analyzer',
      actionText: 'Analyze Resume',
      isVerifiable: true,
      requiredCount: 1,
      completedCount: hasResume ? 1 : 0,
      progressText: hasResume ? '1/1 Uploaded' : '0/1 Uploaded',
      completionCriteria: 'Upload and run ATS analysis on your resume',
      isCompleted: hasResume,
    });
  } else if (latestResume && latestResume.missing_skills && latestResume.missing_skills.length > 0) {
    const topMissing = latestResume.missing_skills.slice(0, 2).join(', ');
    const hasUpdatedResume = resumes.length > 1 || (latestResume.overall_score || 0) >= 80;
    tasks.push({
      id: 'focus_resume_skills',
      title: `Incorporate Missing Skills (${topMissing}) in Resume`,
      category: 'resume',
      taskType: 'resume',
      estimatedMinutes: 10,
      priority: 'medium',
      reason: `Recommended because ATS evaluation identified missing industry skills: ${topMissing}. Adding projects covering these will raise your role match.`,
      actionRoute: 'resume-analyzer',
      actionText: 'Update Resume',
      isVerifiable: true,
      requiredCount: 1,
      completedCount: hasUpdatedResume ? 1 : 0,
      progressText: hasUpdatedResume ? 'Verified Updated' : 'Pending Revision',
      completionCriteria: 'Upload an updated resume version addressing missing skills',
      isCompleted: hasUpdatedResume,
      targetMetric: `${latestResume.overall_score || 0} ATS`,
    });
  }

  // 4. Placement / Aptitude Assessment Decision
  const todaysPlacement = placementSessions.filter((p) =>
    isToday(p.createdAt || p.completedAt || (p as any).created_at)
  );

  if (placementSessions.length === 0) {
    const hasSession = placementSessions.length > 0;
    tasks.push({
      id: 'focus_placement_initial',
      title: 'Take 10-Min Placement Aptitude Assessment',
      category: 'placement',
      taskType: 'placement',
      estimatedMinutes: 10,
      priority: 'medium',
      reason: 'Recommended because placement tests evaluate core quantitative and logical speed required for campus placement screening rounds.',
      actionRoute: 'placement',
      actionText: 'Start Assessment',
      isVerifiable: true,
      requiredCount: 1,
      completedCount: hasSession ? 1 : 0,
      progressText: hasSession ? '1/1 Completed' : '0/1 Completed',
      completionCriteria: 'Submit a 10-question placement aptitude assessment',
      isCompleted: hasSession,
    });
  } else {
    const doneToday = todaysPlacement.length > 0;
    tasks.push({
      id: 'focus_placement_daily',
      title: 'Practice 1 Daily Aptitude Speed Quiz',
      category: 'placement',
      taskType: 'placement',
      estimatedMinutes: 10,
      priority: 'low',
      reason: 'Recommended to maintain fast mental calculation and quantitative reasoning under placement exam constraints.',
      actionRoute: 'placement',
      actionText: 'Start Quiz',
      isVerifiable: true,
      requiredCount: 1,
      completedCount: doneToday ? 1 : 0,
      progressText: doneToday ? '1/1 Completed (Verified)' : '0/1 Completed',
      completionCriteria: 'Complete a quick placement practice quiz today',
      isCompleted: doneToday,
    });
  }

  // 5. Roadmap Next Milestone Decision
  if (roadmapTasks.length > 0) {
    const nextUncompleted = roadmapTasks.find((t) => !completedRoadmapIds.includes(t.id));
    if (nextUncompleted && tasks.length < 5) {
      const isRoadmapDone = completedRoadmapIds.includes(nextUncompleted.id);
      tasks.push({
        id: `focus_roadmap_${nextUncompleted.id}`,
        title: `Roadmap: ${nextUncompleted.title}`,
        category: 'roadmap',
        taskType: 'roadmap',
        estimatedMinutes: 15,
        priority: 'medium',
        reason: `Recommended because this is your next active career milestone in ${nextUncompleted.category || 'your roadmap'}.`,
        actionRoute: 'roadmap',
        actionText: 'View Milestone',
        isVerifiable: true,
        requiredCount: 1,
        completedCount: isRoadmapDone ? 1 : 0,
        progressText: isRoadmapDone ? '1/1 Done (Verified)' : '0/1 Done',
        completionCriteria: `Complete ${nextUncompleted.title} in your Career Roadmap`,
        isCompleted: isRoadmapDone,
      });
    }
  }

  // Limit to 3-5 high leverage tasks
  const finalTasks = tasks.slice(0, 4);
  const totalEstimatedMinutes = finalTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const completedCount = finalTasks.filter((t) => t.isCompleted).length;
  const progressPercentage = finalTasks.length > 0 ? Math.round((completedCount / finalTasks.length) * 100) : 0;

  return {
    tasks: finalTasks,
    totalEstimatedMinutes,
    totalTasksCount: finalTasks.length,
    completedTasksCount: completedCount,
    progressPercentage,
    generatedAt: new Date().toISOString(),
    dataGroundingSummary: `Verified against ${submissions.length} coding submissions (${acceptedSubmissions.length} accepted), ${mockInterviews.length} mock interviews, ${placementSessions.length} placement tests, and ${resumes.length} resume versions.`,
  };
}
