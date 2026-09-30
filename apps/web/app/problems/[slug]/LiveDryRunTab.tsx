'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DryRunViewer } from './DryRunViewer';
import { traceUserCode } from '../../../lib/tracer/tracer';
import { validatePreflightInput } from '../../../lib/tracer/input-validator';
import type { LiveTraceResult, TraceDiagnostic } from '../../../lib/tracer/types';
import { useVisualizerStore } from '../../../lib/stores';
import type { Problem } from '@visucode/shared-types';
import styles from './LiveDryRunTab.module.css';

// Lazy-load Monaco
const CodeEditor = dynamic(
  () =>
    import('../../playground/CodeEditor').then((m) => ({
      default: m.CodeEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className={styles.editorLoading}>
        <span>Loading editor...</span>
      </div>
    ),
  }
);

interface LiveDryRunTabProps {
  problem: Problem;
}

export function LiveDryRunTab({ problem }: LiveDryRunTabProps) {
  const initialCode = problem.starterCode?.['javascript'] || '';
  const initialInput =
    problem.testCases?.[0]?.input ||
    problem.examples?.[0]?.input ||
    '[]';

  const [code, setCode] = useState(initialCode);
  const [input, setInput] = useState(initialInput);
  const [isTracing, setIsTracing] = useState(false);
  const [traceResult, setTraceResult] = useState<LiveTraceResult | null>(null);
  const [diagnostic, setDiagnostic] = useState<TraceDiagnostic | null>(null);

  const handleRunTrace = useCallback(async () => {
    // 1. Input preflight validation
    const preflight = validatePreflightInput(input);
    if (!preflight.valid) {
      const diag: TraceDiagnostic = {
        kind: 'preflight-error',
        message: preflight.error || 'Input exceeds preflight limits.',
        suggestion: 'Ensure inputs meet size and shape limits defined in ADR-002 (≤16 elements, ≤2KB).',
      };
      setDiagnostic(diag);
      return;
    }

    setIsTracing(true);
    setDiagnostic(null);

    try {
      // 2. Sandboxed execution in Web Worker
      const result = await traceUserCode({ code, input });
      setTraceResult(result);

      if (result.steps.length > 0) {
        useVisualizerStore.getState().reset(result.steps.length);
      }

      if (!result.completed && result.diagnostic) {
        setDiagnostic(result.diagnostic);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setDiagnostic({
        kind: 'runtime-error',
        message: errorMsg || 'Live execution encountered an unexpected error.',
        suggestion: 'Check JavaScript syntax and termination conditions.',
      });
    } finally {
      setIsTracing(false);
    }
  }, [code, input]);

  const handleResetCode = () => {
    setCode(initialCode);
    setInput(initialInput);
    setTraceResult(null);
    setDiagnostic(null);
  };

  return (
    <div className={styles.liveDryRunContainer}>
      {/* Control Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.inputGroup}>
            <span className={styles.inputLabel}>Input</span>
            <input
              type="text"
              className={styles.inputField}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. [[1, 2, 3], 5]"
              title="Execution input arguments passed to your solution"
            />
          </div>
        </div>

        <div className={styles.toolbarRight}>
          <button
            className={styles.resetBtn}
            onClick={handleResetCode}
            title="Reset to starter code and example 1 input"
          >
            ↺ Reset
          </button>
          <button
            className={styles.runBtn}
            onClick={handleRunTrace}
            disabled={isTracing}
            title="Trace your code execution line-by-line"
          >
            {isTracing ? '⏳ Tracing...' : '⚡ Run Dry Run'}
          </button>
        </div>
      </div>

      {/* Diagnostics Banner */}
      {diagnostic && (
        <div className={styles.diagnosticBanner} role="alert">
          <span className={styles.diagIcon}>⚠️</span>
          <div className={styles.diagContent}>
            <div className={styles.diagTitle}>
              {diagnostic.kind.toUpperCase()}: Line {diagnostic.line ?? '?'}
            </div>
            <div className={styles.diagMessage}>{diagnostic.message}</div>
            {diagnostic.suggestion && (
              <div className={styles.diagSuggestion}>
                💡 Suggestion: {diagnostic.suggestion}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code Editor */}
      <div className={styles.editorSection}>
        <CodeEditor code={code} language="javascript" onChange={setCode} />
      </div>

      {/* Stepper Viewer Section */}
      <div className={styles.viewerSection}>
        {traceResult && traceResult.steps.length > 0 ? (
          <DryRunViewer
            code={code}
            dryRunSteps={traceResult.steps}
            title="⚡ Live Dry Run"
            codeTitle="Your Code"
          />
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>⚡</span>
            <div className={styles.emptyTitle}>Ready to Dry Run Your Code</div>
            <div className={styles.emptyDescription}>
              Click <strong>&quot;Run Dry Run&quot;</strong> above to execute your code step-by-step
              with the example input, inspecting local variables, pointers, and data structures.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
