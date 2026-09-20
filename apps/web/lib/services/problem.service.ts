// ============================================
// Problem Service — Data access abstraction
// ============================================
// Phase 1: Reads from local JSON files
// Phase 2: Swap to GraphQL call — ZERO component changes needed

import { readFile } from 'fs/promises';
import path from 'path';
import type { Problem, Difficulty, PatternSlug, Category } from '@visucode/shared-types';

// Static import of problem index for listing
// This avoids dynamic fs reads and works with Next.js static analysis
const PROBLEM_INDEX: Array<{
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: Category;
  // A problem can belong to multiple patterns. Keep this array in sync with
  // the JSON `patterns` field so catalog filters and pattern pages agree.
  patterns: PatternSlug[];
  companies: string[];
  accessLevel: 'free' | 'premium';
}> = [
  {
    slug: 'two-sum-sorted',
    title: 'Two Sum II - Input Array Is Sorted',
    difficulty: 'Easy',
    category: 'array',
    patterns: ['two-pointers'],
    companies: ['Amazon', 'Google', 'Apple'],
    accessLevel: 'free',
  },
  {
    slug: 'valid-palindrome',
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    category: 'string',
    patterns: ['two-pointers'],
    companies: ['Meta', 'Microsoft', 'Apple'],
    accessLevel: 'free',
  },
  {
    slug: 'container-with-most-water',
    title: 'Container With Most Water',
    difficulty: 'Medium',
    category: 'array',
    patterns: ['two-pointers'],
    companies: ['Amazon', 'Google', 'Goldman Sachs', 'Bloomberg'],
    accessLevel: 'free',
  },
  {
    slug: 'best-time-to-buy-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    category: 'array',
    patterns: ['sliding-window'],
    companies: ['Amazon', 'Meta', 'Google', 'Goldman Sachs'],
    accessLevel: 'free',
  },
  {
    slug: 'max-subarray-sum-k',
    title: 'Maximum Sum Subarray of Size K',
    difficulty: 'Easy',
    category: 'array',
    patterns: ['sliding-window'],
    companies: ['Amazon', 'Microsoft', 'Apple'],
    accessLevel: 'free',
  },
  {
    slug: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Easy',
    category: 'array',
    patterns: ['binary-search'],
    companies: ['Google', 'Amazon', 'Microsoft', 'Apple'],
    accessLevel: 'free',
  },
  {
    slug: '3sum',
    title: '3Sum',
    difficulty: 'Medium',
    category: 'array',
    patterns: ['two-pointers'],
    companies: ['Amazon', 'Meta', 'Google', 'Bloomberg'],
    accessLevel: 'free',
  },
  {
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    category: 'array',
    patterns: ['two-pointers'],
    companies: ['Amazon', 'Google', 'Goldman Sachs', 'Microsoft'],
    accessLevel: 'free',
  },
  {
    slug: 'longest-substring-without-repeating',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'string',
    patterns: ['sliding-window'],
    companies: ['Amazon', 'Meta', 'Google', 'Bloomberg'],
    accessLevel: 'free',
  },
  {
    slug: 'minimum-window-substring',
    title: 'Minimum Window Substring',
    difficulty: 'Hard',
    category: 'string',
    patterns: ['sliding-window'],
    companies: ['Meta', 'Amazon', 'Google', 'Airbnb'],
    accessLevel: 'free',
  },
  {
    slug: 'longest-repeating-character-replacement',
    title: 'Longest Repeating Character Replacement',
    difficulty: 'Medium',
    category: 'string',
    patterns: ['sliding-window'],
    companies: ['Google', 'Amazon', 'Microsoft'],
    accessLevel: 'free',
  },
  {
    slug: 'search-in-rotated-sorted-array',
    title: 'Search in Rotated Sorted Array',
    difficulty: 'Medium',
    category: 'array',
    patterns: ['binary-search'],
    companies: ['Meta', 'Amazon', 'Google', 'Microsoft'],
    accessLevel: 'free',
  },
  {
    slug: 'find-minimum-rotated-sorted-array',
    title: 'Find Minimum in Rotated Sorted Array',
    difficulty: 'Medium',
    category: 'array',
    patterns: ['binary-search'],
    companies: ['Amazon', 'Microsoft', 'Meta'],
    accessLevel: 'free',
  },
  {
    slug: 'koko-eating-bananas',
    title: 'Koko Eating Bananas',
    difficulty: 'Medium',
    category: 'array',
    patterns: ['binary-search'],
    companies: ['Google', 'Amazon', 'Meta'],
    accessLevel: 'free',
  },
  {
    slug: 'find-peak-element',
    title: 'Find Peak Element',
    difficulty: 'Medium',
    category: 'array',
    patterns: ['binary-search'],
    companies: ['Google', 'Meta', 'Microsoft'],
    accessLevel: 'free',
  },
  {
    slug: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    category: 'linked-list',
    patterns: ['two-pointers'],
    companies: ['Amazon', 'Microsoft', 'Apple'],
    accessLevel: 'free',
  },
  {
    slug: 'linked-list-cycle',
    title: 'Linked List Cycle',
    difficulty: 'Easy',
    category: 'linked-list',
    patterns: ['two-pointers'],
    companies: ['Amazon', 'Microsoft'],
    accessLevel: 'free',
  },
  {
    slug: 'merge-two-sorted-lists',
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    category: 'linked-list',
    patterns: ['two-pointers'],
    companies: ['Amazon', 'Microsoft'],
    accessLevel: 'free',
  },
  {
    slug: 'maximum-depth-of-binary-tree',
    title: 'Maximum Depth of Binary Tree',
    difficulty: 'Easy',
    category: 'tree',
    patterns: ['dfs'],
    companies: ['Amazon', 'Microsoft'],
    accessLevel: 'free',
  },
  {
    slug: 'invert-binary-tree',
    title: 'Invert Binary Tree',
    difficulty: 'Easy',
    category: 'tree',
    patterns: ['dfs'],
    companies: ['Google', 'Mac'],
    accessLevel: 'free',
  },
  {
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'hash-map',
    patterns: ['two-pointers'],
    companies: ['Amazon', 'Google', 'Meta'],
    accessLevel: 'free',
  },
  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'stack',
    patterns: ['stack'],
    companies: ['Meta', 'Amazon'],
    accessLevel: 'free',
  },
  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    category: 'array',
    patterns: ['greedy'],
    companies: ['Google', 'Amazon'],
    accessLevel: 'free',
  },
  // More problems will be added here as content is created
];

