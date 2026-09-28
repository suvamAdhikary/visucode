'use client';

import React, { useMemo } from 'react';
import type { DpTableVisualizerState, Pointer } from '@visucode/shared-types';
import styles from './DpTableVisualizer.module.css';

interface DpTableVisualizerProps {
  dpTableState: DpTableVisualizerState;
  pointers?: Pointer[];
  accentColor?: string;
}

export const DpTableVisualizer: React.FC<DpTableVisualizerProps> = ({
  dpTableState,
  pointers = [],
  accentColor = '#ec4899',
}) => {
  const {
    grid = [],
    rowHeaders,
    colHeaders,
    activeCell,
    highlightCells = [],
    computedCells = [],
    formula,
  } = dpTableState;

  const activeKey = useMemo(() => {
    return activeCell ? `${activeCell[0]},${activeCell[1]}` : null;
  }, [activeCell]);

  const highlightSet = useMemo(() => {
    return new Set(highlightCells.map(([r, c]) => `${r},${c}`));
  }, [highlightCells]);

  const computedSet = useMemo(() => {
    return new Set(computedCells.map(([r, c]) => `${r},${c}`));
  }, [computedCells]);

  const is1D = grid.length === 1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 600 }}>Dynamic Programming</span>
          <div className={styles.badge} style={{ borderColor: accentColor, color: accentColor }}>
            <span>{is1D ? '1D DP Array' : '2D DP Grid'}</span>
          </div>
        </div>

        {formula && (
          <div className={styles.formulaBanner}>
            <span className={styles.formulaLabel}>Formula:</span>
            <span className={styles.formulaCode}>{formula}</span>
          </div>
        )}

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dotActive} style={{ backgroundColor: accentColor }} />
            <span>Current Cell</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dotDependency} />
            <span>Subproblem Read</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dotComputed} />
            <span>Computed</span>
          </div>
        </div>
      </div>

      <div className={styles.gridWrapper}>
        <table className={styles.table}>
          {/* Column Headers */}
          {colHeaders && colHeaders.length > 0 && (
            <thead>
              <tr>
                {rowHeaders && rowHeaders.length > 0 && <th className={styles.cornerCell} />}
                {colHeaders.map((header, cIdx) => (
                  <th key={`col-${cIdx}`} className={styles.headerCell}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          <tbody>
            {grid.map((row, rIdx) => (
              <tr key={`row-${rIdx}`}>
                {/* Row Header */}
                {rowHeaders && rowHeaders[rIdx] !== undefined && (
                  <th className={styles.headerCell}>{rowHeaders[rIdx]}</th>
                )}

                {/* Cells */}
                {row.map((val, cIdx) => {
                  const cellKey = `${rIdx},${cIdx}`;
                  const isActive = cellKey === activeKey;
                  const isDependency = highlightSet.has(cellKey);
                  const isComputed = computedSet.has(cellKey);

                  let cellClass = styles.cell;
                  if (isActive) {
                    cellClass += ` ${styles.cellActive}`;
                  } else if (isDependency) {
                    cellClass += ` ${styles.cellDependency}`;
                  } else if (isComputed) {
                    cellClass += ` ${styles.cellComputed}`;
                  } else if (val === null || val === undefined) {
                    cellClass += ` ${styles.cellEmpty}`;
                  }

                  const cellPointers = pointers.filter(
                    (p) =>
                      (p.index !== undefined && is1D && p.index === cIdx) ||
                      (p.targetId && p.targetId === cellKey)
                  );

                  return (
                    <td
                      key={`cell-${rIdx}-${cIdx}`}
                      className={cellClass}
                      style={
                        isActive
                          ? { borderColor: accentColor, boxShadow: `0 0 12px ${accentColor}60` }
                          : undefined
                      }
                    >
                      <div>{val === null || val === undefined ? '—' : val}</div>
                      {cellPointers.map((p) => (
                        <span
                          key={p.name}
                          className={styles.pointerBadge}
                          style={{ color: p.color || accentColor }}
                        >
                          {p.label || p.name}
                        </span>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
