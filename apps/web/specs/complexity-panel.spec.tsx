import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComplexityPanel } from '../app/components/complexity/ComplexityPanel';
import { ComplexityChart, COMPLEXITY_METADATA } from '../app/components/complexity/ComplexityChart';
import type { Solution, ComplexityClass } from '@visucode/shared-types';

describe('ComplexityPanel (Sprint 4, F-LDR-S4-01, F-LDR-S4-02)', () => {
  const mockSolution: Solution = {
    language: 'javascript',
    code: 'function twoSum() {}',
    explanation: 'Use a hash map to look up the complement in O(1) time.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    timeComplexityWhy: 'Single linear pass through the array checking hash map complements in O(1) time.',
    spaceComplexityWhy: 'Hash map stores up to N element-to-index pairs in memory in the worst case.',
    complexityClass: 'linear',
  };

  it('renders time and space complexity with authored why explanations', () => {
    render(<ComplexityPanel solution={mockSolution} />);

    expect(screen.getByTestId('complexity-panel')).toBeTruthy();
    expect(screen.getByText('Algorithm Complexity')).toBeTruthy();
    expect(screen.getByText('Algorithmic Approach')).toBeTruthy();
    expect(screen.getByText(mockSolution.explanation!)).toBeTruthy();
    expect(screen.getByText('Time Complexity')).toBeTruthy();
    expect(screen.getAllByText('O(N)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(mockSolution.timeComplexityWhy!)).toBeTruthy();

    expect(screen.getByText('Space Complexity')).toBeTruthy();
    expect(screen.getByText(mockSolution.spaceComplexityWhy!)).toBeTruthy();
  });

  it('renders complexity class badge matching the solution class', () => {
    render(<ComplexityPanel solution={mockSolution} />);

    expect(screen.getByText('Linear')).toBeTruthy();
  });

  it('renders fallback values gracefully when solution is empty', () => {
    render(<ComplexityPanel />);

    expect(screen.getByTestId('complexity-panel')).toBeTruthy();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('Algorithmic Approach')).toBeNull();
  });
});

describe('ComplexityChart (Sprint 4, F-LDR-S4-03)', () => {
  const classes: ComplexityClass[] = [
    'constant',
    'logarithmic',
    'linear',
    'linearithmic',
    'quadratic',
    'exponential',
  ];

  it.each(classes)('highlights active complexity class %s on growth curve', (cls) => {
    render(<ComplexityChart complexityClass={cls} />);

    const meta = COMPLEXITY_METADATA[cls];
    expect(screen.getByText(meta.badgeText)).toBeTruthy();
    expect(screen.getByText(meta.description)).toBeTruthy();
    expect(screen.getByRole('figure')).toBeTruthy();
  });

  it('renders all curves in neutral mode when complexityClass is undefined', () => {
    render(<ComplexityChart />);

    expect(screen.getByText('Big-O Growth Curve')).toBeTruthy();
    expect(screen.getByRole('figure')).toBeTruthy();
  });
});
