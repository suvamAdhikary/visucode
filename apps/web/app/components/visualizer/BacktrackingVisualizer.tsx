'use client';

import React, { useMemo } from 'react';
import type { BacktrackingVisualizerState, Pointer } from '@visucode/shared-types';
import styles from './BacktrackingVisualizer.module.css';

interface BacktrackingVisualizerProps {
  backtrackingState: BacktrackingVisualizerState;
  pointers?: Pointer[];
  accentColor?: string;
}

export const BacktrackingVisualizer: React.FC<BacktrackingVisualizerProps> = ({
  backtrackingState,
  pointers = [],
  accentColor = '#f43f5e',
}) => {
  const {
    nodes = [],
    currentPath = [],
    solutionsFound = [],
    activeNodeId,
  } = backtrackingState;

  // Group nodes by depth for level-by-level tree display
  const levels = useMemo(() => {
    const map = new Map<number, typeof nodes>();
    nodes.forEach((node) => {
      const d = node.depth ?? 0;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(node);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [nodes]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 600 }}>Backtracking / State Space Tree</span>
          <div className={styles.badge} style={{ borderColor: accentColor, color: accentColor }}>
            <span>Recursion Stack</span>
          </div>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dotActive} style={{ backgroundColor: accentColor }} />
            <span>Active State</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dotSuccess} />
            <span>Valid Solution</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dotBacktrack} />
            <span>Backtrack / Pop</span>
          </div>
        </div>
      </div>

      {/* Current Recursion Path */}
      <div className={styles.pathSection}>
        <span className={styles.pathLabel}>Current Path:</span>
        <div className={styles.pathList}>
          {currentPath.length === 0 ? (
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
              [] (root state)
            </span>
          ) : (
            currentPath.map((item, idx) => (
              <React.Fragment key={`path-${idx}`}>
                {idx > 0 && <span className={styles.pathArrow}>→</span>}
                <span className={styles.pathItem} style={{ borderColor: accentColor, color: accentColor }}>
                  {item}
                </span>
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Decision Tree Area */}
      <div className={styles.treeArea}>
        {levels.map(([depth, levelNodes]) => (
          <div key={`depth-${depth}`} className={styles.levelRow}>
            {levelNodes.map((node) => {
              const isActive = node.id === activeNodeId || node.state === 'active';
              const isSuccess = node.state === 'success';
              const isBacktrack = node.state === 'backtrack';
              const isPruned = node.state === 'pruned';

              let cardClass = styles.nodeCard;
              if (isActive) cardClass += ` ${styles.nodeActive}`;
              else if (isSuccess) cardClass += ` ${styles.nodeSuccess}`;
              else if (isBacktrack) cardClass += ` ${styles.nodeBacktrack}`;
              else if (isPruned) cardClass += ` ${styles.nodePruned}`;

              const nodePointers = pointers.filter((p) => p.targetId === node.id);

              return (
                <div
                  key={node.id}
                  className={cardClass}
                  style={
                    isActive
                      ? { borderColor: accentColor, boxShadow: `0 0 12px ${accentColor}60` }
                      : undefined
                  }
                >
                  {nodePointers.length > 0 && (
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '2px' }}>
                      {nodePointers.map((p) => (
                        <span key={p.name} style={{ color: p.color || accentColor, fontSize: '0.65rem' }}>
                          ▼ {p.label || p.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <span>{node.label}</span>

                  {node.state && node.state !== 'normal' && (
                    <span
                      className={`${styles.stateTag} ${
                        isActive
                          ? styles.tagActive
                          : isSuccess
                          ? styles.tagSuccess
                          : isBacktrack
                          ? styles.tagBacktrack
                          : ''
                      }`}
                    >
                      {node.state}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Solutions Found Drawer */}
      {solutionsFound.length > 0 && (
        <div className={styles.solutionsSection}>
          <span className={styles.solutionsLabel}>
            Solutions Collected ({solutionsFound.length}):
          </span>
          <div className={styles.solutionsRow}>
            {solutionsFound.map((sol, idx) => (
              <span key={`sol-${idx}`} className={styles.solutionChip}>
                {sol}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
