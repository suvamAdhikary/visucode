const fs = require('fs');
const path = require('path');

const problemsDir = path.join(__dirname, '../apps/web/content/problems');

const problems = [
  {
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'hash-map',
    patterns: ['two-pointers'],
    companies: ['Amazon', 'Google', 'Meta'],
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
    examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
    constraints: [],
    hints: ['Use a hash map to store the elements and their indices.'],
    starterCode: { javascript: 'function twoSum(nums, target) {\n    // Your code here\n}' },
    solutions: [{ language: 'javascript', code: 'function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) return [map.get(diff), i];\n        map.set(nums[i], i);\n    }\n    return [];\n}', timeComplexity: 'O(N)', spaceComplexity: 'O(N)' }],
    testCases: [{ id: '1', input: '[[2,7,11,15], 9]', expected: '[0,1]' }],
    dryRunSteps: [
      {
        stepNumber: 1, line: 3, variables: [], explanation: 'Initialize empty map.',
        hashMapState: { entries: [] }
      },
      {
        stepNumber: 2, line: 6, variables: [{ name: 'diff', value: '7', type: 'number' }], explanation: 'diff = 9 - 2 = 7. map does not have 7. Add 2:0 to map.',
        hashMapState: { entries: [{ key: '2', value: 0 }], highlightKeys: ['2'] }
      },
      {
        stepNumber: 3, line: 5, variables: [{ name: 'diff', value: '2', type: 'number' }], explanation: 'diff = 9 - 7 = 2. map has 2! Return indices.',
        hashMapState: { entries: [{ key: '2', value: 0 }], highlightKeys: ['2'] }
      }
    ],
    externalLinks: [{ platform: 'leetcode', url: 'https://leetcode.com/problems/two-sum/' }],
    realWorldUseCases: [],
    accessLevel: 'free'
  },
  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'stack',
    patterns: [],
    companies: ['Amazon', 'Facebook'],
    description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.',
    examples: [{ input: 's = "()[]{}"', output: 'true' }],
    constraints: [],
    hints: ['Use a stack to push open brackets.'],
    starterCode: { javascript: 'function isValid(s) {\n    // Your code here\n}' },
    solutions: [{ language: 'javascript', code: 'function isValid(s) {\n    const stack = [];\n    const map = { ")": "(", "}": "{", "]": "[" };\n    for (const char of s) {\n        if (!map[char]) stack.push(char);\n        else if (stack.pop() !== map[char]) return false;\n    }\n    return stack.length === 0;\n}', timeComplexity: 'O(N)', spaceComplexity: 'O(N)' }],
    testCases: [{ id: '1', input: '["()"]', expected: 'true' }],
    dryRunSteps: [
      {
        stepNumber: 1, line: 2, variables: [], explanation: 'Initialize empty stack.',
        stackQueueState: { type: 'stack', items: [] }
      },
      {
        stepNumber: 2, line: 5, variables: [{ name: 'char', value: '"("', type: 'string' }], explanation: 'Push open bracket onto stack.',
        stackQueueState: { type: 'stack', items: ['"("'], highlightIndices: [0] }
      },
      {
        stepNumber: 3, line: 6, variables: [{ name: 'char', value: '")"', type: 'string' }], explanation: 'Match close bracket. Pop from stack.',
        stackQueueState: { type: 'stack', items: [], highlightIndices: [] }
      }
    ],
    externalLinks: [{ platform: 'leetcode', url: 'https://leetcode.com/problems/valid-parentheses/' }],
    realWorldUseCases: [],
    accessLevel: 'free'
  },
  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    category: 'array',
    patterns: ['greedy'],
    companies: ['Google', 'Amazon'],
    description: 'Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals.',
    examples: [{ input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' }],
    constraints: [],
    hints: ['Sort the intervals by their start time.'],
    starterCode: { javascript: 'function merge(intervals) {\n    // Your code here\n}' },
    solutions: [{ language: 'javascript', code: 'function merge(intervals) {\n    if (intervals.length === 0) return [];\n    intervals.sort((a, b) => a[0] - b[0]);\n    const res = [intervals[0]];\n    for (let i = 1; i < intervals.length; i++) {\n        const last = res[res.length - 1];\n        if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);\n        else res.push(intervals[i]);\n    }\n    return res;\n}', timeComplexity: 'O(N log N)', spaceComplexity: 'O(N)' }],
    testCases: [{ id: '1', input: '[[[1,3],[2,6]]]', expected: '[[1,6]]' }],
    dryRunSteps: [
      {
        stepNumber: 1, line: 3, variables: [], explanation: 'Sort intervals. Initial state.',
        intervalState: { intervals: [{ id: '1', start: 1, end: 3, color: '#3b82f6' }, { id: '2', start: 2, end: 6, color: '#93c5fd' }], rangeStart: 0, rangeEnd: 10 }
      },
      {
        stepNumber: 2, line: 7, variables: [], explanation: 'Overlapping detected (2 <= 3). Merge them.',
        intervalState: { intervals: [{ id: '3', start: 1, end: 6, color: '#10b981' }], rangeStart: 0, rangeEnd: 10 }
      }
    ],
    externalLinks: [{ platform: 'leetcode', url: 'https://leetcode.com/problems/merge-intervals/' }],
    realWorldUseCases: [],
    accessLevel: 'free'
  }
];

for (let i = 4; i <= 10; i++) {
  problems.push({
    slug: `sprint-3-problem-${i}`,
    title: `Sprint 3 Problem ${i}`,
    difficulty: 'Medium',
    category: 'hash-map',
    patterns: [],
    companies: [],
    description: 'Generated placeholder problem.',
    examples: [],
    constraints: [],
    hints: [],
    starterCode: { javascript: 'function solve() {}' },
    solutions: [{ language: 'javascript', code: 'function solve() { return true; }', timeComplexity: 'O(1)', spaceComplexity: 'O(1)' }],
    testCases: [],
    dryRunSteps: [],
    externalLinks: [{ platform: 'leetcode', url: 'https://leetcode.com/' }],
    realWorldUseCases: [],
    accessLevel: 'free'
  });
}

problems.forEach(p => {
  fs.writeFileSync(path.join(problemsDir, `${p.slug}.json`), JSON.stringify(p, null, 2));
});
console.log('Successfully wrote 10 problems for Sprint 3.');
