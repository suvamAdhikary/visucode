'use client';

import { useState } from 'react';
import { DryRunViewer } from './DryRunViewer';
import { LiveDryRunTab } from './LiveDryRunTab';
import { CodeSubmit } from '../../components/editor/CodeSubmit';
import type { Problem } from '@visucode/shared-types';
import styles from './ProblemTabs.module.css';

interface ProblemTabsProps {
  problem: Problem;
}

export function ProblemTabs({ problem }: ProblemTabsProps) {
  const [activeTab, setActiveTab] = useState<'official-dry-run' | 'live-dry-run' | 'code'>(
    'official-dry-run'
  );

  const handleTabChange = (tab: 'official-dry-run' | 'live-dry-run' | 'code') => {
    setActiveTab(tab);
  };

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabHeader} role="tablist">
        <button
          className={`${styles.tabBtn} ${activeTab === 'official-dry-run' ? styles.active : ''}`}
          onClick={() => handleTabChange('official-dry-run')}
          role="tab"
          aria-selected={activeTab === 'official-dry-run'}
        >
          🔍 Official Dry Run
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'live-dry-run' ? styles.active : ''}`}
          onClick={() => handleTabChange('live-dry-run')}
          role="tab"
          aria-selected={activeTab === 'live-dry-run'}
        >
          ⚡ Dry Run My Code <span className={styles.liveBadge}>Live</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'code' ? styles.active : ''}`}
          onClick={() => handleTabChange('code')}
          role="tab"
          aria-selected={activeTab === 'code'}
        >
          💻 Your Code <span className={styles.betaBadge}>Beta</span>
        </button>
      </div>

      <div className={styles.tabContent}>
        {/* display:none preserves Monaco and stepper state when switching tabs */}
        <div
          className={styles.tabPane}
          data-testid="pane-official-dry-run"
          style={{ display: activeTab === 'official-dry-run' ? 'flex' : 'none' }}
        >
          <DryRunViewer problem={problem} />
        </div>

        <div
          className={styles.tabPane}
          data-testid="pane-live-dry-run"
          style={{ display: activeTab === 'live-dry-run' ? 'flex' : 'none' }}
        >
          <LiveDryRunTab problem={problem} />
        </div>

        <div
          className={styles.tabPane}
          data-testid="pane-code"
          style={{ display: activeTab === 'code' ? 'flex' : 'none' }}
        >
          <CodeSubmit
            starterCode={problem.starterCode?.['javascript'] || ''}
            wrapperCode={problem.wrapperCode?.['javascript']}
            testCases={problem.testCases}
            problemSlug={problem.slug}
          />
        </div>
      </div>
    </div>
  );
}
