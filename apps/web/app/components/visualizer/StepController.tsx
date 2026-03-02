'use client';

// ============================================
// Step Controller — Play/Pause/Speed Controls
// ============================================
// Connected to the Zustand visualizer store
// Used in problem detail pages and dry run mode

import { useEffect, useRef, useCallback } from 'react';
import { useVisualizerStore } from '../../../lib/stores';
import styles from './StepController.module.css';

interface StepControllerProps {
  totalSteps: number;
  accentColor?: string;
  onStepChange?: (step: number) => void;
}

export function StepController({
  totalSteps,
  accentColor = '#6366f1',
  onStepChange,
}: StepControllerProps) {
  const {
    currentStep,
    isPlaying,
    speed,
    setStep,
    nextStep,
    prevStep,
    togglePlay,
    setSpeed,
    reset,
  } = useVisualizerStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize store with total steps
  useEffect(() => {
    reset(totalSteps);
  }, [totalSteps, reset]);

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      const ms = 1000 / speed;
      intervalRef.current = setInterval(() => {
        nextStep();
      }, ms);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, nextStep]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
        case 'h':
          e.preventDefault();
          prevStep();
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'r':
          e.preventDefault();
          reset(totalSteps);
          break;
      }
    },
    [nextStep, prevStep, togglePlay, reset, totalSteps]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const speedOptions = [0.5, 1, 1.5, 2, 3];
  const progressPercent = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div className={styles.controller} role="toolbar" aria-label="Visualizer controls">
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercent}%`, background: accentColor }}
        />
        {/* Clickable step markers */}
        {Array.from({ length: totalSteps }).map((_, i) => (
          <button
            key={i}
            className={`${styles.stepMarker} ${i <= currentStep ? styles.stepMarkerActive : ''}`}
            style={{
              left: `${totalSteps > 1 ? (i / (totalSteps - 1)) * 100 : 0}%`,
              background: i <= currentStep ? accentColor : undefined,
            }}
            onClick={() => setStep(i)}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>

      {/* Controls row */}
      <div className={styles.controlsRow}>
        {/* Left: Step info */}
        <span className={styles.stepInfo}>
          Step {currentStep + 1} / {totalSteps}
        </span>

        {/* Center: Playback buttons */}
        <div className={styles.playbackButtons}>
          <button
            onClick={() => reset(totalSteps)}
            className={styles.controlBtn}
            aria-label="Reset to start"
            title="Reset (R)"
          >
            ⏮
          </button>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={styles.controlBtn}
            aria-label="Previous step"
            title="Previous (← or H)"
          >
            ⏪
          </button>
          <button
            onClick={togglePlay}
            className={`${styles.controlBtn} ${styles.playBtn}`}
            style={{ borderColor: accentColor }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title="Play/Pause (Space)"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={nextStep}
            disabled={currentStep === totalSteps - 1}
            className={styles.controlBtn}
            aria-label="Next step"
            title="Next (→ or L)"
          >
            ⏩
          </button>
        </div>

        {/* Right: Speed selector */}
        <div className={styles.speedSelector}>
          {speedOptions.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`${styles.speedBtn} ${speed === s ? styles.speedBtnActive : ''}`}
              style={speed === s ? { background: accentColor, borderColor: accentColor } : undefined}
              aria-label={`Set speed to ${s}x`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
