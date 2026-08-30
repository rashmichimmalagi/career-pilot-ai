export interface OfflineQuote {
  id: string;
  category: string;
  categoryLabel: string;
  iconType:
    | 'web'
    | 'react'
    | 'typescript'
    | 'javascript'
    | 'fullstack'
    | 'coding'
    | 'debugging'
    | 'engineering'
    | 'git'
    | 'github'
    | 'opensource'
    | 'resume'
    | 'resumeanalysis'
    | 'ats'
    | 'techinterview'
    | 'hrinterview'
    | 'placement'
    | 'career'
    | 'learning'
    | 'general';
  quote: string;
  author: string;
}

export const OFFLINE_QUOTES: OfflineQuote[] = [
  // =========================================================================
  // 1. Web Development (10 tips)
  // =========================================================================
  {
    id: 'web-1',
    category: 'Web Development',
    categoryLabel: '💻 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Always build for semantic HTML first. Search engines, screen readers, and performance parsers will thank you.',
    author: 'CareerPilot AI',
  },
  {
    id: 'web-2',
    category: 'Web Development',
    categoryLabel: '💻 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Prioritize Core Web Vitals (LCP, INP, CLS) early. Fast rendering directly improves user engagement and conversion.',
    author: 'CareerPilot AI',
  },
  {
    id: 'web-3',
    category: 'Web Development',
    categoryLabel: '💻 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Design mobile-first with responsive fluid containers, rather than hacking desktop layouts down to small screens.',
    author: 'CareerPilot AI',
  },
  {
    id: 'web-4',
    category: 'Web Development',
    categoryLabel: '💻 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Always lazy-load below-the-fold media assets and specify explicit width/height to prevent layout shifts.',
    author: 'CareerPilot AI',
  },
  {
    id: 'web-5',
    category: 'Web Development',
    categoryLabel: '💻 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Use modern CSS Grid and Flexbox for rock-solid layouts without fragile absolute positioning hacks.',
    author: 'CareerPilot AI',
  },
  {
    id: 'web-6',
    category: 'Web Development',
    categoryLabel: '💻 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Optimize critical rendering paths by deferring non-essential scripts and inlining critical CSS above the fold.',
    author: 'CareerPilot AI',
  },
  {
    id: 'web-7',
    category: 'Web Development',
    categoryLabel: '💻 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Ensure high contrast ratios (WCAG AA minimum 4.5:1 for body text) so all users can easily read your content.',
    author: 'CareerPilot AI',
  },
  {
    id: 'web-8',
    category: 'Web Development',
    categoryLabel: '💻 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Leverage browser caching headers (ETags, Cache-Control: immutable) for static hashed assets to speed repeat visits.',
    author: 'CareerPilot AI',
  },
  {
    id: 'web-9',
    category: 'Web Development',
    categoryLabel: '💻 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Implement touch target dimensions of at least 44x44px for reliable mobile usability.',
    author: 'CareerPilot AI',
  },
  {
    id: 'web-10',
    category: 'Web Development',
    categoryLabel: '💻 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Embrace progressive enhancement: ensure critical content remains functional even if client scripts fail to load.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 2. React (6 tips)
  // =========================================================================
  {
    id: 'rea-1',
    category: 'React',
    categoryLabel: '⚛️ REACT TIP',
    iconType: 'react',
    quote: 'Keep state local to where it is needed. Only lift state when two or more components genuinely share it.',
    author: 'CareerPilot AI',
  },
  {
    id: 'rea-2',
    category: 'React',
    categoryLabel: '⚛️ REACT TIP',
    iconType: 'react',
    quote: 'Derive values during render instead of duplicating them in useEffect or extra useState variables.',
    author: 'CareerPilot AI',
  },
  {
    id: 'rea-3',
    category: 'React',
    categoryLabel: '⚛️ REACT TIP',
    iconType: 'react',
    quote: 'Always clean up subscriptions, intervals, and event listeners in the cleanup callback of useEffect.',
    author: 'CareerPilot AI',
  },
  {
    id: 'rea-4',
    category: 'React',
    categoryLabel: '⚛️ REACT TIP',
    iconType: 'react',
    quote: 'Use stable primitive values in hook dependency arrays rather than dynamic inline objects or arrays.',
    author: 'CareerPilot AI',
  },
  {
    id: 'rea-5',
    category: 'React',
    categoryLabel: '⚛️ REACT TIP',
    iconType: 'react',
    quote: 'Split bulky monolithic components into composable, single-responsibility sub-components for better maintainability.',
    author: 'CareerPilot AI',
  },
  {
    id: 'rea-6',
    category: 'React',
    categoryLabel: '⚛️ REACT TIP',
    iconType: 'react',
    quote: 'Use custom hooks to isolate business logic, side effects, and stateful calculations cleanly away from UI rendering.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 3. TypeScript (6 tips)
  // =========================================================================
  {
    id: 'ts-1',
    category: 'TypeScript',
    categoryLabel: '🔷 TYPESCRIPT TIP',
    iconType: 'typescript',
    quote: 'Avoid using "any". Model domain state with discriminated unions and strict interfaces to eliminate runtime errors.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ts-2',
    category: 'TypeScript',
    categoryLabel: '🔷 TYPESCRIPT TIP',
    iconType: 'typescript',
    quote: 'Use "unknown" instead of "any" when dealing with dynamic external API responses, then narrow with type guards.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ts-3',
    category: 'TypeScript',
    categoryLabel: '🔷 TYPESCRIPT TIP',
    iconType: 'typescript',
    quote: 'Enable strict null checks in tsconfig.json to prevent unintended undefined or null pointer bugs.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ts-4',
    category: 'TypeScript',
    categoryLabel: '🔷 TYPESCRIPT TIP',
    iconType: 'typescript',
    quote: 'Leverage utility types like Pick, Omit, Partial, and Record to avoid redundant interface declarations.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ts-5',
    category: 'TypeScript',
    categoryLabel: '🔷 TYPESCRIPT TIP',
    iconType: 'typescript',
    quote: 'Let TypeScript infer types wherever obvious, and explicitly type public function signatures and module boundaries.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ts-6',
    category: 'TypeScript',
    categoryLabel: '🔷 TYPESCRIPT TIP',
    iconType: 'typescript',
    quote: 'Use "as const" assertions on literal configuration objects to lock down exact types and prevent accidental mutations.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 4. JavaScript (6 tips)
  // =========================================================================
  {
    id: 'js-1',
    category: 'JavaScript',
    categoryLabel: '🌐 JAVASCRIPT TIP',
    iconType: 'javascript',
    quote: 'Understand the event loop, microtasks (Promises), and macrotasks (setTimeout) to write predictable async code.',
    author: 'CareerPilot AI',
  },
  {
    id: 'js-2',
    category: 'JavaScript',
    categoryLabel: '🌐 JAVASCRIPT TIP',
    iconType: 'javascript',
    quote: 'Use structuredClone() for deep object copying rather than fragile JSON.parse(JSON.stringify()) tricks.',
    author: 'CareerPilot AI',
  },
  {
    id: 'js-3',
    category: 'JavaScript',
    categoryLabel: '🌐 JAVASCRIPT TIP',
    iconType: 'javascript',
    quote: 'Prefer immutability: use map, filter, reduce, and spread operators instead of in-place array mutation.',
    author: 'CareerPilot AI',
  },
  {
    id: 'js-4',
    category: 'JavaScript',
    categoryLabel: '🌐 JAVASCRIPT TIP',
    iconType: 'javascript',
    quote: 'Use optional chaining (?.) and nullish coalescing (??) to write safe and concise property access checks.',
    author: 'CareerPilot AI',
  },
  {
    id: 'js-5',
    category: 'JavaScript',
    categoryLabel: '🌐 JAVASCRIPT TIP',
    iconType: 'javascript',
    quote: 'Use Promise.allSettled() when running concurrent tasks where individual failures should not cancel remaining promises.',
    author: 'CareerPilot AI',
  },
  {
    id: 'js-6',
    category: 'JavaScript',
    categoryLabel: '🌐 JAVASCRIPT TIP',
    iconType: 'javascript',
    quote: 'Master closures and lexical scoping—they power modern state machines, encapsulation, and functional composition.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 5. Full Stack Development (6 tips)
  // =========================================================================
  {
    id: 'fs-1',
    category: 'Full Stack Development',
    categoryLabel: '🛠️ FULL STACK TIP',
    iconType: 'fullstack',
    quote: 'Never trust client-side validation alone. Always re-validate input parameters securely on the server.',
    author: 'CareerPilot AI',
  },
  {
    id: 'fs-2',
    category: 'Full Stack Development',
    categoryLabel: '🛠️ FULL STACK TIP',
    iconType: 'fullstack',
    quote: 'Design idempotent API endpoints so network retries do not create duplicate records or charges.',
    author: 'CareerPilot AI',
  },
  {
    id: 'fs-3',
    category: 'Full Stack Development',
    categoryLabel: '🛠️ FULL STACK TIP',
    iconType: 'fullstack',
    quote: 'Use database indexing on frequently queried filter and foreign-key columns to prevent full table scans.',
    author: 'CareerPilot AI',
  },
  {
    id: 'fs-4',
    category: 'Full Stack Development',
    categoryLabel: '🛠️ FULL STACK TIP',
    iconType: 'fullstack',
    quote: 'Protect sensitive API credentials by keeping them strictly server-side behind proxy routes.',
    author: 'CareerPilot AI',
  },
  {
    id: 'fs-5',
    category: 'Full Stack Development',
    categoryLabel: '🛠️ FULL STACK TIP',
    iconType: 'fullstack',
    quote: 'Implement structured JSON logging with request IDs to trace errors across client and server boundaries.',
    author: 'CareerPilot AI',
  },
  {
    id: 'fs-6',
    category: 'Full Stack Development',
    categoryLabel: '🛠️ FULL STACK TIP',
    iconType: 'fullstack',
    quote: 'Design database schemas with clear foreign keys and strict Row Level Security (RLS) policies.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 6. Coding / DSA (10 tips)
  // =========================================================================
  {
    id: 'dsa-1',
    category: 'Coding / DSA',
    categoryLabel: '🧠 CODING TIP',
    iconType: 'coding',
    quote: 'Clarify constraints and edge cases (empty inputs, single elements, negative numbers, duplicates) before writing code.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dsa-2',
    category: 'Coding / DSA',
    categoryLabel: '🧠 CODING TIP',
    iconType: 'coding',
    quote: 'When searching sorted arrays or monotonic search spaces, binary search cuts O(N) linear scans down to O(log N).',
    author: 'CareerPilot AI',
  },
  {
    id: 'dsa-3',
    category: 'Coding / DSA',
    categoryLabel: '🧠 CODING TIP',
    iconType: 'coding',
    quote: 'Use Hash Maps to trade O(N) auxiliary space for O(1) average-time lookups on frequency and pair-sum problems.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dsa-4',
    category: 'Coding / DSA',
    categoryLabel: '🧠 CODING TIP',
    iconType: 'coding',
    quote: 'Two-pointer techniques (opposite ends or fast/slow pointers) are ideal for palindromes, sorted pairs, and cycle detection.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dsa-5',
    category: 'Coding / DSA',
    categoryLabel: '🧠 CODING TIP',
    iconType: 'coding',
    quote: 'Use sliding window patterns to optimize contiguous subarray or substring problems from O(N²) to O(N).',
    author: 'CareerPilot AI',
  },
  {
    id: 'dsa-6',
    category: 'Coding / DSA',
    categoryLabel: '🧠 CODING TIP',
    iconType: 'coding',
    quote: 'Break overlapping subproblems into Dynamic Programming states with clear base cases and transition equations.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dsa-7',
    category: 'Coding / DSA',
    categoryLabel: '🧠 CODING TIP',
    iconType: 'coding',
    quote: 'Use BFS (Queue) for shortest path in unweighted graphs and DFS (Stack/Recursion) for exhaustive tree traversals.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dsa-8',
    category: 'Coding / DSA',
    categoryLabel: '🧠 CODING TIP',
    iconType: 'coding',
    quote: 'Monotonic stacks efficiently solve "next greater element" and "histogram rectangle" problems in linear O(N) time.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dsa-9',
    category: 'Coding / DSA',
    categoryLabel: '🧠 CODING TIP',
    iconType: 'coding',
    quote: 'Always dry-run your solution on a small manual test case before running the full test suite.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dsa-10',
    category: 'Coding / DSA',
    categoryLabel: '🧠 CODING TIP',
    iconType: 'coding',
    quote: 'State the precise Big-O Time and Space complexities aloud; interviewers look for intentional algorithmic trade-offs.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 7. Debugging (10 tips)
  // =========================================================================
  {
    id: 'dbg-1',
    category: 'Debugging',
    categoryLabel: '🐛 DEBUGGING TIP',
    iconType: 'debugging',
    quote: 'Read the entire stack trace from top to bottom. The root error line is often right near the first internal frame.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dbg-2',
    category: 'Debugging',
    categoryLabel: '🐛 DEBUGGING TIP',
    iconType: 'debugging',
    quote: 'Reproduce the bug reliably with a minimal reproducible example before attempting any code fix.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dbg-3',
    category: 'Debugging',
    categoryLabel: '🐛 DEBUGGING TIP',
    iconType: 'debugging',
    quote: 'Use binary search debugging: isolate half the system or use git bisect to find the exact commit that introduced the regression.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dbg-4',
    category: 'Debugging',
    categoryLabel: '🐛 DEBUGGING TIP',
    iconType: 'debugging',
    quote: 'Check your assumptions. Verify actual runtime variable values rather than what you think they should be.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dbg-5',
    category: 'Debugging',
    categoryLabel: '🐛 DEBUGGING TIP',
    iconType: 'debugging',
    quote: 'When debugging async issues, look out for race conditions, unhandled Promise rejections, and stale state closures.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dbg-6',
    category: 'Debugging',
    categoryLabel: '🐛 DEBUGGING TIP',
    iconType: 'debugging',
    quote: 'Rubber duck debugging works: explaining the logic line-by-line out loud often reveals the faulty logic immediately.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dbg-7',
    category: 'Debugging',
    categoryLabel: '🐛 DEBUGGING TIP',
    iconType: 'debugging',
    quote: 'Use conditional breakpoints in browser DevTools to pause execution only when suspect conditions or IDs occur.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dbg-8',
    category: 'Debugging',
    categoryLabel: '🐛 DEBUGGING TIP',
    iconType: 'debugging',
    quote: 'Inspect Network tab payload headers and status codes before suspecting frontend application logic.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dbg-9',
    category: 'Debugging',
    categoryLabel: '🐛 DEBUGGING TIP',
    iconType: 'debugging',
    quote: 'Write a failing unit test that reproduces the bug first; verify that your fix turns the test green and prevents regressions.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dbg-10',
    category: 'Debugging',
    categoryLabel: '🐛 DEBUGGING TIP',
    iconType: 'debugging',
    quote: 'Beware off-by-one errors in loops, array bounds, slice ranges, and date boundary calculations.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 8. Software Engineering (10 tips)
  // =========================================================================
  {
    id: 'se-1',
    category: 'Software Engineering',
    categoryLabel: '🧑‍💻 SOFTWARE ENGINEERING TIP',
    iconType: 'engineering',
    quote: 'Write code for humans first, computers second. Clean, self-documenting code saves countless hours of future debugging.',
    author: 'CareerPilot AI',
  },
  {
    id: 'se-2',
    category: 'Software Engineering',
    categoryLabel: '🧑‍💻 SOFTWARE ENGINEERING TIP',
    iconType: 'engineering',
    quote: 'Follow the Single Responsibility Principle: each function, class, and module should do exactly one thing well.',
    author: 'CareerPilot AI',
  },
  {
    id: 'se-3',
    category: 'Software Engineering',
    categoryLabel: '🧑‍💻 SOFTWARE ENGINEERING TIP',
    iconType: 'engineering',
    quote: 'Prefer composition over inheritance. Flexible object composition leads to decoupled, testable architectures.',
    author: 'CareerPilot AI',
  },
  {
    id: 'se-4',
    category: 'Software Engineering',
    categoryLabel: '🧑‍💻 SOFTWARE ENGINEERING TIP',
    iconType: 'engineering',
    quote: 'Avoid premature optimization. Measure first with profilers, identify the real bottlenecks, then optimize intentionally.',
    author: 'CareerPilot AI',
  },
  {
    id: 'se-5',
    category: 'Software Engineering',
    categoryLabel: '🧑‍💻 SOFTWARE ENGINEERING TIP',
    iconType: 'engineering',
    quote: 'Embrace DRY (Don’t Repeat Yourself), but remember that wrong abstraction is far more expensive than a little duplication.',
    author: 'CareerPilot AI',
  },
  {
    id: 'se-6',
    category: 'Software Engineering',
    categoryLabel: '🧑‍💻 SOFTWARE ENGINEERING TIP',
    iconType: 'engineering',
    quote: 'Design systems with graceful degradation: if an auxiliary service fails, core functionality should still work seamlessly.',
    author: 'CareerPilot AI',
  },
  {
    id: 'se-7',
    category: 'Software Engineering',
    categoryLabel: '🧑‍💻 SOFTWARE ENGINEERING TIP',
    iconType: 'engineering',
    quote: 'Write meaningful automated tests that test behavior, contracts, and outcomes rather than internal implementation details.',
    author: 'CareerPilot AI',
  },
  {
    id: 'se-8',
    category: 'Software Engineering',
    categoryLabel: '🧑‍💻 SOFTWARE ENGINEERING TIP',
    iconType: 'engineering',
    quote: 'Use descriptive variable and function names. A clear name eliminates the need for redundant explanatory comments.',
    author: 'CareerPilot AI',
  },
  {
    id: 'se-9',
    category: 'Software Engineering',
    categoryLabel: '🧑‍💻 SOFTWARE ENGINEERING TIP',
    iconType: 'engineering',
    quote: 'Practice continuous integration: merge small, well-tested commits frequently to avoid merge hell and integration drift.',
    author: 'CareerPilot AI',
  },
  {
    id: 'se-10',
    category: 'Software Engineering',
    categoryLabel: '🧑‍💻 SOFTWARE ENGINEERING TIP',
    iconType: 'engineering',
    quote: 'Document the "why" behind non-obvious architecture decisions, architectural trade-offs, and design constraints.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 9. Git (6 tips)
  // =========================================================================
  {
    id: 'git-1',
    category: 'Git',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'git',
    quote: 'Write atomic commits with imperative messages (e.g. "feat: add user session timeout") to keep git history clean.',
    author: 'CareerPilot AI',
  },
  {
    id: 'git-2',
    category: 'Git',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'git',
    quote: 'Use git stash with a message (git stash push -m "work in progress") to cleanly pause and switch contexts.',
    author: 'CareerPilot AI',
  },
  {
    id: 'git-3',
    category: 'Git',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'git',
    quote: 'Never commit secrets, tokens, or .env files. Always configure .gitignore before your first commit.',
    author: 'CareerPilot AI',
  },
  {
    id: 'git-4',
    category: 'Git',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'git',
    quote: 'Use git status and git diff --staged before every commit to review exactly what changes are staged.',
    author: 'CareerPilot AI',
  },
  {
    id: 'git-5',
    category: 'Git',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'git',
    quote: 'Use interactive rebase (git rebase -i) to squash messy work-in-progress commits before opening pull requests.',
    author: 'CareerPilot AI',
  },
  {
    id: 'git-6',
    category: 'Git',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'git',
    quote: 'Use git log --oneline --graph to quickly visualize branch divergence, merges, and recent commits.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 10. GitHub (6 tips)
  // =========================================================================
  {
    id: 'gh-1',
    category: 'GitHub',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'github',
    quote: 'Write thorough Pull Request descriptions explaining the context, screenshots of UI changes, and how to test.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gh-2',
    category: 'GitHub',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'github',
    quote: 'Pin your 4-6 most impressive, fully working repositories with live demo links and clean READMEs on your profile.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gh-3',
    category: 'GitHub',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'github',
    quote: 'Use GitHub Actions to automate linting, type-checking, and unit test suites on every pull request.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gh-4',
    category: 'GitHub',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'github',
    quote: 'Include an architecture diagram and setup instructions in your project README so anyone can run it in 5 minutes.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gh-5',
    category: 'GitHub',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'github',
    quote: 'Keep Pull Requests small (under 400 lines) so team members can review thoroughly without fatigue.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gh-6',
    category: 'GitHub',
    categoryLabel: '🔀 GIT & GITHUB TIP',
    iconType: 'github',
    quote: 'Use branch protection rules on main to require passing CI checks and approvals before merging.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 11. Open Source (5 tips)
  // =========================================================================
  {
    id: 'os-1',
    category: 'Open Source',
    categoryLabel: '🌐 OPEN SOURCE TIP',
    iconType: 'opensource',
    quote: 'Start contributing to open source by fixing documentation typos, improving test coverage, or tackling "good first issue" tags.',
    author: 'CareerPilot AI',
  },
  {
    id: 'os-2',
    category: 'Open Source',
    categoryLabel: '🌐 OPEN SOURCE TIP',
    iconType: 'opensource',
    quote: 'Read the project’s CONTRIBUTING.md and Code of Conduct thoroughly before submitting an issue or pull request.',
    author: 'CareerPilot AI',
  },
  {
    id: 'os-3',
    category: 'Open Source',
    categoryLabel: '🌐 OPEN SOURCE TIP',
    iconType: 'opensource',
    quote: 'Be respectful and constructive in issue discussions; maintainers are volunteers dedicating their personal time.',
    author: 'CareerPilot AI',
  },
  {
    id: 'os-4',
    category: 'Open Source',
    categoryLabel: '🌐 OPEN SOURCE TIP',
    iconType: 'opensource',
    quote: 'Open an issue to discuss proposed feature changes with maintainers before spending days coding a massive PR.',
    author: 'CareerPilot AI',
  },
  {
    id: 'os-5',
    category: 'Open Source',
    categoryLabel: '🌐 OPEN SOURCE TIP',
    iconType: 'opensource',
    quote: 'Reviewing other contributors’ pull requests is a fast way to learn codebases and build open-source credibility.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 12. Resume (6 tips)
  // =========================================================================
  {
    id: 'res-1',
    category: 'Resume',
    categoryLabel: '📄 RESUME TIP',
    iconType: 'resume',
    quote: 'Keep your resume strictly to 1 page if you have less than 5 years of experience. Recruiters scan resumes in 6-10 seconds.',
    author: 'CareerPilot AI',
  },
  {
    id: 'res-2',
    category: 'Resume',
    categoryLabel: '📄 RESUME TIP',
    iconType: 'resume',
    quote: 'Use clean standard section headers (Experience, Projects, Education, Technical Skills) for zero parsing ambiguity.',
    author: 'CareerPilot AI',
  },
  {
    id: 'res-3',
    category: 'Resume',
    categoryLabel: '📄 RESUME TIP',
    iconType: 'resume',
    quote: 'Lead every bullet point with a powerful action verb (Architected, Engineered, Optimized, Deployed, Streamlined).',
    author: 'CareerPilot AI',
  },
  {
    id: 'res-4',
    category: 'Resume',
    categoryLabel: '📄 RESUME TIP',
    iconType: 'resume',
    quote: 'Include working live demo links and GitHub links for all top featured projects in your resume.',
    author: 'CareerPilot AI',
  },
  {
    id: 'res-5',
    category: 'Resume',
    categoryLabel: '📄 RESUME TIP',
    iconType: 'resume',
    quote: 'Place technical skills into categorized groups (Languages, Frameworks, Databases, Tools) for effortless scannability.',
    author: 'CareerPilot AI',
  },
  {
    id: 'res-6',
    category: 'Resume',
    categoryLabel: '📄 RESUME TIP',
    iconType: 'resume',
    quote: 'Proofread relentlessly. A single typo in your email or portfolio URL can cost you an interview invitation.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 13. Resume Analysis (6 tips)
  // =========================================================================
  {
    id: 'ra-1',
    category: 'Resume Analysis',
    categoryLabel: '📊 ATS & RESUME TIP',
    iconType: 'resumeanalysis',
    quote: 'Format accomplishments using the Google X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]".',
    author: 'CareerPilot AI',
  },
  {
    id: 'ra-2',
    category: 'Resume Analysis',
    categoryLabel: '📊 ATS & RESUME TIP',
    iconType: 'resumeanalysis',
    quote: 'Quantify your impact: include metrics like percentage speedups, latency reduction, user counts, or test coverage.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ra-3',
    category: 'Resume Analysis',
    categoryLabel: '📊 ATS & RESUME TIP',
    iconType: 'resumeanalysis',
    quote: 'Tailor resume keywords directly to match the requirements listed in the target job description.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ra-4',
    category: 'Resume Analysis',
    categoryLabel: '📊 ATS & RESUME TIP',
    iconType: 'resumeanalysis',
    quote: 'Avoid generic claims like "good team player"; prove it through collaborative project outcomes and leadership roles.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ra-5',
    category: 'Resume Analysis',
    categoryLabel: '📊 ATS & RESUME TIP',
    iconType: 'resumeanalysis',
    quote: 'Ensure dates and company/institution names follow consistent chronological formatting throughout.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ra-6',
    category: 'Resume Analysis',
    categoryLabel: '📊 ATS & RESUME TIP',
    iconType: 'resumeanalysis',
    quote: 'Run your resume through AI ATS analyzers to catch missing keywords and formatting flaws before applying.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 14. ATS (Applicant Tracking Systems) (6 tips)
  // =========================================================================
  {
    id: 'ats-1',
    category: 'ATS',
    categoryLabel: '📊 ATS TIP',
    iconType: 'ats',
    quote: 'Avoid multi-column tables, graphics, text boxes, and icons that confuse automated ATS parsers.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ats-2',
    category: 'ATS',
    categoryLabel: '📊 ATS TIP',
    iconType: 'ats',
    quote: 'Submit your resume as a clean PDF generated from text, ensuring all text can be selected and copied.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ats-3',
    category: 'ATS',
    categoryLabel: '📊 ATS TIP',
    iconType: 'ats',
    quote: 'Use standard system fonts (Arial, Calibri, Helvetica, Georgia) to ensure universal rendering on ATS systems.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ats-4',
    category: 'ATS',
    categoryLabel: '📊 ATS TIP',
    iconType: 'ats',
    quote: 'Spell out both acronyms and full names (e.g. "Natural Language Processing (NLP)") for maximum ATS keyword hits.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ats-5',
    category: 'ATS',
    categoryLabel: '📊 ATS TIP',
    iconType: 'ats',
    quote: 'Keep your contact info in the main body text rather than in document headers or footers which ATS often skips.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ats-6',
    category: 'ATS',
    categoryLabel: '📊 ATS TIP',
    iconType: 'ats',
    quote: 'Name your file professionally: Firstname_Lastname_Resume.pdf so recruiters can identify your file immediately.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 15. Technical Interviews (6 tips)
  // =========================================================================
  {
    id: 'ti-1',
    category: 'Technical Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'techinterview',
    quote: 'Always communicate your thought process out loud before writing code. Interviewers want to understand how you think.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ti-2',
    category: 'Technical Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'techinterview',
    quote: 'Start with a brute-force solution to guarantee baseline correctness, then systematically optimize time and space.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ti-3',
    category: 'Technical Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'techinterview',
    quote: 'Ask clarifying questions on input bounds, memory limits, and expected behavior on null or invalid inputs.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ti-4',
    category: 'Technical Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'techinterview',
    quote: 'If you get stuck, explain your bottleneck clearly; interviewers often give hints to see how well you adapt and collaborate.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ti-5',
    category: 'Technical Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'techinterview',
    quote: 'Walk through your completed code with a test case manually before declaring that you are finished.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ti-6',
    category: 'Technical Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'techinterview',
    quote: 'Write modular helper functions for complex sub-logic; it makes your code cleaner and easier to reason about under pressure.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 16. HR & Behavioral Interviews (6 tips)
  // =========================================================================
  {
    id: 'hr-1',
    category: 'HR Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'hrinterview',
    quote: 'Structure behavioral answers using the STAR method: Situation, Task, Action, and Result.',
    author: 'CareerPilot AI',
  },
  {
    id: 'hr-2',
    category: 'HR Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'hrinterview',
    quote: 'Prepare 4-5 versatile project stories covering conflict resolution, technical hurdles, leadership, and tight deadlines.',
    author: 'CareerPilot AI',
  },
  {
    id: 'hr-3',
    category: 'HR Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'hrinterview',
    quote: 'When discussing weaknesses, share a genuine area of past growth and the concrete steps you took to improve.',
    author: 'CareerPilot AI',
  },
  {
    id: 'hr-4',
    category: 'HR Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'hrinterview',
    quote: 'Research the company’s mission, engineering blog, and core values so you can articulate why you want to work there.',
    author: 'CareerPilot AI',
  },
  {
    id: 'hr-5',
    category: 'HR Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'hrinterview',
    quote: 'Prepare thoughtful questions for the interviewer about engineering culture, team priorities, and growth opportunities.',
    author: 'CareerPilot AI',
  },
  {
    id: 'hr-6',
    category: 'HR Interviews',
    categoryLabel: '🎤 INTERVIEW TIP',
    iconType: 'hrinterview',
    quote: 'Focus on "I" actions within "We" team contexts to clearly showcase your individual contributions.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 17. Placement Preparation (10 tips)
  // =========================================================================
  {
    id: 'plc-1',
    category: 'Placement Preparation',
    categoryLabel: '💼 PLACEMENT TIP',
    iconType: 'placement',
    quote: 'Build consistent aptitude speed: practice quantitative shortcuts and logical reasoning for 20 minutes daily.',
    author: 'CareerPilot AI',
  },
  {
    id: 'plc-2',
    category: 'Placement Preparation',
    categoryLabel: '💼 PLACEMENT TIP',
    iconType: 'placement',
    quote: 'Master core CS fundamentals: Operating Systems, Computer Networks, DBMS, and Object-Oriented Programming.',
    author: 'CareerPilot AI',
  },
  {
    id: 'plc-3',
    category: 'Placement Preparation',
    categoryLabel: '💼 PLACEMENT TIP',
    iconType: 'placement',
    quote: 'Review SQL queries (JOINs, GROUP BY, HAVING, Subqueries, Window functions) as they are universally tested in placement drives.',
    author: 'CareerPilot AI',
  },
  {
    id: 'plc-4',
    category: 'Placement Preparation',
    categoryLabel: '💼 PLACEMENT TIP',
    iconType: 'placement',
    quote: 'Take full-length timed mock assessments weekly to build stamina for 2-hour online placement tests.',
    author: 'CareerPilot AI',
  },
  {
    id: 'plc-5',
    category: 'Placement Preparation',
    categoryLabel: '💼 PLACEMENT TIP',
    iconType: 'placement',
    quote: 'Maintain an error log of questions you missed during practice and review them every weekend.',
    author: 'CareerPilot AI',
  },
  {
    id: 'plc-6',
    category: 'Placement Preparation',
    categoryLabel: '💼 PLACEMENT TIP',
    iconType: 'placement',
    quote: 'Be ready to explain every single technology, library, and line of code mentioned on your resume.',
    author: 'CareerPilot AI',
  },
  {
    id: 'plc-7',
    category: 'Placement Preparation',
    categoryLabel: '💼 PLACEMENT TIP',
    iconType: 'placement',
    quote: 'Practice on physical paper or whiteboards to gain confidence coding without IDE autocompletion or linters.',
    author: 'CareerPilot AI',
  },
  {
    id: 'plc-8',
    category: 'Placement Preparation',
    categoryLabel: '💼 PLACEMENT TIP',
    iconType: 'placement',
    quote: 'Understand OOP pillars (Encapsulation, Abstraction, Inheritance, Polymorphism) with real-world software examples.',
    author: 'CareerPilot AI',
  },
  {
    id: 'plc-9',
    category: 'Placement Preparation',
    categoryLabel: '💼 PLACEMENT TIP',
    iconType: 'placement',
    quote: 'Study company-specific previous placement patterns to prioritize topics favored by your target recruiters.',
    author: 'CareerPilot AI',
  },
  {
    id: 'plc-10',
    category: 'Placement Preparation',
    categoryLabel: '💼 PLACEMENT TIP',
    iconType: 'placement',
    quote: 'Stay calm during technical rounds. Composure and structured problem-solving impress interviewers as much as raw speed.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 18. Career Growth (10 tips)
  // =========================================================================
  {
    id: 'cg-1',
    category: 'Career Growth',
    categoryLabel: '🎯 CAREER TIP',
    iconType: 'career',
    quote: 'Build in public: share your projects, learnings, and technical breakthroughs on LinkedIn and technical blogs.',
    author: 'CareerPilot AI',
  },
  {
    id: 'cg-2',
    category: 'Career Growth',
    categoryLabel: '🎯 CAREER TIP',
    iconType: 'career',
    quote: 'Develop T-shaped skills: deep specialized mastery in one stack, combined with broad knowledge across the engineering ecosystem.',
    author: 'CareerPilot AI',
  },
  {
    id: 'cg-3',
    category: 'Career Growth',
    categoryLabel: '🎯 CAREER TIP',
    iconType: 'career',
    quote: 'Seek feedback proactively from senior engineers and peers; constructive critique is the fastest accelerator of growth.',
    author: 'CareerPilot AI',
  },
  {
    id: 'cg-4',
    category: 'Career Growth',
    categoryLabel: '🎯 CAREER TIP',
    iconType: 'career',
    quote: 'Find mentors who are 2-3 years ahead of where you want to be and learn from their career trajectories.',
    author: 'CareerPilot AI',
  },
  {
    id: 'cg-5',
    category: 'Career Growth',
    categoryLabel: '🎯 CAREER TIP',
    iconType: 'career',
    quote: 'Understand the business value of your code. Engineers who connect technical solutions to user outcomes advance faster.',
    author: 'CareerPilot AI',
  },
  {
    id: 'cg-6',
    category: 'Career Growth',
    categoryLabel: '🎯 CAREER TIP',
    iconType: 'career',
    quote: 'Work on your written and verbal communication. Clarity of thought and speech multiplies your engineering impact.',
    author: 'CareerPilot AI',
  },
  {
    id: 'cg-7',
    category: 'Career Growth',
    categoryLabel: '🎯 CAREER TIP',
    iconType: 'career',
    quote: 'Stay curious about emerging technologies, but anchor your expertise in enduring core computer science principles.',
    author: 'CareerPilot AI',
  },
  {
    id: 'cg-8',
    category: 'Career Growth',
    categoryLabel: '🎯 CAREER TIP',
    iconType: 'career',
    quote: 'Network genuinely by helping others, participating in hackathons, and contributing to developer communities.',
    author: 'CareerPilot AI',
  },
  {
    id: 'cg-9',
    category: 'Career Growth',
    categoryLabel: '🎯 CAREER TIP',
    iconType: 'career',
    quote: 'Track your weekly accomplishments, projects, and positive feedback in a personal career brag document.',
    author: 'CareerPilot AI',
  },
  {
    id: 'cg-10',
    category: 'Career Growth',
    categoryLabel: '🎯 CAREER TIP',
    iconType: 'career',
    quote: 'Consistency always beats sporadic intensity. Small daily progress compounds into massive career breakthroughs.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 19. Learning (10 tips)
  // =========================================================================
  {
    id: 'lrn-1',
    category: 'Learning',
    categoryLabel: '📚 LEARNING TIP',
    iconType: 'learning',
    quote: 'The best way to learn a technology is to build a real project with it. Escape tutorial purgatory by writing original code.',
    author: 'CareerPilot AI',
  },
  {
    id: 'lrn-2',
    category: 'Learning',
    categoryLabel: '📚 LEARNING TIP',
    iconType: 'learning',
    quote: 'Practice the Feynman Technique: explain complex concepts in plain language to someone with no programming background.',
    author: 'CareerPilot AI',
  },
  {
    id: 'lrn-3',
    category: 'Learning',
    categoryLabel: '📚 LEARNING TIP',
    iconType: 'learning',
    quote: 'Use spaced repetition to retain algorithms, data structures, syntax patterns, and command-line tools.',
    author: 'CareerPilot AI',
  },
  {
    id: 'lrn-4',
    category: 'Learning',
    categoryLabel: '📚 LEARNING TIP',
    iconType: 'learning',
    quote: 'Read official documentation and source code of popular open-source libraries to understand production design patterns.',
    author: 'CareerPilot AI',
  },
  {
    id: 'lrn-5',
    category: 'Learning',
    categoryLabel: '📚 LEARNING TIP',
    iconType: 'learning',
    quote: 'Embrace struggle: cognitive friction during problem-solving is the exact moment deep learning and retention occur.',
    author: 'CareerPilot AI',
  },
  {
    id: 'lrn-6',
    category: 'Learning',
    categoryLabel: '📚 LEARNING TIP',
    iconType: 'learning',
    quote: 'Focus on mastering one programming language deeply before jumping across multiple languages simultaneously.',
    author: 'CareerPilot AI',
  },
  {
    id: 'lrn-7',
    category: 'Learning',
    categoryLabel: '📚 LEARNING TIP',
    iconType: 'learning',
    quote: 'Take notes in your own words while learning new concepts; summarizing forces mental synthesis.',
    author: 'CareerPilot AI',
  },
  {
    id: 'lrn-8',
    category: 'Learning',
    categoryLabel: '📚 LEARNING TIP',
    iconType: 'learning',
    quote: 'Re-implement basic data structures (Linked Lists, Trees, Stacks, Queues, Hash Maps) from scratch once.',
    author: 'CareerPilot AI',
  },
  {
    id: 'lrn-9',
    category: 'Learning',
    categoryLabel: '📚 LEARNING TIP',
    iconType: 'learning',
    quote: 'Learn to use the command line effectively. Terminal proficiency speeds up development workflows significantly.',
    author: 'CareerPilot AI',
  },
  {
    id: 'lrn-10',
    category: 'Learning',
    categoryLabel: '📚 LEARNING TIP',
    iconType: 'learning',
    quote: 'Set clear weekly micro-goals rather than vague long-term goals to maintain consistent learning momentum.',
    author: 'CareerPilot AI',
  },

  // =========================================================================
  // 20. General Professional Knowledge (10 tips)
  // =========================================================================
  {
    id: 'gen-1',
    category: 'General Professional Knowledge',
    categoryLabel: '🚀 DEVELOPMENT TIP',
    iconType: 'general',
    quote: 'Prioritize security from the start: sanitize inputs, prevent SQL injections, and sanitize user-generated HTML against XSS.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gen-2',
    category: 'General Professional Knowledge',
    categoryLabel: '🚀 DEVELOPMENT TIP',
    iconType: 'general',
    quote: 'Understand CORS (Cross-Origin Resource Sharing) and preflight OPTIONS requests to debug API communication smoothly.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gen-3',
    category: 'General Professional Knowledge',
    categoryLabel: '🚀 DEVELOPMENT TIP',
    iconType: 'general',
    quote: 'Understand HTTP status codes: 2xx for success, 3xx for redirects, 4xx for client errors, and 5xx for server failures.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gen-4',
    category: 'General Professional Knowledge',
    categoryLabel: '🚀 DEVELOPMENT TIP',
    iconType: 'general',
    quote: 'Use environment variables for all configuration values that differ between development, staging, and production.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gen-5',
    category: 'General Professional Knowledge',
    categoryLabel: '🚀 DEVELOPMENT TIP',
    iconType: 'general',
    quote: 'Design database transactions with ACID properties (Atomicity, Consistency, Isolation, Durability) for financial or critical data.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gen-6',
    category: 'General Professional Knowledge',
    categoryLabel: '🚀 DEVELOPMENT TIP',
    iconType: 'general',
    quote: 'Automate repetitive tasks with scripts. If you perform a multi-step task more than three times, script it.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gen-7',
    category: 'General Professional Knowledge',
    categoryLabel: '🚀 DEVELOPMENT TIP',
    iconType: 'general',
    quote: 'Protect user privacy by adhering to data protection principles: store only the data you genuinely need.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gen-8',
    category: 'General Professional Knowledge',
    categoryLabel: '🚀 DEVELOPMENT TIP',
    iconType: 'general',
    quote: 'Keep your local development environment clean by using containerized setups or standard version managers like nvm.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gen-9',
    category: 'General Professional Knowledge',
    categoryLabel: '🚀 DEVELOPMENT TIP',
    iconType: 'general',
    quote: 'Never push unverified code to production on a Friday afternoon without automated rollback safeguards.',
    author: 'CareerPilot AI',
  },
  {
    id: 'gen-10',
    category: 'General Professional Knowledge',
    categoryLabel: '🚀 DEVELOPMENT TIP',
    iconType: 'general',
    quote: 'Celebrate your engineering milestones and problem-solving wins; recognizing progress keeps enthusiasm high.',
    author: 'CareerPilot AI',
  },
];

/**
 * Get a random offline quote from the library, optionally excluding a previous id
 * and optionally filtered by context hint (e.g. 'coding', 'resume', 'interview', 'placement', 'web')
 */
export function getRandomOfflineQuote(excludeId?: string, contextHint?: string): OfflineQuote {
  let pool = OFFLINE_QUOTES;

  if (contextHint) {
    const hint = contextHint.toLowerCase();
    let filtered: OfflineQuote[] = [];

    if (hint.includes('coding') || hint.includes('dsa') || hint.includes('arena') || hint.includes('problem')) {
      filtered = OFFLINE_QUOTES.filter((q) =>
        ['Coding / DSA', 'Debugging', 'TypeScript', 'JavaScript', 'Software Engineering'].includes(q.category)
      );
    } else if (hint.includes('resume') || hint.includes('ats')) {
      filtered = OFFLINE_QUOTES.filter((q) =>
        ['Resume', 'Resume Analysis', 'ATS', 'Career Growth'].includes(q.category)
      );
    } else if (hint.includes('interview')) {
      filtered = OFFLINE_QUOTES.filter((q) =>
        ['Technical Interviews', 'HR Interviews', 'Coding / DSA', 'Software Engineering'].includes(q.category)
      );
    } else if (hint.includes('placement') || hint.includes('aptitude') || hint.includes('company')) {
      filtered = OFFLINE_QUOTES.filter((q) =>
        ['Placement Preparation', 'Career Growth', 'General Professional Knowledge'].includes(q.category)
      );
    } else if (hint.includes('web') || hint.includes('fullstack') || hint.includes('frontend')) {
      filtered = OFFLINE_QUOTES.filter((q) =>
        ['Web Development', 'React', 'TypeScript', 'Full Stack Development'].includes(q.category)
      );
    }

    if (filtered.length > 0) {
      pool = filtered;
    }
  }

  const withoutPrev = excludeId ? pool.filter((q) => q.id !== excludeId) : pool;
  const list = withoutPrev.length > 0 ? withoutPrev : (excludeId ? OFFLINE_QUOTES.filter((q) => q.id !== excludeId) : OFFLINE_QUOTES);
  const finalPool = list.length > 0 ? list : OFFLINE_QUOTES;
  const randomIndex = Math.floor(Math.random() * finalPool.length);
  return finalPool[randomIndex];
}

/**
 * Get all quotes belonging to a specific category
 */
export function getQuotesByCategory(category: string): OfflineQuote[] {
  return OFFLINE_QUOTES.filter((q) => q.category.toLowerCase() === category.toLowerCase());
}
