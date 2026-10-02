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
  _clearCacheForTesting,
} from '../progress.service';

describe('Progress Service (Phase 3 Sprint 1, F-P3S1-01, F-P3S1-02)', () => {
  beforeEach(() => {
    localStorage.clear();
    _clearCacheForTesting();
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
      _clearCacheForTesting();

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
});
