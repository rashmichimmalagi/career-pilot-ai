import { CodingLanguage, CodingSubmission } from '../types/coding';

export interface CodeHistoryRecord {
  lastSubmittedCode?: string;
  lastSubmittedAt?: string;
  lastRunCode?: string;
  lastRunAt?: string;
  lastDraftCode?: string;
  lastDraftAt?: string;
}

export interface RestoredCodeResult {
  code: string;
  source: 'submitted' | 'run' | 'draft' | 'starter';
  timestamp?: string;
  label: string;
}

const getHistoryStorageKey = (userId: string = 'guest', problemId: string, language: CodingLanguage): string => {
  const safeUser = (userId || 'guest').trim();
  const safeProblem = (problemId || 'default').trim();
  const safeLang = (language || 'Python').trim();
  return `careerpilot_code_history_${safeUser}_${safeProblem}_${safeLang}`;
};

const getDraftStorageKey = (userId: string = 'guest', problemId: string, language: CodingLanguage): string => {
  const safeUser = (userId || 'guest').trim();
  const safeProblem = (problemId || 'default').trim();
  const safeLang = (language || 'Python').trim();
  return `careerpilot_draft_${safeUser}_${safeProblem}_${safeLang}`;
};

export const codingHistoryService = {
  /**
   * Save source code from a Run execution
   */
  saveRunCode(userId: string = 'guest', problemId: string, language: CodingLanguage, code: string): void {
    if (!problemId || !code) return;
    try {
      const key = getHistoryStorageKey(userId, problemId, language);
      const existing: CodeHistoryRecord = JSON.parse(localStorage.getItem(key) || '{}');
      const updated: CodeHistoryRecord = {
        ...existing,
        lastRunCode: code,
        lastRunAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('[codingHistoryService] saveRunCode error:', e);
    }
  },

  /**
   * Save source code from a Submit execution
   */
  saveSubmittedCode(userId: string = 'guest', problemId: string, language: CodingLanguage, code: string): void {
    if (!problemId || !code) return;
    try {
      const key = getHistoryStorageKey(userId, problemId, language);
      const existing: CodeHistoryRecord = JSON.parse(localStorage.getItem(key) || '{}');
      const updated: CodeHistoryRecord = {
        ...existing,
        lastSubmittedCode: code,
        lastSubmittedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('[codingHistoryService] saveSubmittedCode error:', e);
    }
  },

  /**
   * Save student's active editor draft (distinct from submitted history)
   */
  saveDraftCode(userId: string = 'guest', problemId: string, language: CodingLanguage, code: string): void {
    if (!problemId || !code) return;
    try {
      // 1. Save in dedicated draft key
      const draftKey = getDraftStorageKey(userId, problemId, language);
      localStorage.setItem(draftKey, JSON.stringify({
        userId,
        problemId,
        language,
        code,
        updatedAt: new Date().toISOString(),
      }));

      // 2. Also record in history record for fast fallback lookup
      const histKey = getHistoryStorageKey(userId, problemId, language);
      const existing: CodeHistoryRecord = JSON.parse(localStorage.getItem(histKey) || '{}');
      const updated: CodeHistoryRecord = {
        ...existing,
        lastDraftCode: code,
        lastDraftAt: new Date().toISOString(),
      };
      localStorage.setItem(histKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('[codingHistoryService] saveDraftCode error:', e);
    }
  },

  /**
   * Retrieve active editor draft
   */
  getDraftCode(userId: string = 'guest', problemId: string, language: CodingLanguage): string | null {
    if (!problemId) return null;
    try {
      const draftKey = getDraftStorageKey(userId, problemId, language);
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.code) return parsed.code;
      }
      const histKey = getHistoryStorageKey(userId, problemId, language);
      const histRaw = localStorage.getItem(histKey);
      if (histRaw) {
        const parsed = JSON.parse(histRaw);
        if (parsed?.lastDraftCode) return parsed.lastDraftCode;
      }
    } catch (_) {}
    return null;
  },

  /**
   * Clear active editor draft
   */
  clearDraft(userId: string = 'guest', problemId: string, language: CodingLanguage): void {
    if (!problemId) return;
    try {
      localStorage.removeItem(getDraftStorageKey(userId, problemId, language));
      const histKey = getHistoryStorageKey(userId, problemId, language);
      const existing: CodeHistoryRecord = JSON.parse(localStorage.getItem(histKey) || '{}');
      delete existing.lastDraftCode;
      delete existing.lastDraftAt;
      localStorage.setItem(histKey, JSON.stringify(existing));
    } catch (_) {}
  },

  /**
   * Retrieve the raw history record for a specific question & language
   */
  getHistoryRecord(userId: string = 'guest', problemId: string, language: CodingLanguage): CodeHistoryRecord | null {
    if (!problemId) return null;
    try {
      const key = getHistoryStorageKey(userId, problemId, language);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  },

  /**
   * Hydrate local history cache from authoritative Supabase submissions
   */
  hydrateFromSubmissions(userId: string = 'guest', submissions: CodingSubmission[]): void {
    if (!userId || userId === 'guest' || !Array.isArray(submissions) || submissions.length === 0) return;

    try {
      for (const sub of submissions) {
        if (!sub) continue;
        const code = sub.submitted_code || sub.code;
        if (!code || code.trim().length === 0) continue;

        const probId = sub.problem_id || (sub as any).problemId;
        const lang = (sub.language || 'Python') as CodingLanguage;
        const subTime = sub.created_at || (sub as any).submitted_at || new Date().toISOString();

        if (probId) {
          const key = getHistoryStorageKey(userId, probId, lang);
          const existing: CodeHistoryRecord = JSON.parse(localStorage.getItem(key) || '{}');
          const existingTime = existing.lastSubmittedAt ? new Date(existing.lastSubmittedAt).getTime() : 0;
          const newTime = new Date(subTime).getTime();

          if (newTime >= existingTime || !existing.lastSubmittedCode) {
            existing.lastSubmittedCode = code;
            existing.lastSubmittedAt = subTime;
            localStorage.setItem(key, JSON.stringify(existing));
          }
        }

        // Also index by sanitized problem title if available
        if (sub.problem_title) {
          const safeTitle = sub.problem_title.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
          const titleKey = getHistoryStorageKey(userId, safeTitle, lang);
          const existingTitle: CodeHistoryRecord = JSON.parse(localStorage.getItem(titleKey) || '{}');
          const existingTime = existingTitle.lastSubmittedAt ? new Date(existingTitle.lastSubmittedAt).getTime() : 0;
          const newTime = new Date(subTime).getTime();

          if (newTime >= existingTime || !existingTitle.lastSubmittedCode) {
            existingTitle.lastSubmittedCode = code;
            existingTitle.lastSubmittedAt = subTime;
            localStorage.setItem(titleKey, JSON.stringify(existingTitle));
          }
        }
      }
    } catch (e) {
      console.warn('[codingHistoryService] hydrateFromSubmissions warning:', e);
    }
  },

  /**
   * Find the most relevant previous code following strict restore priority:
   * 1. Most recent submitted code (from history record or submissions database/localStorage)
   * 2. Most recent successfully run code
   * 3. Most recent saved draft
   * 4. Starter code
   */
  getRestorableCode(
    userId: string = 'guest',
    problemId: string,
    language: CodingLanguage,
    starterCode?: string,
    existingSubmissions?: CodingSubmission[],
    problemTitle?: string
  ): RestoredCodeResult | null {
    if (!problemId) return null;
    const history = this.getHistoryRecord(userId, problemId, language);

    // 1. Priority 1: Most recent submitted code
    // Check history record first
    if (history?.lastSubmittedCode && history.lastSubmittedCode.trim().length > 0) {
      return {
        code: history.lastSubmittedCode,
        source: 'submitted',
        timestamp: history.lastSubmittedAt,
        label: 'Last Submitted Code',
      };
    }

    // Also check submissions passed in or stored in local storage
    try {
      let candidateSubs = existingSubmissions;
      if (!candidateSubs || candidateSubs.length === 0) {
        const uId = userId || 'guest';
        const key = `careerpilot_subs_${uId}`;
        const stored: CodingSubmission[] = JSON.parse(localStorage.getItem(key) || '[]');
        candidateSubs = stored;
      }

      if (Array.isArray(candidateSubs) && candidateSubs.length > 0) {
        const normProblemId = problemId.trim().toLowerCase();
        const normTitle = problemTitle ? problemTitle.trim().toLowerCase() : '';

        // Find matching submission for this question and language
        const matching = candidateSubs.filter((s) => {
          if (!s) return false;
          const sProbId = (s.problem_id || (s as any).problemId || '').trim().toLowerCase();
          const sTitle = (s.problem_title || (s as any).problemTitle || '').trim().toLowerCase();
          const matchesProb = sProbId === normProblemId || (normTitle && sTitle === normTitle);
          const matchesLang = (s.language || '').trim().toLowerCase() === (language || '').trim().toLowerCase();
          const hasCode = ((s.code && s.code.trim().length > 0) || (s.submitted_code && s.submitted_code.trim().length > 0));
          return matchesProb && matchesLang && hasCode;
        });

        if (matching.length > 0) {
          // Sort by creation date descending
          matching.sort((a, b) => new Date(b.created_at || (b as any).submitted_at || 0).getTime() - new Date(a.created_at || (a as any).submitted_at || 0).getTime());
          const latestSub = matching[0];
          const subCode = latestSub.submitted_code || latestSub.code || '';
          if (subCode.trim().length > 0) {
            return {
              code: subCode,
              source: 'submitted',
              timestamp: latestSub.created_at || (latestSub as any).submitted_at,
              label: 'Last Submitted Code',
            };
          }
        }
      }
    } catch (_) {}

    // Check title-based history key as additional fallback
    if (problemTitle) {
      const safeTitle = problemTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      const titleHistory = this.getHistoryRecord(userId, safeTitle, language);
      if (titleHistory?.lastSubmittedCode && titleHistory.lastSubmittedCode.trim().length > 0) {
        return {
          code: titleHistory.lastSubmittedCode,
          source: 'submitted',
          timestamp: titleHistory.lastSubmittedAt,
          label: 'Last Submitted Code',
        };
      }
    }

    // 2. Priority 2: Most recent run code
    if (history?.lastRunCode && history.lastRunCode.trim().length > 0) {
      return {
        code: history.lastRunCode,
        source: 'run',
        timestamp: history.lastRunAt,
        label: 'Last Run Code',
      };
    }

    // 3. Priority 3: Most recent saved draft
    if (history?.lastDraftCode && history.lastDraftCode.trim().length > 0) {
      return {
        code: history.lastDraftCode,
        source: 'draft',
        timestamp: history.lastDraftAt,
        label: 'Saved Draft',
      };
    }

    // 4. Priority 4: Starter code
    if (starterCode && starterCode.trim().length > 0) {
      return {
        code: starterCode,
        source: 'starter',
        label: 'Starter Code',
      };
    }

    return null;
  },

  /**
   * Check if any previous code exists for this question + language
   */
  hasPreviousCode(
    userId: string = 'guest',
    problemId: string,
    language: CodingLanguage,
    currentCode: string = '',
    starterCode?: string,
    existingSubmissions?: CodingSubmission[],
    problemTitle?: string
  ): boolean {
    const candidate = this.getRestorableCode(userId, problemId, language, starterCode, existingSubmissions, problemTitle);
    if (!candidate) return false;
    if (candidate.source === 'submitted' || candidate.source === 'run' || candidate.source === 'draft') {
      return true;
    }
    return Boolean(candidate.code && candidate.code.trim() !== currentCode.trim());
  },
};
