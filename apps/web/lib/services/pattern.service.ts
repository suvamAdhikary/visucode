// ============================================
// Pattern Service — Data access abstraction
// ============================================

import type { Pattern, PatternSlug } from '@visucode/shared-types';

// Static pattern data — these are small enough to keep in-memory
// No need for JSON files until we have dozens of patterns
const PATTERNS: Pattern[] = [
  {
    slug: 'two-pointers',
    name: 'Two Pointers',
    description:
      'Use two pointers (usually `left` and `right`) to traverse an array from both ends toward the center, or both from the start at different speeds. Works best on **sorted arrays** or when you need to find pairs/triplets.',
    pseudocode: `function twoPointers(arr, target):
  left = 0
  right = arr.length - 1

  while left < right:
    sum = arr[left] + arr[right]
    if sum == target:
      return [left, right]
    else if sum < target:
      left++        // need bigger sum
    else:
      right--       // need smaller sum

  return NOT_FOUND`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    whenToUse: [
      'Array is sorted (or can be sorted)',
      'Finding pairs that satisfy a condition',
      'Comparing elements from both ends',
      'Palindrome checking',
      'Removing duplicates in-place',
    ],
    realWorldUseCases: [
      {
        company: 'Amazon',
        scenario: 'Package weight matching',
        description:
          'Finding two packages whose combined weight exactly fills a container — sorted by weight, two-pointer scan.',
      },
      {
        company: 'Google',
        scenario: 'Search result deduplication',
        description:
          'Merging sorted result lists from multiple indexes while removing duplicates using two pointers.',
      },
    ],
    problems: ['two-sum-sorted', 'valid-palindrome', 'container-with-most-water', '3sum', 'trapping-rain-water'],
    visualizerType: 'array',
    color: '#06b6d4',
  },
  {
    slug: 'sliding-window',
    name: 'Sliding Window',
    description:
      'Maintain a **window** (subarray) that slides across the array. Expand or shrink the window to find optimal subarrays that satisfy a condition. Avoids nested loops by reusing computation from the previous window position.',
    pseudocode: `function slidingWindow(arr, k):
  windowSum = sum of first k elements
  maxSum = windowSum

  for i from k to arr.length - 1:
    windowSum += arr[i]       // add right
    windowSum -= arr[i - k]   // remove left
    maxSum = max(maxSum, windowSum)

  return maxSum`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1) to O(k)',
    whenToUse: [
      'Finding max/min subarray of fixed size',
      'Longest/shortest substring with a condition',
      'Contiguous subarray problems',
      'Stream processing or rolling aggregates',
    ],
    realWorldUseCases: [
      {
        company: 'Netflix',
        scenario: 'Streaming bitrate optimization',
        description:
          'Calculating the rolling average of network throughput over a sliding time window to adjust video quality.',
      },
      {
        company: 'Amazon',
        scenario: 'Inventory tracking',
        description:
          'Finding the peak order period — the k-day window with the highest total orders.',
      },
    ],
    problems: ['best-time-to-buy-sell-stock', 'max-subarray-sum-k', 'longest-substring-without-repeating', 'longest-repeating-character-replacement', 'minimum-window-substring'],
    visualizerType: 'array',
    color: '#a855f7',
  },
  {
    slug: 'binary-search',
    name: 'Binary Search',
    description:
      'Repeatedly divide the search space in half. Compare the middle element with the target — if smaller, search the right half; if larger, search the left half. Requires **sorted** data.',
    pseudocode: `function binarySearch(arr, target):
  left = 0
  right = arr.length - 1

  while left <= right:
    mid = left + (right - left) / 2
    if arr[mid] == target:
      return mid
    else if arr[mid] < target:
      left = mid + 1
    else:
      right = mid - 1

  return NOT_FOUND`,
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    whenToUse: [
      'Searching in sorted arrays',
      'Finding boundaries (first/last occurrence)',
      'Optimization problems (minimize/maximize)',
      'Search space can be halved each step',
    ],
    realWorldUseCases: [
      {
        company: 'Google',
        scenario: 'Search indexing',
        description:
          'Binary search on sorted inverted index lists to quickly find documents containing a search term.',
      },
      {
        company: 'Amazon',
        scenario: 'Price range filtering',
        description:
          'Finding products within a price range using binary search on a sorted price index.',
      },
    ],
    problems: ['binary-search', 'search-in-rotated-sorted-array', 'find-minimum-rotated-sorted-array', 'koko-eating-bananas', 'find-peak-element'],
    visualizerType: 'array',
    color: '#f59e0b',
  },
];

/**
 * Get a single pattern by slug
 */
export async function getPattern(slug: PatternSlug): Promise<Pattern | null> {
  return PATTERNS.find((p) => p.slug === slug) ?? null;
}

/**
 * List all patterns
 */
export function listPatterns(): Pattern[] {
  return PATTERNS;
}
