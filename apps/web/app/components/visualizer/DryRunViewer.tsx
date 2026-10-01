'use client';

// ============================================
// Dry Run Viewer — Interactive Step-Through
// ============================================
// Connects CodeViewer + Visualizers + StepController + VariableInspector
// Accepts either an authored Problem or arbitrary live { code, dryRunSteps }

import { useCallback, useState, useEffect } from 'react';
import type { Problem, DryRunStep } from '@visucode/shared-types';
import { ArrayVisualizer } from './ArrayVisualizer';
import { LinkedListVisualizer } from './LinkedListVisualizer';
import { TreeVisualizer } from './TreeVisualizer';
import { HashMapVisualizer } from './HashMapVisualizer';
import { StackQueueVisualizer } from './StackQueueVisualizer';
import { IntervalVisualizer } from './IntervalVisualizer';
import { GraphVisualizer } from './GraphVisualizer';
import { TrieVisualizer } from './TrieVisualizer';
import { HeapVisualizer } from './HeapVisualizer';
import { DpTableVisualizer } from './DpTableVisualizer';
import { BacktrackingVisualizer } from './BacktrackingVisualizer';
import { StepController } from './StepController';
import { VariableInspector } from './VariableInspector';
import { CodeViewer } from '../editor/CodeViewer';
import {
  createVisualizerStore,
  VisualizerStoreContext,
  type VisualizerStoreType,
} from '../../../lib/stores';
import styles from './DryRunViewer.module.css';

export interface DryRunViewerProps {
  problem?: Problem;
  code?: string;
  dryRunSteps?: DryRunStep[];
  title?: string;
  accentColor?: string;
  codeTitle?: string;
  complexity?: {
    timeComplexity?: string;
    spaceComplexity?: string;
  };
  store?: VisualizerStoreType;
}

// Pattern color mapping
const PATTERN_COLORS: Record<string, string> = {
  'two-pointers': '#06b6d4',
  'sliding-window': '#a855f7',
  'binary-search': '#f59e0b',
  'dfs': '#10b981',
  'bfs': '#38bdf8',
  'graph': '#0284c7',
  'trie': '#c084fc',
  'heap': '#f59e0b',
  'hash-map': '#ec4899',
  'stack': '#3b82f6',
  'greedy': '#f43f5e',
  'dynamic-programming': '#ec4899',
  'backtracking': '#f43f5e',
};

export function DryRunViewer({
  problem,
  code: customCode,
  dryRunSteps: customSteps,
  title = '🔍 Dry Run',
  accentColor: customAccent,
  codeTitle = 'Code',
  complexity: customComplexity,
  store: customStore,
}: DryRunViewerProps) {
  const steps = problem?.dryRunSteps ?? customSteps ?? [];
  const [localStore, setLocalStore] = useState(() => customStore ?? createVisualizerStore(steps.length));

  useEffect(() => {
    if (customStore) {
      setLocalStore(customStore);
    }
  }, [customStore]);

  useEffect(() => {
    localStore.getState().reset(steps.length);
  }, [steps, localStore]);

  const currentStep = localStore((s) => s.currentStep);
  const step = steps[currentStep] ?? steps[0];

  const code = problem ? problem.solutions[0]?.code : customCode;
  const complexity = problem ? problem.solutions[0] : customComplexity;

  const accentColor =
    customAccent ??
    (problem ? PATTERN_COLORS[problem.patterns[0]] ?? '#6366f1' : '#6366f1');

  const handleStepChange = useCallback(() => {
    // Optional step telemetry hook
  }, []);

  if (!steps || steps.length === 0) {
    return (
      <div className={styles.dryRunEmpty}>
        <span style={{ fontSize: '2rem' }}>🔧</span>
        <p>Dry run steps coming soon for this problem.</p>
      </div>
    );
  }

  return (
    <VisualizerStoreContext.Provider value={localStore}>
      <div className={styles.dryRunViewer}>
      <h2 className={styles.dryRunTitle}>{title}</h2>

      {/* Code Viewer with active line highlight */}
      {code && (
        <div>
          <div className={styles.codeHeader}>
            <span>{problem ? 'Solution' : codeTitle}</span>
            {complexity && (complexity.timeComplexity || complexity.spaceComplexity) && (
              <span className={styles.complexity}>
                {complexity.timeComplexity ? `⏱ ${complexity.timeComplexity}` : ''}
                {complexity.timeComplexity && complexity.spaceComplexity ? ' | ' : ''}
                {complexity.spaceComplexity ? `💾 ${complexity.spaceComplexity}` : ''}
              </span>
            )}
          </div>
          <CodeViewer
            code={code}
            language="javascript"
            activeLine={step?.line}
            accentColor={accentColor}
            height="280px"
          />
        </div>
      )}

      {/* Visualizations */}
      <div className={styles.vizContainer}>
        {step?.arrayState && (
          <ArrayVisualizer
            arrayState={step.arrayState}
            pointers={step.pointers}
            accentColor={accentColor}
          />
        )}
        {step?.linkedListState && (
          <LinkedListVisualizer
            listState={step.linkedListState}
            pointers={step.pointers}
            accentColor={accentColor}
          />
        )}
        {step?.treeState && (
          <TreeVisualizer
            treeState={step.treeState}
            pointers={step.pointers}
            accentColor={accentColor}
          />
        )}
        {step?.hashMapState && <HashMapVisualizer state={step.hashMapState} />}
        {step?.stackQueueState && <StackQueueVisualizer state={step.stackQueueState} />}
        {step?.intervalState && <IntervalVisualizer state={step.intervalState} />}
        {step?.graphState && (
          <GraphVisualizer
            graphState={step.graphState}
            pointers={step.pointers}
            accentColor={accentColor}
          />
        )}
        {step?.trieState && (
          <TrieVisualizer
            trieState={step.trieState}
            pointers={step.pointers}
            accentColor={accentColor}
          />
        )}
        {step?.heapState && (
          <HeapVisualizer
            heapState={step.heapState}
            pointers={step.pointers}
            accentColor={accentColor}
          />
        )}
        {step?.dpTableState && (
          <DpTableVisualizer
            dpTableState={step.dpTableState}
            pointers={step.pointers}
            accentColor={accentColor}
          />
        )}
        {step?.backtrackingState && (
          <BacktrackingVisualizer
            backtrackingState={step.backtrackingState}
            pointers={step.pointers}
            accentColor={accentColor}
          />
        )}
      </div>

      {/* Variable Inspector */}
      {step && (
        <VariableInspector
          variables={step.variables}
          explanation={step.explanation}
          codeLine={step.line}
        />
      )}

      {/* Step Controller */}
      <StepController
        totalSteps={steps.length}
        accentColor={accentColor}
        onStepChange={handleStepChange}
      />
    </div>
  </VisualizerStoreContext.Provider>
);
}
