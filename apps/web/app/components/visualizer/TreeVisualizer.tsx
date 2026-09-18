'use client';

import { useEffect, useRef, useState } from 'react';
import type { TreeVisualizerState, Pointer } from '@visucode/shared-types';
import { useVisualizerStore } from '../../../lib/stores';
import styles from './TreeVisualizer.module.css';

interface TreeVisualizerProps {
  treeState: TreeVisualizerState;
  pointers?: Pointer[];
  accentColor?: string;
}

interface ArrowLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function TreeVisualizer({
  treeState,
  pointers = [],
  accentColor = '#6366f1',
}: TreeVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [arrows, setArrows] = useState<ArrowLine[]>([]);
  const { speed } = useVisualizerStore();

  const animDuration = `${300 / speed}ms`;

  const updateArrows = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newArrows: ArrowLine[] = [];

    treeState.nodes.forEach(node => {
      (['leftId', 'rightId'] as const).forEach(childKey => {
        const childId = node[childKey];
        if (!childId) return;
        
        const startEl = nodeRefs.current[node.id];
        const endEl = nodeRefs.current[childId];
        
        if (!startEl || !endEl) return;

        const startRect = startEl.getBoundingClientRect();
        const endRect = endEl.getBoundingClientRect();

        // Start at center bottom of parent
        const startX = startRect.left + startRect.width / 2 - containerRect.left;
        const startY = startRect.bottom - containerRect.top;

        // End at center top of child
        const endX = endRect.left + endRect.width / 2 - containerRect.left;
        const endY = endRect.top - containerRect.top;

        newArrows.push({
          id: `${node.id}->${childId}`,
          startX,
          startY,
          endX,
          endY,
        });
      });
    });

    setArrows(newArrows);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [treeState]);

  const pointersByNode: Record<string, Pointer[]> = {};
  pointers.forEach(p => {
    if (p.targetId) {
      if (!pointersByNode[p.targetId]) pointersByNode[p.targetId] = [];
      pointersByNode[p.targetId].push(p);
    }
  });

  const renderNode = (nodeId: string): React.ReactNode => {
    const node = treeState.nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const isHighlighted = treeState.highlightIds?.includes(node.id);
    const nodePointers = pointersByNode[node.id] || [];
    const isRoot = treeState.rootId === node.id;

    return (
      <div key={node.id} className={styles.treeNodeWrapper}>
        <div className={styles.nodeAndPointers}>
          <div className={styles.pointerContainer}>
            {nodePointers.map((p) => (
              <div 
                key={p.name} 
                className={styles.pointerLabel}
                style={{ color: p.color, animationDuration: animDuration }}
              >
                {p.label || p.name}
              </div>
            ))}
            {isRoot && !nodePointers.some(p => p.name === 'root') && (
              <div className={styles.rootLabel}>root</div>
            )}
          </div>

          <div
            ref={el => { nodeRefs.current[node.id] = el; }}
            className={`${styles.node} ${isHighlighted ? styles.highlighted : ''}`}
            style={{
              borderColor: isHighlighted ? accentColor : undefined,
              boxShadow: isHighlighted ? `0 0 16px ${accentColor}40` : undefined,
              animationDuration: animDuration,
            }}
          >
            {node.value}
          </div>
        </div>

        {(node.leftId || node.rightId) && (
          <div className={styles.childrenContainer}>
            <div className={styles.childWrapper}>
              {node.leftId ? renderNode(node.leftId) : <div className={styles.emptyChild} aria-hidden="true" />}
            </div>
            <div className={styles.childWrapper}>
              {node.rightId ? renderNode(node.rightId) : <div className={styles.emptyChild} aria-hidden="true" />}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.visualizer} ref={containerRef} role="figure" aria-label="Binary Tree Visualization">
      <svg className={styles.svgOverlay} aria-hidden="true">
        {arrows.map(arrow => (
          <line
            key={arrow.id}
            x1={arrow.startX}
            y1={arrow.startY}
            x2={arrow.endX}
            y2={arrow.endY}
            stroke="var(--color-border)"
            strokeWidth="2"
            style={{ transition: 'all 0.3s ease' }}
          />
        ))}
      </svg>
      <div className={styles.treeContainer}>
        {treeState.rootId && renderNode(treeState.rootId)}
      </div>
    </div>
  );
}
