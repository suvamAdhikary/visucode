import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfileClient } from '../app/profile/ProfileClient';
import {
  getProgress,
  markProblemComplete,
  markLessonComplete,
  setCurrentTrack,
  resetProgress,
} from '../lib/services/progress.service';
import { listProblems, listPatterns } from '../lib/services';

describe('Profile Page Integration (Phase 3 Sprint 1, F-P3S1-03)', () => {
  const problems = listProblems();
  const patterns = listPatterns();

  beforeEach(() => {
    localStorage.clear();
    resetProgress();
    jest.clearAllMocks();
  });

  it('renders default empty profile state with 0 problems solved', () => {
    render(<ProfileClient allProblems={problems} patterns={patterns} />);

    expect(screen.getByText('Developer Profile')).toBeTruthy();
    expect(screen.getByText('Anonymous Mode')).toBeTruthy();
    expect(screen.getByTestId('profile-total-solved').textContent).toBe('0');
    expect(screen.getByText('No problems solved yet')).toBeTruthy();
  });

  it('accurately displays completed problems and updates difficulty counters', () => {
    // Complete 1 Easy and 1 Medium problem
    markProblemComplete('two-sum'); // Easy
    markProblemComplete('3sum'); // Medium

    render(<ProfileClient allProblems={problems} patterns={patterns} />);

    // Total solved should match completedProblems.length (F-P3S1-03)
    const progress = getProgress();
    expect(progress.completedProblems).toEqual(['two-sum', '3sum']);

    const totalSolvedEl = screen.getByTestId('profile-total-solved');
    expect(totalSolvedEl.textContent).toBe('2');

    // Solved problem cards should be displayed with links
    expect(screen.getByText('Two Sum')).toBeTruthy();
    expect(screen.getByText('3Sum')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Solved Problems \(2\)/i })).toBeTruthy();
  });

  it('filters solved problems by difficulty', () => {
    markProblemComplete('two-sum'); // Easy
    markProblemComplete('3sum'); // Medium

    render(<ProfileClient allProblems={problems} patterns={patterns} />);

    // Click 'Easy' filter pill
    const easyFilterBtn = screen.getByRole('button', { name: 'Easy' });
    act(() => {
      fireEvent.click(easyFilterBtn);
    });

    expect(screen.getByText('Two Sum')).toBeTruthy();
    expect(screen.queryByText('3Sum')).toBeNull();

    // Click 'Hard' filter pill
    const hardFilterBtn = screen.getByRole('button', { name: 'Hard' });
    act(() => {
      fireEvent.click(hardFilterBtn);
    });

    expect(screen.getByText('No Hard problems solved yet.')).toBeTruthy();
  });

  it('resets progress when confirmed in the danger zone', () => {
    markProblemComplete('two-sum');
    markProblemComplete('binary-search');

    render(<ProfileClient allProblems={problems} patterns={patterns} />);
    expect(screen.getByTestId('profile-total-solved').textContent).toBe('2');

    // Click Reset All Progress
    const resetBtn = screen.getByTestId('reset-progress-btn');
    act(() => {
      fireEvent.click(resetBtn);
    });

    // Confirmation button appears
    const confirmBtn = screen.getByTestId('confirm-reset-btn');
    expect(confirmBtn).toBeTruthy();

    act(() => {
      fireEvent.click(confirmBtn);
    });

    // Count is now 0 and empty state renders
    expect(screen.getByTestId('profile-total-solved').textContent).toBe('0');
    expect(screen.getByText('No problems solved yet')).toBeTruthy();
    expect(getProgress().completedProblems).toEqual([]);
  });

  it('matches total problem volume from listProblems()', () => {
    render(<ProfileClient allProblems={problems} patterns={patterns} />);

    expect(screen.getByText(`/ ${problems.length}`)).toBeTruthy();
  });

  it('displays lesson completion counts and active track from UserProgress', () => {
    markLessonComplete('array-basics');
    markLessonComplete('two-pointers-intro');
    setCurrentTrack('arrays', 3);

    render(<ProfileClient allProblems={problems} patterns={patterns} />);

    expect(screen.getByTestId('profile-total-lessons').textContent).toBe('2');
    expect(screen.getByText(/Arrays \(L3\) →/i)).toBeTruthy();
  });
});
