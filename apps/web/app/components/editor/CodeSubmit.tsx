'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { TestRunner } from './TestRunner';
import { EditorModeToggle } from './EditorModeToggle';
import type { TestCase } from '@visucode/shared-types';
import styles from './CodeSubmit.module.css';

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
        <div className={styles.spinner} />
        <span>Loading editor...</span>
      </div>
    ),
  }
);

interface CodeSubmitProps {
  starterCode: string;
  testCases: TestCase[];
}

export function CodeSubmit({ starterCode, testCases }: CodeSubmitProps) {
  const [code, setCode] = useState(starterCode);

  const resetCode = () => setCode(starterCode);

  return (
    <div className={styles.codeSubmitContainer}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.filename}>solution.js</span>
          <span className={styles.language}>JavaScript</span>
        </div>
        <div className={styles.toolbarRight}>
          <EditorModeToggle />
          <button
            className={styles.resetBtn}
            onClick={resetCode}
            title="Reset to starter code"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      <div className={styles.editorSection}>
        <CodeEditor code={code} language="javascript" onChange={setCode} />
      </div>

      <div className={styles.testRunnerSection}>
        <TestRunner code={code} starterCode={starterCode} testCases={testCases} />
      </div>
    </div>
  );
}
