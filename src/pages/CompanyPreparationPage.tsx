import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Sparkles,
  RefreshCw,
  BookmarkPlus,
  Compass,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { CompanySelector } from '../components/companyPrep/CompanySelector';
import { CompanyProfileCard } from '../components/companyPrep/CompanyProfileCard';
import { ReadinessScoreCard } from '../components/companyPrep/ReadinessScoreCard';
import { PreparationProgressBar } from '../components/companyPrep/PreparationProgressBar';
import { WeakAndStrongAreas } from '../components/companyPrep/WeakAndStrongAreas';
import { PreparationPlanList } from '../components/companyPrep/PreparationPlanList';
import { CompanyTargetsList } from '../components/companyPrep/CompanyTargetsList';
import {
  getStudentTargets,
  saveStudentTarget,
  deleteStudentTarget,
  getActiveStudentTarget,
  setActiveTargetId,
} from '../services/companyPrepStorage';
import { calculateCompanyReadiness } from '../services/companyPrepEngine';
import { CompanyReadinessAnalysis, StudentTargetCompany } from '../types/companyPrep';
import { POPULAR_COMPANY_PROFILES } from '../data/companyProfiles';
import { recordGapAction } from '../services/gapTrackerService';

interface CompanyPreparationPageProps {
  onNavigate: (route: string) => void;
}

