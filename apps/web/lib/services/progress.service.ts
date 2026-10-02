'use client';

// ============================================
// Progress Service — Anonymous User Progress
// ============================================
// Encapsulates all progress read/write operations (F-P3S1-01).
// Components must never access localStorage directly.
// Keyed by anonymous visucode_uid from logger.ts.

import { useSyncExternalStore } from 'react';
import type { UserProgress, UserPreferences } from '@visucode/shared-types';
import { getUserId, logger } from '../logger';
import { usePreferencesStore } from '../stores/preferences.store';

const PROGRESS_KEY_PREFIX = 'visucode_progress_';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  editorFontSize: 14,
  visualizerSpeed: 1,
  language: 'javascript',
};

function getLivePreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  try {
    const state = usePreferencesStore.getState();
    return {
      theme: state.theme ?? 'dark',
      editorFontSize: state.editorFontSize ?? 14,
      visualizerSpeed: state.visualizerSpeed ?? 1,
      language: (state.language === 'python' ? 'python' : 'javascript') as 'javascript' | 'python',
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

const SERVER_DEFAULT_PROGRESS: UserProgress = {
  userId: 'server',
  completedProblems: [],
  completedLessons: [],
  currentTrack: 'arrays',
  currentLesson: 1,
  role: 'learner',
  preferences: DEFAULT_PREFERENCES,
};

function getStorageKey(): string {
  return `${PROGRESS_KEY_PREFIX}${getUserId()}`;
}

function getDefaultProgress(userId?: string): UserProgress {
  return {
    userId: userId || (typeof window !== 'undefined' ? getUserId() : 'server'),
    completedProblems: [],
    completedLessons: [],
    currentTrack: 'arrays',
    currentLesson: 1,
    role: 'learner',
    preferences: getLivePreferences(),
  };
}

// In-memory cache for referential stability with useSyncExternalStore
let cachedRawString: string | null = null;
let cachedProgress: UserProgress | null = null;
const listeners = new Set<() => void>();

/**
 * Clears in-memory snapshot cache. Used in tests to simulate fresh page load.
 */
export function _clearCacheForTesting(): void {
  cachedRawString = null;
  cachedProgress = null;
}

function notifySubscribers() {
  listeners.forEach((callback) => {
    try {
      callback();
    } catch (e) {
      logger.error('progress.subscriber_callback_error', e instanceof Error ? e : String(e));
    }
  });

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('visucode:progress-updated'));
    } catch {
      // Safe no-op in non-standard test runners
    }
  }
}

// Cross-tab and window event listener setup (only in browser environment)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith(PROGRESS_KEY_PREFIX)) {
      cachedRawString = null;
      cachedProgress = null;
      notifySubscribers();
    }
  });
}

function saveProgressToStorage(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(progress);
    localStorage.setItem(getStorageKey(), raw);
    cachedRawString = raw;
    cachedProgress = progress;
  } catch (err) {
    logger.error('progress.save_error', err instanceof Error ? err : String(err));
  }
}

/**
 * Returns current user progress. Safe in SSR and resilient against corrupt storage.
 */
export function getProgress(): UserProgress {
  if (typeof window === 'undefined') {
    return SERVER_DEFAULT_PROGRESS;
  }

  const key = getStorageKey();
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch (err) {
    logger.warn('progress.read_error', { key, error: String(err) });
  }

  // Return referentially stable cached snapshot if storage hasn't changed
  if (raw === cachedRawString && cachedProgress !== null) {
    return cachedProgress;
  }

  if (!raw) {
    const defaultData = getDefaultProgress();
    saveProgressToStorage(defaultData);
    return defaultData;
  }

  try {
    const parsed = JSON.parse(raw);
    const sanitized: UserProgress = {
      userId: typeof parsed?.userId === 'string' && parsed.userId ? parsed.userId : getUserId(),
      completedProblems: Array.isArray(parsed?.completedProblems)
        ? Array.from(new Set<string>(parsed.completedProblems.filter((p: unknown): p is string => typeof p === 'string' && p.trim().length > 0)))
        : [],
      completedLessons: Array.isArray(parsed?.completedLessons)
        ? Array.from(new Set<string>(parsed.completedLessons.filter((l: unknown): l is string => typeof l === 'string' && l.trim().length > 0)))
        : [],
      currentTrack: typeof parsed?.currentTrack === 'string' ? parsed.currentTrack : 'arrays',
      currentLesson: typeof parsed?.currentLesson === 'number' ? parsed.currentLesson : 1,
      role: parsed?.role || 'learner',
      preferences: getLivePreferences(),
    };

    cachedRawString = raw;
    cachedProgress = sanitized;
    return sanitized;
  } catch {
    // If corrupted JSON exists, reset safely to default without throwing
    const defaultData = getDefaultProgress();
    saveProgressToStorage(defaultData);
    return defaultData;
  }
}

