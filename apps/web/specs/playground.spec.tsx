import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlaygroundClient from '../app/playground/PlaygroundClient';

// Synchronous mock for Next.js dynamic import to prevent async act() warnings
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

  it('aborts on loop hang and displays diagnostics popup with partial trace (F-LDR-S1-07)', async () => {
    render(<PlaygroundClient />);

    const editor = screen.getByTestId('monaco-mock');
    const stuckLoopCode = `function stuck(arr) {
  let count = 0;
  while (count < 10) {
    // count never changes
  }
  return count;
}`;

    fireEvent.change(editor, { target: { value: stuckLoopCode } });

    const runBtn = screen.getByRole('button', { name: /dry run/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /infinite loop detected/i })).toBeTruthy();
      expect(screen.getByText(/what to check:/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /inspect partial trace/i })).toBeTruthy();
    });

    // Dismiss modal and verify partial steps remain accessible
    const inspectBtn = screen.getByRole('button', { name: /inspect partial trace/i });
    fireEvent.click(inspectBtn);

    expect(screen.queryByRole('heading', { name: /infinite loop detected/i })).toBeNull();
    expect(screen.getByText(/live execution stepper/i)).toBeTruthy();
  });
});
