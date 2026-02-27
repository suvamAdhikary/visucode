'use client';

// ============================================
// Variable Inspector — Shows variable state during dry run
// ============================================
// Displays current variable values with change highlighting

import type { Variable } from '@visucode/shared-types';
import styles from './VariableInspector.module.css';

interface VariableInspectorProps {
  variables: Variable[];
  explanation?: string;
  codeLine?: number;
}

export function VariableInspector({
  variables,
  explanation,
  codeLine,
}: VariableInspectorProps) {
  if (variables.length === 0) return null;

  return (
    <div className={styles.inspector} role="region" aria-label="Variable inspector">
      {/* Current line indicator */}
      {codeLine !== undefined && (
        <div className={styles.lineIndicator}>
          <span className={styles.lineLabel}>Line</span>
          <span className={styles.lineNumber}>{codeLine}</span>
        </div>
      )}

      {/* Variables table */}
      <div className={styles.variables}>
        {variables.map((v) => (
          <div
            key={v.name}
            className={`${styles.variable} ${v.changed ? styles.changed : ''}`}
          >
            <span className={styles.varName}>{v.name}</span>
            <span className={styles.varEquals}>=</span>
            <span className={styles.varValue}>{v.value}</span>
            <span className={styles.varType}>{v.type}</span>
          </div>
        ))}
      </div>

      {/* Step explanation */}
      {explanation && (
        <div className={styles.explanation}>
          <span className={styles.explanationIcon} aria-hidden="true">💡</span>
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}
