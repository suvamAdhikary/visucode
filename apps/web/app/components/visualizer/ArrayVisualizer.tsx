'use client';

// ============================================
// Array Visualizer — Core Visualization Component
// ============================================
// DOM-based (not canvas) for Phase 1:
// - Accessible (screen readers can read elements)
// - Lighter bundle than canvas lib
// - CSS animations are GPU-accelerated
// Phase 5: Rust → WASM canvas for 1000+ elements

import { useEffect, useRef } from 'react';
import type { ArrayVisualizerState, Pointer } from '@visucode/shared-types';
import { useVisualizerStore } from '../../lib/stores';
import styles from './ArrayVisualizer.module.css';

interface ArrayVisualizerProps {
  arrayState: ArrayVisualizerState;
  pointers?: Pointer[];
  accentColor?: string;
  showIndices?: boolean;
  animateChanges?: boolean;
}

export function ArrayVisualizer({
  arrayState,
  pointers = [],
  accentColor = '#6366f1',
  showIndices = true,
  animateChanges = true,
}: ArrayVisualizerProps) {
  const prevElementsRef = useRef<(number | string)[]>([]);
  const { isPlaying, speed } = useVisualizerStore();

  // Track which elements changed for animation
  const prevElements = prevElementsRef.current;
  const changedIndices = new Set<number>();
  if (animateChanges && prevElements.length > 0) {
    arrayState.elements.forEach((el, i) => {
      if (prevElements[i] !== el) changedIndices.add(i);
    });
  }

  useEffect(() => {
    prevElementsRef.current = [...arrayState.elements];
  }, [arrayState.elements]);

  // Determine element state
  const getElementState = (index: number) => {
    const isHighlighted = arrayState.highlightIndices?.includes(index) ?? false;
    const isCompareLeft = arrayState.compareIndices?.[0] === index;
    const isCompareRight = arrayState.compareIndices?.[1] === index;
    const isSwapLeft = arrayState.swapIndices?.[0] === index;
    const isSwapRight = arrayState.swapIndices?.[1] === index;
    const isInWindow =
      arrayState.windowStart !== undefined &&
      arrayState.windowEnd !== undefined &&
      index >= arrayState.windowStart &&
      index <= arrayState.windowEnd;
    const isInSortedRegion =
      arrayState.sortedRegion &&
      index >= arrayState.sortedRegion.start &&
      index <= arrayState.sortedRegion.end;
    const pointer = pointers.find((p) => p.index === index);
    const hasChanged = changedIndices.has(index);

    return {
      isHighlighted,
      isCompareLeft,
      isCompareRight,
      isSwapLeft,
      isSwapRight,
      isInWindow,
      isInSortedRegion,
      pointer,
      hasChanged,
    };
  };

  const animDuration = `${300 / speed}ms`;

  return (
    <div
      className={styles.visualizer}
      role="img"
      aria-label={`Array visualization: [${arrayState.elements.join(', ')}]`}
    >
      {/* Pointer labels (top) */}
      <div className={styles.pointerRow}>
        {arrayState.elements.map((_, i) => {
          const state = getElementState(i);
          return (
            <div key={`ptr-${i}`} className={styles.pointerSlot}>
              {state.pointer && (
                <span
                  className={styles.pointerLabel}
                  style={{
                    color: state.pointer.color,
                    animationDuration: animDuration,
                  }}
                  aria-label={`Pointer ${state.pointer.name} at index ${i}`}
                >
                  {state.pointer.label ?? state.pointer.name}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Array elements */}
      <div className={styles.arrayRow}>
        {arrayState.elements.map((el, i) => {
          const state = getElementState(i);

          let className = styles.element;
          if (state.isHighlighted) className += ` ${styles.highlighted}`;
          if (state.isCompareLeft || state.isCompareRight)
            className += ` ${styles.comparing}`;
          if (state.isSwapLeft || state.isSwapRight)
            className += ` ${styles.swapping}`;
          if (state.isInWindow) className += ` ${styles.inWindow}`;
          if (state.isInSortedRegion) className += ` ${styles.sorted}`;
          if (state.hasChanged) className += ` ${styles.changed}`;

          const borderColor = state.pointer?.color ?? (state.isHighlighted ? accentColor : undefined);

          return (
            <div
              key={`el-${i}`}
              className={className}
              style={{
                borderColor,
                boxShadow: state.isHighlighted
                  ? `0 0 16px ${borderColor}40`
                  : undefined,
                animationDuration: animDuration,
              }}
              aria-label={`Index ${i}: value ${el}`}
            >
              {el}
            </div>
          );
        })}
      </div>

      {/* Window indicator */}
      {arrayState.windowStart !== undefined &&
        arrayState.windowEnd !== undefined && (
          <div className={styles.windowRow}>
            <div
              className={styles.windowBracket}
              style={{
                marginLeft: `${arrayState.windowStart * 72}px`,
                width: `${(arrayState.windowEnd - arrayState.windowStart + 1) * 72 - 8}px`,
                borderColor: accentColor,
              }}
            />
          </div>
        )}

      {/* Index labels (bottom) */}
      {showIndices && (
        <div className={styles.indexRow}>
          {arrayState.elements.map((_, i) => (
            <div key={`idx-${i}`} className={styles.indexLabel}>
              {i}
            </div>
          ))}
        </div>
      )}

      {/* Pointer arrows (bottom) */}
      <div className={styles.pointerRow}>
        {arrayState.elements.map((_, i) => {
          const state = getElementState(i);
          return (
            <div key={`arrow-${i}`} className={styles.pointerSlot}>
              {state.pointer && (
                <span
                  className={styles.pointerArrow}
                  style={{ color: state.pointer.color }}
                  aria-hidden="true"
                >
                  ↑
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
