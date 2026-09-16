'use client';

// ============================================
// Dry Run Viewer — Interactive Step-Through
// ============================================
// Connects ArrayVisualizer + StepController + VariableInspector
// This is THE feature that replaces pen & paper

import { useCallback } from 'react';
import type { Problem } from '@visucode/shared-types';
import { ArrayVisualizer } from '../../components/visualizer/ArrayVisualizer';
import { LinkedListVisualizer } from '../../components/visualizer/LinkedListVisualizer';
import { TreeVisualizer } from '../../components/visualizer/TreeVisualizer';
import { StepController } from '../../components/visualizer/StepController';
import { VariableInspector } from '../../components/visualizer/VariableInspector';
import { CodeViewer } from '../../components/editor/CodeViewer';
import { useVisualizerStore } from '../../../lib/stores';
import styles from './page.module.css';

interface DryRunViewerProps {
  problem: Problem;
}

// Pattern color mapping
const PATTERN_COLORS: Record<string, string> = {
  'two-pointers': '#06b6d4',
  'sliding-window': '#a855f7',
  'binary-search': '#f59e0b',
};

export function DryRunViewer({ problem }: DryRunViewerProps) {
  const { currentStep } = useVisualizerStore();
  const steps = problem.dryRunSteps;
  const step = steps[currentStep] ?? steps[0];

  const accentColor =
    PATTERN_COLORS[problem.patterns[0]] ?? '#6366f1';

  const handleStepChange = useCallback(() => {
    // Logger integration point
    // logger.track.dryRunStep(problem.slug, currentStep, 'fwd');
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
    <div className={styles.dryRunViewer}>
      <h2 className={styles.dryRunTitle}>🔍 Dry Run</h2>

      {/* Solution code with Monaco syntax highlighting */}
      {problem.solutions[0] && (
        <div>
          <div className={styles.codeHeader}>
            <span>Solution</span>
            <span className={styles.complexity}>
              ⏱ {problem.solutions[0].timeComplexity} | 💾{' '}
              {problem.solutions[0].spaceComplexity}
            </span>
          </div>
          <CodeViewer
            code={problem.solutions[0].code}
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
  );
}
