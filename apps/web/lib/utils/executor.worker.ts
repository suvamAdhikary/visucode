import { semanticCompare } from './comparator';

// Web worker expects message: { code: string, functionName: string, testCases: TestCase[] }
self.onmessage = function (e) {
  const { code, functionName, testCases } = e.data;
  
  const results = [];
  const overallStart = performance.now();

  for (const testCase of testCases) {
    const start = performance.now();
    let actual = '';
    let passed = false;
    let error: string | undefined;

    try {
      const parsedInput = JSON.parse(testCase.input);
      const args = Array.isArray(parsedInput) ? parsedInput : [parsedInput];

      // Safe evaluation scope inside the worker
      const wrappedCode = `
        ${code}
        return JSON.stringify(${functionName}(${args.map((_, i) => `arguments[${i}]`).join(', ')}));
      `;

      // Evaluate code in worker scope
      const fn = new Function(...args.map((_, i) => `arg${i}`), wrappedCode);
      const rawResult = fn(...args);
      actual = rawResult ?? 'undefined';

      // Compare
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
      error: testCase.isHidden ? undefined : error, // F-P2S1-05: Redact error string for hidden tests
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
    });
  }

  const overallTimeMs = Math.round((performance.now() - overallStart) * 100) / 100;
  const totalPassed = results.filter((r) => r.passed).length;

  self.postMessage({
    results,
    totalPassed,
    totalFailed: results.length - totalPassed,
    totalTests: results.length,
    overallTimeMs,
  });
};
