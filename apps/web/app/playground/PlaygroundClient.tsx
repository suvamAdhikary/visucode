'use client';

// ============================================
// Playground — Live Dry Run Sandboxed Stepper
// ============================================
// Write code, define inputs, and step through execution
// Powered by Acorn AST instrumentation & Web Worker sandbox (ADR-002)

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { EditorModeToggle } from '../components/editor/EditorModeToggle';
import { DryRunViewer } from '../components/visualizer/DryRunViewer';
import { traceUserCode } from '../../lib/tracer/tracer';
import { validatePreflightInput } from '../../lib/tracer/input-validator';
import type { LiveTraceResult, TraceDiagnostic, DiagnosticKind } from '../../lib/tracer/types';
import { useVisualizerStore } from '../../lib/stores';
import styles from './page.module.css';

// Lazy-load Monaco
const CodeEditor = dynamic(() => import('./CodeEditor').then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => (
    <div className={styles.editorLoading}>
      <span className={styles.loadingText}>Loading editor...</span>
    </div>
  ),
});

// Algorithm starter templates with default preflighted inputs
const TEMPLATES: Record<
  string,
  { label: string; code: string; defaultInput: string; description: string }
> = {
  'two-pointers': {
    label: 'Two Pointers',
    code: `function twoPointers(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) {
      return [left, right];
    } else if (sum < target) {
      left++;
    } else {
      right--;
    }
  }

  return [-1, -1];
}`,
    defaultInput: '[[1, 3, 5, 7, 9], 12]',
    description: 'Finds pair summing to target using two converging pointers',
  },
  'sliding-window': {
    label: 'Sliding Window',
    code: `function maxSubarraySum(arr, k) {
  let windowSum = 0;

  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }

  let maxSum = windowSum;

  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    if (windowSum > maxSum) {
      maxSum = windowSum;
    }
  }

  return maxSum;
}`,
    defaultInput: '[[2, 1, 5, 1, 3, 2], 3]',
    description: 'Finds max subarray sum with fixed window size k',
  },
  'binary-search': {
    label: 'Binary Search',
    code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}`,
    defaultInput: '[[2, 5, 8, 12, 16], 12]',
    description: 'Searches for target in a sorted array in O(log N)',
  },
  blank: {
    label: 'Blank',
    code: `function solution(nums) {
  let count = 0;
  for (let i = 0; i < nums.length; i++) {
    count += nums[i];
  }
  return count;
}`,
    defaultInput: '[[1, 2, 3, 4]]',
    description: 'Start coding your own function',
  },
};

interface LogEntry {
  type: 'info' | 'error' | 'result' | 'system';
  text: string;
}

function formatDiagnosticTitle(kind: DiagnosticKind): string {
  switch (kind) {
    case 'loop-hang':
      return 'Infinite Loop Detected (Repeated State)';
    case 'recursion-depth-exceeded':
      return 'Recursion Depth Exceeded (Stack Overflow)';
    case 'step-cap-exceeded':
      return 'Step Limit Exceeded (500 Steps)';
    case 'timeout':
      return 'Execution Timeout (2s)';
    case 'preflight-error':
      return 'Input Preflight Rejected';
    case 'syntax-error':
      return 'JavaScript Syntax Error';
    case 'runtime-error':
    default:
      return 'Runtime Exception';
  }
}

export default function PlaygroundClient() {
  const [code, setCode] = useState(TEMPLATES['two-pointers'].code);
  const [input, setInput] = useState(TEMPLATES['two-pointers'].defaultInput);
  const [selectedTemplate, setSelectedTemplate] = useState('two-pointers');
  const [isTracing, setIsTracing] = useState(false);
  const [activeTab, setActiveTab] = useState<'stepper' | 'console'>('stepper');

  const [traceResult, setTraceResult] = useState<LiveTraceResult | null>(null);
  const [diagnostic, setDiagnostic] = useState<TraceDiagnostic | null>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'system', text: '// Ready. Press ▶ Dry Run to trace execution line-by-line.' },
  ]);

  // Real-time preflight validation (F-LDR-S1-08)
  const preflight = useMemo(() => {
    return validatePreflightInput(input);
  }, [input]);

  const handleTemplateChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const key = e.target.value;
      const tmpl = TEMPLATES[key];
      if (!tmpl) return;

      setSelectedTemplate(key);
      setCode(tmpl.code);
      setInput(tmpl.defaultInput);
      setTraceResult(null);
      setDiagnostic(null);
      setShowDiagnosticModal(false);
      setLogs([{ type: 'system', text: `// Loaded ${tmpl.label} template: ${tmpl.description}` }]);
    },
    []
  );

  const handleReset = useCallback(() => {
    const tmpl = TEMPLATES[selectedTemplate];
    if (!tmpl) return;

    setCode(tmpl.code);
    setInput(tmpl.defaultInput);
    setTraceResult(null);
    setDiagnostic(null);
    setShowDiagnosticModal(false);
    setLogs([{ type: 'system', text: `// Reset to ${tmpl.label} template` }]);
  }, [selectedTemplate]);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const handleRunTrace = useCallback(async () => {
    // 1. Input preflight check before starting worker (F-LDR-S1-08)
    const currentPreflight = validatePreflightInput(input);
    if (!currentPreflight.valid) {
      const diag: TraceDiagnostic = {
        kind: 'preflight-error',
        message: currentPreflight.error || 'Input exceeds preflight limits.',
        suggestion: 'Ensure inputs meet size and shape limits defined in ADR-002 (≤16 elements, ≤2KB).',
      };
      setDiagnostic(diag);
      setShowDiagnosticModal(true);
      setLogs((prev) => [
        ...prev,
        { type: 'error', text: `⛔ Input Preflight Rejected: ${currentPreflight.error}` },
      ]);
      return;
    }

    setIsTracing(true);
    setLogs((prev) => [
      ...prev,
      { type: 'system', text: `// Tracing in Web Worker at ${new Date().toLocaleTimeString()}...` },
    ]);

    try {
      // 2. Sandboxed Worker execution (F-LDR-S1-01, F-LDR-S1-02, F-LDR-S1-07)
      const result = await traceUserCode({ code, input });
      setTraceResult(result);

      if (result.steps.length > 0) {
        useVisualizerStore.getState().reset(result.steps.length);
        setActiveTab('stepper');
      }

      if (result.completed) {
        const retStr =
          result.returnValue !== undefined
            ? typeof result.returnValue === 'object'
              ? JSON.stringify(result.returnValue)
              : String(result.returnValue)
            : 'undefined';

        setLogs((prev) => [
          ...prev,
          {
            type: 'result',
            text: `✓ Trace completed: ${result.totalSteps} steps executed. Return value: ${retStr}`,
          },
        ]);
        setDiagnostic(null);
        setShowDiagnosticModal(false);
      } else {
        // Abort or error with partial trace preserved (F-LDR-S1-07)
        const diag = result.diagnostic || {
          kind: 'runtime-error',
          message: 'Execution aborted unexpectedly.',
          suggestion: 'Check code logic and boundary constraints.',
        };
        setDiagnostic(diag);
        setShowDiagnosticModal(true);

        setLogs((prev) => [
          ...prev,
          {
            type: 'error',
            text: `⚠️ Execution aborted (${diag.kind}): ${diag.message}. Preserved ${result.steps.length} partial steps.`,
          },
        ]);
      }
    } catch (err: any) {
      const diag: TraceDiagnostic = {
        kind: 'runtime-error',
        message: err?.message || String(err),
        suggestion: 'An unexpected runtime error occurred.',
      };
      setDiagnostic(diag);
      setShowDiagnosticModal(true);
      setLogs((prev) => [
        ...prev,
        { type: 'error', text: `❌ Runtime exception: ${diag.message}` },
      ]);
    } finally {
      setIsTracing(false);
    }
  }, [code, input]);

  return (
    <div className={styles.playgroundPage}>
      {/* Top Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.title}>🎮 Live Dry Run</span>
          <select
            className={styles.select}
            value={selectedTemplate}
            onChange={handleTemplateChange}
            aria-label="Algorithm Template"
          >
            {Object.entries(TEMPLATES).map(([key, tmpl]) => (
              <option key={key} value={key}>
                {tmpl.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.toolbarRight}>
          <EditorModeToggle />
          <button
            className={styles.resetButton}
            onClick={handleReset}
            disabled={isTracing}
          >
            ↺ Reset
          </button>
          <button
            className={styles.runButton}
            onClick={handleRunTrace}
            disabled={isTracing || !preflight.valid}
            title={!preflight.valid ? preflight.error : 'Execute live dry run trace'}
          >
            {isTracing ? '⏳ Tracing...' : '▶ Dry Run'}
          </button>
        </div>
      </div>

      {/* Main Split: Code & Input (Left) | Stepper & Output (Right) */}
      <div className={styles.mainArea}>
        {/* Left Panel: Editor & Input */}
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <div className={styles.editorFileLabel}>
              <span className={styles.fileDot}></span>
              <span>solution.js</span>
            </div>
            <span className={styles.langBadge}>JavaScript</span>
          </div>

          <div className={styles.editorContainer}>
            <CodeEditor code={code} language="javascript" onChange={setCode} />
          </div>

          {/* Preflight Input Bar (F-LDR-S1-08) */}
          <div className={styles.inputBarContainer}>
            <div className={styles.inputBarHeader}>
              <div className={styles.inputTitleRow}>
                <span className={styles.inputLabel}>Function Arguments</span>
                <span className={styles.inputLimitsBadge}>JSON Array • Max 16 items</span>
              </div>
              <span
                className={`${styles.preflightStatus} ${
                  preflight.valid ? styles.statusValid : styles.statusInvalid
                }`}
              >
                {preflight.valid ? '✓ Preflight Passed' : '⛔ Size / Format Limit'}
              </span>
            </div>

            <input
              type="text"
              className={`${styles.inputField} ${!preflight.valid ? styles.inputFieldInvalid : ''}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. [[1, 3, 5, 7, 9], 12]"
              spellCheck={false}
              aria-label="Function Arguments Input"
            />

            {!preflight.valid && (
              <div className={styles.preflightErrorText}>
                ⚠️ {preflight.error}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Stepper & Console */}
        <div className={styles.outputPanel}>
          <div className={styles.outputHeader}>
            <div className={styles.outputTabs}>
              <button
                className={`${styles.tabBtn} ${activeTab === 'stepper' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('stepper')}
              >
                🔍 Stepper & Inspector
                {traceResult && traceResult.steps.length > 0 && (
                  <span className={styles.stepBadge}>
                    {traceResult.steps.length} {traceResult.steps.length === 1 ? 'step' : 'steps'}
                  </span>
                )}
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'console' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('console')}
              >
                📋 Console Output
              </button>
            </div>

            {activeTab === 'console' && (
              <button className={styles.clearButton} onClick={handleClearLogs}>
                Clear
              </button>
            )}

            {activeTab === 'stepper' && traceResult?.diagnostic && (
              <button
                className={styles.diagnosticsPillBtn}
                onClick={() => setShowDiagnosticModal(true)}
              >
                ⚠️ View Diagnostic
              </button>
            )}
          </div>

          <div className={styles.outputBody}>
            {activeTab === 'stepper' ? (
              traceResult && traceResult.steps.length > 0 ? (
                <div className={styles.stepperContainer}>
                  <DryRunViewer
                    code={code}
                    dryRunSteps={traceResult.steps}
                    title="Live Execution Stepper"
                    accentColor="#34d399"
                  />
                </div>
              ) : (
                <div className={styles.emptyOutput}>
                  <div className={styles.emptyIcon}>🧪</div>
                  <h3 className={styles.emptyTitle}>Live Dry Run Stepper</h3>
                  <p className={styles.emptySubtitle}>
                    Write JavaScript on the left, enter small inputs, and press{' '}
                    <strong>▶ Dry Run</strong> to step through execution.
                  </p>
                  <div className={styles.featuresList}>
                    <div className={styles.featureItem}>
                      <span>🛡️</span>
                      <span>Worker sandbox: 2s timeout & 500-step cap</span>
                    </div>
                    <div className={styles.featureItem}>
                      <span>🔍</span>
                      <span>Line-by-line active code highlighting & real locals</span>
                    </div>
                    <div className={styles.featureItem}>
                      <span>🛑</span>
                      <span>Early loop-hang detection & diagnostics popup</span>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className={styles.outputContent}>
                {logs.length === 0 ? (
                  <div className={styles.emptyOutput}>
                    <span>📭</span>
                    <span>No console logs yet</span>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`${styles.logLine} ${styles[log.type]}`}>
                      {log.text}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostics Popup Modal (F-LDR-S1-07) */}
      {showDiagnosticModal && diagnostic && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="diagnosticTitle"
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <span className={styles.modalIcon}>
                  {diagnostic.kind === 'loop-hang'
                    ? '⚠️'
                    : diagnostic.kind === 'recursion-depth-exceeded'
                    ? '🔁'
                    : diagnostic.kind === 'step-cap-exceeded'
                    ? '🛑'
                    : diagnostic.kind === 'timeout'
                    ? '⏱️'
                    : diagnostic.kind === 'preflight-error'
                    ? '⛔'
                    : '❌'}
                </span>
                <h3 id="diagnosticTitle" className={styles.modalTitle}>
                  {formatDiagnosticTitle(diagnostic.kind)}
                </h3>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowDiagnosticModal(false)}
                aria-label="Close diagnostic modal"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {diagnostic.line && (
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>Location:</span>
                  <span className={styles.modalValue}>Line {diagnostic.line}</span>
                </div>
              )}

              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>What happened:</span>
                <span className={styles.modalMessage}>{diagnostic.message}</span>
              </div>

              {diagnostic.suggestion && (
                <div className={styles.modalSuggestionBox}>
                  <span className={styles.suggestionTitle}>💡 What to check:</span>
                  <p className={styles.suggestionText}>{diagnostic.suggestion}</p>
                </div>
              )}

              {traceResult && traceResult.steps.length > 0 && (
                <div className={styles.partialTraceNotice}>
                  <span>ℹ️</span>
                  <span>
                    Preserved <strong>{traceResult.steps.length}</strong> partial step
                    {traceResult.steps.length === 1 ? '' : 's'}. You can step through execution up to this point.
                  </span>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              {traceResult && traceResult.steps.length > 0 ? (
                <button
                  className={styles.primaryModalBtn}
                  onClick={() => setShowDiagnosticModal(false)}
                >
                  Inspect Partial Trace ({traceResult.steps.length} steps)
                </button>
              ) : (
                <button
                  className={styles.secondaryModalBtn}
                  onClick={() => setShowDiagnosticModal(false)}
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
