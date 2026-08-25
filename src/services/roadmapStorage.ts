import { DailyRoadmapTask } from '../types/roadmap';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

export async function fetchRemoteRoadmapData(studentId: string): Promise<{
  tasks: DailyRoadmapTask[] | null;
  completedItemIds: string[];
}> {
  if (!isSupabaseConfigured() || !studentId || studentId === 'guest') {
    return {
      tasks: getStoredDailyTasks(studentId),
      completedItemIds: getCompletedItemIds(studentId),
    };
  }

  try {
    let data: any = null;
    let error: any = null;

    const initialRes = await supabase
      .from('profiles')
      .select('profile_data, career_goal')
      .eq('id', studentId)
      .maybeSingle();

    if (initialRes.error && (initialRes.error.code === '42703' || initialRes.error.message?.includes('profile_data'))) {
      const fallbackRes = await supabase
        .from('profiles')
        .select('career_goal')
        .eq('id', studentId)
        .maybeSingle();
      data = fallbackRes.data;
      error = fallbackRes.error;
    } else {
      data = initialRes.data;
      error = initialRes.error;
    }

    if (error) {
      console.warn('[RoadmapStorage] Supabase fetch warning:', error.message);
      return {
        tasks: getStoredDailyTasks(studentId),
        completedItemIds: getCompletedItemIds(studentId),
      };
    }

    let remoteTasks: DailyRoadmapTask[] | null = null;
    let remoteCompletedIds: string[] = [];

    if (data?.profile_data?.roadmap_tasks && Array.isArray(data.profile_data.roadmap_tasks)) {
      remoteTasks = data.profile_data.roadmap_tasks;
    }
    if (data?.profile_data?.completed_roadmap_items && Array.isArray(data.profile_data.completed_roadmap_items)) {
      remoteCompletedIds = data.profile_data.completed_roadmap_items;
    }

    if (!remoteTasks && typeof data?.career_goal === 'string' && data.career_goal.startsWith('__CP_DATA__')) {
      try {
        const parsed = JSON.parse(data.career_goal.replace(/^__CP_DATA__/, ''));
        if (parsed.roadmap_tasks && Array.isArray(parsed.roadmap_tasks)) {
          remoteTasks = parsed.roadmap_tasks;
        }
        if (parsed.completed_roadmap_items && Array.isArray(parsed.completed_roadmap_items)) {
          remoteCompletedIds = parsed.completed_roadmap_items;
        }
      } catch (_) {}
    }

    // Merge with local cache
    const localTasks = getStoredDailyTasks(studentId);
    const localCompleted = getCompletedItemIds(studentId);

    const mergedCompleted = Array.from(new Set([...remoteCompletedIds, ...localCompleted]));
    const finalTasks = remoteTasks && remoteTasks.length > 0 ? remoteTasks : localTasks;

    if (finalTasks) {
      localStorage.setItem(`${STORAGE_PREFIX}tasks_${studentId}`, JSON.stringify(finalTasks));
    }
    if (mergedCompleted.length > 0) {
      localStorage.setItem(`${STORAGE_PREFIX}completed_items_${studentId}`, JSON.stringify(mergedCompleted));
    }

    return {
      tasks: finalTasks,
      completedItemIds: mergedCompleted,
    };
  } catch (err) {
    console.warn('[RoadmapStorage] Remote fetch exception:', err);
    return {
      tasks: getStoredDailyTasks(studentId),
      completedItemIds: getCompletedItemIds(studentId),
    };
  }
}

export function saveDailyTasks(studentId: string, tasks: DailyRoadmapTask[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}tasks_${studentId}`, JSON.stringify(tasks));

    if (isSupabaseConfigured() && studentId && studentId !== 'guest') {
      (async () => {
        try {
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({
              profile_data: {
                roadmap_tasks: tasks,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', studentId);

          if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('profile_data'))) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('career_goal')
              .eq('id', studentId)
              .maybeSingle();

            let existingEnv: any = {};
            if (prof?.career_goal && typeof prof.career_goal === 'string' && prof.career_goal.startsWith('__CP_DATA__')) {
              try {
                existingEnv = JSON.parse(prof.career_goal.replace(/^__CP_DATA__/, ''));
              } catch (_) {}
            }
            const envelope = '__CP_DATA__' + JSON.stringify({
              ...existingEnv,
              roadmap_tasks: tasks,
            });
            await supabase
              .from('profiles')
              .update({
                career_goal: envelope,
                updated_at: new Date().toISOString(),
              })
              .eq('id', studentId);
          }
        } catch (err) {
          console.warn('[RoadmapStorage] Supabase tasks sync notice:', err);
        }
      })();
    }
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

    if (isSupabaseConfigured() && studentId && studentId !== 'guest') {
      (async () => {
        try {
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({
              profile_data: {
                completed_roadmap_items: updated,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', studentId);

          if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('profile_data'))) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('career_goal')
              .eq('id', studentId)
              .maybeSingle();

            let existingEnv: any = {};
            if (prof?.career_goal && typeof prof.career_goal === 'string' && prof.career_goal.startsWith('__CP_DATA__')) {
              try {
                existingEnv = JSON.parse(prof.career_goal.replace(/^__CP_DATA__/, ''));
              } catch (_) {}
            }
            const envelope = '__CP_DATA__' + JSON.stringify({
              ...existingEnv,
              completed_roadmap_items: updated,
            });
            await supabase
              .from('profiles')
              .update({
                career_goal: envelope,
                updated_at: new Date().toISOString(),
              })
              .eq('id', studentId);
          }
        } catch (err) {
          console.warn('[RoadmapStorage] Supabase completed items sync notice:', err);
        }
      })();
    }

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

      if (isSupabaseConfigured() && studentId && studentId !== 'guest') {
        (async () => {
          try {
            const { error: updateErr } = await supabase
              .from('profiles')
              .update({
                profile_data: {
                  completed_roadmap_items: updated,
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', studentId);

            if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('profile_data'))) {
              const { data: prof } = await supabase
                .from('profiles')
                .select('career_goal')
                .eq('id', studentId)
                .maybeSingle();

              let existingEnv: any = {};
              if (prof?.career_goal && typeof prof.career_goal === 'string' && prof.career_goal.startsWith('__CP_DATA__')) {
                try {
                  existingEnv = JSON.parse(prof.career_goal.replace(/^__CP_DATA__/, ''));
                } catch (_) {}
              }
              const envelope = '__CP_DATA__' + JSON.stringify({
                ...existingEnv,
                completed_roadmap_items: updated,
              });
              await supabase
                .from('profiles')
                .update({
                  career_goal: envelope,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', studentId);
            }
          } catch (err) {
            console.warn('[RoadmapStorage] Supabase mark item sync notice:', err);
          }
        })();
      }

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
