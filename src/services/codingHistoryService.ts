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
   * Save student's active editor draft
   */
  saveDraftCode(userId: string = 'guest', problemId: string, language: CodingLanguage, code: string): void {
    if (!problemId || !code) return;
    try {
      const key = getHistoryStorageKey(userId, problemId, language);
      const existing: CodeHistoryRecord = JSON.parse(localStorage.getItem(key) || '{}');
      const updated: CodeHistoryRecord = {
        ...existing,
        lastDraftCode: code,
        lastDraftAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('[codingHistoryService] saveDraftCode error:', e);
    }
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
    existingSubmissions?: CodingSubmission[]
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
        // Find matching submission for this question and language
        const matching = candidateSubs.filter(
          (s) =>
            s &&
            (s.problem_id === problemId || (s as any).problemId === problemId) &&
            s.language === language &&
            ((s.code && s.code.trim().length > 0) || (s.submitted_code && s.submitted_code.trim().length > 0))
        );

        if (matching.length > 0) {
          // Sort by creation date descending
          matching.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          const latestSub = matching[0];
          const subCode = latestSub.code || latestSub.submitted_code || '';
          if (subCode.trim().length > 0) {
            return {
              code: subCode,
              source: 'submitted',
              timestamp: latestSub.created_at,
              label: 'Last Submitted Code',
            };
          }
        }
      }
    } catch (_) {}

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
    existingSubmissions?: CodingSubmission[]
  ): boolean {
    const candidate = this.getRestorableCode(userId, problemId, language, starterCode, existingSubmissions);
    if (!candidate) return false;
    // If the candidate code is not empty, and differs from current code or is a genuine previous version
    if (candidate.source === 'submitted' || candidate.source === 'run' || candidate.source === 'draft') {
      return true;
    }
    return Boolean(candidate.code && candidate.code.trim() !== currentCode.trim());
  },
};
