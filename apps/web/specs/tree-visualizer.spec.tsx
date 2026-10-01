import React from 'react';
import { render, screen } from '@testing-library/react';
import { TreeVisualizer } from '../app/components/visualizer/TreeVisualizer';
import type { TreeVisualizerState, Pointer } from '@visucode/shared-types';

describe('TreeVisualizer — Forest and Detached Nodes', () => {
  it('renders primary tree rooted at rootId', () => {
    const treeState: TreeVisualizerState = {
      nodes: [
        { id: 'node-1', value: 10, leftId: 'node-2', rightId: 'node-3' },
        { id: 'node-2', value: 20 },
        { id: 'node-3', value: 30 },
      ],
      rootId: 'node-1',
    };

    render(<TreeVisualizer treeState={treeState} />);

    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('30')).toBeTruthy();
    expect(screen.getByText('root')).toBeTruthy();
  });

  it('renders detached nodes and forest components with pointers (not only rootId)', () => {
    // TreeState with primary tree (nodes 1 -> 2) AND a detached node (node-temp)
    const treeState: TreeVisualizerState = {
      nodes: [
        { id: 'node-1', value: 100, leftId: 'node-2' },
        { id: 'node-2', value: 200 },
        { id: 'node-temp', value: 999 }, // Detached node!
      ],
      rootId: 'node-1',
    };

    const pointers: Pointer[] = [
      { name: 'root', targetId: 'node-1', color: '#10b981', label: 'root' },
      { name: 'temp', targetId: 'node-temp', color: '#f59e0b', label: 'temp' },
    ];

    render(<TreeVisualizer treeState={treeState} pointers={pointers} />);

    // Primary tree nodes
    expect(screen.getByText('100')).toBeTruthy();
    expect(screen.getByText('200')).toBeTruthy();

    // Detached node must be visible in the DOM
    expect(screen.getByText('999')).toBeTruthy();

    // Pointer on the detached node must be visible
    expect(screen.getByText('temp')).toBeTruthy();
  });
});
