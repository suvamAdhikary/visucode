'use client';

// ============================================
// Playground — Code Sandbox with Console
// ============================================
// Write code, run it, see output
// Interview/Practice mode toggles autocomplete

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { EditorModeToggle } from '../components/editor/EditorModeToggle';
import styles from './page.module.css';

// Lazy-load Monaco — show spinner while loading
const CodeEditor = dynamic(() => import('./CodeEditor').then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => (
    <div className={styles.editorLoading}>
      <span className={styles.loadingText}>Loading editor...</span>
    </div>
  ),
});

// Algorithm starter templates
const TEMPLATES: Record<string, { label: string; code: string }> = {
  blank: {
    label: 'Blank',
    code: '// Start coding here\n\n',
  },
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
}

// Test it
const result = twoPointers([1, 3, 5, 7, 9], 12);
console.log("Result:", result);
`,
  },
  'sliding-window': {
    label: 'Sliding Window',
    code: `function maxSubarraySum(arr, k) {
  let windowSum = 0;

  // Calculate first window
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }

  let maxSum = windowSum;

  // Slide the window
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
}

// Test it
const result = maxSubarraySum([2, 1, 5, 1, 3, 2], 3);
console.log("Max sum of subarray (k=3):", result);
`,
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
}

// Test it
const idx = binarySearch([2, 5, 8, 12, 16, 23, 38, 56], 23);
console.log("Found at index:", idx);
`,
  },
};

interface LogEntry {
  type: 'info' | 'error' | 'result' | 'system';
  text: string;
}

export default function PlaygroundClient() {
  const [code, setCode] = useState(TEMPLATES['two-pointers'].code);
  const [selectedTemplate, setSelectedTemplate] = useState('two-pointers');
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'system', text: '// Press ▶ Run to execute your code' },
  ]);

  const handleTemplateChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const key = e.target.value;
      setSelectedTemplate(key);
      setCode(TEMPLATES[key].code);
      setLogs([{ type: 'system', text: `// Loaded ${TEMPLATES[key].label} template` }]);
    },
    []
  );

  const handleReset = useCallback(() => {
    setCode(TEMPLATES[selectedTemplate].code);
    setLogs([{ type: 'system', text: '// Reset to template' }]);
  }, [selectedTemplate]);

  const handleClear = useCallback(() => {
    setLogs([]);
  }, []);

  const handleRun = useCallback(() => {
    const newLogs: LogEntry[] = [
      { type: 'system', text: `// Running at ${new Date().toLocaleTimeString()}...` },
    ];

    // Capture console.log output
    const originalLog = console.log;
    const capturedLogs: LogEntry[] = [];

    console.log = (...args: unknown[]) => {
      const text = args
        .map((a) => {
          if (typeof a === 'object') return JSON.stringify(a, null, 2);
          return String(a);
        })
        .join(' ');
      capturedLogs.push({ type: 'info', text });
    };

    try {
      const fn = new Function(code);
      const result = fn();

      newLogs.push(...capturedLogs);

      if (result !== undefined) {
        newLogs.push({
          type: 'result',
          text: `→ ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`,
        });
      }

      if (capturedLogs.length === 0 && result === undefined) {
        newLogs.push({ type: 'system', text: '// No output. Add console.log() to see results.' });
      }
    } catch (err) {
      newLogs.push(...capturedLogs);
      newLogs.push({
        type: 'error',
        text: `❌ ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      console.log = originalLog;
    }

    setLogs(newLogs);
  }, [code]);

  return (
    <div className={styles.playgroundPage}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.title}>🎮 Playground</span>
          <select
            className={styles.select}
            value={selectedTemplate}
            onChange={handleTemplateChange}
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
          <button className={styles.resetButton} onClick={handleReset}>
            ↺ Reset
          </button>
          <button className={styles.runButton} onClick={handleRun}>
            ▶ Run
          </button>
        </div>
      </div>

      {/* Main Split: Editor | Output */}
      <div className={styles.mainArea}>
        {/* Editor */}
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span>editor.js</span>
            <span>JavaScript</span>
          </div>
          <div className={styles.editorContainer}>
            <CodeEditor code={code} language="javascript" onChange={setCode} />
          </div>
        </div>

        {/* Output Console */}
        <div className={styles.outputPanel}>
          <div className={styles.outputHeader}>
            <span>Console Output</span>
            <button className={styles.clearButton} onClick={handleClear}>
              Clear
            </button>
          </div>
          <div className={styles.outputContent}>
            {logs.length === 0 ? (
              <div className={styles.emptyOutput}>
                <span>📭</span>
                <span>No output yet</span>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`${styles.logLine} ${styles[log.type]}`}>
                  {log.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
