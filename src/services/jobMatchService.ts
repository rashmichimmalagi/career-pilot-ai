/**
 * Job Description ↔ Resume Match Service
 * Compares job postings against the student's actual resume text to calculate match score,
 * missing skills, keywords, experience alignment, and actionable improvements.
 *
 * Persists match analyses to Supabase and local cache.
 */

import { JobMatchAnalysis, JobMatchRequest, JobMatchSkillItem } from '../types/intelligence';
import { ResumeVersionItem } from '../types/resume';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { persistenceManager } from './persistenceManager';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const KNOWN_SKILL_KEYWORDS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Python', 'Java', 'C++',
  'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'Cassandra', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'Git',
  'CI/CD', 'REST API', 'GraphQL', 'gRPC', 'WebSockets', 'HTML5', 'CSS3', 'Tailwind',
  'Next.js', 'Vue.js', 'Angular', 'Redux', 'Zustand', 'Data Structures', 'Algorithms',
  'System Design', 'OOP', 'Microservices', 'Kafka', 'RabbitMQ', 'Linux', 'Bash',
  'Agile', 'Scrum', 'Unit Testing', 'Jest', 'Cypress', 'Playwright', 'Selenium',
  'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas', 'NumPy', 'FastAPI', 'Django',
  'Spring Boot', 'Kotlin', 'Swift', 'SwiftUI', 'Jetpack Compose', 'React Native',
  'Flutter', 'Cybersecurity', 'OWASP', 'Cryptography', 'Snowflake', 'Airflow', 'Spark'
];

/**
 * Local Storage Key Helper (Namespaced per authenticated user)
 */
const getJobMatchesKey = (studentId: string) => `careerpilot_job_matches_${studentId || 'guest'}`;

/**
 * Helper to get effective authenticated user ID
 */
async function getEffectiveUserId(providedId?: string): Promise<string> {
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) return user.id;
    } catch (_) {}
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) return session.user.id;
    } catch (_) {}
  }
  if (providedId && providedId !== 'guest') {
    return providedId;
  }
  return 'guest';
}

function formatJobMatchRow(row: any): JobMatchAnalysis {
  const full = row.full_analysis || {};
  return {
    id: row.id,
    jobTitle: row.target_job_title || full.jobTitle || 'Software Engineer',
    companyName: row.company_name || full.companyName || undefined,
    resumeName: full.resumeName || 'Resume',
    resumeId: row.resume_id || full.resumeId || undefined,
    matchScore: Number(row.match_score) || full.matchScore || 0,
    matchingSkills: Array.isArray(row.matching_skills) ? row.matching_skills : (full.matchingSkills || []),
    missingSkills: Array.isArray(row.missing_skills) ? row.missing_skills : (full.missingSkills || []),
    allExtractedSkills: full.allExtractedSkills || [],
    relevantExperience: full.relevantExperience || {
      alignmentScore: Number(row.match_score) || 0,
      matchingPoints: [],
      gapPoints: [],
    },
    missingKeywords: Array.isArray(row.keyword_gaps) ? row.keyword_gaps : (full.missingKeywords || []),
    projectAlignment: full.projectAlignment || {
      score: Number(row.match_score) || 0,
      analysisText: '',
      suggestedProjectIdeas: [],
    },
    potentialAtsIssues: full.potentialAtsIssues || [],
    recommendedImprovements: Array.isArray(row.recommendations) ? row.recommendations : (full.recommendedImprovements || []),
    analyzedAt: row.created_at || full.analyzedAt || new Date().toISOString(),
  };
}

export interface JobMatchHistoryResult {
  data: JobMatchAnalysis[];
  error: string | null;
  isCloud: boolean;
}

/**
 * Fetch past Job Match analyses for the student from Supabase (Source of Truth)
 * Returns status, error details, and cloud synchronization state.
 */
