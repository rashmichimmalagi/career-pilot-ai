import { InterviewSubject, InterviewLanguage } from '../types/interview';

export interface LanguageOption {
  value: InterviewLanguage;
  label: string;
  badge: string;
  description: string;
}

export type SubjectLanguageRequirement = 'required' | 'optional' | 'not_applicable';

export const NON_LANGUAGE_SUBJECTS = [
  'DBMS',
  'SQL',
  'Operating Systems',
  'Computer Networks',
  'System Design',
  'Cloud Computing',
  'Cybersecurity',
  'Software Testing',
  'Computer Architecture',
  'DevOps',
  'Machine Learning',
  'Data Engineering',
];

export const PROGRAMMING_SUBJECTS = [
  'DSA',
  'OOP',
  'Java',
  'Python',
  'C/C++',
  'Web Development',
];

export const getSubjectLanguageRequirement = (subject: string): SubjectLanguageRequirement => {
  if (!subject) return 'not_applicable';
  const s = subject.trim();
  const lower = s.toLowerCase();

  if (PROGRAMMING_SUBJECTS.includes(s)) {
    return 'required';
  }

  if (NON_LANGUAGE_SUBJECTS.some((sub) => sub.toLowerCase() === lower)) {
    return 'not_applicable';
  }

  // Check if custom subject name explicitly indicates programming
  if (
    lower.includes('dsa') ||
    lower.includes('algorithm') ||
    lower.includes('object oriented') ||
    lower.includes('oop') ||
    lower.includes('java') ||
    lower.includes('python') ||
    lower.includes('c++') ||
    lower.includes('web dev') ||
    lower.includes('frontend')
  ) {
    return 'required';
  }

  if (
    lower.includes('os') ||
    lower.includes('operating system') ||
    lower.includes('linux') ||
    lower.includes('network') ||
    lower.includes('dbms') ||
    lower.includes('database') ||
    lower.includes('sql') ||
    lower.includes('system design') ||
    lower.includes('cloud') ||
    lower.includes('security') ||
    lower.includes('testing') ||
    lower.includes('architecture')
  ) {
    return 'not_applicable';
  }

  // Custom generic subjects can optionally select a stack
  return 'optional';
};

export const isProgrammingSubject = (subject: string): boolean => {
  return getSubjectLanguageRequirement(subject) === 'required';
};

export const getAvailableLanguagesForSubject = (subject: string): LanguageOption[] => {
  if (!subject) return INTERVIEW_LANGUAGES;
  const s = subject.trim();

  if (s === 'Java') {
    return INTERVIEW_LANGUAGES.filter((l) => l.value === 'Java');
  }
  if (s === 'Python') {
    return INTERVIEW_LANGUAGES.filter((l) => l.value === 'Python');
  }
  if (s === 'C/C++') {
    return INTERVIEW_LANGUAGES.filter((l) => l.value === 'C++' || l.value === 'C');
  }
  if (s === 'Web Development') {
    return INTERVIEW_LANGUAGES.filter((l) =>
      ['JavaScript', 'TypeScript', 'Python', 'Java'].includes(l.value)
    );
  }
  if (s === 'SQL') {
    return INTERVIEW_LANGUAGES.filter((l) => l.value === 'SQL');
  }
  if (s === 'OOP') {
    return INTERVIEW_LANGUAGES.filter((l) =>
      ['Java', 'C++', 'Python', 'TypeScript', 'C'].includes(l.value)
    );
  }

  // DSA and other subjects support all languages
  return INTERVIEW_LANGUAGES;
};

export const INTERVIEW_LANGUAGES: LanguageOption[] = [
  {
    value: 'C',
    label: 'C',
    badge: 'Low-Level / Systems',
    description: 'Pointers, memory management (malloc/free), structs, arrays & stack/heap layout',
  },
  {
    value: 'C++',
    label: 'C++',
    badge: 'OOP & STL',
    description: 'Classes, RAII, smart pointers, templates, STL (vector, map) & inheritance',
  },
  {
    value: 'Java',
    label: 'Java',
    badge: 'Enterprise & JVM',
    description: 'Core OOP, Collections, JVM architecture, GC, multithreading & interfaces',
  },
  {
    value: 'Python',
    label: 'Python',
    badge: 'Modern & Dynamic',
    description: 'Lists, dicts, iterators, generators, comprehensions, OOP & memory model',
  },
  {
    value: 'JavaScript',
    label: 'JavaScript',
    badge: 'Web & Async',
    description: 'Closures, event loop, promises, async/await, prototypes & modern ES6+',
  },
  {
    value: 'TypeScript',
    label: 'TypeScript',
    badge: 'Typed Systems',
    description: 'Generics, utility types, interfaces, structural typing & type safety',
  },
  {
    value: 'SQL',
    label: 'SQL',
    badge: 'Relational DB',
    description: 'Queries, joins, aggregations, window functions, CTEs & indexing',
  },
];

