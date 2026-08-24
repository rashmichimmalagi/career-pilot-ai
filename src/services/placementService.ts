import {
  PlacementCategory,
  PlacementDifficulty,
  PlacementMCQ,
  PlacementMode,
  PlacementPracticeConfig,
  PlacementTestSession,
} from '../types/placement';
import { computeSessionBreakdown } from './placementStorage';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

/**
 * Fallback questions repository for offline or failure recovery
 */
const FALLBACK_MCQ_BANK: Record<string, Partial<PlacementMCQ>[]> = {
  // Aptitude: Percentages
  'Percentages': [
    {
      question: 'A student scored 85% in an examination of 600 maximum marks. How many marks did the student obtain?',
      options: {
        A: '480',
        B: '510',
        C: '525',
        D: '540',
      },
      correctOption: 'B',
      explanation: 'Marks obtained = 85% of 600 = (85 / 100) * 600 = 85 * 6 = 510.',
    },
    {
      question: 'If the price of petrol increases by 25%, by what percentage should a driver reduce consumption so that total expenditure remains unchanged?',
      options: {
        A: '20%',
        B: '25%',
        C: '16.67%',
        D: '30%',
      },
      correctOption: 'A',
      explanation: 'Reduction percentage = [R / (100 + R)] * 100 = [25 / 125] * 100 = (1/5) * 100 = 20%.',
    },
    {
      question: 'In an election between two candidates, the winner got 58% of the total votes and won by a majority of 1,600 votes. What was the total number of votes polled?',
      options: {
        A: '8,000',
        B: '10,000',
        C: '12,000',
        D: '15,000',
      },
      correctOption: 'B',
      explanation: 'Winner = 58%, Loser = 42%. Difference = 58% - 42% = 16%. Total votes * 16% = 1,600 => Total votes = (1,600 * 100) / 16 = 10,000.',
    },
    {
      question: 'A number is first increased by 20% and then decreased by 20%. What is the net percentage change in the original number?',
      options: {
        A: 'No change',
        B: '4% increase',
        C: '4% decrease',
        D: '2% decrease',
      },
      correctOption: 'C',
      explanation: 'Net change = a + b + (ab/100) = +20 - 20 + [(20 * -20) / 100] = 0 - 4 = -4% (i.e. 4% decrease).',
    },
    {
      question: 'In a college of 1,200 students, 60% are boys. If 40% of boys and 70% of girls participated in an annual hackathon, what percentage of the total student body participated?',
      options: {
        A: '52%',
        B: '50%',
        C: '55%',
        D: '48%',
      },
      correctOption: 'A',
      explanation: 'Boys = 60% of 1200 = 720. Girls = 480. Participating boys = 40% of 720 = 288. Participating girls = 70% of 480 = 336. Total participants = 288 + 336 = 624. Percentage = (624 / 1200) * 100 = 52%.',
    },
  ],

  // Aptitude: Profit & Loss
  'Profit & Loss': [
    {
      question: 'A shopkeeper sells an article for ₹840 at a profit of 20%. What was the cost price of the article?',
      options: {
        A: '₹680',
        B: '₹700',
        C: '₹720',
        D: '₹750',
      },
      correctOption: 'B',
      explanation: 'SP = CP * (1 + 0.20) => 840 = 1.2 * CP => CP = 840 / 1.2 = ₹700.',
    },
    {
      question: 'If the cost price of 12 pens is equal to the selling price of 8 pens, what is the profit percentage?',
      options: {
        A: '33.33%',
        B: '40%',
        C: '50%',
        D: '66.67%',
      },
      correctOption: 'C',
      explanation: 'Let CP of 1 pen = ₹1. CP of 8 pens = ₹8. SP of 8 pens = CP of 12 pens = ₹12. Profit = ₹12 - ₹8 = ₹4. Profit % = (4 / 8) * 100 = 50%.',
    },
    {
      question: 'A trader marks his goods 30% above the cost price and allows a discount of 10% on the marked price. What is his actual profit percentage?',
      options: {
        A: '15%',
        B: '17%',
        C: '20%',
        D: '22%',
      },
      correctOption: 'B',
      explanation: 'Let CP = 100. MP = 130. SP = 130 - (10% of 130) = 130 - 13 = 117. Profit = 117 - 100 = 17%.',
    },
    {
      question: 'By selling an item for ₹1,440, a dealer incurs a 10% loss. At what price must he sell it to gain 15%?',
      options: {
        A: '₹1,840',
        B: '₹1,760',
        C: '₹1,800',
        D: '₹1,920',
      },
      correctOption: 'A',
      explanation: 'CP = 1440 / 0.90 = ₹1,600. Desired SP with 15% gain = 1600 * 1.15 = ₹1,840.',
    },
    {
      question: 'Two items were sold at ₹990 each. On one, the seller gained 10%, and on the other, he lost 10%. What was the overall transaction result?',
      options: {
        A: 'No profit, no loss',
        B: '1% loss',
        C: '1% gain',
        D: '2% loss',
      },
      correctOption: 'B',
      explanation: 'When two articles are sold at the same price, one with x% gain and other with x% loss, there is always a net loss of (x / 10)^2 % = (10/10)^2 = 1% loss.',
    },
  ],

  // Technical: Operating Systems
  'Operating Systems': [
    {
      question: 'Which CPU scheduling algorithm is non-preemptive and selects the process with the shortest burst time first?',
      options: {
        A: 'Round Robin (RR)',
        B: 'Shortest Job First (SJF) non-preemptive',
        C: 'Shortest Remaining Time First (SRTF)',
        D: 'Priority Scheduling with Aging',
      },
      correctOption: 'B',
      explanation: 'Non-preemptive SJF queues all available processes and executes the one with the smallest CPU burst time until completion without preemption.',
    },
    {
      question: 'What condition is NOT one of the four Coffman conditions necessary for a deadlock to occur?',
      options: {
        A: 'Mutual Exclusion',
        B: 'Hold and Wait',
        C: 'Preemption Allowed',
        D: 'Circular Wait',
      },
      correctOption: 'C',
      explanation: 'The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption is allowed, deadlock cannot persist.',
    },
    {
      question: 'What is the primary purpose of the Translation Lookaside Buffer (TLB) in virtual memory management?',
      options: {
        A: 'To cache disk blocks',
        B: 'To cache page table translations (Virtual Page Number -> Physical Frame Number)',
        C: 'To perform process context switching',
        D: 'To schedule interrupt handlers',
      },
      correctOption: 'B',
      explanation: 'The TLB is a high-speed hardware associative memory cache that stores recent virtual-to-physical address mappings, avoiding multiple RAM lookups for page tables.',
    },
    {
      question: 'In UNIX/Linux, which system call replaces the current process image with a new executable program?',
      options: {
        A: 'fork()',
        B: 'exec() / execvp()',
        C: 'wait()',
        D: 'clone()',
      },
      correctOption: 'B',
      explanation: 'fork() creates a duplicate child process, while exec() family system calls overwrite the calling process text, data, and stack segments with a new executable.',
    },
    {
      question: 'What phenomenon occurs when excessive page faults happen, causing the CPU to spend more time swapping pages than executing instructions?',
      options: {
        A: 'Starvation',
        B: 'Fragmentation',
        C: 'Thrashing',
        D: 'Deadlock',
      },
      correctOption: 'C',
      explanation: 'Thrashing occurs when the active working sets of all processes exceed available physical memory, forcing continuous page faulting and disk I/O.',
    },
  ],

  // Technical: DSA
  'DSA': [
    {
      question: 'What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (such as AVL or Red-Black Tree)?',
      options: {
        A: 'O(1)',
        B: 'O(log N)',
        C: 'O(N)',
        D: 'O(N log N)',
      },
      correctOption: 'B',
      explanation: 'Balanced BSTs maintain a height bounded strictly by O(log N). Thus, lookup, insertion, and deletion operate in O(log N) worst-case time.',
    },
    {
      question: 'Which data structure is most naturally suited to evaluate an arithmetic postfix expression?',
      options: {
        A: 'Queue',
        B: 'Stack',
        C: 'Min-Heap',
        D: 'Binary Search Tree',
      },
      correctOption: 'B',
      explanation: 'A Stack handles operands and operators in Last-In First-Out order: operands are pushed onto the stack, and encountering an operator pops the top two operands and pushes the computed result.',
    },
    {
      question: 'What is the average and worst-case time complexity of QuickSort when choosing a naive first-element pivot on an already sorted array?',
      options: {
        A: 'Average O(N log N), Worst O(N^2)',
        B: 'Average O(N), Worst O(N log N)',
        C: 'Average O(N log N), Worst O(N log N)',
        D: 'Average O(N^2), Worst O(N^2)',
      },
      correctOption: 'A',
      explanation: 'QuickSort averages O(N log N) with balanced partitioning. However, picking a fixed pivot on an already sorted array yields unbalanced N vs 0 partitions, degrading to O(N^2).',
    },
    {
      question: 'Which graph algorithm computes the single-source shortest path on a weighted graph with non-negative edge weights in O((V + E) log V) time?',
      options: {
        A: 'Bellman-Ford Algorithm',
        B: 'Floyd-Warshall Algorithm',
        C: 'Dijkstra\'s Algorithm with Min-Heap',
        D: 'Kruskal\'s Algorithm',
      },
      correctOption: 'C',
      explanation: 'Dijkstra\'s Algorithm using a priority queue (min-heap) finds the shortest paths from a source vertex in O((V + E) log V) time provided edge weights are non-negative.',
    },
    {
      question: 'In Dynamic Programming, what two essential properties must an optimization problem exhibit to be solved with memoization or tabulation?',
      options: {
        A: 'Greedy choice property & sorted inputs',
        B: 'Optimal substructure & overlapping subproblems',
        C: 'Logarithmic height & balanced tree',
        D: 'Linear independence & acyclic vertices',
      },
      correctOption: 'B',
      explanation: 'Dynamic Programming requires Optimal Substructure (optimal global solution composed of optimal solutions to subproblems) and Overlapping Subproblems (subproblems are recalculated repeatedly).',
    },
  ],

  // Technical: DBMS
  'DBMS': [
    {
      question: 'Which normal form eliminates partial dependency of non-prime attributes on any candidate key?',
      options: {
        A: '1NF',
        B: '2NF',
        C: '3NF',
        D: 'BCNF',
      },
      correctOption: 'B',
      explanation: 'Second Normal Form (2NF) requires 1NF compliance and mandates that every non-prime attribute is fully functionally dependent on the entire candidate key (no partial dependency).',
    },
    {
      question: 'In database ACID properties, what does "Isolation" ensure during concurrent transaction execution?',
      options: {
        A: 'Transactions are all-or-nothing',
        B: 'Database transitions from one valid state to another',
        C: 'Intermediate states of a transaction are invisible to other concurrent transactions',
        D: 'Committed transactions survive hardware crashes',
      },
      correctOption: 'C',
      explanation: 'Isolation ensures that concurrent transactions execute as if they were running serially without interfering with each other\'s intermediate uncommitted modifications.',
    },
    {
      question: 'Why are B+ Trees predominantly preferred over B-Trees for database index storage on disk?',
      options: {
        A: 'B+ Trees do not require rebalancing',
        B: 'B+ Trees store all actual data/record pointers exclusively in leaf nodes linked sequentially, optimizing range queries and fitting more keys per internal node',
        C: 'B+ Trees have lower height than all binary trees by definition',
        D: 'B+ Trees use hash buckets instead of comparisons',
      },
      correctOption: 'B',
      explanation: 'In B+ Trees, internal nodes only store routing keys (allowing higher fanout and shallower trees), while leaf nodes form a doubly linked list enabling lightning-fast range scans.',
    },
    {
      question: 'Which SQL clause is used to filter aggregated grouped records (e.g. after GROUP BY)?',
      options: {
        A: 'WHERE',
        B: 'HAVING',
        C: 'ORDER BY',
        D: 'LIMIT',
      },
      correctOption: 'B',
      explanation: 'WHERE filters rows before aggregation, whereas HAVING filters groups created by the GROUP BY clause based on aggregate condition results.',
    },
    {
      question: 'What type of lock allows multiple transactions to read a database item simultaneously but prevents any transaction from writing to it?',
      options: {
        A: 'Exclusive (X) Lock',
        B: 'Shared (S) Lock',
        C: 'Intent Exclusive (IX) Lock',
        D: 'Spinlock',
      },
      correctOption: 'B',
      explanation: 'A Shared (S) lock permits concurrent read access across multiple transactions while blocking any transaction from acquiring an Exclusive (X) lock for write operations.',
    },
  ],

  // Technical: DBMS & SQL Series
  'DBMS & SQL': [
    {
      question: 'In SQL, what is the key behavioral difference between an INNER JOIN and a LEFT OUTER JOIN?',
      options: {
        A: 'INNER JOIN returns matching rows from both tables; LEFT OUTER JOIN returns all rows from the left table and matched rows or NULLs from the right table',
        B: 'INNER JOIN operates only on primary keys; LEFT OUTER JOIN operates only on foreign keys',
        C: 'LEFT JOIN removes duplicate rows; INNER JOIN preserves all duplicates',
        D: 'INNER JOIN creates a cross Cartesian product unconditionally',
      },
      correctOption: 'A',
      explanation: 'INNER JOIN selects rows that have matching values in both tables. LEFT OUTER JOIN retains all records from the left table, populating NULL values for unmatched right table columns.',
    },
    {
      question: 'A table is in 3NF if it is in 2NF and has no transitive dependencies. Under Boyce-Codd Normal Form (BCNF), what strict condition must hold for every non-trivial functional dependency X -> Y?',
      options: {
        A: 'Y must be a prime attribute',
        B: 'X must be a superkey (candidate key)',
        C: 'X and Y must belong to the same composite key',
        D: 'Y cannot contain NULL values',
      },
      correctOption: 'B',
      explanation: 'BCNF is a stricter version of 3NF. For every non-trivial functional dependency X -> Y, the determinant X MUST be a superkey of the relation.',
    },
    {
      question: 'What is the primary trade-off when creating secondary non-clustered indexes on a high-throughput relational database table?',
      options: {
        A: 'Reduces SELECT query latency, but increases disk space and overhead on INSERT, UPDATE, and DELETE operations',
        B: 'Speeds up write operations while slowing down read queries',
        C: 'Eliminates the need for a primary key',
        D: 'Forces table scans for all future queries',
      },
      correctOption: 'A',
      explanation: 'Indexes dramatically speed up filtering (WHERE) and sorting (ORDER BY) reads, but every write modification (INSERT, UPDATE, DELETE) requires maintaining the B-Tree index structures, consuming I/O and storage.',
    },
    {
      question: 'In database transaction management, what concurrency anomaly is described as reading uncommitted changes made by another concurrently executing transaction that subsequently rolls back?',
      options: {
        A: 'Non-repeatable Read',
        B: 'Dirty Read',
        C: 'Phantom Read',
        D: 'Lost Update',
      },
      correctOption: 'B',
      explanation: 'A Dirty Read happens when transaction T1 reads data modified by transaction T2 before T2 commits. If T2 aborts/rolls back, T1 processed corrupt, non-existent state.',
    },
    {
      question: 'Which ACID property guarantees that once a transaction completes and commits, its state mutations persist in non-volatile storage even across unexpected system crashes or power outages?',
      options: {
        A: 'Atomicity',
        B: 'Consistency',
        C: 'Isolation',
        D: 'Durability',
      },
      correctOption: 'D',
      explanation: 'Durability ensures that committed transaction results are recorded in write-ahead logs (WAL) and disk storage, surviving immediate hardware crashes.',
    },
    {
      question: 'Consider the SQL query: "SELECT dept_id, COUNT(*) FROM employees GROUP BY dept_id HAVING COUNT(*) > 5;". In what order do SQL logical query processing stages execute this query?',
      options: {
        A: 'FROM -> GROUP BY -> HAVING -> SELECT',
        B: 'SELECT -> FROM -> GROUP BY -> HAVING',
        C: 'FROM -> SELECT -> HAVING -> GROUP BY',
        D: 'HAVING -> GROUP BY -> FROM -> SELECT',
      },
      correctOption: 'A',
      explanation: 'Standard SQL execution evaluates FROM table sources first, applies GROUP BY partitioning, filters groups using HAVING criteria, and lastly projects the SELECT columns.',
    },
    {
      question: 'What is the fundamental difference between a Primary Key and a Unique Key in relational database constraints?',
      options: {
        A: 'A table can have multiple Primary Keys but only one Unique Key',
        B: 'Primary Key attributes cannot accept NULL values, whereas Unique Key columns can accept at least one NULL value (in standard SQL)',
        C: 'Unique Keys automatically create clustered indexes in all engines',
        D: 'Primary Keys cannot be referenced by Foreign Keys',
      },
      correctOption: 'B',
      explanation: 'A relation can have only one Primary Key, which strictly forbids NULL values. Unique constraints enforce uniqueness across non-null entries and can exist multiple times per table.',
    },
    {
      question: 'In Strict Two-Phase Locking (Strict 2PL), when are exclusive (write) locks released by a transaction?',
      options: {
        A: 'Immediately after the write statement finishes executing',
        B: 'Only at the end of the transaction after COMMIT or ABORT',
        C: 'During the shrinking phase prior to commit',
        D: 'When another transaction requests a shared lock',
      },
      correctOption: 'B',
      explanation: 'Strict 2PL prevents cascading rollbacks by requiring that all exclusive write locks held by a transaction are retained until the transaction fully commits or aborts.',
    },
  ],

  // Specific DBMS & SQL subtopics
  'SQL Joins': [
    {
      question: 'What type of JOIN in SQL returns all records when there is a match in either left or right table, filling in NULLs where no match exists?',
      options: {
        A: 'FULL OUTER JOIN',
        B: 'CROSS JOIN',
        C: 'INNER JOIN',
        D: 'NATURAL JOIN',
      },
      correctOption: 'A',
      explanation: 'FULL OUTER JOIN combines the results of both LEFT and RIGHT outer joins, returning matching rows and NULL-padded rows for unmatched entries on either side.',
    },
    {
      question: 'When performing a CROSS JOIN between Table A with 5 rows and Table B with 10 rows without a WHERE clause, how many rows will the resulting dataset contain?',
      options: {
        A: '15',
        B: '50',
        C: '10',
        D: '5',
      },
      correctOption: 'B',
      explanation: 'A CROSS JOIN produces the Cartesian product of the two tables. Rows = 5 * 10 = 50 rows.',
    },
  ],

  'Normalization': [
    {
      question: 'Which Normal Form requires that a relation is in 1NF and contains no partial dependencies on any candidate key?',
      options: {
        A: '2NF',
        B: '3NF',
        C: 'BCNF',
        D: '4NF',
      },
      correctOption: 'A',
      explanation: '2NF eliminates partial dependency, ensuring non-prime attributes depend on the entire candidate key rather than a subset.',
    },
    {
      question: 'What type of dependency is eliminated when decomposing a relation from 2NF to 3NF?',
      options: {
        A: 'Partial Dependency',
        B: 'Transitive Dependency (X -> Y and Y -> Z where Z is non-prime)',
        C: 'Multivalued Dependency',
        D: 'Join Dependency',
      },
      correctOption: 'B',
      explanation: '3NF eliminates transitive dependencies, meaning non-prime attributes must depend directly and only on candidate keys.',
    },
  ],

  'Indexing': [
    {
      question: 'How many clustered indexes can exist on a single table in most relational database management systems (such as PostgreSQL or SQL Server)?',
      options: {
        A: 'Only 1, because the clustered index dictates the physical sorting order of rows on disk',
        B: 'Up to 16 clustered indexes',
        C: 'Unlimited clustered indexes',
        D: 'One for every column with a unique constraint',
      },
      correctOption: 'A',
      explanation: 'Since the clustered index defines the actual physical on-disk sequence of table rows, a table can possess only one clustered index.',
    },
  ],

  'Transactions': [
    {
      question: 'Which transaction isolation level prevents Dirty Reads and Non-Repeatable Reads, but may still allow Phantom Reads in ANSI SQL standards?',
      options: {
        A: 'Read Uncommitted',
        B: 'Read Committed',
        C: 'Repeatable Read',
        D: 'Serializable',
      },
      correctOption: 'C',
      explanation: 'Repeatable Read locks rows read by a query so concurrent transactions cannot modify or delete them, preventing non-repeatable reads. However, newly inserted rows (phantoms) may still appear unless range locks or Serializable isolation is used.',
    },
  ],

  'ACID Properties': [
    {
      question: 'Which ACID property guarantees that if a system crash occurs midway through a fund transfer transaction, the deduction from Account A and credit to Account B will either both succeed or both be completely rolled back?',
      options: {
        A: 'Atomicity',
        B: 'Consistency',
        C: 'Isolation',
        D: 'Durability',
      },
      correctOption: 'A',
      explanation: 'Atomicity enforces the "all-or-nothing" rule: all operations within a transaction complete successfully, or all changes are aborted with zero partial side-effects.',
    },
  ],

  // Technical: Computer Networks
  'Computer Networks': [
    {
      question: 'In the TCP 3-way handshake, what sequence of control flags is exchanged between client and server to establish a reliable connection?',
      options: {
        A: 'SYN -> SYN-ACK -> ACK',
        B: 'ACK -> SYN -> SYN-ACK',
        C: 'FIN -> ACK -> FIN-ACK',
        D: 'RST -> SYN -> ACK',
      },
      correctOption: 'A',
      explanation: 'The client transmits a SYN packet with an initial sequence number; the server responds with SYN-ACK; the client finalizes connection establishment with an ACK packet.',
    },
    {
      question: 'Which layer of the OSI model is responsible for logical IP addressing, packet routing, and fragmentation?',
      options: {
        A: 'Data Link Layer (Layer 2)',
        B: 'Network Layer (Layer 3)',
        C: 'Transport Layer (Layer 4)',
        D: 'Session Layer (Layer 5)',
      },
      correctOption: 'B',
      explanation: 'Layer 3 (Network Layer) manages IP addressing, path determination/routing (e.g. OSPF, BGP), and packet fragmentation across intermediate networks.',
    },
    {
      question: 'What is the default subnet mask for a standard Class C IPv4 network (/24 in CIDR notation)?',
      options: {
        A: '255.0.0.0',
        B: '255.255.0.0',
        C: '255.255.255.0',
        D: '255.255.255.240',
      },
      correctOption: 'C',
      explanation: 'A /24 network assigns 24 bits to the network prefix and 8 bits to the host identifier, represented as 255.255.255.0.',
    },
    {
      question: 'Which protocol dynamically assigns IP addresses, subnet masks, and default gateways to client host machines upon connecting to a local network?',
      options: {
        A: 'DNS',
        B: 'DHCP',
        C: 'ARP',
        D: 'ICMP',
      },
      correctOption: 'B',
      explanation: 'DHCP (Dynamic Host Configuration Protocol) automates host configuration using the DORA (Discover, Offer, Request, Acknowledge) process.',
    },
    {
      question: 'What key difference distinguishes TCP from UDP at the Transport Layer?',
      options: {
        A: 'TCP is connectionless and best-effort; UDP provides guaranteed in-order byte stream delivery',
        B: 'TCP provides reliable, in-order delivery with flow and congestion control; UDP is connectionless and low-overhead without delivery guarantees',
        C: 'UDP uses 128-bit addresses; TCP uses 32-bit addresses',
        D: 'TCP operates at Layer 7; UDP operates at Layer 4',
      },
      correctOption: 'B',
      explanation: 'TCP guarantees ordered, reliable packet reception with window-based flow control and congestion avoidance algorithms, while UDP prioritizes low latency without handshakes or retransmissions.',
    },
  ],
};

