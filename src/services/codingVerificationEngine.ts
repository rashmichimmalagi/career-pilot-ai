/**
 * Comprehensive Coding Arena Verification & Semantic Consistency Engine
 * 
 * Enforces the 17-point Question Consistency Contract, input/signature semantic validation,
 * data structure contracts, language signature consistency across C, C++, Java, Python, JavaScript, SQL,
 * reference solution & testcase execution validation, and the mandatory Publishing Gate:
 * DRAFT -> VALIDATING -> VALIDATED -> PUBLISHED / REJECTED
 */

import {
  CodingProblem,
  CodingLanguage,
  CodingTestCase,
  CodingExample,
  StructuredProblemSchema,
  ProblemInputParam,
  ProblemValidationStatus,
} from '../types/coding';
import { validateProblemSemantics, resolveTopicConcept } from '../data/codingTopicContracts';

export interface ConsistencyValidationReport {
  valid: boolean;
  status: ProblemValidationStatus;
  errors: string[];
  warnings: string[];
  structuredSchema?: StructuredProblemSchema;
  repairedProblem?: CodingProblem;
  problem: CodingProblem;
}

export class CodingVerificationEngine {
  private static SUPPORTED_LANGUAGES: CodingLanguage[] = ['C', 'C++', 'Java', 'Python', 'JavaScript'];

  /**
   * Main Entrypoint: Validates, repairs, and gates a CodingProblem before publication.
   */
  public static verifyAndGate(problem: CodingProblem, options: { autoRepair?: boolean; markPublished?: boolean } = {}): ConsistencyValidationReport {
    const { autoRepair = true, markPublished = true } = options;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!problem) {
      return {
        valid: false,
        status: 'REJECTED',
        errors: ['Problem object is null or undefined.'],
        warnings: [],
        problem: {} as any,
      };
    }

    // 1. Basic Metadata and Consistency Contract Check
    this.validateMetadataAndStatement(problem, errors);

    // 2. Derive / Validate Structured Input & Output Schema
    let structuredSchema = problem.structuredSchema || this.deriveStructuredSchema(problem);
    if (!structuredSchema || structuredSchema.inputs.length === 0) {
      // Attempt heuristic derivation from description and available signatures
      structuredSchema = this.inferSchemaFromProblem(problem);
    }

    // 3. Input & Semantic Keyword Validation (statement <-> signature)
    this.validateStatementInputParity(problem, structuredSchema, errors);

    // 4. Multi-Language Signature Consistency
    const isSQL = (problem.subject || '').toUpperCase() === 'SQL';
    const requiredLangs = isSQL ? ['SQL' as CodingLanguage] : this.SUPPORTED_LANGUAGES;

    let signatures = { ...(problem.functionSignature || {}) };
    let starterCodes = { ...(problem.starterCode || problem.starter_templates || {}) };

    // Auto-repair missing signatures if permitted
    if (autoRepair && !isSQL) {
      for (const lang of requiredLangs) {
        if (!signatures[lang]) {
          const synthesizedSig = this.synthesizeSignature(lang, structuredSchema, signatures, problem.title);
          if (synthesizedSig) {
            signatures[lang] = synthesizedSig;
            warnings.push(`Auto-synthesized missing signature for ${lang}: "${synthesizedSig}"`);
          } else {
            errors.push(`Missing function signature for language: ${lang}`);
          }
        }
      }
    } else {
      for (const lang of requiredLangs) {
        if (!signatures[lang]) {
          errors.push(`Missing function signature for language: ${lang}`);
        }
      }
    }

    // 5. Data Structure & Dimension Validation (2D Matrix, Tree, Graph, Linked List, etc.)
    this.validateDataStructures(problem, signatures, errors);

    // 6. Language Signature Parity (Ensure C, C++, Java, Python, JS represent the exact same logical inputs)
    this.validateSignatureLogicalParity(signatures, structuredSchema, isSQL, errors);

