import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProblemTabs } from '../app/problems/[slug]/ProblemTabs';
import type { Problem } from '@visucode/shared-types';

// Mock Next.js dynamic import for Monaco editor
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = (props: { code: string; onChange?: (val: string) => void }) => (
    <textarea
      data-testid="monaco-mock"
      value={props.code}
      onChange={(e) => props.onChange?.(e.target.value)}
    />
  );
  DynamicComponent.displayName = 'MockCodeEditor';
  return DynamicComponent;
});

// Mock CodeViewer within DryRunViewer
jest.mock('../app/components/editor/CodeViewer', () => ({
  CodeViewer: ({ code, activeLine }: { code: string; activeLine?: number }) => (
    <div data-testid="code-viewer-mock" data-active-line={activeLine}>
      {code}
    </div>
  ),
}));

const mockProblem: Problem = {
  slug: 'two-sum',
  title: 'Two Sum',
  difficulty: 'Easy',
  category: 'hash-map',
  patterns: ['hash-map'],
  companies: ['Google'],
  description: 'Find two numbers that add up to target',
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
  ],
  constraints: ['2 <= nums.length <= 10^4'],
  hints: ['Use a hash map'],
  realWorldUseCases: [],
  starterCode: {
    javascript: 'function twoSum(nums, target) {\n  let diff = target - nums[0];\n  return [0, 1];\n}',
  },
  solutions: [
    {
      language: 'javascript',
      code: 'function twoSum(nums, target) {\n  const map = new Map();\n  return [0, 1];\n}',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
    },
  ],
  testCases: [
    {
      id: '1',
      input: '[[2,7,11,15], 9]',
      expected: '[0,1]',
    },
  ],
  dryRunSteps: [
    {
      stepIndex: 0,
      line: 1,
      explanation: 'Authored Step 1: Initialize hash map',
      variables: [{ name: 'map', value: '{}' }],
      arrayState: {
        elements: [2, 7, 11, 15],
        highlightedIndices: [0],
        pointers: [{ name: 'i', index: 0, color: '#6366f1' }],
      },
    },
    {
      stepIndex: 1,
      line: 2,
      explanation: 'Authored Step 2: Found pair',
      variables: [{ name: 'diff', value: '7' }],
      arrayState: {
        elements: [2, 7, 11, 15],
        highlightedIndices: [0, 1],
        pointers: [{ name: 'i', index: 1, color: '#6366f1' }],
      },
    },
  ],
};

describe('ProblemTabs — Three Surfaces and F-LDR-S3-03', () => {
  it('renders all three tabs with badges and defaults to Official Dry Run', () => {
    render(<ProblemTabs problem={mockProblem} />);

    // Tab buttons
    const officialTab = screen.getByRole('tab', { name: /official dry run/i });
    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    const codeTab = screen.getByRole('tab', { name: /your code/i });

    expect(officialTab).toBeTruthy();
    expect(liveTab).toBeTruthy();
    expect(codeTab).toBeTruthy();

    expect(officialTab.getAttribute('aria-selected')).toBe('true');
    expect(liveTab.getAttribute('aria-selected')).toBe('false');
    expect(codeTab.getAttribute('aria-selected')).toBe('false');

    // Badges
    expect(screen.getByText('Live')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();

    // Default view is Official Dry Run rendering authored JSON explanation
    expect(screen.getByText('Authored Step 1: Initialize hash map')).toBeTruthy();
  });

  it('switches between Official Dry Run, Live Dry Run, and Code tabs', () => {
    render(<ProblemTabs problem={mockProblem} />);

    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    expect(liveTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/ready to dry run your code/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /run dry run/i })).toBeTruthy();

    const codeTab = screen.getByRole('tab', { name: /your code/i });
    fireEvent.click(codeTab);

    expect(codeTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/solution\.js/i)).toBeTruthy();

    const officialTab = screen.getByRole('tab', { name: /official dry run/i });
    fireEvent.click(officialTab);

    expect(officialTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Authored Step 1: Initialize hash map')).toBeTruthy();
  });

  it('preserves authored JSON dryRunSteps untouched (F-LDR-S3-03)', async () => {
    // Deep clone problem to track mutations
    const problemCopy = JSON.parse(JSON.stringify(mockProblem));
    const originalStepsJson = JSON.stringify(problemCopy.dryRunSteps);

    render(<ProblemTabs problem={problemCopy} />);

    // Switch to Live Dry Run
    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    // Live tab initialized with starter code and testCase input
    const inputField = screen.getByTitle(/execution input arguments/i) as HTMLInputElement;
    expect(inputField.value).toBe('[[2,7,11,15], 9]');

    // Execute Live Dry Run
    const runBtn = screen.getByRole('button', { name: /run dry run/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚡ live dry run/i)).toBeTruthy();
    });

    // F-LDR-S3-03: authored JSON problem.dryRunSteps must NOT have been mutated
    expect(JSON.stringify(problemCopy.dryRunSteps)).toBe(originalStepsJson);

    // Switch back to Official Dry Run tab
    const officialTab = screen.getByRole('tab', { name: /official dry run/i });
    fireEvent.click(officialTab);

    // Official Dry Run still renders authored JSON content
    expect(screen.getByText('Authored Step 1: Initialize hash map')).toBeTruthy();
  });

  it('rejects oversized inputs at preflight in Live Dry Run tab (F-LDR-S1-08)', () => {
    render(<ProblemTabs problem={mockProblem} />);

    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    const inputField = screen.getByTitle(/execution input arguments/i);
    const oversizedArray = JSON.stringify([new Array(30).fill(1)]);

    fireEvent.change(inputField, { target: { value: oversizedArray } });

    const runBtn = screen.getByRole('button', { name: /run dry run/i });
    fireEvent.click(runBtn);

    // Preflight diagnostic banner displayed
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/exceeds dry-run limit of 16/i)).toBeTruthy();
  });

  it('resets user modifications in Live Dry Run tab on clicking reset', () => {
    render(<ProblemTabs problem={mockProblem} />);

    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    const inputField = screen.getByTitle(/execution input arguments/i) as HTMLInputElement;
    fireEvent.change(inputField, { target: { value: '[[1, 2], 3]' } });
    expect(inputField.value).toBe('[[1, 2], 3]');

    const resetBtn = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetBtn);

    expect(inputField.value).toBe('[[2,7,11,15], 9]');
  });
});