/**
 * Generate fallback questions tailored strictly to requested subject and topic
 */
export function generateFallbackPlacementMCQs(
  config: PlacementPracticeConfig
): PlacementMCQ[] {
  const targetCount = config.questionCount || 5;
  const topicKey = config.isCustomTopic ? config.customTopicText || 'General' : config.topic;
  const subjectKey = config.isCustomSubject ? config.customSubjectText || 'General' : config.subject;

  // Check matching bank with fuzzy/substring matching
  let pool = FALLBACK_MCQ_BANK[topicKey] || FALLBACK_MCQ_BANK[subjectKey];

  if (!pool || pool.length === 0) {
    const lowerTopic = (topicKey || '').toLowerCase();
    const lowerSubject = (subjectKey || '').toLowerCase();

    // Check if topic/subject contains DBMS or SQL
    if (lowerTopic.includes('dbms') || lowerTopic.includes('sql') || lowerSubject.includes('dbms') || lowerSubject.includes('sql')) {
      if (lowerTopic.includes('join')) pool = FALLBACK_MCQ_BANK['SQL Joins'];
      else if (lowerTopic.includes('norm')) pool = FALLBACK_MCQ_BANK['Normalization'];
      else if (lowerTopic.includes('index')) pool = FALLBACK_MCQ_BANK['Indexing'];
      else if (lowerTopic.includes('transact') || lowerTopic.includes('concur')) pool = FALLBACK_MCQ_BANK['Transactions'];
      else if (lowerTopic.includes('acid')) pool = FALLBACK_MCQ_BANK['ACID Properties'];
      else pool = FALLBACK_MCQ_BANK['DBMS & SQL'] || FALLBACK_MCQ_BANK['DBMS'];
    } else if (lowerTopic.includes('os') || lowerTopic.includes('operat') || lowerSubject.includes('operat')) {
      pool = FALLBACK_MCQ_BANK['Operating Systems'];
    } else if (lowerTopic.includes('network') || lowerSubject.includes('network')) {
      pool = FALLBACK_MCQ_BANK['Computer Networks'];
    } else if (lowerTopic.includes('dsa') || lowerTopic.includes('array') || lowerTopic.includes('tree') || lowerSubject.includes('dsa')) {
      pool = FALLBACK_MCQ_BANK['DSA'];
    } else if (lowerTopic.includes('profit') || lowerTopic.includes('loss')) {
      pool = FALLBACK_MCQ_BANK['Profit & Loss'];
    } else {
      pool = FALLBACK_MCQ_BANK['Percentages'] || FALLBACK_MCQ_BANK['DSA'] || [];
    }
  }

  const generated: PlacementMCQ[] = [];

  for (let i = 0; i < targetCount; i++) {
    const template = pool[i % pool.length];
    const qNum = i + 1;

    generated.push({
      id: `mcq_fb_${Date.now()}_${qNum}`,
      questionNumber: qNum,
      question: template.question || `What is a primary principle in ${subjectKey} concerning ${topicKey}?`,
      options: template.options || {
        A: `Primary foundational rule of ${topicKey}`,
        B: `Secondary optimization approach in ${subjectKey}`,
        C: `Theoretical upper-bound constraint`,
        D: `None of the above`,
      },
      correctOption: (template.correctOption as any) || 'A',
      explanation: template.explanation || `In ${subjectKey} (${topicKey}), this option directly satisfies the fundamental conceptual definition and computational invariant.`,
      category: config.category,
      subject: subjectKey,
      topic: topicKey,
      difficulty: config.difficulty,
    });
  }

  return generated;
}

