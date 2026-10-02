import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TrackProgressBar } from '../app/learn/[track]/TrackProgressBar';
import { LessonViewer } from '../app/learn/[track]/[slug]/LessonViewer';
import {
  getProgress,
  markLessonComplete,
  resetProgress,
  isLessonCompleted,
  _clearCacheForTesting,
} from '../lib/services/progress.service';
import type { Lesson } from '@visucode/shared-types';

describe('Learning Progress Integration (Phase 3 Sprint 1, LessonViewer & TrackProgressBar)', () => {
  beforeEach(() => {
    localStorage.clear();
    _clearCacheForTesting();
    resetProgress();
    jest.clearAllMocks();
  });

  describe('TrackProgressBar', () => {
    const slugs = ['lesson-1', 'lesson-2', 'lesson-3'];

    it('renders initial state with 0 completed lessons', () => {
      render(<TrackProgressBar lessonSlugs={slugs} trackColor="#06b6d4" />);

      const text = screen.getByText('0 / 3 completed');
      expect(text).toBeTruthy();

      const progressBar = screen.getByTestId('track-progress-bar');
      const fill = progressBar.querySelector('[style*="width"]');
      expect(fill?.getAttribute('style')).toContain('width: 0%');
    });

    it('reactively updates progress when lessons are completed and uncompleted', () => {
      const { rerender } = render(<TrackProgressBar lessonSlugs={slugs} trackColor="#06b6d4" />);

      act(() => {
        markLessonComplete('lesson-1');
      });

      rerender(<TrackProgressBar lessonSlugs={slugs} trackColor="#06b6d4" />);
      expect(screen.getByText('1 / 3 completed')).toBeTruthy();

      act(() => {
        markLessonComplete('lesson-2');
        markLessonComplete('lesson-3');
      });

      rerender(<TrackProgressBar lessonSlugs={slugs} trackColor="#06b6d4" />);
      expect(screen.getByText('3 / 3 completed')).toBeTruthy();
    });
  });

  describe('LessonViewer (Completion Wiring)', () => {
    const conceptLessonWithoutExercise: Lesson = {
      slug: 'intro-concept',
      title: 'Introduction Concept',
      track: 'arrays',
      order: 1,
      type: 'concept',
      accessLevel: 'free',
      animationSteps: [
        {
          visual: {
            type: 'array',
            array: { elements: [10, 20, 30] },
          },
          caption: 'Step 1: Welcome to arrays',
          durationMs: 2000,
        },
        {
          visual: {
            type: 'array',
            array: { elements: [10, 20, 30], highlightIndices: [0] },
          },
          caption: 'Step 2: Index 0 is the start',
          durationMs: 2000,
        },
        {
          visual: {
            type: 'array',
            array: { elements: [10, 20, 30], highlightIndices: [0, 1, 2] },
          },
          caption: 'Step 3: Array overview complete',
          durationMs: 2000,
        },
      ],
    };

    const lessonWithMiniExercise: Lesson = {
      slug: 'quiz-lesson',
      title: 'Quiz Lesson',
      track: 'arrays',
      order: 2,
      type: 'visual',
      accessLevel: 'free',
      animationSteps: [
        {
          visual: {
            type: 'array',
            array: { elements: [42, 17] },
          },
          caption: 'Step 1: Array setup',
          durationMs: 2000,
        },
        {
          visual: {
            type: 'array',
            array: { elements: [42, 17] },
          },
          caption: 'Step 2: Question Time',
          durationMs: 2000,
        },
      ],
      miniExercise: {
        type: 'choose-option',
        question: 'What is the index of the first item in an array?',
        correctAnswer: '0',
        options: ['0', '1', '-1'],
        hint: 'Arrays are 0-indexed.',
        visualState: {
          type: 'array',
          array: { elements: [42, 17] },
        },
      },
    };

    it('completes lesson automatically upon reaching the final animation step when no mini-exercise exists', () => {
      render(
        <LessonViewer
          lesson={conceptLessonWithoutExercise}
          trackSlug="arrays"
          trackColor="#06b6d4"
        />
      );

      expect(isLessonCompleted('intro-concept')).toBe(false);
      expect(screen.getByText('Step 1 of 3')).toBeTruthy();
      expect(screen.getByText('Step 1: Welcome to arrays')).toBeTruthy();

      // Advance from Step 1 -> Step 2
      const nextBtn = screen.getByRole('button', { name: /next step/i });
      act(() => {
        fireEvent.click(nextBtn);
      });
      expect(screen.getByText('Step 2 of 3')).toBeTruthy();
      expect(screen.getByText('Step 2: Index 0 is the start')).toBeTruthy();
      expect(isLessonCompleted('intro-concept')).toBe(false);

      // Advance from Step 2 -> Step 3 (final step)
      act(() => {
        fireEvent.click(nextBtn);
      });
      expect(screen.getByText('Step 3 of 3')).toBeTruthy();
      expect(screen.getByText('Step 3: Array overview complete')).toBeTruthy();

      // Assert completion triggered
      expect(isLessonCompleted('intro-concept')).toBe(true);
      const progress = getProgress();
      expect(progress.completedLessons).toContain('intro-concept');
      expect(progress.currentTrack).toBe('arrays');
      expect(progress.currentLesson).toBe(1);

      // Verify going back with previous step button
      const prevBtn = screen.getByRole('button', { name: /previous step/i });
      act(() => {
        fireEvent.click(prevBtn);
      });
      expect(screen.getByText('Step 2 of 3')).toBeTruthy();

      // Verify jumping to step 1 via step dot button
      const step1Dot = screen.getByRole('button', { name: /go to step 1/i });
      act(() => {
        fireEvent.click(step1Dot);
      });
      expect(screen.getByText('Step 1 of 3')).toBeTruthy();
    });

    it('requires solving mini-exercise on final step before marking lesson complete', () => {
      render(
        <LessonViewer
          lesson={lessonWithMiniExercise}
          trackSlug="arrays"
          trackColor="#06b6d4"
        />
      );

      expect(isLessonCompleted('quiz-lesson')).toBe(false);
      expect(screen.getByText('Step 1 of 2')).toBeTruthy();
      expect(screen.getByText('Step 1: Array setup')).toBeTruthy();

      // Advance to final step (Step 2)
      const nextBtn = screen.getByRole('button', { name: /next step/i });
      act(() => {
        fireEvent.click(nextBtn);
      });
      expect(screen.getByText('Step 2 of 2')).toBeTruthy();
      expect(screen.getByText('Step 2: Question Time')).toBeTruthy();

      // Reaching final step alone does NOT complete the lesson because mini-exercise is required
      expect(isLessonCompleted('quiz-lesson')).toBe(false);

      // Mini-exercise should now be visible
      expect(screen.getByText('🎯 Quick Check')).toBeTruthy();
      expect(screen.getByText('What is the index of the first item in an array?')).toBeTruthy();

      // Pick wrong answer '1'
      const wrongBtn = screen.getByRole('button', { name: '1' });
      act(() => {
        fireEvent.click(wrongBtn);
      });
      expect(isLessonCompleted('quiz-lesson')).toBe(false);

      // Pick correct answer '0'
      const correctBtn = screen.getByRole('button', { name: '0' });
      act(() => {
        fireEvent.click(correctBtn);
      });

      // Assert completion and track position updated
      expect(isLessonCompleted('quiz-lesson')).toBe(true);
      const progress = getProgress();
      expect(progress.completedLessons).toContain('quiz-lesson');
      expect(progress.currentTrack).toBe('arrays');
      expect(progress.currentLesson).toBe(2);
    });
  });
});
