import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionContext } from 'next-auth/react';
import { PremiumGate } from '../app/components/premium/PremiumGate';
import { listProblems, getProblem } from '../lib/services/problem.service';
import type { Problem } from '@visucode/shared-types';

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

const mockFreeProblem: Problem = {
  slug: 'two-sum-sorted',
  title: 'Two Sum II',
  difficulty: 'Easy',
  category: 'array',
  patterns: ['two-pointers'],
  companies: ['Amazon'],
  description: 'Find two numbers that add up to target.',
  examples: [{ input: 'numbers = [2,7,11,15], target = 9', output: '[1,2]' }],
  constraints: ['2 <= numbers.length <= 3 * 10^4'],
  hints: ['Use two pointers.'],
  starterCode: { javascript: 'function twoSum() {}' },
  testCases: [],
  solutions: [
    {
      language: 'javascript',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeComplexityWhy: 'Single pass with two pointers.',
      spaceComplexityWhy: 'No extra memory.',
      complexityClass: 'linear',
      explanation: 'Move pointers inward.',
      code: 'function twoSum() {}',
    },
  ],
  dryRunSteps: [],
  realWorldUseCases: [],
  externalLinks: [],
  accessLevel: 'free',
};

const mockPremiumProblem: Problem = {
  ...mockFreeProblem,
  slug: 'trapping-rain-water',
  title: 'Trapping Rain Water',
  difficulty: 'Hard',
  accessLevel: 'premium',
};

describe('Phase 3 Sprint 3 — Premium UI & Problem Gating (F-P3S3-01, F-P3S3-02)', () => {
  describe('Problem Catalog & Service Access Filtering', () => {
    it('marks a small, explicit set of problems accessLevel: premium in PROBLEM_INDEX', () => {
      const allProblems = listProblems();
      const premiumProblems = listProblems({ accessLevel: 'premium' });
      const freeProblems = listProblems({ accessLevel: 'free' });

      expect(premiumProblems.length).toBe(3);
      expect(premiumProblems.map((p) => p.slug)).toEqual(
        expect.arrayContaining([
          'trapping-rain-water',
          'minimum-window-substring',
          'longest-common-subsequence',
        ])
      );

      // Verify free problems exclude premium problems
      expect(freeProblems.length).toBe(allProblems.length - 3);
      expect(freeProblems.map((p) => p.slug)).not.toContain('trapping-rain-water');
    });

    it('preserves dual-write consistency between PROBLEM_INDEX and problem JSON files', async () => {
      const premiumSlugs = [
        'trapping-rain-water',
        'minimum-window-substring',
        'longest-common-subsequence',
      ];

      for (const slug of premiumSlugs) {
        const problem = await getProblem(slug);
        expect(problem).not.toBeNull();
        expect(problem?.accessLevel).toBe('premium');
      }

      // Check a representative free problem
      const freeProblem = await getProblem('two-sum-sorted');
      expect(freeProblem?.accessLevel).toBe('free');
    });
  });

  describe('PremiumGate Component Lifecycle & Honesty (F-P3S3-02)', () => {
    it('renders workspace directly for free problems without any gate banner', () => {
      renderWithSession(
        <PremiumGate problem={mockFreeProblem}>
          <div data-testid="test-workspace">Workspace Active</div>
        </PremiumGate>,
        null,
        'unauthenticated'
      );

      expect(screen.getByTestId('test-workspace')).toBeTruthy();
      expect(screen.queryByTestId('premium-gate-card')).toBeNull();
    });

    it('renders honest client-side preview gate for premium problems when signed out (no 404, no fake checkout)', () => {
      renderWithSession(
        <PremiumGate problem={mockPremiumProblem}>
          <div data-testid="test-workspace">Workspace Active</div>
        </PremiumGate>,
        null,
        'unauthenticated'
      );

      // Problem is gated, not 404
      expect(screen.getByTestId('premium-gate-card')).toBeTruthy();
      expect(screen.queryByTestId('test-workspace')).toBeNull();

      // Honest disclaimer check (F-P3S3-02)
      const notice = screen.getByTestId('premium-preview-notice');
      expect(notice.textContent).toContain('Client-Side Architecture Preview (Phase 3 Sprint 3)');
      expect(notice.textContent).toContain('Phase 4 with the PostgreSQL backend');
      expect(notice.textContent).toContain('no fake checkout');

      // Verify sign in CTA is visible for signed-out users
      expect(screen.getByTestId('premium-signin-btn')).toBeTruthy();
      expect(screen.getByTestId('premium-preview-unlock')).toBeTruthy();
    });

    it('allows unlocking the preview on the client to inspect gated visualizer and code runner', () => {
      renderWithSession(
        <PremiumGate problem={mockPremiumProblem}>
          <div data-testid="test-workspace">Workspace Active</div>
        </PremiumGate>,
        null,
        'unauthenticated'
      );

      // Click Unlock preview button
      const unlockBtn = screen.getByTestId('premium-preview-unlock');
      fireEvent.click(unlockBtn);

      // Workspace becomes visible alongside preview banner
      expect(screen.getByTestId('test-workspace')).toBeTruthy();
      expect(screen.getByTestId('premium-unlocked-banner')).toBeTruthy();
      expect(screen.getByTestId('premium-unlocked-banner').textContent).toContain(
        'Premium Architecture Preview'
      );

      // Can re-lock gate
      const relockBtn = screen.getByTestId('premium-relock-btn');
      fireEvent.click(relockBtn);
      expect(screen.queryByTestId('test-workspace')).toBeNull();
      expect(screen.getByTestId('premium-gate-card')).toBeTruthy();
    });

    it('hides the sign in button when user is already authenticated but preserves preview unlock', () => {
      const mockSession = {
        user: { id: 'usr-123', name: 'Tester', email: 'test@visucode.dev' },
        expires: '2099-01-01',
      };

      renderWithSession(
        <PremiumGate problem={mockPremiumProblem}>
          <div data-testid="test-workspace">Workspace Active</div>
        </PremiumGate>,
        mockSession,
        'authenticated'
      );

      // Already signed in -> sign in button not shown
      expect(screen.queryByTestId('premium-signin-btn')).toBeNull();
      // Unlock button available
      expect(screen.getByTestId('premium-preview-unlock')).toBeTruthy();
    });
  });
});
