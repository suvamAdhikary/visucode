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

  it('catches syntax errors cleanly', () => {
    const code = `function bad( {`;
    const res = instrumentCode(code);
    expect(res.success).toBe(false);
    expect(res.error?.kind).toBe('syntax-error');
    expect(res.error?.line).toBeDefined();
  });
});
