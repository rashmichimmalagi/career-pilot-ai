import { StudentTargetCompany } from '../types/companyPrep';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_PREFIX = 'careerpilot_company_targets_';
const ACTIVE_TARGET_KEY = 'careerpilot_active_company_target_';

export function getStudentTargets(studentId: string = 'guest'): StudentTargetCompany[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${studentId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[CompanyPrepStorage] Error loading targets:', err);
    return [];
  }
}

export async function fetchRemoteStudentTargets(studentId: string = 'guest'): Promise<StudentTargetCompany[]> {
  if (!isSupabaseConfigured() || !studentId || studentId === 'guest') {
    return getStudentTargets(studentId);
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('profile_data, career_goal')
      .eq('id', studentId)
      .maybeSingle();

    if (error) {
      console.warn('[CompanyPrepStorage] Supabase fetch warning:', error.message);
      return getStudentTargets(studentId);
    }

    let remoteTargets: StudentTargetCompany[] = [];
    if (data?.profile_data?.company_targets && Array.isArray(data.profile_data.company_targets)) {
      remoteTargets = data.profile_data.company_targets;
    } else if (typeof data?.career_goal === 'string' && data.career_goal.startsWith('__CP_DATA__')) {
      try {
        const parsed = JSON.parse(data.career_goal.replace(/^__CP_DATA__/, ''));
        if (parsed.company_targets && Array.isArray(parsed.company_targets)) {
          remoteTargets = parsed.company_targets;
        }
      } catch (_) {}
    }

    const localTargets = getStudentTargets(studentId);
    // Merge remote and local
    const mergedMap = new Map<string, StudentTargetCompany>();
    remoteTargets.forEach((t) => mergedMap.set(t.id, t));
    localTargets.forEach((t) => mergedMap.set(t.id, t));

    const combined = Array.from(mergedMap.values());
    if (combined.length > 0) {
      localStorage.setItem(`${STORAGE_PREFIX}${studentId}`, JSON.stringify(combined));
    }
    return combined;
  } catch (err) {
    console.warn('[CompanyPrepStorage] Remote fetch exception:', err);
    return getStudentTargets(studentId);
  }
}

export function saveStudentTarget(
  target: StudentTargetCompany,
  studentId: string = 'guest'
): void {
  try {
    const current = getStudentTargets(studentId);
    const existingIndex = current.findIndex((t) => t.id === target.id);
    let updated: StudentTargetCompany[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...target, updatedAt: new Date().toISOString() };
    } else {
      updated = [
        { ...target, createdAt: target.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() },
        ...current,
      ];
    }

    localStorage.setItem(`${STORAGE_PREFIX}${studentId}`, JSON.stringify(updated));
    // Set as active target automatically
    setActiveTargetId(target.id, studentId);

    // Sync to Supabase in background if authenticated
    if (isSupabaseConfigured() && studentId && studentId !== 'guest') {
      (async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('profile_data')
            .eq('id', studentId)
            .maybeSingle();

          const currentMeta = data?.profile_data || {};
          await supabase
            .from('profiles')
            .update({
              profile_data: {
                ...currentMeta,
                company_targets: updated,
                active_target_id: target.id,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', studentId);
        } catch (err) {
          console.warn('[CompanyPrepStorage] Supabase target sync notice:', err);
        }
      })();
    }
  } catch (err) {
    console.error('[CompanyPrepStorage] Error saving target:', err);
  }
}

export function deleteStudentTarget(
  targetId: string,
  studentId: string = 'guest'
): void {
  try {
    const current = getStudentTargets(studentId);
    const updated = current.filter((t) => t.id !== targetId);
    localStorage.setItem(`${STORAGE_PREFIX}${studentId}`, JSON.stringify(updated));

    // If deleted target was active, reset or set to next available
    const activeId = getActiveTargetId(studentId);
    if (activeId === targetId) {
      if (updated.length > 0) {
        setActiveTargetId(updated[0].id, studentId);
      } else {
        localStorage.removeItem(`${ACTIVE_TARGET_KEY}${studentId}`);
      }
    }

    if (isSupabaseConfigured() && studentId && studentId !== 'guest') {
      (async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('profile_data')
            .eq('id', studentId)
            .maybeSingle();

          const currentMeta = data?.profile_data || {};
          await supabase
            .from('profiles')
            .update({
              profile_data: {
                ...currentMeta,
                company_targets: updated,
                active_target_id: updated.length > 0 ? updated[0].id : null,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', studentId);
        } catch (err) {
          console.warn('[CompanyPrepStorage] Supabase target delete notice:', err);
        }
      })();
    }
  } catch (err) {
    console.error('[CompanyPrepStorage] Error deleting target:', err);
  }
}

export function getActiveTargetId(studentId: string = 'guest'): string | null {
  try {
    return localStorage.getItem(`${ACTIVE_TARGET_KEY}${studentId}`);
  } catch {
    return null;
  }
}

export function setActiveTargetId(targetId: string, studentId: string = 'guest'): void {
  try {
    localStorage.setItem(`${ACTIVE_TARGET_KEY}${studentId}`, targetId);
  } catch (err) {
    console.error('[CompanyPrepStorage] Error setting active target:', err);
  }
}

export function getActiveStudentTarget(studentId: string = 'guest'): StudentTargetCompany | null {
  const targets = getStudentTargets(studentId);
  if (targets.length === 0) return null;

  const activeId = getActiveTargetId(studentId);
  if (activeId) {
    const found = targets.find((t) => t.id === activeId);
    if (found) return found;
  }

  return targets[0];
}
