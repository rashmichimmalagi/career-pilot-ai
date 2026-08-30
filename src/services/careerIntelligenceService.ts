/**
 * Unified Career Intelligence Service
 * Single Source of Truth Orchestrator for CareerPilot AI's Complete Intelligence Suite.
 * 
 * Aggregates student records once from Supabase/cache and synthesizes:
 * 1. Career Readiness Score
 * 2. Progress Analytics
 * 3. Personalized Today's Focus
 * 4. Adaptive Learning Insights
 * 5. Interview Weakness Tracker
 * 6. Cross-platform Achievements
 * 7. Smart Alerts
 * 8. Weekly Career Report
 */

import { UnifiedCareerIntelligence } from '../types/intelligence';
import { calculateCareerReadinessScore } from './careerReadinessService';
import { calculateProgressAnalytics } from './progressAnalyticsService';
import { generateTodaysFocus } from './todaysFocusService';
import { computeAdaptiveInsights } from './adaptiveLearningService';
import { computeInterviewWeaknessData } from './interviewAnalyticsService';
import { generateSmartAlerts } from './smartAlertService';
import { generateWeeklyCareerReport } from './weeklyReportService';
import { getUserAchievementsSummary } from './achievementService';
import { careerReadinessHistoryService } from './careerReadinessHistoryService';

// Underlying Storage Services
import { codingService } from './codingService';
import { interviewStorage } from './interviewStorage';
import { resumeService } from './resumeService';
import { getPlacementStats, fetchPlacementHistory } from './placementStorage';
import { fetchRemoteRoadmapData } from './roadmapStorage';
import { getStoredStudyPlans, getDailyStudyTime } from './studyPlannerService';

const CACHE_EXPIRY_MS = 60 * 1000; // 1 minute in-memory cache
const memoryCache = new Map<string, { data: UnifiedCareerIntelligence; timestamp: number }>();