/**
 * Get a single problem by slug
 * Phase 1: dynamic import from local JSON
 * Phase 2: GraphQL query — change only this function
 */
export async function getProblem(slug: string): Promise<Problem | null> {
  try {
    // Try both possible cwd locations (Nx may run from monorepo root or apps/web)
    const possiblePaths = [
      path.join(process.cwd(), 'apps', 'web', 'content', 'problems', `${slug}.json`),
      path.join(process.cwd(), 'content', 'problems', `${slug}.json`),
    ];

    for (const filePath of possiblePaths) {
      try {
        const raw = await readFile(filePath, 'utf-8');
        return JSON.parse(raw) as Problem;
      } catch {
        continue;
      }
    }
    console.error(`[ProblemService] Problem not found: ${slug}`);
    return null;
  } catch {
    console.error(`[ProblemService] Error loading problem: ${slug}`);
    return null;
  }
}

/**
 * List all problems with optional filters
 * Filters use URL searchParams format: ?pattern=two-pointers&difficulty=easy
 */
export function listProblems(filters?: {
  pattern?: PatternSlug;
  category?: Category;
  difficulty?: Difficulty;
  company?: string;
}): typeof PROBLEM_INDEX {
  let results = [...PROBLEM_INDEX];

  if (filters?.pattern) {
    results = results.filter((p) => p.patterns.includes(filters.pattern!));
  }
  if (filters?.category) {
    results = results.filter((p) => p.category === filters.category);
  }
  if (filters?.difficulty) {
    results = results.filter((p) => p.difficulty === filters.difficulty);
  }
  if (filters?.company) {
    results = results.filter((p) =>
      p.companies.some(
        (c) => c.toLowerCase() === filters.company!.toLowerCase()
      )
    );
  }

  return results;
}

/**
 * Get all unique companies across all problems
 */
export function getCompanies(): string[] {
  const companies = new Set<string>();
  for (const p of PROBLEM_INDEX) {
    for (const c of p.companies) {
      companies.add(c);
    }
  }
  return Array.from(companies).sort();
}

/**
 * Get problems grouped by pattern
 */
export function getProblemsByPattern(): Record<string, typeof PROBLEM_INDEX> {
  const grouped: Record<string, typeof PROBLEM_INDEX> = {};
  for (const p of PROBLEM_INDEX) {
    for (const pattern of p.patterns) {
      if (!grouped[pattern]) grouped[pattern] = [];
      grouped[pattern].push(p);
    }
  }
  return grouped;
}

/**
 * Get basic problem info for a list of slugs (used by pattern detail pages)
 * Returns exists:false for slugs not yet in the index (shown as "Coming Soon")
 */
export function getProblemSummaries(
  slugs: string[]
): Array<{ slug: string; title: string; difficulty: Difficulty; exists: boolean }> {
  return slugs.map((slug) => {
    const found = PROBLEM_INDEX.find((p) => p.slug === slug);
    if (found) {
      return { slug: found.slug, title: found.title, difficulty: found.difficulty, exists: true };
    }
    // Format slug as readable title for coming-soon problems
    const title = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { slug, title, difficulty: 'Medium' as Difficulty, exists: false };
  });
}

/**
 * Problems for a pattern page. Source of truth is PROBLEM_INDEX.patterns[]
 * (a problem with several patterns appears on every matching page). Extra
 * slugs from pattern.service stay as "Coming Soon" until they are indexed.
 */
export function getProblemSummariesForPattern(
  patternSlug: PatternSlug,
  extraSlugs: string[] = []
): Array<{ slug: string; title: string; difficulty: Difficulty; exists: boolean }> {
  const fromIndex = PROBLEM_INDEX.filter((p) =>
    p.patterns.includes(patternSlug)
  ).map((p) => p.slug);
  const seen = new Set(fromIndex);
  const extras = extraSlugs.filter((s) => !seen.has(s));
  return getProblemSummaries([...fromIndex, ...extras]);
}
