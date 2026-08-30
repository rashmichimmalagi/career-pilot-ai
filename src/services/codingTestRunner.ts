/**
 * Coding Arena Real Test Harness & Execution Validator
 * 
 * Executes JavaScript/TypeScript reference solutions and starter codes against test cases,
 * verifying that inputs parse, outputs match expected types/values, and all visible & hidden tests pass.
 */

import { CodingProblem, CodingTestCase, TestCaseResult } from '../types/coding';

export interface TestExecutionSuiteResult {
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
  results: TestCaseResult[];
  executionTimeMs: number;
  error?: string;
}

export class CodingTestRunner {
  /**
   * Executes a problem's JavaScript implementation/reference against all its test cases.
   */
  public static executeAndValidateProblem(
    problem: CodingProblem,
    implementationCode?: string
  ): TestExecutionSuiteResult {
    const code = implementationCode || problem.referenceSolution?.JavaScript || problem.starterCode?.JavaScript || '';
    const testCases: CodingTestCase[] = [
      ...(problem.examples || []).map((ex, i) => ({
        id: `ex_${i + 1}`,
        input: ex.input,
        expectedOutput: ex.output,
        isHidden: false,
        category: 'example',
      })),
      ...(problem.hiddenTestCases || problem.test_cases || []),
    ];

    if (!code || !code.trim()) {
      return {
        allPassed: false,
        totalTests: testCases.length,
        passedTests: 0,
        results: [],
        executionTimeMs: 0,
        error: 'No executable code provided for test execution.',
      };
    }

    const startTime = Date.now();
    const results: TestCaseResult[] = [];
    let passedCount = 0;

    try {
      // Build executable sandbox function
      const fn = this.extractExecutableFunction(code);
      if (!fn) {
        return {
          allPassed: false,
          totalTests: testCases.length,
          passedTests: 0,
          results: [],
          executionTimeMs: Date.now() - startTime,
          error: 'Failed to extract executable JavaScript function from code.',
        };
      }

      for (const tc of testCases) {
        const parsedArgs = this.parseTestCaseInput(tc.input);
        let actualOutput: any;
        let hasError = false;
        let errorMessage = '';

        try {
          actualOutput = fn(...parsedArgs);
        } catch (execErr: any) {
          hasError = true;
          errorMessage = execErr?.message || String(execErr);
        }

        const formattedActual = this.formatOutput(actualOutput);
        const matches = !hasError && this.compareOutputs(formattedActual, tc.expectedOutput);

        if (matches) {
          passedCount++;
        }

        results.push({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: hasError ? 'Error' : formattedActual,
          passed: matches,
          isHidden: tc.isHidden,
          category: tc.category,
          errorMessage: errorMessage || (matches ? '' : 'Output mismatch'),
        });
      }

      const duration = Date.now() - startTime;
      return {
        allPassed: passedCount === testCases.length && testCases.length > 0,
        totalTests: testCases.length,
        passedTests: passedCount,
        results,
        executionTimeMs: duration,
      };
    } catch (err: any) {
      return {
        allPassed: false,
        totalTests: testCases.length,
        passedTests: 0,
        results: [],
        executionTimeMs: Date.now() - startTime,
        error: err?.message || 'Execution error during test run',
      };
    }
  }

  /**
   * Safely compiles and extracts the primary function from code.
   */
  private static extractExecutableFunction(code: string): ((...args: any[]) => any) | null {
    try {
      // Handle class Solution pattern or standalone function
      const wrapped = `
        ${code}
        if (typeof Solution !== 'undefined') {
          const s = new Solution();
          const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(s)).filter(m => m !== 'constructor');
          if (methods.length > 0) return (...args) => s[methods[0]](...args);
        }
        // Match function name
        const match = ${JSON.stringify(code)}.match(/function\\s+([a-zA-Z0-9_]+)\\s*\\(/);
        if (match && typeof eval(match[1]) === 'function') {
          return eval(match[1]);
        }
        return null;
      `;
      const createFn = new Function(wrapped);
      return createFn();
    } catch (e) {
      return null;
    }
  }

  /**
   * Parses test case input string into runtime arguments array.
   * e.g. "nums = [2, 7, 11, 15], target = 9" -> [[2, 7, 11, 15], 9]
   * e.g. "matrix = [[1,3,5,7],[10,11,16,20]], target = 3" -> [[[1,3,5,7],[10,11,16,20]], 3]
   */
  public static parseTestCaseInput(inputStr: string): any[] {
    if (!inputStr || typeof inputStr !== 'string') return [];

    try {
      // Split on top-level commas or assignments
      const parts = inputStr.split(/,\s*(?=[a-zA-Z_]\w*\s*=)/);
      const args: any[] = [];

      for (const part of parts) {
        const eqIdx = part.indexOf('=');
        const valStr = (eqIdx !== -1 ? part.slice(eqIdx + 1) : part).trim();

        if (valStr.startsWith('[') || valStr.startsWith('{')) {
          try {
            args.push(JSON.parse(valStr.replace(/'/g, '"')));
          } catch {
            args.push(valStr);
          }
        } else if (valStr === 'true') {
          args.push(true);
        } else if (valStr === 'false') {
          args.push(false);
        } else if (!isNaN(Number(valStr)) && valStr !== '') {
          args.push(Number(valStr));
        } else if ((valStr.startsWith('"') && valStr.endsWith('"')) || (valStr.startsWith("'") && valStr.endsWith("'"))) {
          args.push(valStr.slice(1, -1));
        } else {
          args.push(valStr);
        }
      }

      return args;
    } catch {
      return [inputStr];
    }
  }

  /**
   * Formats actual return value to comparable string representation
   */
  public static formatOutput(val: any): string {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) {
      return JSON.stringify(val);
    }
    if (typeof val === 'object') {
      return JSON.stringify(val);
    }
    return String(val);
  }

  /**
   * Compares formatted actual output with expected output string
   */
  public static compareOutputs(actual: string, expected: string): boolean {
    const cleanActual = actual.trim().replace(/^['"]|['"]$/g, '');
    const cleanExpected = expected.trim().replace(/^['"]|['"]$/g, '');

    if (cleanActual === cleanExpected) return true;

    // Compare JSON structures
    try {
      const objA = JSON.parse(cleanActual.replace(/'/g, '"'));
      const objE = JSON.parse(cleanExpected.replace(/'/g, '"'));
      return JSON.stringify(objA) === JSON.stringify(objE);
    } catch {
      // Ignore parse failure and fallback to lower-case string comparison
    }

    return cleanActual.toLowerCase() === cleanExpected.toLowerCase();
  }
}
