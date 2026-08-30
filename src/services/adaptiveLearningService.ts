/**
 * Adaptive Learning Engine Service
 * Dynamically identifies student strengths, authentic weaknesses, neglected areas, and repeated mistakes.
 * 
 * CORE PRINCIPLES:
 * - Substantial Evidence Required: Requires at least 2 attempts or multiple failures before classifying a topic as weak.
 * - Dynamic Evolution: Automatically updates as student attempts more problems and tests.
 * - Cross-Module Synthesis: Combines Coding test case patterns, Mock Interview rubric feedback, and Placement accuracy.
 */

import {
  AdaptiveLearningInsights,
  AdaptiveTopicInsight,
  AdaptiveMistakePattern,
} from '../types/intelligence';
import { CodingSubmission } from '../types/coding';
import { MockInterviewReport } from '../types/interview';
import { ResumeAnalysisResult } from '../types/resume';
import { PlacementTestSession } from '../types/placement';

export function computeAdaptiveInsights(params: {
  submissions?: CodingSubmission[];
  placementSessions?: PlacementTestSession[];
  mockInterviews?: MockInterviewReport[];
  latestResumeAnalysis?: { result: ResumeAnalysisResult; targetRole: string; analyzedAt: string } | null;
}): AdaptiveLearningInsights {
  const submissions = params.submissions || [];
  const placementSessions = params.placementSessions || [];
  const mockInterviews = params.mockInterviews || [];
  const latestResume = params.latestResumeAnalysis?.result;

  const weakTopics: AdaptiveTopicInsight[] = [];
  const strongTopics: AdaptiveTopicInsight[] = [];
  const repeatedMistakes: AdaptiveMistakePattern[] = [];
  const neglectedAreas: AdaptiveLearningInsights['neglectedAreas'] = [];
  const improvementTrends: AdaptiveLearningInsights['improvementTrends'] = [];
  const adaptiveRecommendations: AdaptiveLearningInsights['adaptiveRecommendations'] = [];

  // 1. Analyze Coding Submissions
  const codingTopicStats: Record<
    string,
    { total: number; accepted: number; timeLimitFailures: number; wrongAnswers: number; lastDate: string }
  > = {};

  for (const s of submissions) {
    const topic = s.topic || s.problem_data?.topic || 'General';
    const dStr = s.created_at || new Date().toISOString();

    if (!codingTopicStats[topic]) {
      codingTopicStats[topic] = {
        total: 0,
        accepted: 0,
        timeLimitFailures: 0,
        wrongAnswers: 0,
        lastDate: dStr,
      };
    }

    const cur = codingTopicStats[topic];
    cur.total++;
    if (s.status === 'accepted') cur.accepted++;
    if (s.status === 'time_limit_exceeded') cur.timeLimitFailures++;
    if (s.status === 'wrong_answer') cur.wrongAnswers++;

    if (new Date(dStr) > new Date(cur.lastDate)) {
      cur.lastDate = dStr;
    }
  }

  // Evaluate coding topics with evidence thresholds (>= 2 attempts)
  for (const [topic, data] of Object.entries(codingTopicStats)) {
    const acc = Math.round((data.accepted / data.total) * 100);

    if (data.total >= 2 && acc < 60) {
      weakTopics.push({
        topic,
        module: 'coding',
        confidence: data.total >= 4 ? 'high' : 'medium',
        evidence: `${data.accepted} solved out of ${data.total} attempts (${acc}% accuracy).`,
        failureCount: data.total - data.accepted,
        accuracyRate: acc,
        recommendation: `Focus on ${topic} core patterns and review test case edge conditions.`,
        actionRoute: 'coding',
      });

      if (data.timeLimitFailures >= 2) {
        repeatedMistakes.push({
          id: `mistake_tle_${topic.toLowerCase()}`,
          title: `Time Limit Exceeded in ${topic}`,
          module: 'coding',
          occurrencesCount: data.timeLimitFailures,
          evidence: `Encountered ${data.timeLimitFailures} TLE submissions in ${topic}. Likely using O(N²) or brute-force approach.`,
          actionableSuggestion: `Optimize time complexity using hash maps, two pointers, or binary search instead of nested loops.`,
        });
      }
    } else if (data.total >= 2 && acc >= 80) {
      strongTopics.push({
        topic,
        module: 'coding',
        confidence: data.total >= 3 ? 'high' : 'medium',
        evidence: `${data.accepted} solved out of ${data.total} attempts (${acc}% accuracy).`,
        successCount: data.accepted,
        accuracyRate: acc,
        recommendation: `Solid proficiency established. Progress to Hard difficulty challenges.`,
        actionRoute: 'coding',
      });
    }

    // Neglected detection (> 7 days since last practice on this topic)
    const daysSince = Math.floor((Date.now() - new Date(data.lastDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 7 && data.total >= 1) {
      neglectedAreas.push({
        area: `${topic} (Coding)`,
        module: 'Coding Arena',
        lastPracticedDaysAgo: daysSince,
        reason: `Last practiced ${daysSince} days ago. Periodic spaced repetition maintains speed.`,
        actionRoute: 'coding',
      });
    }
  }

  // 2. Analyze Placement Assessment Sessions
  const placementSubjectStats: Record<string, { totalQ: number; correctQ: number; attempts: number }> = {};
  for (const s of placementSessions) {
    const subj = s.subject || s.category || 'General';
    if (!placementSubjectStats[subj]) {
      placementSubjectStats[subj] = { totalQ: 0, correctQ: 0, attempts: 0 };
    }
    placementSubjectStats[subj].attempts++;
    placementSubjectStats[subj].totalQ += s.totalQuestions || 0;
    placementSubjectStats[subj].correctQ += s.correctCount || 0;
  }

  for (const [subj, data] of Object.entries(placementSubjectStats)) {
    const acc = data.totalQ > 0 ? Math.round((data.correctQ / data.totalQ) * 100) : 0;
    if (data.attempts >= 2 && acc < 65) {
      weakTopics.push({
        topic: subj,
        module: 'placement',
        confidence: data.attempts >= 3 ? 'high' : 'medium',
        evidence: `${data.correctQ}/${data.totalQ} correct across ${data.attempts} assessments (${acc}% accuracy).`,
        accuracyRate: acc,
        recommendation: `Review formula fundamentals and practice timed multiple-choice questions for ${subj}.`,
        actionRoute: 'placement',
      });
    } else if (data.attempts >= 2 && acc >= 80) {
      strongTopics.push({
        topic: subj,
        module: 'placement',
        confidence: 'high',
        evidence: `${acc}% accuracy across ${data.attempts} assessments.`,
        accuracyRate: acc,
        recommendation: `High speed and accuracy demonstrated in ${subj}.`,
        actionRoute: 'placement',
      });
    }
  }

  // 3. Analyze Mock Interview Rubrics
  if (mockInterviews.length > 0) {
    const latest = mockInterviews[0];
    const comm = latest.communication_score ?? latest.communicationScore ?? 0;
    const tech = latest.technical_score ?? latest.technicalKnowledgeScore ?? 0;
    const prob = latest.problem_solving_score ?? latest.problemSolvingScore ?? 0;

    if (comm < 65 && comm > 0) {
      weakTopics.push({
        topic: 'Verbal Technical Communication',
        module: 'interview',
        confidence: 'medium',
        evidence: `Latest interview communication score is ${comm}/100.`,
        recommendation: 'Practice explaining code structure verbally using the STAR method before writing code.',
        actionRoute: 'interview',
      });
    }

    if (prob < 65 && prob > 0) {
      repeatedMistakes.push({
        id: 'mistake_interview_edge_cases',
        title: 'Interview Trade-Off & Edge Case Explanation',
        module: 'interview',
        occurrencesCount: 1,
        evidence: `Latest interview problem solving score: ${prob}/100.`,
        actionableSuggestion: 'Always state time and space complexity explicitly and outline 2 edge cases before writing implementation.',
      });
    }
  }

  // 4. Generate Adaptive Recommendations
  if (weakTopics.length > 0) {
    const topWeak = weakTopics[0];
    adaptiveRecommendations.push({
      id: `rec_weak_${topWeak.topic.toLowerCase()}`,
      title: `Reinforce ${topWeak.topic}`,
      description: topWeak.recommendation,
      type: topWeak.module === 'interview' ? 'mock' : 'practice',
      actionRoute: topWeak.actionRoute,
    });
  }

  if (repeatedMistakes.length > 0) {
    const topMistake = repeatedMistakes[0];
    adaptiveRecommendations.push({
      id: `rec_mistake_${topMistake.id}`,
      title: topMistake.title,
      description: topMistake.actionableSuggestion,
      type: 'review',
      actionRoute: topMistake.module === 'interview' ? 'interview' : 'coding',
    });
  }

  if (latestResume && latestResume.missing_skills && latestResume.missing_skills.length > 0) {
    adaptiveRecommendations.push({
      id: 'rec_resume_gap',
      title: 'Target ATS Missing Skills',
      description: `Incorporate ${latestResume.missing_skills.slice(0, 3).join(', ')} into your project descriptions to boost ATS match.`,
      type: 'resume',
      actionRoute: 'resume-analyzer',
    });
  }

  return {
    weakTopics,
    strongTopics,
    neglectedAreas,
    repeatedMistakes,
    improvementTrends,
    adaptiveRecommendations,
    updatedAt: new Date().toISOString(),
  };
}
