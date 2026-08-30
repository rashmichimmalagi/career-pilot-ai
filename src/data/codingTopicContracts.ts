import { CodingDifficulty, CodingLanguage, CodingProblem, CodingTestCase } from '../types/coding';

/**
 * High-level topic category classification
 */
export type TopicCategory =
  | 'CONTROL_FLOW_ELSE_IF'
  | 'CONTROL_FLOW_IF'
  | 'CONTROL_FLOW_SWITCH'
  | 'PARITY_MODULO'
  | 'LOOP_FOR'
  | 'LOOP_WHILE'
  | 'POINTERS_MEMORY'
  | 'FUNCTIONS_BASIC'
  | 'RECURSION'
  | 'ARRAYS'
  | 'STRINGS'
  | 'SEARCHING'
  | 'SORTING'
  | 'BINARY_SEARCH'
  | 'TWO_POINTERS'
  | 'SLIDING_WINDOW'
  | 'LINKED_LIST'
  | 'STACK'
  | 'QUEUE'
  | 'TREES'
  | 'GRAPHS'
  | 'DYNAMIC_PROGRAMMING'
  | 'BIT_MANIPULATION'
  | 'GREEDY'
  | 'BACKTRACKING'
  | 'SQL'
  | 'DBMS'
  | 'OPERATING_SYSTEMS'
  | 'COMPUTER_NETWORKS'
  | 'OOP'
  | 'SYSTEM_DESIGN'
  | 'GENERIC_DOMAIN';

export interface TopicConceptContract {
  category: TopicCategory;
  canonicalConcept: string;
  conceptSummary: string;
  requiredConstructs: string[];
  forbiddenConstructs: string[];
  promptInstruction: string;
  inputDescription: string;
  outputDescription: string;
  sampleProblem: {
    title: string;
    funcName: string;
    description: string;
    examples: Array<{ input: string; output: string; explanation: string }>;
    constraints: string[];
    signatures: Record<string, string>;
    starterCodes: Record<string, string>;
    testCases: Array<{ id: string; input: string; expectedOutput: string; category?: string; isHidden: boolean }>;
    hints: string[];
  };
}

/**
 * Normalizes input string for robust keyword matching
 */
function cleanText(text: string): string {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
}

/**
 * Resolves any topic string (including custom user topics) into a strict TopicConceptContract
 */
