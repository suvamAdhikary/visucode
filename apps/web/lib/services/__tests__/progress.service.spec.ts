import {
  getProgress,
  markProblemComplete,
  unmarkProblemComplete,
  isProblemCompleted,
  markLessonComplete,
  unmarkLessonComplete,
  isLessonCompleted,
  setCurrentTrack,
  resetProgress,
  subscribeProgress,
  invalidateProgressCache,
  getActiveUserId,
  setActiveUserId,
  clearActiveUserId,
  getProgressForUser,
  saveProgressForUser,
  mergeAnonymousProgress,
  hasStoredProgressForUser,
} from '../progress.service';
import { usePreferencesStore } from '../../stores/preferences.store';

describe('Progress Service (Phase 3 Sprint 1 & Sprint 2, F-P3S1-01, F-P3S2-02)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearActiveUserId();
    invalidateProgressCache();
    jest.clearAllMocks();
  });

  describe('Default & Initialization', () => {
    it('initializes with default state and generates a persistent anonymous userId', () => {
      const progress = getProgress();

      expect(progress).toBeDefined();
      expect(progress.userId).toBeTruthy();
      expect(typeof progress.userId).toBe('string');
      expect(progress.completedProblems).toEqual([]);
      expect(progress.completedLessons).toEqual([]);
      expect(progress.currentTrack).toBe('arrays');
      expect(progress.currentLesson).toBe(1);
      expect(progress.role).toBe('learner');
      expect(progress.preferences).toMatchObject({
        theme: 'dark',
        editorFontSize: 14,
        visualizerSpeed: 1,
        language: 'javascript',
      });

      // Assert visucode_uid was written to localStorage
      expect(localStorage.getItem('visucode_uid')).toBe(progress.userId);
    });

    it('re-uses the existing visucode_uid if already in localStorage', () => {
      const existingUid = 'test-uid-12345';
      localStorage.setItem('visucode_uid', existingUid);

      const progress = getProgress();
      expect(progress.userId).toBe(existingUid);
    });
  });

  describe('Problem Completion (Idempotency & Persistence, F-P3S1-02)', () => {
    it('marks a problem complete and persists to localStorage', () => {
      const updated = markProblemComplete('two-sum');

      expect(updated.completedProblems).toContain('two-sum');
      expect(isProblemCompleted('two-sum')).toBe(true);

      // Verify direct retrieval from getProgress() matches
      const current = getProgress();
      expect(current.completedProblems).toEqual(['two-sum']);
    });

    it('is strictly idempotent — multiple completions of the same slug do not create duplicates', () => {
      markProblemComplete('two-sum');
      markProblemComplete('two-sum');
      const final = markProblemComplete('two-sum');

      expect(final.completedProblems).toEqual(['two-sum']);
      expect(final.completedProblems.length).toBe(1);
    });

    it('accumulates multiple distinct completed problems without dropping previous ones', () => {
      markProblemComplete('two-sum');
      markProblemComplete('valid-parentheses');
      markProblemComplete('merge-intervals');

      const current = getProgress();
      expect(current.completedProblems).toEqual([
        'two-sum',
        'valid-parentheses',
        'merge-intervals',
      ]);
      expect(isProblemCompleted('two-sum')).toBe(true);
      expect(isProblemCompleted('valid-parentheses')).toBe(true);
      expect(isProblemCompleted('merge-intervals')).toBe(true);
      expect(isProblemCompleted('binary-search')).toBe(false);
    });

    it('survives simulated page refresh / service re-initialization and directly verifies localStorage persistence', () => {
      markProblemComplete('two-sum');
      markProblemComplete('lru-cache');

      const uid = getProgress().userId;
      const storageKey = `visucode_progress_${uid}`;

      // 1. Explicitly assert the raw value in localStorage (proves persistence in save path)
      const rawInStorage = localStorage.getItem(storageKey);
      expect(rawInStorage).toBeTruthy();
      const parsedInStorage = JSON.parse(rawInStorage!);
      expect(parsedInStorage.completedProblems).toEqual(['two-sum', 'lru-cache']);

      // 2. Clear in-memory cache completely to simulate page reload / unmount
      invalidateProgressCache();

      // 3. Cold call to getProgress() must read & deserialize from localStorage
      const reloaded = getProgress();
      expect(reloaded.completedProblems).toContain('two-sum');
      expect(reloaded.completedProblems).toContain('lru-cache');
      expect(reloaded.completedProblems.length).toBe(2);
    });

    it('trims whitespace and rejects empty/invalid slugs safely', () => {
      markProblemComplete('  two-sum  ');
      expect(isProblemCompleted('two-sum')).toBe(true);

      const initialCount = getProgress().completedProblems.length;
      // Invalid inputs must be safe no-ops
      markProblemComplete('');
      markProblemComplete('   ');
      // @ts-expect-error testing invalid input runtime safety
      markProblemComplete(null);
      // @ts-expect-error testing invalid input runtime safety
      markProblemComplete(undefined);

      expect(getProgress().completedProblems.length).toBe(initialCount);
    });

    it('unmarks a completed problem correctly', () => {
      markProblemComplete('two-sum');
      markProblemComplete('valid-parentheses');

      const afterUnmark = unmarkProblemComplete('two-sum');
      expect(afterUnmark.completedProblems).toEqual(['valid-parentheses']);
      expect(isProblemCompleted('two-sum')).toBe(false);
      expect(isProblemCompleted('valid-parentheses')).toBe(true);

      // Unmarking a non-existent slug is a safe no-op
      const noOp = unmarkProblemComplete('non-existent');
      expect(noOp.completedProblems).toEqual(['valid-parentheses']);
    });
  });

  describe('Lesson Completion', () => {
    it('marks lessons complete idempotently and allows unmarking', () => {
      markLessonComplete('array-basics');
      markLessonComplete('array-basics');
      markLessonComplete('two-pointers-intro');

      expect(isLessonCompleted('array-basics')).toBe(true);
      expect(isLessonCompleted('two-pointers-intro')).toBe(true);
      expect(getProgress().completedLessons).toEqual(['array-basics', 'two-pointers-intro']);

      unmarkLessonComplete('array-basics');
      expect(isLessonCompleted('array-basics')).toBe(false);
      expect(isLessonCompleted('two-pointers-intro')).toBe(true);
    });
  });

  describe('Track & Lesson Navigation', () => {
    it('sets current track and lesson number', () => {
      const updated = setCurrentTrack('trees', 3);
      expect(updated.currentTrack).toBe('trees');
      expect(updated.currentLesson).toBe(3);

      expect(getProgress().currentTrack).toBe('trees');
      expect(getProgress().currentLesson).toBe(3);
    });
  });

  describe('Reset Progress', () => {
    it('resets completions while preserving userId and preferences', () => {
      markProblemComplete('two-sum');
      markLessonComplete('intro');
      setCurrentTrack('graphs', 4);

      const originalUid = getProgress().userId;
      const reset = resetProgress();

      expect(reset.userId).toBe(originalUid);
      expect(reset.completedProblems).toEqual([]);
      expect(reset.completedLessons).toEqual([]);
      expect(reset.currentTrack).toBe('arrays');
      expect(reset.currentLesson).toBe(1);

      // Verify it persisted
      expect(getProgress().completedProblems).toEqual([]);
    });
  });

  describe('Error Recovery & Corrupt Storage Resilience', () => {
    it('recovers gracefully if localStorage contains corrupted JSON', () => {
      const uid = 'corrupt-test-uid';
      localStorage.setItem('visucode_uid', uid);
      localStorage.setItem(`visucode_progress_${uid}`, '{{malformed json');

      const progress = getProgress();
      expect(progress).toBeDefined();
      expect(progress.completedProblems).toEqual([]);
      expect(progress.userId).toBe(uid);
    });

    it('sanitizes non-array or corrupt fields in stored progress', () => {
      const uid = 'bad-fields-uid';
      localStorage.setItem('visucode_uid', uid);
      localStorage.setItem(
        `visucode_progress_${uid}`,
        JSON.stringify({
          userId: uid,
          completedProblems: 'not-an-array',
          completedLessons: null,
        })
      );

      const progress = getProgress();
      expect(Array.isArray(progress.completedProblems)).toBe(true);
      expect(progress.completedProblems).toEqual([]);
      expect(Array.isArray(progress.completedLessons)).toBe(true);
      expect(progress.completedLessons).toEqual([]);
    });
  });

  describe('Event Subscriptions', () => {
    it('notifies subscribers on problem completion, unmarking, and reset', () => {
      const callback = jest.fn();
      const unsubscribe = subscribeProgress(callback);

      markProblemComplete('two-sum');
      expect(callback).toHaveBeenCalledTimes(1);

      unmarkProblemComplete('two-sum');
      expect(callback).toHaveBeenCalledTimes(2);

      resetProgress();
      expect(callback).toHaveBeenCalledTimes(3);

      unsubscribe();
      markProblemComplete('binary-search');
      // Should not call after unsubscribe
      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('Preferences Single Source of Truth & Cache Invalidation', () => {
    it('invalidates cache with invalidateProgressCache()', () => {
      markProblemComplete('two-sum');
      expect(getProgress().completedProblems).toContain('two-sum');

      invalidateProgressCache();
      expect(getProgress().completedProblems).toContain('two-sum');
    });

    it('keeps preferences solely in visucode-preferences and does not store redundant duplicate in progress JSON', () => {
      // Initialize progress in localStorage
      getProgress();
      const uid = getProgress().userId;
      const storageKey = `visucode_progress_${uid}`;

      // Verify that progress storage ONLY contains progress fields, not preferences
      const raw = localStorage.getItem(storageKey);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.preferences).toBeUndefined();
      expect(parsed.userId).toBe(uid);
      expect(Array.isArray(parsed.completedProblems)).toBe(true);

      // Verify that preferences are dynamically populated from usePreferencesStore
      expect(getProgress().preferences).toBeDefined();
      expect(getProgress().preferences.theme).toBe('dark');

      // Update preference in Zustand
      usePreferencesStore.getState().setTheme('light');
      usePreferencesStore.getState().setEditorFontSize(18);

      // Verify getProgress() returns the live updated preferences without writing duplicate data to progress key
      expect(getProgress().preferences.theme).toBe('light');
      expect(getProgress().preferences.editorFontSize).toBe(18);
      const rawAfter = localStorage.getItem(storageKey);
      expect(JSON.parse(rawAfter!).preferences).toBeUndefined();

      // Reset back to dark for other tests
      usePreferencesStore.getState().setTheme('dark');
      usePreferencesStore.getState().setEditorFontSize(14);
    });
  });

  describe('Identity & Lossless Account Merge (F-P3S2-02)', () => {
    it('sets and clears active authenticated user ID', () => {
      const anonId = getActiveUserId();
      expect(anonId).toBeTruthy();

      setActiveUserId('auth-user-gh-42');
      expect(getActiveUserId()).toBe('auth-user-gh-42');
      expect(getProgress().userId).toBe('auth-user-gh-42');

      clearActiveUserId();
      expect(getActiveUserId()).toBe(anonId);
      expect(getProgress().userId).toBe(anonId);
    });

    it('performs a lossless union merge from anonymous progress to an authenticated account (F-P3S2-02 test proof)', () => {
      // 1. Solve 2 problems anonymously
      markProblemComplete('two-sum');
      markProblemComplete('reverse-linked-list');
      markLessonComplete('array-basics');

      const anonId = getActiveUserId();
      const anonProgress = getProgress();
      expect(anonProgress.completedProblems).toEqual(['two-sum', 'reverse-linked-list']);
      expect(anonProgress.completedLessons).toEqual(['array-basics']);

      // 2. Pre-seed authenticated account with 1 existing completed problem
      const authUserId = 'github|998877';
      saveProgressForUser(authUserId, {
        userId: authUserId,
        completedProblems: ['valid-anagram'],
        completedLessons: ['hash-map-intro'],
        currentTrack: 'two-pointers',
        currentLesson: 3,
        role: 'learner',
        preferences: {
          theme: 'dark',
          editorFontSize: 16,
          visualizerSpeed: 1.5,
          language: 'python',
        },
      });

      // 3. Perform login & merge
      const merged = mergeAnonymousProgress(authUserId);

      // Verify merged result is a lossless union
      expect(merged.userId).toBe(authUserId);
      expect(merged.completedProblems).toContain('two-sum');
      expect(merged.completedProblems).toContain('reverse-linked-list');
      expect(merged.completedProblems).toContain('valid-anagram');
      expect(merged.completedProblems.length).toBe(3);

      expect(merged.completedLessons).toContain('array-basics');
      expect(merged.completedLessons).toContain('hash-map-intro');
      expect(merged.completedLessons.length).toBe(2);

      // Verify active user is now the authenticated user
      expect(getActiveUserId()).toBe(authUserId);
      expect(getProgress().completedProblems.length).toBe(3);

      // Crucial requirement: Verify anonymous storage was NOT wiped (lossless guarantee)
      const anonAfterMerge = getProgressForUser(anonId);
      expect(anonAfterMerge.completedProblems).toEqual(['two-sum', 'reverse-linked-list']);
      expect(anonAfterMerge.completedLessons).toEqual(['array-basics']);
    });

    it('is strictly idempotent — merging multiple times does not duplicate completed items', () => {
      markProblemComplete('two-sum');
      const authUserId = 'google|123456';

      mergeAnonymousProgress(authUserId);
      const firstMerge = getProgress();
      expect(firstMerge.completedProblems).toEqual(['two-sum']);

      // Merge second time
      mergeAnonymousProgress(authUserId);
      const secondMerge = getProgress();
      expect(secondMerge.completedProblems).toEqual(['two-sum']);
      expect(secondMerge.completedProblems.length).toBe(1);
    });

    it('handles empty or blank authenticated user IDs safely without corrupting state', () => {
      markProblemComplete('binary-search');
      const current = getProgress();

      const res1 = mergeAnonymousProgress('');
      expect(res1.completedProblems).toEqual(current.completedProblems);

      const res2 = mergeAnonymousProgress('   ');
      expect(res2.completedProblems).toEqual(current.completedProblems);
    });

    it('preserves anonymous currentTrack (e.g. trees) when logging into a brand new account (ADR-004)', () => {
      // Anonymous user switches track to trees and advances to lesson 3
      setCurrentTrack('trees', 3);
      expect(getProgress().currentTrack).toBe('trees');
      expect(getProgress().currentLesson).toBe(3);

      const newAuthId = 'github|brand-new-user-123';
      expect(hasStoredProgressForUser(newAuthId)).toBe(false);

      const merged = mergeAnonymousProgress(newAuthId);

      // Anonymous track and lesson must win because authenticated user has not set one
      expect(merged.currentTrack).toBe('trees');
      expect(merged.currentLesson).toBe(3);
      expect(getProgress().currentTrack).toBe('trees');
      expect(hasStoredProgressForUser(newAuthId)).toBe(true);
    });

    it('preserves authenticated user track if the account already had stored progress', () => {
      // Pre-seed authenticated account on hashing track
      const existingAuthId = 'google|existing-user-456';
      saveProgressForUser(existingAuthId, {
        userId: existingAuthId,
        completedProblems: ['two-sum'],
        completedLessons: ['hashing-1'],
        currentTrack: 'hashing',
        currentLesson: 2,
        role: 'learner',
        preferences: {} as any,
      });
      expect(hasStoredProgressForUser(existingAuthId)).toBe(true);

      // Anonymous user is on trees track
      setCurrentTrack('trees', 1);

      const merged = mergeAnonymousProgress(existingAuthId);

      // Authenticated account track wins because it was explicitly set
      expect(merged.currentTrack).toBe('hashing');
      expect(merged.currentLesson).toBe(2);
    });
  });
});

