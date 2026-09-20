import React from 'react';
import type { HashMapVisualizerState } from '@visucode/shared-types';
import styles from './HashMapVisualizer.module.css';

interface HashMapVisualizerProps {
  state: HashMapVisualizerState;
}

export const HashMapVisualizer: React.FC<HashMapVisualizerProps> = ({ state }) => {
  const { entries, highlightKeys = [] } = state;

  // Helper to safely strip quotes from stringified values
  const formatValue = (val: string | number) => {
    if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
      return val.slice(1, -1);
    }
    return typeof val === 'string' ? val : JSON.stringify(val);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Hash Map</h3>
      <div className={styles.table}>
        <div className={`${styles.row} ${styles.headerRow}`}>
          <div className={styles.cell}>Key</div>
          <div className={styles.cell}>Value</div>
        </div>
        
        {entries.length === 0 ? (
          <div className={styles.emptyState}>Map is empty</div>
        ) : (
          entries.map((entry, idx) => {
            const isHighlighted = highlightKeys.includes(entry.key);
            
            return (
              <div 
                key={`${entry.key}-${idx}`} 
                className={`${styles.row} ${isHighlighted ? styles.highlightedRow : ''}`}
              >
                <div className={`${styles.cell} ${styles.keyCell}`}>
                  {formatValue(entry.key)}
                </div>
                <div className={styles.cell}>
                  {formatValue(entry.value)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
