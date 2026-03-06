import Link from 'next/link';
import { listPatterns } from '../../lib/services/pattern.service';
import styles from './page.module.css';

export const metadata = {
  title: 'Patterns — Algorithm Patterns Library | VisuCode',
  description:
    'Master the most important algorithm patterns: Two Pointers, Sliding Window, Binary Search. With pseudocode, complexity analysis, and real-world use cases.',
};

export default function PatternsPage() {
  const patterns = listPatterns();

  return (
    <div className={styles.patternsPage}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>🧩 Pattern Library</h1>
        <p className={styles.subtitle}>
          Master the patterns that matter. Each pattern includes pseudocode,
          complexity analysis, recognition signals, and linked practice
          problems.
        </p>
      </header>

      {/* Pattern Grid */}
      <div className={styles.grid}>
        {patterns.map((pattern) => (
          <Link
            key={pattern.slug}
            href={`/patterns/${pattern.slug}`}
            className={styles.card}
            style={{ '--accent-color': pattern.color } as React.CSSProperties}
          >
            <div className={styles.cardHeader}>
              <h2 className={styles.patternName}>{pattern.name}</h2>
              <span className={styles.arrow}>→</span>
            </div>

            {/* Complexity Badges */}
            <div className={styles.badges}>
              <span className={`${styles.badge} ${styles.time}`}>
                ⏱ {pattern.timeComplexity}
              </span>
              <span className={`${styles.badge} ${styles.space}`}>
                💾 {pattern.spaceComplexity}
              </span>
              <span className={`${styles.badge} ${styles.problems}`}>
                {pattern.problems.length} problems
              </span>
            </div>

            {/* Description */}
            <p className={styles.description}>
              {pattern.description.replace(/\*\*/g, '')}
            </p>

            {/* When to Use Tags */}
            <div className={styles.whenToUse}>
              {pattern.whenToUse.slice(0, 3).map((use) => (
                <span key={use} className={styles.useTag}>
                  {use}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
