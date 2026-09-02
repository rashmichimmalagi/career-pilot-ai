/**
 * AI Career Mentor Supabase-Backed Storage Service
 *
 * SUPABASE IS THE PRIMARY SOURCE OF TRUTH.
 * All conversations and messages are persisted in PostgreSQL with strict Row-Level Security (RLS)
 * ensuring full account isolation across logins and devices.
 * 
 * If dedicated mentor_conversations / mentor_messages tables are pending schema creation in Supabase,
 * the service gracefully falls back to the user's `profiles.profile_data` cloud store and local cache.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MentorConversation, MentorMessage } from '../types/mentor';

const CONVERSATIONS_CACHE_PREFIX = 'careerpilot_mentor_convs_';
const MESSAGES_CACHE_PREFIX = 'careerpilot_mentor_msgs_';

/**
 * Detect if a Supabase PostgREST error is due to a missing table in schema cache
 */
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const code = error.code || '';
  const msg = (error.message || '').toLowerCase();
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    code === 'PGRST116' ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache') ||
    msg.includes('relation') ||
    msg.includes('does not exist')
  );
}

/**
 * Helper to get the effective authenticated user ID
 */
export async function getEffectiveUserId(providedId?: string): Promise<string | null> {
  if (providedId && providedId !== 'guest') return providedId;
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch (_) {}
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;
  } catch (_) {}
  return null;
}

/**
 * Local cache helpers (for offline resilience, fast optimistic UI, and queue recovery)
 */
function getCachedConversations(userId: string): MentorConversation[] {
  try {
    const raw = localStorage.getItem(`${CONVERSATIONS_CACHE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c: MentorConversation) => {
      if (typeof c.messageCount === 'number') return c;
      const cachedMsgs = getCachedMessages(userId, c.id);
      return {
        ...c,
        messageCount: cachedMsgs.length,
      };
    });
  } catch {
    return [];
  }
}

function setCachedConversations(userId: string, convs: MentorConversation[]): void {
  try {
    localStorage.setItem(`${CONVERSATIONS_CACHE_PREFIX}${userId}`, JSON.stringify(convs));
  } catch {}
}

function getCachedMessages(userId: string, conversationId: string): MentorMessage[] {
  try {
    const raw = localStorage.getItem(`${MESSAGES_CACHE_PREFIX}${userId}_${conversationId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setCachedMessages(userId: string, conversationId: string, messages: MentorMessage[]): void {
  try {
    localStorage.setItem(`${MESSAGES_CACHE_PREFIX}${userId}_${conversationId}`, JSON.stringify(messages));
  } catch {}
}

function removeCachedMessages(userId: string, conversationId: string): void {
  try {
    localStorage.removeItem(`${MESSAGES_CACHE_PREFIX}${userId}_${conversationId}`);
  } catch {}
}

/**
 * Helper to backup conversation and message directly into profiles.profile_data in Supabase
 */
async function backupToProfileCloud(
  userId: string,
  conversationId: string,
  message?: MentorMessage,
  title?: string
): Promise<void> {
  if (!userId || userId === 'guest' || !isSupabaseConfigured()) return;
  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('profile_data, career_goal')
      .eq('id', userId)
      .maybeSingle();

    let metaObj: any = (prof?.profile_data as Record<string, any>) || {};
    if (prof?.career_goal && typeof prof.career_goal === 'string' && prof.career_goal.startsWith('__CP_DATA__')) {
      try {
        metaObj = { ...metaObj, ...JSON.parse(prof.career_goal.replace(/^__CP_DATA__/, '')) };
      } catch (_) {}
    }

    const now = new Date().toISOString();
    const existingConvs: MentorConversation[] = Array.isArray(metaObj.mentor_conversations)
      ? [...metaObj.mentor_conversations]
      : [];
    const convIdx = existingConvs.findIndex((c) => c.id === conversationId);

    if (convIdx >= 0) {
      existingConvs[convIdx] = {
        ...existingConvs[convIdx],
        title: title || existingConvs[convIdx].title,
        updatedAt: now,
      };
    } else {
      existingConvs.unshift({
        id: conversationId,
        userId,
        title: title || (message ? message.text.slice(0, 40) : 'Career Guidance Chat'),
        createdAt: now,
        updatedAt: now,
      });
    }
    metaObj.mentor_conversations = existingConvs;

    if (message) {
      const messagesByConv = metaObj.mentor_messages_by_conv || {};
      const currentMsgs: MentorMessage[] = Array.isArray(messagesByConv[conversationId])
        ? [...messagesByConv[conversationId]]
        : [];
      const existingMsgIdx = currentMsgs.findIndex((m) => m.id === message.id);
      const syncedMessage: MentorMessage = { ...message, syncStatus: 'synced' };

      if (existingMsgIdx >= 0) {
        currentMsgs[existingMsgIdx] = syncedMessage;
      } else {
        currentMsgs.push(syncedMessage);
      }
      messagesByConv[conversationId] = currentMsgs;
      metaObj.mentor_messages_by_conv = messagesByConv;

      // Maintain flat mentor_chat_history for dashboard compatibility
      const flatHistory: MentorMessage[] = Array.isArray(metaObj.mentor_chat_history)
        ? [...metaObj.mentor_chat_history]
        : [];
      const flatIdx = flatHistory.findIndex((m) => m.id === message.id);
      if (flatIdx >= 0) {
        flatHistory[flatIdx] = syncedMessage;
      } else {
        flatHistory.push(syncedMessage);
      }
      metaObj.mentor_chat_history = flatHistory.slice(-100);
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        profile_data: metaObj,
        updated_at: now,
      })
      .eq('id', userId);

    if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('profile_data'))) {
      await supabase
        .from('profiles')
        .update({
          career_goal: '__CP_DATA__' + JSON.stringify(metaObj),
          updated_at: now,
        })
        .eq('id', userId);
    }
  } catch (err) {
    console.warn('[mentorStorageService] Profile backup sync notice:', err);
  }
}

