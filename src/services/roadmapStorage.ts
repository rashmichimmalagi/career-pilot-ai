import { DailyRoadmapTask } from '../types/roadmap';

const STORAGE_PREFIX = 'careerpilot_roadmap_';

export function getStoredDailyTasks(studentId: string): DailyRoadmapTask[] | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}tasks_${studentId}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.error('Error reading stored daily tasks:', err);
    return null;
  }
}

export function saveDailyTasks(studentId: string, tasks: DailyRoadmapTask[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}tasks_${studentId}`, JSON.stringify(tasks));
  } catch (err) {
    console.error('Error saving daily tasks:', err);
  }
}

export function toggleStoredTask(studentId: string, taskId: string): DailyRoadmapTask[] {
  const current = getStoredDailyTasks(studentId) || [];
  const updated = current.map((t) => {
    if (t.id === taskId) {
      const nextState = !t.completed;
      return {
        ...t,
        completed: nextState,
        completedAt: nextState ? new Date().toISOString() : undefined,
      };
    }
    return t;
  });
  saveDailyTasks(studentId, updated);
  return updated;
}

export function getCustomTargetRole(studentId: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}custom_role_${studentId}`) || null;
  } catch {
    return null;
  }
}

export function setCustomTargetRole(studentId: string, role: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}custom_role_${studentId}`, role);
  } catch (err) {
    console.error('Error saving custom target role:', err);
  }
}

export function getCompletedItemIds(studentId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}completed_items_${studentId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleCompletedItemId(studentId: string, itemId: string): string[] {
  try {
    const current = getCompletedItemIds(studentId);
    let updated: string[];
    if (current.includes(itemId)) {
      updated = current.filter((id) => id !== itemId);
    } else {
      updated = [...current, itemId];
    }
    localStorage.setItem(`${STORAGE_PREFIX}completed_items_${studentId}`, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error toggling item status:', err);
    return [];
  }
}

export function markItemCompleted(studentId: string, itemId: string): string[] {
  try {
    const current = getCompletedItemIds(studentId);
    if (!current.includes(itemId)) {
      const updated = [...current, itemId];
      localStorage.setItem(`${STORAGE_PREFIX}completed_items_${studentId}`, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch (err) {
    console.error('Error marking item completed:', err);
    return [];
  }
}

export function markTaskCompleted(studentId: string, taskId: string): DailyRoadmapTask[] {
  try {
    const current = getStoredDailyTasks(studentId) || [];
    const updated = current.map((t) => {
      if (t.id === taskId || t.actionParams?.taskId === taskId) {
        return {
          ...t,
          completed: true,
          completedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    saveDailyTasks(studentId, updated);
    return updated;
  } catch (err) {
    console.error('Error marking task completed:', err);
    return [];
  }
}