export class CareerIntelligenceServiceClass {
  /**
   * Primary entry point: Get complete unified career intelligence for student
   */
  public async getUnifiedIntelligence(
    studentId: string = 'guest',
    options: { forceRefresh?: boolean; profile?: any; timeRange?: any } = {}
  ): Promise<UnifiedCareerIntelligence> {
    const effectiveId = studentId || 'guest';
    const now = Date.now();

    // Check memory cache
    if (!options.forceRefresh && memoryCache.has(effectiveId)) {
      const cached = memoryCache.get(effectiveId)!;
      if (now - cached.timestamp < CACHE_EXPIRY_MS) {
        return cached.data;
      }
    }

    // Parallel fetch across all domain data sources with error isolation
    const [
      resumesRes,
      latestAnalysisRes,
      submissionsRes,
      placementStatsRes,
      placementSessionsRes,
      mockInterviewsRes,
      roadmapDataRes,
      readinessHistoryRes,
    ] = await Promise.allSettled([
      Promise.resolve(resumeService.getUserResumes(effectiveId)),
      Promise.resolve(resumeService.getLatestAnalysis(effectiveId)),
      codingService.getSubmissions(effectiveId),
      Promise.resolve(getPlacementStats(effectiveId)),
      fetchPlacementHistory(effectiveId),
      interviewStorage.fetchReports(effectiveId),
      fetchRemoteRoadmapData(effectiveId),
      careerReadinessHistoryService.getPersistedHistory(effectiveId),
    ]);

    const resumes = resumesRes.status === 'fulfilled' && Array.isArray(resumesRes.value) ? resumesRes.value : [];
    const latestResumeAnalysis = latestAnalysisRes.status === 'fulfilled' ? latestAnalysisRes.value : null;
    const submissions = submissionsRes.status === 'fulfilled' && Array.isArray(submissionsRes.value) ? submissionsRes.value : [];
    const placementStats = placementStatsRes.status === 'fulfilled' ? placementStatsRes.value : null;
    const placementSessions = placementSessionsRes.status === 'fulfilled' && Array.isArray(placementSessionsRes.value) ? placementSessionsRes.value : [];
    const mockInterviews = mockInterviewsRes.status === 'fulfilled' && Array.isArray(mockInterviewsRes.value) ? mockInterviewsRes.value : [];
    const persistedReadinessHistory = readinessHistoryRes.status === 'fulfilled' && Array.isArray(readinessHistoryRes.value) ? readinessHistoryRes.value : [];
    
    const roadmapTasks = (roadmapDataRes.status === 'fulfilled' && roadmapDataRes.value && Array.isArray(roadmapDataRes.value.tasks)) ? roadmapDataRes.value.tasks : [];
    const completedRoadmapIds = (roadmapDataRes.status === 'fulfilled' && roadmapDataRes.value && Array.isArray(roadmapDataRes.value.completedItemIds)) ? roadmapDataRes.value.completedItemIds : [];

    const studyPlans = getStoredStudyPlans(effectiveId) || [];
    const dailyStudyTime = getDailyStudyTime(effectiveId) || 60;

    // 1. Calculate Career Readiness Score
    const readiness = calculateCareerReadinessScore({
      resumes,
      latestResumeAnalysis,
      codingSubmissions: submissions,
      placementSessions,
      placementStats,
      mockInterviews,
      roadmapTasks,
      completedRoadmapIds,
    });

    // Asynchronously record snapshot if score is valid
    if (readiness.overallScore !== null && effectiveId !== 'guest') {
      careerReadinessHistoryService.recordReadinessSnapshot(effectiveId, readiness).catch(() => {});
    }

    // 2. Compute Progress Analytics
    const analytics = calculateProgressAnalytics({
      studentId: effectiveId,
      timeRange: options.timeRange || 'all',
      submissions,
      placementSessions,
      mockInterviews,
      resumes,
      latestResumeAnalysis,
      roadmapTasks,
      completedRoadmapIds,
      studyPlans,
      dailyStudyTime,
      persistedReadinessHistory,
    });

    // 3. Generate Today's Focus
    const todaysFocus = generateTodaysFocus({
      studentId: effectiveId,
      submissions,
      placementSessions,
      mockInterviews,
      resumes,
      latestResumeAnalysis,
      roadmapTasks,
      completedRoadmapIds,
    });

    // 4. Compute Adaptive Learning Insights
    const adaptive = computeAdaptiveInsights({
      submissions,
      placementSessions,
      mockInterviews,
      latestResumeAnalysis,
    });

    // 5. Compute Interview Weakness Tracker
    const interviewWeakness = computeInterviewWeaknessData(mockInterviews);

    // 6. Compute Achievements
    const userAchievementsSummary = getUserAchievementsSummary(submissions, effectiveId);
    const safeAchievementsList = userAchievementsSummary?.achievements || [];
    const safeRecentlyUnlocked = safeAchievementsList.filter((a) => a.unlocked).slice(0, 3);

    const achievements = {
      unlockedCount: userAchievementsSummary?.unlockedCount || 0,
      totalCount: userAchievementsSummary?.totalCount || safeAchievementsList.length,
      items: safeAchievementsList.map((a) => ({
        id: a.id,
        title: a.name,
        description: a.description,
        iconName: a.icon || 'Award',
        category: (a.category === 'streak' ? 'streak' : a.category === 'problem_solving' ? 'coding' : a.category === 'placement' ? 'placement' : 'coding') as any,
        targetValue: a.requirement || a.maxProgress || 1,
        unit: 'challenges',
        badgeLevel: (a.requirement >= 50 ? 'Diamond' : a.requirement >= 25 ? 'Gold' : a.requirement >= 10 ? 'Silver' : 'Bronze') as any,
        color: '#3b82f6',
        isUnlocked: a.unlocked,
        unlockedAt: a.unlockedAt,
        currentValue: a.progress || 0,
        progressPercentage: a.maxProgress > 0 ? Math.min(100, Math.round((a.progress / a.maxProgress) * 100)) : (a.unlocked ? 100 : 0),
      })),
      recentlyUnlocked: safeRecentlyUnlocked.map((a) => ({
        id: a.id,
        title: a.name,
        description: a.description,
        iconName: a.icon || 'Award',
        category: (a.category === 'streak' ? 'streak' : a.category === 'problem_solving' ? 'coding' : a.category === 'placement' ? 'placement' : 'coding') as any,
        targetValue: a.requirement || a.maxProgress || 1,
        unit: 'challenges',
        badgeLevel: (a.requirement >= 50 ? 'Diamond' : a.requirement >= 25 ? 'Gold' : a.requirement >= 10 ? 'Silver' : 'Bronze') as any,
        color: '#3b82f6',
        isUnlocked: a.unlocked,
        unlockedAt: a.unlockedAt,
        currentValue: a.progress || 0,
        progressPercentage: a.maxProgress > 0 ? Math.min(100, Math.round((a.progress / a.maxProgress) * 100)) : (a.unlocked ? 100 : 0),
      })),
      lastCalculatedAt: new Date().toISOString(),
    };

    // 7. Generate Smart Alerts
    const smartAlerts = generateSmartAlerts({
      studentId: effectiveId,
      submissions,
      placementSessions,
      mockInterviews,
      resumes,
      latestResumeAnalysis,
      roadmapTasks,
      completedRoadmapIds,
      readinessScore: readiness.overallScore,
    });

    // 8. Generate Weekly Career Report
    const weeklyReport = generateWeeklyCareerReport({
      studentId: effectiveId,
      studentName: options.profile?.full_name || 'Student',
      targetRole: options.profile?.target_role || latestResumeAnalysis?.targetRole || 'Software Engineer',
      currentReadinessScore: readiness.overallScore,
      submissions,
      placementSessions,
      mockInterviews,
      resumes,
      latestResumeAnalysis,
      roadmapTasks,
      completedRoadmapIds,
      studyPlans,
    });

    const unified: UnifiedCareerIntelligence = {
      studentId: effectiveId,
      readiness,
      analytics,
      todaysFocus,
      adaptive,
      interviewWeakness,
      achievements,
      smartAlerts,
      weeklyReport,
      lastUpdated: new Date().toISOString(),
    };

    memoryCache.set(effectiveId, { data: unified, timestamp: now });
    return unified;
  }

  /**
   * Clear cache on new mutations (e.g. after code submission or interview completion)
   */
  public invalidateCache(studentId?: string): void {
    if (studentId) {
      memoryCache.delete(studentId);
    } else {
      memoryCache.clear();
    }
  }
}

export const careerIntelligenceService = new CareerIntelligenceServiceClass();

export const fetchCareerIntelligence = (
  studentId: string = 'guest',
  options: { forceRefresh?: boolean; profile?: any } = {}
): Promise<UnifiedCareerIntelligence> => careerIntelligenceService.getUnifiedIntelligence(studentId, options);
