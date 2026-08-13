import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, ProfileFormData } from '../types/database';

export const profileService = {
  /**
   * Fetch user profile from Supabase by Auth User ID
   */
  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile from Supabase:', error);
        // If table doesn't exist yet, return null
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Profiles table does not exist in Supabase database yet.');
        }
        return null;
      }

      return data as Profile | null;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  },

  /**
   * Create a new student profile in Supabase
   */
  async createProfile(userId: string, formData: ProfileFormData): Promise<{ profile: Profile | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        profile: null,
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_ANON_KEY.'),
      };
    }

    const newProfile: Partial<Profile> = {
      id: userId,
      full_name: formData.full_name,
      email: formData.email,
      avatar_url: formData.avatar_url || '',
      role: 'student', // ALWAYS default to 'student' for role security
      usn: formData.usn,
      college_name: formData.college_name,
      department: formData.department,
      semester: formData.semester,
      graduation_year: formData.graduation_year,
      career_goal: formData.career_goal,
      target_role: formData.target_role,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        console.error('Error inserting profile into Supabase:', error);
        return { profile: null, error: new Error(error.message || 'Failed to create student profile in database.') };
      }

      return { profile: data as Profile, error: null };
    } catch (err: any) {
      console.error('Unexpected exception during profile creation:', err);
      return { profile: null, error: err instanceof Error ? err : new Error('An unexpected database error occurred.') };
    }
  },

  /**
   * Update existing profile in Supabase
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ profile: Profile | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        profile: null,
        error: new Error('Supabase is not configured.'),
      };
    }

    // Sanitize: do not allow role elevation via client updates
    const sanitizedUpdates = { ...updates };
    delete sanitizedUpdates.role;
    sanitizedUpdates.updated_at = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(sanitizedUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { profile: null, error: new Error(error.message) };
      }

      return { profile: data as Profile, error: null };
    } catch (err: any) {
      return { profile: null, error: err instanceof Error ? err : new Error('Failed to update profile.') };
    }
  },
};
