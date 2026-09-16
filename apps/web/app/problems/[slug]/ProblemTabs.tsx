'use client';

import { useState } from 'react';
import { DryRunViewer } from './DryRunViewer';
import { CodeSubmit } from '../../components/editor/CodeSubmit';
import type { Problem } from '@visucode/shared-types';
import styles from './ProblemTabs.module.css';

interface ProblemTabsProps {
  problem: Problem;
}

export function ProblemTabs({ problem }: ProblemTabsProps) {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'code'>(
    'visualizer'
  );

  const starterCode =
    problem.starterCode?.javascript || '// Write your code here\n';

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabHeader} role="tablist">
        <button
          className={`${styles.tabBtn} ${activeTab === 'visualizer' ? styles.active : ''}`}
          onClick={() => setActiveTab('visualizer')}
          role="tab"
          aria-selected={activeTab === 'visualizer'}
        >
          🔍 Visualizer
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'code' ? styles.active : ''}`}
          onClick={() => setActiveTab('code')}
          role="tab"
          aria-selected={activeTab === 'code'}
        >
          💻 Your Code <span className={styles.betaBadge}>Beta</span>
        </button>
      </div>

      <div className={styles.tabContent}>
        {/* display:none preserves Monaco state when switching tabs */}
        <div
          className={styles.tabPane}
          style={{ display: activeTab === 'visualizer' ? 'flex' : 'none' }}
        >
          <DryRunViewer problem={problem} />
        </div>

        <div
          className={styles.tabPane}
          style={{ display: activeTab === 'code' ? 'flex' : 'none' }}
        >
          <CodeSubmit
            starterCode={starterCode}
            testCases={problem.testCases || []}
          />
        </div>
      </div>
    </div>
  );
}
