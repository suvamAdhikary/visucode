import React from 'react';
import type { StackQueueVisualizerState } from '@visucode/shared-types';
import styles from './StackQueueVisualizer.module.css';

interface StackQueueVisualizerProps {
  state: StackQueueVisualizerState;
}

export const StackQueueVisualizer: React.FC<StackQueueVisualizerProps> = ({ state }) => {
  const { type, items, highlightIndices = [] } = state;

  const formatValue = (val: string | number) => {
    if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
      return val.slice(1, -1);
    }
    return typeof val === 'string' ? val : JSON.stringify(val);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{type === 'stack' ? 'Stack' : 'Queue'}</h3>
      <div className={`${styles.structure} ${type === 'stack' ? styles.stack : styles.queue}`}>
        {items.length === 0 ? (
          <div className={styles.empty}>Empty</div>
        ) : (
          items.map((item, idx) => {
            const isHighlighted = highlightIndices.includes(idx);
            
            return (
              <div 
                key={`${item}-${idx}`} 
                className={`${styles.item} ${isHighlighted ? styles.highlighted : ''}`}
              >
                {formatValue(item)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