export async function fetchJobMatchHistoryResult(studentId: string = 'guest'): Promise<JobMatchHistoryResult> {
  const effectiveUserId = await getEffectiveUserId(studentId);
  const cacheKey = getJobMatchesKey(effectiveUserId);

  if (!isSupabaseConfigured() || effectiveUserId === 'guest') {
    return {
      data: getJobMatchHistory(effectiveUserId),
      error: null,
      isCloud: false,
    };
  }

  // 1. Primary: Query dedicated `job_resume_matches` table from Supabase
  try {
    const { data, error } = await supabase
      .from('job_resume_matches')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        const formatted: JobMatchAnalysis[] = data.map((row: any) => formatJobMatchRow(row));
        try {
          localStorage.setItem(cacheKey, JSON.stringify(formatted));
        } catch (_) {}
        return { data: formatted, error: null, isCloud: true };
      }

      // Check if match history is backed up in profiles.profile_data
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('profile_data')
          .eq('id', effectiveUserId)
          .maybeSingle();

        const profileMatches = profileRow?.profile_data?.job_match_history;
        if (Array.isArray(profileMatches) && profileMatches.length > 0) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(profileMatches));
          } catch (_) {}
          return { data: profileMatches, error: null, isCloud: true };
        }
      } catch (_) {}

      // Authoritative 0 records in Supabase
      try {
        localStorage.setItem(cacheKey, JSON.stringify([]));
      } catch (_) {}
      return { data: [], error: null, isCloud: true };
    }

    // 2. If table returned error (e.g., 42P01 table does not exist), fallback to `profiles` table
    if (error) {
      console.warn('[JobMatchService] job_resume_matches query warning:', error.message);
      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('profile_data')
        .eq('id', effectiveUserId)
        .maybeSingle();

      if (!profileErr && profileRow) {
        const profileMatches = profileRow.profile_data?.job_match_history;
        if (Array.isArray(profileMatches)) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(profileMatches));
          } catch (_) {}
          return { data: profileMatches, error: null, isCloud: true };
        }
        return { data: [], error: null, isCloud: true };
      }

      // Both failed - report error
      return {
        data: getJobMatchHistory(effectiveUserId),
        error: error.message || 'Unable to load match history from Supabase cloud.',
        isCloud: false,
      };
    }
  } catch (err: any) {
    console.error('[JobMatchService] Supabase history fetch exception:', err);
    return {
      data: getJobMatchHistory(effectiveUserId),
      error: err?.message || 'Database connection error',
      isCloud: false,
    };
  }

  return {
    data: getJobMatchHistory(effectiveUserId),
    error: null,
    isCloud: false,
  };
}

/**
 * Fetch past Job Match analyses for the student from Supabase (Source of Truth)
 */
export async function fetchJobMatchHistory(studentId: string = 'guest'): Promise<JobMatchAnalysis[]> {
  const res = await fetchJobMatchHistoryResult(studentId);
  return res.data;
}

/**
 * Synchronous local cache reader for initial instant mount
 */
