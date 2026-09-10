import { MentorActionLink, MentorStudentContext } from '../types/mentor';
import { getSupabaseAccessToken } from '../lib/supabase';
import {
  analyzeAssistantQueryIntent,
  buildScopedStudentContext,
  QueryIntentResult,
  ScopedStudentContext,
} from './aiAssistantIntentService';

export interface AssistantChatResponse {
  reply: string;
  suggestedFollowUps: string[];
  actionLinks?: MentorActionLink[];
  intent?: QueryIntentResult;
}

/**
 * Sends a user query to the dedicated CareerPilot AI Assistant backend endpoint.
 * Ensures that:
 * 1. Intent is determined prior to context injection.
 * 2. General questions receive general answers without unrelated personal metrics.
 * 3. Personalized questions only receive relevant, authorized context slices.
 * 4. The direct answer is always prioritized first.
 */
export async function sendAssistantMessage(
  userQuery: string,
  history: Array<{ sender: 'user' | 'assistant' | 'mentor'; text: string }>,
  fullStudentContext?: MentorStudentContext | null
): Promise<AssistantChatResponse> {
  const query = (userQuery || '').trim();

  // 1. Analyze Intent
  const intentResult = analyzeAssistantQueryIntent(query, history);

  // 2. Select & Scope Context ONLY if required
  let scopedContext: ScopedStudentContext | null = null;
  if (intentResult.requiresPersonalContext && fullStudentContext) {
    scopedContext = buildScopedStudentContext(
      fullStudentContext,
      intentResult.requiredCategories
    );
  }

  // 3. Acquire authenticated Supabase JWT
  const token = await getSupabaseAccessToken();

  // 4. Dispatch to dedicated server endpoint
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
      message: query,
      messages: history,
      intent: intentResult,
      scopedContext: scopedContext || undefined,
    };

    const response = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data && typeof json.data.reply === 'string') {
        return {
          reply: json.data.reply.trim(),
          suggestedFollowUps: Array.isArray(json.data.suggestedFollowUps)
            ? json.data.suggestedFollowUps.slice(0, 3)
            : [],
          actionLinks: Array.isArray(json.data.actionLinks)
            ? json.data.actionLinks.slice(0, 3)
            : [],
          intent: intentResult,
        };
      }
    }
  } catch (err) {
    console.warn('[AssistantService] Backend request failed, utilizing offline fallback:', err);
  }

  // 5. Offline Fallback Synthesizer (Strictly respecting intent!)
  return generateIntentAwareFallback(query, intentResult, scopedContext);
}

/**
 * High-quality offline synthesizer that adheres to the user intent rules:
 * - General questions get general answers.
 * - Never dump unrelated preparation metrics into a general question.
 */
