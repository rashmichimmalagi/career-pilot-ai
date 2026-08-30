/**
 * Interview Weakness Tracker Service
 * Aggregates mock interview performance records across Technical, Communication, Problem Solving,
 * and Confidence dimensions. Tracks historical deltas, strengths, and actionable remediation plans.
 */

import { InterviewWeaknessData } from '../types/intelligence';
import { MockInterviewReport } from '../types/interview';

export function computeInterviewWeaknessData(reports: MockInterviewReport[] = []): InterviewWeaknessData {
  if (!reports || reports.length === 0) {
    return {
      totalInterviews: 0,
      hasEnoughDataForTrend: false,
      currentPerformance: {
        overall: 0,
        technical: 0,
        communication: 0,
        problemSolving: 0,
        confidence: 0,
        technicalAccuracy: 0,
      },
      previousPerformance: null,
      deltas: null,
      weakAreas: [],
      strongAreas: [],
      recommendedNextInterview: {
        recommendedSubject: 'DSA & Algorithms',
        recommendedTopic: 'Arrays & Two Pointers',
        focusDimension: 'technical',
        rationale: 'Take your first technical mock interview to establish your performance baseline.',
      },
    };
  }

  // Sort descending by date
  const sorted = [...reports].sort((a, b) => {
    const tA = new Date(a.completedAt || a.completed_at || 0).getTime();
    const tB = new Date(b.completedAt || b.completed_at || 0).getTime();
    return tB - tA;
  });

  const latest = sorted[0];
  const previous = sorted.length > 1 ? sorted[1] : null;

  const currentOverall = (latest as any).overall_score ?? latest.overallScore ?? 0;
  const currentTech = (latest as any).technical_score ?? latest.technicalKnowledgeScore ?? currentOverall;
  const currentComm = (latest as any).communication_score ?? latest.communicationScore ?? currentOverall;
  const currentProb = (latest as any).problem_solving_score ?? latest.problemSolvingScore ?? currentOverall;
  const currentConf = (latest as any).confidence_score ?? (latest as any).confidenceScore ?? currentOverall;
  const currentAccuracy = (latest as any).technical_accuracy_score ?? currentTech;

  const currentPerformance = {
    overall: Math.round(currentOverall),
    technical: Math.round(currentTech),
    communication: Math.round(currentComm),
    problemSolving: Math.round(currentProb),
    confidence: Math.round(currentConf),
    technicalAccuracy: Math.round(currentAccuracy),
  };

  let previousPerformance: InterviewWeaknessData['previousPerformance'] = null;
  let deltas: InterviewWeaknessData['deltas'] = null;

  if (previous) {
    const prevOverall = (previous as any).overall_score ?? previous.overallScore ?? 0;
    const prevTech = (previous as any).technical_score ?? previous.technicalKnowledgeScore ?? prevOverall;
    const prevComm = (previous as any).communication_score ?? previous.communicationScore ?? prevOverall;
    const prevProb = (previous as any).problem_solving_score ?? previous.problemSolvingScore ?? prevOverall;
    const prevConf = (previous as any).confidence_score ?? (previous as any).confidenceScore ?? prevOverall;

    previousPerformance = {
      overall: Math.round(prevOverall),
      technical: Math.round(prevTech),
      communication: Math.round(prevComm),
      problemSolving: Math.round(prevProb),
      confidence: Math.round(prevConf),
      technicalAccuracy: Math.round((previous as any).technical_accuracy_score ?? prevTech),
    };

    deltas = {
      overall: currentPerformance.overall - previousPerformance.overall,
      technical: currentPerformance.technical - previousPerformance.technical,
      communication: currentPerformance.communication - previousPerformance.communication,
      problemSolving: currentPerformance.problemSolving - previousPerformance.problemSolving,
      confidence: currentPerformance.confidence - previousPerformance.confidence,
    };
  }

  // Identify Weak & Strong Areas
  const weakAreas: InterviewWeaknessData['weakAreas'] = [];
  const strongAreas: InterviewWeaknessData['strongAreas'] = [];

  const dimScores = [
    { key: 'Technical Depth', score: currentPerformance.technical, advice: 'Review core data structures and edge case complexities.' },
    { key: 'Verbal Communication', score: currentPerformance.communication, advice: 'Use the STAR structure and state your intent before coding.' },
    { key: 'Problem Solving Strategy', score: currentPerformance.problemSolving, advice: 'Talk through brute-force approach first before proposing optimal solution.' },
    { key: 'Interview Confidence', score: currentPerformance.confidence, advice: 'Maintain steady pacing and avoid rushing to final answers.' },
  ];

  for (const dim of dimScores) {
    if (dim.score < 70) {
      weakAreas.push({
        area: dim.key,
        score: dim.score,
        evidence: `Latest evaluated score is ${dim.score}/100.`,
        actionableAdvice: dim.advice,
      });
    } else {
      strongAreas.push({
        area: dim.key,
        score: dim.score,
        evidence: `Solid performance at ${dim.score}/100.`,
      });
    }
  }

  // Next Interview Recommendation
  const weakest = [...dimScores].sort((a, b) => a.score - b.score)[0];
  let focusDim: 'communication' | 'technical' | 'problem_solving' | 'confidence' = 'technical';
  if (weakest.key === 'Verbal Communication') focusDim = 'communication';
  else if (weakest.key === 'Problem Solving Strategy') focusDim = 'problem_solving';
  else if (weakest.key === 'Interview Confidence') focusDim = 'confidence';

  const recommendedNextInterview = {
    recommendedSubject: latest.subject || 'DSA & Algorithms',
    recommendedTopic: latest.topic || 'System Design & Tradeoffs',
    focusDimension: focusDim,
    rationale: `Focus on improving ${weakest.key} (${weakest.score}/100) in your next session.`,
  };

  return {
    totalInterviews: sorted.length,
    hasEnoughDataForTrend: sorted.length >= 2,
    currentPerformance,
    previousPerformance,
    deltas,
    weakAreas,
    strongAreas,
    recommendedNextInterview,
  };
}
