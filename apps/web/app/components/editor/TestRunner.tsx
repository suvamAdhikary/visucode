'use client';

import { useState, useEffect } from 'react';
import {
  executeTests,
  extractFunctionName,
  type ExecutionResult,
  type TestResult,
} from '../../../lib/utils/test-executor';
import type { TestCase } from '@visucode/shared-types';
import styles from './TestRunner.module.css';

interface TestRunnerProps {
  code: string;
  starterCode: string;
  wrapperCode?: string;
  testCases: TestCase[];
}

export function TestRunner({ code, starterCode, wrapperCode, testCases }: TestRunnerProps) {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [isStale, setIsStale] = useState(false);

  // F-P2S1-08: Mark results as stale when code changes
  useEffect(() => {
    if (result) {
      setIsStale(true);
    }
  }, [code]);

  const handleRunTests = async () => {
    setIsRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const funcName = extractFunctionName(starterCode) || 'solution'; // F-P2S1-09: from starter
    const execResult = await executeTests(code, funcName, testCases, wrapperCode);
    setResult(execResult);
    setIsStale(false);
    setIsRunning(false);

    // Auto-expand failed tests, or first test if all passed
    const newExpanded = new Set<string>();
    if (execResult.totalFailed > 0) {
      execResult.results
        .filter((r: TestResult) => !r.passed)
        .forEach((r: TestResult) => newExpanded.add(r.id));
    } else if (execResult.results.length > 0) {
      newExpanded.add(execResult.results[0].id);
    }
    setExpandedTests(newExpanded);
  };

  const toggleTest = (id: string) => {
    const next = new Set(expandedTests);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedTests(next);
  };

  return (
    <div className={styles.testRunner}>
      <div className={styles.header}>
        <div className={styles.status}>
          {result ? (
            <span
              className={
                result.totalFailed === 0 ? styles.statusPass : styles.statusFail
              }
            >
              {isStale ? (
                <span className={styles.statusReady}>Stale results (code changed)</span>
              ) : (
                <>
                  {result.totalFailed === 0
                    ? `✅ All ${result.totalPassed} tests passed!`
                    : `❌ ${result.totalFailed}/${result.totalTests} failed`}
                  <span className={styles.timeStr}>
                    ({result.overallTimeMs}ms)
                  </span>
                </>
              )}
            </span>
          ) : (
            <span className={styles.statusReady}>Ready to run tests</span>
          )}
        </div>
        <button
          className={styles.runButton}
          onClick={handleRunTests}
          disabled={isRunning || testCases.length === 0}
        >
          {isRunning ? 'Running...' : '▶ Run Tests'}
        </button>
      </div>

      <div className={styles.resultsList}>
        {!result && testCases.length > 0 && (
          <div className={styles.emptyState}>
            Click &quot;Run Tests&quot; to execute your code against{' '}
            {testCases.length} test cases.
          </div>
        )}

        {result &&
          result.results.map((test: TestResult, index: number) => {
            const isExpanded = expandedTests.has(test.id);
            return (
              <div
                key={test.id}
                className={`${styles.testCase} ${test.passed ? styles.testPass : styles.testFail}`}
              >
                <button
                  className={styles.testHeader}
                  onClick={() => toggleTest(test.id)}
                  aria-expanded={isExpanded}
                >
                  <span className={styles.testIcon}>
                    {test.passed ? '✅' : '❌'}
                  </span>
                  <span className={styles.testTitle}>
                    Test Case {index + 1}
                  </span>
                  <span className={styles.testTime}>
                    {test.executionTimeMs}ms
                  </span>
                  <span className={styles.expandIcon}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>

                {isExpanded && (
                  <div className={styles.testDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Input:</span>
                      <pre className={styles.detailValue}>{test.input}</pre>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Expected:</span>
                      <pre className={styles.detailValue}>{test.expected}</pre>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Actual:</span>
                      <pre
                        className={`${styles.detailValue} ${test.passed ? styles.valPass : styles.valFail}`}
                      >
                        {test.actual}
                      </pre>
                    </div>
                    {test.error && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Error:</span>
                        <pre
                          className={`${styles.detailValue} ${styles.valFail}`}
                        >
                          {test.error}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
