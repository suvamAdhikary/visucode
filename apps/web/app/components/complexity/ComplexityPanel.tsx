import React from 'react';
import type { Solution, ComplexityClass } from '@visucode/shared-types';
import { ComplexityChart, COMPLEXITY_METADATA } from './ComplexityChart';
import styles from './ComplexityPanel.module.css';

export interface ComplexityPanelProps {
  solution?: Solution;
  timeComplexity?: string;
  spaceComplexity?: string;
  timeComplexityWhy?: string;
  spaceComplexityWhy?: string;
  complexityClass?: ComplexityClass;
  explanation?: string;
}

export function ComplexityPanel({
  solution,
  timeComplexity: customTimeComplexity,
  spaceComplexity: customSpaceComplexity,
  timeComplexityWhy: customTimeWhy,
  spaceComplexityWhy: customSpaceWhy,
  complexityClass: customComplexityClass,
  explanation: customExplanation,
}: ComplexityPanelProps) {
  const timeComplexity = solution?.timeComplexity ?? customTimeComplexity ?? '—';
  const spaceComplexity = solution?.spaceComplexity ?? customSpaceComplexity ?? '—';
  const timeComplexityWhy = solution?.timeComplexityWhy ?? customTimeWhy;
  const spaceComplexityWhy = solution?.spaceComplexityWhy ?? customSpaceWhy;
  const complexityClass = solution?.complexityClass ?? customComplexityClass;
  const explanation = solution?.explanation ?? customExplanation;

  const classMeta = complexityClass ? COMPLEXITY_METADATA[complexityClass] : null;

  return (
    <section
      className={styles.complexityPanel}
      aria-label="Algorithm Complexity Analysis"
      data-testid="complexity-panel"
    >
      <div className={styles.panelHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon} aria-hidden="true">
            ⚡
          </span>
          <div>
            <h3 className={styles.panelTitle}>Algorithm Complexity</h3>
            <p className={styles.panelSubtitle}>
              Official asymptotic Big-O runtime and auxiliary memory analysis
            </p>
          </div>
        </div>

        {classMeta && (
          <div
            className={styles.classBadge}
            style={{
              borderColor: `${classMeta.color}40`,
              backgroundColor: `${classMeta.color}15`,
              color: classMeta.color,
            }}
          >
            <span
              className={styles.classIndicatorDot}
              style={{ backgroundColor: classMeta.color }}
            />
            <span>{classMeta.name}</span>
          </div>
        )}
      </div>

      {explanation && (
        <div className={styles.approachSection}>
          <div className={styles.approachHeader}>
            <span className={styles.approachIcon} aria-hidden="true">
              💡
            </span>
            <span className={styles.approachLabel}>Algorithmic Approach</span>
          </div>
          <p className={styles.approachText}>{explanation}</p>
        </div>
      )}

      <div className={styles.panelGrid}>
        {/* Metric Cards Column */}
        <div className={styles.cardsColumn}>
          {/* Time Complexity Card */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <div className={styles.metricTitleGroup}>
                <span className={styles.metricLabel}>Time Complexity</span>
                <span
                  className={styles.metricValue}
                  style={{ color: classMeta ? classMeta.color : 'var(--color-primary, #6366f1)' }}
                >
                  {timeComplexity}
                </span>
              </div>
            </div>

            {timeComplexityWhy && (
              <div className={styles.whySection}>
                <span className={styles.whyLabel}>Why:</span>
                <p className={styles.whyText}>{timeComplexityWhy}</p>
              </div>
            )}
          </div>

          {/* Space Complexity Card */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <div className={styles.metricTitleGroup}>
                <span className={styles.metricLabel}>Space Complexity</span>
                <span className={styles.metricValue} style={{ color: '#10b981' }}>
                  {spaceComplexity}
                </span>
              </div>
            </div>

            {spaceComplexityWhy && (
              <div className={styles.whySection}>
                <span className={styles.whyLabel}>Why:</span>
                <p className={styles.whyText}>{spaceComplexityWhy}</p>
              </div>
            )}
          </div>
        </div>

        {/* Growth Curve Chart Column */}
        <div className={styles.chartColumn}>
          <ComplexityChart complexityClass={complexityClass} />
        </div>
      </div>
    </section>
  );
}