/**
 * Marks a problem as completed. Idempotent and validates slug.
 */
export function markProblemComplete(slug: string): UserProgress {
  if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
    return getProgress();
  }

  const cleanSlug = slug.trim();
  const current = getProgress();

  if (current.completedProblems.includes(cleanSlug)) {
    return current;
  }

  const updated: UserProgress = {
    ...current,
    completedProblems: [...current.completedProblems, cleanSlug],
  };

  saveProgressToStorage(updated);
  logger.info('progress.problem_completed', { slug: cleanSlug, total: updated.completedProblems.length });
  notifySubscribers();
  return updated;
}

/**
 * Unmarks a problem as completed.
 */
export function unmarkProblemComplete(slug: string): UserProgress {
  if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
    return getProgress();
  }

  const cleanSlug = slug.trim();
  const current = getProgress();

  if (!current.completedProblems.includes(cleanSlug)) {
    return current;
  }

  const updated: UserProgress = {
    ...current,
    completedProblems: current.completedProblems.filter((s) => s !== cleanSlug),
  };

  saveProgressToStorage(updated);
  logger.info('progress.problem_unmarked', { slug: cleanSlug, total: updated.completedProblems.length });
  notifySubscribers();
  return updated;
}

/**
 * Checks if a problem is completed.
 */
export function isProblemCompleted(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  return getProgress().completedProblems.includes(slug.trim());
}

/**
 * Marks a lesson as completed. Idempotent.
 */
export function markLessonComplete(slug: string): UserProgress {
  if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
    return getProgress();
  }

  const cleanSlug = slug.trim();
  const current = getProgress();

  if (current.completedLessons.includes(cleanSlug)) {
    return current;
  }

  const updated: UserProgress = {
    ...current,
    completedLessons: [...current.completedLessons, cleanSlug],
  };

  saveProgressToStorage(updated);
  logger.info('progress.lesson_completed', { slug: cleanSlug, total: updated.completedLessons.length });
  notifySubscribers();
  return updated;
}

/**
 * Unmarks a lesson as completed.
 */
export function unmarkLessonComplete(slug: string): UserProgress {
  if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
    return getProgress();
  }

  const cleanSlug = slug.trim();
  const current = getProgress();

  if (!current.completedLessons.includes(cleanSlug)) {
    return current;
  }

  const updated: UserProgress = {
    ...current,
    completedLessons: current.completedLessons.filter((s) => s !== cleanSlug),
  };

  saveProgressToStorage(updated);
  logger.info('progress.lesson_unmarked', { slug: cleanSlug, total: updated.completedLessons.length });
  notifySubscribers();
  return updated;
}

/**
 * Checks if a lesson is completed.
 */
export function isLessonCompleted(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  return getProgress().completedLessons.includes(slug.trim());
}

/**
 * Sets current track and lesson.
 */
export function setCurrentTrack(track: string, lessonNumber = 1): UserProgress {
  const current = getProgress();
  const updated: UserProgress = {
    ...current,
    currentTrack: track,
    currentLesson: lessonNumber,
  };
  saveProgressToStorage(updated);
  notifySubscribers();
  return updated;
}

/**
 * Resets user progress completions while preserving userId and preferences.
 */
export function resetProgress(): UserProgress {
  const current = getProgress();
  const reset: UserProgress = {
    ...getDefaultProgress(current.userId),
    preferences: getLivePreferences(),
  };
  saveProgressToStorage(reset);
  logger.info('progress.reset', { userId: reset.userId });
  notifySubscribers();
  return reset;
}

/**
 * Subscribes to progress changes across components and storage events.
 */
export function subscribeProgress(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * React hook to reactively subscribe to UserProgress without SSR hydration mismatches.
 */
export function useUserProgress(): UserProgress {
  return useSyncExternalStore(
    subscribeProgress,
    getProgress,
    () => SERVER_DEFAULT_PROGRESS
  );
}
