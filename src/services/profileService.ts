import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, ProfileFormData } from '../types/database';

const EXTENDED_PROFILE_PREFIX = 'careerpilot_extended_profile_';

export interface ProfileCompletionStatus {
  percentage: number;
  completedFieldsCount: number;
  totalFieldsCount: number;
  isComplete: boolean;
  missingFields: { key: string; label: string; section: string }[];
  sectionScores: {
    personal: number;
    academic: number;
    career: number;
    skills: number;
    preparation: number;
  };
}

/**
 * Calculate dynamic Profile Completion percentage and missing actionable fields
 */
export function calculateProfileCompletion(profile?: Profile | ProfileFormData | null): ProfileCompletionStatus {
  if (!profile) {
    return {
      percentage: 0,
      completedFieldsCount: 0,
      totalFieldsCount: 15,
      isComplete: false,
      missingFields: [
        { key: 'full_name', label: 'Full Name', section: 'Personal' },
        { key: 'usn', label: 'USN / Student ID', section: 'Academic' },
        { key: 'college_name', label: 'College / University', section: 'Academic' },
        { key: 'degree', label: 'Degree Program', section: 'Academic' },
        { key: 'department', label: 'Branch / Department', section: 'Academic' },
        { key: 'semester', label: 'Current Semester', section: 'Academic' },
        { key: 'graduation_year', label: 'Graduation Year', section: 'Academic' },
        { key: 'cgpa', label: 'CGPA / Percentage', section: 'Academic' },
        { key: 'target_role', label: 'Target Career Role', section: 'Career' },
        { key: 'target_companies', label: 'Target Companies', section: 'Career' },
        { key: 'preferred_domain', label: 'Preferred Domain', section: 'Career' },
        { key: 'programming_languages', label: 'Programming Languages', section: 'Skills' },
        { key: 'technical_skills', label: 'Technical Skills', section: 'Skills' },
        { key: 'preparation_level', label: 'Preparation Level', section: 'Preparation' },
        { key: 'preferred_language', label: 'Primary Coding Language', section: 'Preparation' },
      ],
      sectionScores: {
        personal: 0,
        academic: 0,
        career: 0,
        skills: 0,
        preparation: 0,
      },
    };
  }

  const missingFields: { key: string; label: string; section: string }[] = [];

  const hasVal = (v: any): boolean => {
    if (v === null || v === undefined) return false;
    return String(v).trim().length > 0;
  };

  // 1. Personal (20%)
  let personalScore = 0;
  if (hasVal(profile.full_name)) personalScore += 10;
  else missingFields.push({ key: 'full_name', label: 'Full Name', section: 'Personal' });
  if (hasVal(profile.phone) || hasVal(profile.avatar_url)) personalScore += 10;

  // 2. Academic (25%)
  let academicScore = 0;
  if (hasVal(profile.usn)) academicScore += 4;
  else missingFields.push({ key: 'usn', label: 'USN / Student ID', section: 'Academic' });
  if (hasVal(profile.college_name)) academicScore += 4;
  else missingFields.push({ key: 'college_name', label: 'College Name', section: 'Academic' });
  if (hasVal(profile.department)) academicScore += 4;
  else missingFields.push({ key: 'department', label: 'Branch / Department', section: 'Academic' });
  if (hasVal(profile.semester)) academicScore += 4;
  else missingFields.push({ key: 'semester', label: 'Current Semester', section: 'Academic' });
  if (hasVal(profile.graduation_year)) academicScore += 4;
  else missingFields.push({ key: 'graduation_year', label: 'Graduation Year', section: 'Academic' });
  if (hasVal(profile.degree)) academicScore += 2.5;
  else missingFields.push({ key: 'degree', label: 'Degree Program', section: 'Academic' });
  if (hasVal(profile.cgpa)) academicScore += 2.5;
  else missingFields.push({ key: 'cgpa', label: 'Cumulative GPA (CGPA)', section: 'Academic' });

  // 3. Career (20%)
  let careerScore = 0;
  if (hasVal(profile.target_role)) careerScore += 8;
  else missingFields.push({ key: 'target_role', label: 'Target Career Role', section: 'Career' });
  if (Array.isArray(profile.target_companies) && profile.target_companies.length > 0) careerScore += 6;
  else missingFields.push({ key: 'target_companies', label: 'Target Companies', section: 'Career' });
  if (hasVal(profile.preferred_domain) || hasVal(profile.preferred_location)) careerScore += 6;
  else missingFields.push({ key: 'preferred_domain', label: 'Preferred Domain', section: 'Career' });

  // 4. Skills (20%)
  let skillsScore = 0;
  if (Array.isArray(profile.programming_languages) && profile.programming_languages.length > 0) skillsScore += 8;
  else missingFields.push({ key: 'programming_languages', label: 'Programming Languages', section: 'Skills' });
  if (Array.isArray(profile.technical_skills) && profile.technical_skills.length > 0) skillsScore += 7;
  else missingFields.push({ key: 'technical_skills', label: 'Technical Skills', section: 'Skills' });
  if (Array.isArray(profile.tools_technologies) && profile.tools_technologies.length > 0) skillsScore += 5;

  // 5. Preparation Profile (15%)
  let prepScore = 0;
  if (hasVal(profile.preparation_level)) prepScore += 5;
  else missingFields.push({ key: 'preparation_level', label: 'Preparation Level', section: 'Preparation' });
  if (hasVal(profile.preferred_language)) prepScore += 5;
  else missingFields.push({ key: 'preferred_language', label: 'Primary Language for Interviews', section: 'Preparation' });
  if (hasVal(profile.dsa_level) || hasVal(profile.interview_experience)) prepScore += 5;

  const totalPercentage = Math.min(100, Math.round(personalScore + academicScore + careerScore + skillsScore + prepScore));
  const totalFields = 15;
  const completedFields = Math.max(0, totalFields - missingFields.length);

  return {
    percentage: totalPercentage,
    completedFieldsCount: completedFields,
    totalFieldsCount: totalFields,
    isComplete: totalPercentage >= 90,
    missingFields,
    sectionScores: {
      personal: Math.round(personalScore * 5),
      academic: Math.round(academicScore * 4),
      career: Math.round(careerScore * 5),
      skills: Math.round(skillsScore * 5),
      preparation: Math.round(prepScore * (100 / 15)),
    },
  };
}