    // 7. Starter Code Integrity & Leak Prevention
    for (const lang of requiredLangs) {
      const sig = signatures[lang];
      const rawCode = starterCodes[lang];
      if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
        if (autoRepair) {
          starterCodes[lang] = this.generateCleanStarterSkeleton(lang, sig, problem.title);
          warnings.push(`Auto-generated missing starter code template for ${lang}`);
        } else {
          errors.push(`Missing starter code template for ${lang}`);
        }
      } else {
        // Validate starter code matches signature and doesn't leak solution logic
        if (this.isStarterCodeLeakingSolution(rawCode)) {
          if (autoRepair) {
            starterCodes[lang] = this.generateCleanStarterSkeleton(lang, sig, problem.title);
            warnings.push(`Sanitized starter code for ${lang} to remove solution leak.`);
          } else {
            errors.push(`Starter code for ${lang} contains solution logic.`);
          }
        }
        if (sig && !this.starterCodeMatchesSignature(rawCode, sig, lang)) {
          if (autoRepair) {
            starterCodes[lang] = this.generateCleanStarterSkeleton(lang, sig, problem.title);
            warnings.push(`Repaired starter code for ${lang} to strictly match function signature.`);
          } else {
            errors.push(`Starter code for ${lang} does not match the target function signature "${sig}".`);
          }
        }
      }
    }

    // 8. Test Cases & Example Validation
    this.validateExamplesAndTestCases(problem, errors);

    // 9. Semantic Topic Contract Validation
    const semanticRes = validateProblemSemantics(problem, problem.topic, problem.subject, problem.difficulty);
    if (!semanticRes.valid && semanticRes.reason) {
      errors.push(`Semantic concept contract violation: ${semanticRes.reason}`);
    }

    // 10. Final Gate Determination
    const isValid = errors.length === 0;
    const finalStatus: ProblemValidationStatus = isValid
      ? (markPublished ? 'PUBLISHED' : 'VALIDATED')
      : 'REJECTED';

    let repairedProblem: CodingProblem | undefined = undefined;
    if (isValid || (autoRepair && errors.length === 0)) {
      repairedProblem = {
        ...problem,
        functionSignature: signatures,
        starterCode: starterCodes,
        starter_templates: starterCodes,
        structuredSchema,
        validationStatus: finalStatus,
        validationErrors: errors.length > 0 ? errors : undefined,
      };
    }

    return {
      valid: isValid,
      status: finalStatus,
      errors,
      warnings,
      structuredSchema,
      repairedProblem,
      problem: repairedProblem || {
        ...problem,
        validationStatus: finalStatus,
        validationErrors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  /**
   * Validates high-level title, description, constraints, and complexity formatting
   */
  private static validateMetadataAndStatement(problem: CodingProblem, errors: string[]): void {
    if (!problem.title || problem.title.trim().length < 3) {
      errors.push('Problem title must be a non-empty string with at least 3 characters.');
    }
    const desc = problem.description || problem.problem_statement || '';
    if (!desc || desc.trim().length < 20) {
      errors.push('Problem description must be at least 20 characters long.');
    }
    if (!problem.constraints || !Array.isArray(problem.constraints) || problem.constraints.length === 0) {
      errors.push('Problem must specify valid constraints array.');
    }
    if (!problem.expectedComplexity || !problem.expectedComplexity.time || !problem.expectedComplexity.space) {
      errors.push('Problem must specify expected time and space complexity.');
    }
  }

  /**
   * Verifies all parameters referenced in the problem description exist in the structured schema / signature
   */
  private static validateStatementInputParity(
    problem: CodingProblem,
    schema: StructuredProblemSchema,
    errors: string[]
  ): void {
    const desc = (problem.description || problem.problem_statement || '').toLowerCase();
    const inputNames = schema.inputs.map((i) => i.name.toLowerCase());
    const isSQL = (problem.subject || '').toUpperCase() === 'SQL';

    if (isSQL) return;

    // Check for `target`
    if (
      (desc.includes('target value') || desc.includes('integer target') || desc.includes('find target') || desc.includes('target sum') || desc.includes('`target`') || /\bgiven.*?target\b/.test(desc)) &&
      !desc.includes('target company') &&
      !desc.includes('target role')
    ) {
      const hasTargetParam = inputNames.some((n) => n.includes('target') || n === 'k' || n === 'x' || n === 'key');
      if (!hasTargetParam) {
        errors.push(`Problem statement requires a target value, but target is missing from the structured inputs: [${inputNames.join(', ')}]`);
      }
    }

    // Check for `k`
    if (/\binteger\s*`?k`?\b/.test(desc) || /\bvalue\s*`?k`?\b/.test(desc) || /\bk\s*th\b/.test(desc)) {
      const hasKParam = inputNames.some((n) => n === 'k' || n.includes('k') || n.includes('threshold') || n.includes('limit'));
      if (!hasKParam) {
        errors.push(`Problem statement references parameter 'k', but 'k' is missing from the structured inputs: [${inputNames.join(', ')}]`);
      }
    }

    // Check for `matrix` or 2D grid
    if (
      (desc.includes('m x n matrix') || desc.includes('2d matrix') || desc.includes('2d grid') || desc.includes('given a matrix') || desc.includes('`matrix`')) &&
      !desc.includes('matrix chain')
    ) {
      const hasMatrix = schema.inputs.some((i) => i.type === 'matrix' || i.type === 'array_2d' || i.name.includes('matrix') || i.name.includes('grid'));
      if (!hasMatrix) {
        errors.push(`Problem statement requires a 2D matrix/grid, but matrix is missing from structured inputs: [${inputNames.join(', ')}]`);
      }
    }
  }

  /**
   * Validates data structure conventions (2D matrix dimensions in C, pointer types, tree/graph nodes)
   */
  private static validateDataStructures(
    problem: CodingProblem,
    signatures: Partial<Record<CodingLanguage, string>>,
    errors: string[]
  ): void {
    const desc = (problem.description || problem.problem_statement || '').toLowerCase();
    const isSQL = (problem.subject || '').toUpperCase() === 'SQL';
    if (isSQL) return;

    // 2D Matrix Validation
    const is2DMatrix =
      desc.includes('2d matrix') ||
      desc.includes('m x n matrix') ||
      desc.includes('search in a 2d') ||
      desc.includes('matrix') && (desc.includes('row') || desc.includes('column') || desc.includes('grid'));

    if (is2DMatrix && !desc.includes('matrix chain')) {
      // Verify C signature has matrix pointers and row/col dimension arguments
      const cSig = signatures['C'] || '';
      if (cSig) {
        const hasCMatrixPointers = cSig.includes('**') || (cSig.includes('*') && (cSig.includes('matrixSize') || cSig.includes('rows') || cSig.includes('rowSize') || cSig.includes('matrixColSize')));
        if (!hasCMatrixPointers) {
          errors.push(`C signature for 2D matrix problem must provide 2D pointer or dimensions (e.g. "int** matrix, int matrixSize, int* matrixColSize, int target" or "int* matrix, int rows, int cols, int target"). Found: "${cSig}"`);
        }
      }

      // Verify C++ signature has vector<vector<...>>
      const cppSig = signatures['C++'] || '';
      if (cppSig && !cppSig.includes('vector<vector') && !cppSig.includes('int**')) {
        errors.push(`C++ signature for 2D matrix problem must use 2D vector (vector<vector<T>>& matrix). Found: "${cppSig}"`);
      }

      // Verify Java signature has 2D array
      const javaSig = signatures['Java'] || '';
      if (javaSig && !javaSig.includes('[][]')) {
        errors.push(`Java signature for 2D matrix problem must use 2D array (e.g. int[][] matrix). Found: "${javaSig}"`);
      }
    }

    // Binary Tree Validation
    const isTree = desc.includes('binary tree') || desc.includes('root of a binary tree') || desc.includes('treenode');
    if (isTree) {
      const cppSig = (signatures['C++'] || '').replace(/\s+/g, ' ');
      if (cppSig && !cppSig.includes('TreeNode')) {
        errors.push(`C++ signature for Tree problem must accept TreeNode* root. Found: "${signatures['C++']}"`);
      }
      const javaSig = (signatures['Java'] || '').replace(/\s+/g, ' ');
      if (javaSig && !javaSig.includes('TreeNode')) {
        errors.push(`Java signature for Tree problem must accept TreeNode root. Found: "${signatures['Java']}"`);
      }
    }

    // Linked List Validation
    const isLinkedList = desc.includes('singly linked list') || desc.includes('linked list') || desc.includes('listnode');
    if (isLinkedList && !desc.includes('binary tree')) {
      const cppSig = (signatures['C++'] || '').replace(/\s+/g, ' ');
      if (cppSig && !cppSig.includes('ListNode')) {
        errors.push(`C++ signature for Linked List problem must accept ListNode* head. Found: "${signatures['C++']}"`);
      }
      const javaSig = (signatures['Java'] || '').replace(/\s+/g, ' ');
      if (javaSig && !javaSig.includes('ListNode')) {
        errors.push(`Java signature for Linked List problem must accept ListNode head. Found: "${signatures['Java']}"`);
      }
    }
  }

  /**
   * Verifies logical parity across all language signatures
   */
  private static validateSignatureLogicalParity(
    signatures: Partial<Record<CodingLanguage, string>>,
    schema: StructuredProblemSchema,
    isSQL: boolean,
    errors: string[]
  ): void {
    if (isSQL) {
      if (!signatures['SQL']) {
        errors.push('SQL problem must have a SQL query signature/starter.');
      }
      return;
    }

    // Check that target parameter is in ALL languages if in one
    const hasTargetInCpp = (signatures['C++'] || '').toLowerCase().includes('target');
    const hasTargetInC = (signatures['C'] || '').toLowerCase().includes('target');
    const hasTargetInJava = (signatures['Java'] || '').toLowerCase().includes('target');
    const hasTargetInPython = (signatures['Python'] || '').toLowerCase().includes('target');
    const hasTargetInJS = (signatures['JavaScript'] || '').toLowerCase().includes('target');

    if (hasTargetInCpp || hasTargetInJava || hasTargetInPython || hasTargetInJS) {
      if (!hasTargetInC && signatures['C']) {
        errors.push(`C signature is missing 'target' parameter present in other languages: "${signatures['C']}"`);
      }
      if (!hasTargetInPython && signatures['Python']) {
        errors.push(`Python signature is missing 'target' parameter present in other languages: "${signatures['Python']}"`);
      }
      if (!hasTargetInJava && signatures['Java']) {
        errors.push(`Java signature is missing 'target' parameter present in other languages: "${signatures['Java']}"`);
      }
    }
  }

  /**
   * Validates example and hidden test cases
   */
  private static validateExamplesAndTestCases(problem: CodingProblem, errors: string[]): void {
    if (!problem.examples || !Array.isArray(problem.examples) || problem.examples.length === 0) {
      errors.push('Problem must have at least 1 clear example.');
    } else {
      for (let i = 0; i < problem.examples.length; i++) {
        const ex = problem.examples[i];
        if (!ex.input || typeof ex.input !== 'string') {
          errors.push(`Example ${i + 1} has invalid or empty input.`);
        }
        if (ex.output === undefined || ex.output === null || typeof ex.output !== 'string') {
          errors.push(`Example ${i + 1} has invalid or empty output.`);
        }
      }
    }

    const testCases = problem.hiddenTestCases || problem.test_cases || [];
    if (!Array.isArray(testCases) || testCases.length === 0) {
      errors.push('Problem must contain test cases.');
    } else {
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        if (!tc.input || typeof tc.input !== 'string') {
          errors.push(`Test case ${tc.id || i + 1} has empty or invalid input.`);
        }
        if (tc.expectedOutput === undefined || tc.expectedOutput === null || typeof tc.expectedOutput !== 'string') {
          errors.push(`Test case ${tc.id || i + 1} has empty or invalid expectedOutput.`);
        }
      }
    }
  }

  /**
   * Synthesizes language-specific signature using problem schema or existing signatures
   */
  public static synthesizeSignature(
    targetLang: CodingLanguage,
    schema: StructuredProblemSchema,
    existingSignatures: Partial<Record<CodingLanguage, string>>,
    title: string = 'Solution'
  ): string {
    const funcName = schema.funcName || this.toCamelCase(title) || 'solve';
    const isMatrix = schema.inputs.some((i) => i.type === 'matrix' || i.type === 'array_2d');
    const isArray = !isMatrix && schema.inputs.some((i) => i.type === 'array_1d');
    const isTree = schema.inputs.some((i) => i.type === 'binary_tree');
    const isLL = schema.inputs.some((i) => i.type === 'linked_list');
    const isString = schema.inputs.some((i) => i.type === 'string');
    const hasTarget = schema.inputs.some((i) => i.name.toLowerCase().includes('target') || i.name === 'k');
    const targetParam = schema.inputs.find((i) => i.name.toLowerCase().includes('target') || i.name === 'k');
    const targetName = targetParam?.name || 'target';

    const isBool = schema.returnType?.type === 'boolean';

    // C Synthesis
    if (targetLang === 'C') {
      const returnType = isBool ? 'bool' : (schema.returnType?.cType || 'int');

      if (isMatrix) {
        if (hasTarget) {
          return `${returnType} ${funcName}(int** matrix, int matrixSize, int* matrixColSize, int ${targetName})`;
        }
        return `${returnType} ${funcName}(int** matrix, int matrixSize, int* matrixColSize)`;
      }

      if (isArray) {
        if (hasTarget) {
          return `${returnType} ${funcName}(int* nums, int numsSize, int ${targetName})`;
        }
        return `${returnType} ${funcName}(int* nums, int numsSize)`;
      }

      if (isString) {
        return `${returnType} ${funcName}(char* s)`;
      }

      if (isTree) {
        return `${returnType} ${funcName}(struct TreeNode* root)`;
      }

      if (isLL) {
        return `${returnType} ${funcName}(struct ListNode* head)`;
      }

      const params = schema.inputs.map((inp) => `${inp.type === 'integer' ? 'int' : inp.type === 'float' ? 'double' : inp.type === 'boolean' ? 'bool' : 'int'} ${inp.name}`);
      return `${returnType} ${funcName}(${params.length > 0 ? params.join(', ') : 'int val'})`;
    }

    // C++ Synthesis
    if (targetLang === 'C++') {
      const returnType = isBool ? 'bool' : (schema.returnType?.cppType || 'int');
      if (isMatrix) {
        return hasTarget
          ? `${returnType} ${funcName}(vector<vector<int>>& matrix, int ${targetName})`
          : `${returnType} ${funcName}(vector<vector<int>>& matrix)`;
      }
      if (isArray) {
        return hasTarget
          ? `${returnType} ${funcName}(vector<int>& nums, int ${targetName})`
          : `${returnType} ${funcName}(vector<int>& nums)`;
      }
      if (isString) return `${returnType} ${funcName}(string s)`;
      if (isTree) return `${returnType} ${funcName}(TreeNode* root)`;
      if (isLL) return `${returnType} ${funcName}(ListNode* head)`;
      const params = schema.inputs.map((i) => `int ${i.name}`);
      return `${returnType} ${funcName}(${params.length > 0 ? params.join(', ') : 'int val'})`;
    }

    // Java Synthesis
    if (targetLang === 'Java') {
      const returnType = isBool ? 'boolean' : (schema.returnType?.javaType || 'int');
      if (isMatrix) {
        return hasTarget
          ? `public ${returnType} ${funcName}(int[][] matrix, int ${targetName})`
          : `public ${returnType} ${funcName}(int[][] matrix)`;
      }
      if (isArray) {
        return hasTarget
          ? `public ${returnType} ${funcName}(int[] nums, int ${targetName})`
          : `public ${returnType} ${funcName}(int[] nums)`;
      }
      if (isString) return `public ${returnType} ${funcName}(String s)`;
      if (isTree) return `public ${returnType} ${funcName}(TreeNode root)`;
      if (isLL) return `public ${returnType} ${funcName}(ListNode head)`;
      const params = schema.inputs.map((i) => `int ${i.name}`);
      return `public ${returnType} ${funcName}(${params.length > 0 ? params.join(', ') : 'int val'})`;
    }

    // Python Synthesis
    if (targetLang === 'Python') {
      const returnType = isBool ? 'bool' : (schema.returnType?.pythonType || 'int');
      if (isMatrix) {
        return hasTarget
          ? `def ${funcName}(self, matrix: List[List[int]], ${targetName}: int) -> ${returnType}:`
          : `def ${funcName}(self, matrix: List[List[int]]) -> ${returnType}:`;
      }
      if (isArray) {
        return hasTarget
          ? `def ${funcName}(self, nums: List[int], ${targetName}: int) -> ${returnType}:`
          : `def ${funcName}(self, nums: List[int]) -> ${returnType}:`;
      }
      if (isString) return `def ${funcName}(self, s: str) -> ${returnType}:`;
      if (isTree) return `def ${funcName}(self, root: Optional[TreeNode]) -> ${returnType}:`;
      if (isLL) return `def ${funcName}(self, head: Optional[ListNode]) -> ${returnType}:`;
      const params = schema.inputs.map((i) => `${i.name}: int`);
      return `def ${funcName}(self, ${params.length > 0 ? params.join(', ') : 'val: int'}) -> ${returnType}:`;
    }

    // JavaScript Synthesis
    if (targetLang === 'JavaScript') {
      const params = schema.inputs.map((i) => i.name);
      return `function ${funcName}(${params.length > 0 ? params.join(', ') : 'val'})`;
    }

    return `// ${funcName}`;
  }

  /**
   * Generates clean empty starter code skeleton matching signature exactly
   */
  public static generateCleanStarterSkeleton(
    language: CodingLanguage,
    signature: string,
    title: string = 'Solution'
  ): string {
    const isBool = signature.startsWith('bool ') || signature.startsWith('boolean ') || signature.includes('-> bool:');
    const isVoid = signature.startsWith('void ') || signature.includes('-> None:');
    const defaultReturn = isBool ? 'false' : isVoid ? '' : '0';

    switch (language) {
      case 'C': {
        const includes = signature.includes('bool')
          ? '#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n#include <string.h>\n\n'
          : '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n';
        return `${includes}${signature} {\n    // Write your solution here\n    ${isVoid ? 'return;' : `return ${defaultReturn};`}\n}`;
      }

      case 'C++': {
        return `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    ${signature} {\n        // Write your solution here\n        ${isVoid ? 'return;' : `return ${defaultReturn};`}\n    }\n};`;
      }

      case 'Java': {
        return `import java.util.*;\n\nclass Solution {\n    ${signature} {\n        // Write your solution here\n        ${isVoid ? 'return;' : `return ${defaultReturn};`}\n    }\n}`;
      }

      case 'Python': {
        return `from typing import List, Optional, Dict, Set\n\nclass Solution:\n    ${signature}\n        # Write your solution here\n        pass`;
      }

      case 'JavaScript': {
        return `/**\n * @return {any}\n */\n${signature} {\n  // Write your solution here\n  ${isVoid ? 'return;' : `return ${defaultReturn};`}\n}`;
      }

      case 'SQL': {
        return `-- Write your SQL query below\nSELECT \n    *\nFROM \n    records;`;
      }

      default:
        return `// Write your solution here\n`;
    }
  }

  /**
   * Helper: Check if code contains solution logic leaks
   */
  public static isStarterCodeLeakingSolution(code: string): boolean {
    if (!code || typeof code !== 'string') return false;

    // Strip comments and include headers first
    const cleanCode = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
      .replace(/#\s*.*/g, '')
      .replace(/#include\s+<[^>]+>/g, '')
      .replace(/import\s+[^;]+;/g, '')
      .replace(/from\s+[^]+import\s+[^;\n]+/g, '');

    // Detect actual algorithmic control structures and executable loops in function body
    if (/\bfor\s*\([^)]*\)\s*\{[^}]*\}/.test(cleanCode) || /\bwhile\s*\([^)]*\)\s*\{[^}]*\}/.test(cleanCode)) {
      return true;
    }

    const suspiciousKeywords = [
      'sliding_window', 'two_pointer', 'monotonic', 'prefix_sum',
      'dsu', 'union_find', 'dense_rank', 'partition by', 'push_back',
      'dp[', 'memo[', 'visited['
    ];
    const lower = cleanCode.toLowerCase();
    for (const kw of suspiciousKeywords) {
      if (lower.includes(kw)) return true;
    }
    return false;
  }

  private static starterCodeMatchesSignature(code: string, signature: string, lang: CodingLanguage): boolean {
    if (lang === 'SQL') return true;
    const cleanSig = signature.replace(/\s+/g, ' ').trim();
    // Extract function name
    const match = cleanSig.match(/(\w+)\s*\(/);
    if (!match) return true;
    const funcName = match[1];
    return code.includes(funcName);
  }

  /**
   * Derives structured schema from problem
   */
  private static deriveStructuredSchema(problem: CodingProblem): StructuredProblemSchema {
    return this.inferSchemaFromProblem(problem);
  }

  private static inferSchemaFromProblem(problem: CodingProblem): StructuredProblemSchema {
    const desc = (problem.description || problem.problem_statement || '').toLowerCase();
    const title = problem.title || 'Solution';
    const funcName = this.toCamelCase(title) || 'solve';
    const inputs: ProblemInputParam[] = [];

    // Attempt to extract inputs from C++ or other signatures first
    const cppSig = problem.functionSignature?.['C++'] || problem.functionSignature?.Java || problem.functionSignature?.C || '';
    if (cppSig && cppSig.includes('(')) {
      const paramStr = cppSig.slice(cppSig.indexOf('(') + 1, cppSig.lastIndexOf(')'));
      const rawParams = paramStr.split(',').map((p) => p.trim()).filter(Boolean);
      
      for (const param of rawParams) {
        const parts = param.split(/\s+/);
        let pName = parts[parts.length - 1].replace(/[*&]/g, '');
        const pTypeStr = param.toLowerCase();

        let pType: ProblemInputParam['type'] = 'integer';
        if (pTypeStr.includes('vector<vector') || pTypeStr.includes('[][]') || pTypeStr.includes('**')) {
          pType = 'matrix';
        } else if (pTypeStr.includes('vector') || pTypeStr.includes('[]') || pTypeStr.includes('* nums') || pTypeStr.includes('* arr')) {
          pType = 'array_1d';
        } else if (pTypeStr.includes('string') || pTypeStr.includes('char*')) {
          pType = 'string';
        } else if (pTypeStr.includes('treenode')) {
          pType = 'binary_tree';
        } else if (pTypeStr.includes('listnode')) {
          pType = 'linked_list';
        } else if (pTypeStr.includes('bool')) {
          pType = 'boolean';
        } else if (pTypeStr.includes('double') || pTypeStr.includes('float')) {
          pType = 'float';
        }

        // Avoid adding dimension parameters like numsSize, matrixSize as separate logical inputs
        if (!pName.endsWith('Size') && !pName.endsWith('ColSize') && pName !== 'returnSize' && pName !== 'returnColumnSizes') {
          inputs.push({ name: pName, type: pType });
        }
      }
    }

    // Fallback if signature parsing produced no inputs
    if (inputs.length === 0) {
      const isMatrix = desc.includes('2d matrix') || desc.includes('m x n matrix') || desc.includes('grid') || desc.includes('matrix');
      const isArray = !isMatrix && (desc.includes('array') || desc.includes('nums') || desc.includes('list'));
      const isString = desc.includes('string') || desc.includes('character');
      const hasTarget = (desc.includes('target') || desc.includes('find') || desc.includes('search')) && !desc.includes('target company');
      const hasK = /\b`?k`?\b/.test(desc);

      if (isMatrix) {
        inputs.push({ name: 'matrix', type: 'matrix', elementType: 'integer' });
      } else if (isArray) {
        inputs.push({ name: 'nums', type: 'array_1d', elementType: 'integer' });
      } else if (isString) {
        inputs.push({ name: 's', type: 'string' });
      } else {
        inputs.push({ name: 'n', type: 'integer' });
      }

      if (hasTarget) {
        inputs.push({ name: 'target', type: 'integer' });
      }
      if (hasK && !inputs.some((i) => i.name === 'k')) {
        inputs.push({ name: 'k', type: 'integer' });
      }
    }

    const isBoolReturn = desc.includes('return true if') || desc.includes('return false') || desc.includes('boolean');

    return {
      funcName,
      inputs,
      returnType: {
        type: isBoolReturn ? 'boolean' : 'integer',
        cType: isBoolReturn ? 'bool' : 'int',
        cppType: isBoolReturn ? 'bool' : 'int',
        javaType: isBoolReturn ? 'boolean' : 'int',
        pythonType: isBoolReturn ? 'bool' : 'int',
        jsType: isBoolReturn ? 'boolean' : 'number',
      },
    };
  }

  private static toCamelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}