export function getJobMatchHistory(studentId: string = 'guest'): JobMatchAnalysis[] {
  try {
    const raw = localStorage.getItem(getJobMatchesKey(studentId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (_) {}
  return [];
}

/**
 * Persist Job Match result to Supabase (Source of Truth) and local cache
 */
export async function saveJobMatchResult(
  studentId: string = 'guest',
  analysis: JobMatchAnalysis,
  jobDescriptionText: string = ''
): Promise<{ success: boolean; error?: string }> {
  const effectiveUserId = await getEffectiveUserId(studentId);
  const cacheKey = getJobMatchesKey(effectiveUserId);

  if (!isSupabaseConfigured() || effectiveUserId === 'guest') {
    // Local / guest mode
    try {
      const history = getJobMatchHistory(effectiveUserId);
      const filtered = history.filter((h) => h.id !== analysis.id);
      const updated = [analysis, ...filtered].slice(0, 50);
      localStorage.setItem(cacheKey, JSON.stringify(updated));
    } catch (_) {}
    return { success: true };
  }

  let savedToSupabase = false;
  let lastError: string | undefined;

  // 1. Primary: Save to `job_resume_matches` table in Supabase
  try {
    const { error } = await supabase
      .from('job_resume_matches')
      .upsert(
        {
          id: analysis.id,
          user_id: effectiveUserId,
          resume_id: analysis.resumeId || null,
          target_job_title: analysis.jobTitle || 'Target Role',
          company_name: analysis.companyName || '',
          job_description: jobDescriptionText || '',
          match_score: analysis.matchScore,
          matching_skills: analysis.matchingSkills || [],
          missing_skills: analysis.missingSkills || [],
          keyword_gaps: analysis.missingKeywords || [],
          recommendations: analysis.recommendedImprovements || [],
          full_analysis: analysis,
          created_at: analysis.analyzedAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (!error) {
      savedToSupabase = true;
    } else {
      console.warn('[JobMatchService] job_resume_matches upsert warning:', error.message);
      lastError = error.message;
    }
  } catch (err: any) {
    console.warn('[JobMatchService] job_resume_matches upsert exception:', err);
    lastError = err?.message;
  }

  // 2. Secondary resilience: Also backup into `profiles.profile_data.job_match_history`
  try {
    const history = getJobMatchHistory(effectiveUserId);
    const filtered = history.filter((h) => h.id !== analysis.id);
    const updated = [analysis, ...filtered].slice(0, 50);

    const profileRes = await persistenceManager.writeProfileMetadata(effectiveUserId, {
      job_match_history: updated,
    });
    if (profileRes) {
      savedToSupabase = true;
    }
  } catch (_) {}

  // 3. Update local cache ONLY if saved to Supabase (or return error)
  if (savedToSupabase) {
    try {
      const history = getJobMatchHistory(effectiveUserId);
      const filtered = history.filter((h) => h.id !== analysis.id);
      const updated = [analysis, ...filtered].slice(0, 50);
      localStorage.setItem(cacheKey, JSON.stringify(updated));
    } catch (_) {}
    return { success: true };
  }

  return {
    success: false,
    error: lastError || 'Could not persist match analysis to Supabase. Check database permissions or connectivity.',
  };
}

/**
 * Delete a Job Match analysis from Supabase (Source of Truth) and local cache
 */
export async function deleteJobMatchHistoryItem(
  studentId: string = 'guest',
  matchId: string
): Promise<{ success: boolean; updatedHistory: JobMatchAnalysis[]; error?: string }> {
  const effectiveUserId = await getEffectiveUserId(studentId);
  const cacheKey = getJobMatchesKey(effectiveUserId);

  const history = getJobMatchHistory(effectiveUserId);
  const updated = history.filter((h) => h.id !== matchId);

  // 1. Delete from Supabase
  if (isSupabaseConfigured() && effectiveUserId !== 'guest') {
    try {
      const { error } = await supabase
        .from('job_resume_matches')
        .delete()
        .eq('id', matchId)
        .eq('user_id', effectiveUserId);

      if (error) {
        console.warn('[JobMatchService] Supabase delete warning:', error.message);
      }

      try {
        await persistenceManager.writeProfileMetadata(effectiveUserId, {
          job_match_history: updated,
        });
      } catch (_) {}
    } catch (err: any) {
      console.warn('[JobMatchService] Supabase delete exception:', err);
    }
  }

  // 2. Update local cache
  try {
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  } catch (_) {}

  return { success: true, updatedHistory: updated };
}

/**
 * Deterministic local parser for Job Match
 */
export function performLocalJobMatch(
  jobDescriptionText: string,
  resumeText: string,
  meta?: { jobTitle?: string; companyName?: string; resumeName?: string; resumeId?: string }
): JobMatchAnalysis {
  const jdLower = jobDescriptionText.toLowerCase();
  const resumeLower = resumeText.toLowerCase();

  const extractedSkills: JobMatchSkillItem[] = [];
  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of KNOWN_SKILL_KEYWORDS) {
    const sLower = skill.toLowerCase();
    const inJd = jdLower.includes(sLower);
    if (inJd) {
      const inResume = resumeLower.includes(sLower);
      const isCritical = [
        'javascript', 'typescript', 'react', 'python', 'java', 'sql', 'node.js',
        'c++', 'aws', 'docker', 'kubernetes', 'algorithms', 'data structures'
      ].includes(sLower);

      extractedSkills.push({
        skill,
        importance: isCritical ? 'critical' : 'preferred',
        matchedInResume: inResume,
      });

      if (inResume) {
        matchingSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }
  }

  // Calculate Match Score
  const totalSkills = extractedSkills.length;
  let matchScore = 70;
  if (totalSkills > 0) {
    const critical = extractedSkills.filter((s) => s.importance === 'critical');
    const matchedCritical = critical.filter((s) => s.matchedInResume).length;
    const preferred = extractedSkills.filter((s) => s.importance !== 'critical');
    const matchedPreferred = preferred.filter((s) => s.matchedInResume).length;

    const critScore = critical.length > 0 ? (matchedCritical / critical.length) * 60 : 60;
    const prefScore = preferred.length > 0 ? (matchedPreferred / preferred.length) * 40 : 40;
    matchScore = Math.max(15, Math.min(100, Math.round(critScore + prefScore)));
  } else {
    // If no specific preset keywords detected, base score on length and basic keywords
    const commonMatches = ['experience', 'developer', 'software', 'engineer', 'code', 'project', 'api']
      .filter((w) => resumeLower.includes(w) && jdLower.includes(w));
    matchScore = Math.min(85, Math.max(45, 50 + commonMatches.length * 6));
  }

  // Missing Keywords
  const missingKeywords = missingSkills.slice(0, 8);

  // ATS Issues check
  const potentialAtsIssues: string[] = [];
  if (resumeText.length < 300) {
    potentialAtsIssues.push('Resume text is very brief; expand technical projects with measurable STAR bullet points.');
  }
  if (!resumeLower.includes('experience') && !resumeLower.includes('project')) {
    potentialAtsIssues.push('Standard "Projects" or "Experience" section header was not detected.');
  }
  if (!resumeLower.includes('education')) {
    potentialAtsIssues.push('Standard "Education" section header was not detected.');
  }
  if (!resumeLower.includes('skills')) {
    potentialAtsIssues.push('Standard "Technical Skills" section header was not detected.');
  }

  // Recommended Improvements
  const recommendedImprovements: string[] = [];
  if (missingSkills.length > 0) {
    recommendedImprovements.push(
      `Incorporate key required skills into your project bullets: ${missingSkills.slice(0, 4).join(', ')}.`
    );
  }
  recommendedImprovements.push('Ensure project bullet points utilize the STAR/XYZ method (Accomplished [X], as measured by [Y], by doing [Z]).');
  recommendedImprovements.push(`Align your Professional Summary statement specifically toward "${meta?.jobTitle || 'the target role'}".`);
  if (potentialAtsIssues.length > 0) {
    recommendedImprovements.push('Fix ATS formatting warnings to ensure automated parsers index your key achievements.');
  }

  return {
    id: `job_match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    jobTitle: meta?.jobTitle || 'Software Engineer',
    companyName: meta?.companyName,
    resumeName: meta?.resumeName || 'Current Resume',
    resumeId: meta?.resumeId,
    matchScore,
    matchingSkills,
    missingSkills,
    allExtractedSkills: extractedSkills,
    relevantExperience: {
      alignmentScore: Math.min(100, Math.max(30, matchScore + 5)),
      matchingPoints: matchingSkills.length > 0
        ? matchingSkills.map((s) => `Demonstrates relevant background and hands-on usage of ${s}`)
        : ['Demonstrates fundamental software development competencies.'],
      gapPoints: missingSkills.length > 0
        ? missingSkills.map((s) => `Lacks explicit project or coursework mention of ${s}`)
        : ['No major skill gaps detected for this role.'],
    },
    missingKeywords,
    projectAlignment: {
      score: Math.max(40, matchScore - 5),
      analysisText: `Resume contains ${matchingSkills.length} overlapping technical competencies with the target role description.`,
      suggestedProjectIdeas: missingSkills.length > 0
        ? missingSkills.slice(0, 2).map((s) => `Build and deploy a full-stack project demonstrating ${s}`)
        : ['Expand current projects with automated unit testing and CI/CD pipelines.'],
    },
    potentialAtsIssues,
    recommendedImprovements,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Primary Job Match Analyzer function
 * Attempts backend Gemini endpoint with fallback to deterministic local parser
 */
export async function analyzeJobMatch(
  request: JobMatchRequest,
  studentId: string = 'guest'
): Promise<JobMatchAnalysis> {
  const { jobDescriptionText, resumeId, customResumeText, jobTitle, companyName } = request;

  let resumeContent = customResumeText || '';

  // If no direct resume text provided, use standard structure from local cache
  if (!resumeContent && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`careerpilot_resumes_${studentId}`) || localStorage.getItem('careerpilot_resumes_guest');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const selected = resumeId ? parsed.find((r: ResumeVersionItem) => r.id === resumeId) : parsed[0];
          resumeContent = selected?.resumeText || selected?.raw_text || selected?.targetRole || '';
        }
      }
    } catch (_) {}
  }

  if (!resumeContent) {
    resumeContent = 'Full Stack Developer with experience in React, TypeScript, JavaScript, Node.js, REST APIs, and SQL.';
  }

  let finalAnalysis: JobMatchAnalysis;

  // Attempt server API call
  try {
    const res = await fetchWithTimeout('/api/job-match/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescriptionText,
        resumeText: resumeContent,
        jobTitle,
        companyName,
        resumeId,
      }),
      timeoutMs: 9000,
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.analysis) {
        finalAnalysis = data.analysis;
      } else {
        throw new Error('Malformed backend response');
      }
    } else {
      throw new Error(`Server returned ${res.status}`);
    }
  } catch (_) {
    // Fallback to local rule-based engine
    finalAnalysis = performLocalJobMatch(jobDescriptionText, resumeContent, {
      jobTitle,
      companyName,
      resumeName: resumeId ? 'Resume Version' : 'Current Resume',
      resumeId,
    });
  }

  // Persist to Supabase (Source of Truth) and local cache
  await saveJobMatchResult(studentId, finalAnalysis, jobDescriptionText);

  return finalAnalysis;
}

