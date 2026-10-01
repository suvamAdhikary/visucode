import { traceUserCode } from '../tracer';

describe('Live Dry Run Tracer', () => {
  it('traces twoSum execution with exact locals and lines (F-LDR-S1-03)', async () => {
    // Note: Entry function is resolved via AST call-graph root analysis, exported functions, or standard names (F-LDR-S1-03)
    const code = `function twoSum(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) {
      return [left, right];
    }
    if (sum < target) {
      left++;
    } else {
      right--;
    }
  }
  return [-1, -1];
}`;

    const result = await traceUserCode({
      code,
      input: '[[1, 3, 5, 7, 9], 12]',
    });

    expect(result.completed).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.returnValue).toEqual([1, 4]);

    // Verify presence of real locals across steps
    const firstStep = result.steps[0];
    expect(firstStep.variables.some((v) => v.name === 'nums')).toBe(true);

    // Exact variable step values assertion (F-LDR-S1-03)
    // Step 1: left = 0, right = 4 (length 5 - 1)
    const initialStep = result.steps.find(
      (s) =>
        s.variables.some((v) => v.name === 'left' && v.value === '0') &&
        s.variables.some((v) => v.name === 'right' && v.value === '4')
    );
    expect(initialStep).toBeDefined();

    // Step 2: after sum = 1 + 9 = 10 < 12, left increments to 1, right remains 4
    const incrementedStep = result.steps.find(
      (s) =>
        s.variables.some((v) => v.name === 'left' && v.value === '1') &&
        s.variables.some((v) => v.name === 'right' && v.value === '4')
    );
    expect(incrementedStep).toBeDefined();

    // Verify factual explanations
    expect(
      result.steps.some(
        (s) => s.explanation.includes('left') || s.explanation.includes('nums')
      )
    ).toBe(true);
  });

  it('detects infinite loops early inside a try block (F-LDR-S1-02, F-LDR-S1-07)', async () => {
    const code = `function loopInTry() {
  try {
    while (true) {
      // repeated state inside try block
    }
  } catch (e) {
    return -1;
  }
}`;

    const result = await traceUserCode({
      code,
      input: '[]',
    });

    expect(result.completed).toBe(false);
    expect(result.diagnostic).toBeDefined();
    expect(result.diagnostic?.kind).toBe('loop-hang');
    expect(result.steps.length).toBeGreaterThan(0); // Partial trace preserved!
    expect(result.diagnostic?.suggestion).toContain('termination conditions');
  });

  it('detects infinite loops early and preserves partial trace (F-LDR-S1-07)', async () => {
    const code = `function stuckLoop(n) {
  let x = 0;
  while (x < 10) {
    // x never changes!
  }
  return x;
}`;

    const result = await traceUserCode({
      code,
      input: '[5]',
    });

    expect(result.completed).toBe(false);
    expect(result.diagnostic).toBeDefined();
    expect(result.diagnostic?.kind).toBe('loop-hang');
    expect(result.steps.length).toBeGreaterThan(0); // Partial trace preserved!
    expect(result.diagnostic?.suggestion).toContain('termination conditions');
  });

  it('aborts when step cap of 500 is exceeded (F-LDR-S1-02)', async () => {
    // Variable i changes on every step so it doesn't trigger repeat-state abort,
    // but execution exceeds the hard 500-step cap.
    const code = `function stepCapExceeded() {
  let i = 0;
  while (i < 600) {
    i++;
  }
  return i;
}`;

    const result = await traceUserCode({
      code,
      input: '[]',
    });

    expect(result.completed).toBe(false);
    expect(result.diagnostic?.kind).toBe('step-cap-exceeded');
    expect(result.steps.length).toBe(500); // Caps at 500 partial steps
    expect(result.diagnostic?.message).toContain('Step limit of 500');
  });

  it('aborts on recursion depth overflow and preserves trace (F-LDR-S1-02)', async () => {
    const code = `function infiniteRecursion(n) {
  return infiniteRecursion(n + 1);
}`;

    const result = await traceUserCode({
      code,
      input: '[1]',
    });

    expect(result.completed).toBe(false);
    expect(result.diagnostic?.kind).toBe('recursion-depth-exceeded');
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('captures runtime exceptions with partial steps (F-LDR-S1-07)', async () => {
    const code = `function buggy(arr) {
  let a = 1;
  let b = null;
  b.accessNonExistent();
  return a;
}`;

    const result = await traceUserCode({
      code,
      input: '[[1, 2]]',
    });

    expect(result.completed).toBe(false);
    expect(result.diagnostic?.kind).toBe('runtime-error');
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('aborts on worker timeout, terminates worker, and states tape is empty (F-LDR-S1-02, F-LDR-S1-07)', async () => {
    const mockWorker = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      onmessage: null,
      onerror: null,
    };
    const originalWorker = (global as any).Worker;
    (global as any).Worker = jest.fn(() => mockWorker);

    try {
      const result = await traceUserCode({
        code: `function timeoutFn() { while (true) {} }`,
        input: '[]',
        timeoutMs: 20,
      });

      expect(result.completed).toBe(false);
      expect(result.steps).toEqual([]);
      expect(result.diagnostic?.kind).toBe('timeout');
      expect(result.diagnostic?.message).toContain('tape is empty');
      expect(mockWorker.terminate).toHaveBeenCalled();
    } finally {
      (global as any).Worker = originalWorker;
    }
  });

  it('rejects oversized inputs at preflight before execution (F-LDR-S1-08)', async () => {
    const code = `function test(arr) { return arr.length; }`;
    const bigArray = new Array(100).fill(1);

    const result = await traceUserCode({
      code,
      input: JSON.stringify([bigArray]),
    });

    expect(result.completed).toBe(false);
    expect(result.diagnostic?.kind).toBe('preflight-error');
    expect(result.steps.length).toBe(0);
  });

  it('keeps partial steps streamed before timeout occurs', async () => {
    let messageHandler: ((e: any) => void) | null = null;
    const mockWorker = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      set onmessage(handler: any) {
        messageHandler = handler;
      },
      onerror: null,
    };
    const originalWorker = (global as any).Worker;
    (global as any).Worker = jest.fn(() => mockWorker);

    try {
      const tracePromise = traceUserCode({
        code: `function timeoutWithSteps() { let x = 0; while (true) { x++; } }`,
        input: '[]',
        timeoutMs: 50,
      });

      // Simulate worker streaming partial steps before timing out
      setTimeout(() => {
        if (messageHandler) {
          messageHandler({
            data: {
              type: 'progress',
              steps: [
                { stepNumber: 1, line: 1, variables: [{ name: 'x', value: '1', type: 'number' }] },
                { stepNumber: 2, line: 1, variables: [{ name: 'x', value: '2', type: 'number' }] },
              ],
            },
          });
        }
      }, 10);

      const result = await tracePromise;
      expect(result.completed).toBe(false);
      expect(result.steps.length).toBe(2);
      expect(result.diagnostic?.kind).toBe('timeout');
      expect(mockWorker.terminate).toHaveBeenCalled();
    } finally {
      (global as any).Worker = originalWorker;
    }
  });

  it('executes root caller function even when helper function is declared first', async () => {
    const code = `function helper(x) {
  return x + 10;
}

function entry(nums) {
  let res = helper(nums[0]);
  return res;
}`;

    const result = await traceUserCode({
      code,
      input: '[[5]]',
    });

    expect(result.completed).toBe(true);
    expect(result.returnValue).toBe(15);
  });

  it('allows targeting a specific functionName through traceUserCode options', async () => {
    const code = `function first(x) { return x * 1; }
function second(x) { return x * 2; }`;

    const result = await traceUserCode({
      code,
      input: '[5]',
      functionName: 'second',
    });

    expect(result.completed).toBe(true);
    expect(result.returnValue).toBe(10);
  });

  it('does not falsely abort on step 1 when timeoutMs <= 150', async () => {
    const code = `function sumTo(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}`;

    const result = await traceUserCode({
      code,
      input: '[5]',
      timeoutMs: 100,
    });

    expect(result.completed).toBe(true);
    expect(result.steps.length).toBeGreaterThan(1);
    expect(result.diagnostic).toBeUndefined();
    expect(result.returnValue).toBe(15);
  });

  it('preserves trailing steps (1-4 steps after any batch) via per-step streaming on worker termination', async () => {
    let messageHandler: ((e: any) => void) | null = null;
    const mockWorker = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      set onmessage(handler: any) {
        messageHandler = handler;
      },
      onerror: null,
    };
    const originalWorker = (global as any).Worker;
    (global as any).Worker = jest.fn(() => mockWorker);

    try {
      const tracePromise = traceUserCode({
        code: `function loop() { let x = 0; while (true) { x++; } }`,
        input: '[]',
        timeoutMs: 60,
      });

      // Stream 3 incremental steps (a trailing non-multiple of 5)
      setTimeout(() => {
        if (messageHandler) {
          messageHandler({
            data: {
              type: 'step',
              step: { stepNumber: 1, line: 1, variables: [{ name: 'x', value: '1', type: 'number' }] },
            },
          });
          messageHandler({
            data: {
              type: 'step',
              step: { stepNumber: 2, line: 1, variables: [{ name: 'x', value: '2', type: 'number' }] },
            },
          });
          messageHandler({
            data: {
              type: 'step',
              step: { stepNumber: 3, line: 1, variables: [{ name: 'x', value: '3', type: 'number' }] },
            },
          });
        }
      }, 10);

      const result = await tracePromise;
      expect(result.completed).toBe(false);
      expect(result.steps.length).toBe(3);
      expect(result.steps.map((s) => s.stepNumber)).toEqual([1, 2, 3]);
      expect(result.diagnostic?.kind).toBe('timeout');
      expect(mockWorker.terminate).toHaveBeenCalled();
    } finally {
      (global as any).Worker = originalWorker;
    }
  });

  describe('Hydrated Catalog Data Structure Execution (F-LDR-S3-03)', () => {
    it('executes reverseList with catalog array input [[1,2,3,4,5]] and emits linkedListState with 5 nodes and curr/prev pointers', async () => {
      const code = `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nxt = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nxt;
  }
  return prev;
}`;

      const result = await traceUserCode({
        code,
        input: '[[1,2,3,4,5]]',
        hydration: 'linked-list',
      });

      expect(result.completed).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);

      // Verify that linkedListState is captured on steps
      const stepsWithList = result.steps.filter((s) => s.linkedListState !== undefined);
      expect(stepsWithList.length).toBeGreaterThan(0);

      // Some step has 5 nodes
      const fiveNodeStep = stepsWithList.find((s) => s.linkedListState?.nodes.length === 5);
      expect(fiveNodeStep).toBeDefined();
      expect(fiveNodeStep?.linkedListState?.nodes.map((n) => n.value)).toEqual([1, 2, 3, 4, 5]);

      // Verify pointers target node IDs
      const stepWithCurr = result.steps.find((s) => s.pointers?.some((p) => p.name === 'curr'));
      expect(stepWithCurr).toBeDefined();
      const currPtr = stepWithCurr?.pointers?.find((p) => p.name === 'curr');
      expect(currPtr?.targetId).toMatch(/^node-\d+$/);

      const stepWithPrev = result.steps.find((s) => s.pointers?.some((p) => p.name === 'prev'));
      expect(stepWithPrev).toBeDefined();
      const prevPtr = stepWithPrev?.pointers?.find((p) => p.name === 'prev');
      expect(prevPtr?.targetId).toMatch(/^node-\d+$/);
    });

    it('executes maxDepth with catalog tree input [[3,9,20,null,null,15,7]] and emits treeState', async () => {
      const code = `function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`;

      const result = await traceUserCode({
        code,
        input: '[[3,9,20,null,null,15,7]]',
        hydration: 'tree',
      });

      expect(result.completed).toBe(true);
      expect(result.returnValue).toBe(3);

      const stepWithTree = result.steps.find((s) => s.treeState !== undefined);
      expect(stepWithTree).toBeDefined();
      expect(stepWithTree?.treeState?.nodes.length).toBeGreaterThanOrEqual(5);
      expect(stepWithTree?.treeState?.nodes[0].value).toBe(3);
    });

    it('executes reverseList with LeetCode prose input "head = [1,2,3,4,5]"', async () => {
      const code = `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nxt = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nxt;
  }
  return prev;
}`;

      const result = await traceUserCode({
        code,
        input: 'head = [1,2,3,4,5]',
        hydration: 'linked-list',
      });

      expect(result.completed).toBe(true);
      const fiveNodeStep = result.steps.find((s) => s.linkedListState?.nodes.length === 5);
      expect(fiveNodeStep).toBeDefined();
    });
  });
});


