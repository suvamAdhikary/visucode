const fs = require('fs');
const path = require('path');

const problemName = process.argv[2] || process.env.PROBLEM_NAME || 'reverse-linked-list';
const problemFile = problemName.endsWith('.json') ? problemName : `${problemName}.json`;
const problemsDir = process.env.PROBLEMS_DIR || path.join(__dirname, '../apps/web/content/problems');
const probPath = path.isAbsolute(problemFile) ? problemFile : path.join(problemsDir, problemFile);

const prob = JSON.parse(fs.readFileSync(probPath, 'utf8'));

const extractFunctionName = (code) => {
  const cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
  const funcMatch = cleanCode.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
  if (funcMatch) return funcMatch[1];
  return null;
}
console.log('Extracted:', extractFunctionName(prob.starterCode.javascript));

const functionName = extractFunctionName(prob.starterCode.javascript);

const testCases = prob.testCases;
const code = prob.solutions[0].code;
const wrapperCode = prob.wrapperCode.javascript;

const results = [];
for (const testCase of testCases) {
    let actual = '';
    let passed = false;
    let error;

    try {
      const parsedInput = JSON.parse(testCase.input);
      const args = Array.isArray(parsedInput) ? parsedInput : [parsedInput];
      const wrappedCode = `
        ${code}
        ${wrapperCode || ''}
        return JSON.stringify(${wrapperCode ? '__execute' : functionName}(${args.map((_, i) => `arguments[${i}]`).join(', ')}));
      `;
      const fn = new Function(...args.map((_, i) => `arg${i}`), wrappedCode);
      const rawResult = fn(...args);
      actual = rawResult ?? 'undefined';
      
      // semanticCompare logic simplified
      let expectedParsed = testCase.expected;
      if (typeof expectedParsed === 'string' && expectedParsed.startsWith('ANY_OF:')) {
        expectedParsed = expectedParsed.replace('ANY_OF:', '').split('|').map(s => {
          try { return JSON.parse(s); } catch { return s; }
        });
      } else {
        try { expectedParsed = JSON.parse(testCase.expected); } catch { /* expected is not JSON */ }
      }

      let actualParsed = actual;
      try {
        if (actual !== 'undefined') actualParsed = JSON.parse(actual);
      } catch { /* actual is not JSON */ }

      if (Array.isArray(expectedParsed) && testCase.expected.startsWith('ANY_OF:')) {
        passed = expectedParsed.some(e => JSON.stringify(e) === JSON.stringify(actualParsed));
      } else {
        passed = JSON.stringify(expectedParsed) === JSON.stringify(actualParsed);
      }
      
    } catch (err) {
      error = err.message;
      actual = `Error: ${error}`;
      passed = false;
    }

    results.push({
      id: testCase.id,
      passed,
      actual,
      error
    });
}
console.log(JSON.stringify(results, null, 2));
