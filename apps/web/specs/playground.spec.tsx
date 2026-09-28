import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlaygroundClient from '../app/playground/PlaygroundClient';

// Mock Monaco CodeEditor since Monaco runs only in browser canvas/DOM
jest.mock('../app/playground/CodeEditor', () => ({
  CodeEditor: ({ code, onChange }: { code: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="monaco-mock"
      value={code}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock CodeViewer within DryRunViewer
jest.mock('../app/components/editor/CodeViewer', () => ({
  CodeViewer: ({ code, activeLine }: { code: string; activeLine?: number }) => (
    <div data-testid="code-viewer-mock" data-active-line={activeLine}>
      {code}
    </div>
  ),
}));

describe('PlaygroundClient — Live Dry Run Stepper', () => {
  it('renders playground controls, template selector, and preflight input bar', () => {
    render(<PlaygroundClient />);

    expect(screen.getByText('🎮 Live Dry Run')).toBeTruthy();
    expect(screen.getByRole('button', { name: /dry run/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /reset/i })).toBeTruthy();
    expect(screen.getByLabelText(/function arguments input/i)).toBeTruthy();
    expect(screen.getByText(/✓ preflight passed/i)).toBeTruthy();
  });

  it('rejects oversized inputs at preflight before starting worker (F-LDR-S1-08)', () => {
    render(<PlaygroundClient />);

    const inputField = screen.getByLabelText(/function arguments input/i);
    const oversizedArray = JSON.stringify([new Array(30).fill(1)]);

    fireEvent.change(inputField, { target: { value: oversizedArray } });

    expect(screen.getByText(/⛔ size \/ format limit/i)).toBeTruthy();
    expect(screen.getByText(/exceeds dry-run limit of 16/i)).toBeTruthy();

    const runBtn = screen.getByRole('button', { name: /dry run/i }) as HTMLButtonElement;
    expect(runBtn.disabled).toBe(true);
  });

  it('switches templates and resets input preflight properly', () => {
    render(<PlaygroundClient />);

    const select = screen.getByLabelText(/algorithm template/i);
    fireEvent.change(select, { target: { value: 'sliding-window' } });

    const inputField = screen.getByLabelText(/function arguments input/i) as HTMLInputElement;
    expect(inputField.value).toContain('[[2, 1, 5, 1, 3, 2], 3]');
    expect(screen.getByText(/✓ preflight passed/i)).toBeTruthy();
  });

  it('executes two-pointers dry run and mounts the live stepper (F-LDR-S1-03, F-LDR-S1-04)', async () => {
    render(<PlaygroundClient />);

    const runBtn = screen.getByRole('button', { name: /dry run/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/live execution stepper/i)).toBeTruthy();
      expect(screen.getByText(/step 1 \/ 10/i)).toBeTruthy();
    });
  });
});
