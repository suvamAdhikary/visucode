import Link from 'next/link';
import { listProblems } from '../../lib/services';
import type { Difficulty, PatternSlug, Category } from '@visucode/shared-types';
import styles from './page.module.css';

interface ProblemsPageProps {
  searchParams: Promise<{
    pattern?: PatternSlug;
    difficulty?: Difficulty;
    category?: Category;
    company?: string;
  }>;
}

export const metadata = {
  title: 'Problems — Practice DSA',
  description:
    'Browse curated DSA problems with visual dry runs, company tags, and external platform links. Filter by pattern, difficulty, and category.',
};

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const params = await searchParams;
  const problems = listProblems({
    pattern: params.pattern,
    difficulty: params.difficulty,
    category: params.category,
    company: params.company,
  });

  const allProblems = listProblems();

  // Get unique values for filter pills
  const patterns = [...new Set(allProblems.flatMap((p) => p.patterns))];
  const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];
  const categories = [...new Set(allProblems.map((p) => p.category))];

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className={styles.header}>
        <h1>💡 Problems</h1>
        <p>
          {problems.length} problem{problems.length !== 1 ? 's' : ''}{' '}
          {params.pattern || params.difficulty || params.category
            ? '(filtered)'
            : ''}
        </p>
      </div>

      {/* Filters — URL-based for SEO and shareable links */}
      <div className={styles.filters}>
        {/* Difficulty */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Difficulty</span>
          <div className={styles.filterPills}>
            <Link
              href="/problems"
              className={`${styles.pill} ${!params.difficulty ? styles.pillActive : ''}`}
            >
              All
            </Link>
            {difficulties.map((d) => (
              <Link
                key={d}
                href={`/problems?${new URLSearchParams({
                  ...params,
                  difficulty: d,
                }).toString()}`}
                className={`${styles.pill} ${
                  params.difficulty === d ? styles.pillActive : ''
                } ${styles[`pill${d}`]}`}
              >
                {d}
              </Link>
            ))}
          </div>
        </div>

        {/* Pattern */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Pattern</span>
          <div className={styles.filterPills}>
            <Link
              href={`/problems?${new URLSearchParams(
                Object.fromEntries(
                  Object.entries(params).filter(([k]) => k !== 'pattern')
                )
              ).toString()}`}
              className={`${styles.pill} ${!params.pattern ? styles.pillActive : ''}`}
            >
              All
            </Link>
            {patterns.map((p) => (
              <Link
                key={p}
                href={`/problems?${new URLSearchParams({
                  ...params,
                  pattern: p,
                }).toString()}`}
                className={`${styles.pill} ${
                  params.pattern === p ? styles.pillActive : ''
                }`}
              >
                {p.replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Category</span>
          <div className={styles.filterPills}>
            <Link
              href={`/problems?${new URLSearchParams(
                Object.fromEntries(
                  Object.entries(params).filter(([k]) => k !== 'category')
                )
              ).toString()}`}
              className={`${styles.pill} ${!params.category ? styles.pillActive : ''}`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/problems?${new URLSearchParams({
                  ...params,
                  category: c,
                }).toString()}`}
                className={`${styles.pill} ${
                  params.category === c ? styles.pillActive : ''
                }`}
              >
                {c.replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Problem List */}
      <div className={styles.problemList}>
        {problems.map((problem) => (
          <Link
            key={problem.slug}
            href={`/problems/${problem.slug}`}
            className={`${styles.problemCard} card`}
            id={`problem-${problem.slug}`}
          >
            <div className={styles.problemInfo}>
              <h3>{problem.title}</h3>
              <div className={styles.problemTags}>
                <span
                  className={`badge badge-${problem.difficulty.toLowerCase()}`}
                >
                  {problem.difficulty}
                </span>
                {problem.patterns.map((p) => (
                  <span key={p} className="badge badge-pattern">
                    {p.replace(/-/g, ' ')}
                  </span>
                ))}
                <span className={styles.categoryTag}>
                  {problem.category.replace(/-/g, ' ')}
                </span>
              </div>
            </div>
            <div className={styles.problemCompanies}>
              {problem.companies.slice(0, 3).map((c) => (
                <span key={c} className={styles.companyBadge}>
                  {c}
                </span>
              ))}
            </div>
            <span className={styles.problemArrow} aria-hidden="true">
              →
            </span>
          </Link>
        ))}

        {problems.length === 0 && (
          <div className={styles.emptyState}>
            <span style={{ fontSize: '2rem' }}>🔍</span>
            <p>No problems match your filters.</p>
            <Link href="/problems" className="btn btn-secondary">
              Clear Filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
