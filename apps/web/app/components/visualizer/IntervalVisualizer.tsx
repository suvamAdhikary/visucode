import React from 'react';
import type { IntervalVisualizerState, IntervalItem } from '@visucode/shared-types';
import styles from './IntervalVisualizer.module.css';

interface IntervalVisualizerProps {
  state: IntervalVisualizerState;
}

export const IntervalVisualizer: React.FC<IntervalVisualizerProps> = ({ state }) => {
  const { intervals, rangeStart, rangeEnd } = state;

  // Determine actual bounds
  let minBound = rangeStart !== undefined ? rangeStart : 0;
  let maxBound = rangeEnd !== undefined ? rangeEnd : 10;

  if (intervals.length > 0) {
    if (rangeStart === undefined) minBound = Math.min(...intervals.map(i => i.start));
    if (rangeEnd === undefined) maxBound = Math.max(...intervals.map(i => i.end));
  }

  // Add a bit of padding to the bounds
  const span = Math.max(1, maxBound - minBound);
  const paddedMin = minBound - span * 0.1;
  const paddedMax = maxBound + span * 0.1;
  const totalSpan = paddedMax - paddedMin;

  const getPercentage = (val: number) => ((val - paddedMin) / totalSpan) * 100;

  // Compute vertical stacking (simple greedy coloring/layering)
  const stackedIntervals: (IntervalItem & { layer: number })[] = [];
  
  // Sort by start for stacking logic purely for display
  const sortedIntervals = [...intervals].sort((a, b) => a.start - b.start);
  
  sortedIntervals.forEach((interval) => {
    let layer = 0;
    while (true) {
      const overlap = stackedIntervals.find(
        (si) => si.layer === layer && Math.max(si.start, interval.start) < Math.min(si.end, interval.end)
      );
      if (!overlap) break;
      layer++;
    }
    stackedIntervals.push({ ...interval, layer });
  });

  // Calculate ticks
  const ticks = [];
  for (let i = Math.floor(paddedMin); i <= Math.ceil(paddedMax); i++) {
    ticks.push(i);
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Intervals</h3>
      <div className={styles.timeline}>
        {intervals.length === 0 ? (
          <div className={styles.empty}>No Intervals</div>
        ) : (
          <>
            {stackedIntervals.map((interval, idx) => (
              <div
                key={`${interval.id}-${idx}`}
                className={styles.interval}
                style={{
                  left: `${getPercentage(interval.start)}%`,
                  width: `${getPercentage(interval.end) - getPercentage(interval.start)}%`,
                  bottom: `${30 + interval.layer * 30}px`,
                  backgroundColor: interval.color || undefined,
                  zIndex: 10 + interval.layer,
                }}
              >
                [{interval.start}, {interval.end}]
              </div>
            ))}
            {ticks.map((tick) => (
              <React.Fragment key={`tick-${tick}`}>
                <div className={styles.axisTick} style={{ left: `${getPercentage(tick)}%` }} />
                <div className={styles.axisLabel} style={{ left: `${getPercentage(tick)}%` }}>
                  {tick}
                </div>
              </React.Fragment>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