export const CompanyPreparationPage: React.FC<CompanyPreparationPageProps> = ({
  onNavigate,
}) => {
  const { user, profile } = useAuth();
  const studentId = user?.id || 'guest';

  // Selection states
  const [selectedCompany, setSelectedCompany] = useState<string>('Google');
  const [isCustomCompany, setIsCustomCompany] = useState<boolean>(false);
  const [customCompanyName, setCustomCompanyName] = useState<string>('');

  const [selectedRole, setSelectedRole] = useState<string>('Software Developer');
  const [isCustomRole, setIsCustomRole] = useState<boolean>(false);
  const [customRoleName, setCustomRoleName] = useState<string>('');

  // Target list & Analysis state
  const [savedTargets, setSavedTargets] = useState<StudentTargetCompany[]>([]);
  const [activeTargetId, setActiveTargetState] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CompanyReadinessAnalysis | null>(() => {
    try {
      const cached = localStorage.getItem(`careerpilot_company_readiness_${studentId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_) {}
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => !analysis);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [sourceContext, setSourceContext] = useState<string | null>(null);

  // Parse source query param on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sourceParam = searchParams.get('source');
    if (sourceParam) {
      setSourceContext(sourceParam);
    }
  }, []);

  // Initialize targets and active selection
  useEffect(() => {
    const targets = getStudentTargets(studentId);
    setSavedTargets(targets);

    const active = getActiveStudentTarget(studentId);
    if (active) {
      setActiveTargetState(active.id);
      setSelectedCompany(active.companyName);
      setIsCustomCompany(active.isCustomCompany);
      if (active.isCustomCompany) {
        setCustomCompanyName(active.companyName);
      }
      setSelectedRole(active.targetRole);
      setIsCustomRole(active.isCustomRole);
      if (active.isCustomRole) {
        setCustomRoleName(active.targetRole);
      }
    } else {
      // Default to Google / Software Developer
      setSelectedCompany('Google');
      setSelectedRole(profile?.target_role || 'Software Developer');
    }
  }, [studentId, profile]);

  // Compute Company Readiness when company or role changes (stale-while-revalidate)
  const loadAnalysis = useCallback(async () => {
    try {
      const companyName = isCustomCompany ? (customCompanyName || 'Custom Company') : selectedCompany;
      const roleName = isCustomRole ? (customRoleName || 'Custom Role') : selectedRole;

      const result = await calculateCompanyReadiness(companyName, roleName, studentId);
      setAnalysis(result);
      try {
        localStorage.setItem(`careerpilot_company_readiness_${studentId}`, JSON.stringify(result));
      } catch (_) {}
    } catch (err) {
      console.error('[CompanyPrep] Error calculating readiness:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCompany, isCustomCompany, customCompanyName, selectedRole, isCustomRole, customRoleName, studentId]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAnalysis();
  };

  const handleCompanyChange = (company: string, isCustom: boolean, customName?: string) => {
    setSelectedCompany(company);
    setIsCustomCompany(isCustom);
    if (customName !== undefined) {
      setCustomCompanyName(customName);
    }
  };

  const handleRoleChange = (role: string, isCustom: boolean, customName?: string) => {
    setSelectedRole(role);
    setIsCustomRole(isCustom);
    if (customName !== undefined) {
      setCustomRoleName(customName);
    }
  };

  // Check if current target is already saved
  const currentCompanyName = isCustomCompany ? (customCompanyName || 'Custom Company') : selectedCompany;
  const currentRoleName = isCustomRole ? (customRoleName || 'Custom Role') : selectedRole;

  const isCurrentTargetSaved = savedTargets.some(
    (t) =>
      t.companyName.toLowerCase() === currentCompanyName.toLowerCase() &&
      t.targetRole.toLowerCase() === currentRoleName.toLowerCase()
  );

  const handleSaveTarget = () => {
    const newTarget: StudentTargetCompany = {
      id: `target_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId,
      companyName: currentCompanyName,
      isCustomCompany,
      targetRole: currentRoleName,
      isCustomRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveStudentTarget(newTarget, studentId);
    const updated = getStudentTargets(studentId);
    setSavedTargets(updated);
    setActiveTargetState(newTarget.id);
  };

  const handleSelectActiveTarget = (target: StudentTargetCompany) => {
    setActiveTargetId(target.id, studentId);
    setActiveTargetState(target.id);
    setSelectedCompany(target.companyName);
    setIsCustomCompany(target.isCustomCompany);
    if (target.isCustomCompany) {
      setCustomCompanyName(target.companyName);
    }
    setSelectedRole(target.targetRole);
    setIsCustomRole(target.isCustomRole);
    if (target.isCustomRole) {
      setCustomRoleName(target.targetRole);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTarget = (targetId: string) => {
    deleteStudentTarget(targetId, studentId);
    const updated = getStudentTargets(studentId);
    setSavedTargets(updated);
    const active = getActiveStudentTarget(studentId);
    setActiveTargetState(active ? active.id : null);
  };

  const handleAddNewTarget = () => {
    setSelectedCompany('Google');
    setIsCustomCompany(false);
    setCustomCompanyName('');
    setSelectedRole('Software Developer');
    setIsCustomRole(false);
    setCustomRoleName('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Direct Action Handler linking to existing modules with pre-filled context
  const handleNavigateToModule = (route: string, params?: Record<string, any>) => {
    // Record action taken on gap for authentic tracking
    if (params?.gapId) {
      recordGapAction(
        studentId,
        params.gapId,
        params.topic || params.subject || '',
        route,
        params.gapType || 'mcq',
        {
          company: params.company,
          role: params.role,
        }
      );
    }

    if (route === 'coding') {
      if (params) {
        const q = new URLSearchParams();
        q.set('source', 'company-preparation');
        if (params.subject) q.set('subject', params.subject);
        if (params.topic) q.set('topic', params.topic);
        if (params.difficulty) q.set('difficulty', params.difficulty || 'Medium');
        if (params.company) q.set('company', params.company);
        if (params.role) q.set('role', params.role);
        if (params.auto) q.set('auto', 'true');
        const queryStr = q.toString();
        onNavigate(queryStr ? `coding?${queryStr}` : 'coding');
      } else {
        onNavigate('coding?source=company-preparation');
      }
    } else if (route === 'placement') {
      if (params) {
        const q = new URLSearchParams();
        q.set('source', 'company-preparation');
        if (params.category) q.set('category', params.category);
        if (params.subject) q.set('subject', params.subject);
        if (params.topic) q.set('topic', params.topic);
        if (params.topics) {
          if (Array.isArray(params.topics)) {
            q.set('topics', params.topics.join(','));
          } else {
            q.set('topics', String(params.topics));
          }
        }
        if (params.difficulty) q.set('difficulty', params.difficulty || 'Medium');
        if (params.company) q.set('company', params.company);
        if (params.role) q.set('role', params.role);
        if (params.auto) q.set('auto', 'true');
        const queryStr = q.toString();
        onNavigate(queryStr ? `placement?${queryStr}` : 'placement');
      } else {
        onNavigate('placement?source=company-preparation');
      }
    } else if (route === 'interview') {
      if (params) {
        const q = new URLSearchParams();
        q.set('source', 'company-preparation');
        if (params.type) q.set('type', params.type);
        if (params.subject) q.set('subject', params.subject);
        if (params.topic) q.set('topic', params.topic);
        if (params.company) q.set('company', params.company);
        if (params.role) q.set('role', params.role);
        if (params.auto) q.set('auto', 'true');
        const queryStr = q.toString();
        onNavigate(queryStr ? `interview?${queryStr}` : 'interview');
      } else {
        onNavigate('interview?source=company-preparation');
      }
    } else if (route === 'resume-analyzer') {
      onNavigate('resume-analyzer?source=company-preparation');
    } else if (route === 'roadmap') {
      onNavigate('roadmap?source=company-preparation');
    } else {
      onNavigate(route);
    }
  };

  if (loading || !analysis) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Analyzing Company Hiring Requirements & Real Readiness...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Contextual Back Navigation */}
      {sourceContext === 'roadmap' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('roadmap')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors shadow-2xs cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Roadmap</span>
          </button>
        </div>
      )}

      {(sourceContext === 'preparation-dashboard' || sourceContext === 'dashboard' || sourceContext === 'prep-dashboard') && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors shadow-2xs cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Preparation Dashboard</span>
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              Placement Preparation Hub
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Deterministic Skill Evaluation
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Company Preparation</span>
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Prepare for your target company's placement process with a personalized, real-time preparation plan connected to your CareerPilot activity.
          </p>
        </div>

        {/* Refresh & Quick Links */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isRefreshing ? 'Recalculating...' : 'Refresh Score'}</span>
          </button>
        </div>
      </div>

      {/* 1. Target Company & Role Selection Card */}
      <CompanySelector
        selectedCompany={selectedCompany}
        isCustomCompany={isCustomCompany}
        customCompanyName={customCompanyName}
        selectedRole={selectedRole}
        isCustomRole={isCustomRole}
        customRoleName={customRoleName}
        onCompanyChange={handleCompanyChange}
        onRoleChange={handleRoleChange}
        onSaveAsTarget={handleSaveTarget}
        isSaved={isCurrentTargetSaved}
      />

      {/* 2. Overall Company Readiness Metric Hero Card */}
      <ReadinessScoreCard analysis={analysis} />

      {/* 3. Target Company Overview & Hiring Process */}
      <CompanyProfileCard
        company={analysis.company}
        targetRole={analysis.targetRole}
      />

      {/* 4. Category-Wise Progress Bars (Resume, Coding, Aptitude, MCQs, Interview) */}
      <PreparationProgressBar
        categories={analysis.categories}
        onNavigateToModule={handleNavigateToModule}
      />

      {/* 5. Personalized Preparation Priorities */}
      <PreparationPlanList
        priorities={analysis.priorities}
        hasSufficientData={analysis.hasSufficientData}
        onNavigateToModule={handleNavigateToModule}
      />

      {/* 6. Skill Gap Analysis: Strong & Improving Areas */}
      <WeakAndStrongAreas
        strongAreas={analysis.strongAreas}
        improvingAreas={analysis.improvingAreas}
        hasSufficientData={analysis.hasSufficientData}
        onNavigateToModule={handleNavigateToModule}
      />

      {/* 7. My Saved Target Companies */}
      <CompanyTargetsList
        targets={savedTargets}
        activeTargetId={activeTargetId}
        onSelectActiveTarget={handleSelectActiveTarget}
        onDeleteTarget={handleDeleteTarget}
        onAddNewTarget={handleAddNewTarget}
      />

    </div>
  );
};
