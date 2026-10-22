import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProblemPage from '../app/problems/[slug]/page';
import ProblemsPage from '../app/problems/page';
import PatternDetailPage from '../app/patterns/[slug]/page';

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

describe('Page-Level Premium Problem Gating & Column Isolation (F-P3S3-01, F-P3S3-02)', () => {
  it('renders left description column fully visible while gating ProblemTabs in visualizerPanel for premium slug', async () => {
    const pageComponent = await ProblemPage({
      params: Promise.resolve({ slug: 'trapping-rain-water' }),
    });

    const { container } = render(pageComponent);

    // 1. Left column is completely rendered and visible
    const descriptionPanel = container.querySelector('[class*="descriptionPanel"]');
    expect(descriptionPanel).toBeTruthy();

    // Title and premium badge in header
    expect(screen.getByRole('heading', { level: 1, name: 'Trapping Rain Water' })).toBeTruthy();
    const headerBadge = screen.getByTestId('problem-header-premium-badge');
    expect(headerBadge).toBeTruthy();
    expect(headerBadge.textContent).toContain('★ Premium');

    // Description, constraints, hints, complexity panel all present on left
    expect(screen.getByText(/compute how much water it can trap/i)).toBeTruthy();
    expect(screen.getByText('Constraints')).toBeTruthy();
    const complexityPanel = screen.getByTestId('complexity-panel');
    expect(complexityPanel).toBeTruthy();
    expect(descriptionPanel?.contains(complexityPanel)).toBe(true);

    // 2. Right visualizer column is gated by PremiumGate
    const visualizerPanel = container.querySelector('[class*="visualizerPanel"]');
    expect(visualizerPanel).toBeTruthy();

    const gateCard = screen.getByTestId('premium-gate-card');
    expect(gateCard).toBeTruthy();
    expect(visualizerPanel?.contains(gateCard)).toBe(true);

    // ProblemTabs (interactive tab controls) are NOT accessible while gated
    expect(screen.queryByRole('tab', { name: /official dry run/i })).toBeNull();
    expect(screen.queryByRole('tab', { name: /dry run my code/i })).toBeNull();

    // Honest disclosure in preview notice
    const notice = screen.getByTestId('premium-preview-notice');
    expect(notice.textContent).toContain('Client-Side Architecture Preview (Phase 3 Sprint 3)');
    expect(notice.textContent).toContain('Phase 4 with the PostgreSQL backend');
  });

  it('allows client-side preview unlocking inside visualizerPanel while leaving description column unchanged', async () => {
    const pageComponent = await ProblemPage({
      params: Promise.resolve({ slug: 'trapping-rain-water' }),
    });

    const { container } = render(pageComponent);

    // Click Unlock Preview button on the page
    const unlockBtn = screen.getByTestId('premium-preview-unlock');
    fireEvent.click(unlockBtn);

    // Workspace is now unlocked within visualizerPanel
    expect(screen.getByTestId('premium-unlocked-banner')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /official dry run/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /dry run my code/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /your code/i })).toBeTruthy();

    // Description column, title, and ComplexityPanel remain intact
    const descriptionPanel = container.querySelector('[class*="descriptionPanel"]');
    expect(descriptionPanel?.contains(screen.getByTestId('complexity-panel'))).toBe(true);
    expect(screen.getByTestId('problem-header-premium-badge')).toBeTruthy();

    // Re-lock the gate
    const relockBtn = screen.getByTestId('premium-relock-btn');
    fireEvent.click(relockBtn);

    // Gate card reappears and tabs are unmounted
    expect(screen.getByTestId('premium-gate-card')).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /official dry run/i })).toBeNull();
  });
});

describe('Problem Catalog Access Level Filtering & (filtered) Indicator', () => {
  it('displays (filtered) indicator when accessLevel=premium is selected', async () => {
    const catalogPage = await ProblemsPage({
      searchParams: Promise.resolve({ accessLevel: 'premium' }),
    });

    render(catalogPage);

    // Displays "(filtered)" with 3 premium problems
    expect(screen.getByText(/3 problems \(filtered\)/i)).toBeTruthy();

    // All problem cards rendered display ★ Premium badge
    const premiumBadges = screen.getAllByText('★ Premium');
    expect(premiumBadges.length).toBeGreaterThanOrEqual(3);
  });

  it('displays (filtered) indicator when accessLevel=free is selected', async () => {
    const catalogPage = await ProblemsPage({
      searchParams: Promise.resolve({ accessLevel: 'free' }),
    });

    render(catalogPage);

    expect(screen.getByText(/\(filtered\)/i)).toBeTruthy();
  });

  it('does not display (filtered) indicator when no filters are active', async () => {
    const catalogPage = await ProblemsPage({
      searchParams: Promise.resolve({}),
    });

    render(catalogPage);

    expect(screen.queryByText(/\(filtered\)/i)).toBeNull();
  });
});

describe('Pattern Detail Page Premium Badges', () => {
  it('displays ★ Premium badge for premium problems in practice problems list', async () => {
    const patternPage = await PatternDetailPage({
      params: Promise.resolve({ slug: 'two-pointers' }),
    });

    render(patternPage);

    // Trapping Rain Water belongs to two-pointers and is premium
    expect(screen.getByText('Trapping Rain Water')).toBeTruthy();
    const premiumBadge = screen.getByTestId('pattern-problem-premium-badge');
    expect(premiumBadge).toBeTruthy();
    expect(premiumBadge.textContent).toContain('★ Premium');
  });
});
