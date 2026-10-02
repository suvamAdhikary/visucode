import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProblemPage from '../app/problems/[slug]/page';

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

describe('ProblemPage Integration (Sprint 4, F-LDR-S4-01)', () => {
  it('renders ComplexityPanel in the description column outside of ProblemTabs', async () => {
    const pageComponent = await ProblemPage({
      params: Promise.resolve({ slug: 'two-sum' }),
    });

    const { container } = render(pageComponent);

    // Complexity panel is rendered immediately on page load
    const complexityPanel = screen.getByTestId('complexity-panel');
    expect(complexityPanel).toBeTruthy();

    // Assert that the panel is inside descriptionPanel and outside visualizerPanel
    const descriptionPanel = container.querySelector('[class*="descriptionPanel"]');
    const visualizerPanel = container.querySelector('[class*="visualizerPanel"]');

    expect(descriptionPanel).toBeTruthy();
    expect(visualizerPanel).toBeTruthy();

    expect(descriptionPanel?.contains(complexityPanel)).toBe(true);
    expect(visualizerPanel?.contains(complexityPanel)).toBe(false);
  });

  it('keeps ComplexityPanel visible and unchanged when switching ProblemTabs', async () => {
    const pageComponent = await ProblemPage({
      params: Promise.resolve({ slug: 'two-sum' }),
    });

    render(pageComponent);

    // Initial state on Official Dry Run tab
    expect(screen.getByTestId('complexity-panel')).toBeTruthy();
    expect(screen.getByText('Algorithm Complexity')).toBeTruthy();

    // Switch to Dry Run My Code tab
    const liveTabButton = screen.getByRole('tab', { name: /dry run my code/i });
    fireEvent.click(liveTabButton);

    // Complexity panel remains mounted, visible, and unaffected
    expect(screen.getByTestId('complexity-panel')).toBeTruthy();
    expect(screen.getByText('Algorithm Complexity')).toBeTruthy();

    // Switch to Your Code tab
    const codeTabButton = screen.getByRole('tab', { name: /your code/i });
    fireEvent.click(codeTabButton);

    // Complexity panel remains mounted, visible, and unaffected
    expect(screen.getByTestId('complexity-panel')).toBeTruthy();
    expect(screen.getByText('Algorithm Complexity')).toBeTruthy();
  });
});
