'use client';

import React, { useMemo } from 'react';
import type { GraphVisualizerState, Pointer } from '@visucode/shared-types';
import styles from './GraphVisualizer.module.css';

interface GraphVisualizerProps {
  graphState: GraphVisualizerState;
  pointers?: Pointer[];
  accentColor?: string;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  graphState,
  pointers = [],
  accentColor = '#38bdf8',
}) => {
  const { nodes = [], edges = [], activeNodeId, visitedNodeIds = [], queueNodeIds = [] } = graphState;

  // Viewbox dimensions
  const width = 600;
  const height = 320;
  const radius = 22;

  // Compute positions for nodes (circular layout fallback if x,y not provided)
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const total = nodes.length;
    const centerX = width / 2;
    const centerY = height / 2;
    const layoutRadius = Math.min(centerX, centerY) - 50;

    nodes.forEach((node, index) => {
      if (typeof node.x === 'number' && typeof node.y === 'number') {
        // Map 0-100 percentage coordinates to viewBox width/height
        const pxX = node.x <= 100 ? (node.x / 100) * width : node.x;
        const pxY = node.y <= 100 ? (node.y / 100) * height : node.y;
        map.set(node.id, { x: pxX, y: pxY });
      } else {
        // Circular distribution
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + layoutRadius * Math.cos(angle);
        const y = centerY + layoutRadius * Math.sin(angle);
        map.set(node.id, { x, y });
      }
    });

    return map;
  }, [nodes]);

  const visitedSet = useMemo(() => new Set(visitedNodeIds), [visitedNodeIds]);
  const queueSet = useMemo(() => new Set(queueNodeIds), [queueNodeIds]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span style={{ fontWeight: 600 }}>Graph Traversal</span>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotActive}`} />
            <span>Active</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotVisited}`} />
            <span>Visited</span>
          </div>
          {queueNodeIds.length > 0 && (
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotQueue}`} />
              <span>Queue</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.graphArea}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="rgba(148, 163, 184, 0.6)" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill={accentColor} />
            </marker>
          </defs>

          {/* Render edges */}
          {edges.map((edge, idx) => {
            const start = nodePositions.get(edge.source);
            const end = nodePositions.get(edge.target);
            if (!start || !end) return null;

            const isHighlighted = edge.highlighted;
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            return (
              <g key={`edge-${edge.source}-${edge.target}-${idx}`}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  className={`${styles.edge} ${isHighlighted ? styles.edgeHighlighted : ''}`}
                  markerEnd={edge.directed ? (isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)') : undefined}
                />
                {edge.weight !== undefined && (
                  <text
                    x={midX}
                    y={midY - 8}
                    className={styles.edgeLabel}
                    textAnchor="middle"
                  >
                    {edge.weight}
                  </text>
                )}
              </g>
            );
          })}

          {/* Render nodes */}
          {nodes.map((node) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            const isActive = node.id === activeNodeId;
            const isVisited = visitedSet.has(node.id);
            const isInQueue = queueSet.has(node.id);
            const nodePointers = pointers.filter((p) => p.targetId === node.id);

            let nodeClass = styles.node;
            if (isActive) nodeClass += ` ${styles.nodeActive}`;
            else if (isVisited) nodeClass += ` ${styles.nodeVisited}`;
            else if (isInQueue) nodeClass += ` ${styles.nodeQueue}`;

            return (
              <g key={node.id} className={nodeClass} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle r={radius} className={styles.nodeCircle} />
                <text className={styles.nodeText}>{node.label || node.id}</text>
                {nodePointers.map((p, pIdx) => (
                  <text
                    key={p.name}
                    y={-radius - 6 - pIdx * 12}
                    textAnchor="middle"
                    fill={p.color || accentColor}
                    fontSize="10"
                    fontWeight="600"
                  >
                    ▼ {p.label || p.name}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* BFS / DFS Queue Tray */}
      {queueNodeIds.length > 0 && (
        <div className={styles.queueTray}>
          <span className={styles.queueLabel}>Queue / Frontier:</span>
          <div className={styles.queueItems}>
            {queueNodeIds.map((id, index) => (
              <span key={`${id}-${index}`} className={styles.queueBadge}>
                {nodes.find((n) => n.id === id)?.label || id}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
