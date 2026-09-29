import { instrumentCode } from '../instrumenter';

describe('Tracer Instrumenter', () => {
  it('instruments twoSum cleanly', () => {
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

    const res = instrumentCode(code);
    expect(res.success).toBe(true);
    expect(res.functionName).toBe('twoSum');
    expect(res.instrumentedCode).toContain('__vc.step');
    expect(res.instrumentedCode).toContain('__vc.enter');
    expect(res.instrumentedCode).toContain('__vc.leave');
  });

  it('instruments TryStatement with try, catch, and finally blocks (F-LDR-S1-02)', () => {
    const code = `function tryCatchDemo(x) {
  try {
    let a = x + 1;
  } catch (err) {
    let b = 2;
  } finally {
    let c = 3;
  }
}`;

    const res = instrumentCode(code);
    expect(res.success).toBe(true);
    expect(res.instrumentedCode).toContain('__vc.step(2');
    expect(res.instrumentedCode).toContain('__vc.step(4');
    expect(res.instrumentedCode).toContain('__vc.step(6');
  });

  it('instruments SwitchStatement cases cleanly (F-LDR-S1-02)', () => {
    const code = `function switchDemo(action) {
  switch (action) {
    case 'start':
      let count = 1;
      break;
    default:
      let fallback = 0;
  }
}`;

    const res = instrumentCode(code);
    expect(res.success).toBe(true);
    expect(res.instrumentedCode).toContain('__vc.step');
    expect(res.instrumentedCode).toContain('action');
  });

  it('instruments expression-body arrow functions (F-LDR-S1-02)', () => {
    const code = `function wrapper() {
  const add = (a, b) => a + b;
  return add(2, 3);
}`;

    const res = instrumentCode(code);
    expect(res.success).toBe(true);
    expect(res.instrumentedCode).toContain('__vc_ret = (a + b)');
    expect(res.instrumentedCode).toContain('return __vc_ret');
  });

  it('instruments class methods cleanly (F-LDR-S1-02)', () => {
    const code = `class Calculator {
  add(a, b) {
    return a + b;
  }
}`;

    const res = instrumentCode(code);
    expect(res.success).toBe(true);
    expect(res.instrumentedCode).toContain('__vc.enter()');
    expect(res.instrumentedCode).toContain('__vc.step');
  });

  it('catches syntax errors cleanly', () => {
    const code = `function bad( {`;
    const res = instrumentCode(code);
    expect(res.success).toBe(false);
    expect(res.error?.kind).toBe('syntax-error');
    expect(res.error?.line).toBeDefined();
  });

  it('detects user-defined index variables from computed member expressions and coordinate pairs', () => {
    const code = `function search(items, target) {
  for (let k = 0; k < items.length; k++) {
    if (items[k] === target) return k;
  }
  const myPointer = 0;
  const val = items[myPointer];
  const grid = [[1]];
  const cell = grid[r][c];
  return -1;
}`;

    const res = instrumentCode(code);
    expect(res.success).toBe(true);
    expect(res.detectedIndexVariables).toBeDefined();
    expect(res.detectedIndexVariables).toContain('k');
    expect(res.detectedIndexVariables).toContain('myPointer');
    expect(res.detectedIndexVariables).toContain('r');
    expect(res.detectedIndexVariables).toContain('c');
    expect(res.detectedIndexVariables).not.toContain('target');
    expect(res.detectedIndexVariables).not.toContain('items');
    expect(res.detectedCoordinatePairs).toEqual([['r', 'c']]);
  });

  it('extracts ternary indices and excludes offset variables in BinaryExpressions', () => {
    const code = `function advancedIndexing(arr, cond, a, b, i, offset) {
  const v1 = arr[cond ? a : b];
  const v2 = arr[i + offset];
  for (let loopOnly = 0; loopOnly < 10; loopOnly++) {
    // loopOnly does not index an array!
  }
  return v1 + v2;
}`;

    const res = instrumentCode(code);
    expect(res.success).toBe(true);
    expect(res.detectedIndexVariables).toContain('a');
    expect(res.detectedIndexVariables).toContain('b');
    expect(res.detectedIndexVariables).toContain('i');
    expect(res.detectedIndexVariables).not.toContain('cond');
    expect(res.detectedIndexVariables).not.toContain('offset');
    expect(res.detectedIndexVariables).not.toContain('loopOnly');
  });

  it('preserves exact casing and supports binary offsets in detectedCoordinatePairs', () => {
    const code = `function gridCoords(matrix) {
  const v1 = matrix[rowIdx][colIdx];
  const v2 = matrix[r - 1][c + 1];
  return v1 + v2;
}`;

    const res = instrumentCode(code);
    expect(res.success).toBe(true);
    expect(res.detectedCoordinatePairs).toEqual([
      ['rowIdx', 'colIdx'],
      ['r', 'c'],
    ]);
  });
});