export const mentorStorageService = {
  /**
   * Fetch all conversations for the authenticated user from Supabase.
   * Single Source of Truth: Supabase PostgreSQL mentor_conversations table with profile fallback.
   */
  async fetchConversations(userId?: string): Promise<MentorConversation[]> {
    const effectiveUserId = await getEffectiveUserId(userId);
    const targetUserId = effectiveUserId || userId || 'guest';

    if (!effectiveUserId || !isSupabaseConfigured()) {
      return getCachedConversations(targetUserId);
    }

    try {
      // 1. Query conversations ordered by updated_at
      const { data: convData, error: convError } = await supabase
        .from('mentor_conversations')
        .select(`
          id,
          user_id,
          title,
          created_at,
          updated_at
        `)
        .eq('user_id', effectiveUserId)
        .order('updated_at', { ascending: false });

      if (convError) {
        if (!isTableMissingError(convError)) {
          console.warn('[mentorStorageService] Supabase fetchConversations query notice:', convError.message);
        }

        // Fallback: load from profile_data backup
        try {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('profile_data, career_goal')
            .eq('id', effectiveUserId)
            .maybeSingle();

          let metaObj: any = (profileRow?.profile_data as Record<string, any>) || {};
          if (profileRow?.career_goal && profileRow.career_goal.startsWith('__CP_DATA__')) {
            try {
              metaObj = { ...metaObj, ...JSON.parse(profileRow.career_goal.replace(/^__CP_DATA__/, '')) };
            } catch (_) {}
          }

          if (Array.isArray(metaObj.mentor_conversations) && metaObj.mentor_conversations.length > 0) {
            const enrichedFromProfile: MentorConversation[] = metaObj.mentor_conversations.map((c: any) => {
              const msgs = metaObj.mentor_messages_by_conv?.[c.id];
              const count = Array.isArray(msgs) ? msgs.length : (c.messageCount || 0);
              return {
                ...c,
                messageCount: count,
              };
            });
            setCachedConversations(effectiveUserId, enrichedFromProfile);
            return enrichedFromProfile;
          }
        } catch (_) {}

        return getCachedConversations(targetUserId);
      }

      if (Array.isArray(convData)) {
        // 2. Fetch message counts grouped by conversation for this user in a single efficient query
        const countMap: Record<string, number> = {};
        const convIds = convData.map((c) => c.id).filter(Boolean);

        if (convIds.length > 0) {
          try {
            const { data: msgRows, error: msgError } = await supabase
              .from('mentor_messages')
              .select('conversation_id')
              .in('conversation_id', convIds);

            if (!msgError && Array.isArray(msgRows)) {
              for (const m of msgRows) {
                if (m.conversation_id) {
                  countMap[m.conversation_id] = (countMap[m.conversation_id] || 0) + 1;
                }
              }
            } else if (msgError && isTableMissingError(msgError)) {
              // If mentor_messages table missing, check profile_data
              try {
                const { data: profileRow } = await supabase
                  .from('profiles')
                  .select('profile_data, career_goal')
                  .eq('id', effectiveUserId)
                  .maybeSingle();
                let metaObj: any = (profileRow?.profile_data as Record<string, any>) || {};
                if (profileRow?.career_goal && profileRow.career_goal.startsWith('__CP_DATA__')) {
                  metaObj = { ...metaObj, ...JSON.parse(profileRow.career_goal.replace(/^__CP_DATA__/, '')) };
                }
                const byConv = metaObj.mentor_messages_by_conv || {};
                for (const [cid, msgs] of Object.entries(byConv)) {
                  if (Array.isArray(msgs)) {
                    countMap[cid] = msgs.length;
                  }
                }
              } catch (_) {}
            }
          } catch (msgCountErr) {
            console.warn('[mentorStorageService] Notice calculating message counts:', msgCountErr);
          }
        }

        const convs: MentorConversation[] = convData.map((row) => {
          let count = countMap[row.id];
          if (typeof count !== 'number' || count === 0) {
            const localCached = getCachedMessages(effectiveUserId, row.id);
            if (localCached && localCached.length > 0) {
              count = localCached.length;
            } else {
              count = countMap[row.id] || 0;
            }
          }
          return {
            id: row.id,
            userId: row.user_id,
            title: row.title || 'Career Guidance Chat',
            createdAt: row.created_at,
            updatedAt: row.updated_at || row.created_at,
            messageCount: count,
          };
        });

        setCachedConversations(effectiveUserId, convs);
        return convs;
      }
    } catch (err: any) {
      console.warn('[mentorStorageService] Notice loading conversations:', err?.message || err);
    }

    return getCachedConversations(targetUserId);
  },

  /**
   * Create a new conversation in Supabase.
   */
  async createConversation(userId?: string, initialTitle?: string): Promise<MentorConversation> {
    const effectiveUserId = await getEffectiveUserId(userId);
    const targetUserId = effectiveUserId || userId || 'guest';
    const now = new Date().toISOString();
    const newConvId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const title = (initialTitle && initialTitle.trim()) || 'Career Guidance Chat';

    const newConv: MentorConversation = {
      id: newConvId,
      userId: targetUserId,
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };

    if (effectiveUserId && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('mentor_conversations').insert({
          id: newConvId,
          user_id: effectiveUserId,
          title,
          created_at: now,
          updated_at: now,
        });

        if (error && isTableMissingError(error)) {
          // Fallback to profile_data backup
          await backupToProfileCloud(effectiveUserId, newConvId, undefined, title);
        } else if (error) {
          console.warn('[mentorStorageService] Failed to insert conversation to Supabase:', error.message);
          await backupToProfileCloud(effectiveUserId, newConvId, undefined, title);
        }
      } catch (err) {
        console.warn('[mentorStorageService] Supabase createConversation notice:', err);
        await backupToProfileCloud(effectiveUserId, newConvId, undefined, title);
      }
    }

    // Update local cache
    const existing = getCachedConversations(targetUserId);
    setCachedConversations(targetUserId, [newConv, ...existing]);

    return newConv;
  },

  /**
   * Fetch all messages in a conversation from Supabase.
   * Single Source of Truth: Supabase PostgreSQL mentor_messages table with profile fallback.
   */
  async fetchMessages(conversationId: string, userId?: string): Promise<MentorMessage[]> {
    const effectiveUserId = await getEffectiveUserId(userId);
    const targetUserId = effectiveUserId || userId || 'guest';

    if (!conversationId) return [];

    if (!effectiveUserId || !isSupabaseConfigured()) {
      return getCachedMessages(targetUserId, conversationId);
    }

    try {
      const { data, error } = await supabase
        .from('mentor_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: true });

      if (error) {
        if (!isTableMissingError(error)) {
          console.warn('[mentorStorageService] Supabase fetchMessages query notice:', error.message);
        }

        // Fallback to profile_data backup
        try {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('profile_data, career_goal')
            .eq('id', effectiveUserId)
            .maybeSingle();

          let metaObj: any = (profileRow?.profile_data as Record<string, any>) || {};
          if (profileRow?.career_goal && profileRow.career_goal.startsWith('__CP_DATA__')) {
            try {
              metaObj = { ...metaObj, ...JSON.parse(profileRow.career_goal.replace(/^__CP_DATA__/, '')) };
            } catch (_) {}
          }

          const msgsByConv = metaObj.mentor_messages_by_conv?.[conversationId];
          if (Array.isArray(msgsByConv) && msgsByConv.length > 0) {
            setCachedMessages(effectiveUserId, conversationId, msgsByConv);
            return msgsByConv;
          }
        } catch (_) {}

        return getCachedMessages(targetUserId, conversationId);
      }

      if (Array.isArray(data)) {
        const messages: MentorMessage[] = data.map((row) => ({
          id: row.id,
          conversationId: row.conversation_id,
          sender: row.role === 'user' ? 'user' : 'mentor',
          text: row.content || '',
          timestamp: row.created_at,
          suggestedFollowUps: Array.isArray(row.suggested_follow_ups) ? row.suggested_follow_ups : undefined,
          actionLinks: Array.isArray(row.action_links) ? row.action_links : undefined,
          quickActionUsed: row.quick_action || undefined,
          syncStatus: 'synced',
        }));

        setCachedMessages(effectiveUserId, conversationId, messages);
        return messages;
      }
    } catch (err) {
      console.warn('[mentorStorageService] Notice fetching messages:', err);
    }

    return getCachedMessages(targetUserId, conversationId);
  },

  /**
   * Save a single message (user or assistant) to Supabase.
   */
  async saveMessage(
    conversationId: string,
    message: MentorMessage,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const effectiveUserId = await getEffectiveUserId(userId);
    const targetUserId = effectiveUserId || userId || 'guest';
    const now = message.timestamp || new Date().toISOString();

    // 1. Update local messages cache immediately with optimistic syncStatus
    const currentCached = getCachedMessages(targetUserId, conversationId);
    const msgExists = currentCached.some((m) => m.id === message.id);
    const updatedMessages = msgExists
      ? currentCached.map((m) => (m.id === message.id ? message : m))
      : [...currentCached, message];
    setCachedMessages(targetUserId, conversationId, updatedMessages);

    // Also update conversation in cache with incremented messageCount and latest updatedAt
    const cachedConvs = getCachedConversations(targetUserId);
    const convIdx = cachedConvs.findIndex((c) => c.id === conversationId);
    if (convIdx >= 0) {
      const updatedConvs = [...cachedConvs];
      updatedConvs[convIdx] = {
        ...updatedConvs[convIdx],
        updatedAt: now,
        messageCount: updatedMessages.length,
      };
      setCachedConversations(targetUserId, updatedConvs);
    }

    // 2. Persist to Supabase if authenticated and online
    if (effectiveUserId && isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        // Ensure conversation exists in Supabase first
        const { data: convCheck, error: convCheckErr } = await supabase
          .from('mentor_conversations')
          .select('id')
          .eq('id', conversationId)
          .eq('user_id', effectiveUserId)
          .maybeSingle();

        if (convCheckErr && isTableMissingError(convCheckErr)) {
          // Table does not exist in schema cache -> use profile_data fallback
          await backupToProfileCloud(effectiveUserId, conversationId, message);
          const syncedMsg = { ...message, syncStatus: 'synced' as const };
          const syncedList = getCachedMessages(targetUserId, conversationId).map((m) =>
            m.id === message.id ? syncedMsg : m
          );
          setCachedMessages(targetUserId, conversationId, syncedList);
          return { success: true };
        }

        if (!convCheck) {
          await supabase.from('mentor_conversations').upsert({
            id: conversationId,
            user_id: effectiveUserId,
            title: message.text.slice(0, 40) || 'Career Guidance Chat',
            created_at: now,
            updated_at: now,
          });
        }

        const role = message.sender === 'user' ? 'user' : 'assistant';
        const payload = {
          id: message.id,
          conversation_id: conversationId,
          user_id: effectiveUserId,
          role,
          content: message.text,
          suggested_follow_ups: message.suggestedFollowUps || [],
          action_links: message.actionLinks || [],
          quick_action: message.quickActionUsed || null,
          created_at: now,
        };

        const { error: msgError } = await supabase
          .from('mentor_messages')
          .upsert(payload, { onConflict: 'id' });

        if (msgError) {
          if (isTableMissingError(msgError)) {
            // Table does not exist in schema cache -> gracefully backup to profile
            await backupToProfileCloud(effectiveUserId, conversationId, message);
            const syncedMsg = { ...message, syncStatus: 'synced' as const };
            const syncedList = getCachedMessages(targetUserId, conversationId).map((m) =>
              m.id === message.id ? syncedMsg : m
            );
            setCachedMessages(targetUserId, conversationId, syncedList);
            return { success: true };
          }
          console.warn('[mentorStorageService] Supabase message insert warning:', msgError.message);
          // Fallback to profile_data backup
          await backupToProfileCloud(effectiveUserId, conversationId, message);
          return { success: true };
        }

        // Also update conversation timestamp
        await supabase
          .from('mentor_conversations')
          .update({ updated_at: now })
          .eq('id', conversationId)
          .eq('user_id', effectiveUserId);

        // Mark message as synced in cache
        const syncedMsg = { ...message, syncStatus: 'synced' as const };
        const syncedList = getCachedMessages(targetUserId, conversationId).map((m) =>
          m.id === message.id ? syncedMsg : m
        );
        setCachedMessages(targetUserId, conversationId, syncedList);

        return { success: true };
      } catch (err: any) {
        console.warn('[mentorStorageService] Notice saving message:', err?.message || err);
        if (effectiveUserId) {
          await backupToProfileCloud(effectiveUserId, conversationId, message);
        }
        return { success: true };
      }
    }

    return { success: true };
  },

  /**
   * Update conversation title in Supabase & cache
   */
  async updateConversationTitle(
    conversationId: string,
    title: string,
    userId?: string
  ): Promise<{ success: boolean }> {
    const effectiveUserId = await getEffectiveUserId(userId);
    const targetUserId = effectiveUserId || userId || 'guest';

    // Update local cache
    const convs = getCachedConversations(targetUserId);
    const updated = convs.map((c) => (c.id === conversationId ? { ...c, title } : c));
    setCachedConversations(targetUserId, updated);

    if (effectiveUserId && isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('mentor_conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', conversationId)
          .eq('user_id', effectiveUserId);

        if (error && isTableMissingError(error)) {
          await backupToProfileCloud(effectiveUserId, conversationId, undefined, title);
        }
      } catch (err) {
        console.warn('[mentorStorageService] Notice updating title:', err);
        await backupToProfileCloud(effectiveUserId, conversationId, undefined, title);
      }
    }

    return { success: true };
  },

  /**
   * Delete a single conversation and its messages
   */
  async deleteConversation(
    conversationId: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const effectiveUserId = await getEffectiveUserId(userId);
    const targetUserId = effectiveUserId || userId || 'guest';

    // Clear local cache
    const convs = getCachedConversations(targetUserId);
    const remaining = convs.filter((c) => c.id !== conversationId);
    setCachedConversations(targetUserId, remaining);
    removeCachedMessages(targetUserId, conversationId);

    if (effectiveUserId && isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('mentor_conversations')
          .delete()
          .eq('id', conversationId)
          .eq('user_id', effectiveUserId);

        if (error && isTableMissingError(error)) {
          // Clean up in profile_data backup
          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('profile_data')
              .eq('id', effectiveUserId)
              .maybeSingle();

            if (prof?.profile_data) {
              const metaObj = { ...(prof.profile_data as Record<string, any>) };
              if (Array.isArray(metaObj.mentor_conversations)) {
                metaObj.mentor_conversations = metaObj.mentor_conversations.filter(
                  (c: any) => c.id !== conversationId
                );
              }
              if (metaObj.mentor_messages_by_conv) {
                delete metaObj.mentor_messages_by_conv[conversationId];
              }
              await supabase.from('profiles').update({ profile_data: metaObj }).eq('id', effectiveUserId);
            }
          } catch (_) {}
        }
      } catch (err: any) {
        console.warn('[mentorStorageService] Notice deleting conversation:', err?.message || err);
      }
    }

    return { success: true };
  },

  /**
   * Clear all conversations for the user
   */
  async clearAllConversations(userId?: string): Promise<{ success: boolean }> {
    const effectiveUserId = await getEffectiveUserId(userId);
    const targetUserId = effectiveUserId || userId || 'guest';

    // Clear local cache for this user
    setCachedConversations(targetUserId, []);

    if (effectiveUserId && isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('mentor_conversations')
          .delete()
          .eq('user_id', effectiveUserId);

        if (error && isTableMissingError(error)) {
          // Clear in profile_data
          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('profile_data')
              .eq('id', effectiveUserId)
              .maybeSingle();

            if (prof?.profile_data) {
              const metaObj = { ...(prof.profile_data as Record<string, any>) };
              metaObj.mentor_conversations = [];
              metaObj.mentor_messages_by_conv = {};
              metaObj.mentor_chat_history = [];
              await supabase.from('profiles').update({ profile_data: metaObj }).eq('id', effectiveUserId);
            }
          } catch (_) {}
        }
      } catch (err) {
        console.warn('[mentorStorageService] Notice clearing all conversations:', err);
      }
    }

    return { success: true };
  },

  getCachedConversations(userId: string = 'guest'): MentorConversation[] {
    return getCachedConversations(userId);
  },

  getCachedMessages(userId: string = 'guest', conversationId: string): MentorMessage[] {
    return getCachedMessages(userId, conversationId);
  },
};


