'use client';

import React, { useMemo } from 'react';
import type { HeapVisualizerState, Pointer } from '@visucode/shared-types';
import styles from './HeapVisualizer.module.css';

interface HeapVisualizerProps {
  heapState: HeapVisualizerState;
  pointers?: Pointer[];
  accentColor?: string;
}

export const HeapVisualizer: React.FC<HeapVisualizerProps> = ({
  heapState,
  pointers = [],
  accentColor = '#f59e0b',
}) => {
  const {
    elements = [],
    heapType = 'min',
    highlightIndices = [],
    compareIndices,
    swapIndices,
  } = heapState;

  const compareSet = useMemo(() => new Set(compareIndices || []), [compareIndices]);
  const swapSet = useMemo(() => new Set(swapIndices || []), [swapIndices]);
  const highlightSet = useMemo(() => new Set(highlightIndices), [highlightIndices]);

  // Group indices by tree levels (level 0: 0; level 1: 1..2; level 2: 3..6; ...)
  const treeLevels = useMemo(() => {
    const levels: number[][] = [];
    let levelStart = 0;
    let levelSize = 1;

    while (levelStart < elements.length) {
      const level: number[] = [];
      for (let i = levelStart; i < Math.min(levelStart + levelSize, elements.length); i++) {
        level.push(i);
      }
      levels.push(level);
      levelStart += levelSize;
      levelSize *= 2;
    }

    return levels;
  }, [elements]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span style={{ fontWeight: 600 }}>Heap / Priority Queue</span>
        <div className={styles.heapTypeBadge} style={{ borderColor: accentColor, color: accentColor }}>
          <span>{heapType === 'min' ? '▼ Min-Heap' : '▲ Max-Heap'}</span>
        </div>
      </div>

      {/* 1D Array Representation */}
      <div className={styles.arraySection}>
        <div className={styles.sectionTitle}>1D Array Representation</div>
        <div className={styles.arrayRow}>
          {elements.map((val, idx) => {
            const isHighlighted = highlightSet.has(idx);
            const isCompared = compareSet.has(idx);
            const isSwapped = swapSet.has(idx);
            const cellPointers = pointers.filter((p) => p.index === idx);

            let cellClass = styles.cellBox;
            if (isSwapped) cellClass += ` ${styles.cellSwapped}`;
            else if (isCompared) cellClass += ` ${styles.cellCompared}`;
            else if (isHighlighted) cellClass += ` ${styles.cellHighlighted}`;

            return (
              <div key={`heap-arr-${idx}`} className={styles.arrayCell}>
                {cellPointers.length > 0 && (
                  <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                    {cellPointers.map((p) => (
                      <span key={p.name} style={{ color: p.color || accentColor, fontSize: '0.7rem', fontWeight: 600 }}>
                        {p.label || p.name}
                      </span>
                    ))}
                  </div>
                )}
                <span className={styles.indexLabel}>[{idx}]</span>
                <div
                  className={cellClass}
                  style={isHighlighted ? { borderColor: accentColor, boxShadow: `0 0 8px ${accentColor}40` } : undefined}
                >
                  {val}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete Binary Tree Representation */}
      <div className={styles.treeSection}>
        <div className={styles.sectionTitle}>Binary Tree Hierarchy (Parent i → Children 2i+1, 2i+2)</div>
        <div className={styles.treeArea}>
          <div className={styles.treeLevels}>
            {treeLevels.map((levelIndices, levelIdx) => (
              <div key={`level-${levelIdx}`} className={styles.treeRow}>
                {levelIndices.map((idx) => {
                  const val = elements[idx];
                  const isHighlighted = highlightSet.has(idx);
                  const isCompared = compareSet.has(idx);
                  const isSwapped = swapSet.has(idx);

                  let circleClass = styles.treeCircle;
                  if (isSwapped) circleClass += ` ${styles.treeCircleSwapped}`;
                  else if (isCompared) circleClass += ` ${styles.treeCircleCompared}`;
                  else if (isHighlighted) circleClass += ` ${styles.treeCircleActive}`;

                  return (
                    <div key={`heap-node-${idx}`} className={styles.treeNode}>
                      <div
                        className={circleClass}
                        style={isHighlighted ? { borderColor: accentColor, boxShadow: `0 0 10px ${accentColor}50` } : undefined}
                      >
                        {val}
                      </div>
                      <span className={styles.indexLabel}>[{idx}]</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
