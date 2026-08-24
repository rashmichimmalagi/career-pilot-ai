import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  Layers,
  MapPin,
  Building2,
  Plus,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';

interface EditPlacementFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TARGET_ROLE_OPTIONS = [
  'Software Engineer',
  'Full Stack Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'Cloud / DevOps Engineer',
  'Data Analyst',
  'Data Scientist',
  'AI / ML Engineer',
  'Cybersecurity Analyst',
  'Mobile App Developer (iOS / Android)',
  'Embedded Systems Engineer',
  'Quality Assurance / SDET',
  'Product Manager / Associate PM',
  'Systems Engineer',
];

const DOMAIN_OPTIONS = [
  'Full Stack / Cloud',
  'Web Development',
  'Mobile App Development',
  'Artificial Intelligence & Machine Learning',
  'Data Science & Analytics',
  'Cloud Computing & DevOps',
  'Cybersecurity & Network Defense',
  'Distributed Systems & Backend Infrastructure',
  'Embedded Systems & IoT',
  'Fintech & Payment Systems',
  'E-Commerce & Digital Platforms',
  'Healthcare Tech',
  'Enterprise Software',
];

const LOCATION_OPTIONS = [
  'Bangalore / Remote',
  'Bangalore',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Delhi NCR (Gurgaon / Noida)',
  'Chennai',
  'Kolkata',
  'Remote (Worldwide / India)',
  'Hybrid (Bangalore / Hyderabad)',
];

const POPULAR_COMPANIES = [
  'Google',
  'Microsoft',
  'Amazon',
  'Adobe',
  'Cisco',
  'Oracle',
  'Salesforce',
  'Flipkart',
  'Atlassian',
  'Uber',
  'Goldman Sachs',
  'Morgan Stanley',
  'Infosys',
  'TCS',
  'Wipro',
  'Accenture',
];

export const EditPlacementFocusModal: React.FC<EditPlacementFocusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, profile, setProfileState, refreshProfile, showToast } = useAuth();

  const [formData, setFormData] = useState({
    target_role: '',
    preferred_domain: '',
    preferred_location: '',
  });

  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [newCompanyInput, setNewCompanyInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing placement profile values for the authenticated student
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        target_role: profile?.target_role || '',
        preferred_domain: profile?.preferred_domain || '',
        preferred_location: profile?.preferred_location || '',
      });
      setTargetCompanies(
        Array.isArray(profile?.target_companies) ? [...profile.target_companies] : []
      );
      setNewCompanyInput('');
      setFormError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, user, profile]);

  if (!isOpen) return null;

  const handleAddCompany = (companyToAdd?: string) => {
    const name = (companyToAdd || newCompanyInput).trim();
    if (!name) return;

    if (!targetCompanies.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setTargetCompanies((prev) => [...prev, name]);
    }
    setNewCompanyInput('');
  };

  const handleRemoveCompany = (companyToRemove: string) => {
    setTargetCompanies((prev) => prev.filter((c) => c !== companyToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setFormError('You must be logged in to update your placement focus.');
      return;
    }

    setFormError(null);

    // Validation
    if (!formData.target_role.trim()) {
      setFormError('Please select or specify your Target Role.');
      return;
    }

    if (!formData.preferred_domain.trim()) {
      setFormError('Please select or specify your Preferred Domain.');
      return;
    }

    if (!formData.preferred_location.trim()) {
      setFormError('Please select or specify your Preferred Location.');
      return;
    }

    setIsSubmitting(true);

    try {
      const placementPayload = {
        target_role: formData.target_role.trim(),
        preferred_domain: formData.preferred_domain.trim(),
        preferred_location: formData.preferred_location.trim(),
        target_companies: targetCompanies,
      };

      const { profile: updatedProfile, error } = await profileService.updateProfile(
        user.id,
        placementPayload
      );

      if (error) {
        setFormError(error.message || 'Failed to save placement focus.');
      } else {
        setSuccessMessage('Placement focus saved successfully!');
        if (updatedProfile) {
          setProfileState(updatedProfile);
        }
        await refreshProfile();
        showToast(
          'Placement Focus Updated',
          'Your target role and companies have been saved.',
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
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="placement-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 id="placement-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Placement Focus
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure your target career role, domain, location, and dream companies
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
            {/* 1. Target Role */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Target Role</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.target_role}
                onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                placeholder="e.g. Software Engineer, Full Stack Developer"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                required
              />
              <select
                aria-label="Select target role suggestion"
                onChange={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, target_role: e.target.value });
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>Or pick from role suggestions...</option>
                {TARGET_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Preferred Domain */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Preferred Domain</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.preferred_domain}
                onChange={(e) => setFormData({ ...formData, preferred_domain: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                required
              >
                <option value="" disabled>Select your preferred domain</option>
                {DOMAIN_OPTIONS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Preferred Location */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Preferred Location</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.preferred_location}
                onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
                placeholder="e.g. Bangalore / Remote"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                required
              />
              <select
                aria-label="Select location suggestion"
                onChange={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, preferred_location: e.target.value });
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>Suggestions...</option>
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Target Companies */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Target Companies</span>
              </label>

              {/* Companies Chips */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[52px]">
                {targetCompanies.length > 0 ? (
                  targetCompanies.map((comp) => (
                    <span
                      key={comp}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      <span>{comp}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCompany(comp)}
                        className="hover:text-red-500 transition-colors cursor-pointer"
                        title={`Remove ${comp}`}
                        aria-label={`Remove ${comp}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                    No target companies added yet. Add companies below.
                  </span>
                )}
              </div>

              {/* Add Company Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCompanyInput}
                  onChange={(e) => setNewCompanyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCompany();
                    }
                  }}
                  placeholder="Enter company name (e.g. Google, Microsoft)"
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddCompany()}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Company</span>
                </button>
              </div>

              {/* Popular quick-add presets */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Quick add:</span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_COMPANIES.map((company) => {
                    const isAdded = targetCompanies.some(
                      (c) => c.toLowerCase() === company.toLowerCase()
                    );
                    return (
                      <button
                        key={company}
                        type="button"
                        onClick={() => handleAddCompany(company)}
                        disabled={isAdded}
                        className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-default'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:text-emerald-600'
                        }`}
                      >
                        + {company}
                      </button>
                    );
                  })}
                </div>
              </div>
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
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
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