export const INTERVIEW_SUBJECTS: { label: InterviewSubject; value: InterviewSubject; description: string; icon: string }[] = [
  {
    label: 'DSA',
    value: 'DSA',
    description: 'Data Structures & Algorithms, Problem Solving, Complexity',
    icon: '⚡',
  },
  {
    label: 'DBMS',
    value: 'DBMS',
    description: 'Database Management Systems, ACID, Indexing, Transactions',
    icon: '🗄️',
  },
  {
    label: 'SQL',
    value: 'SQL',
    description: 'Queries, Joins, Aggregations, Window Functions, Optimization',
    icon: '📊',
  },
  {
    label: 'Operating Systems',
    value: 'Operating Systems',
    description: 'Processes, Threads, Memory Management, Deadlocks, Scheduling',
    icon: '💻',
  },
  {
    label: 'Computer Networks',
    value: 'Computer Networks',
    description: 'OSI Model, TCP/IP, Protocols, DNS, Sockets, Security',
    icon: '🌐',
  },
  {
    label: 'OOP',
    value: 'OOP',
    description: 'Object-Oriented Programming, SOLID Principles, Design Patterns',
    icon: '🧩',
  },
  {
    label: 'Java',
    value: 'Java',
    description: 'Core Java, Collections, Multithreading, JVM & Spring concepts',
    icon: '☕',
  },
  {
    label: 'Python',
    value: 'Python',
    description: 'Python Core, Generators, Decorators, OOP, Memory & Libraries',
    icon: '🐍',
  },
  {
    label: 'C/C++',
    value: 'C/C++',
    description: 'Pointers, Memory Management, STL, OOP & Low-Level Concepts',
    icon: '⚙️',
  },
  {
    label: 'Web Development',
    value: 'Web Development',
    description: 'Frontend/Backend architecture, JavaScript, APIs, Security',
    icon: '🚀',
  },
  {
    label: 'System Design',
    value: 'System Design',
    description: 'Scalability, Load Balancing, Caching, Microservices, CAP',
    icon: '📐',
  },
  {
    label: '+ Custom Subject',
    value: 'Custom Subject',
    description: 'Enter any custom subject domain (e.g. Cloud Computing, Cybersecurity, DevOps, Machine Learning, etc.)',
    icon: '✨',
  },
];

