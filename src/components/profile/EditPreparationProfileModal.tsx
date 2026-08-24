import React, { useState, useEffect } from 'react';
import {
  X,
  Brain,
  Code2,
  Cpu,
  UserCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';

interface EditPreparationProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREPARATION_LEVEL_OPTIONS = [
  'Beginner',
  'Developing',
  'Intermediate',
  'Advanced',
  'Placement Ready',
];

const CODING_LANGUAGE_OPTIONS = [
  'Java',
  'Python',
  'C++',
  'C',
  'JavaScript',
  'TypeScript',
  'Java / C++',
  'Python / Java',
  'Go',
  'Rust',
  'Other',
];

const DSA_PROFICIENCY_OPTIONS = [
  'Beginner',
  'Basic',
  'Intermediate',
  'Advanced',
];

const INTERVIEW_EXPERIENCE_OPTIONS = [
  'No Interview Experience',
  'Practiced Mock Interviews',
  'Attended Mock Interviews',
  'Real Interview Experience',
];

export const EditPreparationProfileModal: React.FC<EditPreparationProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, profile, setProfileState, refreshProfile, showToast } = useAuth();

  const [formData, setFormData] = useState({
    preparation_level: '',
    preferred_language: '',
    dsa_level: '',
    interview_experience: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing values for the authenticated student
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        preparation_level: profile?.preparation_level || '',
        preferred_language: profile?.preferred_language || '',
        dsa_level: profile?.dsa_level || '',
        interview_experience: profile?.interview_experience || '',
      });
      setFormError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, user, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setFormError('You must be logged in to update your preparation profile.');
      return;
    }

    setFormError(null);

    // Validation
    if (!formData.preparation_level.trim()) {
      setFormError('Please select your Preparation Level.');
      return;
    }

    if (!formData.preferred_language.trim()) {
      setFormError('Please select or specify your Coding Language.');
      return;
    }

    if (!formData.dsa_level.trim()) {
      setFormError('Please select your DSA Proficiency.');
      return;
    }

    if (!formData.interview_experience.trim()) {
      setFormError('Please select your Interview Experience.');
      return;
    }

    setIsSubmitting(true);

    try {
      const prepPayload = {
        preparation_level: formData.preparation_level.trim(),
        preferred_language: formData.preferred_language.trim(),
        dsa_level: formData.dsa_level.trim(),
        interview_experience: formData.interview_experience.trim(),
      };

      const { profile: updatedProfile, error } = await profileService.updateProfile(
        user.id,
        prepPayload
      );

      if (error) {
        setFormError(error.message || 'Failed to save preparation profile.');
      } else {
        setSuccessMessage('Preparation profile saved successfully!');
        if (updatedProfile) {
          setProfileState(updatedProfile);
        }
        await refreshProfile();
        showToast(
          'Preparation Profile Updated',
          'Your preparation details have been saved.',
          'success'
        );

        setTimeout(() => {
          onClose();
        }, 400);
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prep-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 id="prep-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Preparation Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your readiness level, coding preferences, and DSA proficiency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* 1. Preparation Level */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Preparation Level</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.preparation_level}
                onChange={(e) => setFormData({ ...formData, preparation_level: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-purple-500 focus:outline-none transition-colors"
                required
              >
                <option value="" disabled>Select your preparation level</option>
                {PREPARATION_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Coding Language */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Coding Language</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                placeholder="e.g. Java, Python, C++, Java / C++"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-purple-500 focus:outline-none transition-colors"
                required
              />
              <select
                aria-label="Select language suggestion"
                onChange={(e) => {
                  if (e.target.value && e.target.value !== 'Other') {
                    setFormData({ ...formData, preferred_language: e.target.value });
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>Or pick from standard languages...</option>
                {CODING_LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. DSA Proficiency */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>DSA Proficiency</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.dsa_level}
                onChange={(e) => setFormData({ ...formData, dsa_level: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-purple-500 focus:outline-none transition-colors"
                required
              >
                <option value="" disabled>Select your DSA proficiency</option>
                {DSA_PROFICIENCY_OPTIONS.map((dsa) => (
                  <option key={dsa} value={dsa}>
                    {dsa}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Interview Experience */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Interview Experience</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.interview_experience}
                onChange={(e) => setFormData({ ...formData, interview_experience: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-purple-500 focus:outline-none transition-colors"
                required
              >
                <option value="" disabled>Select your interview experience</option>
                {INTERVIEW_EXPERIENCE_OPTIONS.map((exp) => (
                  <option key={exp} value={exp}>
                    {exp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
