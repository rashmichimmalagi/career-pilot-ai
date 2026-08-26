import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { RoadmapHeader } from '../components/roadmap/RoadmapHeader';
import { RoadmapReadinessCard } from '../components/roadmap/RoadmapReadinessCard';
import { RoadmapPhasesView } from '../components/roadmap/RoadmapPhasesView';
import { DailyTasksCard } from '../components/roadmap/DailyTasksCard';
import { RoadmapStrengthsAndGaps } from '../components/roadmap/RoadmapStrengthsAndGaps';
import { generatePersonalizedRoadmap } from '../services/roadmapEngine';
import {
  getCustomTargetRole,
  setCustomTargetRole,
  toggleCompletedItemId,
  toggleStoredTask,
} from '../services/roadmapStorage';
import { CareerRoadmapAnalysis } from '../types/roadmap';

interface CareerRoadmapPageProps {
  onNavigate: (route: string) => void;
}

export const CareerRoadmapPage: React.FC<CareerRoadmapPageProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const studentId = user?.id || 'guest';

  const [analysis, setAnalysis] = useState<CareerRoadmapAnalysis | null>(() => {
    try {
      const cached = localStorage.getItem(`careerpilot_roadmap_cache_${studentId}`);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => !analysis);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [targetRoleOverride, setTargetRoleOverride] = useState<string | undefined>(undefined);
  const [sourceContext, setSourceContext] = useState<string | null>(null);

  // Check URL query parameters on mount to determine navigation context
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sourceParam = searchParams.get('source');
    if (sourceParam) {
      setSourceContext(sourceParam);
    }
  }, []);

  // Load Roadmap
  const loadRoadmap = useCallback(async (roleOverride?: string) => {
    try {
      const activeRole = roleOverride || targetRoleOverride || getCustomTargetRole(studentId) || profile?.target_role;
      const result = await generatePersonalizedRoadmap(studentId, activeRole);
      setAnalysis(result);
      try {
        localStorage.setItem(`careerpilot_roadmap_cache_${studentId}`, JSON.stringify(result));
      } catch (_) {}
    } catch (err) {
      console.error('[Roadmap] Error generating roadmap:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [studentId, profile?.target_role, targetRoleOverride]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRoadmap();
  };

  const handleRoleChange = (newRole: string) => {
    setCustomTargetRole(studentId, newRole);
    setTargetRoleOverride(newRole);
    setIsRefreshing(true);
    loadRoadmap(newRole);
  };

  const handleToggleItem = (itemId: string) => {
    const updatedCompletedIds = toggleCompletedItemId(studentId, itemId);
    setAnalysis((prev) => {
      if (!prev) return prev;
      const updatedPhases = prev.phases.map((phase) => {
        const updatedItems = phase.items.map((it) => ({
          ...it,
          isCompleted: updatedCompletedIds.includes(it.id),
        }));
        const completedCount = updatedItems.filter((it) => it.isCompleted).length;
        const percent = updatedItems.length > 0 ? Math.round((completedCount / updatedItems.length) * 100) : 0;
        return {
          ...phase,
          items: updatedItems,
          completionPercentage: percent,
          status: (percent === 100 ? 'completed' : percent > 0 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming',
        };
      });
      const nextAnalysis = {
        ...prev,
        phases: updatedPhases,
      };
      try {
        localStorage.setItem(`careerpilot_roadmap_cache_${studentId}`, JSON.stringify(nextAnalysis));
      } catch (_) {}
      return nextAnalysis;
    });
  };

  const handleToggleDailyTask = (taskId: string) => {
    const updatedTasks = toggleStoredTask(studentId, taskId);
    setAnalysis((prev) => {
      if (!prev) return prev;
      const nextAnalysis = {
        ...prev,
        dailyTasks: updatedTasks,
      };
      try {
        localStorage.setItem(`careerpilot_roadmap_cache_${studentId}`, JSON.stringify(nextAnalysis));
      } catch (_) {}
      return nextAnalysis;
    });
  };

  // Safe navigation with complete query string builder and explicit source context
  const handleNavigateToModule = (route: string, params?: Record<string, any>) => {
    if (route === 'coding') {
      const q = new URLSearchParams();
      q.set('source', 'roadmap');
      if (params) {
        if (params.subject) q.set('subject', params.subject);
        if (params.topic) q.set('topic', params.topic);
        if (params.difficulty) q.set('difficulty', params.difficulty);
        if (params.company) q.set('company', params.company);
        if (params.role) q.set('role', params.role);
        if (params.auto !== false) q.set('auto', 'true');
      }
      onNavigate(`coding?${q.toString()}`);
    } else if (route === 'placement') {
      const q = new URLSearchParams();
      q.set('source', 'roadmap');
      if (params) {
        if (params.category) q.set('category', params.category);
        if (params.domain) q.set('domain', params.domain);
        if (params.subject) q.set('subject', params.subject);
        if (params.topic) q.set('topic', params.topic);
        if (params.topics) {
          if (Array.isArray(params.topics)) {
            q.set('topics', params.topics.join(', '));
          } else {
            q.set('topics', String(params.topics));
          }
        }
        if (params.difficulty) q.set('difficulty', params.difficulty);
        if (params.questionCount) q.set('questionCount', String(params.questionCount));
        if (params.mode) q.set('mode', params.mode);
        if (params.company) q.set('company', params.company);
        if (params.role) q.set('role', params.role);
        if (params.roadmapItemId) q.set('roadmapItemId', params.roadmapItemId);
        if (params.taskId) q.set('taskId', params.taskId);
        if (params.auto !== false) q.set('auto', 'true');
      }
      onNavigate(`placement?${q.toString()}`);
    } else if (route === 'interview') {
      const q = new URLSearchParams();
      q.set('source', 'roadmap');
      if (params) {
        if (params.type) q.set('type', params.type);
        if (params.subject) q.set('subject', params.subject);
        if (params.topic) q.set('topic', params.topic);
        if (params.difficulty) q.set('difficulty', params.difficulty);
        if (params.company) q.set('company', params.company);
        if (params.role) q.set('role', params.role);
        if (params.auto !== false) q.set('auto', 'true');
      }
      onNavigate(`interview?${q.toString()}`);
    } else if (route === 'resume-analyzer') {
      onNavigate('resume-analyzer?source=roadmap');
    } else if (route === 'company-prep') {
      onNavigate('company-prep?source=roadmap');
    } else {
      if (route.includes('?')) {
        onNavigate(`${route}&source=roadmap`);
      } else {
        onNavigate(`${route}?source=roadmap`);
      }
    }
  };

  if (loading || !analysis) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Analyzing Performance Across All Modules to Build Your Career Roadmap...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* 1. Header & Target Role Switcher */}
      <RoadmapHeader
        targetRole={analysis.targetRole}
        targetCompany={analysis.targetCompany}
        onRoleChange={handleRoleChange}
        onNavigateToCompanyPrep={() => onNavigate('company-prep?source=roadmap')}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={analysis.lastUpdated}
        sourceContext={sourceContext}
        onBackToDashboard={() => onNavigate('dashboard')}
        onBackToCompanyPrep={() => onNavigate('company-prep')}
      />

      {/* 2. Overall Readiness Barometer & Category Breakdown */}
      <RoadmapReadinessCard
        analysis={analysis}
        onNavigateToModule={handleNavigateToModule}
      />

      {/* 3. Today's Actionable Tasks */}
      <DailyTasksCard
        tasks={analysis.dailyTasks}
        onToggleTask={handleToggleDailyTask}
        onNavigateToModule={handleNavigateToModule}
      />

      {/* 4. Phased Step-by-Step Roadmap */}
      <RoadmapPhasesView
        phases={analysis.phases}
        onToggleItem={handleToggleItem}
        onNavigateToModule={handleNavigateToModule}
      />

      {/* 5. Validated Strengths & Priority Gaps */}
      <RoadmapStrengthsAndGaps
        analysis={analysis}
        onNavigateToModule={handleNavigateToModule}
      />
    </div>
  );
};
