'use client';

import { useEffect, useRef, useState } from 'react';
import type { LinkedListVisualizerState, Pointer } from '@visucode/shared-types';
import { useVisualizerStore } from '../../../lib/stores';
import styles from './LinkedListVisualizer.module.css';

interface LinkedListVisualizerProps {
  listState: LinkedListVisualizerState;
  pointers?: Pointer[];
  accentColor?: string;
}


interface ArrowLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isBackEdge: boolean;
}

export function LinkedListVisualizer({
  listState,
  pointers = [],
  accentColor = '#6366f1',
}: LinkedListVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [arrows, setArrows] = useState<ArrowLine[]>([]);
  const { speed } = useVisualizerStore();

  const animDuration = `${300 / speed}ms`;

  const updateArrows = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newArrows: ArrowLine[] = [];

    listState.nodes.forEach((node) => {
      if (!node.nextId) return;
      
      const startEl = nodeRefs.current[node.id];
      const endEl = nodeRefs.current[node.nextId];
      
      if (!startEl || !endEl) return;

      const startRect = startEl.getBoundingClientRect();
      const endRect = endEl.getBoundingClientRect();
      
      const startNodeIdx = listState.nodes.findIndex(n => n.id === node.id);
      const endNodeIdx = listState.nodes.findIndex(n => n.id === node.nextId);
      
      const isBackEdge = endNodeIdx <= startNodeIdx;

      // Start at the right-middle of the start node
      const startX = startRect.right - containerRect.left;
      const startY = startRect.top + startRect.height / 2 - containerRect.top;

      // End at the left-middle of the end node
      const endX = endRect.left - containerRect.left;
      const endY = endRect.top + endRect.height / 2 - containerRect.top;

      newArrows.push({
        id: `${node.id}->${node.nextId}`,
        startX,
        startY,
        endX,
        endY,
        isBackEdge,
      });
    });

    setArrows(newArrows);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [listState]);

  // Group pointers by target node ID
  const pointersByNode: Record<string, Pointer[]> = {};
  pointers.forEach(p => {
    if (p.targetId) {
      if (!pointersByNode[p.targetId]) pointersByNode[p.targetId] = [];
      pointersByNode[p.targetId].push(p);
    }
  });

  return (
    <div className={styles.visualizer} ref={containerRef} role="figure" aria-label="Linked List Visualization">
      {/* SVG Overlay for Arrows */}
      <svg className={styles.svgOverlay} aria-hidden="true">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-text-muted)" />
          </marker>
        </defs>
        {arrows.map(arrow => {
          let pathD = '';
          if (arrow.isBackEdge) {
            // Draw a curved line looping under the nodes
            const controlY = arrow.startY + 60; // Curve downwards
            pathD = `M ${arrow.startX - 20} ${arrow.startY + 20} C ${arrow.startX - 20} ${controlY}, ${arrow.endX + 20} ${controlY}, ${arrow.endX + 20} ${arrow.endY + 20}`;
            // Actually, let's just make it go from bottom to bottom
            const startX = arrow.startX - 20; // Shift back a bit to the center bottom of start node
            const startY = arrow.startY + 20; // Bottom of start node
            const endX = arrow.endX + 20;     // Center bottom of end node
            const endY = arrow.endY + 20;     // Bottom of end node
            pathD = `M ${startX} ${startY} Q ${(startX + endX) / 2} ${controlY} ${endX} ${endY}`;
          } else {
            // Straight line
            pathD = `M ${arrow.startX} ${arrow.startY} L ${arrow.endX} ${arrow.endY}`;
          }

          return (
            <path
              key={arrow.id}
              d={pathD}
              stroke="var(--color-text-muted)"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
              style={{ transition: 'all 0.3s ease' }}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      <div className={styles.nodesContainer}>
        {listState.nodes.map(node => {
          const isHighlighted = listState.highlightIds?.includes(node.id);
          const isHead = listState.headId === node.id;
          const nodePointers = pointersByNode[node.id] || [];

          return (
            <div key={node.id} className={styles.nodeWrapper}>
              {/* Pointers above node */}
              <div className={styles.pointerContainer}>
                {nodePointers.map((p) => (
                  <div 
                    key={p.name} 
                    className={styles.pointerLabel}
                    style={{ color: p.color, animationDuration: animDuration }}
                  >
                    {p.label || p.name}
                    <span className={styles.pointerArrow}>↓</span>
                  </div>
                ))}
                {isHead && !nodePointers.some(p => p.name === 'head') && (
                  <div className={styles.headLabel}>head</div>
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
                <div className={styles.nodeValue}>{node.value}</div>
                <div className={styles.nodeNextDot} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