export function resolveTopicConcept(topic: string, subject: string = 'DSA'): TopicConceptContract {
  const t = cleanText(topic);
  const s = cleanText(subject);

  // 1. SQL & Relational Database queries
  if (s === 'sql' || t.includes('query') || t.includes('sql') || t.includes('select') || t.includes('join') || t.includes('group by') || t.includes('window function')) {
    return {
      category: 'SQL',
      canonicalConcept: 'SQL Relational Database Querying',
      conceptSummary: 'Writing declarative SQL queries against structured database tables with filtering, joins, aggregations, and sorting.',
      requiredConstructs: ['SELECT', 'FROM', 'WHERE or JOIN or GROUP BY', 'Relational Table Schema'],
      forbiddenConstructs: ['vector<int>', 'array algorithms', 'binary search', 'loops', 'classes in C++/Java'],
      promptInstruction: `The problem MUST be a relational database SQL query challenge. You MUST define clear database table schemas (table names, column names, sample rows) in the description. The student writes an SQL query. Starter code MUST be an empty SELECT template.`,
      inputDescription: 'Database table records.',
      outputDescription: 'Result set conforming to query requirements.',
      sampleProblem: {
        title: 'Customer Orders and Revenue Summary',
        funcName: 'queryCustomerRevenue',
        description: `### Database Schema
You are given two tables: \`customers\` and \`orders\`.

\`customers\` table:
- \`customer_id\` (INT, PRIMARY KEY)
- \`customer_name\` (VARCHAR)
- \`city\` (VARCHAR)

\`orders\` table:
- \`order_id\` (INT, PRIMARY KEY)
- \`customer_id\` (INT, FOREIGN KEY)
- \`order_amount\` (DECIMAL)
- \`order_date\` (DATE)

### Problem Description
Write an SQL query to retrieve the \`customer_name\` and the total sum of their \`order_amount\` as \`total_spent\` for all customers who have placed at least one order.

Return the results ordered by \`total_spent\` in descending order.`,
        examples: [
          {
            input: `customers:\n+-------------+---------------+---------+\n| customer_id | customer_name | city    |\n+-------------+---------------+---------+\n| 1           | Alice         | Seattle |\n| 2           | Bob           | Austin  |\n+-------------+---------------+---------+\n\norders:\n+----------+-------------+--------------+\n| order_id | customer_id | order_amount |\n+----------+-------------+--------------+\n| 101      | 1           | 250.00       |\n| 102      | 1           | 150.00       |\n| 103      | 2           | 500.00       |\n+----------+-------------+--------------+`,
            output: `+---------------+-------------+\n| customer_name | total_spent |\n+---------------+-------------+\n| Bob           | 500.00      |\n| Alice         | 400.00      |\n+---------------+-------------+`,
            explanation: 'Bob spent 500.00 total and Alice spent 400.00 total.',
          },
        ],
        constraints: ['1 <= customers count <= 10^4', '1 <= orders count <= 10^5'],
        signatures: { SQL: '-- Write your SQL query below' },
        starterCodes: {
          SQL: `-- Write your SQL query below\nSELECT \n    *\nFROM \n    customers;\n`,
        },
        testCases: [
          { id: 'tc_1', input: 'sample database tables', expectedOutput: 'ordered customer names with total spent', isHidden: false },
        ],
        hints: ['Use an INNER JOIN between customers and orders on customer_id.', 'Use SUM(order_amount) and GROUP BY customers.customer_id, customers.customer_name.', 'Order by total_spent DESC.'],
      },
    };
  }

  // 2. Else If Statement / Conditional Decision Ladders / Multi-way Classification
  if (
    t.includes('else if') ||
    t.includes('elseif') ||
    t.includes('if else if') ||
    t.includes('elif') ||
    t.includes('ladder') ||
    t.includes('grade') ||
    t.includes('tax slab') ||
    t.includes('bracket') ||
    t.includes('bmi') ||
    t.includes('classify') ||
    (t.includes('if') && t.includes('else') && !t.includes('even') && !t.includes('odd') && !t.includes('array'))
  ) {
    return {
      category: 'CONTROL_FLOW_ELSE_IF',
      canonicalConcept: 'Multi-way Conditional Branching (if / else if / else)',
      conceptSummary: 'Evaluating scalar numeric or categorical values across multiple discrete thresholds or ranges using if / else if / else conditional ladders.',
      requiredConstructs: ['if', 'else if', 'else', 'scalar comparison (<, <=, >, >=, ==)'],
      forbiddenConstructs: [
        'vector<int> nums',
        'int* nums',
        'int target',
        'array search',
        'sorting',
        'binary search',
        'linked list',
        'trees',
        'graphs',
        'dynamic programming',
        'matrix',
      ],
      promptInstruction: `The problem MUST test multi-way conditional branching using IF / ELSE IF / ELSE statements.
CRITICAL MANDATORY RULES:
1. The input MUST be a single scalar value (e.g. integer marks/score/income/age, or float temperature/BMI, or hours).
2. The output MUST be a category character, string, or computed rate (e.g. grade 'A'/'B'/'C'/'D'/'F', or tax category, or status name).
3. DO NOT use arrays, vectors (e.g. NO vector<int> nums), NO target search, NO sorting, NO binary search, NO data structures.
4. The expected solution MUST require testing multiple threshold ranges using if / else if / else.`,
      inputDescription: 'A scalar integer or numeric value representing the quantity to categorize.',
      outputDescription: 'A single character or string representing the classification or computed decision.',
      sampleProblem: {
        title: 'Student Grade Classification via Else-If Ladder',
        funcName: 'classifyGrade',
        description: `### Problem Description
Given a student's numerical score \`marks\` (between 0 and 100), write a function to determine their academic grade based on the following standard grading ladder:

- **\`marks >= 90\`**: Return **\`'A'\`**
- **\`75 <= marks < 90\`**: Return **\`'B'\`**
- **\`60 <= marks < 75\`**: Return **\`'C'\`**
- **\`45 <= marks < 60\`**: Return **\`'D'\`**
- **\`marks < 45\`**: Return **\`'F'\`**

Your solution should evaluate the conditions sequentially using an **if / else if / else** conditional structure.`,
        examples: [
          { input: 'marks = 95', output: "'A'", explanation: 'Score 95 is >= 90, so grade is A.' },
          { input: 'marks = 82', output: "'B'", explanation: 'Score 82 is between 75 and 89, so grade is B.' },
          { input: 'marks = 64', output: "'C'", explanation: 'Score 64 is between 60 and 74, so grade is C.' },
          { input: 'marks = 50', output: "'D'", explanation: 'Score 50 is between 45 and 59, so grade is D.' },
          { input: 'marks = 32', output: "'F'", explanation: 'Score 32 is below 45, so grade is F.' },
        ],
        constraints: ['0 <= marks <= 100', 'marks is an integer'],
        signatures: {
          C: 'char classifyGrade(int marks)',
          'C++': 'char classifyGrade(int marks)',
          Java: 'public char classifyGrade(int marks)',
          Python: 'def classifyGrade(self, marks: int) -> str:',
          JavaScript: 'function classifyGrade(marks)',
        },
        starterCodes: {
          C: `#include <stdio.h>\n\nchar classifyGrade(int marks) {\n    // Implement your if / else if / else branching logic below\n    return 'F';\n}`,
          'C++': `#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    char classifyGrade(int marks) {\n        // Implement your if / else if / else branching logic below\n        return 'F';\n    }\n};`,
          Java: `class Solution {\n    public char classifyGrade(int marks) {\n        // Implement your if / else if / else branching logic below\n        return 'F';\n    }\n}`,
          Python: `class Solution:\n    def classifyGrade(self, marks: int) -> str:\n        # Implement your if / elif / else branching logic below\n        pass`,
          JavaScript: `/**\n * @param {number} marks\n * @return {string}\n */\nfunction classifyGrade(marks) {\n  // Implement your if / else if / else branching logic below\n  return 'F';\n}`,
        },
        testCases: [
          { id: 'tc_1', input: 'marks = 95', expectedOutput: "'A'", isHidden: false },
          { id: 'tc_2', input: 'marks = 82', expectedOutput: "'B'", isHidden: false },
          { id: 'tc_3', input: 'marks = 64', expectedOutput: "'C'", isHidden: true },
          { id: 'tc_4', input: 'marks = 45', expectedOutput: "'D'", isHidden: true },
          { id: 'tc_5', input: 'marks = 20', expectedOutput: "'F'", isHidden: true },
        ],
        hints: [
          'Start by checking the highest threshold (marks >= 90) first.',
          'Use else if (marks >= 75) for the second tier, as marks < 90 is already guaranteed by the preceding if.',
          'Conclude with a final else branch for marks < 45 returning \'F\'.',
        ],
      },
    };
  }

  // 3. Simple If Statement / Boolean Conditions / Validation
  if (t.includes('if statement') || t.includes('simple if') || t.includes('condition') || t.includes('voting') || t.includes('eligibility') || t.includes('leap year') || t.includes('pass fail')) {
    return {
      category: 'CONTROL_FLOW_IF',
      canonicalConcept: 'Basic Conditional Statement (if / boolean check)',
      conceptSummary: 'Evaluating a single logical expression or decision boundary to return true/false or perform conditional execution.',
      requiredConstructs: ['if', 'boolean expression', 'relational operators'],
      forbiddenConstructs: ['vector<int>', 'int* nums', 'array search', 'sorting', 'binary search', 'trees', 'dp'],
      promptInstruction: `The problem MUST test basic conditional verification (if statement). The input MUST be scalar arguments (e.g. integer age/year/number). The output is a boolean or simple string result. DO NOT generate array or search problems.`,
      inputDescription: 'Scalar integer or numeric parameters to evaluate.',
      outputDescription: 'Boolean true/false or simple validation status.',
      sampleProblem: {
        title: 'Check Voting Eligibility and Age Condition',
        funcName: 'isEligibleToVote',
        description: `### Problem Description
Given an integer \`age\` representing a citizen's age, write a function using a conditional **if statement** to check if the person is eligible to vote in national elections.

A person is eligible to vote if and only if their \`age >= 18\`. Return \`true\` if eligible, otherwise return \`false\`.`,
        examples: [
          { input: 'age = 20', output: 'true', explanation: 'Age 20 is >= 18, so eligible.' },
          { input: 'age = 16', output: 'false', explanation: 'Age 16 is < 18, so not eligible.' },
        ],
        constraints: ['0 <= age <= 150'],
        signatures: {
          C: 'bool isEligibleToVote(int age)',
          'C++': 'bool isEligibleToVote(int age)',
          Java: 'public boolean isEligibleToVote(int age)',
          Python: 'def isEligibleToVote(self, age: int) -> bool:',
          JavaScript: 'function isEligibleToVote(age)',
        },
        starterCodes: {
          C: `#include <stdbool.h>\n\nbool isEligibleToVote(int age) {\n    // Implement using if statement\n    return false;\n}`,
          'C++': `#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isEligibleToVote(int age) {\n        // Implement using if statement\n        return false;\n    }\n};`,
          Java: `class Solution {\n    public boolean isEligibleToVote(int age) {\n        // Implement using if statement\n        return false;\n    }\n}`,
          Python: `class Solution:\n    def isEligibleToVote(self, age: int) -> bool:\n        # Implement using if statement\n        pass`,
          JavaScript: `function isEligibleToVote(age) {\n  // Implement using if statement\n  return false;\n}`,
        },
        testCases: [
          { id: 'tc_1', input: 'age = 20', expectedOutput: 'true', isHidden: false },
          { id: 'tc_2', input: 'age = 17', expectedOutput: 'false', isHidden: false },
          { id: 'tc_3', input: 'age = 18', expectedOutput: 'true', isHidden: true },
        ],
        hints: ['Check if age >= 18 using an if statement.'],
      },
    };
  }

  // 4. Parity & Modulo Arithmetic (Even / Odd)
  if (t.includes('even') || t.includes('odd') || t.includes('parity') || t.includes('modulo') || t.includes('divisib')) {
    return {
      category: 'PARITY_MODULO',
      canonicalConcept: 'Parity Check and Modulo Arithmetic (Even / Odd)',
      conceptSummary: 'Determining whether integers are even or odd using the modulo arithmetic operator (% 2 == 0).',
      requiredConstructs: ['modulo operator %', 'even/odd condition'],
      forbiddenConstructs: ['binary search', 'sliding window', 'subarray parity balancing', 'dp table', 'two sum'],
      promptInstruction: `The problem MUST test integer parity (Even or Odd) or divisibility using the modulo operator (n % 2).
The problem should accept an integer or simple numbers and determine whether it is even or odd, returning "Even" or "Odd" (or counting evens/odds).
DO NOT generate complex subarray or sliding window problems.`,
      inputDescription: 'A single integer n (or simple integer array to count parity).',
      outputDescription: 'String "Even" or "Odd", or boolean true/false.',
      sampleProblem: {
        title: 'Check Even or Odd Integer Parity',
        funcName: 'checkEvenOrOdd',
        description: `### Problem Description
Given an integer \`n\`, write a function to determine whether \`n\` is **Even** or **Odd**.

- If \`n\` is divisible by 2 with no remainder (\`n % 2 == 0\`), return **\`"Even"\`**.
- Otherwise, return **\`"Odd"\`**.

Remember that \`0\` is an even integer, and negative numbers follow standard parity rules (e.g. \`-4\` is Even, \`-7\` is Odd).`,
        examples: [
          { input: 'n = 8', output: '"Even"', explanation: '8 % 2 == 0, so it is Even.' },
          { input: 'n = 7', output: '"Odd"', explanation: '7 % 2 != 0, so it is Odd.' },
          { input: 'n = 0', output: '"Even"', explanation: '0 is divisible by 2, so it is Even.' },
          { input: 'n = -5', output: '"Odd"', explanation: '-5 has odd parity.' },
        ],
        constraints: ['-10^9 <= n <= 10^9'],
        signatures: {
          C: 'const char* checkEvenOrOdd(int n)',
          'C++': 'string checkEvenOrOdd(int n)',
          Java: 'public String checkEvenOrOdd(int n)',
          Python: 'def checkEvenOrOdd(self, n: int) -> str:',
          JavaScript: 'function checkEvenOrOdd(n)',
        },
        starterCodes: {
          C: `#include <stdio.h>\n\nconst char* checkEvenOrOdd(int n) {\n    // Implement even / odd parity check\n    return "";\n}`,
          'C++': `#include <iostream>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    string checkEvenOrOdd(int n) {\n        // Implement even / odd parity check\n        return "";\n    }\n};`,
          Java: `class Solution {\n    public String checkEvenOrOdd(int n) {\n        // Implement even / odd parity check\n        return "";\n    }\n}`,
          Python: `class Solution:\n    def checkEvenOrOdd(self, n: int) -> str:\n        # Implement even / odd parity check\n        pass`,
          JavaScript: `/**\n * @param {number} n\n * @return {string}\n */\nfunction checkEvenOrOdd(n) {\n  // Implement even / odd parity check\n  return "";\n}`,
        },
        testCases: [
          { id: 'tc_1', input: 'n = 8', expectedOutput: '"Even"', isHidden: false },
          { id: 'tc_2', input: 'n = 7', expectedOutput: '"Odd"', isHidden: false },
          { id: 'tc_3', input: 'n = 0', expectedOutput: '"Even"', isHidden: true },
          { id: 'tc_4', input: 'n = -13', expectedOutput: '"Odd"', isHidden: true },
          { id: 'tc_5', input: 'n = -42', expectedOutput: '"Even"', isHidden: true },
        ],
        hints: ['Use the remainder modulo operator: n % 2 == 0 indicates even numbers.', 'Note that for negative numbers in C/C++/Java, n % 2 might return -1 for odd numbers, so check n % 2 == 0 or use abs(n) % 2 == 1.'],
      },
    };
  }

  // 5. For Loop / Iteration / Series Sum
  if (t.includes('for loop') || t.includes('for loops') || t.includes('iteration') || t.includes('factorial') || t.includes('sum of n') || t.includes('series')) {
    return {
      category: 'LOOP_FOR',
      canonicalConcept: 'Iteration using For Loops',
      conceptSummary: 'Iterating a fixed number of steps from 1 to N to compute sums, products, counts, or step-wise calculations.',
      requiredConstructs: ['for loop (int i = 1; i <= n; i++)', 'accumulator variable'],
      forbiddenConstructs: ['binary search', 'tree traversal', 'dp memoization', 'vector<int> target search'],
      promptInstruction: `The problem MUST test iteration using a FOR LOOP over a range of numbers 1 to N (e.g. sum of natural numbers 1..N, factorial of N, counting multiples, computing power).
The input MUST be a single scalar integer N.
DO NOT generate an array search or sorting problem.`,
      inputDescription: 'A scalar positive integer N.',
      outputDescription: 'Computed accumulator value (sum, product, count).',
      sampleProblem: {
        title: 'Calculate Sum of First N Natural Numbers using For Loop',
        funcName: 'sumOfNaturalNumbers',
        description: `### Problem Description
Given a positive integer \`n\`, write a function using a **for loop** to calculate and return the sum of all natural numbers from \`1\` up to \`n\` inclusive:

\`\`\`
Sum = 1 + 2 + 3 + ... + n
\`\`\`

You must solve this iteratively using a loop accumulator.`,
        examples: [
          { input: 'n = 5', output: '15', explanation: '1 + 2 + 3 + 4 + 5 = 15' },
          { input: 'n = 10', output: '55', explanation: 'Sum of numbers from 1 to 10 is 55.' },
          { input: 'n = 1', output: '1', explanation: 'Sum of 1 is 1.' },
        ],
        constraints: ['1 <= n <= 10^5'],
        signatures: {
          C: 'long long sumOfNaturalNumbers(int n)',
          'C++': 'long long sumOfNaturalNumbers(int n)',
          Java: 'public long sumOfNaturalNumbers(int n)',
          Python: 'def sumOfNaturalNumbers(self, n: int) -> int:',
          JavaScript: 'function sumOfNaturalNumbers(n)',
        },
        starterCodes: {
          C: `#include <stdio.h>\n\nlong long sumOfNaturalNumbers(int n) {\n    // Implement your for loop accumulator below\n    return 0;\n}`,
          'C++': `#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    long long sumOfNaturalNumbers(int n) {\n        // Implement your for loop accumulator below\n        return 0;\n    }\n};`,
          Java: `class Solution {\n    public long sumOfNaturalNumbers(int n) {\n        // Implement your for loop accumulator below\n        return 0;\n    }\n}`,
          Python: `class Solution:\n    def sumOfNaturalNumbers(self, n: int) -> int:\n        # Implement your for loop accumulator below\n        pass`,
          JavaScript: `function sumOfNaturalNumbers(n) {\n  // Implement your for loop accumulator below\n  return 0;\n}`,
        },
        testCases: [
          { id: 'tc_1', input: 'n = 5', expectedOutput: '15', isHidden: false },
          { id: 'tc_2', input: 'n = 10', expectedOutput: '55', isHidden: false },
          { id: 'tc_3', input: 'n = 100', expectedOutput: '5050', isHidden: true },
          { id: 'tc_4', input: 'n = 1000', expectedOutput: '500500', isHidden: true },
        ],
        hints: ['Initialize a 64-bit sum accumulator to 0.', 'Iterate with for (int i = 1; i <= n; i++) and add i to sum.'],
      },
    };
  }

  // 6. While Loop / Condition-based Iteration / Digit Extraction
  if (t.includes('while loop') || t.includes('while') || t.includes('do while') || t.includes('digits') || t.includes('reverse number') || t.includes('collatz')) {
    return {
      category: 'LOOP_WHILE',
      canonicalConcept: 'Condition-Based Iteration using While Loops',
      conceptSummary: 'Iterating until a dynamic condition is met (e.g. repeatedly processing digits of an integer with n > 0, Collatz sequence, counting steps).',
      requiredConstructs: ['while (condition)', 'state progression inside loop (n /= 10 or similar)'],
      forbiddenConstructs: ['binary search', 'maximum subarray', 'graph bfs', 'vector<int> target search'],
      promptInstruction: `The problem MUST test condition-based iteration using a WHILE LOOP (e.g. reversing digits of a number, sum of digits until single digit, counting division steps, Collatz sequence).
The input MUST be a scalar integer.
DO NOT generate array or search problems.`,
      inputDescription: 'A scalar integer n to process iteratively.',
      outputDescription: 'Processed integer result (e.g. reversed digits, digit sum, steps).',
      sampleProblem: {
        title: 'Reverse Digits of an Integer using While Loop',
        funcName: 'reverseIntegerDigits',
        description: `### Problem Description
Given a non-negative integer \`n\`, write a function using a **while loop** to reverse its digits and return the resulting integer.

For example, if \`n = 1234\`, reversing its digits gives \`4321\`.
If the reversed number has leading zeros (e.g. \`1200\` -> \`0021\`), the integer value should be \`21\`. If \`n = 0\`, return \`0\`.`,
        examples: [
          { input: 'n = 1234', output: '4321', explanation: 'Digits reversed: 1234 -> 4321.' },
          { input: 'n = 9870', output: '789', explanation: '9870 reversed is 0789, which is 789.' },
          { input: 'n = 5', output: '5', explanation: 'Single digit reverses to itself.' },
        ],
        constraints: ['0 <= n <= 2 * 10^9'],
        signatures: {
          C: 'long long reverseIntegerDigits(long long n)',
          'C++': 'long long reverseIntegerDigits(long long n)',
          Java: 'public long reverseIntegerDigits(long n)',
          Python: 'def reverseIntegerDigits(self, n: int) -> int:',
          JavaScript: 'function reverseIntegerDigits(n)',
        },
        starterCodes: {
          C: `#include <stdio.h>\n\nlong long reverseIntegerDigits(long long n) {\n    // Implement using while (n > 0)\n    return 0;\n}`,
          'C++': `#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    long long reverseIntegerDigits(long long n) {\n        // Implement using while (n > 0)\n        return 0;\n    }\n};`,
          Java: `class Solution {\n    public long reverseIntegerDigits(long n) {\n        // Implement using while (n > 0)\n        return 0;\n    }\n}`,
          Python: `class Solution:\n    def reverseIntegerDigits(self, n: int) -> int:\n        # Implement using while loop\n        pass`,
          JavaScript: `function reverseIntegerDigits(n) {\n  // Implement using while loop\n  return 0;\n}`,
        },
        testCases: [
          { id: 'tc_1', input: 'n = 1234', expectedOutput: '4321', isHidden: false },
          { id: 'tc_2', input: 'n = 9870', expectedOutput: '789', isHidden: false },
          { id: 'tc_3', input: 'n = 0', expectedOutput: '0', isHidden: true },
          { id: 'tc_4', input: 'n = 1000000003', expectedOutput: '3000000001', isHidden: true },
        ],
        hints: ['Extract the last digit using digit = n % 10.', 'Append to reversed number using rev = rev * 10 + digit.', 'Divide n by 10 (n = n / 10) inside the while (n > 0) loop.'],
      },
    };
  }

  // 7. Pointers & Memory Management (C / C++)
  if (t.includes('pointer') || t.includes('memory management') || t.includes('dynamic memory') || t.includes('malloc') || t.includes('dereference')) {
    return {
      category: 'POINTERS_MEMORY',
      canonicalConcept: 'Pointers and Memory Manipulation',
      conceptSummary: 'Manipulating addresses, dereferencing pointers, in-place memory swaps, and managing dynamic allocations.',
      requiredConstructs: ['pointers (*, &)', 'dereferencing', 'pointer arithmetic or swap'],
      forbiddenConstructs: ['pure value search without pointer semantics'],
      promptInstruction: `The problem MUST test pointers, address passing, dereferencing, or memory manipulation (e.g. swapping values via pointer references, reversing a buffer in place with pointers, or dynamic allocation). In C/C++, function parameters MUST take pointers (e.g. int* a, int* b).`,
      inputDescription: 'Pointers to integer variables or memory buffers.',
      outputDescription: 'Mutated values at pointer destinations or allocated result.',
      sampleProblem: {
        title: 'Swap Two Integer Values Using Pointers',
        funcName: 'swapByPointers',
        description: `### Problem Description
Given pointers to two integer variables \`a\` and \`b\`, write a function to swap the values stored in the two memory locations using pointer dereferencing.

After calling the function, the memory location pointed to by \`a\` should hold the original value of \`b\`, and the memory location pointed to by \`b\` should hold the original value of \`a\`.`,
        examples: [
          { input: '*a = 5, *b = 10', output: '*a = 10, *b = 5', explanation: 'The memory locations were swapped in place.' },
          { input: '*a = -1, *b = 99', output: '*a = 99, *b = -1', explanation: 'Swapped in place.' },
        ],
        constraints: ['-10^9 <= *a, *b <= 10^9'],
        signatures: {
          C: 'void swapByPointers(int* a, int* b)',
          'C++': 'void swapByPointers(int* a, int* b)',
          Java: 'public int[] swapByPointers(int a, int b)',
          Python: 'def swapByPointers(self, a: int, b: int) -> Tuple[int, int]:',
          JavaScript: 'function swapByPointers(a, b)',
        },
        starterCodes: {
          C: `#include <stdio.h>\n\nvoid swapByPointers(int* a, int* b) {\n    // Dereference pointers to swap values in place\n}`,
          'C++': `#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void swapByPointers(int* a, int* b) {\n        // Dereference pointers to swap values in place\n    }\n};`,
          Java: `class Solution {\n    public int[] swapByPointers(int a, int b) {\n        return new int[]{b, a};\n    }\n}`,
          Python: `class Solution:\n    def swapByPointers(self, a: int, b: int):\n        return (b, a)`,
          JavaScript: `function swapByPointers(a, b) {\n  return [b, a];\n}`,
        },
        testCases: [
          { id: 'tc_1', input: '*a = 5, *b = 10', expectedOutput: '*a = 10, *b = 5', isHidden: false },
          { id: 'tc_2', input: '*a = -7, *b = 42', expectedOutput: '*a = 42, *b = -7', isHidden: true },
        ],
        hints: ['Store the dereferenced value *a in a temporary variable.', 'Assign *b to *a.', 'Assign the temporary variable to *b.'],
      },
    };
  }

  // 8. Binary Search
  if (t.includes('binary search') || t.includes('bsearch') || t.includes('lower bound') || t.includes('upper bound') || t.includes('search in rotated')) {
    return {
      category: 'BINARY_SEARCH',
      canonicalConcept: 'Binary Search Algorithm (O(log N))',
      conceptSummary: 'Searching a sorted array or monotonic answer space in logarithmic time by repeatedly halving the search interval.',
      requiredConstructs: ['sorted array or monotonic search space', 'left <= right halving interval', 'O(log N) complexity'],
      forbiddenConstructs: ['O(N) linear scan', 'if-else without search interval', 'unrelated graphs'],
      promptInstruction: `The problem MUST genuinely test Binary Search with O(log N) time complexity on a sorted array or monotonic condition. The expected solution must maintain left, right, and mid pointers.`,
      inputDescription: 'A sorted array of integers nums and a target integer.',
      outputDescription: 'Integer index of target or boundary position, or -1 if not present.',
      sampleProblem: {
        title: 'Binary Search Target in Sorted Array',
        funcName: 'search',
        description: `### Problem Description
Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`.

If \`target\` exists, return its index. Otherwise, return \`-1\`.

You must write an algorithm with **\`O(log n)\`** runtime complexity.`,
        examples: [
          { input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4.' },
          { input: 'nums = [-1, 0, 3, 5, 9, 12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1.' },
        ],
        constraints: ['1 <= nums.length <= 10^5', 'nums is sorted in ascending order', '-10^4 < nums[i], target < 10^4'],
        signatures: {
          C: 'int search(int* nums, int numsSize, int target)',
          'C++': 'int search(vector<int>& nums, int target)',
          Java: 'public int search(int[] nums, int target)',
          Python: 'def search(self, nums: List[int], target: int) -> int:',
          JavaScript: 'function search(nums, target)',
        },
        starterCodes: {
          C: `#include <stdio.h>\n\nint search(int* nums, int numsSize, int target) {\n    // Implement binary search with left and right bounds in O(log N)\n    return -1;\n}`,
          'C++': `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Implement binary search with left and right bounds in O(log N)\n        return -1;\n    }\n};`,
          Java: `class Solution {\n    public int search(int[] nums, int target) {\n        // Implement binary search with left and right bounds in O(log N)\n        return -1;\n    }\n}`,
          Python: `from typing import List\n\nclass Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        # Implement binary search in O(log N)\n        pass`,
          JavaScript: `function search(nums, target) {\n  // Implement binary search in O(log N)\n  return -1;\n}`,
        },
        testCases: [
          { id: 'tc_1', input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9', expectedOutput: '4', isHidden: false },
          { id: 'tc_2', input: 'nums = [-1, 0, 3, 5, 9, 12], target = 2', expectedOutput: '-1', isHidden: false },
          { id: 'tc_3', input: 'nums = [5], target = 5', expectedOutput: '0', isHidden: true },
          { id: 'tc_4', input: 'nums = [1, 3, 5, 7, 9], target = 1', expectedOutput: '0', isHidden: true },
        ],
        hints: ['Initialize left = 0, right = nums.length - 1.', 'Calculate mid = left + (right - left) / 2 to avoid integer overflow.', 'Adjust left or right based on whether nums[mid] is smaller or greater than target.'],
      },
    };
  }

  // 9. Two Pointers
  if (t.includes('two pointer') || t.includes('two pointers')) {
    return {
      category: 'TWO_POINTERS',
      canonicalConcept: 'Two Pointers Technique',
      conceptSummary: 'Using two index pointers converging from both ends or moving at different speeds across an array.',
      requiredConstructs: ['left and right pointers or slow and fast pointers'],
      forbiddenConstructs: ['binary search on answer', 'graph algorithms'],
      promptInstruction: `The problem MUST test the Two Pointers technique (e.g. checking pair sum in sorted array, palindrome verification, trapping water, moving zeroes).`,
      inputDescription: 'Array of elements or string.',
      outputDescription: 'Indices, boolean, or array result.',
      sampleProblem: {
        title: 'Two Sum II - Input Array Is Sorted',
        funcName: 'twoSumSorted',
        description: `### Problem Description
Given a **1-indexed** array of integers \`numbers\` that is already **sorted in non-decreasing order**, find two numbers such that they add up to a specific \`target\` number.

Return the indices of the two numbers, \`[index1, index2]\`, as an integer array of length 2, where \`1 <= index1 < index2 <= numbers.length\`.

Your solution must use **O(1) extra space** using the **Two Pointers** technique.`,
        examples: [
          { input: 'numbers = [2, 7, 11, 15], target = 9', output: '[1, 2]', explanation: 'The sum of 2 and 7 is 9. Therefore index1 = 1, index2 = 2.' },
          { input: 'numbers = [2, 3, 4], target = 6', output: '[1, 3]', explanation: '2 + 4 = 6. index1 = 1, index2 = 3.' },
        ],
        constraints: ['2 <= numbers.length <= 3 * 10^4', 'numbers is sorted in non-decreasing order'],
        signatures: {
          C: 'int* twoSumSorted(int* numbers, int numbersSize, int target, int* returnSize)',
          'C++': 'vector<int> twoSumSorted(vector<int>& numbers, int target)',
          Java: 'public int[] twoSumSorted(int[] numbers, int target)',
          Python: 'def twoSumSorted(self, numbers: List[int], target: int) -> List[int]:',
          JavaScript: 'function twoSumSorted(numbers, target)',
        },
        starterCodes: {
          C: `#include <stdio.h>\n#include <stdlib.h>\n\nint* twoSumSorted(int* numbers, int numbersSize, int target, int* returnSize) {\n    // Implement using two pointers (left and right)\n    return NULL;\n}`,
          'C++': `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSumSorted(vector<int>& numbers, int target) {\n        // Implement using two pointers (left and right)\n        return {};\n    }\n};`,
          Java: `class Solution {\n    public int[] twoSumSorted(int[] numbers, int target) {\n        // Implement using two pointers (left and right)\n        return new int[2];\n    }\n}`,
          Python: `from typing import List\n\nclass Solution:\n    def twoSumSorted(self, numbers: List[int], target: int) -> List[int]:\n        # Implement using two pointers\n        pass`,
          JavaScript: `function twoSumSorted(numbers, target) {\n  // Implement using two pointers\n  return [];\n}`,
        },
        testCases: [
          { id: 'tc_1', input: 'numbers = [2, 7, 11, 15], target = 9', expectedOutput: '[1, 2]', isHidden: false },
          { id: 'tc_2', input: 'numbers = [2, 3, 4], target = 6', expectedOutput: '[1, 3]', isHidden: false },
          { id: 'tc_3', input: 'numbers = [-1, 0], target = -1', expectedOutput: '[1, 2]', isHidden: true },
        ],
        hints: ['Place left at index 0 and right at index numbers.length - 1.', 'If numbers[left] + numbers[right] == target, return {left + 1, right + 1}.', 'If sum < target, increment left; if sum > target, decrement right.'],
      },
    };
  }

  // 10. Dynamic Programming
  if (t.includes('dynamic programming') || t.includes('dp') || t.includes('memoization') || t.includes('tabulation') || t.includes('knapsack') || t.includes('coin change')) {
    return {
      category: 'DYNAMIC_PROGRAMMING',
      canonicalConcept: 'Dynamic Programming & State Transitions',
      conceptSummary: 'Breaking a complex optimization problem into overlapping subproblems with optimal substructure.',
      requiredConstructs: ['DP state definition', 'Transition relation', 'Memoization or Tabulation array'],
      forbiddenConstructs: ['brute force exponential recursion without memoization'],
      promptInstruction: `The problem MUST test Dynamic Programming (state representation and transition recurrence).`,
      inputDescription: 'Problem constraints and array/values.',
      outputDescription: 'Optimal value or count of ways.',
      sampleProblem: {
        title: 'Climbing Stairs DP Combinations',
        funcName: 'climbStairs',
        description: `### Problem Description
You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?

Solve this using **Dynamic Programming** state transitions: \`dp[i] = dp[i-1] + dp[i-2]\`.`,
        examples: [
          { input: 'n = 2', output: '2', explanation: '1. 1 step + 1 step\n2. 2 steps' },
          { input: 'n = 3', output: '3', explanation: '1. 1+1+1\n2. 1+2\n3. 2+1' },
        ],
        constraints: ['1 <= n <= 45'],
        signatures: {
          C: 'int climbStairs(int n)',
          'C++': 'int climbStairs(int n)',
          Java: 'public int climbStairs(int n)',
          Python: 'def climbStairs(self, n: int) -> int:',
          JavaScript: 'function climbStairs(n)',
        },
        starterCodes: {
          C: `#include <stdio.h>\n\nint climbStairs(int n) {\n    // Implement DP state transition\n    return 0;\n}`,
          'C++': `#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    int climbStairs(int n) {\n        // Implement DP state transition\n        return 0;\n    }\n};`,
          Java: `class Solution {\n    public int climbStairs(int n) {\n        // Implement DP state transition\n        return 0;\n    }\n}`,
          Python: `class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Implement DP state transition\n        pass`,
          JavaScript: `function climbStairs(n) {\n  // Implement DP state transition\n  return 0;\n}`,
        },
        testCases: [
          { id: 'tc_1', input: 'n = 2', expectedOutput: '2', isHidden: false },
          { id: 'tc_2', input: 'n = 3', expectedOutput: '3', isHidden: false },
          { id: 'tc_3', input: 'n = 5', expectedOutput: '8', isHidden: true },
        ],
        hints: ['Base cases: dp[1] = 1, dp[2] = 2.', 'For i from 3 to n: dp[i] = dp[i-1] + dp[i-2].'],
      },
    };
  }

  // 11. Strings
  if (t.includes('string') || t.includes('anagram') || t.includes('palindrome') || t.includes('vowel')) {
    return {
      category: 'STRINGS',
      canonicalConcept: 'String Manipulation and Character Processing',
      conceptSummary: 'Traversing, mutating, matching, or validating character sequences and substrings.',
      requiredConstructs: ['string traversal', 'character analysis'],
      forbiddenConstructs: ['unrelated tree or graph algorithms'],
      promptInstruction: `The problem MUST test String Manipulation (e.g. character counts, reversing, anagram checking, palindrome validation). The input must be string(s).`,
      inputDescription: 'String parameter(s) s.',
      outputDescription: 'Processed string, boolean check, or character count.',
      sampleProblem: {
        title: 'Valid Palindrome String Verification',
        funcName: 'isPalindrome',
        description: `### Problem Description
A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
        examples: [
          { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
          { input: 's = "race a car"', output: 'false', explanation: '"raceacar" is not a palindrome.' },
        ],
        constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters'],
        signatures: {
          C: 'bool isPalindrome(char* s)',
          'C++': 'bool isPalindrome(string s)',
          Java: 'public boolean isPalindrome(String s)',
          Python: 'def isPalindrome(self, s: str) -> bool:',
          JavaScript: 'function isPalindrome(s)',
        },
        starterCodes: {
          C: `#include <stdbool.h>\n#include <string.h>\n#include <ctype.h>\n\nbool isPalindrome(char* s) {\n    // Implement palindrome verification\n    return false;\n}`,
          'C++': `#include <iostream>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Implement palindrome verification\n        return false;\n    }\n};`,
          Java: `class Solution {\n    public boolean isPalindrome(String s) {\n        // Implement palindrome verification\n        return false;\n    }\n}`,
          Python: `class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        # Implement palindrome verification\n        pass`,
          JavaScript: `function isPalindrome(s) {\n  // Implement palindrome verification\n  return false;\n}`,
        },
        testCases: [
          { id: 'tc_1', input: 's = "A man, a plan, a canal: Panama"', expectedOutput: 'true', isHidden: false },
          { id: 'tc_2', input: 's = "race a car"', expectedOutput: 'false', isHidden: false },
          { id: 'tc_3', input: 's = " "', expectedOutput: 'true', isHidden: true },
        ],
        hints: ['Use two pointers left and right, skipping non-alphanumeric characters.', 'Compare characters case-insensitively.'],
      },
    };
  }

  // 12. Arrays (Standard Array DSA)
  if (t.includes('array') || t.includes('arrays') || t.includes('traversal') || t.includes('frequency') || t.includes('subarray')) {
    return {
      category: 'ARRAYS',
      canonicalConcept: 'Array Traversal, Frequency, and Transformation',
      conceptSummary: 'Manipulating linear contiguous memory structures, finding extrema, counting frequencies, or performing linear transformations.',
      requiredConstructs: ['array indexing', 'iteration over elements'],
      forbiddenConstructs: ['complex graphs or trees unless requested'],
      promptInstruction: `The problem MUST test Array manipulation (e.g. finding max/min elements, running sums, element frequencies, removing duplicates, or rotating elements).`,
      inputDescription: 'Array of integers nums.',
      outputDescription: 'Transformed array, integer count, or extreme element.',
      sampleProblem: {
        title: 'Find Maximum and Minimum in Array',
        funcName: 'findMinMax',
        description: `### Problem Description
Given an integer array \`nums\`, find the **maximum** and **minimum** element in the array.

Return an array \`[minVal, maxVal]\` containing the minimum value followed by the maximum value.`,
        examples: [
          { input: 'nums = [3, 5, 1, 8, 2]', output: '[1, 8]', explanation: 'The smallest number is 1 and the largest is 8.' },
          { input: 'nums = [7]', output: '[7, 7]', explanation: 'With a single element, both the minimum and maximum are 7.' },
        ],
        constraints: ['1 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
        signatures: {
          C: 'int* findMinMax(int* nums, int numsSize, int* returnSize)',
          'C++': 'vector<int> findMinMax(vector<int>& nums)',
          Java: 'public int[] findMinMax(int[] nums)',
          Python: 'def findMinMax(self, nums: List[int]) -> List[int]:',
          JavaScript: 'function findMinMax(nums)',
        },
        starterCodes: {
          C: `#include <stdio.h>\n#include <stdlib.h>\n\nint* findMinMax(int* nums, int numsSize, int* returnSize) {\n    // Implement min/max finding in array\n    return NULL;\n}`,
          'C++': `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> findMinMax(vector<int>& nums) {\n        // Implement min/max finding in array\n        return {};\n    }\n};`,
          Java: `class Solution {\n    public int[] findMinMax(int[] nums) {\n        // Implement min/max finding in array\n        return new int[2];\n    }\n}`,
          Python: `from typing import List\n\nclass Solution:\n    def findMinMax(self, nums: List[int]) -> List[int]:\n        # Implement min/max finding in array\n        pass`,
          JavaScript: `function findMinMax(nums) {\n  // Implement min/max finding in array\n  return [0, 0];\n}`,
        },
        testCases: [
          { id: 'tc_1', input: 'nums = [3, 5, 1, 8, 2]', expectedOutput: '[1, 8]', isHidden: false },
          { id: 'tc_2', input: 'nums = [7]', expectedOutput: '[7, 7]', isHidden: false },
          { id: 'tc_3', input: 'nums = [-10, -50, -2, -90]', expectedOutput: '[-90, -2]', isHidden: true },
        ],
        hints: ['Initialize minVal and maxVal to nums[0].', 'Iterate through the array updating minVal and maxVal on each element.'],
      },
    };
  }

  // 13. Generic Domain / Custom Topic Default
  const formattedTitle = topic.trim() || 'Programming Challenge';
  const sanitizedFuncName = 'solve' + (topic.replace(/[^a-zA-Z0-9]/g, '') || 'Challenge');

  return {
    category: 'GENERIC_DOMAIN',
    canonicalConcept: topic.trim() || 'Custom Programming Topic',
    conceptSummary: `Original problem specifically grounded in the domain and logic of ${topic}.`,
    requiredConstructs: [topic],
    forbiddenConstructs: [],
    promptInstruction: `The problem MUST be specifically tailored to the topic "${topic}" and subject "${subject}". The problem statement, test cases, and solution requirements must directly exercise "${topic}". Do NOT substitute a generic array search template.`,
    inputDescription: `Input data appropriate for ${topic}.`,
    outputDescription: `Computed result conforming to ${topic}.`,
    sampleProblem: {
      title: `${formattedTitle}: Domain Challenge`,
      funcName: sanitizedFuncName,
      description: `### Problem Description\nYou are given a problem centered on **${topic}** under the subject of **${subject}**.\n\nYour task is to implement an optimal solution satisfying all requirements and edge cases for **${topic}**.`,
      examples: [
        {
          input: 'standard input parameters',
          output: 'expected result',
          explanation: `Applies core principles of ${topic} to compute the result.`,
        },
      ],
      constraints: ['Standard memory and time execution constraints apply.'],
      signatures: {
        C: `int ${sanitizedFuncName}(int val)`,
        'C++': `int ${sanitizedFuncName}(int val)`,
        Java: `public int ${sanitizedFuncName}(int val)`,
        Python: `def ${sanitizedFuncName}(self, val: int) -> int:`,
        JavaScript: `function ${sanitizedFuncName}(val)`,
      },
      starterCodes: {
        C: `#include <stdio.h>\n\nint ${sanitizedFuncName}(int val) {\n    // Implement your solution for ${topic} below\n    return 0;\n}`,
        'C++': `#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    int ${sanitizedFuncName}(int val) {\n        // Implement your solution for ${topic} below\n        return 0;\n    }\n};`,
        Java: `class Solution {\n    public int ${sanitizedFuncName}(int val) {\n        // Implement your solution for ${topic} below\n        return 0;\n    }\n}`,
        Python: `class Solution:\n    def ${sanitizedFuncName}(self, val: int) -> int:\n        # Implement your solution for ${topic} below\n        pass`,
        JavaScript: `function ${sanitizedFuncName}(val) {\n  // Implement your solution for ${topic} below\n  return 0;\n}`,
      },
      testCases: [
        { id: 'tc_1', input: 'sample parameter', expectedOutput: 'sample output', isHidden: false },
      ],
      hints: [`Analyze the core logic required for ${topic}.`],
    },
  };
}

/**
 * Deep semantic validator that checks if a problem genuinely tests the requested topic
 */
export function validateProblemSemantics(
  problem: any,
  topic: string,
  subject: string,
  difficulty: string
): { valid: boolean; reason?: string; violations?: string[] } {
  const violations: string[] = [];
  const contract = resolveTopicConcept(topic, subject);

  const title = (problem?.title || '').toLowerCase();
  const desc = (problem?.description || problem?.problem_statement || '').toLowerCase();
  const tags = (Array.isArray(problem?.tags) ? problem.tags.join(' ') : '').toLowerCase();
  const hints = (Array.isArray(problem?.hints) ? problem.hints.join(' ') : '').toLowerCase();
  const constraints = (Array.isArray(problem?.constraints) ? problem.constraints.join(' ') : '').toLowerCase();
  const starter = JSON.stringify(problem?.starterCode || problem?.starter_templates || {}).toLowerCase();
  const signatures = JSON.stringify(problem?.functionSignature || {}).toLowerCase();
  const allText = `${title} ${desc} ${tags} ${hints} ${constraints} ${starter} ${signatures}`;

  // 1. Basic integrity
  if (!problem?.title || (!problem?.description && !problem?.problem_statement)) {
    return { valid: false, reason: 'Problem missing essential title or description.' };
  }
  if (!problem?.examples || !Array.isArray(problem.examples) || problem.examples.length === 0) {
    return { valid: false, reason: 'Problem missing valid examples.' };
  }

  // 2. Category-Specific Semantic Matching & Anti-Contamination Rules
  switch (contract.category) {
    case 'CONTROL_FLOW_ELSE_IF':
    case 'CONTROL_FLOW_IF': {
      // Forbidden: generic array search or vector<int> nums with target
      const isArraySearchContaminated =
        (starter.includes('vector<int>& nums') && starter.includes('int target')) ||
        (signatures.includes('vector<int>') && signatures.includes('target')) ||
        (desc.includes('search for an element in an array') || desc.includes('find an element in an array') || desc.includes('binary search'));

      if (isArraySearchContaminated) {
        violations.push(
          `Topic "${topic}" requires conditional branching (if/else if/else), but generated problem is an array target search.`
        );
      }

      // Check if problem contains conditional domain concepts (grade, tax, bracket, classify, condition, age, score, marks, threshold, range, if, else)
      const hasConditionalLogic =
        allText.includes('grade') ||
        allText.includes('classify') ||
        allText.includes('bracket') ||
        allText.includes('tax') ||
        allText.includes('threshold') ||
        allText.includes('marks') ||
        allText.includes('score') ||
        allText.includes('range') ||
        allText.includes('condition') ||
        allText.includes('eligib') ||
        allText.includes('tier') ||
        allText.includes('else if') ||
        allText.includes('if') ||
        allText.includes('branch');

      if (!hasConditionalLogic) {
        violations.push(
          `Topic "${topic}" requires multi-way conditional evaluation, but the problem does not describe conditional classification or branching.`
        );
      }
      break;
    }

    case 'PARITY_MODULO': {
      const hasParityLogic =
        allText.includes('even') ||
        allText.includes('odd') ||
        allText.includes('parity') ||
        allText.includes('modulo') ||
        allText.includes('divisib');

      if (!hasParityLogic) {
        violations.push(`Topic "${topic}" requires even/odd parity or divisibility testing.`);
      }

      if (allText.includes('binary search on answer') || allText.includes('sliding window of length k')) {
        violations.push(`Parity topic should not require advanced subarray optimization or sliding window.`);
      }
      break;
    }

    case 'LOOP_FOR':
    case 'LOOP_WHILE': {
      const isSearchContaminated =
        (starter.includes('vector<int>& nums') && starter.includes('int target') && desc.includes('search')) ||
        desc.includes('binary search in rotated sorted array');

      if (isSearchContaminated) {
        violations.push(`Topic "${topic}" requires loop iteration, not a generic array search.`);
      }
      break;
    }

    case 'POINTERS_MEMORY': {
      const hasPointersInC =
        starter.includes('*') ||
        signatures.includes('*') ||
        allText.includes('pointer') ||
        allText.includes('memory') ||
        allText.includes('dereference') ||
        allText.includes('swap');

      if (!hasPointersInC) {
        violations.push(`Topic "${topic}" requires pointer manipulation or address dereferencing.`);
      }
      break;
    }

    case 'BINARY_SEARCH': {
      const hasBinarySearchLogic =
        allText.includes('binary search') ||
        allText.includes('sorted') ||
        allText.includes('log n') ||
        allText.includes('o(log') ||
        allText.includes('log(') ||
        allText.includes('lower bound') ||
        allText.includes('upper bound') ||
        allText.includes('monotonic');

      if (!hasBinarySearchLogic) {
        violations.push(`Topic "Binary Search" must test logarithmic search in sorted space.`);
      }
      break;
    }

    case 'SQL': {
      const hasSqlDomain =
        allText.includes('table') ||
        allText.includes('select') ||
        allText.includes('where') ||
        allText.includes('from') ||
        allText.includes('join') ||
        allText.includes('query');

      if (!hasSqlDomain) {
        violations.push(`SQL topic must present a relational table schema and database query challenge.`);
      }
      break;
    }

    default:
      break;
  }

  if (violations.length > 0) {
    return {
      valid: false,
      reason: violations.join('; '),
      violations,
    };
  }

  return { valid: true };
}
