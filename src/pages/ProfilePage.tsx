import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Briefcase,
  Code2,
  Brain,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Mail,
  Phone,
  Building,
  Calendar,
  Hash,
  Award,
  MapPin,
  Sparkles,
  ArrowRight,
  Plus,
  X,
  Save,
  Loader2,
  ChevronRight,
  Compass,
  Github,
  Activity,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileService, calculateProfileCompletion, ProfileCompletionStatus } from '../services/profileService';
import { Profile, ProfileFormData } from '../types/database';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { EditAcademicModal } from '../components/profile/EditAcademicModal';
import { EditPlacementFocusModal } from '../components/profile/EditPlacementFocusModal';
import { EditPreparationProfileModal } from '../components/profile/EditPreparationProfileModal';
import { SendTestEmailCard } from '../components/common/SendTestEmailCard';
import { runPersistenceDiagnostics, CareerPilotDiagnosticReport } from '../services/diagnosticService';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, profile, refreshProfile, showToast } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [isPreparationModalOpen, setIsPreparationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'career' | 'skills' | 'security'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [diagReport, setDiagReport] = useState<CareerPilotDiagnosticReport | null>(null);
  const [isDiagRunning, setIsDiagRunning] = useState(false);
  const [showDiagModal, setShowDiagModal] = useState(false);

  const handleRunDiagnostics = async () => {
    setIsDiagRunning(true);
    try {
      const report = await runPersistenceDiagnostics();
      setDiagReport(report);
      setShowDiagModal(true);
    } catch (err: any) {
      console.error('Failed to run diagnostics:', err);
    } finally {
      setIsDiagRunning(false);
    }
  };

  const studentId = user?.id || profile?.id || '';

  // Local copy for quick tag updates
  const [localProfile, setLocalProfile] = useState<Partial<Profile>>({});
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newCompanyInput, setNewCompanyInput] = useState('');
  const [newLangInput, setNewLangInput] = useState('');

  useEffect(() => {
    if (profile) {
      setLocalProfile({ ...profile });
    }
  }, [profile]);

  const completion: ProfileCompletionStatus = calculateProfileCompletion(profile || (localProfile as ProfileFormData));

  // Determine login provider status from authenticated user credentials
  const providers = user?.app_metadata?.providers || [];
  const identities = user?.identities || [];
  const userMetadata = user?.user_metadata || {};

  const isGitHubConnected = Boolean(
    user?.app_metadata?.provider === 'github' ||
    providers.includes('github') ||
    identities.some((i: any) => i.provider === 'github')
  );

  const hasEmailPassword = Boolean(
    user?.app_metadata?.provider === 'email' ||
    providers.includes('email') ||
    identities.some((i: any) => i.provider === 'email') ||
    userMetadata.has_password === true ||
    userMetadata.email_login_enabled === true ||
    userMetadata.password_configured === true ||
    Boolean(userMetadata.password_updated_at)
  );

  // Quick skill badge addition
  const handleAddSkill = async (type: 'technical' | 'languages' | 'companies') => {
    if (!studentId) return;

    if (type === 'technical' && newSkillInput.trim()) {
      const updated = [...(localProfile.technical_skills || []), newSkillInput.trim()];
      const unique = Array.from(new Set(updated));
      setLocalProfile(prev => ({ ...prev, technical_skills: unique }));
      setNewSkillInput('');
      await profileService.updateProfile(studentId, { technical_skills: unique });
      refreshProfile();
      showToast('Skill Added', `${newSkillInput.trim()} added to your profile.`, 'success');
    } else if (type === 'languages' && newLangInput.trim()) {
      const updated = [...(localProfile.programming_languages || []), newLangInput.trim()];
      const unique = Array.from(new Set(updated));
      setLocalProfile(prev => ({ ...prev, programming_languages: unique }));
      setNewLangInput('');
      await profileService.updateProfile(studentId, { programming_languages: unique });
      refreshProfile();
      showToast('Language Added', `${newLangInput.trim()} added to your profile.`, 'success');
    } else if (type === 'companies' && newCompanyInput.trim()) {
      const updated = [...(localProfile.target_companies || []), newCompanyInput.trim()];
      const unique = Array.from(new Set(updated));
      setLocalProfile(prev => ({ ...prev, target_companies: unique }));
      setNewCompanyInput('');
      await profileService.updateProfile(studentId, { target_companies: unique });
      refreshProfile();
      showToast('Target Company Added', `${newCompanyInput.trim()} added to targets.`, 'success');
    }
  };

  const handleRemoveSkill = async (type: 'technical' | 'languages' | 'companies', item: string) => {
    if (!studentId) return;

    if (type === 'technical') {
      const updated = (localProfile.technical_skills || []).filter(s => s !== item);
      setLocalProfile(prev => ({ ...prev, technical_skills: updated }));
      await profileService.updateProfile(studentId, { technical_skills: updated });
      refreshProfile();
    } else if (type === 'languages') {
      const updated = (localProfile.programming_languages || []).filter(s => s !== item);
      setLocalProfile(prev => ({ ...prev, programming_languages: updated }));
      await profileService.updateProfile(studentId, { programming_languages: updated });
      refreshProfile();
    } else if (type === 'companies') {
      const updated = (localProfile.target_companies || []).filter(s => s !== item);
      setLocalProfile(prev => ({ ...prev, target_companies: updated }));
      await profileService.updateProfile(studentId, { target_companies: updated });
      refreshProfile();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <button
              onClick={() => onNavigate('dashboard')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Compass className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Student Profile</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Full Profile</span>
            </button>
          </div>
        </div>

        {/* Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl p-6 sm:p-8 transition-all">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/15 via-sky-500/10 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Left: Avatar & Identity */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg uppercase">
                  {profile?.full_name ? profile.full_name.charAt(0) : user?.email?.charAt(0) || 'S'}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-emerald-500 text-white shadow-sm border-2 border-white dark:border-slate-900" title="Active Student">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {profile?.full_name || 'Student Profile'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {profile?.degree || 'Engineering'}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span>{profile?.target_role || 'Target Role Not Set'}</span>
                  <span>•</span>
                  <span>{profile?.college_name || 'Campus Placement Candidate'}</span>
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user?.email || profile?.email || 'Registered Email'}</span>
                  </span>
                  {profile?.usn && (
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>USN: {profile.usn}</span>
                    </span>
                  )}
                  {profile?.department && (
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.department}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Profile Completion Meter */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shrink-0 w-full md:w-auto min-w-[240px]">
              <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-slate-200 dark:stroke-slate-700"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-indigo-600 dark:stroke-indigo-400 transition-all duration-700"
                    strokeWidth="3.5"
                    strokeDasharray={`${completion.percentage}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-800 dark:text-slate-100">
                  {completion.percentage}%
                </span>
              </div>

              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Profile Completion
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {completion.completedFieldsCount} of {completion.totalFieldsCount} key sections set
                </div>
                {completion.missingFields.length > 0 && (
                  <button
                    onClick={() => {
                      if (completion.missingFields[0]?.section === 'Academic') {
                        setIsAcademicModalOpen(true);
                      } else if (completion.missingFields[0]?.section === 'Career') {
                        setIsPlacementModalOpen(true);
                      } else if (completion.missingFields[0]?.section === 'Preparation') {
                        setIsPreparationModalOpen(true);
                      } else {
                        setIsEditModalOpen(true);
                      }
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Add {completion.missingFields[0].label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/80 mt-6 pt-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'academic', label: 'Academic Details', icon: GraduationCap },
              { id: 'career', label: 'Career Strategy', icon: Briefcase },
              { id: 'skills', label: 'Skills & DSA', icon: Code2 },
              { id: 'security', label: 'Account & Security', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Academic Snapshot */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  <span>Academic Standing</span>
                </h3>
                <button
                  onClick={() => setIsAcademicModalOpen(true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">College</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{profile?.college_name || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Degree & Branch</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile?.degree || 'Not provided'} • {profile?.department || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Semester</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile?.semester ? `Semester ${profile.semester}` : 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">USN</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{profile?.usn || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Graduation Year</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile?.graduation_year ? `Class of ${profile.graduation_year}` : 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Cumulative GPA (CGPA)</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {profile?.cgpa ? `${profile.cgpa}` : 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Career Targets */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  <span>Placement Focus</span>
                </h3>
                <button
                  onClick={() => setIsPlacementModalOpen(true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Target Role</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{profile?.target_role || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Preferred Domain</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{profile?.preferred_domain || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Preferred Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{profile?.preferred_location || 'Not set'}</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <span className="text-slate-500">Target Companies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.target_companies && profile.target_companies.length > 0) ? (
                      profile.target_companies.map((comp) => (
                        <span key={comp} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {comp}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">No target companies specified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preparation Profile */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span>Preparation Profile</span>
                </h3>
                <button
                  onClick={() => setIsPreparationModalOpen(true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Preparation Level</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{profile?.preparation_level || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Coding Language</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{profile?.preferred_language || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">DSA Proficiency</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{profile?.dsa_level || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Interview Experience</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{profile?.interview_experience || 'Not set'}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Academic Details */}
        {activeTab === 'academic' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Academic & Institutional Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your university credentials, department, and academic records
                </p>
              </div>
              <button
                onClick={() => setIsAcademicModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Update Academic Info</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-500">College / University</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{profile?.college_name || 'Not provided'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-500">Degree Program</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{profile?.degree || 'Not provided'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-500">Branch / Department</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{profile?.department || 'Not provided'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-500">University Seat Number (USN)</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{profile?.usn || 'Not provided'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-500">Current Semester</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {profile?.semester ? `Semester ${profile.semester}` : 'Not provided'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-500">Graduation Year</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {profile?.graduation_year ? `Class of ${profile.graduation_year}` : 'Not provided'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-500">Cumulative GPA (CGPA)</span>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {profile?.cgpa ? `${profile.cgpa}` : 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Career Strategy */}
        {activeTab === 'career' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Career Goals & Target Companies
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Target job profiles, companies, and compensation expectations
                </p>
              </div>
              <button
                onClick={() => setIsPlacementModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Career Goals</span>
              </button>
            </div>

            {/* Target Companies Chips */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Companies & Dream Recruiters
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {(localProfile.target_companies || []).map((comp) => (
                  <span
                    key={comp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    <span>{comp}</span>
                    <button
                      onClick={() => handleRemoveSkill('companies', comp)}
                      className="hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Add company (e.g. Google)..."
                    value={newCompanyInput}
                    onChange={(e) => setNewCompanyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill('companies');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleAddSkill('companies')}
                    className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    title="Add Company"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Career Vision */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Career Goal & Vision Statement</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {profile?.career_goal || 'Aspiring to excel in product engineering and solve real-world problems with scalable architectures.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Skills & DSA */}
        {activeTab === 'skills' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Skills Matrix & Technical Arsenal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Languages, core technical subjects, and interview readiness
                </p>
              </div>
              <button
                onClick={() => setIsPreparationModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-100 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Preparation Profile</span>
              </button>
            </div>

            {/* Programming Languages */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Programming Languages
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {(localProfile.programming_languages || ['Java', 'Python', 'C++', 'JavaScript']).map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    <span>{lang}</span>
                    <button
                      onClick={() => handleRemoveSkill('languages', lang)}
                      className="hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Add language..."
                    value={newLangInput}
                    onChange={(e) => setNewLangInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill('languages');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleAddSkill('languages')}
                    className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Technical Skills */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Core Technical Skills & Domains
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {(localProfile.technical_skills || ['Data Structures', 'Algorithms', 'DBMS & SQL', 'Operating Systems', 'System Design']).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill('technical', skill)}
                      className="hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Add technical skill..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill('technical');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    onClick={() => handleAddSkill('technical')}
                    className="p-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Account & Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Authentication & Login Methods
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Security settings and connected sign-in credentials for your student account
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Manage Credentials</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Email & Password */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Email & Password</span>
                      <p className="text-[11px] text-slate-500">{user?.email || 'Protected account email'}</p>
                    </div>
                  </div>
                  {hasEmailPassword ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                    >
                      Configure
                    </button>
                  )}
                </div>

                {/* GitHub Provider */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300">
                      <Github className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">GitHub Login</span>
                      <p className="text-[11px] text-slate-500">OAuth integration</p>
                    </div>
                  </div>
                  {isGitHubConnected ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Connected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                      Not Linked
                    </span>
                  )}
                </div>

                {/* Session & RLS Security */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Session Security</span>
                      <p className="text-[11px] text-slate-500">Supabase Auth & RLS</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                {/* Cloud Persistence & Supabase Synchronization Diagnostics */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Cloud Persistence Diagnostics</span>
                      <p className="text-[11px] text-slate-500">Verify Supabase tables, records count, and cross-device sync status</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRunDiagnostics}
                    disabled={isDiagRunning}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isDiagRunning ? 'animate-spin' : ''}`} />
                    <span>{isDiagRunning ? 'Checking...' : 'Run Diagnostics'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Email Notifications Placeholder */}
            <SendTestEmailCard />
          </div>
        )}

      </div>

      {/* Persistence Diagnostics Modal */}
      {showDiagModal && diagReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    CareerPilot Persistence Diagnostics
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live Supabase Database & Auth State Inspection
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnostic Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                <div className="text-slate-400 font-medium">Environment</div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{diagReport.environment}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                <div className="text-slate-400 font-medium">Auth User ID</div>
                <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate" title={diagReport.authenticatedUserId || 'None'}>
                  {diagReport.authenticatedUserId || 'Unauthenticated'}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                <div className="text-slate-400 font-medium">Authenticated Email</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {diagReport.authenticatedEmail || 'N/A'}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                <div className="text-slate-400 font-medium">Overall Persistence Status</div>
                <div className={`font-bold uppercase tracking-wider text-[11px] ${
                  diagReport.overallStatus === 'healthy'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : diagReport.overallStatus === 'degraded'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {diagReport.overallStatus}
                </div>
              </div>
            </div>

            {/* Table-by-Table Verification */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Supabase Tables & Records Count
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                {diagReport.modules.map((m) => (
                  <div key={m.table} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{m.module}</div>
                      <div className="font-mono text-[10px] text-slate-400">Table: {m.table}</div>
                      {m.errorDetails && (
                        <div className="text-[10px] text-rose-500 dark:text-rose-400">{m.errorDetails}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {m.count} records
                      </span>
                      {m.status === 'ok' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : m.status === 'empty' ? (
                        <span className="text-[10px] text-amber-500 font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50">Empty</span>
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {diagReport.warnings.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 space-y-1">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-300">Diagnostic Warnings</div>
                <ul className="text-xs text-amber-700 dark:text-amber-400 list-disc list-inside space-y-0.5">
                  {diagReport.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  handleRunDiagnostics();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Re-test Connection
              </button>
              <button
                onClick={() => setShowDiagModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Focused Academic Info Modal */}
      {isAcademicModalOpen && (
        <EditAcademicModal
          isOpen={isAcademicModalOpen}
          onClose={() => {
            setIsAcademicModalOpen(false);
            refreshProfile();
          }}
        />
      )}

      {/* Focused Placement Focus Modal */}
      {isPlacementModalOpen && (
        <EditPlacementFocusModal
          isOpen={isPlacementModalOpen}
          onClose={() => {
            setIsPlacementModalOpen(false);
            refreshProfile();
          }}
        />
      )}

      {/* Focused Preparation Profile Modal */}
      {isPreparationModalOpen && (
        <EditPreparationProfileModal
          isOpen={isPreparationModalOpen}
          onClose={() => {
            setIsPreparationModalOpen(false);
            refreshProfile();
          }}
        />
      )}

      {/* Full Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            refreshProfile();
          }}
        />
      )}
    </div>
  );
};
