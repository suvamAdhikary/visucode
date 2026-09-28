import { traceUserCode } from '../tracer';

describe('Live Dry Run Tracer', () => {
  it('traces twoSum execution with exact locals and lines (F-LDR-S1-03)', async () => {
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

    const stepWithLeft = result.steps.find((s) => s.variables.some((v) => v.name === 'left'));
    expect(stepWithLeft).toBeDefined();

    // Verify factual explanations
    expect(result.steps.some((s) => s.explanation.includes('left') || s.explanation.includes('nums'))).toBe(true);
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
});
