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

let activeUserId: string | null = null;

/**
 * Returns the currently active userId (either authenticated or anonymous).
 */
export function getActiveUserId(): string {
  return activeUserId || (typeof window !== 'undefined' ? getUserId() : 'server');
}

/**
 * Switches the active progress context to an authenticated user or back to anonymous.
 */
export function setActiveUserId(userId: string | null): void {
  activeUserId = userId;
  invalidateProgressCache();
  notifySubscribers();
}

/**
 * Clears the authenticated user context, reverting to anonymous mode.
 */
export function clearActiveUserId(): void {
  setActiveUserId(null);
}

function getStorageKey(userId?: string): string {
  const id = userId || getActiveUserId();
  return `${PROGRESS_KEY_PREFIX}${id}`;
}

function getDefaultProgress(userId?: string): UserProgress {
  return {
    userId: userId || getActiveUserId(),
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
 * Invalidates the in-memory progress snapshot cache.
 * Call when storage is updated externally, upon session changes, or in tests.
 */
export function invalidateProgressCache(): void {
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
      invalidateProgressCache();
      notifySubscribers();
    }
  });

  // Reactively update in-memory snapshot and notify subscribers when editor preferences change
  usePreferencesStore.subscribe(() => {
    if (cachedProgress) {
      cachedProgress = {
        ...cachedProgress,
        preferences: getLivePreferences(),
      };
      notifySubscribers();
    }
  });
}

interface StoredProgressData {
  userId: string;
  completedProblems: string[];
  completedLessons: string[];
  currentTrack: string;
  currentLesson: number;
  role: UserProgress['role'];
}

function saveProgressToStorage(progress: UserProgress): void {
  saveProgressForUser(getActiveUserId(), progress);
}

/**
 * Reads and parses stored progress for a specific user ID.
 */
export function getProgressForUser(userId: string): UserProgress {
  if (typeof window === 'undefined') {
    return { ...SERVER_DEFAULT_PROGRESS, userId };
  }

  const key = `${PROGRESS_KEY_PREFIX}${userId}`;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch (err) {
    logger.warn('progress.read_error', { key, error: String(err) });
  }

  if (!raw) {
    return getDefaultProgress(userId);
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      userId: typeof parsed?.userId === 'string' && parsed.userId ? parsed.userId : userId,
      completedProblems: Array.isArray(parsed?.completedProblems)
        ? Array.from(
            new Set<string>(
              parsed.completedProblems.filter(
                (p: unknown): p is string => typeof p === 'string' && p.trim().length > 0
              )
            )
          )
        : [],
      completedLessons: Array.isArray(parsed?.completedLessons)
        ? Array.from(
            new Set<string>(
              parsed.completedLessons.filter(
                (l: unknown): l is string => typeof l === 'string' && l.trim().length > 0
              )
            )
          )
        : [],
      currentTrack: typeof parsed?.currentTrack === 'string' ? parsed.currentTrack : 'arrays',
      currentLesson: typeof parsed?.currentLesson === 'number' ? parsed.currentLesson : 1,
      role: parsed?.role || 'learner',
      preferences: getLivePreferences(),
    };
  } catch {
    return getDefaultProgress(userId);
  }
}

/**
 * Saves progress for a specific user ID directly to storage.
 */
export function saveProgressForUser(userId: string, progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    const dataToStore: StoredProgressData = {
      userId: progress.userId || userId,
      completedProblems: progress.completedProblems,
      completedLessons: progress.completedLessons,
      currentTrack: progress.currentTrack,
      currentLesson: progress.currentLesson,
      role: progress.role,
    };
    const raw = JSON.stringify(dataToStore);
    localStorage.setItem(`${PROGRESS_KEY_PREFIX}${userId}`, raw);
    if (userId === getActiveUserId()) {
      cachedRawString = raw;
      cachedProgress = progress;
    }
  } catch (err) {
    logger.error('progress.save_error', err instanceof Error ? err : String(err));
  }
}

/**
 * Lossless union merge of anonymous progress into an authenticated user account (F-P3S2-02).
 * Copies anonymous completedProblems and completedLessons onto the authenticated account.
 * Does NOT destroy or wipe the anonymous progress record.
 */
export function mergeAnonymousProgress(authenticatedUserId: string): UserProgress {
  if (!authenticatedUserId || typeof authenticatedUserId !== 'string' || authenticatedUserId.trim().length === 0) {
    return getProgress();
  }

  const cleanAuthId = authenticatedUserId.trim();
  const anonId = getUserId();

  if (cleanAuthId === anonId) {
    setActiveUserId(cleanAuthId);
    return getProgress();
  }

  const anonProgress = getProgressForUser(anonId);
  const authProgress = getProgressForUser(cleanAuthId);

  const mergedProblems = Array.from(
    new Set([...anonProgress.completedProblems, ...authProgress.completedProblems])
  );
  const mergedLessons = Array.from(
    new Set([...anonProgress.completedLessons, ...authProgress.completedLessons])
  );

  const merged: UserProgress = {
    userId: cleanAuthId,
    completedProblems: mergedProblems,
    completedLessons: mergedLessons,
    currentTrack: authProgress.currentTrack || anonProgress.currentTrack || 'arrays',
    currentLesson: Math.max(authProgress.currentLesson || 1, anonProgress.currentLesson || 1),
    role: authProgress.role || anonProgress.role || 'learner',
    preferences: getLivePreferences(),
  };

  saveProgressForUser(cleanAuthId, merged);
  setActiveUserId(cleanAuthId);

  logger.info('progress.account_merged', {
    anonymousId: anonId,
    authenticatedUserId: cleanAuthId,
    totalProblems: merged.completedProblems.length,
    totalLessons: merged.completedLessons.length,
  });

  notifySubscribers();
  return merged;
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
      userId: typeof parsed?.userId === 'string' && parsed.userId ? parsed.userId : getActiveUserId(),
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
