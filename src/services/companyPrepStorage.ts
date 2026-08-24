import { StudentTargetCompany } from '../types/companyPrep';

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
