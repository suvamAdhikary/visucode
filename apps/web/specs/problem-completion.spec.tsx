import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ProblemCompletionToggle } from '../app/problems/[slug]/ProblemCompletionToggle';
import { ProblemCompletionBadge } from '../app/problems/ProblemCompletionBadge';
import { PatternProgressBadge } from '../app/patterns/PatternProgressBadge';
import { TestRunner } from '../app/components/editor/TestRunner';
import {
  getProgress,
  markProblemComplete,
  resetProgress,
} from '../lib/services/progress.service';
import { executeTests } from '../lib/utils/test-executor';

jest.mock('../lib/utils/test-executor', () => {
  const actual = jest.requireActual('../lib/utils/test-executor');
  return {
    ...actual,
    executeTests: jest.fn(),
  };
});

describe('Problem Completion Integration (Phase 3 Sprint 1, F-P3S1-01, F-P3S1-03)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetProgress();
    jest.clearAllMocks();
  });

  describe('ProblemCompletionToggle', () => {
    it('renders Mark as Done initially and toggles to Completed on click', () => {
      render(<ProblemCompletionToggle slug="two-sum" />);

      const button = screen.getByTestId('problem-completion-toggle');
      expect(button.textContent).toContain('Mark as Done');
      expect(button.getAttribute('aria-pressed')).toBe('false');

      // Click to complete
      act(() => {
        fireEvent.click(button);
      });

      expect(button.textContent).toContain('Completed');
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(getProgress().completedProblems).toContain('two-sum');

      // Click again to unmark
      act(() => {
        fireEvent.click(button);
      });

      expect(button.textContent).toContain('Mark as Done');
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(getProgress().completedProblems).not.toContain('two-sum');
    });

    it('mounts in completed state if problem was already solved', () => {
      markProblemComplete('two-sum');

      render(<ProblemCompletionToggle slug="two-sum" />);

      const button = screen.getByTestId('problem-completion-toggle');
      expect(button.textContent).toContain('Completed');
      expect(button.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('ProblemCompletionBadge', () => {
    it('renders null when problem is not solved, and badge when solved', () => {
      const { container, rerender } = render(<ProblemCompletionBadge slug="two-sum" />);
      expect(container.firstChild).toBeNull();

      // Mark complete
      act(() => {
        markProblemComplete('two-sum');
      });

      rerender(<ProblemCompletionBadge slug="two-sum" />);
      expect(screen.getByTestId('completion-badge-two-sum')).toBeTruthy();
      expect(screen.getByText('Solved')).toBeTruthy();
    });
  });

  describe('PatternProgressBadge', () => {
    it('displays solved counts reactively as problems are completed', () => {
      const slugs = ['two-sum', '3sum', 'container-with-most-water'];
      const { rerender } = render(<PatternProgressBadge problemSlugs={slugs} />);

      expect(screen.getByText('0/3 solved')).toBeTruthy();

      // Complete one problem
      act(() => {
        markProblemComplete('two-sum');
      });

      rerender(<PatternProgressBadge problemSlugs={slugs} />);
      expect(screen.getByText('1/3 solved')).toBeTruthy();

      // Complete all remaining
      act(() => {
        markProblemComplete('3sum');
        markProblemComplete('container-with-most-water');
      });

      rerender(<PatternProgressBadge problemSlugs={slugs} />);
      expect(screen.getByText('3/3 solved')).toBeTruthy();
    });
  });

  describe('TestRunner Auto-Completion', () => {
    it('automatically marks problem as complete when all test cases pass', async () => {
      const mockTestCases = [
        { id: '1', input: '[2,7,11,15], 9', expected: '[0,1]' },
      ];

      (executeTests as jest.Mock).mockResolvedValueOnce({
        totalTests: 1,
        totalPassed: 1,
        totalFailed: 0,
        overallTimeMs: 12,
        results: [
          {
            id: '1',
            input: '[2,7,11,15], 9',
            expected: '[0,1]',
            actual: '[0,1]',
            passed: true,
            executionTimeMs: 12,
          },
        ],
      });

      render(
        <TestRunner
          code="function twoSum() { return [0, 1]; }"
          starterCode="function twoSum(nums, target) {}"
          testCases={mockTestCases}
          problemSlug="two-sum"
        />
      );

      const runBtn = screen.getByRole('button', { name: /run tests/i });
      fireEvent.click(runBtn);

      await waitFor(() => {
        expect(screen.getByText(/All 1 tests passed!/i)).toBeTruthy();
      });

      expect(getProgress().completedProblems).toContain('two-sum');
    });

    it('does not mark problem as complete if any test case fails', async () => {
      const mockTestCases = [
        { id: '1', input: '[2,7,11,15], 9', expected: '[0,1]' },
      ];

      (executeTests as jest.Mock).mockResolvedValueOnce({
        totalTests: 1,
        totalPassed: 0,
        totalFailed: 1,
        overallTimeMs: 10,
        results: [
          {
            id: '1',
            input: '[2,7,11,15], 9',
            expected: '[0,1]',
            actual: '[0,0]',
            passed: false,
            executionTimeMs: 10,
          },
        ],
      });

      render(
        <TestRunner
          code="function twoSum() { return [0, 0]; }"
          starterCode="function twoSum(nums, target) {}"
          testCases={mockTestCases}
          problemSlug="two-sum"
        />
      );

      const runBtn = screen.getByRole('button', { name: /run tests/i });
      fireEvent.click(runBtn);

      await waitFor(() => {
        expect(screen.getByText(/1\/1 failed/i)).toBeTruthy();
      });

      expect(getProgress().completedProblems).not.toContain('two-sum');
    });
  });
});