export const profileService = {
  /**
   * Helper to load extended local profile cache
   */
  getExtendedLocalProfile(userId: string): Partial<Profile> {
    try {
      const raw = localStorage.getItem(`${EXTENDED_PROFILE_PREFIX}${userId}`);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  /**
   * Helper to save extended local profile cache
   */
  saveExtendedLocalProfile(userId: string, data: Partial<Profile>): void {
    try {
      const current = this.getExtendedLocalProfile(userId);
      const merged = { ...current, ...data, updated_at: new Date().toISOString() };
      localStorage.setItem(`${EXTENDED_PROFILE_PREFIX}${userId}`, JSON.stringify(merged));
    } catch (err) {
      console.warn('[ProfileService] Could not save extended local profile:', err);
    }
  },

  /**
   * Fetch user profile from Supabase by Auth User ID merged with extended profile storage
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const localExtended = this.getExtendedLocalProfile(userId);

    if (!isSupabaseConfigured()) {
      if (localExtended && localExtended.full_name) {
        return {
          id: userId,
          full_name: localExtended.full_name || 'Student',
          email: localExtended.email || '',
          usn: localExtended.usn || '',
          college_name: localExtended.college_name || '',
          department: localExtended.department || '',
          semester: localExtended.semester || '',
          graduation_year: localExtended.graduation_year || '',
          ...localExtended,
        } as Profile;
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[ProfileService] Database query notice:', error.message);
        if (localExtended && Object.keys(localExtended).length > 0) {
          return {
            id: userId,
            full_name: localExtended.full_name || 'Student',
            email: localExtended.email || '',
            usn: localExtended.usn || '',
            college_name: localExtended.college_name || '',
            department: localExtended.department || '',
            semester: localExtended.semester || '',
            graduation_year: localExtended.graduation_year || '',
            ...localExtended,
          } as Profile;
        }
        return null;
      }

      if (!data) {
        if (localExtended && localExtended.full_name) {
          return {
            id: userId,
            full_name: localExtended.full_name || 'Student',
            email: localExtended.email || '',
            usn: localExtended.usn || '',
            college_name: localExtended.college_name || '',
            department: localExtended.department || '',
            semester: localExtended.semester || '',
            graduation_year: localExtended.graduation_year || '',
            ...localExtended,
          } as Profile;
        }
        return null;
      }

      // 1. Extract metadata from profile_data if stored as JSONB
      let remoteMetadata: Partial<Profile> = {};
      if (data.profile_data && typeof data.profile_data === 'object') {
        remoteMetadata = { ...data.profile_data };
      }

      // 2. Extract metadata if packed in career_goal envelope
      let cleanCareerGoal = data.career_goal || '';
      if (typeof data.career_goal === 'string' && data.career_goal.startsWith('__CP_DATA__')) {
        try {
          const raw = data.career_goal.replace(/^__CP_DATA__/, '');
          const parsed = JSON.parse(raw);
          remoteMetadata = { ...remoteMetadata, ...parsed };
          cleanCareerGoal = parsed.career_goal || '';
        } catch (_) {}
      }

      // 3. Extract direct columns
      const directFields: Partial<Profile> = {};
      const extendedKeys = [
        'phone', 'degree', 'current_year', 'cgpa', 'target_companies', 'skills',
        'technical_skills', 'tools_technologies', 'programming_languages', 'certifications',
        'linkedin_url', 'github_url', 'portfolio_url', 'bio', 'preparation_level',
        'preferred_language', 'preferred_domain', 'preferred_location', 'dsa_level',
        'interview_experience', 'preferences'
      ];
      for (const k of extendedKeys) {
        if (data[k] !== undefined && data[k] !== null) {
          (directFields as any)[k] = data[k];
        }
      }

      // 4. Merge: Supabase remote takes precedence for cross-device consistency, combined with local
      const mergedExtended: Partial<Profile> = {
        ...localExtended,
        ...remoteMetadata,
        ...directFields,
      };

      // 5. Update local cache with complete merged data
      this.saveExtendedLocalProfile(userId, mergedExtended);

      const mergedProfile: Profile = {
        ...(data as Profile),
        ...mergedExtended,
        id: userId,
        full_name: data.full_name || localExtended.full_name || 'Student',
        email: data.email || localExtended.email || '',
        usn: data.usn || localExtended.usn || '',
        college_name: data.college_name || localExtended.college_name || '',
        department: data.department || localExtended.department || '',
        semester: data.semester || localExtended.semester || '',
        graduation_year: data.graduation_year || localExtended.graduation_year || '',
        career_goal: cleanCareerGoal || localExtended.career_goal || '',
        target_role: data.target_role || localExtended.target_role || '',
      };

      return mergedProfile;
    } catch (err) {
      console.error('[ProfileService] Unexpected error fetching profile:', err);
      if (localExtended && Object.keys(localExtended).length > 0) {
        return { id: userId, ...localExtended } as Profile;
      }
      return null;
    }
  },

  /**
   * Helper to build safe storage envelope for Supabase
   */
  buildProfileStoragePayload(userId: string, formData: Partial<Profile>) {
    const fullJson = {
      phone: formData.phone || '',
      degree: formData.degree || '',
      current_year: formData.current_year || '',
      cgpa: formData.cgpa || '',
      target_companies: formData.target_companies || [],
      skills: formData.skills || [],
      technical_skills: formData.technical_skills || [],
      tools_technologies: formData.tools_technologies || [],
      programming_languages: formData.programming_languages || [],
      certifications: formData.certifications || [],
      linkedin_url: formData.linkedin_url || '',
      github_url: formData.github_url || '',
      portfolio_url: formData.portfolio_url || '',
      bio: formData.bio || '',
      preparation_level: formData.preparation_level || '',
      preferred_language: formData.preferred_language || '',
      preferred_domain: formData.preferred_domain || '',
      preferred_location: formData.preferred_location || '',
      dsa_level: formData.dsa_level || '',
      interview_experience: formData.interview_experience || '',
      preferences: formData.preferences || {},
      career_goal: formData.career_goal || '',
    };

    const careerGoalEnvelope = `__CP_DATA__${JSON.stringify(fullJson)}`;

    return {
      baseRecord: {
        id: userId,
        full_name: formData.full_name,
        email: formData.email,
        avatar_url: formData.avatar_url || '',
        usn: formData.usn,
        college_name: formData.college_name,
        department: formData.department,
        semester: formData.semester,
        graduation_year: formData.graduation_year,
        career_goal: careerGoalEnvelope,
        target_role: formData.target_role || '',
        role: 'student',
        updated_at: new Date().toISOString(),
      },
      fullRecord: {
        id: userId,
        full_name: formData.full_name,
        email: formData.email,
        avatar_url: formData.avatar_url || '',
        usn: formData.usn,
        college_name: formData.college_name,
        department: formData.department,
        semester: formData.semester,
        graduation_year: formData.graduation_year,
        career_goal: careerGoalEnvelope,
        target_role: formData.target_role || '',
        phone: formData.phone || null,
        degree: formData.degree || null,
        current_year: formData.current_year || null,
        cgpa: formData.cgpa ? Number(formData.cgpa) : null,
        target_companies: formData.target_companies || [],
        skills: formData.skills || [],
        technical_skills: formData.technical_skills || [],
        tools_technologies: formData.tools_technologies || [],
        programming_languages: formData.programming_languages || [],
        certifications: formData.certifications || [],
        linkedin_url: formData.linkedin_url || null,
        github_url: formData.github_url || null,
        portfolio_url: formData.portfolio_url || null,
        bio: formData.bio || null,
        preparation_level: formData.preparation_level || null,
        preferred_language: formData.preferred_language || null,
        preferred_domain: formData.preferred_domain || null,
        preferred_location: formData.preferred_location || null,
        dsa_level: formData.dsa_level || null,
        interview_experience: formData.interview_experience || null,
        preferences: formData.preferences || {},
        profile_data: fullJson,
        role: 'student',
        updated_at: new Date().toISOString(),
      },
      fullJson,
    };
  },

  /**
   * Create a new student profile in Supabase
   */
  async createProfile(userId: string, formData: ProfileFormData): Promise<{ profile: Profile | null; error: Error | null }> {
    // 1. Always cache extended values locally first
    this.saveExtendedLocalProfile(userId, formData);

    if (!isSupabaseConfigured()) {
      const mockProfile: Profile = {
        id: userId,
        ...formData,
        role: 'student',
        updated_at: new Date().toISOString(),
      };
      this.notifyProfileUpdated(mockProfile, userId);
      return { profile: mockProfile, error: null };
    }

    const { baseRecord, fullRecord } = this.buildProfileStoragePayload(userId, formData);

    try {
      // First attempt inserting full record with all columns
      const { data, error } = await supabase
        .from('profiles')
        .upsert([fullRecord])
        .select()
        .single();

      if (error) {
        // Fallback to base columns with envelope in career_goal
        const { data: baseData, error: baseErr } = await supabase
          .from('profiles')
          .upsert([baseRecord])
          .select()
          .single();

        if (baseErr) {
          console.error('[ProfileService] Error creating profile in database:', baseErr);
          const fallbackProfile: Profile = { id: userId, ...formData, role: 'student' };
          this.notifyProfileUpdated(fallbackProfile, userId);
          return { profile: fallbackProfile, error: null };
        }

        const merged: Profile = { ...(baseData as Profile), ...formData };
        this.notifyProfileUpdated(merged, userId);
        return { profile: merged, error: null };
      }

      const merged: Profile = { ...(data as Profile), ...formData };
      this.notifyProfileUpdated(merged, userId);
      return { profile: merged, error: null };
    } catch (err: any) {
      console.error('[ProfileService] Exception creating profile:', err);
      const fallback: Profile = { id: userId, ...formData, role: 'student' };
      this.notifyProfileUpdated(fallback, userId);
      return { profile: fallback, error: null };
    }
  },

  /**
   * Update existing profile in Supabase & Local Cache
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ profile: Profile | null; error: Error | null }> {
    // 1. Cache extended values locally
    this.saveExtendedLocalProfile(userId, updates);

    if (!isSupabaseConfigured()) {
      const existing = this.getExtendedLocalProfile(userId);
      const updatedMock: Profile = {
        id: userId,
        full_name: '',
        email: '',
        usn: '',
        college_name: '',
        department: '',
        semester: '',
        graduation_year: '',
        ...existing,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.notifyProfileUpdated(updatedMock, userId);
      return { profile: updatedMock, error: null };
    }

    const currentExtended = { ...this.getExtendedLocalProfile(userId), ...updates };
    const { baseRecord, fullRecord } = this.buildProfileStoragePayload(userId, currentExtended);

    try {
      // Try full upsert first
      const { data, error } = await supabase
        .from('profiles')
        .upsert(fullRecord)
        .select()
        .single();

      if (error) {
        // Fallback to base columns upsert
        const { data: baseData, error: baseErr } = await supabase
          .from('profiles')
          .upsert(baseRecord)
          .select()
          .single();

        if (baseErr) {
          console.warn('[ProfileService] Database update fallback warning:', baseErr.message);
          const localMerged: Profile = {
            id: userId,
            full_name: '',
            email: '',
            usn: '',
            college_name: '',
            department: '',
            semester: '',
            graduation_year: '',
            ...currentExtended,
          };
          this.notifyProfileUpdated(localMerged, userId);
          return { profile: localMerged, error: null };
        }

        const merged: Profile = {
          ...(baseData as Profile),
          ...currentExtended,
        };
        this.notifyProfileUpdated(merged, userId);
        return { profile: merged, error: null };
      }

      const merged: Profile = {
        ...(data as Profile),
        ...currentExtended,
      };
      this.notifyProfileUpdated(merged, userId);
      return { profile: merged, error: null };
    } catch (err: any) {
      console.error('[ProfileService] Unexpected update error:', err);
      const fallback: Profile = {
        id: userId,
        full_name: '',
        email: '',
        usn: '',
        college_name: '',
        department: '',
        semester: '',
        graduation_year: '',
        ...currentExtended,
      };
      this.notifyProfileUpdated(fallback, userId);
      return { profile: fallback, error: null };
    }
  },

  /**
   * Helper to dispatch reactive global updates so Dashboard and other pages recalculate instantly
   */
  notifyProfileUpdated(profile: Profile, userId: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('careerpilot_profile_updated', {
          detail: { profile, userId },
        })
      );
      window.dispatchEvent(
        new CustomEvent('careerpilot_activity_updated', {
          detail: { studentId: userId },
        })
      );
    }
  },
};

