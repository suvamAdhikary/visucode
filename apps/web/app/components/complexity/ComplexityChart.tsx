import React, { useId } from 'react';
import type { ComplexityClass } from '@visucode/shared-types';
import styles from './ComplexityChart.module.css';

export interface ComplexityChartProps {
  complexityClass?: ComplexityClass;
  compact?: boolean;
}

export const COMPLEXITY_METADATA: Record<
  ComplexityClass,
  {
    name: string;
    notation: string;
    color: string;
    description: string;
    badgeText: string;
  }
> = {
  constant: {
    name: 'Constant',
    notation: 'O(1)',
    color: '#10b981',
    description: 'Execution time remains constant regardless of input size.',
    badgeText: 'Optimal (O(1))',
  },
  logarithmic: {
    name: 'Logarithmic',
    notation: 'O(log N)',
    color: '#06b6d4',
    description: 'Execution time grows slowly by repeatedly halving the search space.',
    badgeText: 'Excellent (O(log N))',
  },
  linear: {
    name: 'Linear',
    notation: 'O(N)',
    color: '#6366f1',
    description: 'Execution time scales directly in proportion to the input size.',
    badgeText: 'Linear (O(N))',
  },
  linearithmic: {
    name: 'Linearithmic',
    notation: 'O(N log N)',
    color: '#8b5cf6',
    description: 'Scales efficiently for sorting and divide-and-conquer algorithms.',
    badgeText: 'Linearithmic (O(N log N))',
  },
  quadratic: {
    name: 'Quadratic',
    notation: 'O(N²)',
    color: '#f59e0b',
    description: 'Execution time grows quadratically with nested iterations over the input.',
    badgeText: 'Quadratic (O(N²))',
  },
  exponential: {
    name: 'Exponential',
    notation: 'O(2ⁿ)',
    color: '#f43f5e',
    description: 'Operations double with each additional element; suitable only for small N.',
    badgeText: 'Exponential (O(2ⁿ))',
  },
};

interface CurveDef {
  key: ComplexityClass;
  d: string;
  label: string;
  labelX: number;
  labelY: number;
  endX: number;
  endY: number;
}

const CURVES: CurveDef[] = [
  {
    key: 'constant',
    d: 'M 30 110 L 225 110',
    label: 'O(1)',
    labelX: 230,
    labelY: 113,
    endX: 225,
    endY: 110,
  },
  {
    key: 'logarithmic',
    d: 'M 30 115 C 55 102, 110 88, 225 82',
    label: 'O(log N)',
    labelX: 230,
    labelY: 85,
    endX: 225,
    endY: 82,
  },
  {
    key: 'linear',
    d: 'M 30 115 L 210 46',
    label: 'O(N)',
    labelX: 215,
    labelY: 48,
    endX: 210,
    endY: 46,
  },
  {
    key: 'linearithmic',
    d: 'M 30 115 C 70 102, 130 65, 185 24',
    label: 'O(N log N)',
    labelX: 190,
    labelY: 26,
    endX: 185,
    endY: 24,
  },
  {
    key: 'quadratic',
    d: 'M 30 115 Q 100 110, 135 18',
    label: 'O(N²)',
    labelX: 140,
    labelY: 20,
    endX: 135,
    endY: 18,
  },
  {
    key: 'exponential',
    d: 'M 30 115 Q 60 110, 80 14',
    label: 'O(2ⁿ)',
    labelX: 85,
    labelY: 16,
    endX: 80,
    endY: 14,
  },
];

export function ComplexityChart({ complexityClass, compact = false }: ComplexityChartProps) {
  const activeMeta = complexityClass ? COMPLEXITY_METADATA[complexityClass] : null;
  const rawId = useId();
  const filterId = `active-glow-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div
      className={`${styles.container} ${compact ? styles.compact : ''}`}
      role="figure"
      aria-label={`Complexity Growth Visual: ${activeMeta ? activeMeta.name : 'All Classes'}`}
    >
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>Big-O Growth Curve</span>
        {activeMeta && (
          <span
            className={styles.activeBadge}
            style={{
              backgroundColor: `${activeMeta.color}18`,
              borderColor: `${activeMeta.color}50`,
              color: activeMeta.color,
            }}
          >
            {activeMeta.badgeText}
          </span>
        )}
      </div>

      <svg
        className={styles.svg}
        viewBox="0 0 280 145"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Axes */}
        <line x1="30" y1="120" x2="265" y2="120" stroke="var(--color-border, #334155)" strokeWidth="1.5" />
        <line x1="30" y1="120" x2="30" y2="8" stroke="var(--color-border, #334155)" strokeWidth="1.5" />

        {/* Axis Arrows */}
        <polygon points="265,117 271,120 265,123" fill="var(--color-text-muted, #64748b)" />
        <polygon points="27,8 30,2 33,8" fill="var(--color-text-muted, #64748b)" />

        {/* Axis Labels */}
        <text x="268" y="134" className={styles.axisLabel} textAnchor="end">
          N
        </text>
        <text x="25" y="10" className={styles.axisLabel} textAnchor="end">
          Ops
        </text>

        {/* Curves */}
        {CURVES.map((curve) => {
          const isActive = curve.key === complexityClass;
          const curveMeta = COMPLEXITY_METADATA[curve.key];
          const strokeColor = isActive ? curveMeta.color : 'var(--color-border-hover, #64748b)';
          const strokeWidth = isActive ? 3 : 1.25;
          const opacity = isActive ? 1 : 0.28;

          return (
            <g key={curve.key} className={isActive ? styles.activeGroup : styles.inactiveGroup}>
              <path
                d={curve.d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={opacity}
                filter={isActive ? `url(#${filterId})` : undefined}
                className={styles.curvePath}
              />

              {/* End Dot on Active Curve */}
              {isActive && (
                <circle
                  cx={curve.endX}
                  cy={curve.endY}
                  r="4"
                  fill={curveMeta.color}
                  className={styles.glowDot}
                />
              )}

              {/* Curve Label */}
              <text
                x={curve.labelX}
                y={curve.labelY}
                className={`${styles.curveLabel} ${isActive ? styles.activeLabel : ''}`}
                fill={isActive ? curveMeta.color : 'var(--color-text-muted, #64748b)'}
                opacity={isActive ? 1 : 0.45}
                fontWeight={isActive ? '700' : '500'}
              >
                {curve.label}
              </text>
            </g>
          );
        })}
      </svg>

      {activeMeta && (
        <div className={styles.chartFooter}>
          <span className={styles.footerDot} style={{ backgroundColor: activeMeta.color }} />
          <span className={styles.footerDescription}>{activeMeta.description}</span>
        </div>
      )}
    </div>
  );
}