/**
 * Client API caller to generate placement MCQs via backend
 */
export async function generatePlacementMCQs(
  config: PlacementPracticeConfig,
  signal?: AbortSignal
): Promise<PlacementMCQ[]> {
  try {
    const payload = {
      category: config.category,
      subject: config.isCustomSubject ? config.customSubjectText : config.subject,
      isCustomSubject: config.isCustomSubject,
      customSubjectText: config.customSubjectText,
      topic: config.isCustomTopic ? config.customTopicText : config.topic,
      isCustomTopic: config.isCustomTopic,
      customTopicText: config.customTopicText,
      topics: config.topics,
      difficulty: config.difficulty,
      questionCount: config.questionCount || 5,
      mode: config.mode,
      company: config.company,
      role: config.role,
    };

    const res = await fetchWithTimeout('/api/placement/generate-mcqs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      timeoutMs: 12000,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions.map((q: any, idx: number) => ({
          id: q.id || `mcq_${Date.now()}_${idx + 1}`,
          questionNumber: idx + 1,
          question: q.question || `Question ${idx + 1}`,
          options: {
            A: q.options?.A || 'Option A',
            B: q.options?.B || 'Option B',
            C: q.options?.C || 'Option C',
            D: q.options?.D || 'Option D',
          },
          correctOption: (['A', 'B', 'C', 'D'].includes(q.correctOption?.toUpperCase())
            ? q.correctOption.toUpperCase()
            : 'A') as 'A' | 'B' | 'C' | 'D',
          explanation: q.explanation || 'Calculation and conceptual rationale provided.',
          category: config.category,
          subject: payload.subject || 'General',
          topic: payload.topic || 'General',
          difficulty: config.difficulty,
          codeSnippet: q.codeSnippet,
        }));
      }
    }
  } catch (err) {
    console.warn('[PlacementService] Backend AI call failed or timed out, generating resilient fallbacks:', err);
  }

  // Resilient fallback
  return generateFallbackPlacementMCQs(config);
}
