'use client';

import React, { useMemo } from 'react';
import type { TrieVisualizerState, TrieNode, Pointer } from '@visucode/shared-types';
import styles from './TrieVisualizer.module.css';

interface TrieVisualizerProps {
  trieState: TrieVisualizerState;
  pointers?: Pointer[];
  accentColor?: string;
}

export const TrieVisualizer: React.FC<TrieVisualizerProps> = ({
  trieState,
  pointers = [],
  accentColor = '#a855f7',
}) => {
  const { nodes = [], rootId, activeNodeId, matchedPrefix } = trieState;

  const nodeMap = useMemo(() => {
    const map = new Map<string, TrieNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const rootNode = nodeMap.get(rootId) || nodes[0];

  // Recursive renderer for Trie subtrees
  const renderSubtree = (nodeId: string, depth: number = 0): React.ReactNode => {
    const node = nodeMap.get(nodeId);
    if (!node) return null;

    const isActive = node.id === activeNodeId;
    const isWordEnd = node.isEndOfWord;
    const isRoot = node.id === rootId || node.char === '' || node.char.toUpperCase() === 'ROOT';
    const childIds = Object.values(node.childrenIds || {});
    const nodePointers = pointers.filter((p) => p.targetId === node.id);

    let circleClass = styles.nodeCircle;
    if (isActive) circleClass += ` ${styles.nodeActive}`;
    if (isWordEnd) circleClass += ` ${styles.nodeWordEnd}`;

    return (
      <div key={node.id} className={styles.nodeCard}>
        {nodePointers.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            {nodePointers.map((p) => (
              <span key={p.name} style={{ color: p.color || accentColor, fontSize: '0.7rem', fontWeight: 600 }}>
                {p.label || p.name}
              </span>
            ))}
          </div>
        )}
        <div
          className={circleClass}
          style={isActive ? { borderColor: accentColor, boxShadow: `0 0 12px ${accentColor}50` } : undefined}
          title={isWordEnd ? 'End of Word (isEndOfWord = true)' : undefined}
        >
          <span>{isRoot ? '•' : node.char}</span>
          {isWordEnd && <span className={styles.wordEndBadge}>✓</span>}
        </div>

        {childIds.length > 0 && (
          <div className={styles.childrenRow}>
            {childIds.map((childId) => renderSubtree(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 600 }}>Trie (Prefix Tree)</span>
          {matchedPrefix !== undefined && (
            <div className={styles.prefixBanner} style={{ borderColor: accentColor }}>
              <span>Matched:</span>
              <span className={styles.prefixCode}>"{matchedPrefix}"</span>
            </div>
          )}
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dotActive} style={{ backgroundColor: accentColor }} />
            <span>Active</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dotEnd} />
            <span>End of Word</span>
          </div>
        </div>
      </div>

      <div className={styles.trieArea}>
        {rootNode ? (
          <div className={styles.treeContainer}>{renderSubtree(rootNode.id)}</div>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 'auto' }}>
            Empty Trie
          </div>
        )}
      </div>
    </div>
  );
};
