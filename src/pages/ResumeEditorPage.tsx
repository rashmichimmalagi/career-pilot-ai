import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, FileText, Plus, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resumeService } from '../services/resumeService';
import { ResumeVersionItem } from '../types/resume';
import { LiveResumeEditor } from '../components/resume/LiveResumeEditor';

interface ResumeEditorPageProps {
  onNavigate: (page: string) => void;
  resumeId?: string | null;
}

export const ResumeEditorPage: React.FC<ResumeEditorPageProps> = ({
  onNavigate,
  resumeId,
}) => {
  const { user, profile, showToast } = useAuth();
  const effectiveUserId = profile?.id || user?.id || 'guest';

  const [resumes, setResumes] = useState<ResumeVersionItem[]>([]);
  const [activeResume, setActiveResume] = useState<ResumeVersionItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch all user resumes from Supabase
  const loadUserResumes = useCallback(async () => {
    try {
      setLoading(true);
      const list = await resumeService.getUserResumes(effectiveUserId);
      setResumes(list);

      // Select target resume: explicit query param ID, or current resume, or first resume
      let target: ResumeVersionItem | null = null;
      if (resumeId) {
        target = list.find((r) => r.id === resumeId) || null;
      }
      if (!target) {
        target = list.find((r) => r.isCurrent) || list[0] || null;
      }

      // If user has zero resumes, create a starter resume version
      if (!target) {
        const starterData = resumeService.parseResumeTextToStructured(
          '',
          'Software Developer'
        );
        starterData.fullName = profile?.full_name || 'Candidate Name';
        starterData.contactInfo.email = user?.email || '';

        const newStarter: ResumeVersionItem = {
          id: `resume_v1_${Date.now()}`,
          userId: effectiveUserId,
          version: 1,
          versionLabel: 'Resume_v1 (Live Editor)',
          fileName: 'CareerPilot_Resume_v1.pdf',
          isCurrent: true,
          targetRole: 'Software Developer',
          resumeText: resumeService.generateMarkdownFromStructured(starterData),
          resumeType: 'ai_generated',
          isAiImproved: false,
          structuredData: starterData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const savedStarter = await resumeService.saveResumeVersion(newStarter);
        target = savedStarter;
        setResumes([savedStarter]);
      }

      setActiveResume(target);
    } catch (err: any) {
      console.error('[Resume Editor Page] Failed to load resumes:', err);
      showToast('Error Loading', 'Failed to load resume versions from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, resumeId, profile, user, showToast]);

  useEffect(() => {
    loadUserResumes();
  }, [loadUserResumes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-800 dark:text-slate-200 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-400">
          Loading Live Resume Editor...
        </p>
      </div>
    );
  }

  if (!activeResume) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          No Resume Selected
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          Could not find the requested resume version. Return to the Resume Analyzer to upload or create one.
        </p>
        <button
          onClick={() => onNavigate('resume-analyzer')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
        >
          Go to Resume Analyzer
        </button>
      </div>
    );
  }

  return (
    <LiveResumeEditor
      initialResume={activeResume}
      userResumes={resumes}
      onSelectResume={(resume) => setActiveResume(resume)}
      onBack={() => onNavigate('resume-analyzer')}
      onRefreshResumes={loadUserResumes}
    />
  );
};
