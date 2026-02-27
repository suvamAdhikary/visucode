// ============================================
// Problem Service — Data access abstraction
// ============================================
// Phase 1: Reads from local JSON files
// Phase 2: Swap to GraphQL call — ZERO component changes needed

import type { Problem, Difficulty, PatternSlug, Category } from '@visucode/shared-types';

// Static import of problem index for listing
// This avoids dynamic fs reads and works with Next.js static analysis
const PROBLEM_INDEX: Array<{
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: Category;
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
  // More problems will be added here as content is created
];

/**
 * Get a single problem by slug
 * Phase 1: dynamic import from local JSON
 * Phase 2: GraphQL query — change only this function
 */
export async function getProblem(slug: string): Promise<Problem | null> {
  try {
    const data = await import(`../../../../content/problems/${slug}.json`);
    return data.default as Problem;
  } catch {
    console.error(`[ProblemService] Problem not found: ${slug}`);
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
