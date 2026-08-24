export type PlacementCategory = 'Aptitude' | 'Technical';

export type AptitudeSubject =
  | 'Quantitative Aptitude'
  | 'Logical Reasoning'
  | 'Verbal Ability'
  | 'Data Interpretation';

export type TechnicalSubject =
  | 'C'
  | 'C++'
  | 'Java'
  | 'Python'
  | 'DSA'
  | 'DBMS'
  | 'SQL'
  | 'Operating Systems'
  | 'Computer Networks'
  | 'OOP'
  | 'Software Engineering'
  | 'Custom';

export type PlacementDifficulty = 'Easy' | 'Medium' | 'Hard';

export type PlacementMode = 'practice' | 'timed';

export interface PlacementMCQ {
  id: string;
  questionNumber: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  category: PlacementCategory;
  subject: string;
  topic: string;
  difficulty: PlacementDifficulty;
  codeSnippet?: string;
}

export interface PlacementPracticeConfig {
  category: PlacementCategory;
  subject: string;
  isCustomSubject?: boolean;
  customSubjectText?: string;
  topic: string;
  isCustomTopic?: boolean;
  customTopicText?: string;
  difficulty: PlacementDifficulty;
  questionCount: number;
  isCustomQuestionCount?: boolean;
  customQuestionCountText?: string;
  mode: PlacementMode;
  timeLimitMinutes?: number;
  company?: string;
  role?: string;
  source?: string;
  roadmapItemId?: string;
  taskId?: string;
  topics?: string[];
}

export interface PlacementAnswerRecord {
  questionNumber: number;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isSkipped: boolean;
  isCorrect: boolean;
  timeSpentSeconds?: number;
}

export interface TopicPerformance {
  topic: string;
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  percentage: number;
}

export interface PlacementTestSession {
  id: string;
  studentId: string;
  studentEmail?: string;
  category: PlacementCategory;
  subject: string;
  topic: string;
  isCustomSubject?: boolean;
  isCustomTopic?: boolean;
  difficulty: PlacementDifficulty;
  mode: PlacementMode;
  questions: PlacementMCQ[];
  answers: Record<number, PlacementAnswerRecord>;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  score: number; // 0 - 100 percentage
  accuracy: number; // 0 - 100 percentage
  timeTakenSeconds: number;
  topicBreakdown: Record<string, TopicPerformance>;
  weakestTopic?: {
    topic: string;
    accuracy: number;
    total: number;
    incorrect: number;
  };
  createdAt: string;
  completedAt?: string;
  formattedDate?: string;
  company?: string;
  role?: string;
  source?: string;
  roadmapItemId?: string;
  taskId?: string;
  topics?: string[];
}

export interface PlacementStudentStats {
  totalTests: number;
  totalQuestionsSolved: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  overallAccuracy: number;
  aptitudeSolved: number;
  aptitudeAccuracy: number;
  technicalSolved: number;
  technicalAccuracy: number;
  perfectScoresCount: number;
  recentSessions: PlacementTestSession[];
}

export const APTITUDE_TOPIC_MAP: Record<AptitudeSubject, string[]> = {
  'Quantitative Aptitude': [
    'Percentages',
    'Profit & Loss',
    'Time & Work',
    'Time, Speed & Distance',
    'Simple & Compound Interest',
    'Ratio & Proportion',
    'Averages & Mixtures',
    'Permutations & Combinations',
    'Probability',
    'Number System & HCF/LCM',
    'Ages & Partnerships',
    'Pipes & Cisterns',
  ],
  'Logical Reasoning': [
    'Blood Relations',
    'Syllogisms',
    'Seating Arrangement (Linear & Circular)',
    'Coding & Decoding',
    'Direction Sense',
    'Series Completion (Number & Letter)',
    'Clocks & Calendars',
    'Statement & Assumptions',
    'Analogy & Classification',
    'Puzzles & Ordering',
  ],
  'Verbal Ability': [
    'Reading Comprehension',
    'Sentence Correction & Grammar',
    'Synonyms & Antonyms',
    'Para Jumbles & Ordering',
    'Fill in the Blanks',
    'Idioms & Phrases',
    'Error Spotting',
    'One Word Substitution',
    'Sentence Completion',
  ],
  'Data Interpretation': [
    'Bar Graphs',
    'Pie Charts',
    'Line Graphs',
    'Data Tables',
    'Caselets & Passages',
    'Mixed Data Charts',
    'Radar Charts & Comparison',
  ],
};

export const TECHNICAL_SUBJECTS: TechnicalSubject[] = [
  'C',
  'C++',
  'Java',
  'Python',
  'DSA',
  'DBMS',
  'SQL',
  'Operating Systems',
  'Computer Networks',
  'OOP',
  'Software Engineering',
];

