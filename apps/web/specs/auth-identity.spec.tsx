import React from 'react';
import { render, screen } from '@testing-library/react';
import { SessionContext } from 'next-auth/react';
import { Navbar } from '../app/components/layout/Navbar';
import { ProfileClient } from '../app/profile/ProfileClient';
import { AuthMergeSync } from '../app/components/auth/AuthMergeSync';
import {
  getProgress,
  markProblemComplete,
  markLessonComplete,
  getActiveUserId,
  clearActiveUserId,
  saveProgressForUser,
  getProgressForUser,
  mergeAnonymousProgress,
  invalidateProgressCache,
  setCurrentTrack,
  hasStoredProgressForUser,
} from '../lib/services/progress.service';

// Helper to provide controlled session context
function renderWithSession(
  ui: React.ReactElement,
  sessionData: any = null,
  status: 'authenticated' | 'unauthenticated' | 'loading' = 'unauthenticated'
) {
  const sessionContextValue = {
    data: sessionData,
    status,
    update: jest.fn().mockResolvedValue(sessionData),
  };

  return render(
    <SessionContext.Provider value={sessionContextValue as any}>
      {ui}
    </SessionContext.Provider>
  );
}

describe('Auth.js v5 Identity & Account Merge (Phase 3 Sprint 2, F-P3S2-01, F-P3S2-02, F-P3S2-03)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearActiveUserId();
    invalidateProgressCache();
    jest.clearAllMocks();
  });

  describe('F-P3S2-02: Lossless Anonymous Merge Engine', () => {
    it('proves the quality flag requirement: complete 2 problems signed out → sign in → still 2', () => {
      // 1. User starts signed out (anonymous mode)
      const anonId = getActiveUserId();
      expect(anonId).toBeTruthy();

      // Solve 2 problems anonymously
      markProblemComplete('two-sum');
      markProblemComplete('reverse-linked-list');

      const anonProgress = getProgress();
      expect(anonProgress.completedProblems).toEqual(['two-sum', 'reverse-linked-list']);

      // 2. User signs in with GitHub
      const authUserId = 'github|dev-user-789';
      const merged = mergeAnonymousProgress(authUserId);

      // Verify active user progress contains both solved problems
      expect(merged.userId).toBe(authUserId);
      expect(merged.completedProblems).toContain('two-sum');
      expect(merged.completedProblems).toContain('reverse-linked-list');
      expect(merged.completedProblems.length).toBe(2);

      // Verify active session progress still returns 2 problems
      expect(getProgress().completedProblems).toEqual(['two-sum', 'reverse-linked-list']);

      // 3. Verify anonymous record was NOT wiped from localStorage
      const anonStored = getProgressForUser(anonId);
      expect(anonStored.completedProblems).toEqual(['two-sum', 'reverse-linked-list']);
    });

    it('performs a union merge with pre-existing account progress without data loss', () => {
      const anonId = getActiveUserId();
      markProblemComplete('two-sum');
      markLessonComplete('arrays-intro');

      // Pre-seed authenticated account
      const authUserId = 'google|scholar-456';
      saveProgressForUser(authUserId, {
        userId: authUserId,
        completedProblems: ['valid-anagram', 'group-anagrams'],
        completedLessons: ['hashing-deep-dive'],
        currentTrack: 'hashing',
        currentLesson: 2,
        role: 'learner',
        preferences: {
          theme: 'light',
          editorFontSize: 16,
          visualizerSpeed: 1.5,
          language: 'python',
        },
      });

      // Merge
      const merged = mergeAnonymousProgress(authUserId);

      // Verify union: 1 anonymous + 2 existing = 3 problems
      expect(merged.completedProblems).toEqual(
        expect.arrayContaining(['two-sum', 'valid-anagram', 'group-anagrams'])
      );
      expect(merged.completedProblems.length).toBe(3);

      // Verify lessons union: 1 anonymous + 1 existing = 2 lessons
      expect(merged.completedLessons).toEqual(
        expect.arrayContaining(['arrays-intro', 'hashing-deep-dive'])
      );
      expect(merged.completedLessons.length).toBe(2);

      // Verify anonymous progress was retained (lossless guarantee)
      const anonStored = getProgressForUser(anonId);
      expect(anonStored.completedProblems).toEqual(['two-sum']);
      expect(anonStored.completedLessons).toEqual(['arrays-intro']);
    });

    it('ensures anonymous active track (e.g. trees) wins on first login when auth account has not set one (ADR-004)', () => {
      // User explores trees track anonymously
      setCurrentTrack('trees', 4);
      expect(getProgress().currentTrack).toBe('trees');
      expect(getProgress().currentLesson).toBe(4);

      const newUserId = 'github|first-time-logger-999';
      expect(hasStoredProgressForUser(newUserId)).toBe(false);

      const merged = mergeAnonymousProgress(newUserId);

      // Verify trees track and lesson 4 win over default 'arrays'
      expect(merged.currentTrack).toBe('trees');
      expect(merged.currentLesson).toBe(4);
      expect(getProgress().currentTrack).toBe('trees');
      expect(getProgress().currentLesson).toBe(4);
    });
  });

  describe('Navbar Auth State Rendering', () => {
    it('renders Sign In button when user is unauthenticated', () => {
      renderWithSession(<Navbar />, null, 'unauthenticated');

      const signInBtn = screen.getByRole('button', { name: /sign in/i });
      expect(signInBtn).toBeTruthy();
      expect(signInBtn.id).toBe('nav-auth-signin');
      expect(screen.queryByRole('button', { name: /sign out/i })).toBeNull();
    });

    it('renders user profile avatar and Sign Out button when user is authenticated', () => {
      const mockSession = {
        user: {
          id: 'user-gh-123',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          image: 'https://example.com/avatar.png',
        },
        expires: '2099-01-01',
      };

      renderWithSession(<Navbar />, mockSession, 'authenticated');

      expect(screen.getByTestId('navbar-user-session')).toBeTruthy();
      expect(screen.getByText('Ada')).toBeTruthy();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeTruthy();
      expect(screen.queryByRole('button', { name: /sign in/i })).toBeNull();
    });
  });

  describe('Profile Page Auth State Rendering', () => {
    it('renders Anonymous Mode badge and Sign In to Sync CTA when unauthenticated', () => {
      renderWithSession(<ProfileClient allProblems={[]} patterns={[]} />, null, 'unauthenticated');

      expect(screen.getByTestId('profile-anon-badge').textContent).toBe('Anonymous Mode');
      expect(screen.getByTestId('profile-sync-anon')).toBeTruthy();
      expect(screen.getByText(/Sign In to Sync/i)).toBeTruthy();
      expect(screen.queryByTestId('profile-auth-badge')).toBeNull();
    });

    it('renders Account Linked badge, user identity, and Sign Out button when authenticated', () => {
      const mockSession = {
        user: {
          id: 'user-gh-456',
          name: 'Alan Turing',
          email: 'alan@visucode.dev',
          image: 'https://example.com/alan.png',
        },
        expires: '2099-01-01',
      };

      renderWithSession(
        <ProfileClient allProblems={[]} patterns={[]} />,
        mockSession,
        'authenticated'
      );

      expect(screen.getByText('Alan Turing')).toBeTruthy();
      expect(screen.getByTestId('profile-auth-badge').textContent).toContain('Account Linked');
      expect(screen.getByText('alan@visucode.dev')).toBeTruthy();
      expect(screen.getByTestId('profile-sync-auth')).toBeTruthy();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeTruthy();
    });
  });

  describe('AuthMergeSync Component Lifecycle', () => {
    it('automatically triggers progress merge when session transitions to authenticated', () => {
      markProblemComplete('two-sum');

      const mockSession = {
        user: {
          id: 'auto-user-777',
          name: 'Grace Hopper',
          email: 'grace@navy.mil',
        },
      };

      // Mount AuthMergeSync with authenticated session
      renderWithSession(<AuthMergeSync />, mockSession, 'authenticated');

      // Verify active user changed to authenticated user and completions retained
      expect(getActiveUserId()).toBe('auto-user-777');
      expect(getProgress().completedProblems).toContain('two-sum');
    });

    it('reverts active user to anonymous when session transitions to unauthenticated', () => {
      const anonId = getActiveUserId();

      // 1. Log in
      const mockSession = { user: { id: 'temp-user-999' } };
      const { rerender } = renderWithSession(<AuthMergeSync />, mockSession, 'authenticated');
      expect(getActiveUserId()).toBe('temp-user-999');

      // 2. Log out
      const unauthContext = {
        data: null,
        status: 'unauthenticated' as const,
        update: jest.fn(),
      };
      rerender(
        <SessionContext.Provider value={unauthContext as any}>
          <AuthMergeSync />
        </SessionContext.Provider>
      );

      expect(getActiveUserId()).toBe(anonId);
    });
  });
});
