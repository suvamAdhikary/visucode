// ============================================
// Test Executor — Client-side code runner
// ============================================
// Runs user code against test cases using Web Workers
// Returns structured results with pass/fail per case

export interface TestResult {
  id: string;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
  executionTimeMs: number;
}

export interface ExecutionResult {
  results: TestResult[];
  totalPassed: number;
  totalFailed: number;
  totalTests: number;
  overallTimeMs: number;
}

export interface TestCase {
  id: string;
  input: string;
  expected: string;
  isHidden?: boolean;
}

/**
 * Execute user code against a set of test cases safely in a Web Worker.
 *
 * @param code - User's JavaScript code (should define a function)
 * @param functionName - The name of the function to call
 * @param testCases - Array of test cases from the problem JSON
 */
export async function executeTests(
  code: string,
  functionName: string,
  testCases: TestCase[]
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    // Note: This relies on Webpack / Next.js resolving the worker correctly.
    // In a test environment (Jest), workers might need a mock or polyfill.
    try {
      const worker = new Worker(new URL('./executor.worker.ts', import.meta.url));

      // Hard timeout for the worker to prevent infinite loops (tab freezing)
      const timeoutId = setTimeout(() => {
        worker.terminate();
        resolve(createTimeoutResult(testCases));
      }, 2000);

      worker.onmessage = (e) => {
        clearTimeout(timeoutId);
        resolve(e.data as ExecutionResult);
        worker.terminate();
      };

      worker.onerror = (e) => {
        clearTimeout(timeoutId);
        worker.terminate();
        resolve(createErrorResult(testCases, 'Worker error: ' + e.message));
      };

      worker.postMessage({ code, functionName, testCases });
    } catch (e) {
      // Fallback if Worker fails to instantiate (e.g. in some test environments without full polyfills)
      console.warn('Failed to instantiate Web Worker, using synchronous fallback', e);
      resolve(executeTestsSync(code, functionName, testCases));
    }
  });
}

import { semanticCompare } from './comparator';

function executeTestsSync(
  code: string,
  functionName: string,
  testCases: TestCase[]
): ExecutionResult {
  const results: TestResult[] = [];
  const overallStart = performance.now();

  for (const testCase of testCases) {
    const start = performance.now();
    let actual = '';
    let passed = false;
    let error: string | undefined;

    try {
      const parsedInput = JSON.parse(testCase.input);
      const args = Array.isArray(parsedInput) ? parsedInput : [parsedInput];
      const wrappedCode = `
        ${code}
        return JSON.stringify(${functionName}(${args.map((_, i) => `arguments[${i}]`).join(', ')}));
      `;
      const fn = new Function(...args.map((_, i) => `arg${i}`), wrappedCode);
      const rawResult = fn(...args);
      actual = rawResult ?? 'undefined';
      passed = semanticCompare(testCase.expected, actual);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      actual = `Error: ${error}`;
      passed = false;
    }

    const executionTimeMs = performance.now() - start;
    results.push({
      id: testCase.id,
      passed,
      input: testCase.isHidden ? 'Hidden' : testCase.input,
      expected: testCase.isHidden ? 'Hidden' : testCase.expected,
      actual: testCase.isHidden ? (passed ? 'Correct' : 'Wrong Answer') : actual,
      error: testCase.isHidden ? undefined : error,
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
    });
  }

  const overallTimeMs = Math.round((performance.now() - overallStart) * 100) / 100;
  const totalPassed = results.filter((r) => r.passed).length;

  return {
    results,
    totalPassed,
    totalFailed: results.length - totalPassed,
    totalTests: results.length,
    overallTimeMs,
  };
}

function createTimeoutResult(testCases: TestCase[]): ExecutionResult {
  const results: TestResult[] = testCases.map(tc => ({
    id: tc.id,
    passed: false,
    input: tc.isHidden ? 'Hidden' : tc.input,
    expected: tc.isHidden ? 'Hidden' : tc.expected,
    actual: tc.isHidden ? 'Wrong Answer' : 'Timeout Error',
    error: tc.isHidden ? undefined : 'Execution timed out (> 2000ms). Possible infinite loop.',
    executionTimeMs: 2000,
  }));
  return {
    results,
    totalPassed: 0,
    totalFailed: testCases.length,
    totalTests: testCases.length,
    overallTimeMs: 2000,
  };
}

function createErrorResult(testCases: TestCase[], errorMsg: string): ExecutionResult {
  const results: TestResult[] = testCases.map(tc => ({
    id: tc.id,
    passed: false,
    input: tc.isHidden ? 'Hidden' : tc.input,
    expected: tc.isHidden ? 'Hidden' : tc.expected,
    actual: tc.isHidden ? 'Wrong Answer' : 'System Error',
    error: tc.isHidden ? undefined : errorMsg,
    executionTimeMs: 0,
  }));
  return {
    results,
    totalPassed: 0,
    totalFailed: testCases.length,
    totalTests: testCases.length,
    overallTimeMs: 0,
  };
}

/**
 * Extract the function name from starter code.
 * Looks for: function xyz(, const xyz =, var xyz =
 */
export function extractFunctionName(code: string): string | null {
  // function declaration
  const funcMatch = code.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
  if (funcMatch) return funcMatch[1];

  // const/let/var arrow or function expression
  const varMatch = code.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
  if (varMatch) return varMatch[1];

  return null;
}