export const TECHNICAL_TOPIC_MAP: Record<string, string[]> = {
  C: [
    'Pointers & Memory Addresses',
    'Dynamic Memory Allocation (malloc, free)',
    'Arrays & Strings',
    'Structures & Unions',
    'Functions & Recursion',
    'Bitwise Operators & Bit Manipulation',
    'Preprocessor Directives & Macros',
    'Storage Classes & Scope',
  ],
  'C++': [
    'STL Containers & Iterators (Vector, Map, Set)',
    'Classes, Objects & Constructors',
    'Virtual Functions & Runtime Polymorphism',
    'Templates & Generic Programming',
    'Smart Pointers & Memory Management',
    'Inheritance & Access Specifiers',
    'Operator Overloading',
    'Exception Handling',
  ],
  Java: [
    'Collections Framework (List, Set, Map)',
    'Multithreading & Concurrency (Thread, Runnable, Locks)',
    'JVM Architecture & Garbage Collection',
    'OOP Concepts in Java',
    'Exception Handling (Try-Catch-Finally)',
    'Generics & Type Safety',
    'Java 8 Streams & Lambda Expressions',
    'Strings, StringBuilder & Immutability',
  ],
  Python: [
    'Built-in Data Structures (Lists, Dicts, Sets, Tuples)',
    'Generators, Iterators & Yield',
    'Decorators & Higher-Order Functions',
    'OOP in Python (Dunder Methods, Inheritance)',
    'Memory Management & Garbage Collection',
    'List Comprehensions & Lambdas',
    'Exception Handling & Context Managers (with)',
    'Modules & Packaging',
  ],
  DSA: [
    'Arrays & Matrix Operations',
    'Linked Lists (Singly, Doubly, Circular)',
    'Stacks & Queues (Monotonic Stack, Deque)',
    'Trees & Binary Search Trees (BST)',
    'Graphs (BFS, DFS, Dijkstra, Topo Sort)',
    'Dynamic Programming & Memoization',
    'Greedy Algorithms',
    'Sorting & Searching (Binary Search, QuickSort)',
    'Hashing & Hash Tables',
    'Recursion & Backtracking',
  ],
  DBMS: [
    'Relational Algebra & Tuple Calculus',
    'Normalization (1NF, 2NF, 3NF, BCNF)',
    'Indexing, B-Trees & B+ Trees',
    'Transactions & ACID Properties',
    'Concurrency Control & Locking (2PL)',
    'Database Recovery Techniques',
    'ER Diagrams & Schema Design',
  ],
  SQL: [
    'Joins (Inner, Left, Right, Full Outer)',
    'Aggregate Functions & GROUP BY / HAVING',
    'Subqueries & Correlated Subqueries',
    'Common Table Expressions (CTEs)',
    'Window Functions (ROW_NUMBER, RANK, DENSE_RANK)',
    'Triggers, Stored Procedures & Views',
    'Index Optimization & Query Plans',
    'DDL, DML & DCL Commands',
  ],
  'Operating Systems': [
    'Process Management & State Transitions',
    'CPU Scheduling Algorithms (FCFS, SJF, RR, Priority)',
    'Threads & Multithreading',
    'Process Synchronization & Semaphores',
    'Deadlocks (Detection, Prevention, Banker\'s Algorithm)',
    'Memory Management & Paging',
    'Virtual Memory & Page Replacement (LRU, FIFO)',
    'File Systems & Disk Scheduling',
    'Linux System Calls & Shell Basics',
  ],
  'Computer Networks': [
    'OSI Model & TCP/IP Protocol Suite',
    'IP Addressing, Subnetting & CIDR',
    'Transport Layer (TCP 3-Way Handshake vs UDP)',
    'Flow Control & Congestion Control',
    'Routing Protocols (OSPF, BGP, RIP)',
    'Application Layer (HTTP, HTTPS, DNS, DHCP)',
    'Data Link Layer (CSMA/CD, MAC, Framing)',
    'Network Security, Firewalls & SSL/TLS',
  ],
  OOP: [
    'Encapsulation & Data Hiding',
    'Inheritance & Method Overriding',
    'Polymorphism (Compile-time vs Runtime)',
    'Abstraction & Interfaces',
    'Composition vs Inheritance',
    'SOLID Design Principles',
    'Common Design Patterns (Singleton, Factory, Observer)',
  ],
  'Software Engineering': [
    'SDLC Models (Agile, Scrum, Waterfall)',
    'Software Testing (Unit, Integration, Black/White Box)',
    'Design Patterns & Clean Code',
    'UML Diagrams (Class, Sequence, Use Case)',
    'Version Control & Git Workflows',
    'CI/CD & DevOps Fundamentals',
    'Software Maintenance & Refactoring',
  ],
};
