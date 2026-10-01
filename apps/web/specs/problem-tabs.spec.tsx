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
  externalLinks: [],
  accessLevel: 'free',
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
      stepNumber: 0,
      line: 1,
      explanation: 'Authored Step 1: Initialize hash map',
      variables: [{ name: 'map', value: '{}', type: 'object' }],
      pointers: [{ name: 'i', index: 0, color: '#6366f1' }],
      arrayState: {
        elements: [2, 7, 11, 15],
        highlightIndices: [0],
      },
    },
    {
      stepNumber: 1,
      line: 2,
      explanation: 'Authored Step 2: Found pair',
      variables: [{ name: 'diff', value: '7', type: 'number' }],
      pointers: [{ name: 'i', index: 1, color: '#6366f1' }],
      arrayState: {
        elements: [2, 7, 11, 15],
        highlightIndices: [0, 1],
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

    // Verify pane visibility
    expect(screen.getByTestId('pane-official-dry-run').style.display).toBe('flex');
    expect(screen.getByTestId('pane-live-dry-run').style.display).toBe('none');
    expect(screen.getByTestId('pane-code').style.display).toBe('none');
  });

  it('switches between Official Dry Run, Live Dry Run, and Code tabs and toggles pane visibility', () => {
    render(<ProblemTabs problem={mockProblem} />);

    // Initial state
    expect(screen.getByTestId('pane-official-dry-run').style.display).toBe('flex');
    expect(screen.getByTestId('pane-live-dry-run').style.display).toBe('none');
    expect(screen.getByTestId('pane-code').style.display).toBe('none');

    // Switch to Live Dry Run
    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    expect(liveTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('pane-official-dry-run').style.display).toBe('none');
    expect(screen.getByTestId('pane-live-dry-run').style.display).toBe('flex');
    expect(screen.getByTestId('pane-code').style.display).toBe('none');
    expect(screen.getByText(/ready to dry run your code/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /run dry run/i })).toBeTruthy();

    // Switch to Code
    const codeTab = screen.getByRole('tab', { name: /your code/i });
    fireEvent.click(codeTab);

    expect(codeTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('pane-official-dry-run').style.display).toBe('none');
    expect(screen.getByTestId('pane-live-dry-run').style.display).toBe('none');
    expect(screen.getByTestId('pane-code').style.display).toBe('flex');
    expect(screen.getByText(/solution\.js/i)).toBeTruthy();

    // Switch back to Official Dry Run
    const officialTab = screen.getByRole('tab', { name: /official dry run/i });
    fireEvent.click(officialTab);

    expect(officialTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('pane-official-dry-run').style.display).toBe('flex');
    expect(screen.getByTestId('pane-live-dry-run').style.display).toBe('none');
    expect(screen.getByTestId('pane-code').style.display).toBe('none');
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

  it('falls back to example[0].input when testCases are absent', () => {
    const problemWithoutTestCases: Problem = {
      ...mockProblem,
      testCases: [],
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
        },
      ],
    };

    render(<ProblemTabs problem={problemWithoutTestCases} />);

    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    const inputField = screen.getByTitle(/execution input arguments/i) as HTMLInputElement;
    expect(inputField.value).toBe('nums = [2,7,11,15], target = 9');
  });

  it('executes custom user code edited in Monaco within Live Dry Run tab', async () => {
    render(<ProblemTabs problem={mockProblem} />);

    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    // Find Monaco editor mock in Live Dry Run pane
    const livePane = screen.getByTestId('pane-live-dry-run');
    const editor = livePane.querySelector('textarea') as HTMLTextAreaElement;

    const customUserCode = `function twoSum(nums, target) {
  let a = nums[0];
  let b = nums[1];
  return [0, 1];
}`;

    fireEvent.change(editor, { target: { value: customUserCode } });

    const runBtn = screen.getByRole('button', { name: /run dry run/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚡ live dry run/i)).toBeTruthy();
    });
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

  it('hydrates linked list array input [[1,2,3,4,5]] and dry runs reverseList successfully (F-LDR-S3-03)', async () => {
    const listProblem: Problem = {
      slug: 'reverse-linked-list',
      title: 'Reverse Linked List',
      difficulty: 'Easy',
      category: 'linked-list',
      patterns: ['two-pointers'],
      companies: ['Amazon'],
      description: 'Reverse a singly linked list',
      examples: [{ input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' }],
      constraints: [],
      hints: [],
      realWorldUseCases: [],
      externalLinks: [],
      accessLevel: 'free',
      starterCode: {
        javascript: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nxt = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nxt;
  }
  return prev;
}`,
      },
      solutions: [],
      testCases: [
        {
          id: '1',
          input: '[[1,2,3,4,5]]',
          expected: '[5,4,3,2,1]',
        },
      ],
      dryRunSteps: [
        {
          stepNumber: 0,
          line: 1,
          explanation: 'Authored reverse list step',
          variables: [],
        },
      ],
    };

    render(<ProblemTabs problem={listProblem} />);

    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    const inputField = screen.getByTitle(/execution input arguments/i) as HTMLInputElement;
    expect(inputField.value).toBe('[[1,2,3,4,5]]');

    const runBtn = screen.getByRole('button', { name: /run dry run/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚡ live dry run/i)).toBeTruthy();
    });

    // Ensure authored JSON dryRunSteps unmutated
    expect(listProblem.dryRunSteps[0].explanation).toBe('Authored reverse list step');
  });

  it('hydrates binary tree array input [[3,9,20,null,null,15,7]] and dry runs maxDepth successfully (F-LDR-S3-03)', async () => {
    const treeProblem: Problem = {
      slug: 'maximum-depth-of-binary-tree',
      title: 'Maximum Depth of Binary Tree',
      difficulty: 'Easy',
      category: 'tree',
      patterns: ['dfs'],
      companies: ['Amazon'],
      description: 'Maximum depth of binary tree',
      examples: [{ input: 'root = [3,9,20,null,null,15,7]', output: '3' }],
      constraints: [],
      hints: [],
      realWorldUseCases: [],
      externalLinks: [],
      accessLevel: 'free',
      starterCode: {
        javascript: `function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
      },
      solutions: [],
      testCases: [
        {
          id: '1',
          input: '[[3,9,20,null,null,15,7]]',
          expected: '3',
        },
      ],
      dryRunSteps: [
        {
          stepNumber: 0,
          line: 1,
          explanation: 'Authored tree step',
          variables: [],
        },
      ],
    };

    render(<ProblemTabs problem={treeProblem} />);

    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    const inputField = screen.getByTitle(/execution input arguments/i) as HTMLInputElement;
    expect(inputField.value).toBe('[[3,9,20,null,null,15,7]]');

    const runBtn = screen.getByRole('button', { name: /run dry run/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚡ live dry run/i)).toBeTruthy();
    });
  });

  it('skips hidden test cases when selecting default live dry run input (ADR-002, F-LDR-S1-08)', () => {
    const problemWithHiddenFirst: Problem = {
      ...mockProblem,
      testCases: [
        {
          id: 'secret-1',
          input: '[[99999], 1]',
          expected: '[-1, -1]',
          isHidden: true,
        },
        {
          id: 'public-1',
          input: '[[2,7,11,15], 9]',
          expected: '[0, 1]',
          isHidden: false,
        },
      ],
    };

    render(<ProblemTabs problem={problemWithHiddenFirst} />);

    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    const inputField = screen.getByTitle(/execution input arguments/i) as HTMLInputElement;
    // Must be the first non-hidden test case!
    expect(inputField.value).toBe('[[2,7,11,15], 9]');
  });

  it('handles LeetCode prose input head = [1,2,3,4,5] without converting to five scalar args', async () => {
    const proseProblem: Problem = {
      ...mockProblem,
      slug: 'reverse-linked-list',
      category: 'linked-list',
      starterCode: {
        javascript: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nxt = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nxt;
  }
  return prev;
}`,
      },
      testCases: [],
      examples: [
        {
          input: 'head = [1,2,3,4,5]',
          output: '[5,4,3,2,1]',
        },
      ],
    };

    render(<ProblemTabs problem={proseProblem} />);

    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    const inputField = screen.getByTitle(/execution input arguments/i) as HTMLInputElement;
    expect(inputField.value).toBe('head = [1,2,3,4,5]');

    const runBtn = screen.getByRole('button', { name: /run dry run/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚡ live dry run/i)).toBeTruthy();
    });
  });

  it('maintains independent visualizer stores for official and live dry run viewers without clobbering', async () => {
    render(<ProblemTabs problem={mockProblem} />);

    // Official Dry Run starts at step 0
    expect(screen.getByText('Authored Step 1: Initialize hash map')).toBeTruthy();

    // Advance Official Dry Run to step 1
    const nextBtn = screen.getByLabelText('Next step');
    fireEvent.click(nextBtn);

    // Official Dry Run is now at step 1
    expect(screen.getByText('Authored Step 2: Found pair')).toBeTruthy();

    // Switch to Live Dry Run tab
    const liveTab = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTab);

    // Execute live dry run
    const runBtn = screen.getByRole('button', { name: /run dry run/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚡ live dry run/i)).toBeTruthy();
    });

    // Switch back to Official Dry Run tab
    const officialTab = screen.getByRole('tab', { name: /official dry run/i });
    fireEvent.click(officialTab);

    // Official Dry Run must STILL be at step 1 (not reset or clobbered!)
    expect(screen.getByText('Authored Step 2: Found pair')).toBeTruthy();
  });
});