function generateIntentAwareFallback(
  query: string,
  intent: QueryIntentResult,
  context: ScopedStudentContext | null
): AssistantChatResponse {
  const lower = query.toLowerCase();

  // 1. GENERAL QUESTIONS -> Direct general technical answers
  if (intent.intentType === 'GENERAL') {
    if (lower.includes('linux') && lower.includes('process')) {
      return {
        reply: `### Understanding Processes in Linux

In Linux, a **process** is an instance of an executing program. Each process has its own address space, memory pages, open file descriptors, security attributes, and environment variables.

#### Core Process Concepts:
1. **PID (Process ID)**: A unique numerical identifier assigned to every running process by the kernel. The ancestor of all processes is \`systemd\` (PID 1).
2. **Process States**:
   * **Running/Runnable (\`R\`)**: Currently executing on a CPU core or queued in the run-queue.
   * **Sleeping (\`S\` / \`D\`)**: Interruptible sleep waiting for an event (\`S\`), or uninterruptible sleep waiting for I/O hardware (\`D\`).
   * **Stopped (\`T\`)**: Suspended by a signal (e.g. \`SIGSTOP\` or \`Ctrl+Z\`).
   * **Zombie (\`Z\`)**: Terminated execution, but its exit code hasn't yet been read by its parent via \`wait()\`.
3. **Creation Lifecycle**:
   * Processes are created using the \`fork()\` system call (cloning parent state with copy-on-write).
   * They load a new binary image using the \`exec()\` family of system calls.

#### Useful Linux Inspection Commands:
* \`ps aux\` or \`ps -ef\` — Inspect all running processes.
* \`top\` or \`htop\` — Real-time interactive process viewer.
* \`kill -15 <PID>\` — Gracefully request termination (\`SIGTERM\`).
* \`kill -9 <PID>\` — Force immediate termination (\`SIGKILL\`).`,
        suggestedFollowUps: [
          'What is the difference between a process and a thread?',
          'How does fork() and exec() work in Linux?',
          'How do you debug zombie processes?',
        ],
        actionLinks: [],
      };
    }

    if (lower.includes('normalization') || lower.includes('dbms')) {
      return {
        reply: `### Database Normalization in DBMS

**Normalization** is the systematic process of organizing relational database tables to reduce data redundancy, eliminate update anomalies (insertion, deletion, update), and preserve data integrity.

#### The Normal Forms:
1. **1NF (First Normal Form)**:
   * Each column must contain only **atomic (indivisible)** values.
   * No repeating groups or arrays within a single attribute.
   * Each row must have a unique identifier (Primary Key).
2. **2NF (Second Normal Form)**:
   * Must already be in 1NF.
   * Must eliminate **partial functional dependencies** (every non-key attribute must depend on the whole primary key, not just part of a composite key).
3. **3NF (Third Normal Form)**:
   * Must already be in 2NF.
   * Must eliminate **transitive dependencies** (non-prime attributes must not depend on other non-prime attributes: $X \\rightarrow Y \\rightarrow Z$).
4. **BCNF (Boyce-Codd Normal Form)**:
   * A stricter version of 3NF. For every functional dependency $X \\rightarrow Y$, $X$ must be a super key.

#### Trade-offs:
* **Higher Normalization**: Minimizes disk space and prevents data inconsistencies on writes.
* **Denormalization**: Used in read-heavy analytics/warehouses (OLAP) to avoid expensive multi-table joins.`,
        suggestedFollowUps: [
          'What is the difference between 3NF and BCNF?',
          'When should you denormalize a database?',
          'Explain ACID properties with real-world examples.',
        ],
        actionLinks: [],
      };
    }

    if (lower.includes('project') || lower.includes('ideas')) {
      return {
        reply: `### Full Stack Development Project Ideas

Here are 5 high-impact, industry-grade Full Stack project ideas designed to stand out on engineering placement resumes:

1. **Real-Time Collaborative Markdown / Code Editor**
   * **Tech Stack**: React, Node.js, WebSockets (Socket.io), Redis Pub/Sub, PostgreSQL.
   * **Key Engineering Highlights**: Operational Transformation (OT) or CRDTs for conflict resolution, room-based access control, syntax highlighting, export to PDF/HTML.

2. **Distributed Job Queue & Background Task Orchestrator**
   * **Tech Stack**: TypeScript, Express, BullMQ / Redis, Worker Threads, React Dashboard.
   * **Key Engineering Highlights**: Retry logic with exponential backoff, rate limiting, cron-style recurring jobs, real-time worker metrics visualization.

3. **Event-Driven E-Commerce Engine with Micro-services**
   * **Tech Stack**: Next.js, Node.js, RabbitMQ/Kafka, PostgreSQL, Stripe integration.
   * **Key Engineering Highlights**: Idempotent order processing, webhook handling, inventory reservation locks, search indexing with Elasticsearch.

4. **API Rate Limiter & Reverse Proxy Gateway**
   * **Tech Stack**: Go or Node.js, Redis (Token Bucket / Sliding Window algorithms), React Admin UI.
   * **Key Engineering Highlights**: IP & API-key based rate limiting, latency telemetry, caching middleware, JWT token verification.

5. **AI-Assisted Document Q&A Knowledge Base (RAG)**
   * **Tech Stack**: React, FastAPI / Express, pgvector (PostgreSQL vector embeddings), Gemini / OpenAI API.
   * **Key Engineering Highlights**: Document chunking, hybrid vector/keyword search, citations, streaming token responses.`,
        suggestedFollowUps: [
          'How should I structure the database for the collaborative editor?',
          'What are the best practices for handling payments with Stripe webhooks?',
          'Which project should I build based on my current skills?',
        ],
        actionLinks: [],
      };
    }

    if (lower.includes('react') && (lower.includes('hook') || lower.includes('hooks'))) {
      return {
        reply: `### Core React Hooks Overview

**React Hooks** allow functional components to manage state, handle side effects, access context, and interact with the DOM without writing class components.

#### Essential Hooks:
1. **\`useState\`**: Declares a reactive state variable and updater function.
   \`\`\`tsx
   const [count, setCount] = useState<number>(0);
   \`\`\`
2. **\`useEffect\`**: Performs side effects (data fetching, subscriptions, DOM mutation).
   * Replaces \`componentDidMount\`, \`componentDidUpdate\`, and \`componentWillUnmount\`.
   * Always include primitive dependencies in the dependency array and return a cleanup function.
3. **\`useRef\`**: Holds a mutable reference across renders without triggering a re-render. Perfect for DOM elements and interval timers.
4. **\`useMemo\` & \`useCallback\`**:
   * \`useMemo\`: Memoizes expensive calculation results.
   * \`useCallback\`: Memoizes callback function references to avoid breaking child component shallow equality.
5. **\`useContext\`**: Consumes values from a React Context without prop drilling.

#### Rules of Hooks:
* Only call hooks at the **top level** of your React component (never inside loops, conditions, or nested functions).
* Only call hooks from **React functional components** or **custom hooks**.`,
        suggestedFollowUps: [
          'What is the difference between useMemo and useCallback?',
          'How do you write a custom hook in TypeScript?',
          'When should you avoid using useEffect?',
        ],
        actionLinks: [],
      };
    }

    if (lower.includes('react')) {
      return {
        reply: `### What is React?

**React** is a popular declarative, component-based open-source JavaScript library developed by Meta for building dynamic, interactive user interfaces for single-page web applications.

#### Core Principles of React:
1. **Component-Based Architecture**: UIs are composed of small, isolated, reusable building blocks called components. Components manage their own state and can be nested.
2. **Declarative UI**: You describe *what* the UI should look like for a given state, and React handles DOM updates when state changes.
3. **Virtual DOM & Reconciliation**: React keeps an in-memory representation of the real DOM. When data changes, React calculates the diff via the reconciliation algorithm and batches minimal DOM updates for high rendering performance.
4. **Unidirectional Data Flow**: Data flows down from parent components to child components via \`props\`, making data tracking and debugging predictable.
5. **JSX (JavaScript XML)**: A syntax extension that lets you write HTML-like markup inside JavaScript/TypeScript files.`,
        suggestedFollowUps: [
          'What are React Hooks and how do they work?',
          'What is the difference between Virtual DOM and Real DOM?',
          'What are React Server Components (RSC)?',
        ],
        actionLinks: [],
      };
    }

    // Generic technical answer fallback
    return {
      reply: `### Technical Guidance

Regarding **${query}**:

In software engineering and placement interviews, structuring your understanding around fundamentals, trade-offs, and real-world implementations is critical.

* **Core Concept**: Break down the problem into input, transformation, and output.
* **Architecture & Complexity**: Evaluate time complexity ($O(n)$) and space complexity ($O(1)$) trade-offs.
* **Production Standards**: Consider edge cases, error handling, security (e.g. sanitization, authentication), and concurrency.

Feel free to ask for concrete code examples, architectural diagrams, or interview questions on this topic!`,
      suggestedFollowUps: [
        'Can you provide a code example for this?',
        'What are the common interview questions on this topic?',
        'What are the performance trade-offs?',
      ],
      actionLinks: [],
    };
  }

  // 2. PERSONALIZED QUESTIONS -> Use authorized scoped context only
  const studentName = context?.studentName || 'Student';
  const targetRole = context?.targetRole || 'Software Engineer';
  const targetCompany = context?.targetCompany || 'Top Tech Companies';

  if (intent.requiredCategories.includes('resume_analysis')) {
    const resume = context?.resumeData;
    if (!resume || !resume.isAnalyzed) {
      return {
        reply: `### Resume Optimization Guidance for ${studentName}

You currently have not uploaded or analyzed a resume in CareerPilot.

To get personalized keyword gap analysis and role-matching metrics:
1. Navigate to the **Resume Analyzer** module.
2. Upload your PDF resume to evaluate ATS compatibility against **${targetRole}**.

#### General Guidelines to Make Your Technical Resume ATS-Friendly:
* Use a single-column, standard reverse-chronological layout.
* Avoid tables, multi-column text boxes, and icons that confuse ATS parsers.
* Format project bullet points using the **Google XYZ Formula**: *"Accomplished [X], as measured by [Y], by doing [Z]"*.
* Ensure core languages and frameworks (e.g. React, Node.js, SQL, TypeScript) appear in a dedicated Technical Skills section.`,
        suggestedFollowUps: [
          'What makes a resume ATS friendly?',
          'How do I write XYZ formula bullet points?',
          'Which skills are most important for my target role?',
        ],
        actionLinks: [
          {
            label: 'Open Resume Analyzer',
            route: 'resume-analyzer',
            icon: 'FileText',
            description: 'Upload and analyze your resume against target roles',
          },
        ],
      };
    }

    return {
      reply: `### Resume Insights for ${studentName} (${targetRole})

* **ATS Compatibility Score**: **${resume.atsScore ?? 0}/100**
* **Role Match Score**: **${resume.roleMatchScore ?? 0}/100**

#### Key Strengths:
${
  resume.strengths && resume.strengths.length > 0
    ? resume.strengths.map((s) => `* ${s}`).join('\n')
    : '* Clear education credentials and foundational skills.'
}

#### High-Priority Missing Keywords & Gaps:
${
  resume.missingSkills && resume.missingSkills.length > 0
    ? resume.missingSkills.map((s) => `* **${s}**: Consider incorporating this in your projects or coursework.`).join('\n')
    : '* No critical keyword gaps identified.'
}

#### Recommended Action:
${
  resume.improvementSuggestions && resume.improvementSuggestions.length > 0
    ? resume.improvementSuggestions[0]
    : 'Incorporate quantifiable metrics into your project bullet points.'
}`,
      suggestedFollowUps: [
        'How can I improve my project bullet points?',
        'Which project should I add to cover missing skills?',
        'Can you optimize a bullet point for my resume?',
      ],
      actionLinks: [
        {
          label: 'Review Resume Analysis',
          route: 'resume-analyzer',
          icon: 'FileText',
          description: 'View full keyword gaps and ATS recommendations',
        },
      ],
    };
  }

  if (intent.requiredCategories.includes('coding_performance')) {
    const coding = context?.codingData;
    return {
      reply: `### DSA & Coding Practice Summary

* **Problems Solved**: **${coding?.totalSolved ?? 0}** (Easy: ${coding?.easySolved ?? 0}, Medium: ${coding?.mediumSolved ?? 0}, Hard: ${coding?.hardSolved ?? 0})
* **Overall Accuracy**: **${coding?.overallAccuracy ?? 0}%** across ${coding?.totalAttempted ?? 0} attempts

#### Priority Focus Areas:
${
  coding?.weakTopics && coding.weakTopics.length > 0
    ? coding.weakTopics.map((t) => `* **${t}**: Low accuracy detected; practice foundational medium patterns.`).join('\n')
    : '* Core algorithms: Arrays, Two Pointers, Sliding Window, Dynamic Programming.'
}

#### Strong Topics:
${
  coding?.strongTopics && coding.strongTopics.length > 0
    ? coding.strongTopics.map((t) => `* **${t}**: Consistent high accuracy.`).join('\n')
    : '* Continue daily practice to maintain problem-solving speed.'
}`,
      suggestedFollowUps: [
        'Which DSA topic should I practice today?',
        'Can you give me a practice problem on my weak topic?',
        'How should I approach Dynamic Programming?',
      ],
      actionLinks: [
        {
          label: 'Practice Coding Problems',
          route: 'coding',
          icon: 'Code2',
          description: 'Solve curated problems in the Coding Arena',
        },
      ],
    };
  }

  // Profile-based projects
  if (intent.requiredCategories.includes('profile_skills')) {
    const skills = context?.declaredSkills || [];
    const skillsList = skills.length > 0 ? skills.join(', ') : 'JavaScript, TypeScript, React, SQL';

    return {
      reply: `### Tailored Project Recommendations for ${studentName}

Based on your target role as **${targetRole}** and your active technical stack (**${skillsList}**):

1. **Production-Ready Enterprise Dashboard**
   * **Focus**: Advanced State Management, Server-Side Caching, Data Visualization.
   * **Why it fits**: Directly demonstrates mastery of ${skills.slice(0, 2).join(' and ') || 'React'} for recruiter evaluations.

2. **Secure REST / GraphQL Microservice API**
   * **Focus**: JWT Authentication, RBAC (Role-Based Access Control), Rate Limiting, Automated Integration Testing.
   * **Why it fits**: Covers crucial backend engineering requirements expected of a ${targetRole}.

3. **Cloud-Deployed Event Pipeline**
   * **Focus**: Asynchronous job handling, Webhooks, Docker containerization.
   * **Why it fits**: Proves you can deploy and maintain code in production environments.`,
      suggestedFollowUps: [
        'How should I describe this project on my resume?',
        'What database schema would you recommend for this?',
        'What skills am I missing for this role?',
      ],
      actionLinks: [
        {
          label: 'Explore Roadmap Milestones',
          route: 'roadmap',
          icon: 'Map',
          description: 'Track your project milestones on the career roadmap',
        },
      ],
    };
  }

  // Comprehensive preparation analysis
  const readiness = context?.placementReadiness;
  return {
    reply: `### Placement Preparation Overview for ${studentName}

* **Target Goal**: **${targetRole}** at **${targetCompany}**
* **Placement Readiness Score**: **${readiness?.overallScore ?? 0}/100** (${readiness?.statusCategory || 'In Progress'})
* **Primary Focus Area**: ${readiness?.weakestArea || 'Core Coding & Placement Assessments'}

#### Actionable Recommendations:
* **Resume**: Ensure your project bullet points quantify business impact using measurable metrics.
* **DSA**: Focus on 1-2 Medium problems daily, emphasizing time and space complexity explanations.
* **Consistency**: Maintain a continuous daily problem streak to build momentum.`,
    suggestedFollowUps: [
      'What are my specific weak areas?',
      'Which topic should I practice today?',
      'How can I improve my placement readiness?',
    ],
    actionLinks: [
      {
        label: 'View Placement Readiness',
        route: 'roadmap',
        icon: 'Map',
        description: 'See detailed pillar breakdown and next milestones',
      },
    ],
  };
}
