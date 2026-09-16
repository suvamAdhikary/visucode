// ============================================
// Test Executor — Client-side code runner
// ============================================
// Runs user code against test cases using Function()
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

interface TestCase {
  id: string;
  input: string;
  expected: string;
  isHidden?: boolean;
}

/**
 * Execute user code against a set of test cases.
 * 
 * The code should define a function. We wrap it and call it
 * with the parsed input, then compare the output to expected.
 *
 * @param code - User's JavaScript code (should define a function)
 * @param functionName - The name of the function to call
 * @param testCases - Array of test cases from the problem JSON
 */
export function executeTests(
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
      // Parse the input — stored as JSON array of arguments
      // e.g., "[[2,7,11,15], 9]" → args = [[2,7,11,15], 9]
      const parsedInput = JSON.parse(testCase.input);
      const args = Array.isArray(parsedInput) ? parsedInput : [parsedInput];

      // Create a sandboxed function that defines the user's code
      // and returns the result of calling their function
      const wrappedCode = `
        ${code}
        return JSON.stringify(${functionName}(${args.map((_, i) => `arguments[${i}]`).join(', ')}));
      `;

      const fn = new Function(...args.map((_, i) => `arg${i}`), wrappedCode);
      const rawResult = fn(...args);
      actual = rawResult ?? 'undefined';

      // Normalize both for comparison
      const normalizedExpected = normalizeOutput(testCase.expected);
      const normalizedActual = normalizeOutput(actual);
      passed = normalizedExpected === normalizedActual;
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
      error,
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

/**
 * Normalize output for comparison — handles JSON formatting differences
 */
function normalizeOutput(value: string): string {
  try {
    // Parse and re-stringify to normalize formatting
    return JSON.stringify(JSON.parse(value));
  } catch {
    // If not valid JSON, compare as trimmed strings
    return value.trim();
  }
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
