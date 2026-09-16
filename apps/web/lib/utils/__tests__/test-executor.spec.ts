/**
 * Unit Tests — test-executor.ts
 * Tests the core code execution and comparison logic
 */

import { executeTests, extractFunctionName } from '../test-executor';

describe('extractFunctionName', () => {
  it('extracts function declaration name', () => {
    expect(extractFunctionName('function twoSum(numbers, target) {')).toBe('twoSum');
  });

  it('extracts arrow function name', () => {
    expect(extractFunctionName('const search = (nums) => {')).toBe('search');
  });

  it('extracts let function name', () => {
    expect(extractFunctionName('let findMin = function(nums) {')).toBe('findMin');
  });

  it('returns null for anonymous code', () => {
    expect(extractFunctionName('// just a comment')).toBeNull();
  });

  it('handles function with underscores and dollars', () => {
    expect(extractFunctionName('function min_eating_speed($piles, h) {')).toBe('min_eating_speed');
  });
});

describe('executeTests', () => {
  const simpleAddCode = `function add(a, b) { return a + b; }`;

  it('passes all correct test cases', async () => {
    const result = await executeTests(simpleAddCode, 'add', [
      { id: '1', input: '[1, 2]', expected: '3' },
      { id: '2', input: '[0, 0]', expected: '0' },
      { id: '3', input: '[-1, 1]', expected: '0' },
    ]);

    expect(result.totalTests).toBe(3);
    expect(result.totalPassed).toBe(3);
    expect(result.totalFailed).toBe(0);
    expect(result.results.every(r => r.passed)).toBe(true);
  });

  it('detects failures', async () => {
    const wrongCode = `function add(a, b) { return a * b; }`;
    const result = await executeTests(wrongCode, 'add', [
      { id: '1', input: '[2, 3]', expected: '5' },
    ]);

    expect(result.totalFailed).toBe(1);
    expect(result.results[0].passed).toBe(false);
    expect(result.results[0].actual).toBe('6');
  });

  it('handles syntax errors gracefully', async () => {
    const badCode = `function broken( { return }`;
    const result = await executeTests(badCode, 'broken', [
      { id: '1', input: '[1]', expected: '1' },
    ]);

    expect(result.totalFailed).toBe(1);
    expect(result.results[0].error).toBeDefined();
    expect(result.results[0].passed).toBe(false);
  });

  it('handles runtime errors gracefully', async () => {
    const errorCode = `function boom() { throw new Error('kaboom'); }`;
    const result = await executeTests(errorCode, 'boom', [
      { id: '1', input: '[]', expected: '1' },
    ]);

    expect(result.totalFailed).toBe(1);
    expect(result.results[0].error).toContain('kaboom');
  });

  it('parses array-of-args input format correctly', async () => {
    const code = `function twoSum(numbers, target) {
      let l = 0, r = numbers.length - 1;
      while (l < r) {
        const s = numbers[l] + numbers[r];
        if (s === target) return [l+1, r+1];
        else if (s < target) l++;
        else r--;
      }
      return [-1,-1];
    }`;

    const result = await executeTests(code, 'twoSum', [
      { id: '1', input: '[[2,7,11,15], 9]', expected: '[1,2]' },
    ]);

    expect(result.totalPassed).toBe(1);
    expect(result.results[0].passed).toBe(true);
  });

  it('handles single-argument input', async () => {
    const code = `function isPalindrome(s) {
      const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      return clean === clean.split('').reverse().join('');
    }`;

    const result = await executeTests(code, 'isPalindrome', [
      { id: '1', input: '["racecar"]', expected: 'true' },
      { id: '2', input: '["hello"]', expected: 'false' },
    ]);

    expect(result.totalPassed).toBe(2);
  });

  it('normalizes array output for comparison', async () => {
    // Test that [1,2] matches [1, 2] (whitespace differences)
    const code = `function getArr() { return [1, 2]; }`;
    const result = await executeTests(code, 'getArr', [
      { id: '1', input: '[]', expected: '[1,2]' },
    ]);

    expect(result.totalPassed).toBe(1);
  });

  it('handles hidden test cases', async () => {
    const code = `function add(a, b) { throw new Error("secret input"); }`;
    const result = await executeTests(code, 'add', [
      { id: '1', input: '[1, 2]', expected: '3', isHidden: true },
    ]);

    expect(result.results[0].input).toBe('Hidden');
    expect(result.results[0].expected).toBe('Hidden');
    expect(result.results[0].passed).toBe(false);
    expect(result.results[0].actual).toBe('Wrong Answer');
    expect(result.results[0].error).toBeUndefined();
  });

  it('tracks execution time', async () => {
    const code = `function slow() { let x = 0; for(let i=0;i<100;i++) x+=i; return x; }`;
    const result = await executeTests(code, 'slow', [
      { id: '1', input: '[]', expected: '4950' },
    ]);

    expect(result.overallTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.results[0].executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  // ---- Tests for actual problem solutions ----

  it('validates 3Sum solution', async () => {
    const code = `function threeSum(nums) {
      const res = [];
      nums.sort((a, b) => a - b);
      for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let left = i + 1, right = nums.length - 1;
        while (left < right) {
          const sum = nums[i] + nums[left] + nums[right];
          if (sum === 0) {
            res.push([nums[i], nums[left], nums[right]]);
            while (left < right && nums[left] === nums[left + 1]) left++;
            while (left < right && nums[right] === nums[right - 1]) right--;
            left++; right--;
          } else if (sum < 0) left++;
          else right--;
        }
      }
      return res;
    }`;

    const result = await executeTests(code, 'threeSum', [
      { id: '1', input: '[[-1,0,1,2,-1,-4]]', expected: '[[-1,-1,2],[-1,0,1]]' },
      { id: '2', input: '[[0,0,0]]', expected: '[[0,0,0]]' },
    ]);

    expect(result.totalPassed).toBe(2);
  });

  it('validates binary search solution', async () => {
    const code = `function search(nums, target) {
      let left = 0, right = nums.length - 1;
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
      }
      return -1;
    }`;

    const result = await executeTests(code, 'search', [
      { id: '1', input: '[[-1,0,3,5,9,12], 9]', expected: '4' },
      { id: '2', input: '[[-1,0,3,5,9,12], 2]', expected: '-1' },
    ]);

    expect(result.totalPassed).toBe(2);
  });

  it('validates sliding window solution (lengthOfLongestSubstring)', async () => {
    const code = `function lengthOfLongestSubstring(s) {
      const charSet = new Set();
      let left = 0, maxLen = 0;
      for (let right = 0; right < s.length; right++) {
        while (charSet.has(s[right])) { charSet.delete(s[left]); left++; }
        charSet.add(s[right]);
        maxLen = Math.max(maxLen, right - left + 1);
      }
      return maxLen;
    }`;

    const result = await executeTests(code, 'lengthOfLongestSubstring', [
      { id: '1', input: '["abcabcbb"]', expected: '3' },
      { id: '2', input: '["bbbbb"]', expected: '1' },
      { id: '3', input: '[""]', expected: '0' },
    ]);

    expect(result.totalPassed).toBe(3);
  });
});