export const SUBJECT_TOPICS_MAP: Record<string, string[]> = {
  'Custom Subject': [
    'General Core Architecture & Fundamentals',
    'Best Practices & System Implementation',
    'Performance Optimization & Scalability',
    'Production Debugging & Troubleshooting',
    'Trade-offs & Architectural Scenarios',
  ],
  DSA: [
    'Arrays & Two Pointers',
    'Strings & Pattern Matching',
    'Linked Lists',
    'Stacks & Queues',
    'Binary Trees & BSTs',
    'Heaps & Priority Queues',
    'Graphs (BFS, DFS, Dijkstra)',
    'Dynamic Programming',
    'Recursion & Backtracking',
    'Greedy Algorithms',
    'Searching & Sorting',
    'Trie & Bit Manipulation',
    'Mixed DSA Concepts',
  ],
  DBMS: [
    'Relational Model & Key Constraints',
    'Normalization (1NF, 2NF, 3NF, BCNF)',
    'Transactions & ACID Properties',
    'Concurrency Control & Locking Protocols',
    'Indexing & B/B+ Trees',
    'Deadlock Detection & Recovery Management',
    'ER Modeling & Schema Architecture',
    'Query Processing & Optimization',
    'Mixed DBMS Concepts',
  ],
  SQL: [
    'SELECT, Filtering & Aggregations (GROUP BY / HAVING)',
    'Joins (INNER, LEFT, RIGHT, FULL, CROSS)',
    'Subqueries & CTEs (Common Table Expressions)',
    'Window Functions (ROW_NUMBER, RANK, DENSE_RANK, LEAD/LAG)',
    'Data Definition (DDL) & Data Manipulation (DML)',
    'Views, Indexes & Trigger Mechanisms',
    'Query Optimization & Execution Plans',
    'Stored Procedures & Transactions',
    'Mixed SQL Concepts',
  ],
  'Operating Systems': [
    'Processes, Threads & Multitasking',
    'CPU Scheduling Algorithms',
    'Process Synchronization (Semaphores & Mutex)',
    'Deadlocks (Conditions, Prevention & Avoidance)',
    'Memory Management & Paging/Segmentation',
    'Virtual Memory & Page Replacement Algorithms',
    'File Systems & Disk Scheduling',
    'Inter-Process Communication (IPC)',
    'Mixed OS Concepts',
  ],
  'Computer Networks': [
    'OSI 7-Layer & TCP/IP Model',
    'TCP vs UDP & 3-Way Handshake',
    'IP Addressing, Subnetting & CIDR',
    'HTTP, HTTPS, HTTP/2 & WebSockets',
    'DNS, DHCP, NAT & ARP',
    'Routing Protocols (OSPF, BGP, RIP)',
    'Network Security, Firewalls & TLS/SSL',
    'Flow Control & Congestion Control',
    'Mixed Networks Concepts',
  ],
  OOP: [
    'Four Core Pillars (Encapsulation, Abstraction, Inheritance, Polymorphism)',
    'SOLID Principles & Clean Code',
    'Creational Design Patterns (Singleton, Factory, Builder)',
    'Structural Design Patterns (Adapter, Decorator, Facade)',
    'Behavioral Design Patterns (Observer, Strategy, Command)',
    'Interfaces, Abstract Classes & Multiple Inheritance',
    'Composition vs Inheritance',
    'Mixed OOP Concepts',
  ],
  Java: [
    'Core Java & JVM Architecture (Memory, GC, ClassLoaders)',
    'Java Collections Framework (List, Map, Set, Queue)',
    'Multithreading, Concurrency & ExecutorService',
    'Exception Handling & Best Practices',
    'Java 8+ Features (Streams API, Lambdas, Optionals)',
    'Generics, Reflection & Annotations',
    'Memory Leaks & Garbage Collectors (G1, ZGC)',
    'Spring Boot Core Concepts & Dependency Injection',
    'Mixed Java Concepts',
  ],
  Python: [
    'Python Data Structures (Lists, Dicts, Tuples, Sets)',
    'OOP in Python & Magic (Dunder) Methods',
    'Iterators, Generators & Comprehensions',
    'Decorators & Context Managers',
    'Concurrency (Threading, Multiprocessing, Asyncio)',
    'Memory Management & GIL (Global Interpreter Lock)',
    'Error Handling & Exception Hierarchies',
    'Pythonic Best Practices & Type Hinting',
    'Mixed Python Concepts',
  ],
  'C/C++': [
    'Pointers, References & Dynamic Memory Allocation',
    'Memory Model: Stack vs Heap Allocation',
    'Constructors, Destructors & Virtual Functions (vtable)',
    'Smart Pointers & RAII (unique_ptr, shared_ptr, weak_ptr)',
    'Standard Template Library (STL) Containers & Algorithms',
    'Move Semantics, Rvalues & std::move',
    'Templates, Metaprogramming & constexpr',
    'Bitwise Operations, Structs & Unions',
    'Mixed C/C++ Concepts',
  ],
  'Web Development': [
    'JavaScript Core (Event Loop, Closures, Prototypes, Async/Await)',
    'DOM Manipulation, Events & Browser Rendering Pipeline',
    'React Architecture (Hooks, Reconciliation, State Management)',
    'RESTful API Design, GraphQL & WebSockets',
    'Authentication & Security (JWT, OAuth, Cookies, CORS, CSRF, XSS)',
    'Web Performance Optimization, Bundling & Caching',
    'Responsive Layouts (Flexbox, CSS Grid, Media Queries)',
    'Mixed Web Development Concepts',
  ],
  'System Design': [
    'Scalability & High Availability (Horizontal vs Vertical)',
    'Load Balancers & API Gateways',
    'Caching Architectures (Redis, Memcached, CDNs)',
    'Database Sharding, Replication & CAP Theorem',
    'Message Queues & Event-Driven Systems (Kafka, RabbitMQ)',
    'Microservices Architecture & Communication Protocols',
    'Rate Limiting & Resiliency (Circuit Breakers)',
    'Distributed Consensus & ACID vs BASE',
    'Mixed System Design Concepts',
  ],
};
