'use client';

import { useState, useCallback } from 'react';
import type { Lesson } from '@visucode/shared-types';
import styles from './page.module.css';

interface LessonViewerProps {
  lesson: Lesson;
  trackSlug: string;
  trackColor: string;
}

export function LessonViewer({ lesson, trackColor }: LessonViewerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = lesson.animationSteps.length;
  const step = lesson.animationSteps[currentStep];

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback((index: number) => {
    setCurrentStep(index);
  }, []);

  // Get array state from current step
  const arrayState = step?.visual?.array;
  const pointers = step?.visual?.pointers ?? [];

  return (
    <div className={styles.viewer}>
      {/* Lesson Title */}
      <h1 className={styles.lessonTitle}>{lesson.title}</h1>

      {/* Visualization Area */}
      <div className={styles.vizArea}>
        {/* Array Visualization */}
        {arrayState && (
          <div className={styles.arrayViz}>
            <div className={styles.arrayElements}>
              {arrayState.elements.map((el, i) => {
                const isHighlighted =
                  arrayState.highlightIndices?.includes(i) ?? false;
                const pointer = pointers.find((p) => p.index === i);
                return (
                  <div key={i} className={styles.elementWrapper}>
                    {pointer && (
                      <div
                        className={styles.pointer}
                        style={{ color: pointer.color }}
                      >
                        {pointer.label ?? pointer.name}
                      </div>
                    )}
                    <div
                      className={`${styles.element} ${
                        isHighlighted ? styles.elementHighlighted : ''
                      }`}
                      style={
                        isHighlighted
                          ? {
                              borderColor: pointer?.color ?? trackColor,
                              boxShadow: `0 0 12px ${pointer?.color ?? trackColor}40`,
                            }
                          : undefined
                      }
                    >
                      {el}
                    </div>
                    <div className={styles.indexLabel}>{i}</div>
                  </div>
                );
              })}
            </div>

            {/* Window indicator for sliding window */}
            {arrayState.windowStart !== undefined &&
              arrayState.windowEnd !== undefined && (
                <div
                  className={styles.windowIndicator}
                  style={{
                    left: `${arrayState.windowStart * 72}px`,
                    width: `${
                      (arrayState.windowEnd - arrayState.windowStart + 1) * 72
                    }px`,
                    borderColor: trackColor,
                  }}
                />
              )}
          </div>
        )}

        {/* Empty state when no array */}
        {!arrayState && (
          <div className={styles.emptyViz}>
            <span style={{ fontSize: '3rem' }}>📊</span>
            <p>Watch the visualization appear...</p>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className={styles.caption}>
        <p>{step?.caption}</p>
      </div>

      {/* Step Controls */}
      <div className={styles.controls}>
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="btn btn-secondary"
          aria-label="Previous step"
          id="lesson-step-prev"
        >
          ← Prev
        </button>

        <div className={styles.stepDots}>
          {lesson.animationSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={`${styles.stepDot} ${
                i === currentStep ? styles.stepDotActive : ''
              } ${i < currentStep ? styles.stepDotCompleted : ''}`}
              style={
                i === currentStep ? { background: trackColor } : undefined
              }
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentStep === totalSteps - 1}
          className="btn btn-primary"
          aria-label="Next step"
          id="lesson-step-next"
        >
          Next →
        </button>
      </div>

      {/* Step Counter */}
      <div className={styles.stepCounter}>
        Step {currentStep + 1} of {totalSteps}
      </div>

      {/* Mini Exercise (shown after animation) */}
      {lesson.miniExercise && currentStep === totalSteps - 1 && (
        <MiniExercise exercise={lesson.miniExercise} trackColor={trackColor} />
      )}
    </div>
  );
}

/* ============================================
   Mini Exercise Component
   ============================================ */

interface MiniExerciseProps {
  exercise: NonNullable<Lesson['miniExercise']>;
  trackColor: string;
}

function MiniExercise({ exercise, trackColor }: MiniExerciseProps) {
  const [answer, setAnswer] = useState<string | null>(null);
  const isCorrect = answer === exercise.correctAnswer;

  return (
    <div className={styles.exercise}>
      <h3 style={{ color: trackColor }}>🎯 Quick Check</h3>
      <p className={styles.exerciseQuestion}>{exercise.question}</p>

      {exercise.type === 'choose-option' && exercise.options && (
        <div className={styles.exerciseOptions}>
          {exercise.options.map((option) => (
            <button
              key={option}
              onClick={() => setAnswer(option)}
              className={`${styles.optionBtn} ${
                answer === option
                  ? isCorrect
                    ? styles.optionCorrect
                    : styles.optionWrong
                  : ''
              }`}
              disabled={answer !== null}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {exercise.type === 'click-element' && exercise.visualState?.array && (
        <div className={styles.exerciseArray}>
          {exercise.visualState.array.elements.map((el, i) => (
            <button
              key={i}
              onClick={() => setAnswer(String(el))}
              className={`${styles.element} ${styles.elementClickable} ${
                answer === String(el)
                  ? isCorrect
                    ? styles.optionCorrect
                    : styles.optionWrong
                  : ''
              }`}
              disabled={answer !== null}
            >
              {el}
            </button>
          ))}
        </div>
      )}

      {answer && (
        <div
          className={`${styles.feedback} ${
            isCorrect ? styles.feedbackCorrect : styles.feedbackWrong
          }`}
        >
          {isCorrect ? '✅ Correct!' : `❌ Not quite. ${exercise.hint ?? ''}`}
        </div>
      )}
    </div>
  );
}
