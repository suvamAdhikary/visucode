/**
 * Problem JSON Validation Tests
 * Verifies all 15 problem JSON files are valid and complete
 */

import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { executeTests, extractFunctionName } from '../test-executor';

const PROBLEMS_DIR = path.join(__dirname, '../../../content/problems');

// Get all problem JSON files
const problemFiles = readdirSync(PROBLEMS_DIR).filter(f => f.endsWith('.json'));

describe('Problem JSON Validation', () => {
  it('should have at least 15 problem files', () => {
    expect(problemFiles.length).toBeGreaterThanOrEqual(15);
  });

  const expectedSlugs = [
    'two-sum-sorted',
    'valid-palindrome',
    'container-with-most-water',
    'best-time-to-buy-sell-stock',
    'max-subarray-sum-k',
    'binary-search',
    '3sum',
    'trapping-rain-water',
    'longest-substring-without-repeating',
    'minimum-window-substring',
    'longest-repeating-character-replacement',
    'search-in-rotated-sorted-array',
    'find-minimum-rotated-sorted-array',
    'koko-eating-bananas',
    'find-peak-element',
    'two-sum',
    'valid-parentheses',
    'merge-intervals',
  ];

  it('should have all expected problem files', () => {
    const fileSlugs = problemFiles.map(f => f.replace('.json', ''));
    for (const slug of expectedSlugs) {
      expect(fileSlugs).toContain(slug);
    }
  });

  describe.each(problemFiles)('Problem file: %s', (filename) => {
    let problem: Record<string, unknown>;

    beforeAll(() => {
      const raw = readFileSync(path.join(PROBLEMS_DIR, filename), 'utf-8');
      problem = JSON.parse(raw);
    });

    it('is valid JSON', () => {
      expect(problem).toBeDefined();
      expect(typeof problem).toBe('object');
    });

    it('has required top-level fields', () => {
      const requiredFields = [
        'slug', 'title', 'difficulty', 'category', 'patterns',
        'companies', 'description', 'examples', 'constraints',
        'hints', 'starterCode', 'solutions', 'testCases',
        'dryRunSteps', 'externalLinks', 'realWorldUseCases', 'accessLevel',
      ];

      for (const field of requiredFields) {
        expect(problem).toHaveProperty(field);
      }
    });

    it('has matching slug and filename', () => {
      expect(problem.slug).toBe(filename.replace('.json', ''));
    });

    it('has valid difficulty', () => {
      expect(['Easy', 'Medium', 'Hard']).toContain(problem.difficulty);
    });

    it('has valid patterns', () => {
      const validPatterns = [
        'two-pointers',
        'sliding-window',
        'binary-search',
        'dfs',
        'bfs',
        'dynamic-programming',
        'greedy',
        'stack',
        'hash-map',
      ];
      const patterns = problem.patterns as string[];
      expect(patterns.length).toBeGreaterThan(0);
      for (const p of patterns) {
        expect(validPatterns).toContain(p);
      }
    });

    it('has at least 1 example', () => {
      const examples = problem.examples as unknown[];
      expect(examples.length).toBeGreaterThanOrEqual(1);
    });

    it('has JavaScript starter code', () => {
      const starterCode = problem.starterCode as Record<string, string>;
      expect(starterCode.javascript).toBeDefined();
      expect(starterCode.javascript.length).toBeGreaterThan(10);
    });

    it('has at least 1 solution', () => {
      const solutions = problem.solutions as unknown[];
      expect(solutions.length).toBeGreaterThanOrEqual(1);
    });

    it('has at least 3 test cases', () => {
      const testCases = problem.testCases as unknown[];
      expect(testCases.length).toBeGreaterThanOrEqual(3);
    });

    it('has valid test case format', () => {
      const testCases = problem.testCases as Array<{ id: string; input: string; expected: string }>;
      for (const tc of testCases) {
        expect(tc).toHaveProperty('id');
        expect(tc).toHaveProperty('input');
        expect(tc).toHaveProperty('expected');

        // Input must be valid JSON
        expect(() => JSON.parse(tc.input)).not.toThrow();
      }
    });

    it('has at least 3 dry run steps', () => {
      const steps = problem.dryRunSteps as unknown[];
      expect(steps.length).toBeGreaterThanOrEqual(3);
    });

    it('has valid dry run step format', () => {
      const steps = problem.dryRunSteps as Array<{
        stepNumber: number;
        line: number;
        variables: unknown[];
        explanation: string;
      }>;

      for (const step of steps) {
        expect(step).toHaveProperty('stepNumber');
        expect(step).toHaveProperty('line');
        expect(step).toHaveProperty('variables');
        expect(step).toHaveProperty('explanation');
        expect(step.explanation.length).toBeGreaterThan(5);
      }
    });

    it('has at least 1 external link', () => {
      const links = problem.externalLinks as unknown[];
      expect(links.length).toBeGreaterThanOrEqual(1);
    });

    it('solution code defines the correct function', () => {
      const solutions = problem.solutions as Array<{ code: string }>;
      const starterCode = problem.starterCode as Record<string, string>;

      // Extract function name from starter code
      const cleanStarterCode = (starterCode.javascript || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
      const funcMatch = cleanStarterCode.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        expect(solutions[0].code).toContain(`function ${funcName}`);
      }
    });

    it('official solution passes all tests', async () => {
      const solutions = problem.solutions as any[];
      const cleanStarterCode = ((problem.starterCode as any)['javascript'] || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
      const funcMatch = cleanStarterCode.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      const funcName = funcMatch ? funcMatch[1] : 'solution';
      
      const result = await executeTests(
        solutions[0].code,
        funcName,
        problem.testCases as any[],
        (problem.wrapperCode as any)?.['javascript']
      );
      
      if (result.totalFailed > 0) {
        console.error(`Problem ${filename} solution failed:`, JSON.stringify(result.results.filter(r => !r.passed), null, 2));
      }
      expect(result.totalFailed).toBe(0);
      expect(result.results.length).toBeGreaterThan(0);
    });
  });
});
